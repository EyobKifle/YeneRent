import React from 'react';
import './AlertPanel.css';

const AlertPanel = ({ type, title, message, onClose }) => {
  return (
    <div className={`alert-panel alert-${type}`}>
      <div>
        {title && <h3 className="alert-title">{title}</h3>}
        <p className="alert-message">{message}</p>
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default AlertPanel;
