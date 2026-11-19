import { apiClient } from './client';
import { createOptimizedLogoDataUrl } from '../utils/mediaUtils';

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
  address?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
  primaryColor?: string;
  updatedAt?: string;
}

export const fetchCompanyProfileApi = async (): Promise<PlatformCompanyProfile> => {
  // 1. Try dedicated endpoint /api/superadmin/company-profile
  try {
    const rawRes: any = await apiClient<any>('/api/superadmin/company-profile', {
      method: 'GET',
    });
    const res = rawRes?.data || rawRes;
    if (res) {
      const profile: PlatformCompanyProfile = {
        id: res.id || res.Id || 1,
        companyName: res.companyName || res.CompanyName || '',
        tagline: res.tagline || res.Tagline || '',
        logoUrl: res.logoUrl || res.LogoUrl || '',
        address: res.address || res.Address || '',
        supportEmail: res.supportEmail || res.SupportEmail || '',
        supportPhone: res.supportPhone || res.SupportPhone || '',
        websiteUrl: res.websiteUrl || res.WebsiteUrl || '',
        primaryColor: res.primaryColor || res.PrimaryColor || '#0284c7',
        updatedAt: res.updatedAt || res.UpdatedAt,
      };

      if (profile.companyName || profile.tagline || profile.logoUrl || profile.address) {
        try {
          localStorage.setItem('superadmin_company_profile', JSON.stringify(profile));
        } catch { }
        return profile;
      }
    }
  } catch (err) {
    console.warn('Super Admin company profile fetch note:', err);
  }

  // Fallback to local superadmin cache if backend returned empty (NEVER fallback to /api/Settings!)
  try {
    const cached = localStorage.getItem('superadmin_company_profile');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.companyName || parsed.tagline || parsed.logoUrl || parsed.address)) {
        return {
          id: parsed.id || 1,
          companyName: parsed.companyName || '',
          tagline: parsed.tagline || '',
          logoUrl: parsed.logoUrl || '',
          address: parsed.address || '',
          supportEmail: parsed.supportEmail || '',
          supportPhone: parsed.supportPhone || '',
          websiteUrl: parsed.websiteUrl || '',
          primaryColor: parsed.primaryColor || '#0284c7',
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch { }

  // STRICT ISOLATION: NEVER fallback to /api/Settings (Tenant School Settings)
  return {
    id: 1,
    companyName: '',
    tagline: '',
    logoUrl: '',
    address: '',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
    primaryColor: '#0284c7',
  };
};

export const updateCompanyProfileApi = async (
  payload: Partial<PlatformCompanyProfile>
): Promise<PlatformCompanyProfile> => {
  let savedProfile: PlatformCompanyProfile = {
    id: payload.id || 1,
    companyName: payload.companyName || '',
    tagline: payload.tagline || '',
    logoUrl: payload.logoUrl || '',
    address: payload.address || '',
    supportEmail: payload.supportEmail || '',
    supportPhone: payload.supportPhone || '',
    websiteUrl: payload.websiteUrl || '',
    primaryColor: payload.primaryColor || '#0284c7',
  };

  // Immediate local cache update so client always retains user's entered data
  try {
    localStorage.setItem('superadmin_company_profile', JSON.stringify(savedProfile));
  } catch { }

  let lastError: any = null;

  // 1. Try dedicated endpoint /api/superadmin/company-profile with PUT
  try {
    const rawRes: any = await apiClient<any>('/api/superadmin/company-profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const res = rawRes?.data || rawRes;
    if (res && (res.companyName || res.CompanyName || res.tagline || res.Tagline)) {
      savedProfile = {
        id: res.id || res.Id || savedProfile.id,
        companyName: res.companyName || res.CompanyName || savedProfile.companyName,
        tagline: res.tagline || res.Tagline || savedProfile.tagline,
        logoUrl: res.logoUrl || res.LogoUrl || savedProfile.logoUrl,
        address: res.address || res.Address || savedProfile.address,
        supportEmail: res.supportEmail || res.SupportEmail || savedProfile.supportEmail,
        supportPhone: res.supportPhone || res.SupportPhone || savedProfile.supportPhone,
        websiteUrl: res.websiteUrl || res.WebsiteUrl || savedProfile.websiteUrl,
        primaryColor: res.primaryColor || res.PrimaryColor || savedProfile.primaryColor,
        updatedAt: res.updatedAt || res.UpdatedAt,
      };
      try {
        localStorage.setItem('superadmin_company_profile', JSON.stringify(savedProfile));
      } catch { }
      return savedProfile;
    }
  } catch (err: any) {
    lastError = err;
  }

  // 2. Try dedicated endpoint /api/superadmin/company-profile with POST
  try {
    const rawRes: any = await apiClient<any>('/api/superadmin/company-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const res = rawRes?.data || rawRes;
    if (res && (res.companyName || res.CompanyName || res.tagline || res.Tagline)) {
      savedProfile = {
        id: res.id || res.Id || savedProfile.id,
        companyName: res.companyName || res.CompanyName || savedProfile.companyName,
        tagline: res.tagline || res.Tagline || savedProfile.tagline,
        logoUrl: res.logoUrl || res.LogoUrl || savedProfile.logoUrl,
        address: res.address || res.Address || savedProfile.address,
        supportEmail: res.supportEmail || res.SupportEmail || savedProfile.supportEmail,
        supportPhone: res.supportPhone || res.SupportPhone || savedProfile.supportPhone,
        websiteUrl: res.websiteUrl || res.WebsiteUrl || savedProfile.websiteUrl,
        primaryColor: res.primaryColor || res.PrimaryColor || savedProfile.primaryColor,
        updatedAt: res.updatedAt || res.UpdatedAt,
      };
      try {
        localStorage.setItem('superadmin_company_profile', JSON.stringify(savedProfile));
      } catch { }
      return savedProfile;
    }
  } catch (err: any) {
    lastError = err;
  }

  // STRICT ISOLATION: NEVER fallback to /api/Settings! That would overwrite tenant school settings!
  if (lastError) {
    console.warn('Super Admin company profile update note:', lastError);
  }

  return savedProfile;
};

export const uploadCompanyLogoFileApi = async (
  file: File
): Promise<{ success: boolean; logoUrl: string }> => {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const rawBase = (import.meta.env.VITE_API_URL as string) || '';
  const baseUrl = rawBase.trim().replace(/\/+$/, '');

  try {
    const res = await fetch(`${baseUrl}/api/superadmin/company-profile/logo/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.logoUrl) {
        return { success: true, logoUrl: data.logoUrl };
      }
    }
  } catch (err) {
    console.warn('Super Admin dedicated logo upload error:', err);
  }

  // Fallback: create base64 optimized data URL
  const dataUrl = await createOptimizedLogoDataUrl(file, 800);
  return { success: true, logoUrl: dataUrl };
};
