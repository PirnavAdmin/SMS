import { apiClient } from './client';

// ============================
// SALARY STRUCTURES API
// ============================

export const fetchSalaryStructuresApi = async () => {
  return apiClient('/api/payroll/salary-structures', { method: 'GET' });
};

export const createSalaryStructureApi = async (payload: any) => {
  return apiClient('/api/payroll/salary-structures', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateSalaryStructureApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/payroll/salary-structures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteSalaryStructureApi = async (id: number | string) => {
  return apiClient(`/api/payroll/salary-structures/${id}`, {
    method: 'DELETE'
  });
};

export const cloneSalaryStructureApi = async (id: number | string) => {
  return apiClient(`/api/payroll/salary-structures/${id}/clone`, {
    method: 'POST'
  });
};

// ============================
// SALARY ASSIGNMENTS API
// ============================

export const fetchSalaryAssignmentsApi = async () => {
  return apiClient('/api/payroll/salary-assignments', { method: 'GET' });
};

export const assignSalaryStructureApi = async (payload: any) => {
  return apiClient('/api/payroll/salary-assignments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ============================
// PAYROLL CONFIGURATIONS API
// ============================

export const fetchPayrollConfigurationsApi = async () => {
  return apiClient('/api/payroll/configurations', { method: 'GET' });
};

export const createPayrollConfigurationApi = async (payload: any) => {
  return apiClient('/api/payroll/configurations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updatePayrollConfigurationApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/payroll/configurations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deletePayrollConfigurationApi = async (id: number | string) => {
  return apiClient(`/api/payroll/configurations/${id}`, {
    method: 'DELETE'
  });
};

export const activatePayrollConfigurationApi = async (id: number | string) => {
  return apiClient(`/api/payroll/configurations/${id}/activate`, {
    method: 'PUT'
  });
};

export const deactivatePayrollConfigurationApi = async (id: number | string) => {
  return apiClient(`/api/payroll/configurations/${id}/deactivate`, {
    method: 'PUT'
  });
};

// ============================
// PAYROLL COMPONENTS API
// ============================

export const fetchPayrollComponentsApi = async () => {
  return apiClient('/api/payroll/components', { method: 'GET' });
};

export const createPayrollComponentApi = async (payload: any) => {
  return apiClient('/api/payroll/components', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updatePayrollComponentApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/payroll/components/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deletePayrollComponentApi = async (id: number | string) => {
  return apiClient(`/api/payroll/components/${id}`, {
    method: 'DELETE'
  });
};

// ============================
// PAYROLL RUNS API
// ============================

export const fetchPayrollRunsApi = async (month?: string, category?: string, department?: string) => {
  let url = '/api/payroll/runs';
  const query: string[] = [];
  if (month) query.push(`month=${encodeURIComponent(month)}`);
  if (category) query.push(`category=${encodeURIComponent(category)}`);
  if (department) query.push(`department=${encodeURIComponent(department)}`);
  if (query.length > 0) url += `?${query.join('&')}`;

  return apiClient(url, { method: 'GET' });
};

export const upsertPayrollRunApi = async (payload: any) => {
  return apiClient('/api/payroll/runs/upsert', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updatePayrollRunApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/payroll/runs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deletePayrollRunApi = async (id: number | string) => {
  return apiClient(`/api/payroll/runs/${id}`, {
    method: 'DELETE'
  });
};

// ============================
// PAYSLIPS API
// ============================

export const fetchPayslipsApi = async (month?: string, year?: number) => {
  let url = '/api/payroll/payslips';
  const query: string[] = [];
  if (month) query.push(`month=${encodeURIComponent(month)}`);
  if (year) query.push(`year=${year}`);
  if (query.length > 0) url += `?${query.join('&')}`;
  return apiClient(url, { method: 'GET' });
};

export const createPayslipApi = async (payload: any) => {
  return apiClient('/api/payroll/payslips', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
