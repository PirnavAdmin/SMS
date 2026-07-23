import { apiClient } from './client';

export const fetchAdmissionsApi = async () => {
  return apiClient('/api/admissions', {
    method: 'GET'
  });
};

export const fetchAdmissionByIdApi = async (id: number) => {
  return apiClient(`/api/admissions/${id}`, {
    method: 'GET'
  });
};

export const createAdmissionApi = async (payload: any) => {
  return apiClient('/api/admissions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateAdmissionApi = async (id: number, payload: any) => {
  return apiClient(`/api/admissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteAdmissionApi = async (id: number) => {
  return apiClient(`/api/admissions/${id}`, {
    method: 'DELETE'
  });
};

export const rejectAdmissionApi = async (id: number) => {
  return apiClient(`/api/admissions/${id}/reject`, {
    method: 'POST'
  });
};

export const enrollAdmissionApi = async (id: number) => {
  return apiClient(`/api/admissions/${id}/enroll`, {
    method: 'POST'
  });
};
