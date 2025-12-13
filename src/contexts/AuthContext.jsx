// YeneRent/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === 'demo@user.com' && password === 'password') {
      const dummyUser = {
        id: 'user-1',
        name: 'Demo User',
        email: email,
        avatarUrl: null,
      };
      setUser(dummyUser);
      setIsLoggedIn(true);
      sessionStorage.setItem('currentUser', JSON.stringify(dummyUser));
      sessionStorage.setItem('userLoggedIn', 'true');
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: 'Invalid credentials' };
    }
  };

  const signup = async (email, password, name) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // For demo purposes, accept any signup
    const newUser = {
      id: `user-${Date.now()}`,
      name: name,
      email: email,
      avatarUrl: null,
    };
    setUser(newUser);
    setIsLoggedIn(true);
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));
    sessionStorage.setItem('userLoggedIn', 'true');
    setLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userLoggedIn');
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