import { apiClient } from './client';
import { GeneratedStaffLetterRecord } from '../types/staffLetter';

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
