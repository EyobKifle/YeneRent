import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import useClickOutside from '../../hooks/useClickOutside';

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
            <div id="language-menu-dropdown" className="dropdown-menu">
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
            <div id="user-menu-dropdown" className="dropdown-menu">
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
