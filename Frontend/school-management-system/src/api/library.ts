import { apiClient } from './client';

// ============================
// BOOK CATALOG API
// ============================

export const fetchLibraryOptionsApi = async () => {
  return apiClient('/api/library/options', { method: 'GET' });
};

export const fetchBooksApi = async (search?: string, category?: string, page = 1, pageSize = 50) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  params.append('page', String(page));
  params.append('pageSize', String(pageSize));
  return apiClient(`/api/library/books?${params.toString()}`, { method: 'GET' });
};

export const fetchBookByIdApi = async (id: number | string) => {
  return apiClient(`/api/library/books/${id}`, { method: 'GET' });
};

export const createBookApi = async (payload: any) => {
  return apiClient('/api/library/books', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateBookApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/library/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteBookApi = async (id: number | string) => {
  return apiClient(`/api/library/books/${id}`, { method: 'DELETE' });
};

// ============================
// CATEGORIES, AUTHORS & RACKS API
// ============================

export const fetchCategoriesApi = async () => {
  return apiClient('/api/library/categories', { method: 'GET' });
};

export const createCategoryApi = async (payload: any) => {
  return apiClient('/api/library/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchAuthorsApi = async () => {
  return apiClient('/api/library/authors', { method: 'GET' });
};

export const createAuthorApi = async (payload: any) => {
  return apiClient('/api/library/authors', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchRacksApi = async () => {
  return apiClient('/api/library/racks', { method: 'GET' });
};

export const createRackApi = async (payload: any) => {
  return apiClient('/api/library/racks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchMembersApi = async () => {
  return apiClient('/api/library/members', { method: 'GET' });
};

export const createMemberApi = async (payload: any) => {
  return apiClient('/api/library/members', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ============================
// BOOK ISSUE, RETURN & RENEWAL API
// ============================

export const fetchIssuedBooksApi = async (search?: string, status?: string, page = 1, pageSize = 50) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  params.append('page', String(page));
  params.append('pageSize', String(pageSize));
  return apiClient(`/api/library/issued-books?${params.toString()}`, { method: 'GET' });
};

export const issueBookApi = async (payload: {
  bookId: number | string;
  memberId: number | string;
  memberType?: string;
  issueDate: string;
  dueDate: string;
  remarks?: string;
}) => {
  return apiClient('/api/library/issued-books', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const returnBookApi = async (issueId: number | string) => {
  return apiClient(`/api/library/issued-books/${issueId}/return`, {
    method: 'POST'
  });
};

export const renewBookApi = async (issueId: number | string, extensionDays = 14) => {
  return apiClient(`/api/library/issued-books/${issueId}/renew`, {
    method: 'POST',
    body: JSON.stringify({ extensionDays })
  });
};

// ============================
// RESERVATIONS & FINES API
// ============================

export const fetchReservationsApi = async () => {
  return apiClient('/api/library/reservations', { method: 'GET' });
};

export const createReservationApi = async (payload: any) => {
  return apiClient('/api/library/reservations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fulfillReservationApi = async (id: number | string) => {
  return apiClient(`/api/library/reservations/${id}/fulfill`, {
    method: 'POST'
  });
};

export const fetchFinesApi = async () => {
  return apiClient('/api/library/fines', { method: 'GET' });
};

export const collectFineApi = async (fineId: number | string, payload?: any) => {
  return apiClient(`/api/library/fines/${fineId}/collect`, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  });
};

export const fetchLostDamagedApi = async () => {
  return apiClient('/api/library/lost-damaged', { method: 'GET' });
};

export const createLostDamagedApi = async (payload: any) => {
  return apiClient('/api/library/lost-damaged', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchRulesApi = async () => {
  return apiClient('/api/library/rules', { method: 'GET' });
};

export const updateRulesApi = async (payload: any) => {
  return apiClient('/api/library/rules', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const fetchLibraryReportsApi = async (reportType: string) => {
  return apiClient(`/api/library/reports?type=${reportType}`, { method: 'GET' });
};
