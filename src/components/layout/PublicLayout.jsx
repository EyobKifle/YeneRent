import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import Footer from '../Footer/Footer';
import './Layout.css';

const PublicLayout = () => {
  return (
    <div className="layout public-layout">
      <PublicHeader />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
