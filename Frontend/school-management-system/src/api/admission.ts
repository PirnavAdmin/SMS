import { apiClient } from './client';
 
export const fetchAdmissionsApi = async (filter?: {
  branch?: string;
  academicYear?: string;
  search?: string;
  status?: string;
  classId?: number;
}) => {
  const params = new URLSearchParams();
  if (filter?.branch && filter.branch !== 'All' && filter.branch !== 'All Branches') params.append('branch', filter.branch);
  if (filter?.academicYear && filter.academicYear !== 'All') params.append('academicYear', filter.academicYear);
  if (filter?.search) params.append('search', filter.search);
  if (filter?.status && filter.status !== 'All' && filter.status !== 'All Status') params.append('status', filter.status);
  if (filter?.classId) params.append('classId', String(filter.classId));
  const qs = params.toString();
  return apiClient(`/api/admissions${qs ? `?${qs}` : ''}`, {
    method: 'GET'
  });
};
 
export const fetchAdmissionByIdApi = async (id: number | string) => {
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
 
export const updateAdmissionApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/admissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};
 
export const deleteAdmissionApi = async (id: number | string) => {
  return apiClient(`/api/admissions/${id}`, {
    method: 'DELETE'
  });
};
 
export const rejectAdmissionApi = async (id: number | string) => {
  return apiClient(`/api/admissions/${id}/reject`, {
    method: 'POST'
  });
};
 
export const enrollAdmissionApi = async (id: number | string) => {
  return apiClient(`/api/admissions/${id}/enroll`, {
    method: 'POST'
  });
};
 
export const updateAdmissionStatusApi = async (idOrRegNo: string | number, status: string) => {
  return apiClient(`/api/admissions/${idOrRegNo}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
};


export const resendParentWelcomeEmailApi = async (idOrRegNo: string | number) => {
  return apiClient(`/api/admissions/${idOrRegNo}/resend-welcome-email`, {
    method: 'POST'
  });
};
