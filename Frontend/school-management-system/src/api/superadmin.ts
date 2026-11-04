import { apiClient } from './client';

export interface CreateSuperAdminPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface SuperAdminResponse {
  userId: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  roles: string[];
  token: string;
}

export interface SetupStatusResponse {
  isConfigured: boolean;
  superAdminCount: number;
}

export const getSuperAdminSetupStatusApi = async (): Promise<SetupStatusResponse> => {
  return apiClient<SetupStatusResponse>('/api/superadmin/setup-status', {
    method: 'GET'
  });
};

export const createSuperAdminApi = async (payload: CreateSuperAdminPayload): Promise<SuperAdminResponse> => {
  return apiClient<SuperAdminResponse>('/api/superadmin/create-superadmin', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const setupInitialSuperAdminApi = async (payload: CreateSuperAdminPayload): Promise<SuperAdminResponse> => {
  return apiClient<SuperAdminResponse>('/api/superadmin/setup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchSuperAdminDashboardApi = async () => {
  return apiClient('/api/superadmin/dashboard/summary', {
    method: 'GET'
  });
};
