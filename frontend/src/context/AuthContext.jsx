import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('vaxassist_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify stored token on mount
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('vaxassist_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response && response.data) {
          setUser(response.data);
          setToken(storedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('vaxassist_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to restore session:', err.message);
        localStorage.removeItem('vaxassist_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      const accessToken = res.access_token;
      const userData = res.user;

      localStorage.setItem('vaxassist_token', accessToken);
      setToken(accessToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(payload);
      return {
        success: true,
        message: res.message,
        data: res.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vaxassist_token');
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((allowedRoles) => {
    if (!user || !user.role) return false;
    if (typeof allowedRoles === 'string') return user.role === allowedRoles;
    return allowedRoles.includes(user.role);
  }, [user]);

  const getDashboardPath = useCallback(() => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'HEALTHCARE_WORKER':
        return '/healthcare/dashboard';
      case 'PATIENT':
      default:
        return '/patient/dashboard';
    }
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
