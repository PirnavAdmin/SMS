import { apiClient } from './client';

export interface ThemeColorsResponse {
  primary?: string;
  secondary?: string;
  updatedAt?: string;
}

export interface ThemeApiResponse {
  schoolDefault: ThemeColorsResponse | null;
  userTheme: ThemeColorsResponse | null;
  effectiveTheme: ThemeColorsResponse | null;
  isUserOverride: boolean;
  activeUserKey: string;
}

/**
 * Fetch active theme configuration from backend API.
 */
export const fetchThemeApi = async (userKey?: string): Promise<ThemeApiResponse | null> => {
  const query = userKey ? `?userKey=${encodeURIComponent(userKey)}` : '';
  try {
    const res = await apiClient(`/api/Theme${query}`, { method: 'GET' });
    if (res && res.success && res.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.warn('Backend theme fetch warning (using cached/fallback theme):', error);
    return null;
  }
};

/**
 * Set school-wide default theme (for all users).
 */
export const updateSchoolDefaultThemeApi = async (payload: {
  primary: string;
  secondary: string;
}) => {
  return apiClient('/api/Theme/school-default', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Reset school-wide default theme to system default (Sky & Amber).
 */
export const resetSchoolDefaultThemeApi = async () => {
  return apiClient('/api/Theme/school-default/reset', {
    method: 'POST',
  });
};

/**
 * Set user personal theme override.
 */
export const updateUserThemeApi = async (payload: {
  primary: string;
  secondary: string;
  userKey?: string;
}) => {
  return apiClient('/api/Theme/user', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Reset user personal theme override to school default.
 */
export const resetUserThemeApi = async (userKey?: string) => {
  const query = userKey ? `?userKey=${encodeURIComponent(userKey)}` : '';
  return apiClient(`/api/Theme/user/reset${query}`, {
    method: 'POST',
  });
};
