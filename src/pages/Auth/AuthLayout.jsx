import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from '../../components/layout/PublicHeader';
import './Auth.css';

const AuthLayout = () => {
  return (
    <div className="layout auth-layout">
      <PublicHeader />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
