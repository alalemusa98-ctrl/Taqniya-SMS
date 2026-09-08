import { apiClient, deduplicatedGet } from './client';

export interface Guardian {
  id: number;
  user_id: number;
  user_code: string;
  full_name: string;
  phone: string;
  relationship: 'father' | 'mother' | 'brother' | 'uncle' | 'other';
  students_count: number;
  created_at: string;
}

export interface GuardianStudentChild {
  id: number;
  student_id: number;
  student_code: string;
  student_name: string;
  class_section: string | null;
  is_primary: number;
}

export interface GetGuardiansParams {
  search?: string;
  sort_by?: 'id' | 'full_name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateGuardianPayload {
  full_name: string;
  phone: string;
  relationship?: 'father' | 'mother' | 'brother' | 'uncle' | 'other';
  password: string;
}

export interface UpdateGuardianPayload {
  full_name?: string;
  phone?: string;
  relationship?: 'father' | 'mother' | 'brother' | 'uncle' | 'other';
  password?: string;
}

export interface LinkCustodyPayload {
  guardian_id: number;
  student_id: number;
  is_primary?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface GuardiansResponse {
  success: boolean;
  message: string;
  data: Guardian[];
  meta: PaginationMeta;
}

export interface GuardianDetailResponse {
  success: boolean;
  message: string;
  data: Guardian;
}

export interface GuardianStudentsResponse {
  success: boolean;
  message: string;
  data: GuardianStudentChild[];
}

export const guardiansApi = {
  getGuardians: (params?: GetGuardiansParams, signal?: AbortSignal) =>
    deduplicatedGet<GuardiansResponse>('/guardians', { params, signal }),

  getGuardianById: (id: number, signal?: AbortSignal) =>
    deduplicatedGet<GuardianDetailResponse>(`/guardians/${id}`, { signal }),

  createGuardian: (payload: CreateGuardianPayload) =>
    apiClient.post<GuardianDetailResponse>('/guardians', payload),

  updateGuardian: (id: number, payload: UpdateGuardianPayload) =>
    apiClient.put<GuardianDetailResponse>(`/guardians/${id}`, payload),

  deleteGuardian: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/guardians/${id}`),

  getGuardianStudents: (guardianId: number, signal?: AbortSignal) =>
    deduplicatedGet<GuardianStudentsResponse>(`/guardians/${guardianId}/students`, { signal }),

  createCustody: (payload: LinkCustodyPayload) =>
    apiClient.post<{ success: boolean; message: string; data: any }>('/guardian-students', payload),

  updateCustody: (id: number, payload: Partial<LinkCustodyPayload>) =>
    apiClient.put<{ success: boolean; message: string; data: any }>(`/guardian-students/${id}`, payload),

  deleteCustody: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/guardian-students/${id}`),
};
