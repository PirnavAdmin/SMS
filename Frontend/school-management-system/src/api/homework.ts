import { apiClient } from './client';

// ============================
// HOMEWORK API
// ============================

export const fetchHomeworkOptionsApi = async () => {
  return apiClient('/api/homework/options', { method: 'GET' });
};

export const fetchHomeworkApi = async (classId?: string, subject?: string, status?: string) => {
  const params = new URLSearchParams();
  if (classId) params.append('classId', classId);
  if (subject) params.append('subject', subject);
  if (status) params.append('status', status);
  const query = params.toString();
  return apiClient(`/api/homework${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchHomeworkByIdApi = async (id: number | string) => {
  return apiClient(`/api/homework/${id}`, { method: 'GET' });
};

export const createHomeworkApi = async (payload: any) => {
  return apiClient('/api/homework', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateHomeworkApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/homework/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteHomeworkApi = async (id: number | string) => {
  return apiClient(`/api/homework/${id}`, { method: 'DELETE' });
};

export const fetchStudentHomeworkApi = async (studentId?: number | string) => {
  const query = studentId ? `?studentId=${studentId}` : '';
  return apiClient(`/api/homework/student${query}`, { method: 'GET' });
};
