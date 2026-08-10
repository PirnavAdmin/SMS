import { apiClient } from './client';

// ============================
// STAFF API
// ============================

export const fetchStaffApi = async () => {
  return apiClient('/api/staff', { method: 'GET' });
};

export const fetchStaffByIdApi = async (id: number | string) => {
  return apiClient(`/api/staff/${id}`, { method: 'GET' });
};

export const createStaffApi = async (payload: any) => {
  return apiClient('/api/staff', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateStaffApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteStaffApi = async (id: number | string) => {
  return apiClient(`/api/staff/${id}`, {
    method: 'DELETE'
  });
};

export const updateStaffStatusApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
};

// ============================
// TEACHER ASSIGNMENTS API
// ============================

export const fetchTeacherAssignmentsApi = async () => {
  return apiClient('/api/teacher-assignments', { method: 'GET' });
};

export const createTeacherAssignmentApi = async (payload: any) => {
  return apiClient('/api/teacher-assignments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
