import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import InSystemHeader from './InSystemHeader';
import Footer from '../Footer/Footer';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

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
    return 'Rental Management';
  };

  return (
    <div className={`app-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <InSystemHeader onSidebarToggle={toggleSidebar} pageTitle={getPageTitle()} />
      <Sidebar isOpen={isSidebarOpen} />
      <div className="main-content">
        <main className="page-content">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
