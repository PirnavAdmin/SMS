import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';
import { loginApi, sendOtpApi, verifyOtpApi, resetPasswordWithOtpApi } from '../api/login';

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
  sendOtp: (emailOrPhone: string) => Promise<boolean>;
  verifyOtp: (emailOrPhone: string, otpCode: string) => Promise<boolean>;
  resetPasswordWithOtp: (emailOrPhone: string, otpCode: string, newPassword: string) => Promise<boolean>;
  setUser: (user: User | null) => void;
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
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    return user ? user.role : 'Admin';
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
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
      if (chosenRole === 'Admin') {
        const response = await loginApi(emailOrPhone, password);
        const realToken = response.token || response.accessToken || ('mock-token-' + Date.now());
        const realUser: User = response.user || {
          id: response.id || 'USR-001',
          name: response.name || emailOrPhone.split('@')[0],
          email: emailOrPhone,
          role: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          lastLogin: new Date().toLocaleString(),
          status: 'Active',
          isFirstLogin: false
        };

        setUser(realUser);
        setRoleState(realUser.role);
        setToken(realToken);

        localStorage.setItem('auth_user', JSON.stringify(realUser));
        localStorage.setItem('auth_token', realToken);
        return true;
      } else {
        // Mock static login bypass since API is off for these roles
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        const loggedUser: User = {
          id: `USR-${Math.floor(Math.random() * 1000)}`,
          name: emailOrPhone.split('@')[0] || 'Demo User',
          email: emailOrPhone,
          role: chosenRole,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          lastLogin: new Date().toLocaleString(),
          status: 'Active',
          isFirstLogin: !['Admin', 'Parent', 'Student'].includes(chosenRole)
        };

        setUser(loggedUser);
        setRoleState(loggedUser.role);
        setToken(mockToken);

        localStorage.setItem('auth_user', JSON.stringify(loggedUser));
        localStorage.setItem('auth_token', mockToken);
        return true;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Clean up any stale data just in case
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
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

  const sendOtp = async (emailOrPhone: string): Promise<boolean> => {
    try {
      await sendOtpApi(emailOrPhone);
      return true;
    } catch {
      return false;
    }
  };

  const verifyOtp = async (emailOrPhone: string, otpCode: string): Promise<boolean> => {
    await verifyOtpApi(emailOrPhone, otpCode);
    return true;
  };

  const resetPasswordWithOtp = async (emailOrPhone: string, otpCode: string, newPassword: string): Promise<boolean> => {
    await resetPasswordWithOtpApi(emailOrPhone, otpCode, newPassword);
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
        resetPasswordWithOtp,
        setUser
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
