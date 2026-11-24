import { apiClient } from './client';

export const loginApi = async (emailOrPhone: string, password?: string, portal?: string) => {
  const isSuperAdminPortal = portal === 'Super Admin' || portal === 'SuperAdmin';
  const endpoint = isSuperAdminPortal ? '/api/superadmin/login' : '/api/auth/login';
  try {
    return await apiClient(endpoint, {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password, portal })
    });
  } catch (err) {
    if (isSuperAdminPortal) {
      // Fallback to unified auth login
      return await apiClient('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone, password, portal })
      });
    }
    throw err;
  }
};

export const sendOtpApi = async (emailOrPhone: string) => {
  const isEmail = emailOrPhone.includes('@');
  return apiClient('/api/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, deliveryMethod: isEmail ? 'Email' : 'SMS' })
  });
};

export const verifyOtpApi = async (emailOrPhone: string, otpCode: string) => {
  return apiClient('/api/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, otpCode })
  });
};

export const resetPasswordWithOtpApi = async (emailOrPhone: string, otpCode: string, newPassword: string) => {
  return apiClient('/api/auth/otp/reset-password', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, oldPassword: "", otpCode, newPassword, confirmPassword: newPassword })
  });
};

export const changePasswordApi = async (data: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  emailOrPhone?: string;
}) => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiClient('/api/auth/change-password', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
};
