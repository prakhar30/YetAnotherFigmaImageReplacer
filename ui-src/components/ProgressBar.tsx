import React from 'react';

interface Props {
  completed: number;
  total: number;
  current: string;
}

export default function ProgressBar({ completed, total, current }: Props) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="progress-bar">
      <div className="progress-header">
        <span>Replacing images...</span>
        <span>{completed} / {total}</span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {current && (
        <div className="progress-current">
          Current: {current}
        </div>
      )}
    </div>
  );
}
