import { apiClient } from './client';

export interface SchoolEventsQueryParams {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface HolidaysQueryParams {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface UpcomingEventsQueryParams {
  search?: string;
  date?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface AcademicCalendarEventsQueryParams {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

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

export const fetchUpcomingEventsApi = async (
  searchOrParams?: string | UpcomingEventsQueryParams,
  date?: string,
  page?: number,
  pageSize?: number
) => {
  const params = new URLSearchParams();
  if (typeof searchOrParams === 'object' && searchOrParams !== null) {
    if (searchOrParams.search) params.append('search', searchOrParams.search);
    if (searchOrParams.date) params.append('date', searchOrParams.date);
    if (searchOrParams.category) params.append('category', searchOrParams.category);
    if (searchOrParams.page !== undefined && searchOrParams.page !== null) params.append('page', String(searchOrParams.page));
    if (searchOrParams.pageSize !== undefined && searchOrParams.pageSize !== null) params.append('pageSize', String(searchOrParams.pageSize));
  } else {
    if (searchOrParams) params.append('search', searchOrParams);
    if (date) params.append('date', date);
    if (page !== undefined && page !== null) params.append('page', String(page));
    if (pageSize !== undefined && pageSize !== null) params.append('pageSize', String(pageSize));
  }
  const query = params.toString();
  return apiClient(`/api/events/upcoming${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchSchoolEventsApi = async (
  searchOrParams?: string | SchoolEventsQueryParams,
  status?: string,
  page?: number,
  pageSize?: number
) => {
  const params = new URLSearchParams();
  if (typeof searchOrParams === 'object' && searchOrParams !== null) {
    if (searchOrParams.search) params.append('search', searchOrParams.search);
    if (searchOrParams.status) params.append('status', searchOrParams.status);
    if (searchOrParams.category) params.append('category', searchOrParams.category);
    if (searchOrParams.page !== undefined && searchOrParams.page !== null) params.append('page', String(searchOrParams.page));
    if (searchOrParams.pageSize !== undefined && searchOrParams.pageSize !== null) params.append('pageSize', String(searchOrParams.pageSize));
  } else {
    if (searchOrParams) params.append('search', searchOrParams);
    if (status) params.append('status', status);
    if (page !== undefined && page !== null) params.append('page', String(page));
    if (pageSize !== undefined && pageSize !== null) params.append('pageSize', String(pageSize));
  }
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

export const fetchHolidaysApi = async (
  searchOrParams?: string | HolidaysQueryParams,
  type?: string,
  page?: number,
  pageSize?: number
) => {
  const params = new URLSearchParams();
  if (typeof searchOrParams === 'object' && searchOrParams !== null) {
    if (searchOrParams.search) params.append('search', searchOrParams.search);
    if (searchOrParams.type) params.append('type', searchOrParams.type);
    if (searchOrParams.page !== undefined && searchOrParams.page !== null) params.append('page', String(searchOrParams.page));
    if (searchOrParams.pageSize !== undefined && searchOrParams.pageSize !== null) params.append('pageSize', String(searchOrParams.pageSize));
  } else {
    if (searchOrParams) params.append('search', searchOrParams);
    if (type) params.append('type', type);
    if (page !== undefined && page !== null) params.append('page', String(page));
    if (pageSize !== undefined && pageSize !== null) params.append('pageSize', String(pageSize));
  }
  const query = params.toString();
  return apiClient(`/api/events/holidays${query ? `?${query}` : ''}`, { method: 'GET' });
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

export const fetchAcademicCalendarEventsApi = async (
  searchOrParams?: string | AcademicCalendarEventsQueryParams,
  type?: string,
  page?: number,
  pageSize?: number
) => {
  const params = new URLSearchParams();
  if (typeof searchOrParams === 'object' && searchOrParams !== null) {
    if (searchOrParams.search) params.append('search', searchOrParams.search);
    if (searchOrParams.type) params.append('type', searchOrParams.type);
    if (searchOrParams.page !== undefined && searchOrParams.page !== null) params.append('page', String(searchOrParams.page));
    if (searchOrParams.pageSize !== undefined && searchOrParams.pageSize !== null) params.append('pageSize', String(searchOrParams.pageSize));
  } else {
    if (searchOrParams) params.append('search', searchOrParams);
    if (type) params.append('type', type);
    if (page !== undefined && page !== null) params.append('page', String(page));
    if (pageSize !== undefined && pageSize !== null) params.append('pageSize', String(pageSize));
  }
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