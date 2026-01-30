import React, { useEffect } from 'react';
import './SideDrawer.css';

const SideDrawer = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <div
        className={`side-drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
      />
      <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="side-drawer-header">
          <h3>{title}</h3>
          <button className="side-drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="side-drawer-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default SideDrawer;
