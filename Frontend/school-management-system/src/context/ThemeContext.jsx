import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const DEFAULT_THEME = {
  primary: '#0284c7',
  secondary: '#f59e0b',
};

export const SCHOOL_DEFAULT_THEME_KEY = 'school_default_theme';
export const USER_THEME_KEY_PREFIX = 'user_theme_';
export const LEGACY_THEME_KEY = 'theme_colors';
export const LEGACY_PRIMARY_KEY = 'theme_primary';
export const LEGACY_SECONDARY_KEY = 'theme_secondary';

export const getActiveUserKey = (emailOrId) => {
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

export const getSchoolDefaultTheme = () => {
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

export const getUserPersonalTheme = (userKey) => {
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

export const resolveActiveTheme = (userKey) => {
  const personal = getUserPersonalTheme(userKey);
  if (personal) {
    return { theme: personal, isUserOverride: true };
  }
  return { theme: getSchoolDefaultTheme(), isUserOverride: false };
};

export const applyThemeToDocument = (primaryColor, secondaryColor) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--secondary-color', secondaryColor);
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-secondary', secondaryColor);
};

export const ThemeContext = createContext({
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

export const ThemeProvider = ({ children }) => {
  const initialUserKey = getActiveUserKey();
  const initialResolved = resolveActiveTheme(initialUserKey);
  const initialSchoolDefault = getSchoolDefaultTheme();

  const [primary, setPrimary] = useState(initialResolved.theme.primary);
  const [secondary, setSecondary] = useState(initialResolved.theme.secondary);
  const [isUserOverride, setIsUserOverride] = useState(initialResolved.isUserOverride);
  const [schoolDefaultTheme, setSchoolDefaultTheme] = useState(initialSchoolDefault);
  const [activeUserKey, setActiveUserKey] = useState(initialUserKey);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    applyThemeToDocument(primary, secondary);
  }, [primary, secondary]);

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

  const updateColor = (key, hex) => {
    if (!hex) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    if (key === 'primary') {
      setPrimary(cleanHex);
    } else if (key === 'secondary') {
      setSecondary(cleanHex);
    }
  };

  const applySchoolDefaultTheme = (newPrimary, newSecondary) => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    const updatedTheme = {
      primary: p,
      secondary: s,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SCHOOL_DEFAULT_THEME_KEY, JSON.stringify(updatedTheme));
      localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify({ primary: p, secondary: s }));
      localStorage.setItem(LEGACY_PRIMARY_KEY, p);
      localStorage.setItem(LEGACY_SECONDARY_KEY, s);

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

    try {
      window.dispatchEvent(new CustomEvent('school_theme_changed', { detail: updatedTheme }));
    } catch {}
  };

  const applyUserTheme = (newPrimary, newSecondary, targetKey) => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    const key = targetKey || getActiveUserKey();
    const updatedTheme = {
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

  const applyTheme = (newPrimary, newSecondary) => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    applyUserTheme(p, s);
  };

  const resetUserTheme = (targetKey) => {
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

  const resetSchoolDefaultTheme = () => {
    const defaultTheme = {
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

  const applyPreset = (newPrimary, newSecondary) => {
    if (newPrimary) setPrimary(newPrimary);
    if (newSecondary) setSecondary(newSecondary);
  };

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

  useEffect(() => {
    const handleSchoolThemeChange = (e) => {
      const newSchoolTheme = e?.detail || getSchoolDefaultTheme();
      setSchoolDefaultTheme(newSchoolTheme);

      const currentKey = getActiveUserKey();
      const personalTheme = getUserPersonalTheme(currentKey);
      if (!personalTheme) {
        setPrimary(newSchoolTheme.primary);
        setSecondary(newSchoolTheme.secondary);
        setIsUserOverride(false);
        applyThemeToDocument(newSchoolTheme.primary, newSchoolTheme.secondary);
      }
    };

    const handleUserThemeChange = (e) => {
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

    const handleStorage = (e) => {
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

  const contextValue = {
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
