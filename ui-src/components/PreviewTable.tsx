import React from 'react';
import type { MatchPreview } from '../../plugin-src/types';

interface Props {
  preview: MatchPreview;
}

export default function PreviewTable({ preview }: Props) {
  return (
    <div className="preview-table">
      <div className="summary">
        <div className="stat matched">
          <span className="number">{preview.matches.length}</span>
          <span className="label">Matches found</span>
        </div>
        <div className="stat unmatched">
          <span className="number">{preview.unmatchedFiles.length}</span>
          <span className="label">Unmatched files</span>
        </div>
      </div>

      {preview.matches.length > 0 && (
        <div className="matches-section">
          <h3>Will be replaced:</h3>
          <table>
            <thead>
              <tr>
                <th>Layer Name</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {preview.matches.map((match) => (
                <tr key={match.layerId}>
                  <td className="layer-name">{match.layerName}</td>
                  <td className="filename">{match.filename}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview.unmatchedFiles.length > 0 && (
        <div className="unmatched-section">
          <h3>No matching layer found for:</h3>
          <ul className="unmatched-list">
            {preview.unmatchedFiles.map((filename) => (
              <li key={filename}>{filename}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.unmatchedLayers.length > 0 && preview.matches.length > 0 && (
        <details className="unmatched-layers">
          <summary>
            {preview.unmatchedLayers.length} layer{preview.unmatchedLayers.length !== 1 ? 's' : ''} with images won't be replaced
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
