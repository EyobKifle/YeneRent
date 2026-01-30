import React from 'react';
import './MetricCard.css';

const MetricCard = ({ title, value, trend, tooltip }) => {
  return (
    <div className="metric-card" title={tooltip}>
      <h3 className="metric-card-title">{title}</h3>
      <p className="metric-card-value">{value}</p>
      {trend && <span className={`metric-card-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
    </div>
  );
};

export default MetricCard;
