import React from 'react';
import type { MatchResult } from '../../plugin-src/types';

interface Props {
  errors: MatchResult[];
}

export default function ErrorList({ errors }: Props) {
  if (errors.length === 0) return null;

  return (
    <div className="error-list">
      <h3>Errors ({errors.length})</h3>
      <ul>
        {errors.map((error) => (
          <li key={error.layerId}>
            <span className="layer">{error.layerName}</span>
            <span className="message">{error.error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
