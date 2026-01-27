import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import useClickOutside from '../../hooks/useClickOutside';
import './InSystemHeader.css';

const InSystemHeader = ({ onSidebarToggle, pageTitle }) => {
  const languageMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();  
  const { setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguageMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useClickOutside(languageMenuRef, () => setShowLanguageMenu(false));
  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  // Viewport boundary detection for dropdown positioning
  useEffect(() => {
    const adjustDropdownPosition = () => {
      const languageMenu = languageMenuRef.current?.querySelector('.dropdown-menu');
      const userMenu = userMenuRef.current?.querySelector('.dropdown-menu');
      const languageButton = languageMenuRef.current?.querySelector('.header-icon-btn');
      const userButton = userMenuRef.current?.querySelector('.header-icon-btn');

      if (languageMenu && showLanguageMenu && languageButton) {
        const buttonRect = languageButton.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const assumedWidth = 280; // max-width of dropdown
        const assumedHeight = 200; // estimated height of dropdown

        // Remove existing alignment classes
        languageMenu.classList.remove('align-right', 'align-top');

        // Horizontal alignment
        if (buttonRect.right + assumedWidth <= viewportWidth) {
          languageMenu.classList.add('align-right');
        }

        // Vertical alignment
        if (buttonRect.bottom + assumedHeight > viewportHeight) {
          languageMenu.classList.add('align-top');
        }
      }

      if (userMenu && showUserMenu && userButton) {
        const buttonRect = userButton.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const assumedWidth = 280;
        const assumedHeight = 200;

        // Remove existing alignment classes
        userMenu.classList.remove('align-right', 'align-top');

        // Horizontal alignment
        if (buttonRect.right + assumedWidth <= viewportWidth) {
          userMenu.classList.add('align-right');
        }

        // Vertical alignment
        if (buttonRect.bottom + assumedHeight > viewportHeight) {
          userMenu.classList.add('align-top');
        }
      }
    };

    // Adjust position when menus are shown
    if (showLanguageMenu || showUserMenu) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(adjustDropdownPosition, 0);
    }

    // Also adjust on window resize
    window.addEventListener('resize', adjustDropdownPosition);
    return () => window.removeEventListener('resize', adjustDropdownPosition);
  }, [showLanguageMenu, showUserMenu]);

  return (
    <header className="header">
      <div className="header-left">
        <button
          id="sidebar-toggle"
          className="header-icon-btn"
          onClick={onSidebarToggle}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      <div className="header-center">
        <h1 id="page-title">{pageTitle || t('Rental Management')}</h1>
      </div>

      <div className="header-right">
        <div className="language-menu menu-container" ref={languageMenuRef}>
          <button
            id="language-menu-button"
            className="header-icon-btn"
            aria-label="Toggle language menu"
            aria-expanded={showLanguageMenu}
            aria-controls="language-menu-dropdown"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <i className="fa-solid fa-globe"></i>
          </button>
          {showLanguageMenu && (
            <div id="language-menu-dropdown" className="dropdown-menu show">
              <button
                className="dropdown-item"
                onClick={() => handleLanguageChange('en')}
              >
                {t('English')}
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleLanguageChange('am')}
              >
                {t('Amharic')}
              </button>
            </div>
          )}
        </div>

        <button className="header-icon-btn notification-btn" aria-label="View notifications">
          <i className="fa-solid fa-bell"></i>
          <span className="notification-badge hidden"></span>
        </button>

        <div className="user-menu menu-container" ref={userMenuRef}>
          <button
            id="user-menu-button"
            className="header-icon-btn"
            aria-label="Toggle user menu"
            aria-expanded={showUserMenu}
            aria-controls="user-menu-dropdown"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div id="user-avatar-container" className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" />
              ) : (
                <span className="user-initials">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
          </button>
          {showUserMenu && (
            <div id="user-menu-dropdown" className="dropdown-menu show">
              <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                {t('My Profile')}
              </Link>
              <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                {t('Settings')}
              </Link>
              <div className="dropdown-divider"></div>
              <button id="logout-btn" className="dropdown-item" onClick={handleLogout}>
                {t('Log Out')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default InSystemHeader;
