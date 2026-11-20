import { apiClient } from './client';

export interface ApplicationDraft<T = any> {
  id: number;
  formType: string;
  draftKey: string;
  userId?: string;
  userName?: string;
  branch?: string;
  academicYear?: string;
  applicantName?: string;
  currentStep: number;
  formData: T;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDraftPayload<T = any> {
  id?: number;
  formType: string;
  draftKey?: string;
  applicantName?: string;
  branch?: string;
  academicYear?: string;
  currentStep?: number;
  formData: T;
}

export const fetchActiveDraftApi = async <T = any>(
  formType: string,
  draftKey?: string
): Promise<{ success: boolean; data: ApplicationDraft<T> | null }> => {
  const params = new URLSearchParams();
  params.append('formType', formType);
  if (draftKey) params.append('draftKey', draftKey);
  return apiClient(`/api/application-drafts/active?${params.toString()}`, {
    method: 'GET'
  });
};

export const fetchAllDraftsApi = async <T = any>(
  formType?: string,
  draftKey?: string
): Promise<{ success: boolean; data: ApplicationDraft<T>[] }> => {
  const params = new URLSearchParams();
  if (formType) params.append('formType', formType);
  if (draftKey) params.append('draftKey', draftKey);
  const qs = params.toString();
  return apiClient(`/api/application-drafts${qs ? `?${qs}` : ''}`, {
    method: 'GET'
  });
};

export const saveDraftApi = async <T = any>(
  payload: SaveDraftPayload<T>
): Promise<{ success: boolean; message: string; data: ApplicationDraft<T> }> => {
  return apiClient('/api/application-drafts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const deleteDraftApi = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  return apiClient(`/api/application-drafts/${id}`, {
    method: 'DELETE'
  });
};

export const deleteActiveDraftApi = async (
  formType: string,
  draftKey?: string
): Promise<{ success: boolean; message: string }> => {
  const params = new URLSearchParams();
  params.append('formType', formType);
  if (draftKey) params.append('draftKey', draftKey);
  return apiClient(`/api/application-drafts/active?${params.toString()}`, {
    method: 'DELETE'
  });
};

export const completeDraftApi = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  return apiClient(`/api/application-drafts/${id}/complete`, {
    method: 'POST'
  });
};
