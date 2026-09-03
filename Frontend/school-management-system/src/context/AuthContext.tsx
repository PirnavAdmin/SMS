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
  loginOffline: (role?: UserRole) => void;
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
  email: 'admin@pirnavschools.edu',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  phone: '+1 555-888-001',
  lastLogin: '2026-07-21 09:30 AM',
  status: 'Active'
};

export const normalizeUserRole = (roleStr: string): UserRole => {
  const clean = (roleStr || "").toLowerCase().replace(/[_\s-]+/g, " ").trim();
  if (clean === "superadmin" || clean === "super admin" || clean === "admin") return "Admin";
  if (clean === "principal") return "Principal";
  if (clean === "teacher" || clean === "faculty") return "Teacher";
  if (clean === "warden" || clean === "hostel warden" || clean === "hostelwarden") return "Hostel Warden";
  if (clean === "librarian") return "Librarian";
  if (clean === "driver" || clean === "bus attendant" || clean === "bus driver" || clean === "chauffeur") return "Driver";
  if (clean === "transport manager" || clean === "transportmanager" || clean === "transport") return "Transport Manager";
  if (clean === "accountant" || clean === "finance") return "Accountant";
  if (clean === "hr") return "HR";
  if (clean === "receptionist") return "Receptionist";
  if (clean === "parent") return "Parent";
  if (clean === "student") return "Student";
  if (clean === "staff" || clean === "non teaching" || clean === "non-teaching") return "Staff";
  return "Staff";
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatEmailToName = (email: string): string => {
  if (!email) return "Admin User";
  const username = email.split('@')[0];
  const parts = username.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
};

const getDefaultAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('auth_token');
      if (saved && savedToken) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          parsed.isFirstLogin = false;
          if (parsed.role) {
            parsed.role = normalizeUserRole(parsed.role);
          }
          if (parsed.email && (parsed.name === 'Administrator' || parsed.name === 'Admin User' || !parsed.name)) {
            parsed.name = formatEmailToName(parsed.email);
          }
          localStorage.setItem('auth_user', JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    return user ? normalizeUserRole(user.role) : 'Admin';
  });

  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('auth_token');
    return t || null;
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
    const normalized = normalizeUserRole(newRole);
    setRoleState(normalized);
    if (user) {
      const updated = { ...user, role: normalized };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const loginOffline = (chosenRole: UserRole = 'Admin') => {
    const offlineUser: User = {
      ...defaultAdminUser,
      role: chosenRole,
      name: chosenRole === 'Admin' ? 'Dr. Eleanor Vance (Dev Admin)' : `Demo ${chosenRole}`
    };
    setUser(offlineUser);
    setRoleState(chosenRole);
    setToken('dev-admin-token');
    localStorage.setItem('auth_user', JSON.stringify(offlineUser));
    localStorage.setItem('auth_token', 'dev-admin-token');
    localStorage.setItem('roles', JSON.stringify([chosenRole]));
  };

  const login = async (emailOrPhone: string, password?: string, chosenRole?: UserRole): Promise<boolean> => {
    try {
      const response = await loginApi(emailOrPhone, password);
      const realToken = response?.token;
      if (!realToken) {
        throw new Error('No authentication token received.');
      }

      const roles: string[] = response?.roles || [];
      const priorityOrder: UserRole[] = [
        'Admin',
        'Principal',
        'Hostel Warden',
        'Transport Manager',
        'Driver',
        'Librarian',
        'Accountant',
        'HR',
        'Receptionist',
        'Teacher',
        'Staff',
        'Parent',
        'Student',
      ];

      let mappedRole: UserRole = chosenRole ? normalizeUserRole(chosenRole) : 'Student';
      if (roles.length > 0) {
        const normalizedRoles = roles.map(r => normalizeUserRole(r));
        const matched = priorityOrder.find(pRole => normalizedRoles.includes(pRole));
        if (matched) {
          mappedRole = matched;
        }
      }

      let userName = response?.fullName || emailOrPhone.split('@')[0] || 'User';
      if (emailOrPhone.includes('@') && (userName === 'Administrator' || userName === 'Admin User' || userName === 'User')) {
        userName = formatEmailToName(emailOrPhone);
      }

      const userIdStr = response?.userId ? String(response.userId) : `USR-${Math.floor(Math.random() * 1000)}`;

      const loggedUser: User = {
        id: userIdStr,
        name: userName,
        email: emailOrPhone,
        role: mappedRole,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        lastLogin: new Date().toLocaleString(),
        status: 'Active',
        isFirstLogin: false
      };

      setUser(loggedUser);
      setRoleState(mappedRole);
      setToken(realToken);
      localStorage.setItem('auth_user', JSON.stringify(loggedUser));
      localStorage.setItem('auth_token', realToken);
      // Store roles specifically to mirror backend logic in App
      localStorage.setItem('roles', JSON.stringify(roles));

      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('roles');
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
    <AuthContext.Provider value={{ user, role, token, isAuthenticated: !!user && !!token, selectedBranch, setSelectedBranch: handleSetBranch, selectedAcademicYear, setSelectedAcademicYear: handleSetAcademicYear, login, loginOffline, logout, setRole, changePassword, sendOtp, verifyOtp, resetPasswordWithOtp, setUser }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};