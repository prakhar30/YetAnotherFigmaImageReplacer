// Message types for communication between UI and plugin code

export interface ImageFileData {
  filename: string;           // Original filename with extension (e.g., "XYZ 1.png")
  normalizedName: string;     // Normalized for matching (e.g., "xyz 1")
  bytes: number[];            // Raw image bytes as array (Uint8Array not transferable via postMessage)
  size: number;               // File size in bytes
  thumbnail?: string;         // Base64 data URL for preview (UI only, not sent to plugin)
}

export interface LayerInfo {
  id: string;                 // Figma node ID
  name: string;               // Layer name
  normalizedName: string;     // Normalized for matching
  type: string;               // Node type (RECTANGLE, FRAME, etc.)
  hasImageFill: boolean;      // Whether layer currently has an image fill
  parentPath: string;         // Path to parent for display (e.g., "Page 1 > Frame > Group")
}

export interface MatchResult {
  layerId: string;
  layerName: string;
  filename: string;
  status: 'pending' | 'matched' | 'replaced' | 'error';
  error?: string;
}

export interface MatchPreview {
  matches: MatchResult[];
  unmatchedFiles: string[];
  unmatchedLayers: LayerInfo[];
  totalLayers: number;
  totalFiles: number;
}

// Mapping of layerId to filename for custom assignments
export interface LayerFileAssignment {
  layerId: string;
  layerName: string;
  filename: string;  // Empty string means unassigned
}

// Messages from UI to Plugin
export type UIToPluginMessage =
  | { type: 'get-layers'; scope: 'selection' | 'page' | 'document' }
  | { type: 'preview-matches'; files: ImageFileData[] }
  | { type: 'execute-replacement'; files: ImageFileData[]; assignments: LayerFileAssignment[] }
  | { type: 'cancel' };

// Messages from Plugin to UI
export type PluginToUIMessage =
  | { type: 'layers-found'; layers: LayerInfo[] }
  | { type: 'match-preview'; preview: MatchPreview }
  | { type: 'replacement-progress'; completed: number; total: number; current: string }
  | { type: 'replacement-complete'; results: MatchResult[] }
  | { type: 'error'; message: string };
