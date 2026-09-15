import { apiClient } from './client';

const safeUniformApiCall = async <T>(endpoint: string, options?: RequestInit, fallbackData?: any): Promise<T> => {
  try {
    const res = await apiClient(endpoint, options);
    if (res !== undefined && res !== null && !(res as any)?.error) {
      return (res as any)?.data !== undefined ? (res as any).data : res;
    }
  } catch (err) {
    const method = options?.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      throw err;
    }
    console.warn(`Uniform API call failed for ${endpoint}:`, err);
  }
  return fallbackData as T;
};

// ============================
// UNIFORM DASHBOARD
// ============================

export const fetchUniformDashboardApi = async () => {
  return safeUniformApiCall('/api/Uniform/dashboard', { method: 'GET' }, null);
};

// ============================
// UNIFORM TYPES / CONFIGURATIONS
// ============================

export const fetchUniformTypesApi = async () => {
  return safeUniformApiCall('/api/Uniform/types', { method: 'GET' }, []);
};

export const fetchUniformTypeByIdApi = async (id: number | string) => {
  return safeUniformApiCall(`/api/Uniform/types/${id}`, { method: 'GET' }, null);
};

export const createUniformTypeApi = async (payload: any) => {
  return apiClient('/api/Uniform/types', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateUniformTypeApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Uniform/types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteUniformTypeApi = async (id: number | string) => {
  return apiClient(`/api/Uniform/types/${id}`, { method: 'DELETE' });
};

export const adjustUniformStockApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Uniform/types/${id}/stock`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ============================
// UNIFORM CATEGORIES
// ============================

export const fetchUniformCategoriesApi = async () => {
  return safeUniformApiCall('/api/Uniform/categories', { method: 'GET' }, []);
};

export const createUniformCategoryApi = async (payload: any) => {
  return apiClient('/api/Uniform/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateUniformCategoryApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Uniform/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteUniformCategoryApi = async (id: number | string) => {
  return apiClient(`/api/Uniform/categories/${id}`, { method: 'DELETE' });
};

// ============================
// UNIFORM SIZES
// ============================

export const fetchUniformSizesApi = async () => {
  return safeUniformApiCall('/api/Uniform/sizes', { method: 'GET' }, []);
};

export const createUniformSizeApi = async (payload: any) => {
  return apiClient('/api/Uniform/sizes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateUniformSizeApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Uniform/sizes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteUniformSizeApi = async (id: number | string) => {
  return apiClient(`/api/Uniform/sizes/${id}`, { method: 'DELETE' });
};

// ============================
// UNIFORM SUPPLIERS
// ============================

export const fetchUniformSuppliersApi = async () => {
  return safeUniformApiCall('/api/Uniform/suppliers', { method: 'GET' }, []);
};

export const createUniformSupplierApi = async (payload: any) => {
  return apiClient('/api/Uniform/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateUniformSupplierApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Uniform/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteUniformSupplierApi = async (id: number | string) => {
  return apiClient(`/api/Uniform/suppliers/${id}`, { method: 'DELETE' });
};

// ============================
// UNIFORM DISTRIBUTIONS (STUDENT ISSUES)
// ============================

export const fetchUniformDistributionsApi = async (search?: string, studentId?: number | string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (studentId) params.append('studentId', String(studentId));
  const query = params.toString();
  return safeUniformApiCall(`/api/Uniform/distributions${query ? `?${query}` : ''}`, { method: 'GET' }, []);
};

export const issueUniformApi = async (payload: any) => {
  return apiClient('/api/Uniform/distributions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const deleteUniformDistributionApi = async (id: number | string) => {
  return apiClient(`/api/Uniform/distributions/${id}`, { method: 'DELETE' });
};

export const returnUniformApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Uniform/distributions/${id}/return`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const exchangeUniformApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Uniform/distributions/${id}/exchange`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ============================
// UNIFORM REPORTS
// ============================

export const fetchUniformReportsApi = async () => {
  return safeUniformApiCall('/api/Uniform/reports', { method: 'GET' }, null);
};
