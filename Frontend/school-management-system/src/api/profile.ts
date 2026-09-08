import { apiClient } from './client';

export interface UserProfileData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  branch: string;
  role: string;
  status: string;
}

// Helper to get active user identifier key
export const getActiveUserKey = (emailOrId?: string): string => {
  if (emailOrId && typeof emailOrId === 'string' && emailOrId.trim()) {
    return emailOrId.trim().toLowerCase();
  }
  try {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.email) return parsed.email.trim().toLowerCase();
      if (parsed?.id) return String(parsed.id).trim().toLowerCase();
    }
  } catch {}
  return 'current_user';
};

// Read user-scoped profile from local storage
export const getLocalUserProfile = (userKey?: string): UserProfileData | null => {
  const key = getActiveUserKey(userKey);
  try {
    const stored = localStorage.getItem(`user_profile_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return null;
};

// Save user-scoped profile to local storage
export const saveLocalUserProfile = (profileData: Partial<UserProfileData>, userKey?: string): void => {
  const key = getActiveUserKey(userKey || profileData.email);
  try {
    const existing = getLocalUserProfile(key) || {
      name: '',
      email: '',
      phone: '',
      avatar: '',
      branch: 'Main Campus',
      role: 'Admin',
      status: 'Active Account',
    };
    const updated = {
      ...existing,
      ...profileData,
    };
    localStorage.setItem(`user_profile_${key}`, JSON.stringify(updated));
  } catch {}
};

export const fetchUserProfileApi = async (userEmailOrId?: string) => {
  const key = getActiveUserKey(userEmailOrId);

  // 1. Try dedicated backend endpoint
  try {
    const res = await apiClient('/api/Settings/profile', {
      method: 'GET',
    });
    const backendData = res?.data || res;
    if (backendData && (backendData.name || backendData.avatar || backendData.email)) {
      // Cache locally for this specific user
      saveLocalUserProfile(backendData, key);
      return {
        success: true,
        data: backendData,
      };
    }
  } catch (err: any) {
    // CRITICAL: If backend endpoint is not found (404) or server is unreachable,
    // DO NOT fallback to /api/Settings!
    // /api/Settings returns SchoolSettings (Principal Name "Dr. Eleanor Vance", School Email, School Logo)
    // which must NEVER overwrite a user's personal profile or corrupt other accounts.
  }

  // 2. Return user-scoped profile from local storage if previously saved
  const localData = getLocalUserProfile(key);
  if (localData && (localData.name || localData.avatar)) {
    return {
      success: true,
      data: localData,
    };
  }

  // 3. If no custom profile saved yet, return null data so caller preserves current user credentials
  return {
    success: true,
    data: null,
  };
};

export const updateUserProfileApi = async (profileData: Partial<UserProfileData>) => {
  const key = getActiveUserKey(profileData.email);

  // Always persist locally for this specific user first
  saveLocalUserProfile(profileData, key);

  // Try saving to backend profile endpoint if available
  try {
    const res = await apiClient('/api/Settings/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    return res || { success: true, data: profileData };
  } catch (err: any) {
    // CRITICAL: DO NOT fallback to /api/Settings!
    // That would overwrite the school's principal name, school email, and school branding.
    return {
      success: true,
      data: profileData,
    };
  }
};

export const uploadUserProfileImageApi = async (file: File): Promise<{ success: boolean; avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = (import.meta.env.VITE_API_URL as string) || '';

  // 1. Try dedicated profile upload on backend
  try {
    const res = await fetch(`${baseUrl}/api/Settings/profile/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      const avatarUrl = data?.avatarUrl || data?.data?.avatarUrl || data?.url;
      if (avatarUrl) {
        return { success: true, avatarUrl };
      }
    }
  } catch (err) {}

  // 2. Try local server if running locally
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    try {
      const localRes = await fetch('http://127.0.0.1:5151/api/Settings/profile/upload', {
        method: 'POST',
        headers,
        body: formData,
      });
      if (localRes.ok) {
        const data = await localRes.json();
        const avatarUrl = data?.avatarUrl || data?.data?.avatarUrl || data?.url;
        if (avatarUrl) return { success: true, avatarUrl };
      }
    } catch {}
  }

  // 3. Resilient fallback: Convert file to Base64 Data URL.
  // CRITICAL: NEVER call /api/Settings/logo/upload! That would replace the School Logo!
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({
        success: true,
        avatarUrl: dataUrl,
      });
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };
    reader.readAsDataURL(file);
  });
};
