import React from 'react';
import './Badge.css';

const Badge = ({ variant = 'default', children, ...props }) => {
  return (
    <span className={`badge badge-${variant}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;
