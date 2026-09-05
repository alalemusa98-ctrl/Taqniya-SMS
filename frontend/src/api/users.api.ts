import { apiClient } from './client';

export interface GetUsersParams {
  role_type?: string;
  is_active?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface GetAuditLogsParams {
  page?: number;
  per_page?: number;
  action?: string;
  entity_type?: string;
  from_date?: string;
  to_date?: string;
}

export const usersApi = {
  getUsersTree: (params?: GetUsersParams) => apiClient.get('/users', { params }),
  getUserById: (id: number) => apiClient.get(`/users/${id}`),
  updateStatus: (id: number, payload: { is_active: number; reason?: string }) =>
    apiClient.put(`/users/${id}/status`, payload),
  resetPassword: (id: number, payload: { new_password: string }) =>
    apiClient.post(`/users/${id}/reset-password`, payload),
};

export const auditApi = {
  getAuditLogs: (params?: GetAuditLogsParams) => apiClient.get('/audit-logs', { params }),
  getAuditLogById: (id: number) => apiClient.get(`/audit-logs/${id}`),
};
