import React from 'react';
import './Chart.css';

const Chart = ({ type = 'line', data, title, height = 200 }) => {
  if (!data || data.length === 0) {
    return <div className="chart-placeholder">No data available</div>;
  }

  const values = data.map(item => Number(item.value) || 0);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1; 

  const getPointPosition = (value, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
    const y = ((maxValue - value) / range) * 80 + 10; // 10% margin
    return { x, y };
  };

  const points = data.map((item, index) => getPointPosition(item.value, index));
  const pathData = points.map(point => `${point.x},${point.y}`).join(' ');

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="chart" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {type === 'line' && (
            <polyline
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="2"
              points={pathData}
            />
          )}
          {type === 'bar' && (
            data.map((item, index) => {
              const barHeight = (item.value / maxValue) * 80;
              const barX = (index / data.length) * 100;
              const barWidth = 100 / data.length * 0.8;
              return (
                <rect
                  key={index}
                  x={barX + barWidth * 0.1}
                  y={100 - barHeight - 10}
                  width={barWidth}
                  height={barHeight}
                  fill="var(--accent-color)"
                />
              );
            })
          )}
          {type === 'area' && (
            <>
              <polyline
                fill="none"
                stroke="var(--accent-color)"
                strokeWidth="2"
                points={pathData}
              />
              <polygon
                fill="var(--accent-color)"
                fillOpacity="0.1"
                points={`0,100 ${pathData} 100,100`}
              />
            </>
          )}
        </svg>

        {/* Data points for line chart */}
        {type === 'line' && points.map((point, index) => (
          <div
            key={index}
            className="chart-point"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            title={`${data[index].label}: ${data[index].value}`}
          />
        ))}

        {/* Labels */}
        <div className="chart-labels">
          {data.map((item, index) => (
            <div
              key={index}
              className="chart-label"
              style={{ left: `${data.length > 1 ? (index / (data.length - 1)) * 100 : 50}%` }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chart;
