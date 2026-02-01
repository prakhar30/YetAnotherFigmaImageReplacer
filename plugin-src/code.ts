import type {
  UIToPluginMessage,
  PluginToUIMessage,
  ImageFileData,
  LayerInfo,
  MatchResult,
  MatchPreview,
  LayerFileAssignment
} from './types';
import { normalizeName, findExactMatch } from './utils/matching';
import {
  getLayersFromSelection,
  getLayersFromPage,
  getLayersFromDocument
} from './utils/layer-traversal';

// Store layers between preview and execution
let cachedLayers: LayerInfo[] = [];

// Show the UI
figma.showUI(__html__, {
  width: 480,
  height: 600,
  themeColors: true
});

/**
 * Sends a message to the UI
 */
function sendToUI(message: PluginToUIMessage): void {
  figma.ui.postMessage(message);
}

/**
 * Finds layers based on scope
 */
async function findLayers(scope: 'selection' | 'page' | 'document'): Promise<LayerInfo[]> {
  switch (scope) {
    case 'selection':
      return getLayersFromSelection();
    case 'page':
      return getLayersFromPage();
    case 'document':
      return await getLayersFromDocument();
  }
}

/**
 * Creates a match preview showing what will be replaced
 */
function createMatchPreview(files: ImageFileData[], layers: LayerInfo[]): MatchPreview {
  const matches: MatchResult[] = [];
  const matchedLayerIds = new Set<string>();
  const matchedFilenames = new Set<string>();

  // Prepare layers for matching
  const layerLookup = layers.map(l => ({
    id: l.id,
    name: l.name,
    normalizedName: l.normalizedName
  }));

  // Find matches for each file
  for (const file of files) {
    const matchedLayerId = findExactMatch(file.filename, layerLookup);

    if (matchedLayerId) {
      const layer = layers.find(l => l.id === matchedLayerId)!;
      matches.push({
        layerId: matchedLayerId,
        layerName: layer.name,
        filename: file.filename,
        status: 'matched'
      });
      matchedLayerIds.add(matchedLayerId);
      matchedFilenames.add(file.filename);
    }
  }

  // Find unmatched files
  const unmatchedFiles = files
    .filter(f => !matchedFilenames.has(f.filename))
    .map(f => f.filename);

  // Find unmatched layers (only those with existing image fills - more relevant)
  const unmatchedLayers = layers.filter(
    l => !matchedLayerIds.has(l.id) && l.hasImageFill
  );

  return {
    matches,
    unmatchedFiles,
    unmatchedLayers,
    totalLayers: layers.length,
    totalFiles: files.length
  };
}

/**
 * Replaces image fills on matched layers using explicit assignments
 */
async function executeReplacement(
  files: ImageFileData[],
  assignments: LayerFileAssignment[]
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];
  const total = assignments.length;
  let completed = 0;

  // Create a map of filename to file data
  const fileMap = new Map<string, ImageFileData>();
  for (const file of files) {
    fileMap.set(file.filename, file);
  }

  for (const assignment of assignments) {
    const node = await figma.getNodeByIdAsync(assignment.layerId) as SceneNode & { fills: Paint[] };

    if (!node) {
      results.push({
        layerId: assignment.layerId,
        layerName: assignment.layerName,
        filename: assignment.filename,
        status: 'error',
        error: 'Layer no longer exists'
      });
      continue;
    }

    const file = fileMap.get(assignment.filename);

    if (!file) {
      results.push({
        layerId: assignment.layerId,
        layerName: node.name,
        filename: assignment.filename,
        status: 'error',
        error: 'File not found'
      });
      continue;
    }

    try {
      // Convert bytes array back to Uint8Array
      const bytes = new Uint8Array(file.bytes);

      // Create the image from bytes
      const image = figma.createImage(bytes);

      // Get existing fills
      const existingFills = node.fills as Paint[];

      // Replace or add image fill
      const newFills: Paint[] = [];
      let replacedExisting = false;

      for (const fill of existingFills) {
        if (fill.type === 'IMAGE' && !replacedExisting) {
          // Replace first image fill, keep other properties
          const updatedFill = Object.assign({}, fill, { imageHash: image.hash });
          newFills.push(updatedFill);
          replacedExisting = true;
        } else {
          newFills.push(fill);
        }
      }

      // If no image fill existed, add one
      if (!replacedExisting) {
        newFills.push({
          type: 'IMAGE',
          imageHash: image.hash,
          scaleMode: 'FILL',
          visible: true,
          opacity: 1,
          blendMode: 'NORMAL',
          imageTransform: [[1, 0, 0], [0, 1, 0]],
          scalingFactor: 0.5
        } as ImagePaint);
      }

      // Apply new fills
      node.fills = newFills;

      results.push({
        layerId: assignment.layerId,
        layerName: node.name,
        filename: file.filename,
        status: 'replaced'
      });

      completed++;
      sendToUI({
        type: 'replacement-progress',
        completed,
        total,
        current: node.name
      });

    } catch (error) {
      results.push({
        layerId: assignment.layerId,
        layerName: node.name,
        filename: assignment.filename,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

// Handle messages from UI
figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  try {
    switch (msg.type) {
      case 'get-layers': {
        cachedLayers = await findLayers(msg.scope);
        sendToUI({ type: 'layers-found', layers: cachedLayers });
        break;
      }

      case 'preview-matches': {
        if (cachedLayers.length === 0) {
          cachedLayers = getLayersFromSelection();
        }
        const preview = createMatchPreview(msg.files, cachedLayers);
        sendToUI({ type: 'match-preview', preview });
        break;
      }

      case 'execute-replacement': {
        const results = await executeReplacement(msg.files, msg.assignments);
        sendToUI({ type: 'replacement-complete', results });
        figma.notify(`Replaced ${results.filter(r => r.status === 'replaced').length} images`);
        break;
      }

      case 'cancel': {
        figma.closePlugin();
        break;
      }
    }
  } catch (error) {
    sendToUI({
      type: 'error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
};
