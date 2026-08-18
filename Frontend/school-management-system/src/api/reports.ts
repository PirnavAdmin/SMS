import { apiClient } from './client';

// ============================
// SCHOOL ADMINISTRATION REPORTS API
// ============================

export const fetchReportDashboardMetricsApi = async () => {
  return apiClient('/api/school-reports/dashboard-metrics', { method: 'GET' });
};

export const fetchReportFilterOptionsApi = async () => {
  return apiClient('/api/school-reports/filter-options', { method: 'GET' });
};

export const fetchReportDataApi = async (params?: { module?: string; classFilter?: string; departmentFilter?: string; search?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.module) queryParams.append('module', params.module);
  if (params?.classFilter) queryParams.append('classFilter', params.classFilter);
  if (params?.departmentFilter) queryParams.append('departmentFilter', params.departmentFilter);
  if (params?.search) queryParams.append('search', params.search);

  const url = `/api/school-reports/data?${queryParams.toString()}`;
  return apiClient(url, { method: 'GET' });
};

export const exportReportCsvApi = async (module?: string) => {
  return apiClient(`/api/school-reports/export-csv?module=${encodeURIComponent(module || 'students')}`, { method: 'GET' });
};
