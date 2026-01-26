import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/components/PublicHeader.css';
import { useLanguage } from '../../contexts/LanguageContext';

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    setIsMenuOpen(false); // Close mobile menu on navigation
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
