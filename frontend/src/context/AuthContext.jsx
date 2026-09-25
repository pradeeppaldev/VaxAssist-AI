import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  'admin@vaxassist.ai': {
    id: 'USR-1004',
    name: 'Pradeep Pal (Lead Administrator)',
    email: 'admin@vaxassist.ai',
    role: 'ADMIN',
    account_status: 'ACTIVE',
  },
  'doctor@vaxassist.ai': {
    id: 'USR-1001',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@apollohealth.org',
    role: 'HEALTHCARE_WORKER',
    account_status: 'ACTIVE',
  },
  'priya.sharma@apollohealth.org': {
    id: 'USR-1001',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@apollohealth.org',
    role: 'HEALTHCARE_WORKER',
    account_status: 'ACTIVE',
  },
  'patient@vaxassist.ai': {
    id: 'USR-1002',
    name: 'Rajesh Verma',
    email: 'rajesh.verma@gmail.com',
    role: 'PATIENT',
    account_status: 'ACTIVE',
  },
  'rajesh.verma@gmail.com': {
    id: 'USR-1002',
    name: 'Rajesh Verma',
    email: 'rajesh.verma@gmail.com',
    role: 'PATIENT',
    account_status: 'ACTIVE',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('vaxassist_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
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

      // If this is a demo offline token, restore cached user
      if (storedToken.startsWith('demo_token_')) {
        try {
          const cachedUser = JSON.parse(localStorage.getItem('vaxassist_user') || 'null');
          if (cachedUser) {
            setUser(cachedUser);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      try {
        const response = await authApi.getMe();
        if (response && response.data) {
          setUser(response.data);
          localStorage.setItem('vaxassist_user', JSON.stringify(response.data));
          setToken(storedToken);
        } else {
          // Check if cached user exists
          const cachedUser = JSON.parse(localStorage.getItem('vaxassist_user') || 'null');
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            localStorage.removeItem('vaxassist_token');
            localStorage.removeItem('vaxassist_user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        // In frontend-only or offline mode, retain cached demo user
        try {
          const cachedUser = JSON.parse(localStorage.getItem('vaxassist_user') || 'null');
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            localStorage.removeItem('vaxassist_token');
            localStorage.removeItem('vaxassist_user');
            setToken(null);
            setUser(null);
          }
        } catch {
          setUser(null);
        }
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
      localStorage.setItem('vaxassist_user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      // Offline / Demo fallback for simulated testing
      const normalizedEmail = email.trim().toLowerCase();
      const demoAccount = DEMO_ACCOUNTS[normalizedEmail];
      if (demoAccount) {
        const demoToken = `demo_token_${demoAccount.role.toLowerCase()}`;
        localStorage.setItem('vaxassist_token', demoToken);
        localStorage.setItem('vaxassist_user', JSON.stringify(demoAccount));
        setToken(demoToken);
        setUser(demoAccount);
        return { success: true, user: demoAccount };
      }

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
    localStorage.removeItem('vaxassist_user');
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
