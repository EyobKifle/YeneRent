import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ value, max = 100, showLabel = true, color = 'primary' }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div
          className={`progress-fill progress-${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
