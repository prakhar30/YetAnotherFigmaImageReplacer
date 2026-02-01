import type { LayerInfo } from '../types';
import { normalizeName } from './matching';

type FillableNode = SceneNode & { fills: readonly Paint[] | typeof figma.mixed };

/**
 * Checks if a node can have image fills
 */
function canHaveImageFill(node: SceneNode): node is FillableNode {
  return 'fills' in node;
}

/**
 * Checks if a node currently has an image fill
 */
function hasImageFill(node: FillableNode): boolean {
  if (node.fills === figma.mixed) return false;
  return (node.fills as readonly Paint[]).some(fill => fill.type === 'IMAGE');
}

/**
 * Gets the parent path for display purposes
 */
function getParentPath(node: SceneNode): string {
  const parts: string[] = [];
  let current: BaseNode | null = node.parent;

  while (current && current.type !== 'DOCUMENT') {
    if ('name' in current) {
      parts.unshift(current.name);
    }
    current = current.parent;
  }

  return parts.join(' > ');
}

/**
 * Converts a Figma node to LayerInfo
 */
function nodeToLayerInfo(node: SceneNode): LayerInfo | null {
  if (!canHaveImageFill(node)) {
    return null;
  }

  return {
    id: node.id,
    name: node.name,
    normalizedName: normalizeName(node.name),
    type: node.type,
    hasImageFill: hasImageFill(node),
    parentPath: getParentPath(node),
  };
}

/**
 * Recursively collects layers from a node and its children
 */
function collectLayers(node: SceneNode, layers: LayerInfo[]): void {
  const info = nodeToLayerInfo(node);
  if (info) {
    layers.push(info);
  }

  if ('children' in node) {
    for (const child of node.children) {
      collectLayers(child, layers);
    }
  }
}

/**
 * Gets all layers that can have image fills from selection
 */
export function getLayersFromSelection(): LayerInfo[] {
  const layers: LayerInfo[] = [];

  for (const node of figma.currentPage.selection) {
    collectLayers(node, layers);
  }

  return layers;
}

/**
 * Gets all layers from current page that can have image fills
 */
export function getLayersFromPage(): LayerInfo[] {
  // Enable optimization for hidden instance children
  figma.skipInvisibleInstanceChildren = true;

  const layers: LayerInfo[] = [];

  for (const node of figma.currentPage.children) {
    collectLayers(node, layers);
  }

  return layers;
}

/**
 * Gets all layers from entire document
 * Warning: Can be slow for large documents
 */
export async function getLayersFromDocument(): Promise<LayerInfo[]> {
  figma.skipInvisibleInstanceChildren = true;

  const layers: LayerInfo[] = [];

  for (const page of figma.root.children) {
    // Load page before accessing children
    await page.loadAsync();

    for (const node of page.children) {
      collectLayers(node, layers);
    }
  }

  return layers;
}
