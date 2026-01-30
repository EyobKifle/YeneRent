import React from 'react';
import './MetricCard.css';

const MetricCard = ({ title, value, trend, tooltip }) => {
  return (
    <div className="metric-card" title={tooltip}>
      <h3>{title}</h3>
      <p className="metric-value">{value}</p>
      {trend && <span className={`trend ${trend > 0 ? 'positive' : 'negative'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
    </div>
  );
};

export default MetricCard;
