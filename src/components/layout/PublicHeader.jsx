import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import useClickOutside from '../../hooks/useClickOutside';
import '../../styles/components/PublicHeader.css';

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, setLanguage } = useLanguage();
  const languageMenuRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguageMenu(false);
  };

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    setIsMenuOpen(false); // Close mobile menu on navigation
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useClickOutside(languageMenuRef, () => setShowLanguageMenu(false));

  return (
    <header className="navbar">
      <Link to="/" className="logo" onClick={() => window.scrollTo(0, 0)} data-i18n="nav_yene_rent">Yene Rent</Link>
      <nav className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        <Link to="/" onClick={() => window.scrollTo(0, 0)} data-i18n="nav_home">{t('Home')}</Link>
        <a href="#features-overview" onClick={(e) => handleSmoothScroll(e, 'features-overview')} data-i18n="nav_features">{t('Features')}</a>
        <a href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} data-i18n="nav_pricing">{t('Pricing')}</a>
        <a href="#demo" onClick={(e) => handleSmoothScroll(e, 'demo')} data-i18n="nav_demo">{t('Demo')}</a>
        <a href="#contact" onClick={(e) => handleSmoothScroll(e, 'contact')} data-i18n="nav_contact">{t('Contact')}</a>
        <div className="nav-actions">
          <div className="language-menu menu-container" ref={languageMenuRef}>
            <button
              id="language-menu-button"
              className="btn btn-icon"
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
          <button id="theme-toggle" className="btn btn-icon" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === 'dark' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
          </button>
          <Link to="/login" className="btn btn-login">Login</Link>
          <Link to="/signup" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>
      <button className="menu-toggle" aria-label="Toggle navigation menu" aria-expanded={isMenuOpen} onClick={toggleMenu}>
        <i className="fas fa-bars"></i>
      </button>
    </header>
  );
};

export default PublicHeader;
