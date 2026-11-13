import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
  updatedAt?: string;
}

export const DEFAULT_THEME: ThemeColors = {
  primary: '#0284c7',
  secondary: '#f59e0b',
};

export const SCHOOL_DEFAULT_THEME_KEY = 'school_default_theme';
export const USER_THEME_KEY_PREFIX = 'user_theme_';
export const LEGACY_THEME_KEY = 'theme_colors';
export const LEGACY_PRIMARY_KEY = 'theme_primary';
export const LEGACY_SECONDARY_KEY = 'theme_secondary';

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
};

export interface ThemeContextType {
  primary: string;
  secondary: string;
  colors: ThemeColors;
  schoolDefaultTheme: ThemeColors;
  isUserOverride: boolean;
  activeUserKey: string;
  updateColor: (key: 'primary' | 'secondary' | string, hex: string) => void;
  applyTheme: (primary?: string, secondary?: string) => void;
  applySchoolDefaultTheme: (primary: string, secondary: string) => void;
  applyUserTheme: (primary: string, secondary: string, userKey?: string) => void;
  resetTheme: () => void;
  resetUserTheme: (userKey?: string) => void;
  resetSchoolDefaultTheme: () => void;
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
  isUserOverride: false,
  activeUserKey: 'default',
  updateColor: () => {},
  applyTheme: () => {},
  applySchoolDefaultTheme: () => {},
  applyUserTheme: () => {},
  resetTheme: () => {},
  resetUserTheme: () => {},
  resetSchoolDefaultTheme: () => {},
  applyPreset: () => {},
  refreshTheme: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUserKey = getActiveUserKey();
  const initialResolved = resolveActiveTheme(initialUserKey);
  const initialSchoolDefault = getSchoolDefaultTheme();

  const [primary, setPrimary] = useState<string>(initialResolved.theme.primary);
  const [secondary, setSecondary] = useState<string>(initialResolved.theme.secondary);
  const [isUserOverride, setIsUserOverride] = useState<boolean>(initialResolved.isUserOverride);
  const [schoolDefaultTheme, setSchoolDefaultTheme] = useState<ThemeColors>(initialSchoolDefault);
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

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Live preview / transient picker color updates
  const updateColor = (key: 'primary' | 'secondary' | string, hex: string) => {
    if (!hex) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    if (key === 'primary') {
      setPrimary(cleanHex);
    } else if (key === 'secondary') {
      setSecondary(cleanHex);
    }
  };

  /**
   * Admin-only / System action: Sets the School Default Theme.
   * This theme is displayed to ALL users by default across the entire portal.
   */
  const applySchoolDefaultTheme = (newPrimary: string, newSecondary: string) => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    const updatedTheme: ThemeColors = {
      primary: p,
      secondary: s,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SCHOOL_DEFAULT_THEME_KEY, JSON.stringify(updatedTheme));
      // Sync legacy keys for backward compatibility and unauthenticated views (Login, Landing)
      localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify({ primary: p, secondary: s }));
      localStorage.setItem(LEGACY_PRIMARY_KEY, p);
      localStorage.setItem(LEGACY_SECONDARY_KEY, s);

      // If current user had a personal override, clear it so their view matches the new school default
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

    // Broadcast change to all open components and tabs
    try {
      window.dispatchEvent(new CustomEvent('school_theme_changed', { detail: updatedTheme }));
    } catch {}
  };

  /**
   * User action: Sets a personal theme for this user account.
   * Applies only within this user's screen; DOES NOT affect other users.
   */
  const applyUserTheme = (newPrimary: string, newSecondary: string, targetKey?: string) => {
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

    try {
      window.dispatchEvent(
        new CustomEvent('user_theme_changed', {
          detail: { ...updatedTheme, userKey: key },
        })
      );
    } catch {}
  };

  /**
   * Generic applyTheme fallback: applies as personal user theme.
   */
  const applyTheme = (newPrimary?: string, newSecondary?: string) => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    applyUserTheme(p, s);
  };

  /**
   * User action: Clears personal theme override and restores the School Default Theme.
   */
  const resetUserTheme = (targetKey?: string) => {
    const key = targetKey || getActiveUserKey();
    if (key && key !== 'default') {
      try {
        localStorage.removeItem(USER_THEME_KEY_PREFIX + key);
      } catch (e) {}
    }

    const defaultTheme = getSchoolDefaultTheme();
    setPrimary(defaultTheme.primary);
    setSecondary(defaultTheme.secondary);
    setIsUserOverride(false);
    applyThemeToDocument(defaultTheme.primary, defaultTheme.secondary);

    try {
      window.dispatchEvent(
        new CustomEvent('user_theme_changed', {
          detail: { ...defaultTheme, userKey: key, reset: true },
        })
      );
    } catch {}
  };

  /**
   * Admin action: Resets the School Default Theme back to the original Sky & Amber system default.
   */
  const resetSchoolDefaultTheme = () => {
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

    try {
      window.dispatchEvent(new CustomEvent('school_theme_changed', { detail: defaultTheme }));
    } catch {}
  };

  const resetTheme = () => {
    if (isUserOverride) {
      resetUserTheme();
    } else {
      resetSchoolDefaultTheme();
    }
  };

  const applyPreset = (newPrimary: string, newSecondary: string) => {
    if (newPrimary) setPrimary(newPrimary);
    if (newSecondary) setSecondary(newSecondary);
  };

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

    const handleStorage = (e: StorageEvent) => {
      if (!e.key) {
        refreshTheme();
        return;
      }
      if (e.key === SCHOOL_DEFAULT_THEME_KEY || e.key === LEGACY_THEME_KEY) {
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
    window.addEventListener('user_theme_changed', handleUserThemeChange);
    window.addEventListener('auth_user_changed', handleAuthChange);
    window.addEventListener('auth_login', handleAuthChange);
    window.addEventListener('auth_logout', handleAuthChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('school_theme_changed', handleSchoolThemeChange);
      window.removeEventListener('user_theme_changed', handleUserThemeChange);
      window.removeEventListener('auth_user_changed', handleAuthChange);
      window.removeEventListener('auth_login', handleAuthChange);
      window.removeEventListener('auth_logout', handleAuthChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshTheme]);

  const contextValue: ThemeContextType = {
    primary,
    secondary,
    colors: { primary, secondary },
    schoolDefaultTheme,
    isUserOverride,
    activeUserKey,
    updateColor,
    applyTheme,
    applySchoolDefaultTheme,
    applyUserTheme,
    resetTheme,
    resetUserTheme,
    resetSchoolDefaultTheme,
    applyPreset,
    refreshTheme,
    isDarkMode,
    toggleDarkMode,
  };

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
