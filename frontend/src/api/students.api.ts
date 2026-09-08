import { apiClient, deduplicatedGet } from './client';

export interface Student {
  id: number;
  user_id: number;
  user_code: string;
  full_name: string;
  phone: string | null;
  birth_date: string | null;
  gender: 'male' | 'female';
  class_section: string | null;
  created_at: string;
}

export interface GetStudentsParams {
  search?: string;
  gender?: string;
  sort_by?: 'id' | 'full_name' | 'birth_date';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateStudentPayload {
  full_name: string;
  gender: 'male' | 'female';
  phone?: string;
  birth_date?: string;
  password: string;
  class_section_id?: number;
  academic_year_id?: number;
  seating_number?: string;
}

export interface UpdateStudentPayload {
  full_name?: string;
  gender?: 'male' | 'female';
  phone?: string;
  birth_date?: string;
  password?: string;
  class_section_id?: number;
  academic_year_id?: number;
  seating_number?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface StudentsResponse {
  success: boolean;
  message: string;
  data: Student[];
  meta: PaginationMeta;
}

export interface StudentDetailResponse {
  success: boolean;
  message: string;
  data: Student;
}

export const studentsApi = {
  getStudents: (params?: GetStudentsParams, signal?: AbortSignal) =>
    deduplicatedGet<StudentsResponse>('/students', { params, signal }),

  getStudentById: (id: number, signal?: AbortSignal) =>
    deduplicatedGet<StudentDetailResponse>(`/students/${id}`, { signal }),

  createStudent: (payload: CreateStudentPayload) =>
    apiClient.post<StudentDetailResponse>('/students', payload),

  updateStudent: (id: number, payload: UpdateStudentPayload) =>
    apiClient.put<StudentDetailResponse>(`/students/${id}`, payload),

  deleteStudent: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/students/${id}`),
};
