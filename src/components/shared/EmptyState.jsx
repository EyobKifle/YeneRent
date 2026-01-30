import React from 'react';
import './EmptyState.css';

const EmptyState = ({
  icon = '📄',
  title = 'No data found',
  description = 'There is no data to display at the moment.',
  actions = null,
  variant = 'default'
}) => {
  return (
    <div className={`empty-state ${variant === 'compact' ? 'empty-state-compact' : ''}`}>
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-content">
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        {actions && <div className="empty-state-actions">{actions}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
