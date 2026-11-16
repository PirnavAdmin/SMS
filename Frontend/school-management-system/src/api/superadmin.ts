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

export interface SchoolItem {
  schoolId: number;
  schoolName: string;
  schoolCode: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  adminsCount: number;
  teachersCount: number;
  studentsCount: number;
  parentsCount: number;
  staffCount: number;
  totalUsersCount: number;
  // SaaS plan fields (calculated or stored)
  planName?: string;
  planType?: 'Monthly' | 'Yearly';
  accountUrl?: string;
  logoUrl?: string;
}

export interface SchoolCreatePayload {
  schoolName: string;
  schoolCode: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  planName?: string;
  planType?: string;
  currency?: string;
  language?: string;
  status?: string;
}

export interface SchoolUpdatePayload {
  schoolName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  status: string;
}

export interface AdminItem {
  userId: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  schoolId?: number;
  schoolName?: string;
  role: string;
  createdAt: string;
}

export interface AdminCreatePayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  schoolId: number;
}

export interface AdminUpdatePayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  assignedSchoolId?: number;
}

export interface GrowthAnalyticsItem {
  month: string;
  count: number;
}

export interface SchoolUsersSummary {
  schoolId: number;
  schoolName: string;
  schoolCode: string;
  adminsCount: number;
  teachersCount: number;
  studentsCount: number;
  parentsCount: number;
  staffCount: number;
  totalUsers: number;
}

export interface SuperAdminDashboardSummary {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalParents: number;
  totalStaff: number;
  totalUsers: number;
  recentSchools: SchoolItem[];
  growthAnalytics: GrowthAnalyticsItem[];
  schoolWiseUserStats: SchoolUsersSummary[];
  revenuePlaceholder?: { value: number; status: string };
  subscriptionPlaceholder?: { planName: string; price: number };
  systemHealthSummary?: { serverStatus: string; databaseConnection: string; diskUsage: string };
}

export interface AuditLogItem {
  auditLogId: number;
  userId?: number;
  userName?: string;
  userRole?: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
  schoolId?: number;
  schoolName?: string;
}

export interface SystemNotificationItem {
  notificationId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  schoolId?: number;
  schoolName?: string;
}

export interface UserStatisticsResponse {
  totalUsers: number;
  teachersCount: number;
  studentsCount: number;
  parentsCount: number;
  staffCount: number;
  schoolWiseCounts: SchoolUsersSummary[];
}

// -------------------------------------------------------------
// API CALLS
// -------------------------------------------------------------

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

export const fetchSuperAdminDashboardApi = async (): Promise<SuperAdminDashboardSummary> => {
  return apiClient<SuperAdminDashboardSummary>('/api/superadmin/dashboard/summary', {
    method: 'GET'
  });
};

export const fetchSchoolsApi = async (search?: string): Promise<SchoolItem[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient<SchoolItem[]>(`/api/superadmin/schools${query}`, {
    method: 'GET'
  });
};

export const fetchSchoolByIdApi = async (id: number): Promise<SchoolItem> => {
  return apiClient<SchoolItem>(`/api/superadmin/schools/${id}`, {
    method: 'GET'
  });
};

export const createSchoolApi = async (payload: SchoolCreatePayload): Promise<SchoolItem> => {
  return apiClient<SchoolItem>('/api/superadmin/schools', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateSchoolApi = async (id: number, payload: SchoolUpdatePayload): Promise<SchoolItem> => {
  return apiClient<SchoolItem>(`/api/superadmin/schools/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteSchoolApi = async (id: number): Promise<void> => {
  return apiClient<void>(`/api/superadmin/schools/${id}`, {
    method: 'DELETE'
  });
};

export const toggleSchoolStatusApi = async (id: number, status: 'Active' | 'Inactive'): Promise<SchoolItem> => {
  return apiClient<SchoolItem>(`/api/superadmin/schools/${id}/status?status=${status}`, {
    method: 'PATCH'
  });
};

export const fetchSchoolUsersSummaryApi = async (id: number): Promise<SchoolUsersSummary> => {
  return apiClient<SchoolUsersSummary>(`/api/superadmin/schools/${id}/users-summary`, {
    method: 'GET'
  });
};

export const fetchAdminsApi = async (search?: string): Promise<AdminItem[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient<AdminItem[]>(`/api/superadmin/admins${query}`, {
    method: 'GET'
  });
};

export const createAdminApi = async (payload: AdminCreatePayload): Promise<AdminItem> => {
  return apiClient<AdminItem>('/api/superadmin/admins', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateAdminApi = async (id: number, payload: AdminUpdatePayload): Promise<AdminItem> => {
  return apiClient<AdminItem>(`/api/superadmin/admins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const resetAdminPasswordApi = async (id: number, newPassword: string): Promise<{ message: string }> => {
  return apiClient<{ message: string }>(`/api/superadmin/admins/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
};

export const fetchUserStatisticsApi = async (): Promise<UserStatisticsResponse> => {
  return apiClient<UserStatisticsResponse>('/api/superadmin/statistics/users', {
    method: 'GET'
  });
};

export const fetchAuditLogsApi = async (schoolId?: number, limit = 100): Promise<AuditLogItem[]> => {
  const params = new URLSearchParams();
  if (schoolId) params.append('schoolId', schoolId.toString());
  params.append('limit', limit.toString());
  return apiClient<AuditLogItem[]>(`/api/superadmin/audit-logs?${params.toString()}`, {
    method: 'GET'
  });
};

export const fetchNotificationsApi = async (schoolId?: number): Promise<SystemNotificationItem[]> => {
  const query = schoolId ? `?schoolId=${schoolId}` : '';
  return apiClient<SystemNotificationItem[]>(`/api/superadmin/notifications${query}`, {
    method: 'GET'
  });
};
