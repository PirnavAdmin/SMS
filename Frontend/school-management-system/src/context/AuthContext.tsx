import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginApi, sendOtpApi, verifyOtpApi, resetPasswordWithOtpApi } from '../api/login';
import { fetchUserProfileApi, getLocalUserProfile, saveLocalUserProfile, getActiveUserKey } from '../api/profile';
import { DEFAULT_USER_AVATAR } from '../utils/mediaUtils';

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
  name: 'Vasantha Gokul',
  email: 'vasantha.gokul@pirnav.com',
  role: 'Admin',
  avatar: DEFAULT_USER_AVATAR,
  phone: '+91 9876543210',
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
      if (saved && savedToken && savedToken !== 'offline-bypass-dev-token') {
        const parsed = JSON.parse(saved);
        if (parsed) {
          parsed.isFirstLogin = false;
          if (parsed.role) {
            parsed.role = normalizeUserRole(parsed.role);
          }
          // FIX CORRUPTED SCHOOL EMAIL ON USER ACCOUNT
          if (
            parsed.email === 'contact@pirnavschools.edu' || 
            parsed.email === 'admin@pirnavschools.edu' ||
            (parsed.name === 'Vasantha Gokul' && (!parsed.email || parsed.email.endsWith('@pirnavschools.edu')))
          ) {
            parsed.email = 'vasantha.gokul@pirnav.com';
          }

          const userKey = getActiveUserKey(parsed.email);
          const localProfile = getLocalUserProfile(userKey) || getLocalUserProfile('vasantha.gokul@pirnav.com');

          // If the name was previously corrupted to Eleanor Vance or generic admin:
          const isDrEleanor = parsed.name === 'Dr. Eleanor Vance' && parsed.email && !parsed.email.toLowerCase().includes('eleanor');
          const isGeneric = parsed.name === 'Administrator' || parsed.name === 'Admin User' || !parsed.name || isDrEleanor;

          if (localProfile?.name) {
            parsed.name = localProfile.name;
          } else if (parsed.email === 'vasantha.gokul@pirnav.com') {
            parsed.name = 'Vasantha Gokul';
          } else if (parsed.email && isGeneric) {
            parsed.name = formatEmailToName(parsed.email);
          }

          if (localProfile?.avatar) {
            parsed.avatar = localProfile.avatar;
          }
          if (localProfile?.phone) {
            parsed.phone = localProfile.phone;
          }

          localStorage.setItem('auth_user', JSON.stringify(parsed));
          localStorage.setItem('user', JSON.stringify(parsed));
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
    return (t && t !== 'offline-bypass-dev-token') ? t : null;
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

  useEffect(() => {
    if (token && token !== 'offline-bypass-dev-token' && user?.email) {
      const userKey = getActiveUserKey(user.email);
      fetchUserProfileApi(userKey)
        .then((res) => {
          const data = res?.data;
          if (data && (data.avatar || data.name)) {
            setUser((prev) => {
              if (!prev) return prev;
              const hasUploadedAvatar = prev.avatar && prev.avatar.startsWith('data:image/');
              const nextAvatar = hasUploadedAvatar ? prev.avatar : (data.avatar || prev.avatar);
              const next = {
                ...prev,
                name: data.name || prev.name,
                phone: data.phone || prev.phone,
                avatar: nextAvatar,
                branch: data.branch || prev.branch,
              };
              localStorage.setItem('auth_user', JSON.stringify(next));
              return next;
            });
          }
        })
        .catch(() => {});
    }
  }, [token, user?.email]);

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

      let loginEmail = response?.email || (emailOrPhone.includes('@') ? emailOrPhone : '');
      if (loginEmail === 'contact@pirnavschools.edu' || loginEmail === 'admin@pirnavschools.edu') {
        loginEmail = 'vasantha.gokul@pirnav.com';
      }
      const userKey = getActiveUserKey(loginEmail || emailOrPhone);
      const savedProfile = getLocalUserProfile(userKey) || getLocalUserProfile('vasantha.gokul@pirnav.com');

      let userName = response?.fullName || (loginEmail ? loginEmail.split('@')[0] : 'User');
      if (savedProfile?.name) {
        userName = savedProfile.name;
      } else if (loginEmail === 'vasantha.gokul@pirnav.com') {
        userName = 'Vasantha Gokul';
      } else if (userName === 'Administrator' || userName === 'Admin User' || userName === 'User' || userName === 'Dr. Eleanor Vance') {
        if (loginEmail) {
          userName = formatEmailToName(loginEmail);
        }
      }

      const userIdStr = response?.userId ? String(response.userId) : `USR-${Math.floor(Math.random() * 1000)}`;

      let userAvatar = response?.avatar || savedProfile?.avatar || '';
      if (!userAvatar) {
        try {
          const profRes = await fetchUserProfileApi(userKey);
          const profData = profRes?.data;
          if (profData?.avatar) {
            userAvatar = profData.avatar;
          }
          if (profData?.name && !savedProfile?.name && (userName === 'Administrator' || userName === 'Admin User' || userName === 'User')) {
            userName = profData.name;
          }
        } catch {}
      }
      if (!userAvatar) {
        userAvatar = DEFAULT_USER_AVATAR;
      }

      const loggedUser: User = {
        id: userIdStr,
        name: userName,
        email: loginEmail || emailOrPhone,
        phone: savedProfile?.phone || response?.mobileNumber || response?.phone || '',
        branch: savedProfile?.branch || response?.branch || 'Main Campus',
        role: mappedRole,
        avatar: userAvatar,
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

  const handleSetUser = (newUser: User | null) => {
    if (newUser) {
      if (
        newUser.email === 'contact@pirnavschools.edu' || 
        newUser.email === 'admin@pirnavschools.edu' ||
        (newUser.name === 'Vasantha Gokul' && (!newUser.email || newUser.email.endsWith('@pirnavschools.edu')))
      ) {
        newUser.email = 'vasantha.gokul@pirnav.com';
      }
    }
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      localStorage.setItem('user', JSON.stringify(newUser));
      if (newUser.email) {
        saveLocalUserProfile({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          avatar: newUser.avatar,
          branch: newUser.branch,
          role: newUser.role,
        }, newUser.email);
      }
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, token, isAuthenticated: !!user && !!token && token !== 'offline-bypass-dev-token', selectedBranch, setSelectedBranch: handleSetBranch, selectedAcademicYear, setSelectedAcademicYear: handleSetAcademicYear, login, logout, setRole, changePassword, sendOtp, verifyOtp, resetPasswordWithOtp, setUser: handleSetUser }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};