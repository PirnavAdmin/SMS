import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginApi, sendOtpApi, verifyOtpApi, resetPasswordWithOtpApi, changePasswordApi } from '../api/login';
import { fetchUserProfileApi, getLocalUserProfile, saveLocalUserProfile, getActiveUserKey } from '../api/profile';
import { DEFAULT_USER_AVATAR } from '../utils/mediaUtils';
import { fetchBranchesApi, fetchAcademicYearsApi } from '../api/settings';
import { setActiveBranchHeader, setActiveAcademicYearHeader } from '../api/client';

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
  name: 'Administrator',
  email: 'pirnavsms@gmail.com',
  role: 'Admin',
  avatar: DEFAULT_USER_AVATAR,
  phone: '+91 9581768555',
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

const defaultAuthContextValue: AuthContextType = {
  user: null,
  role: 'Admin',
  token: null,
  isAuthenticated: false,
  selectedBranch: '',
  setSelectedBranch: () => {},
  selectedAcademicYear: '',
  setSelectedAcademicYear: () => {},
  login: async () => false,
  logout: () => {},
  setRole: () => {},
  changePassword: async () => false,
  sendOtp: async () => false,
  verifyOtp: async () => false,
  resetPasswordWithOtp: async () => false,
  setUser: () => {}
};

const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

const formatEmailToName = (email: string): string => {
  if (!email) return "User";
  const username = email.split('@')[0];
  const parts = username.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
};

export const TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours in ms

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('auth_token');
  if (!token || token === 'null' || token === 'undefined' || token === 'offline-bypass-dev-token') return false;

  // 1. Check JWT expiration timestamp if token is a standard JWT
  let hasValidJwtExp = false;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) {
        b64 += '=';
      }
      const payload = JSON.parse(atob(b64));
      if (payload && typeof payload.exp === 'number') {
        const expMs = payload.exp * 1000;
        if (Date.now() >= expMs) {
          return false;
        }
        hasValidJwtExp = true;
      }
    }
  } catch {}

  // 2. Check 24-hour token timestamp
  const timestampStr = localStorage.getItem('auth_token_timestamp');
  if (timestampStr) {
    const timestamp = Number(timestampStr);
    if (!isNaN(timestamp)) {
      const age = Date.now() - timestamp;
      if (age < 0 || age >= TOKEN_EXPIRATION_MS) {
        return false;
      }
      return true;
    }
  }

  // If JWT had an unexpired exp, consider it valid even if timestamp was missing
  return hasValidJwtExp;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const hadPreviousSession = Boolean(
        localStorage.getItem('auth_user') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('auth_token_timestamp')
      );

      if (!isTokenValid()) {
        if (hadPreviousSession) {
          localStorage.setItem('session_timeout_occurred', 'true');
        }
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_timestamp');
        localStorage.removeItem('roles');
        localStorage.removeItem('active_selected_class_id');
        localStorage.removeItem('active_class_tab');
    localStorage.removeItem('training_active_tab');
    localStorage.removeItem('settings_active_tab');
    localStorage.removeItem('certificates_view_active_tab');
    localStorage.removeItem('staff_attendance_active_tab');
        localStorage.setItem('active_module', 'dashboard');
        return null;
      }
      const saved = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('auth_token');
      if (saved && savedToken && savedToken !== 'offline-bypass-dev-token') {
        const parsed = JSON.parse(saved);
        if (parsed) {
          parsed.isFirstLogin = false;
          const normRole = normalizeUserRole(parsed.role || '');
          if (normRole === 'Parent' || (parsed.email && parsed.email.toLowerCase().includes('parent'))) {
            parsed.role = 'Parent';
          } else if (parsed.role) {
            parsed.role = normRole;
          }

          const userKey = getActiveUserKey(parsed.email || parsed.id);
          const localProfile = getLocalUserProfile(userKey);

          if (localProfile) {
            const profileEmail = (localProfile.email || '').trim().toLowerCase();
            const userEmail = (parsed.email || '').trim().toLowerCase();
            const isEmailMatch = !profileEmail || !userEmail || profileEmail === userEmail;

            if (isEmailMatch) {
              if (localProfile.name && (parsed.role === 'Admin' || localProfile.name !== 'Pirnavsms')) {
                parsed.name = localProfile.name;
              }
              if (localProfile.avatar) {
                parsed.avatar = localProfile.avatar;
              }
              if (localProfile.phone) {
                parsed.phone = localProfile.phone;
              }
              if (localProfile.branch) {
                parsed.branch = localProfile.branch;
              }
            }
          }

          if (!parsed.name) {
            parsed.name = '';
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
    if (user?.email && user.email.toLowerCase().includes('parent')) return 'Parent';
    return user ? normalizeUserRole(user.role) : 'Admin';
  });

  const [token, setToken] = useState<string | null>(() => {
    if (!isTokenValid()) return null;
    const t = localStorage.getItem('auth_token');
    return t || null;
  });

  const [selectedBranch, setSelectedBranchState] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYearState] = useState<string>('');

  useEffect(() => {
    const handleSync = async () => {
      try {
        const res: any = await fetchBranchesApi();
        const branchList = (res?.success && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : []);
        const validBranchNames = branchList
          .filter((b: any) => b && b.status !== 'Inactive')
          .map((b: any) => typeof b === 'string' ? b : (b.name || b.branchName))
          .filter(Boolean);

        const storedBranch = localStorage.getItem('selected_branch');
        if (storedBranch && (storedBranch === 'All' || storedBranch === 'All Branches' || validBranchNames.includes(storedBranch))) {
          setSelectedBranchState(storedBranch);
        } else if (validBranchNames.length > 0) {
          const first = validBranchNames[0];
          setSelectedBranchState(first);
          localStorage.setItem('selected_branch', first);
        } else {
          setSelectedBranchState('');
          localStorage.removeItem('selected_branch');
        }
      } catch {
        setSelectedBranchState('');
        localStorage.removeItem('selected_branch');
      }

      try {
        const ayRes: any = await fetchAcademicYearsApi();
        if (ayRes?.success && Array.isArray(ayRes.data) && ayRes.data.length > 0) {
          const storedYear = localStorage.getItem('selected_academic_year');
          const active = ayRes.data.find((a: any) => a.isCurrentAcademicYear || a.status === 'Active') || ayRes.data[0];
          const val = active?.academicYear || active?.year;
          if (storedYear && ayRes.data.some((a: any) => (a.academicYear === storedYear || a.year === storedYear))) {
            setSelectedAcademicYearState(storedYear);
          } else if (val) {
            setSelectedAcademicYearState(val);
            localStorage.setItem('selected_academic_year', val);
          }
        }
      } catch {}
    };

    handleSync();
    window.addEventListener('branches_updated', handleSync);
    window.addEventListener('academic_years_updated', handleSync);

    return () => {
      window.removeEventListener('branches_updated', handleSync);
      window.removeEventListener('academic_years_updated', handleSync);
    };
  }, []);

  const handleSetBranch = (branch: string) => {
    setSelectedBranchState(branch);
    setActiveBranchHeader(branch);
    if (branch) {
      localStorage.setItem('selected_branch', branch);
    } else {
      localStorage.removeItem('selected_branch');
    }
    window.dispatchEvent(new CustomEvent('global_context_branch_changed', { detail: { branch } }));
  };

  const handleSetAcademicYear = (academicYear: string) => {
    setSelectedAcademicYearState(academicYear);
    setActiveAcademicYearHeader(academicYear);
    if (academicYear) {
      localStorage.setItem('selected_academic_year', academicYear);
    } else {
      localStorage.removeItem('selected_academic_year');
    }
    window.dispatchEvent(new CustomEvent('global_context_academic_year_changed', { detail: { academicYear } }));
  };

  useEffect(() => {
    setActiveBranchHeader(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    setActiveAcademicYearHeader(selectedAcademicYear);
  }, [selectedAcademicYear]);

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
    if (token && user?.email) {
      const userKey = getActiveUserKey(user.email);
      fetchUserProfileApi(userKey)
        .then((res) => {
          const data = res?.data;
          if (data && (data.avatar || data.name)) {
            if (data.email && user.email && data.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) return;
            if (user.role !== 'Admin' && data.name === 'Pirnavsms') return;

            setUser((prev) => {
              if (!prev) return prev;
              const hasUploadedAvatar = prev.avatar && prev.avatar.startsWith('data:image/');
              const nextAvatar = hasUploadedAvatar ? prev.avatar : (data.avatar || prev.avatar);
              const nextName = (user.role !== 'Admin' && data.name === 'Pirnavsms') ? prev.name : (data.name || prev.name);
              const next = {
                ...prev,
                name: nextName,
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
  }, [token, user?.email, user?.role]);

  const logout = () => {
    try {
      const currentMod = localStorage.getItem('active_module');
      if (currentMod && currentMod !== 'dashboard') {
        localStorage.setItem('session_resume_module', currentMod);
      }
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_timestamp');
    localStorage.removeItem('roles');
    localStorage.removeItem('active_selected_class_id');
    localStorage.removeItem('active_class_tab');
    localStorage.removeItem('training_active_tab');
    localStorage.removeItem('staff_attendance_active_tab');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    window.addEventListener('session_expired', handleUnauthorized);

    return () => {
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
      window.removeEventListener('session_expired', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const checkSessionValidity = () => {
      if (token && !isTokenValid()) {
        console.warn('Session expired: token duration reached.');
        try {
          localStorage.setItem('session_timeout_occurred', 'true');
        } catch {}
        logout();
        window.dispatchEvent(new CustomEvent('session_expired'));
      }
    };

    // Check periodically every 30 seconds and on tab focus/visibility change
    const interval = setInterval(checkSessionValidity, 15000);
    window.addEventListener('focus', checkSessionValidity);
    window.addEventListener('visibilitychange', checkSessionValidity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSessionValidity);
      window.removeEventListener('visibilitychange', checkSessionValidity);
    };
  }, [token]);

  const login = async (emailOrPhone: string, password?: string, chosenRole?: UserRole): Promise<boolean> => {
    try {
      const response = await loginApi(emailOrPhone, password, chosenRole);
      const realToken = response?.token;
      if (!realToken) {
        throw new Error('No authentication token received.');
      }

      const roles: string[] = response?.roles || [];
      const normalizedRoles = roles.map(r => normalizeUserRole(r));

      // If user attempted login via specific portal (e.g. Administrator Portal)
      if (chosenRole) {
        const targetRole = normalizeUserRole(chosenRole);
        if (targetRole === 'Admin') {
          if (!normalizedRoles.includes('Admin')) {
            throw new Error('This account does not have Administrator privileges. Please sign in via the appropriate portal.');
          }
        } else if (targetRole === 'Hostel Warden') {
          if (!normalizedRoles.includes('Hostel Warden') && !normalizedRoles.includes('Admin')) {
            throw new Error('This account does not have Hostel Warden privileges. Please sign in via the appropriate portal.');
          }
        }
      }

      let mappedRole: UserRole = 'Student';
      if (chosenRole && normalizeUserRole(chosenRole) === 'Parent') {
        mappedRole = 'Parent';
      } else if (chosenRole && normalizedRoles.includes(normalizeUserRole(chosenRole))) {
        mappedRole = normalizeUserRole(chosenRole);
      } else if ((emailOrPhone && emailOrPhone.toLowerCase().includes('parent')) || (response?.email && response.email.toLowerCase().includes('parent'))) {
        mappedRole = 'Parent';
      } else if (roles.length > 0) {
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
        const matched = priorityOrder.find(pRole => normalizedRoles.includes(pRole));
        if (matched) {
          mappedRole = matched;
        }
      }

      const loginEmail = (response?.email || (emailOrPhone.includes('@') ? emailOrPhone : '')).trim();
      const userKey = getActiveUserKey(loginEmail || response?.userId || emailOrPhone);
      const savedProfile = getLocalUserProfile(userKey);

      let userName = (response?.fullName || response?.name || '').trim();
      if (!userName && savedProfile?.name) {
        userName = savedProfile.name.trim();
      }

      const userIdStr = response?.userId ? String(response.userId) : (response?.id ? String(response.id) : `USR-${Math.floor(Math.random() * 1000)}`);
      let userAvatar = response?.avatar || savedProfile?.avatar || '';

      const userPhone = response?.mobileNumber || response?.phone || (!emailOrPhone.includes('@') ? emailOrPhone : '') || savedProfile?.phone || '';

      const empIdStr = response?.employeeId || response?.empId || undefined;
      const staffIdVal = response?.staffId ? Number(response.staffId) : undefined;
      const userBranch = response?.branch || savedProfile?.branch || selectedBranch || '';

      const loggedUser: User = {
        id: userIdStr,
        empId: empIdStr,
        staffId: staffIdVal,
        name: userName,
        email: loginEmail || (emailOrPhone.includes('@') ? emailOrPhone : ''),
        phone: userPhone,
        branch: userBranch || response?.branch || savedProfile?.branch || (selectedBranch && selectedBranch !== 'All' && selectedBranch !== 'All Branches' ? selectedBranch : '') || '',
        role: mappedRole,
        avatar: userAvatar,
        lastLogin: new Date().toLocaleString(),
        status: 'Active',
        isFirstLogin: false
      };

      if (userBranch) {
        setSelectedBranchState(userBranch);
        setActiveBranchHeader(userBranch);
      }

      setUser(loggedUser);
      setRoleState(mappedRole);
      setToken(realToken);
      localStorage.setItem('auth_user', JSON.stringify(loggedUser));
      localStorage.setItem('auth_token', realToken);
      localStorage.setItem('auth_token_timestamp', Date.now().toString());
      localStorage.setItem('roles', JSON.stringify(roles));
      const resumeMod = localStorage.getItem('session_resume_module');
      if (resumeMod && resumeMod !== 'dashboard') {
        localStorage.setItem('active_module', resumeMod);
      } else if (!localStorage.getItem('active_module')) {
        localStorage.setItem('active_module', 'dashboard');
      }
      localStorage.removeItem('session_resume_module');

      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    const candidateIdentifier = user?.email || user?.phone || user?.name || '';
    await changePasswordApi({
      oldPassword: oldPass,
      newPassword: newPass,
      confirmPassword: newPass,
      emailOrPhone: candidateIdentifier,
    });
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
  return context || defaultAuthContextValue;
};