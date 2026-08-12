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
  selectedAcademicYear: string;
  setSelectedAcademicYear: (academicYear: string) => void;
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

const getDefaultAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    return user ? user.role : 'Admin';
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token') || null;
  });

  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    return localStorage.getItem('auth_branch') || 'Main Campus';
  });

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(() => {
    return localStorage.getItem('auth_academic_year') || getDefaultAcademicYear();
  });

  const handleSetBranch = (b: string) => {
    setSelectedBranch(b);
    localStorage.setItem('auth_branch', b);
  };

  const handleSetAcademicYear = (academicYear: string) => {
    setSelectedAcademicYear(academicYear);
    localStorage.setItem('auth_academic_year', academicYear);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const login = async (emailOrPhone: string, password?: string, chosenRole?: UserRole): Promise<boolean> => {
    try {
      let mappedRole: UserRole = 'Admin';
      let realToken = 'mock-jwt-token-' + Date.now();
      let userName = emailOrPhone.split('@')[0] || 'User';
      const employeeRoles: UserRole[] = ['Teacher', 'Staff', 'Principal', 'HR', 'Accountant', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist'];

      // Check for mock credentials first
      if (emailOrPhone === 'admin@pirnavschools.com' && password === 'Admin@123') {
        mappedRole = 'Admin';
        userName = 'Admin';
      } else if (emailOrPhone === 'teacher@pirnavschools.com' && password === 'Teacher@123') {
        mappedRole = 'Teacher';
        userName = 'Teacher';
      } else if (emailOrPhone === 'student@pirnavschools.com' && password === 'Student@123') {
        mappedRole = 'Student';
        userName = 'Student';
      } else if (emailOrPhone === 'parent@pirnavschools.com' && password === 'Parent@123') {
        mappedRole = 'Parent';
        userName = 'Parent';
      } else {
        // Fallback to real API
        const response = await loginApi(emailOrPhone, password);
        realToken = response?.token || response?.accessToken || realToken;
        
        const roles = response?.roles || [];
        const priorityRoles: UserRole[] = ['Admin', 'Principal', 'Teacher', 'Staff', 'HR', 'Accountant', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist', 'Student', 'Parent'];

        if (roles.includes("SuperAdmin") || roles.includes("Admin")) {
          mappedRole = 'Admin';
        } else {
          const resolvedRole = priorityRoles.find(role => roles.includes(role));
          if (resolvedRole) {
            mappedRole = resolvedRole;
          }
        }

        if (response?.user?.name) {
          userName = response.user.name;
        }
      }

      const loggedUser: User = {
        id: `USR-${Math.floor(Math.random() * 1000)}`,
        name: userName,
        email: emailOrPhone,
        role: mappedRole,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        lastLogin: new Date().toLocaleString(),
        status: 'Active',
        isFirstLogin: employeeRoles.includes(mappedRole) || mappedRole === 'Teacher'
      };

      setUser(loggedUser);
      setRoleState(mappedRole);
      setToken(realToken);

      localStorage.setItem('auth_user', JSON.stringify(loggedUser));
      localStorage.setItem('auth_token', realToken);
      
      // Store roles specifically to mirror backend logic in App
      localStorage.setItem('roles', JSON.stringify([mappedRole]));
      
      return true;
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
        selectedAcademicYear,
        setSelectedAcademicYear: handleSetAcademicYear,
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
