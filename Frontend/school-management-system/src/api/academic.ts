import { apiClient } from './client';

// ============================
// DEPARTMENTS API
// ============================

export const fetchDepartmentsApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/departments${query}`, { method: 'GET' });
};

export const fetchDepartmentsDropdownApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/departments/dropdown${query}`, { method: 'GET' });
};

export const fetchDepartmentByIdApi = async (id: number | string) => {
  return apiClient(`/api/departments/${id}`, { method: 'GET' });
};

export const fetchDepartmentSubjectsApi = async (id: number | string) => {
  return apiClient(`/api/departments/${id}/subjects`, { method: 'GET' });
};

export const createDepartmentApi = async (payload: {
  departmentName: string;
  departmentCode: string;
  description?: string;
  status: string;
}) => {
  return apiClient('/api/departments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateDepartmentApi = async (id: number | string, payload: {
  departmentName: string;
  departmentCode: string;
  description?: string;
  status: string;
}) => {
  return apiClient(`/api/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteDepartmentApi = async (id: number | string) => {
  return apiClient(`/api/departments/${id}`, { method: 'DELETE' });
};

// ============================
// SUBJECTS API
// ============================

export const fetchSubjectsApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/subjects${query}`, { method: 'GET' });
};

export const fetchSubjectsDropdownApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/subjects/dropdown${query}`, { method: 'GET' });
};

export const fetchSubjectByIdApi = async (id: number | string) => {
  return apiClient(`/api/subjects/${id}`, { method: 'GET' });
};

export const createSubjectApi = async (payload: {
  subjectName: string;
  courseCode: string;
  departmentId: number | string;
}) => {
  return apiClient('/api/subjects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateSubjectApi = async (id: number | string, payload: {
  subjectName: string;
  courseCode: string;
  departmentId: number | string;
}) => {
  return apiClient(`/api/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteSubjectApi = async (id: number | string) => {
  return apiClient(`/api/subjects/${id}`, { method: 'DELETE' });
};

// ============================
// CLASSES API (Existing)
// ============================

export const fetchClassesApi = async () => {
  return apiClient('/api/classes', { method: 'GET' });
};

export const fetchClassByIdApi = async (id: number | string) => {
  return apiClient(`/api/classes/${id}`, { method: 'GET' });
};

export const createClassApi = async (payload: any) => {
  return apiClient('/api/classes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateClassApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteClassApi = async (id: number | string) => {
  return apiClient(`/api/classes/${id}`, { method: 'DELETE' });
};
