import { apiClient } from './client';

// ============================
// INVENTORY API
// ============================

export const fetchInventoryCategoriesApi = async () => {
  return apiClient('/api/Inventory/categories', { method: 'GET' });
};

export const fetchInventoryItemsApi = async (search?: string, category?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  const query = params.toString();
  return apiClient(`/api/Inventory${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchInventoryItemByIdApi = async (id: number | string) => {
  return apiClient(`/api/Inventory/${id}`, { method: 'GET' });
};

export const createInventoryItemApi = async (payload: any) => {
  return apiClient('/api/Inventory', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateInventoryItemApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/Inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteInventoryItemApi = async (id: number | string) => {
  return apiClient(`/api/Inventory/${id}`, { method: 'DELETE' });
};
