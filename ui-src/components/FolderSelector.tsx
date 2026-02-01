import React, { useRef, useState } from 'react';
import type { ImageFileData } from '../../plugin-src/types';

interface Props {
  onFilesSelected: (files: ImageFileData[]) => void;
}

// Normalize name by removing extension and lowercasing
function normalizeName(filename: string): string {
  return filename
    .replace(/\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff?)$/i, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export default function FolderSelector({ onFilesSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);

    try {
      const imageFiles: ImageFileData[] = [];
      const validExtensions = /\.(png|jpg|jpeg|gif|webp)$/i;

      for (const file of Array.from(fileList)) {
        // Filter to only image files
        if (!validExtensions.test(file.name)) continue;

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        imageFiles.push({
          filename: file.name,
          normalizedName: normalizeName(file.name),
          bytes: Array.from(bytes), // Convert to regular array for postMessage
          size: file.size
        });
      }

      setSelectedCount(imageFiles.length);
      onFilesSelected(imageFiles);
    } catch (error) {
      console.error('Error reading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="folder-selector">
      <div className="drop-zone" onClick={() => inputRef.current?.click()}>
        {isLoading ? (
          <div className="loading">
            <span className="spinner" />
            <span>Reading files...</span>
          </div>
        ) : selectedCount > 0 ? (
          <div className="selected">
            <span className="icon">📁</span>
            <span>{selectedCount} image{selectedCount !== 1 ? 's' : ''} selected</span>
            <span className="change">Click to change</span>
          </div>
        ) : (
          <div className="empty">
            <span className="icon">📂</span>
            <p>Click to select a folder</p>
            <p className="hint">
              Images will be matched to layers by filename
              <br />
              (e.g., "XYZ 1.png" matches layer "XYZ 1")
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        webkitdirectory=""
        multiple
        onChange={handleFolderSelect}
        style={{ display: 'none' }}
      />

      <p className="supported-formats">
        Supported formats: PNG, JPG, GIF, WebP
      </p>
    </div>
  );
}
