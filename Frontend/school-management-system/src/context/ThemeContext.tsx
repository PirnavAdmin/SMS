import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
}

export const DEFAULT_THEME: ThemeColors = {
  primary: '#0284c7',
  secondary: '#f59e0b',
};

export interface ThemeContextType {
  primary: string;
  secondary: string;
  colors: ThemeColors;
  updateColor: (key: 'primary' | 'secondary' | string, hex: string) => void;
  applyTheme: (primary?: string, secondary?: string) => void;
  resetTheme: () => void;
  applyPreset: (primary: string, secondary: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const STORAGE_KEY = 'theme_colors';

export const applyThemeToDocument = (primaryColor: string, secondaryColor: string) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--secondary-color', secondaryColor);
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-secondary', secondaryColor);
};

export const ThemeContext = createContext<ThemeContextType>({
  primary: DEFAULT_THEME.primary,
  secondary: DEFAULT_THEME.secondary,
  colors: DEFAULT_THEME,
  updateColor: () => {},
  applyTheme: () => {},
  resetTheme: () => {},
  applyPreset: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Dual-color theme states
  const [primary, setPrimary] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('theme_primary');
      if (saved) return saved;
      const savedJson = localStorage.getItem(STORAGE_KEY);
      if (savedJson) {
        const parsed = JSON.parse(savedJson);
        if (parsed?.primary) return parsed.primary;
      }
    } catch (e) {
      console.warn('Failed to load primary color from localStorage:', e);
    }
    return DEFAULT_THEME.primary;
  });

  const [secondary, setSecondary] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('theme_secondary');
      if (saved) return saved;
      const savedJson = localStorage.getItem(STORAGE_KEY);
      if (savedJson) {
        const parsed = JSON.parse(savedJson);
        if (parsed?.secondary) return parsed.secondary;
      }
    } catch (e) {
      console.warn('Failed to load secondary color from localStorage:', e);
    }
    return DEFAULT_THEME.secondary;
  });

  // 2. Dark mode support for existing components
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply CSS variables dynamically to document.documentElement.style and sync with localStorage
  useEffect(() => {
    applyThemeToDocument(primary, secondary);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary, secondary }));
      localStorage.setItem('theme_primary', primary);
      localStorage.setItem('theme_secondary', secondary);
    } catch (e) {
      console.error('Failed to sync theme colors to localStorage:', e);
    }
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

  // Helper functions
  const updateColor = (key: 'primary' | 'secondary' | string, hex: string) => {
    if (!hex) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    if (key === 'primary') {
      setPrimary(cleanHex);
    } else if (key === 'secondary') {
      setSecondary(cleanHex);
    }
  };

  const applyTheme = (newPrimary?: string, newSecondary?: string) => {
    const p = newPrimary || primary;
    const s = newSecondary || secondary;
    setPrimary(p);
    setSecondary(s);
    applyThemeToDocument(p, s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: p, secondary: s }));
      localStorage.setItem('theme_primary', p);
      localStorage.setItem('theme_secondary', s);
    } catch (e) {
      console.error('Failed to save theme colors:', e);
    }
  };

  const resetTheme = () => {
    setPrimary(DEFAULT_THEME.primary);
    setSecondary(DEFAULT_THEME.secondary);
    applyThemeToDocument(DEFAULT_THEME.primary, DEFAULT_THEME.secondary);
  };

  const applyPreset = (newPrimary: string, newSecondary: string) => {
    if (newPrimary) setPrimary(newPrimary);
    if (newSecondary) setSecondary(newSecondary);
  };

  const contextValue: ThemeContextType = {
    primary,
    secondary,
    colors: { primary, secondary },
    updateColor,
    applyTheme,
    resetTheme,
    applyPreset,
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
