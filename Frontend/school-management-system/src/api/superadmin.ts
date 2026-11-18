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

export interface InstitutionRegisterPayload {
  schoolName: string;
  schoolCode: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  principalName?: string;
  address?: string;
  planName?: string;
  planType?: string;
  currency?: string;
  language?: string;
  status?: string;
}

export interface InstitutionRegisterResponse {
  school: SchoolItem;
  admin: AdminItem;
  loginUrl: string;
  temporaryPassword: string;
}

export const registerInstitutionApi = async (
  payload: InstitutionRegisterPayload
): Promise<InstitutionRegisterResponse> => {
  return apiClient<InstitutionRegisterResponse>('/api/superadmin/schools/register', {
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

// -------------------------------------------------------------
// PACKAGE & SUBSCRIPTION CONFIGURATION
// -------------------------------------------------------------

export interface PackagePlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxStudents: number; // 0 for unlimited
  maxStaff: number; // 0 for unlimited
  maxBranches: number; // 0 for unlimited
  storageGb?: number;
  isPopular?: boolean;
  features: string[];
  status: 'Active' | 'Inactive';
}

export const fetchPackagesApi = async (): Promise<PackagePlan[]> => {
  try {
    const fromApi = await apiClient<PackagePlan[]>('/api/superadmin/packages', { method: 'GET' });
    if (Array.isArray(fromApi)) {
      try {
        localStorage.setItem('cached_subscription_packages', JSON.stringify(fromApi));
      } catch {}
      return fromApi;
    }
  } catch (err) {
    console.warn('Direct packages fetch failed, attempting cached fallback plans:', err);
  }

  try {
    const cached = localStorage.getItem('cached_subscription_packages');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return [];
};

export const savePackagesApi = async (packages: PackagePlan[]): Promise<PackagePlan[]> => {
  try {
    localStorage.setItem('cached_subscription_packages', JSON.stringify(packages));
  } catch {}

  let saved = packages;
  try {
    saved = await apiClient<PackagePlan[]>('/api/superadmin/packages', {
      method: 'POST',
      body: JSON.stringify(packages),
    });
    if (Array.isArray(saved) && saved.length > 0) {
      try {
        localStorage.setItem('cached_subscription_packages', JSON.stringify(saved));
      } catch {}
    }
  } catch (err) {
    console.error('Failed to save packages to backend API, using local storage state:', err);
  }

  try {
    window.dispatchEvent(new CustomEvent('packages_updated', { detail: saved }));
  } catch {}
  return saved;
};

// =========================================================
// CLIENT COMPANY / MULTI-TENANT MANAGEMENT APIS
// =========================================================

export interface CompanyItem {
  id: string;
  identifier: string;
  companyName: string;
  primaryColor: string;
  logoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  usersCount?: number;
}

export interface CreateCompanyPayload {
  identifier: string;
  companyName: string;
  primaryColor?: string;
  logoUrl?: string;
  isActive?: boolean;
  adminEmail?: string;
  adminPassword?: string;
  adminFullName?: string;
  adminMobile?: string;
}

export const fetchCompaniesApi = async (search?: string, isActive?: boolean): Promise<CompanyItem[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (isActive !== undefined) params.append('isActive', String(isActive));
  const query = params.toString() ? `?${params.toString()}` : '';

  return apiClient<CompanyItem[]>(`/api/superadmin/companies${query}`, {
    method: 'GET'
  });
};

export const fetchCompanyByIdApi = async (id: string): Promise<CompanyItem> => {
  return apiClient<CompanyItem>(`/api/superadmin/companies/${id}`, {
    method: 'GET'
  });
};

export const createCompanyApi = async (payload: CreateCompanyPayload): Promise<CompanyItem> => {
  return apiClient<CompanyItem>('/api/superadmin/companies', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateCompanyApi = async (id: string, payload: Partial<CreateCompanyPayload>): Promise<CompanyItem> => {
  return apiClient<CompanyItem>(`/api/superadmin/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const toggleCompanyStatusApi = async (id: string, isActive: boolean): Promise<CompanyItem> => {
  return apiClient<CompanyItem>(`/api/superadmin/companies/${id}/toggle-status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
};

export const deleteCompanyApi = async (id: string): Promise<void> => {
  return apiClient<void>(`/api/superadmin/companies/${id}`, {
    method: 'DELETE'
  });
};

// =========================================================
// PLATFORM COMPANY PROFILE & BRANDING APIS (SUPER ADMIN)
// =========================================================

export interface PlatformCompanyProfile {
  id?: number;
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
  primaryColor?: string;
  updatedAt?: string;
}

export const fetchCompanyProfileApi = async (): Promise<PlatformCompanyProfile> => {
  // 1. Try dedicated endpoint /api/superadmin/company-profile
  try {
    const res = await apiClient<PlatformCompanyProfile>('/api/superadmin/company-profile', {
      method: 'GET',
    });
    if (res && (res.companyName || res.logoUrl || res.tagline)) {
      return res;
    }
  } catch (err) {}

  // 2. Try alias endpoint /api/superadmin/companies/profile
  try {
    const res = await apiClient<PlatformCompanyProfile>('/api/superadmin/companies/profile', {
      method: 'GET',
    });
    if (res && (res.companyName || res.logoUrl || res.tagline)) {
      return res;
    }
  } catch (err) {}

  // 3. Fallback to /api/Settings (primary database settings table)
  try {
    const res = await apiClient<any>('/api/Settings', {
      method: 'GET',
    });
    const data = res?.data || res;
    if (data && (data.schoolName || data.name || data.logoUrl || data.tagline)) {
      return {
        id: 1,
        companyName: data.schoolName || data.name || '',
        tagline: data.tagline || '',
        logoUrl: data.logoUrl || '',
        supportEmail: data.email || '',
        supportPhone: data.phone || '',
        websiteUrl: data.website || data.websiteUrl || '',
        primaryColor: '#0284c7',
      };
    }
  } catch (err) {}

  return {
    companyName: '',
    tagline: '',
    logoUrl: '',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
    primaryColor: '#0284c7',
  };
};

export const updateCompanyProfileApi = async (
  payload: Partial<PlatformCompanyProfile>
): Promise<PlatformCompanyProfile> => {
  let lastError: any = null;

  // 1. Try dedicated endpoint /api/superadmin/company-profile with PUT
  try {
    const res = await apiClient<PlatformCompanyProfile>('/api/superadmin/company-profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res) return res;
  } catch (err: any) {
    lastError = err;
  }

  // 2. Try dedicated endpoint /api/superadmin/company-profile with POST
  try {
    const res = await apiClient<PlatformCompanyProfile>('/api/superadmin/company-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res) return res;
  } catch (err: any) {
    lastError = err;
  }

  // 3. Try alias endpoint /api/superadmin/companies/profile with PUT
  try {
    const res = await apiClient<PlatformCompanyProfile>('/api/superadmin/companies/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res) return res;
  } catch (err: any) {
    lastError = err;
  }

  // 4. Try alias endpoint /api/superadmin/companies/profile with POST
  try {
    const res = await apiClient<PlatformCompanyProfile>('/api/superadmin/companies/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res) return res;
  } catch (err: any) {
    lastError = err;
  }

  // 5. Fallback to /api/Settings (always present database settings table in backend)
  try {
    const settingsPayload: any = {
      schoolName: payload.companyName || '',
      name: payload.companyName || '',
      tagline: payload.tagline || '',
      motto: payload.tagline || '',
      logoUrl: payload.logoUrl !== undefined ? payload.logoUrl : '',
      email: payload.supportEmail || '',
      phone: payload.supportPhone || '',
      website: payload.websiteUrl || '',
      websiteUrl: payload.websiteUrl || '',
    };

    await apiClient('/api/Settings', {
      method: 'POST',
      body: JSON.stringify(settingsPayload),
    });

    if (payload.logoUrl !== undefined) {
      try {
        await apiClient('/api/Settings/logo', {
          method: 'POST',
          body: JSON.stringify({ logoData: payload.logoUrl }),
        });
      } catch (logoErr) {}
    }

    return {
      companyName: payload.companyName || '',
      tagline: payload.tagline || '',
      logoUrl: payload.logoUrl || '',
      supportEmail: payload.supportEmail || '',
      supportPhone: payload.supportPhone || '',
      websiteUrl: payload.websiteUrl || '',
      primaryColor: payload.primaryColor || '#0284c7',
    };
  } catch (settingsErr: any) {
    throw settingsErr || lastError || new Error('Failed to save company profile to backend database.');
  }
};
