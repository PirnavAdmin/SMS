import { apiClient } from './client';

export const fetchAdmissionsApi = async () => {
<<<<<<< HEAD
    return apiClient('/api/admissions', {
        method: 'GET'
    });
};

export const createAdmissionApi = async (payload: any) => {
    return apiClient('/api/admissions', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

export const updateAdmissionStatusApi = async (registrationNo: string, status: string) => {
    return apiClient(`/api/admissions/${registrationNo}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
=======
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
>>>>>>> 51f8534c72429d89df1f1afcd706c6f754983bab
};

export const enrollAdmissionApi = async (id: number) => {
    return apiClient(`/api/admissions/${id}/enroll`, {
        method: 'POST'
    });
};