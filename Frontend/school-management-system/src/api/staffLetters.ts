import { apiClient } from './client';
import { GeneratedStaffLetterRecord, StaffLetterRequest } from '../types/staffLetter';

export interface GlobalLetterSettingsPayload {
  signatoryName: string;
  signatoryTitle: string;
  probationMonths: number;
  noticePeriodDays: number;
  signatureImageUrl?: string;
  sealImageUrl?: string;
  masterTerms?: string[];
}

// ============================
// STAFF LETTERS API
// ============================

export const fetchStaffLettersApi = async (): Promise<{ success: boolean; data: GeneratedStaffLetterRecord[] }> => {
  return apiClient('/api/staff-letters', { method: 'GET' });
};

export const fetchStaffLetterByIdApi = async (id: string): Promise<{ success: boolean; data: GeneratedStaffLetterRecord }> => {
  return apiClient(`/api/staff-letters/${encodeURIComponent(id)}`, { method: 'GET' });
};

export const createOrSaveStaffLetterApi = async (record: GeneratedStaffLetterRecord): Promise<{ success: boolean; data: any }> => {
  return apiClient('/api/staff-letters', {
    method: 'POST',
    body: JSON.stringify(record),
  });
};

export const updateStaffLetterApi = async (id: string, record: Partial<GeneratedStaffLetterRecord>): Promise<{ success: boolean; data: any }> => {
  return apiClient(`/api/staff-letters/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  });
};

export const deleteStaffLetterApi = async (id: string): Promise<{ success: boolean; message: string }> => {
  return apiClient(`/api/staff-letters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};

export const fetchGlobalLetterSettingsApi = async (): Promise<{ success: boolean; data: GlobalLetterSettingsPayload }> => {
  return apiClient('/api/staff-letters/settings', { method: 'GET' });
};

export const saveGlobalLetterSettingsApi = async (payload: GlobalLetterSettingsPayload): Promise<{ success: boolean; data: any }> => {
  return apiClient('/api/staff-letters/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// ============================
// STAFF LETTER REQUESTS API
// ============================

export const fetchStaffLetterRequestsApi = async (params?: {
  staffId?: string;
  status?: string;
  requestType?: string;
}): Promise<{ success: boolean; data: StaffLetterRequest[] }> => {
  const query = new URLSearchParams();
  if (params?.staffId) query.append('staffId', params.staffId);
  if (params?.status) query.append('status', params.status);
  if (params?.requestType) query.append('requestType', params.requestType);
  const qStr = query.toString();
  return apiClient(`/api/staff-letters/requests${qStr ? `?${qStr}` : ''}`, { method: 'GET' });
};

export const fetchPendingStaffRequestsCountApi = async (): Promise<{ success: boolean; count: number }> => {
  return apiClient('/api/staff-letters/requests/pending-count', { method: 'GET' });
};

export const createStaffLetterRequestApi = async (
  data: Partial<StaffLetterRequest>
): Promise<{ success: boolean; message: string; data: StaffLetterRequest }> => {
  return apiClient('/api/staff-letters/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateStaffLetterRequestStatusApi = async (
  id: string,
  status: 'Approved' | 'Rejected',
  rejectionReason?: string,
  generatedLetterId?: string
): Promise<{ success: boolean; message: string; data: any }> => {
  return apiClient(`/api/staff-letters/requests/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, rejectionReason, generatedLetterId }),
  });
};

export const deleteStaffLetterRequestApi = async (id: string): Promise<{ success: boolean; message: string }> => {
  return apiClient(`/api/staff-letters/requests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};
