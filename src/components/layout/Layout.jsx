import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InSystemHeader from './InSystemHeader';
import Footer from '../Footer/Footer';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return null;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/properties')) return 'Properties';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/tenants')) return 'Tenants';
    if (path.includes('/units')) return 'Units';
    if (path.includes('/documents')) return 'Documents';
    if (path.includes('/payments')) return 'Payment Schedule';
    if (path.includes('/maintenance')) return 'Maintenance';
    if (path.includes('/utilities')) return 'Utilities';
    if (path.includes('/leases')) return 'Leases';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/admin')) return 'Admin';
    return 'Rental Management';
  };

  const isAdminPage = location.pathname.includes('/admin');

  return (
    <div className={`app-layout ${!isSidebarOpen && !isAdminPage ? 'sidebar-collapsed' : ''} ${isAdminPage ? 'admin-page' : ''}`}>
      <InSystemHeader onSidebarToggle={isAdminPage ? null : toggleSidebar} pageTitle={getPageTitle()} />
      {!isAdminPage && <Sidebar isOpen={isSidebarOpen} />}
      <div className="main-content">
        <main className="page-content">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
