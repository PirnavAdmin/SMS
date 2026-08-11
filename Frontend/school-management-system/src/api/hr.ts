import { apiClient } from './client';

// ============================
// LEAVE TYPES API
// ============================

export const fetchLeaveTypesApi = async () => {
  return apiClient('/api/hr/leave-types', { method: 'GET' });
};

export const createLeaveTypeApi = async (payload: any) => {
  return apiClient('/api/hr/leave-types', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ============================
// LEAVE APPLICATIONS API
// ============================

export const fetchLeaveApplicationsApi = async () => {
  return apiClient('/api/hr/leave-applications', { method: 'GET' });
};

export const createLeaveApplicationApi = async (payload: {
  staffId: number;
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  reason: string;
}) => {
  return apiClient('/api/hr/leave-applications', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateLeaveApplicationStatusApi = async (
  id: number | string,
  payload: { status: string; approverRemarks?: string; approvedBy?: string }
) => {
  return apiClient(`/api/hr/leave-applications/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

// ============================
// LEAVE BALANCES API
// ============================

export const fetchLeaveBalancesApi = async () => {
  return apiClient('/api/hr/leave-balances', { method: 'GET' });
};
