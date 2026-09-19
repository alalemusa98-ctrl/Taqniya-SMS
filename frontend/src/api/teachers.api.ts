import { apiClient, swrGet, invalidateSwrCache } from './client';

export interface Teacher {
  id: number;
  user_id: number;
  user_code: string;
  full_name: string;
  phone: string | null;
  specialization: string | null;
  hire_date: string | null;
  is_active: number;
  created_at?: string;
}

export interface GetTeachersParams {
  search?: string;
  specialization?: string;
  is_active?: number | string;
  sort_by?: 'id' | 'full_name' | 'user_code' | 'hire_date';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateTeacherPayload {
  user_code?: string;
  full_name: string;
  phone?: string;
  specialization?: string;
  hire_date?: string;
  password: string;
}

export interface UpdateTeacherPayload {
  user_code?: string;
  full_name?: string;
  phone?: string;
  specialization?: string;
  hire_date?: string;
  password?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface TeachersResponse {
  success: boolean;
  message: string;
  data: Teacher[];
  meta: PaginationMeta;
}

export interface TeacherDetailResponse {
  success: boolean;
  message: string;
  data: Teacher;
}

export const teachersApi = {
  getTeachers: (
    params?: GetTeachersParams,
    signal?: AbortSignal,
    options?: { ttl?: number; onRevalidate?: (fresh: any) => void },
  ) =>
    swrGet<TeachersResponse>('/teachers', { params, signal }, options),

  getTeacherById: (id: number, signal?: AbortSignal) =>
    swrGet<TeacherDetailResponse>(`/teachers/${id}`, { signal }),

  createTeacher: async (payload: CreateTeacherPayload) => {
    const res = await apiClient.post<TeacherDetailResponse>('/teachers', payload);
    invalidateSwrCache('/teachers');
    return res;
  },

  updateTeacher: async (id: number, payload: UpdateTeacherPayload) => {
    const res = await apiClient.put<TeacherDetailResponse>(`/teachers/${id}`, payload);
    invalidateSwrCache('/teachers');
    return res;
  },

  deleteTeacher: async (id: number) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/teachers/${id}`);
    invalidateSwrCache('/teachers');
    return res;
  },

  updateStatus: async (userId: number, isActive: number, reason?: string) => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/users/${userId}/status`, {
      is_active: isActive,
      reason,
    });
    invalidateSwrCache('/teachers');
    return res;
  },
};
