import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
}

const defaultAdminUser: User = {
  id: 'USR-001',
  name: 'Dr. Eleanor Vance',
  email: 'admin@stxaviers.edu',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  phone: '+1 555-888-001',
  lastLogin: '2026-07-21 09:30 AM',
  status: 'Active'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : defaultAdminUser;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    return user ? user.role : 'Admin';
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token') || 'mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  });

  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    return localStorage.getItem('auth_branch') || 'Main Campus';
  });

  const handleSetBranch = (b: string) => {
    setSelectedBranch(b);
    localStorage.setItem('auth_branch', b);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const login = async (email: string, chosenRole: UserRole = 'Admin'): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substring(2);

    const loggedUser: User = {
      id: 'USR-' + Math.floor(100 + Math.random() * 900),
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email: email,
      role: chosenRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      lastLogin: new Date().toLocaleString(),
      status: 'Active'
    };

    setUser(loggedUser);
    setRoleState(chosenRole);
    setToken(mockToken);

    localStorage.setItem('auth_user', JSON.stringify(loggedUser));
    localStorage.setItem('auth_token', mockToken);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  const changePassword = async (_oldPass: string, _newPass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return true;
  };

  const forgotPassword = async (_email: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user && !!token,
        selectedBranch,
        setSelectedBranch: handleSetBranch,
        login,
        logout,
        setRole,
        changePassword,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
