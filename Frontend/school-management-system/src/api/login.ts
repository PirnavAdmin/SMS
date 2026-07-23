import { apiClient } from './client';
export const loginApi = async (emailOrPhone: string, password?: string) => {
  return apiClient('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, password })
  });
};

export const sendOtpApi = async (emailOrPhone: string) => {
  return apiClient('/api/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, deliveryMethod: 'Email' })
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
