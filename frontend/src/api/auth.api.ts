import { apiClient } from './client';

export interface LoginPayload {
  user_code: string;
  password: string;
  device_name?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const authApi = {
  login: (payload: LoginPayload) => apiClient.post('/auth/login', payload),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  changePassword: (payload: ChangePasswordPayload) => apiClient.post('/auth/change-password', payload),
};
