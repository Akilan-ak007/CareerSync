import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'PLACEMENT_TEAM';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('placement_jwt_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.auth.me();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        localStorage.removeItem('placement_jwt_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Session verify failed:', error);
      localStorage.removeItem('placement_jwt_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await api.auth.login(credentials);
      if (response.success && response.data) {
        localStorage.setItem('placement_jwt_token', response.data.token);
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Login failed.');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('placement_jwt_token');
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
