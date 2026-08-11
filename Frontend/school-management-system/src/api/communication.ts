import { apiClient } from './client';

// ============================
// COMMUNICATION OPTIONS
// ============================

export const fetchCommunicationOptionsApi = async () => {
  return apiClient('/api/communications/options', { method: 'GET' });
};

export const fetchParticipantsLookupApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/communications/participants/lookup${query}`, { method: 'GET' });
};

// ============================
// NOTIFICATIONS / CIRCULARS API
// ============================

export const fetchNotificationsApi = async (search?: string, type?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (type) params.append('type', type);
  const query = params.toString();
  return apiClient(`/api/communications/notifications${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchNotificationByIdApi = async (id: number | string) => {
  return apiClient(`/api/communications/notifications/${id}`, { method: 'GET' });
};

export const createNotificationApi = async (payload: any) => {
  return apiClient('/api/communications/notifications', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateNotificationApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/communications/notifications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteNotificationApi = async (id: number | string) => {
  return apiClient(`/api/communications/notifications/${id}`, { method: 'DELETE' });
};

// ============================
// MEETINGS API
// ============================

export const fetchMeetingsApi = async (search?: string, status?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  const query = params.toString();
  return apiClient(`/api/communications/meetings${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchMeetingByIdApi = async (id: number | string) => {
  return apiClient(`/api/communications/meetings/${id}`, { method: 'GET' });
};

export const scheduleMeetingApi = async (payload: any) => {
  return apiClient('/api/communications/meetings', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateMeetingApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/communications/meetings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteMeetingApi = async (id: number | string) => {
  return apiClient(`/api/communications/meetings/${id}`, { method: 'DELETE' });
};
