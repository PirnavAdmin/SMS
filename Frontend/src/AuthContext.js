import React, { createContext, useContext, useState } from 'react';

export const ROLES = [
  {
    id: 'super-admin',
    label: 'Super Admin',
    route: '/super-admin-dashboard',
    icon: 'SA',
    email: 'superadmin@sms.com',
    password: 'superadmin123',
    summary: 'Login access for the Super Admin dashboard.',
  },
  {
    id: 'admin',
    label: 'Admin',
    route: '/admin-dashboard',
    icon: 'AD',
    email: 'admin@sms.com',
    password: 'admin123',
    summary: 'Login access for the Admin dashboard.',
  },
  {
    id: 'principal',
    label: 'Principal',
    route: '/principal-dashboard',
    icon: 'PR',
    email: 'principal@sms.com',
    password: 'principal123',
    summary: 'Login access for the Principal dashboard.',
  },
  {
    id: 'hod',
    label: 'Head of Department',
    route: '/hod-dashboard',
    icon: 'HD',
    email: 'hod@sms.com',
    password: 'hod123',
    summary: 'Login access for the Head of Department dashboard.',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    route: '/teacher-dashboard',
    icon: 'TE',
    email: 'teacher@sms.com',
    password: 'teacher123',
    summary: 'Login access for the Teacher dashboard.',
  },
  {
    id: 'student',
    label: 'Student',
    route: '/student-dashboard',
    icon: 'ST',
    email: 'student@sms.com',
    password: 'student123',
    summary: 'Login access for the Student dashboard.',
  },
  {
    id: 'parent',
    label: 'Parent',
    route: '/parent-dashboard',
    icon: 'PA',
    email: 'parent@sms.com',
    password: 'parent123',
    summary: 'Login access for the Parent dashboard.',
  },
  {
    id: 'accountant',
    label: 'Accountant',
    route: '/accountant-dashboard',
    icon: 'AC',
    email: 'accountant@sms.com',
    password: 'accountant123',
    summary: 'Login access for the Accountant dashboard.',
  },
  {
    id: 'librarian',
    label: 'Librarian',
    route: '/librarian-dashboard',
    icon: 'LB',
    email: 'librarian@sms.com',
    password: 'librarian123',
    summary: 'Login access for the Librarian dashboard.',
  },
  {
    id: 'hr',
    label: 'HR',
    route: '/hr-dashboard',
    icon: 'HR',
    email: 'hr@sms.com',
    password: 'hr123',
    summary: 'Login access for the HR dashboard.',
  },
  {
    id: 'transport-manager',
    label: 'Transport Manager',
    route: '/transport-dashboard',
    icon: 'TR',
    email: 'transport@sms.com',
    password: 'transport123',
    summary: 'Login access for the Transport Manager dashboard.',
  },
  {
    id: 'hostel-warden',
    label: 'Hostel Warden',
    route: '/hostel-dashboard',
    icon: 'HW',
    email: 'hostelwarden@sms.com',
    password: 'hostelwarden123',
    summary: 'Login access for the Hostel Warden dashboard.',
  },
];

const USER_KEY = 'sms.authUser';

const AuthContext = createContext(null);

const readStoredUser = () => {
  const value = localStorage.getItem(USER_KEY);
  if (!value) {
    return null;
  }

  try {
    const storedUser = JSON.parse(value);
    const role = ROLES.find(
      (item) => item.id === storedUser?.role && item.email === storedUser?.email
    );

    if (!role) {
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return storedUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const matchedRole = ROLES.find((role) => role.email === normalizedEmail);

    if (!matchedRole || password !== matchedRole.password) {
      return {
        ok: false,
        message: 'Invalid email or password.',
      };
    }

    const nextUser = {
      email: matchedRole.email,
      role: matchedRole.id,
      roleLabel: matchedRole.label,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return { ok: true, user: nextUser, route: matchedRole.route };
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = {
    user,
    roles: ROLES,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
