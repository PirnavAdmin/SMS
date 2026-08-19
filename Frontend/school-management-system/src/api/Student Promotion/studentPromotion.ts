import { apiClient } from '../client';

// ============================
// STUDENT PROMOTION MODULE API CLIENT
// ============================

export const fetchPromotionOptionsApi = async () => {
  return apiClient('/api/student-promotion/options', { method: 'GET' });
};

export const loadFinalResultsApi = async (params: {
  currentYear?: string;
  targetYear?: string;
  currentClass?: string;
  branch?: string;
  policy?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.currentYear) queryParams.append('currentYear', params.currentYear);
  if (params.targetYear) queryParams.append('targetYear', params.targetYear);
  if (params.currentClass) queryParams.append('currentClass', params.currentClass);
  if (params.branch) queryParams.append('branch', params.branch);
  if (params.policy) queryParams.append('policy', params.policy);

  return apiClient(`/api/student-promotion/load-results?${queryParams.toString()}`, { method: 'GET' });
};

export const executePromotionApi = async (payload: {
  currentAcademicYear: string;
  targetAcademicYear: string;
  currentClass: string;
  branch: string;
  policy: string;
  promotions: any[];
}) => {
  return apiClient('/api/student-promotion/execute', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchStudentPromotionHistoryApi = async (studentId: number | string) => {
  return apiClient(`/api/student-promotion/history/${studentId}`, { method: 'GET' });
};

export const deletePromotionHistoryApi = async (id: number | string) => {
  return apiClient(`/api/student-promotion/history/${id}`, { method: 'DELETE' });
};
