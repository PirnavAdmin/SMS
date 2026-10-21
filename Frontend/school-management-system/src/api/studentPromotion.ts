import { apiClient } from './client';

// ============================
// STUDENT PROMOTION MODULE API CLIENT
// ============================

export const fetchPromotionOptionsApi = async () => {
  return apiClient('/api/student-promotion/options', { method: 'GET' });
};

export interface LoadPromotionResultsParams {
  currentYear?: string;
  academicYearId?: string;
  targetYear?: string;
  targetAcademicYearId?: string;
  currentClass?: string;
  classId?: string;
  branch?: string;
  branchId?: string;
  policy?: string;
  examinationId?: string;
}

export const loadPromotionResultsApi = async (params: LoadPromotionResultsParams) => {
  const queryParams = new URLSearchParams();
  const currYear = params.currentYear || params.academicYearId;
  const tgtYear = params.targetYear || params.targetAcademicYearId;
  const cls = params.currentClass || params.classId;
  const br = params.branch || params.branchId;

  if (currYear) queryParams.append('currentYear', currYear);
  if (tgtYear) queryParams.append('targetYear', tgtYear);
  if (cls) queryParams.append('currentClass', cls);
  if (br) queryParams.append('branch', br);
  if (params.policy) queryParams.append('policy', params.policy);
  if (params.examinationId) queryParams.append('examinationId', params.examinationId);

  return apiClient(`/api/student-promotion/load-results?${queryParams.toString()}`, { method: 'GET' });
};

export const loadFinalResultsApi = async (params: LoadPromotionResultsParams) => {
  return loadPromotionResultsApi(params);
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
