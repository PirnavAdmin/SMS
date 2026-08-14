import { apiClient } from './client';
import { FeeHead, DynamicFeeStructure, StudentFeeAssignment, FeePayment } from '../types';

export const fetchFeeHeadsApi = async () => {
  return apiClient('/api/finance/fee-heads', { method: 'GET' });
};

export const createFeeHeadApi = async (data: Omit<FeeHead, 'id'>) => {
  return apiClient('/api/finance/fee-heads', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateFeeHeadApi = async (id: string, data: Partial<FeeHead>) => {
  return apiClient(`/api/finance/fee-heads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteFeeHeadApi = async (id: string) => {
  return apiClient(`/api/finance/fee-heads/${id}`, { method: 'DELETE' });
};

export const fetchDynamicFeeStructuresApi = async () => {
  return apiClient('/api/finance/fee-structures', { method: 'GET' });
};

export const createDynamicFeeStructureApi = async (data: Omit<DynamicFeeStructure, 'id'>) => {
  return apiClient('/api/finance/fee-structures', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateDynamicFeeStructureApi = async (id: string, data: Partial<DynamicFeeStructure>) => {
  return apiClient(`/api/finance/fee-structures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteDynamicFeeStructureApi = async (id: string) => {
  return apiClient(`/api/finance/fee-structures/${id}`, { method: 'DELETE' });
};

export const fetchStudentFeeAssignmentsApi = async () => {
  return apiClient('/api/finance/fee-assignments', { method: 'GET' });
};

export const createStudentFeeAssignmentApi = async (data: Omit<StudentFeeAssignment, 'id'>) => {
  return apiClient('/api/finance/fee-assignments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateStudentFeeAssignmentApi = async (id: string, data: Partial<StudentFeeAssignment>) => {
  return apiClient(`/api/finance/fee-assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteStudentFeeAssignmentApi = async (id: string) => {
  return apiClient(`/api/finance/fee-assignments/${id}`, { method: 'DELETE' });
};

export const fetchFeePaymentsApi = async () => {
  return apiClient('/api/finance/fee-payments', { method: 'GET' });
};

export const createFeePaymentApi = async (data: Omit<FeePayment, 'id' | 'receiptNo'>) => {
  return apiClient('/api/finance/fee-payments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
