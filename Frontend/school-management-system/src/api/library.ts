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
// BOOK ISSUE / RETURN API
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
  bookId: number;
  memberId: number;
  memberType: string;
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
