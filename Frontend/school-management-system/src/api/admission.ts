import { apiClient } from './client';

export const fetchAdmissionsApi = async () => {
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
};

export const enrollAdmissionApi = async (id: number) => {
    return apiClient(`/api/admissions/${id}/enroll`, {
        method: 'POST'
    });
};