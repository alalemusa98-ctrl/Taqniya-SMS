import { apiClient, deduplicatedGet } from './client';

export interface HomeworkAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface HomeworkItem {
  id: number;
  subject_name: string;
  teacher_name: string;
  title: string;
  attachments_count: number;
  assigned_date: string;
  due_date: string;
  status: 'active' | 'expired';
}

export interface SectionWithHomework {
  class_section_id: number;
  section_name: string;
  assignments: HomeworkItem[];
}

export interface ClassWithHomework {
  class_id: number;
  class_name: string;
  grade_level: number;
  sections: SectionWithHomework[];
}

export interface HomeworkHierarchyData {
  academic_year_id: number;
  academic_year_name: string;
  academic_term_id: number | null;
  academic_term_name: string;
  classes: ClassWithHomework[];
}

export interface HomeworkDetailData {
  id: number;
  academic_year_id: number;
  academic_year_name: string;
  academic_term_id: number;
  academic_term_name: string;
  class_id: number;
  class_name: string;
  class_section_id: number;
  section_name: string;
  teaching_assignment_id: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  created_by_user_id: number;
  creator_name: string;
  creator_role: string;
  title: string;
  description: string | null;
  assigned_date: string;
  due_date: string;
  status: 'active' | 'expired';
  attachments: HomeworkAttachment[];
  created_at: string;
  updated_at: string | null;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface GetHomeworkParams {
  search?: string;
  academic_year_id?: number;
  academic_term_id?: number;
  class_id?: number;
  class_section_id?: number;
  teacher_id?: number;
  subject_id?: number;
  teaching_assignment_id?: number;
  status?: 'active' | 'expired' | 'all';
  due_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateHomeworkPayload {
  academic_year_id: number;
  academic_term_id: number;
  class_section_id: number;
  teaching_assignment_id: number;
  title: string;
  description?: string;
  attachments?: HomeworkAttachment[];
  assigned_date: string;
  due_date: string;
}

export interface UpdateHomeworkPayload {
  academic_year_id?: number;
  academic_term_id?: number;
  class_section_id?: number;
  teaching_assignment_id?: number;
  title?: string;
  description?: string;
  attachments?: HomeworkAttachment[];
  assigned_date?: string;
  due_date?: string;
}

export const homeworkApi = {
  // 1.1 GET /assignments
  getAll: (params?: GetHomeworkParams, signal?: AbortSignal) => {
    return deduplicatedGet<{
      success: boolean;
      message: string;
      data: HomeworkHierarchyData;
      meta: PaginationMeta;
    }>('/assignments', { params, signal });
  },

  // 1.2 GET /assignments/:id
  getById: (id: number, signal?: AbortSignal) => {
    return deduplicatedGet<{
      success: boolean;
      message: string;
      data: HomeworkDetailData;
    }>(`/assignments/${id}`, { signal });
  },

  // 1.3 POST /assignments
  create: (payload: CreateHomeworkPayload) => {
    return apiClient.post<{
      success: boolean;
      message: string;
      data: any;
    }>('/assignments', payload);
  },

  // 1.4 PUT /assignments/:id
  update: (id: number, payload: UpdateHomeworkPayload) => {
    return apiClient.put<{
      success: boolean;
      message: string;
      data: any;
    }>(`/assignments/${id}`, payload);
  },

  // 1.5 DELETE /assignments/:id
  delete: (id: number) => {
    return apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/assignments/${id}`);
  },
};
