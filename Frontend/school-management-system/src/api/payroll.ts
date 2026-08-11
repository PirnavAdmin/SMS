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
