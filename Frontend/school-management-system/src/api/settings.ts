import { apiClient } from './client';

export const fetchSchoolSettingsApi = async () => {
  return apiClient('/api/Settings', { method: 'GET' });
};

export const updateSchoolSettingsApi = async (payload: any) => {
  return apiClient('/api/Settings', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const uploadSchoolLogoApi = async (logoData: string, logoFormat?: string) => {
  return apiClient('/api/Settings/logo', {
    method: 'POST',
    body: JSON.stringify({ logoData, logoFormat })
  });
};

export const uploadSchoolLogoFileApi = async (file: File) => {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = (import.meta.env.VITE_API_URL as string) || '';
  const url = `${baseUrl}/api/Settings/logo/upload`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed with status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (url.includes('ngrok') && (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
      const fallbackUrl = `http://127.0.0.1:5151/api/Settings/logo/upload`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
    throw err;
  }
};

export const updateCertificateTemplatesApi = async (templates: any) => {
  return apiClient('/api/Settings/certificate-templates', {
    method: 'POST',
    body: JSON.stringify(templates)
  });
};

export const updateCampusesApi = async (campuses: any) => {
  return apiClient('/api/Settings/campuses', {
    method: 'POST',
    body: JSON.stringify(campuses)
  });
};

// ============================
// BRANCHES / CAMPUS MASTER APIs
// ============================

export const fetchBranchesApi = async () => {
  return apiClient('/api/Branches', { method: 'GET' });
};

export const createBranchApi = async (payload: any) => {
  return apiClient('/api/Branches', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateBranchApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteBranchApi = async (id: number | string) => {
  return apiClient(`/api/Branches/${id}`, {
    method: 'DELETE'
  });
};

// ============================
// ACADEMIC YEARS APIs
// ============================

export const fetchAcademicYearsApi = async () => {
  return apiClient('/api/AcademicYears', { method: 'GET' });
};

export const createAcademicYearApi = async (payload: any) => {
  return apiClient('/api/AcademicYears', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateAcademicYearApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/AcademicYears/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteAcademicYearApi = async (id: number | string) => {
  return apiClient(`/api/AcademicYears/${id}`, {
    method: 'DELETE'
  });
};
