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
