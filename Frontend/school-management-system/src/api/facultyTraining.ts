import { apiClient } from './client';

// ============================
// FACULTY DEVELOPMENT & TRAINING API
// ============================

export const fetchDashboardStatsApi = async () => {
  return apiClient('/api/v1/faculty-training/stats', { method: 'GET' });
};

// Workshops API
export const fetchWorkshopsApi = async () => {
  return apiClient('/api/v1/faculty-training/workshops', { method: 'GET' });
};

export const fetchWorkshopByIdApi = async (id: number | string) => {
  return apiClient(`/api/v1/faculty-training/workshops/${id}`, { method: 'GET' });
};

export const createWorkshopApi = async (payload: any) => {
  return apiClient('/api/v1/faculty-training/workshops', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateWorkshopApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/v1/faculty-training/workshops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteWorkshopApi = async (id: number | string) => {
  return apiClient(`/api/v1/faculty-training/workshops/${id}`, { method: 'DELETE' });
};

// Assessments API
export const fetchAssessmentsApi = async () => {
  return apiClient('/api/v1/faculty-training/assessments', { method: 'GET' });
};

export const fetchAssessmentByIdApi = async (id: number | string) => {
  return apiClient(`/api/v1/faculty-training/assessments/${id}`, { method: 'GET' });
};

export const createAssessmentApi = async (payload: any) => {
  return apiClient('/api/v1/faculty-training/assessments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateAssessmentApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/v1/faculty-training/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteAssessmentApi = async (id: number | string) => {
  return apiClient(`/api/v1/faculty-training/assessments/${id}`, { method: 'DELETE' });
};

export const recordWorkshopAttendanceApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/v1/faculty-training/workshops/${id}/attendance`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const gradeAssessmentCandidateApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/v1/faculty-training/assessments/${id}/grade`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchIssuedCertificatesApi = async () => {
  return apiClient('/api/v1/faculty-training/certificates', { method: 'GET' });
};

export const fetchCertificateByNoApi = async (certNo: string) => {
  return apiClient(`/api/v1/faculty-training/certificates/${certNo}`, { method: 'GET' });
};

export const fetchReportsSummaryApi = async () => {
  return apiClient('/api/v1/faculty-training/reports/summary', { method: 'GET' });
};

export const exportReportsCsvApi = async () => {
  return apiClient('/api/v1/faculty-training/reports/export', { method: 'GET' });
};

export const fetchStaffDropdownApi = async () => {
  return apiClient('/api/v1/faculty-training/employees', { method: 'GET' });
};

export const fetchStaffDevelopmentProfileApi = async (id: number | string) => {
  return apiClient(`/api/v1/faculty-training/employees/${id}/logs`, { method: 'GET' });
};
