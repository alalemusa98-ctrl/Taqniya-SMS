import { apiClient, invalidateSwrCache } from './client';

export interface GetUsersParams {
  role_type?: string;
  is_active?: number;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface GetAuditLogsParams {
  page?: number;
  per_page?: number;
  action?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
  from_date?: string;
  to_date?: string;
  user_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const usersApi = {
  getUsersTree: (params?: GetUsersParams) => apiClient.get('/users', { params }),
  getUserById: (id: number) => apiClient.get(`/users/${id}`),
  updateStatus: async (id: number, payload: { is_active: number; reason?: string }) => {
    const res = await apiClient.put(`/users/${id}/status`, payload);
    invalidateSwrCache('/users');
    return res;
  },
  resetPassword: async (id: number, payload: { new_password: string }) => {
    const res = await apiClient.post(`/users/${id}/reset-password`, payload);
    invalidateSwrCache('/users');
    return res;
  },
  createAdminUser: async (payload: { user_code?: string; password: string; is_active?: number }) => {
    const res = await apiClient.post('/users', payload);
    invalidateSwrCache('/users');
    return res;
  },
};

export const auditApi = {
  getAuditLogs: (params?: GetAuditLogsParams) => apiClient.get('/audit-logs', { params }),
  getAuditLogById: (id: number) => apiClient.get(`/audit-logs/${id}`),
};

