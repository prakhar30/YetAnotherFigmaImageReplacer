import React from 'react';
import type { MatchPreview, LayerFileAssignment, ImageFileData } from '../../plugin-src/types';

interface Props {
  preview: MatchPreview;
  files: ImageFileData[];
  assignments: LayerFileAssignment[];
  onAssignmentChange: (layerId: string, filename: string) => void;
}

export default function PreviewTable({ preview, files, assignments, onAssignmentChange }: Props) {
  // Create a map for quick thumbnail lookup
  const thumbnailMap = new Map<string, string>();
  files.forEach(f => {
    if (f.thumbnail) {
      thumbnailMap.set(f.filename, f.thumbnail);
    }
  });

  // Get the current filename for a layer
  const getAssignedFile = (layerId: string): string => {
    const assignment = assignments.find(a => a.layerId === layerId);
    return assignment?.filename || '';
  };

  // Get thumbnail for a filename
  const getThumbnail = (filename: string): string | undefined => {
    return thumbnailMap.get(filename);
  };

  // Get files that are already assigned (for showing which are taken)
  const assignedFiles = new Set(assignments.map(a => a.filename).filter(f => f));

  return (
    <div className="preview-table">
      <div className="summary">
        <div className="stat matched">
          <span className="number">{assignments.filter(a => a.filename).length}</span>
          <span className="label">Assignments</span>
        </div>
        <div className="stat unmatched">
          <span className="number">{files.length - assignedFiles.size}</span>
          <span className="label">Unassigned files</span>
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="matches-section">
          <h3>Layer Assignments:</h3>
          <div className="assignment-list">
            {assignments.map((assignment) => {
              const currentFile = getAssignedFile(assignment.layerId);
              const thumbnail = currentFile ? getThumbnail(currentFile) : undefined;

              return (
                <div key={assignment.layerId} className="assignment-row">
                  <div className="layer-info">
                    <span className="layer-name">{assignment.layerName}</span>
                  </div>
                  <div className="assignment-arrow">→</div>
                  <div className="file-selector">
                    {thumbnail && (
                      <div className="thumbnail">
                        <img src={thumbnail} alt={currentFile} />
                      </div>
                    )}
                    {!thumbnail && currentFile === '' && (
                      <div className="thumbnail empty">
                        <span>?</span>
                      </div>
                    )}
                    <select
                      className="file-select"
                      value={currentFile}
                      onChange={(e) => onAssignmentChange(assignment.layerId, e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      {files.map((file) => (
                        <option
                          key={file.filename}
                          value={file.filename}
                        >
                          {file.filename}
                          {assignedFiles.has(file.filename) && currentFile !== file.filename ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {preview.unmatchedLayers.length > 0 && (
        <details className="unmatched-layers">
          <summary>
            {preview.unmatchedLayers.length} other layer{preview.unmatchedLayers.length !== 1 ? 's' : ''} with images
          </summary>
          <ul>
            {preview.unmatchedLayers.slice(0, 10).map((layer) => (
              <li key={layer.id}>
                <span className="layer-name">{layer.name}</span>
                <span className="layer-path">{layer.parentPath}</span>
              </li>
            ))}
            {preview.unmatchedLayers.length > 10 && (
              <li className="more">
                ...and {preview.unmatchedLayers.length - 10} more
              </li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}
