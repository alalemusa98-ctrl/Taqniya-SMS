import { apiClient } from './client';

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
  full_name: string;
  phone?: string;
  specialization?: string;
  hire_date?: string;
  password: string;
}

export interface UpdateTeacherPayload {
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
  getTeachers: (params?: GetTeachersParams) =>
    apiClient.get<TeachersResponse>('/teachers', { params }),

  getTeacherById: (id: number) =>
    apiClient.get<TeacherDetailResponse>(`/teachers/${id}`),

  createTeacher: (payload: CreateTeacherPayload) =>
    apiClient.post<TeacherDetailResponse>('/teachers', payload),

  updateTeacher: (id: number, payload: UpdateTeacherPayload) =>
    apiClient.put<TeacherDetailResponse>(`/teachers/${id}`, payload),

  deleteTeacher: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/teachers/${id}`),
};
