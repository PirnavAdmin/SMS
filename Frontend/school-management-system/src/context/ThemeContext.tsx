import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchThemeApi,
  updateSchoolDefaultThemeApi,
  resetSchoolDefaultThemeApi,
  updateUserThemeApi,
  resetUserThemeApi,
  fetchSuperAdminThemeApi,
  updateSuperAdminThemeApi,
  resetSuperAdminThemeApi,
} from '../api/theme';

export interface ThemeColors {
  primary: string;
  secondary: string;
  updatedAt?: string;
}

export const DEFAULT_THEME: ThemeColors = {
  primary: '#0284c7',
  secondary: '#f59e0b',
};

export const SUPERADMIN_THEME_KEY = 'superadmin_theme';
export const SCHOOL_DEFAULT_THEME_KEY = 'school_default_theme';
export const USER_THEME_KEY_PREFIX = 'user_theme_';
export const LEGACY_THEME_KEY = 'theme_colors';
export const LEGACY_PRIMARY_KEY = 'theme_primary';
export const LEGACY_SECONDARY_KEY = 'theme_secondary';

/**
 * Returns the Super Admin platform theme.
 * Stored independently and applied ONLY to Super Admin screens.
 */
export const getSuperAdminTheme = (): ThemeColors => {
  try {
    const saved = localStorage.getItem(SUPERADMIN_THEME_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.primary && parsed?.secondary) {
        return {
          primary: parsed.primary,
          secondary: parsed.secondary,
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load superadmin theme from localStorage:', e);
  }
  return DEFAULT_THEME;
};

/**
 * Returns a unique key representing the active user (email, id, or username).
 * Falls back to 'default' for unauthenticated/guest sessions.
 */
export const getActiveUserKey = (emailOrId?: string): string => {
  if (emailOrId && typeof emailOrId === 'string' && emailOrId.trim()) {
    return emailOrId.trim().toLowerCase();
  }
  try {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.email) return String(parsed.email).trim().toLowerCase();
      if (parsed?.id) return String(parsed.id).trim().toLowerCase();
      if (parsed?.username) return String(parsed.username).trim().toLowerCase();
    }
  } catch {}
  return 'default';
};

/**
 * Returns the School-wide Default Theme set by Admin.
 * Falls back to legacy keys or DEFAULT_THEME (#0284c7, #f59e0b).
 */
export const getSchoolDefaultTheme = (): ThemeColors => {
  try {
    const saved = localStorage.getItem(SCHOOL_DEFAULT_THEME_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.primary && parsed?.secondary) {
        return {
          primary: parsed.primary,
          secondary: parsed.secondary,
          updatedAt: parsed.updatedAt,
        };
      }
    }
    // Backward compatibility with legacy storage keys
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed?.primary && parsed?.secondary) {
        return { primary: parsed.primary, secondary: parsed.secondary };
      }
    }
    const legacyP = localStorage.getItem(LEGACY_PRIMARY_KEY);
    const legacyS = localStorage.getItem(LEGACY_SECONDARY_KEY);
    if (legacyP && legacyS) {
      return { primary: legacyP, secondary: legacyS };
    }
  } catch (e) {
    console.warn('Failed to load school default theme from localStorage:', e);
  }
  return DEFAULT_THEME;
};

/**
 * Returns the personal theme override for the specified user, if any exists.
 */
export const getUserPersonalTheme = (userKey?: string): ThemeColors | null => {
  const key = getActiveUserKey(userKey);
  if (!key || key === 'default') return null;
  try {
    const saved = localStorage.getItem(USER_THEME_KEY_PREFIX + key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.primary && parsed?.secondary) {
        return {
          primary: parsed.primary,
          secondary: parsed.secondary,
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load user personal theme from localStorage:', e);
  }
  return null;
};

/**
 * Resolves which theme colors should be displayed for the active user:
 * 1. If user has a personal override -> returns user's personal theme (isUserOverride: true)
 * 2. Otherwise -> returns School Default Theme set by Admin (isUserOverride: false)
 */
export const resolveActiveTheme = (userKey?: string): { theme: ThemeColors; isUserOverride: boolean } => {
  const personal = getUserPersonalTheme(userKey);
  if (personal) {
    return { theme: personal, isUserOverride: true };
  }
  return { theme: getSchoolDefaultTheme(), isUserOverride: false };
};

/**
 * Directly injects CSS variables to document.documentElement
 */
export const applyThemeToDocument = (primaryColor: string, secondaryColor: string) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--secondary-color', secondaryColor);
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-secondary', secondaryColor);

  // Directly set sky and brand scales on root element for guaranteed dynamic reactivity
  root.style.setProperty('--color-sky-50', `color-mix(in srgb, ${primaryColor} 8%, #ffffff)`);
  root.style.setProperty('--color-sky-100', `color-mix(in srgb, ${primaryColor} 16%, #ffffff)`);
  root.style.setProperty('--color-sky-200', `color-mix(in srgb, ${primaryColor} 28%, #ffffff)`);
  root.style.setProperty('--color-sky-300', `color-mix(in srgb, ${primaryColor} 45%, #ffffff)`);
  root.style.setProperty('--color-sky-400', `color-mix(in srgb, ${primaryColor} 70%, #ffffff)`);
  root.style.setProperty('--color-sky-500', primaryColor);
  root.style.setProperty('--color-sky-600', `color-mix(in srgb, ${primaryColor} 88%, #000000)`);
  root.style.setProperty('--color-sky-700', `color-mix(in srgb, ${primaryColor} 74%, #000000)`);
  root.style.setProperty('--color-sky-800', `color-mix(in srgb, ${primaryColor} 60%, #000000)`);
  root.style.setProperty('--color-sky-900', `color-mix(in srgb, ${primaryColor} 45%, #000000)`);
  root.style.setProperty('--color-sky-950', `color-mix(in srgb, ${primaryColor} 30%, #000000)`);

  root.style.setProperty('--color-brand-50', `color-mix(in srgb, ${primaryColor} 8%, #ffffff)`);
  root.style.setProperty('--color-brand-100', `color-mix(in srgb, ${primaryColor} 16%, #ffffff)`);
  root.style.setProperty('--color-brand-200', `color-mix(in srgb, ${primaryColor} 28%, #ffffff)`);
  root.style.setProperty('--color-brand-300', `color-mix(in srgb, ${primaryColor} 45%, #ffffff)`);
  root.style.setProperty('--color-brand-400', `color-mix(in srgb, ${primaryColor} 70%, #ffffff)`);
  root.style.setProperty('--color-brand-500', primaryColor);
  root.style.setProperty('--color-brand-600', `color-mix(in srgb, ${primaryColor} 88%, #000000)`);
  root.style.setProperty('--color-brand-700', `color-mix(in srgb, ${primaryColor} 74%, #000000)`);
  root.style.setProperty('--color-brand-800', `color-mix(in srgb, ${primaryColor} 60%, #000000)`);
  root.style.setProperty('--color-brand-900', `color-mix(in srgb, ${primaryColor} 45%, #000000)`);
  root.style.setProperty('--color-brand-950', `color-mix(in srgb, ${primaryColor} 30%, #000000)`);

  // Directly set amber scale on root element
  root.style.setProperty('--color-amber-50', `color-mix(in srgb, ${secondaryColor} 8%, #ffffff)`);
  root.style.setProperty('--color-amber-100', `color-mix(in srgb, ${secondaryColor} 16%, #ffffff)`);
  root.style.setProperty('--color-amber-200', `color-mix(in srgb, ${secondaryColor} 28%, #ffffff)`);
  root.style.setProperty('--color-amber-300', `color-mix(in srgb, ${secondaryColor} 45%, #ffffff)`);
  root.style.setProperty('--color-amber-400', `color-mix(in srgb, ${secondaryColor} 70%, #ffffff)`);
  root.style.setProperty('--color-amber-500', secondaryColor);
  root.style.setProperty('--color-amber-600', `color-mix(in srgb, ${secondaryColor} 88%, #000000)`);
  root.style.setProperty('--color-amber-700', `color-mix(in srgb, ${secondaryColor} 74%, #000000)`);
  root.style.setProperty('--color-amber-800', `color-mix(in srgb, ${secondaryColor} 60%, #000000)`);
  root.style.setProperty('--color-amber-900', `color-mix(in srgb, ${secondaryColor} 45%, #000000)`);
  root.style.setProperty('--color-amber-950', `color-mix(in srgb, ${secondaryColor} 30%, #000000)`);
};

export interface ThemeContextType {
  primary: string;
  secondary: string;
  colors: ThemeColors;
  schoolDefaultTheme: ThemeColors;
  superAdminTheme: ThemeColors;
  isSuperAdminScreen: boolean;
  setIsSuperAdminScreen: (val: boolean) => void;
  isLandingPage: boolean;
  setIsLandingPage: (val: boolean) => void;
  isUserOverride: boolean;
  activeUserKey: string;
  updateColor: (key: 'primary' | 'secondary' | string, hex: string) => void;
  applyTheme: (primary?: string, secondary?: string) => Promise<void> | void;
  applySchoolDefaultTheme: (primary: string, secondary: string) => Promise<void>;
  applySuperAdminTheme: (primary: string, secondary: string) => Promise<void>;
  applyUserTheme: (primary: string, secondary: string, userKey?: string) => Promise<void>;
  resetTheme: () => Promise<void> | void;
  resetUserTheme: (userKey?: string) => Promise<void>;
  resetSchoolDefaultTheme: () => Promise<void>;
  resetSuperAdminTheme: () => Promise<void>;
  applyPreset: (primary: string, secondary: string) => void;
  refreshTheme: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  primary: DEFAULT_THEME.primary,
  secondary: DEFAULT_THEME.secondary,
  colors: DEFAULT_THEME,
  schoolDefaultTheme: DEFAULT_THEME,
  superAdminTheme: DEFAULT_THEME,
  isSuperAdminScreen: false,
  setIsSuperAdminScreen: () => {},
  isLandingPage: true,
  setIsLandingPage: () => {},
  isUserOverride: false,
  activeUserKey: 'default',
  updateColor: () => {},
  applyTheme: () => {},
  applySchoolDefaultTheme: async () => {},
  applySuperAdminTheme: async () => {},
  applyUserTheme: async () => {},
  resetTheme: () => {},
  resetUserTheme: async () => {},
  resetSchoolDefaultTheme: async () => {},
  resetSuperAdminTheme: async () => {},
  applyPreset: () => {},
  refreshTheme: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUserKey = getActiveUserKey();
  const initialResolved = resolveActiveTheme(initialUserKey);
  const initialSchoolDefault = getSchoolDefaultTheme();
  const initialSuperAdmin = getSuperAdminTheme();

  const [primary, setPrimary] = useState<string>(initialResolved.theme.primary);
  const [secondary, setSecondary] = useState<string>(initialResolved.theme.secondary);
  const [isUserOverride, setIsUserOverride] = useState<boolean>(initialResolved.isUserOverride);
  const [schoolDefaultTheme, setSchoolDefaultTheme] = useState<ThemeColors>(initialSchoolDefault);
  const [superAdminTheme, setSuperAdminTheme] = useState<ThemeColors>(initialSuperAdmin);
  const [isSuperAdminScreen, setIsSuperAdminScreen] = useState<boolean>(false);
  const [isLandingPage, setIsLandingPage] = useState<boolean>(() => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      return !token;
    } catch {
      return true;
    }
  });
  const [activeUserKey, setActiveUserKey] = useState<string>(initialUserKey);

  // Dark mode support
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply CSS variables dynamically to document.documentElement
  useEffect(() => {
    applyThemeToDocument(primary, secondary);
  }, [primary, secondary]);

  // Sync dark mode class and localStorage
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => setIsDarkMode((prev) => !prev), []);

  // Live preview / transient picker color updates
  const updateColor = useCallback((key: 'primary' | 'secondary' | string, hex: string) => {
    if (!hex) return;
    const cleanHex = (hex.startsWith('#') ? hex : `#${hex}`).toLowerCase();
    if (key === 'primary') {
      setPrimary((prev) => (prev.toLowerCase() === cleanHex ? prev : cleanHex));
    } else if (key === 'secondary') {
      setSecondary((prev) => (prev.toLowerCase() === cleanHex ? prev : cleanHex));
    }
  }, []);

  // Synchronize active colors whenever isLandingPage, isSuperAdminScreen or themes change
  useEffect(() => {
    if (isLandingPage) {
      setPrimary(DEFAULT_THEME.primary);
      setSecondary(DEFAULT_THEME.secondary);
      applyThemeToDocument(DEFAULT_THEME.primary, DEFAULT_THEME.secondary);
    } else if (isSuperAdminScreen) {
      setPrimary(superAdminTheme.primary);
      setSecondary(superAdminTheme.secondary);
      applyThemeToDocument(superAdminTheme.primary, superAdminTheme.secondary);
    } else {
      const activeSchool = isUserOverride ? getUserPersonalTheme(activeUserKey) || schoolDefaultTheme : schoolDefaultTheme;
      setPrimary(activeSchool.primary);
      setSecondary(activeSchool.secondary);
      applyThemeToDocument(activeSchool.primary, activeSchool.secondary);
    }
  }, [isLandingPage, isSuperAdminScreen, superAdminTheme, schoolDefaultTheme, isUserOverride, activeUserKey]);

  // Synchronize theme with backend API on mount or user switch
  useEffect(() => {
    let mounted = true;
    const syncBackendTheme = async () => {
      try {
        const key = getActiveUserKey();
        const data = await fetchThemeApi(key);
        if (!mounted || !data) return;

        // 1. Resolve Super Admin platform theme if returned
        if (data.superAdminTheme?.primary && data.superAdminTheme?.secondary) {
          const saTheme: ThemeColors = {
            primary: data.superAdminTheme.primary,
            secondary: data.superAdminTheme.secondary,
            updatedAt: data.superAdminTheme.updatedAt,
          };
          setSuperAdminTheme(saTheme);
          try {
            localStorage.setItem(SUPERADMIN_THEME_KEY, JSON.stringify(saTheme));
          } catch {}
        }

        // 2. Resolve authoritative School Default Theme from backend
        let effectiveSchoolDefault: ThemeColors = DEFAULT_THEME;
        if (data.schoolDefault?.primary && data.schoolDefault?.secondary) {
          effectiveSchoolDefault = {
            primary: data.schoolDefault.primary,
            secondary: data.schoolDefault.secondary,
            updatedAt: data.schoolDefault.updatedAt,
          };
          setSchoolDefaultTheme(effectiveSchoolDefault);
          try {
            localStorage.setItem(SCHOOL_DEFAULT_THEME_KEY, JSON.stringify(effectiveSchoolDefault));
            localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify(effectiveSchoolDefault));
            localStorage.setItem(LEGACY_PRIMARY_KEY, effectiveSchoolDefault.primary);
            localStorage.setItem(LEGACY_SECONDARY_KEY, effectiveSchoolDefault.secondary);
          } catch {}
        } else {
          setSchoolDefaultTheme(DEFAULT_THEME);
          try {
            localStorage.setItem(SCHOOL_DEFAULT_THEME_KEY, JSON.stringify(DEFAULT_THEME));
            localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify(DEFAULT_THEME));
            localStorage.setItem(LEGACY_PRIMARY_KEY, DEFAULT_THEME.primary);
            localStorage.setItem(LEGACY_SECONDARY_KEY, DEFAULT_THEME.secondary);
          } catch {}
        }

        // 2. Resolve User Override or enforce School Default (prevent stale local colors from sticking)
        if (data.isUserOverride && data.userTheme?.primary && data.userTheme?.secondary) {
          const uTheme: ThemeColors = {
            primary: data.userTheme.primary,
            secondary: data.userTheme.secondary,
            updatedAt: data.userTheme.updatedAt,
          };
          setPrimary(uTheme.primary);
          setSecondary(uTheme.secondary);
          setIsUserOverride(true);
          applyThemeToDocument(uTheme.primary, uTheme.secondary);
          if (key && key !== 'default') {
            try {
              localStorage.setItem(USER_THEME_KEY_PREFIX + key, JSON.stringify(uTheme));
            } catch {}
          }
        } else {
          // User has NO backend override -> discard stale local personal colors and adopt school default
          if (key && key !== 'default') {
            try {
              localStorage.removeItem(USER_THEME_KEY_PREFIX + key);
            } catch {}
          }
          setPrimary(effectiveSchoolDefault.primary);
          setSecondary(effectiveSchoolDefault.secondary);
          setIsUserOverride(false);
          applyThemeToDocument(effectiveSchoolDefault.primary, effectiveSchoolDefault.secondary);
        }
      } catch (err) {
        console.warn('Backend theme sync notice:', err);
      }
    };

    syncBackendTheme();
    return () => {
      mounted = false;
    };
  }, [activeUserKey]);

  /**
   * Admin-only / System action: Sets the School Default Theme.
   * This theme is persisted to the backend API and displayed to ALL users across all devices.
   */
  const applySchoolDefaultTheme = useCallback(async (newPrimary: string, newSecondary: string): Promise<void> => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    const updatedTheme: ThemeColors = {
      primary: p,
      secondary: s,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SCHOOL_DEFAULT_THEME_KEY, JSON.stringify(updatedTheme));
      localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify({ primary: p, secondary: s }));
      localStorage.setItem(LEGACY_PRIMARY_KEY, p);
      localStorage.setItem(LEGACY_SECONDARY_KEY, s);

      // If active user had a personal override, clear it so their view matches the new school default
      const currentKey = getActiveUserKey();
      if (currentKey && currentKey !== 'default') {
        localStorage.removeItem(USER_THEME_KEY_PREFIX + currentKey);
      }
    } catch (e) {
      console.error('Failed to save school default theme to localStorage:', e);
    }

    setSchoolDefaultTheme(updatedTheme);
    setPrimary(p);
    setSecondary(s);
    setIsUserOverride(false);
    applyThemeToDocument(p, s);

    // Persist to backend database API
    try {
      await updateSchoolDefaultThemeApi({ primary: p, secondary: s });
    } catch (err) {
      console.warn('Failed to persist school default theme to backend API:', err);
      throw err;
    }

    // Broadcast change to all open components and tabs
    try {
      window.dispatchEvent(new CustomEvent('school_theme_changed', { detail: updatedTheme }));
    } catch {}
  }, [primary, secondary]);

  /**
   * SuperAdmin-only action: Sets the Super Admin Platform Theme.
   * This theme is persisted to the backend API and applied ONLY to Super Admin screens.
   * DOES NOT modify or overwrite the school-wide default theme.
   */
  const applySuperAdminTheme = useCallback(async (newPrimary: string, newSecondary: string): Promise<void> => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    const updatedTheme: ThemeColors = {
      primary: p,
      secondary: s,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SUPERADMIN_THEME_KEY, JSON.stringify(updatedTheme));
    } catch (e) {
      console.error('Failed to save superadmin theme to localStorage:', e);
    }

    setSuperAdminTheme(updatedTheme);
    if (isSuperAdminScreen) {
      setPrimary(p);
      setSecondary(s);
      applyThemeToDocument(p, s);
    }

    try {
      await updateSuperAdminThemeApi({ primary: p, secondary: s });
    } catch (err) {
      console.warn('Failed to persist superadmin theme to backend API:', err);
    }

    try {
      window.dispatchEvent(new CustomEvent('superadmin_theme_changed', { detail: updatedTheme }));
    } catch {}
  }, [primary, secondary, isSuperAdminScreen]);

  /**
   * SuperAdmin action: Resets Super Admin theme back to system default.
   */
  const resetSuperAdminTheme = useCallback(async (): Promise<void> => {
    const defaultTheme: ThemeColors = {
      ...DEFAULT_THEME,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.removeItem(SUPERADMIN_THEME_KEY);
    } catch (e) {}

    setSuperAdminTheme(defaultTheme);
    if (isSuperAdminScreen) {
      setPrimary(defaultTheme.primary);
      setSecondary(defaultTheme.secondary);
      applyThemeToDocument(defaultTheme.primary, defaultTheme.secondary);
    }

    try {
      await resetSuperAdminThemeApi();
    } catch (err) {
      console.warn('Failed to reset superadmin theme on backend API:', err);
    }

    try {
      window.dispatchEvent(new CustomEvent('superadmin_theme_changed', { detail: defaultTheme }));
    } catch {}
  }, [isSuperAdminScreen]);

  /**
   * User action: Sets a personal theme for this user account.
   * Applies only within this user's screen; DOES NOT affect other users.
   */
  const applyUserTheme = useCallback(async (newPrimary: string, newSecondary: string, targetKey?: string): Promise<void> => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    const key = targetKey || getActiveUserKey();
    const updatedTheme: ThemeColors = {
      primary: p,
      secondary: s,
      updatedAt: new Date().toISOString(),
    };

    if (key && key !== 'default') {
      try {
        localStorage.setItem(USER_THEME_KEY_PREFIX + key, JSON.stringify(updatedTheme));
      } catch (e) {
        console.error('Failed to save user personal theme to localStorage:', e);
      }
    }

    setPrimary(p);
    setSecondary(s);
    setIsUserOverride(true);
    applyThemeToDocument(p, s);

    // Persist to backend database API
    try {
      await updateUserThemeApi({ primary: p, secondary: s, userKey: key });
    } catch (err) {
      console.warn('Failed to persist user theme to backend API:', err);
      throw err;
    }

    try {
      window.dispatchEvent(
        new CustomEvent('user_theme_changed', {
          detail: { ...updatedTheme, userKey: key },
        })
      );
    } catch {}
  }, [primary, secondary]);

  /**
   * Generic applyTheme fallback: applies as personal user theme.
   */
  const applyTheme = useCallback((newPrimary?: string, newSecondary?: string) => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    return applyUserTheme(p, s);
  }, [primary, secondary, applyUserTheme]);

  /**
   * User action: Clears personal theme override and restores the School Default Theme.
   */
  const resetUserTheme = useCallback(async (targetKey?: string): Promise<void> => {
    const key = targetKey || getActiveUserKey();
    if (key && key !== 'default') {
      try {
        localStorage.removeItem(USER_THEME_KEY_PREFIX + key);
      } catch (e) {}
    }

    const defaultTheme = schoolDefaultTheme || getSchoolDefaultTheme();
    setPrimary(defaultTheme.primary);
    setSecondary(defaultTheme.secondary);
    setIsUserOverride(false);
    applyThemeToDocument(defaultTheme.primary, defaultTheme.secondary);

    // Persist reset to backend database API
    try {
      await resetUserThemeApi(key);
    } catch (err) {
      console.warn('Failed to reset user theme on backend API:', err);
      throw err;
    }

    try {
      window.dispatchEvent(
        new CustomEvent('user_theme_changed', {
          detail: { ...defaultTheme, userKey: key, reset: true },
        })
      );
    } catch {}
  }, [schoolDefaultTheme]);

  /**
   * Admin action: Resets the School Default Theme back to the original Sky & Amber system default.
   */
  const resetSchoolDefaultTheme = useCallback(async (): Promise<void> => {
    const defaultTheme: ThemeColors = {
      ...DEFAULT_THEME,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SCHOOL_DEFAULT_THEME_KEY, JSON.stringify(defaultTheme));
      localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify(DEFAULT_THEME));
      localStorage.setItem(LEGACY_PRIMARY_KEY, DEFAULT_THEME.primary);
      localStorage.setItem(LEGACY_SECONDARY_KEY, DEFAULT_THEME.secondary);

      const currentKey = getActiveUserKey();
      if (currentKey && currentKey !== 'default') {
        localStorage.removeItem(USER_THEME_KEY_PREFIX + currentKey);
      }
    } catch (e) {
      console.error('Failed to reset school default theme:', e);
    }

    setSchoolDefaultTheme(defaultTheme);
    setPrimary(DEFAULT_THEME.primary);
    setSecondary(DEFAULT_THEME.secondary);
    setIsUserOverride(false);
    applyThemeToDocument(DEFAULT_THEME.primary, DEFAULT_THEME.secondary);

    // Persist reset to backend database API
    try {
      await resetSchoolDefaultThemeApi();
    } catch (err) {
      console.warn('Failed to reset school default theme on backend API:', err);
      throw err;
    }

    try {
      window.dispatchEvent(new CustomEvent('school_theme_changed', { detail: defaultTheme }));
    } catch {}
  }, []);

  const resetTheme = useCallback(() => {
    if (isUserOverride) {
      resetUserTheme();
    } else {
      resetSchoolDefaultTheme();
    }
  }, [isUserOverride, resetUserTheme, resetSchoolDefaultTheme]);

  const applyPreset = useCallback((newPrimary: string, newSecondary: string) => {
    if (newPrimary) setPrimary(newPrimary);
    if (newSecondary) setSecondary(newSecondary);
  }, []);

  // Re-evaluates active theme based on current auth user and localStorage state
  const refreshTheme = useCallback(() => {
    const key = getActiveUserKey();
    setActiveUserKey(key);
    const resolved = resolveActiveTheme(key);
    const currentDefault = getSchoolDefaultTheme();
    setSchoolDefaultTheme(currentDefault);
    setPrimary(resolved.theme.primary);
    setSecondary(resolved.theme.secondary);
    setIsUserOverride(resolved.isUserOverride);
    applyThemeToDocument(resolved.theme.primary, resolved.theme.secondary);
  }, []);

  // Multi-tab, auth changes, and custom events listeners
  useEffect(() => {
    const handleSchoolThemeChange = (e: any) => {
      const newSchoolTheme = e?.detail || getSchoolDefaultTheme();
      setSchoolDefaultTheme(newSchoolTheme);

      // If current user does NOT have a personal override, apply school default immediately
      const currentKey = getActiveUserKey();
      const personalTheme = getUserPersonalTheme(currentKey);
      if (!personalTheme) {
        setPrimary(newSchoolTheme.primary);
        setSecondary(newSchoolTheme.secondary);
        setIsUserOverride(false);
        applyThemeToDocument(newSchoolTheme.primary, newSchoolTheme.secondary);
      }
    };

    const handleUserThemeChange = (e: any) => {
      const currentKey = getActiveUserKey();
      const targetKey = e?.detail?.userKey;
      if (!targetKey || targetKey === currentKey) {
        const resolved = resolveActiveTheme(currentKey);
        setPrimary(resolved.theme.primary);
        setSecondary(resolved.theme.secondary);
        setIsUserOverride(resolved.isUserOverride);
        applyThemeToDocument(resolved.theme.primary, resolved.theme.secondary);
      }
    };

    const handleAuthChange = () => {
      refreshTheme();
    };

    const handleSuperAdminThemeChange = (e: any) => {
      const newSaTheme = e?.detail || getSuperAdminTheme();
      setSuperAdminTheme(newSaTheme);
      if (isSuperAdminScreen) {
        setPrimary(newSaTheme.primary);
        setSecondary(newSaTheme.secondary);
        applyThemeToDocument(newSaTheme.primary, newSaTheme.secondary);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key) {
        refreshTheme();
        return;
      }
      if (e.key === SUPERADMIN_THEME_KEY) {
        handleSuperAdminThemeChange({ detail: getSuperAdminTheme() });
      } else if (e.key === SCHOOL_DEFAULT_THEME_KEY || e.key === LEGACY_THEME_KEY) {
        handleSchoolThemeChange({ detail: getSchoolDefaultTheme() });
      } else if (e.key === 'auth_user' || e.key === 'auth_token') {
        refreshTheme();
      } else if (e.key.startsWith(USER_THEME_KEY_PREFIX)) {
        const currentKey = getActiveUserKey();
        if (e.key === USER_THEME_KEY_PREFIX + currentKey) {
          refreshTheme();
        }
      }
    };

    window.addEventListener('school_theme_changed', handleSchoolThemeChange);
    window.addEventListener('superadmin_theme_changed', handleSuperAdminThemeChange);
    window.addEventListener('user_theme_changed', handleUserThemeChange);
    window.addEventListener('auth_user_changed', handleAuthChange);
    window.addEventListener('auth_login', handleAuthChange);
    window.addEventListener('auth_logout', handleAuthChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('school_theme_changed', handleSchoolThemeChange);
      window.removeEventListener('superadmin_theme_changed', handleSuperAdminThemeChange);
      window.removeEventListener('user_theme_changed', handleUserThemeChange);
      window.removeEventListener('auth_user_changed', handleAuthChange);
      window.removeEventListener('auth_login', handleAuthChange);
      window.removeEventListener('auth_logout', handleAuthChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshTheme, isSuperAdminScreen]);

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      primary,
      secondary,
      colors: { primary, secondary },
      schoolDefaultTheme,
      superAdminTheme,
      isSuperAdminScreen,
      setIsSuperAdminScreen,
      isLandingPage,
      setIsLandingPage,
      isUserOverride,
      activeUserKey,
      updateColor,
      applyTheme,
      applySchoolDefaultTheme,
      applySuperAdminTheme,
      applyUserTheme,
      resetTheme,
      resetUserTheme,
      resetSchoolDefaultTheme,
      resetSuperAdminTheme,
      applyPreset,
      refreshTheme,
      isDarkMode,
      toggleDarkMode,
    }),
    [
      primary,
      secondary,
      schoolDefaultTheme,
      superAdminTheme,
      isSuperAdminScreen,
      isLandingPage,
      isUserOverride,
      activeUserKey,
      updateColor,
      applyTheme,
      applySchoolDefaultTheme,
      applySuperAdminTheme,
      applyUserTheme,
      resetTheme,
      resetUserTheme,
      resetSchoolDefaultTheme,
      resetSuperAdminTheme,
      applyPreset,
      refreshTheme,
      isDarkMode,
      toggleDarkMode,
    ]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
