import { apiClient } from './client';

// ============================
// EVENTS API  (/api/events)
// ============================

export const fetchEventsOptionsApi = async () => {
  return apiClient('/api/events/options', { method: 'GET' });
};

export const fetchCalendarEventsApi = async (month?: number, year?: number) => {
  const params = new URLSearchParams();
  if (month) params.append('month', String(month));
  if (year) params.append('year', String(year));
  const query = params.toString();
  return apiClient(`/api/events/calendar${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchUpcomingEventsApi = async () => {
  return apiClient('/api/events/upcoming', { method: 'GET' });
};

export const fetchSchoolEventsApi = async (search?: string, status?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  const query = params.toString();
  return apiClient(`/api/events/school-events${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchSchoolEventByIdApi = async (id: number | string) => {
  return apiClient(`/api/events/school-events/${id}`, { method: 'GET' });
};

export const createSchoolEventApi = async (payload: any) => {
  return apiClient('/api/events/school-events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateSchoolEventApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/events/school-events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteSchoolEventApi = async (id: number | string) => {
  return apiClient(`/api/events/school-events/${id}`, { method: 'DELETE' });
};

// ============================
// HOLIDAYS API  (/api/events or /api/holidays)
// ============================

export const fetchHolidaysApi = async () => {
  return apiClient('/api/events/holidays', { method: 'GET' });
};

export const fetchHolidayByIdApi = async (id: number | string) => {
  return apiClient(`/api/events/holidays/${id}`, { method: 'GET' });
};

export const createHolidayApi = async (payload: any) => {
  return apiClient('/api/events/holidays', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateHolidayApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/events/holidays/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteHolidayApi = async (id: number | string) => {
  return apiClient(`/api/events/holidays/${id}`, { method: 'DELETE' });
};

// ============================
// ACADEMIC CALENDAR API  (/api/academic-calendar)
// ============================

export const fetchAcademicCalendarDashboardApi = async () => {
  return apiClient('/api/academic-calendar/dashboard', { method: 'GET' });
};

export const fetchAcademicCalendarEventsApi = async (search?: string, type?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (type) params.append('type', type);
  const query = params.toString();
  return apiClient(`/api/academic-calendar/events${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const createAcademicCalendarEventApi = async (payload: any) => {
  return apiClient('/api/academic-calendar/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateAcademicCalendarEventApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/academic-calendar/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteAcademicCalendarEventApi = async (id: number | string) => {
  return apiClient(`/api/academic-calendar/events/${id}`, { method: 'DELETE' });
};

export const fetchBirthdayRadarApi = async () => {
  return apiClient('/api/academic-calendar/birthdays', { method: 'GET' });
};
