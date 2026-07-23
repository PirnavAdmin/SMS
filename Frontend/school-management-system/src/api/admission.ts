import { apiClient } from './client';

export const fetchAdmissionsApi = async () => {
  return apiClient('/api/SchoolManagement/admissions', {
    method: 'GET'
  });
};

export const createAdmissionApi = async (payload: any) => {
  return apiClient('/api/SchoolManagement/admissions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateAdmissionStatusApi = async (registrationNo: string, status: string) => {
  return apiClient(`/api/SchoolManagement/admissions/${registrationNo}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};
