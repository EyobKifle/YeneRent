// YeneRent/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    const loggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
    return (loggedIn && storedUser) ? JSON.parse(storedUser) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('userLoggedIn') === 'true';
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
      if (data.token) {
        sessionStorage.setItem('token', data.token);
      }
      setUser(userData);
      setIsLoggedIn(true);
      sessionStorage.setItem('currentUser', JSON.stringify(userData));
      sessionStorage.setItem('userLoggedIn', 'true');
      setLoading(false);
      return { success: true, redirectTo: userData.role === 'admin' || userData.role === 'owner' ? '/admin' : '/dashboard' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (email, password, name) => {
    setLoading(true);
    try {
      const data = await api.register({ email, password, name });
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
      if (data.token) {
        sessionStorage.setItem('token', data.token);
      }
      setUser(userData);
      setIsLoggedIn(true);
      sessionStorage.setItem('currentUser', JSON.stringify(userData));
      sessionStorage.setItem('userLoggedIn', 'true');
      setLoading(false);
      return { success: true, redirectTo: userData.role === 'admin' ? '/admin' : '/dashboard' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userLoggedIn');
    sessionStorage.removeItem('token');
    api.logout(); // Clear token
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};