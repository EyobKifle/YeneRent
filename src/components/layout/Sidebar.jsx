import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const { user } = useAuth();

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { path: '/dashboard', icon: 'fa-chart-pie', label: t('Dashboard') },
    ];

    if (user.role === 'tenant') {
      return [
        ...baseItems,
        { path: '/profile', icon: 'fa-user', label: t('Profile') },
        { path: '/payments', icon: 'fa-credit-card', label: t('My Payments') },
        { path: '/leases', icon: 'fa-file-lines', label: t('My Lease') },
      ];
    }

    // For property_manager, admin, owner
    return [
      ...baseItems,
      { path: '/properties', icon: 'fa-building', label: t('Properties') },
      { path: '/tenants', icon: 'fa-users', label: t('Tenants') },
      { path: '/leases', icon: 'fa-file-lines', label: t('Leases') },
      { path: '/payments', icon: 'fa-credit-card', label: t('Payments') },
      { path: '/utilities', icon: 'fa-bolt', label: t('Utilities') },
      { path: '/maintenance', icon: 'fa-gear', label: t('Maintenance') },
      { path: '/documents', icon: 'fa-folder', label: t('Documents') },
      { path: '/analytics', icon: 'fa-chart-simple', label: t('Analytics') },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <aside id="sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
        {(user?.role === 'owner' || user?.role === 'admin') && (
          <Link
            to="/admin"
            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-cog"></i>
            <span>{t('Admin')}</span>
          </Link>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
