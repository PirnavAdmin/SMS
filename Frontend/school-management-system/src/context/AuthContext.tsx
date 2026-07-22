import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  login: (emailOrPhone: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  sendOtp: (emailOrPhone: string) => Promise<{ userId: number }>;
  verifyOtp: (userId: number, otpCode: string) => Promise<boolean>;
  resetPasswordWithOtp: (userId: number, otpCode: string, newPassword: string) => Promise<boolean>;
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

  const login = async (emailOrPhone: string, password?: string, chosenRole: UserRole = 'Admin'): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      const loggedUser: User = {
        id: data.userId.toString(),
        name: data.fullName,
        email: emailOrPhone,
        role: (data.roles && data.roles.length > 0) ? data.roles[0] : chosenRole,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        lastLogin: new Date().toLocaleString(),
        status: 'Active'
      };

      setUser(loggedUser);
      setRoleState(loggedUser.role);
      setToken(data.token);

      localStorage.setItem('auth_user', JSON.stringify(loggedUser));
      localStorage.setItem('auth_token', data.token);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
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

  const sendOtp = async (emailOrPhone: string): Promise<{ userId: number }> => {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, deliveryMethod: 'email', purpose: 'PasswordReset' })
    });
    if (!res.ok) throw new Error('Failed to send OTP');
    // If the API doesn't return JSON or misses userId, default to 0 as fallback
    try {
      const data = await res.json();
      return { userId: data.userId || 0 };
    } catch {
      return { userId: 0 };
    }
  };

  const verifyOtp = async (userId: number, otpCode: string): Promise<boolean> => {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otpCode, purpose: 'PasswordReset' })
    });
    if (!res.ok) throw new Error('Invalid OTP');
    return true;
  };

  const resetPasswordWithOtp = async (userId: number, otpCode: string, newPassword: string): Promise<boolean> => {
    const res = await fetch('/api/auth/otp/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otpCode, newPassword })
    });
    if (!res.ok) throw new Error('Failed to reset password');
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
        sendOtp,
        verifyOtp,
        resetPasswordWithOtp
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
