import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if session is cached
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('ar_token');
      const cachedUser = localStorage.getItem('ar_user');

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          // Validate session with backend
          const res = await api.get('/auth/me');
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('ar_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session check failed, clearing auth cache', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to token expiration events
    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth_expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        const { token, user: loggedInUser } = res.data;
        localStorage.setItem('ar_token', token);
        localStorage.setItem('ar_user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      if (res.success && res.data) {
        const { token, user: registeredUser } = res.data;
        localStorage.setItem('ar_token', token);
        localStorage.setItem('ar_user', JSON.stringify(registeredUser));
        setUser(registeredUser);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ar_token');
    localStorage.removeItem('ar_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
