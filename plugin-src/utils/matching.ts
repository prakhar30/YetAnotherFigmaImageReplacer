/**
 * Normalizes a name for matching purposes.
 * Handles: case insensitivity, file extensions, extra whitespace
 */
export function normalizeName(name: string): string {
  return name
    // Remove file extension if present
    .replace(/\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff?)$/i, '')
    // Convert to lowercase
    .toLowerCase()
    // Normalize whitespace (multiple spaces, tabs -> single space)
    .replace(/\s+/g, ' ')
    // Trim leading/trailing whitespace
    .trim();
}

/**
 * Alternative normalization that also handles common separators
 * Use this for fuzzy matching option
 */
export function normalizeNameFuzzy(name: string): string {
  return normalizeName(name)
    // Replace common separators with space
    .replace(/[-_]/g, ' ')
    // Remove special characters except spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Performs exact matching (after normalization)
 */
export function findExactMatch(
  filename: string,
  layers: Array<{ id: string; normalizedName: string }>
): string | null {
  const normalizedFilename = normalizeName(filename);

  for (const layer of layers) {
    if (layer.normalizedName === normalizedFilename) {
      return layer.id;
    }
  }
  return null;
}

/**
 * Performs fuzzy matching with configurable options
 */
export interface FuzzyMatchOptions {
  ignoreSeparators: boolean;  // Treat - _ and space as equivalent
  prefixMatch: boolean;       // Match if layer name starts with filename
}

export function findFuzzyMatch(
  filename: string,
  layers: Array<{ id: string; name: string; normalizedName: string }>,
  options: FuzzyMatchOptions
): string | null {
  const fuzzyFilename = options.ignoreSeparators
    ? normalizeNameFuzzy(filename)
    : normalizeName(filename);

  for (const layer of layers) {
    const fuzzyLayerName = options.ignoreSeparators
      ? normalizeNameFuzzy(layer.name)
      : layer.normalizedName;

    if (fuzzyLayerName === fuzzyFilename) {
      return layer.id;
    }

    if (options.prefixMatch && fuzzyLayerName.startsWith(fuzzyFilename)) {
      return layer.id;
    }
  }
  return null;
}
