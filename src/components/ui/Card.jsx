import React from 'react';

export const Card = ({ children, className, ...props }) => {
    const cardClassName = `data-card ${className || ''}`;
    return (
        <div className={cardClassName} {...props}>
            {children}
        </div>
    );
};

