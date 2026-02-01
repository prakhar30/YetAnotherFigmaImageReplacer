# Bulk Image Replacer - Figma Plugin

A Figma plugin that bulk replaces images by matching layer names to filenames. Perfect for updating multiple images at once when you have a folder of images named to match your Figma layers.

## Use Case

You have a folder with images named in a sequence:
```
XYZ 1.png
XYZ 2.png
XYZ 3.png
XYZ 4.png
XYZ 5.png
```

And Figma layers with matching names:
```
XYZ 1
XYZ 2
XYZ 3
XYZ 4
XYZ 5
```

This plugin automatically matches and replaces all images in one go.

## Installation

### For Development

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. In Figma Desktop, go to **Plugins > Development > Import plugin from manifest**
5. Select the `manifest.json` file from this project

### For Production

Build the plugin and the `dist/` folder contains everything needed:
- `dist/code.js` - Plugin logic
- `dist/index.html` - UI (all assets inlined)

## Usage

1. Open your Figma file
2. Optionally select the layers you want to update
3. Run the plugin: **Plugins > Development > Bulk Image Replacer**
4. Choose the search scope:
   - **Selected layers only** - Only replaces within your selection
   - **Current page** - Searches all layers on the current page
   - **Entire document** - Searches all pages (slower for large documents)
5. Click the drop zone to select a folder containing your images
6. Review the preview showing which layers will be matched
7. Click **Replace X images** to apply changes

## Matching Logic

The plugin uses smart matching to pair filenames with layer names:

| File | Layer | Match? |
|------|-------|--------|
| `XYZ 1.png` | `XYZ 1` | Yes |
| `xyz 1.PNG` | `XYZ 1` | Yes (case insensitive) |
| `XYZ  1.png` | `XYZ 1` | Yes (whitespace normalized) |
| `XYZ 1.jpg` | `XYZ 1` | Yes (extension ignored) |
| `XYZ 1.png` | `XYZ 1.png` | Yes (extension in layer name OK) |

### Normalization Rules

1. File extensions are removed (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.tif`, `.tiff`)
2. Converted to lowercase
3. Multiple spaces/tabs collapsed to single space
4. Leading/trailing whitespace trimmed

## Supported Image Formats

- PNG
- JPG / JPEG
- GIF
- WebP

## Development

### Project Structure

```
FigmaPluginReplace/
├── manifest.json           # Figma plugin configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # Base TypeScript config
├── vite.config.ts          # Vite bundler for UI
├── plugin-src/             # Plugin code (runs in Figma sandbox)
│   ├── code.ts             # Main plugin entry point
│   ├── types.ts            # Shared TypeScript types
│   ├── tsconfig.json       # Plugin-specific TS config
│   └── utils/
│       ├── matching.ts     # Name matching algorithms
│       └── layer-traversal.ts  # Layer finding utilities
├── ui-src/                 # UI code (runs in iframe)
│   ├── index.html          # HTML entry point
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Main React component
│   ├── App.css             # Styles
│   ├── tsconfig.json       # UI-specific TS config
│   ├── vite-env.d.ts       # Vite type declarations
│   └── components/
│       ├── FolderSelector.tsx  # Folder input component
│       ├── PreviewTable.tsx    # Match preview display
│       ├── ProgressBar.tsx     # Replacement progress
│       └── ErrorList.tsx       # Error display
└── dist/                   # Build output
    ├── code.js             # Bundled plugin code
    └── index.html          # Bundled UI (single file)
```

### Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Watch mode - rebuilds on file changes |
| `npm run build` | Production build (minified) |
| `npm run tsc` | Type check without building |

### Architecture

Figma plugins have a unique sandboxed architecture:

- **Plugin Code** (`plugin-src/code.ts`) - Runs in Figma's sandbox with full Figma API access but NO browser APIs
- **UI Code** (`ui-src/`) - Runs in an iframe with full browser APIs but NO Figma API access
- Communication happens via `postMessage()` between the two environments

This is why file selection must happen in the UI (browser APIs available) while image replacement happens in the plugin code (Figma API available).

## Technical Notes

- Uses `webkitdirectory` attribute for folder selection
- Images are converted to `Uint8Array` and sent via `postMessage` (as regular arrays since typed arrays aren't directly transferable)
- Replaces the first image fill found on each layer, preserving other fill properties
- Uses `figma.skipInvisibleInstanceChildren = true` for performance optimization

## License

MIT
