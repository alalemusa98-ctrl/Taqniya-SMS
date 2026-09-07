import { apiClient, deduplicatedGet } from './client';


export interface AssignmentItem {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string | null;
  teacher_id: number;
  teacher_code: string;
  teacher_name: string;
}

export interface SectionWithAssignments {
  class_section_id: number;
  section_name: string;
  assignments: AssignmentItem[];
}

export interface ClassWithSections {
  class_id: number;
  class_name: string;
  sections: SectionWithAssignments[];
}

export interface TeachingAssignmentsHierarchy {
  academic_year_id: number;
  academic_year_name: string;
  classes: ClassWithSections[];
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface GetAssignmentsParams {
  search?: string;
  academic_year_id?: number;
  class_id?: number;
  class_section_id?: number;
  teacher_id?: number;
  subject_id?: number;
  page?: number;
  per_page?: number;
}

export interface TeacherWorkloadItem {
  id: number;
  academic_year_id: number;
  academic_year_name: string;
  class_id: number;
  class_name: string;
  class_section_id: number;
  section_name: string;
  subject_id: number;
  subject_name: string;
  subject_code: string | null;
}

export interface CreateAssignmentPayload {
  academic_year_id: number;
  class_section_id: number;
  subject_id: number;
  teacher_id: number;
}

export interface UpdateAssignmentPayload extends CreateAssignmentPayload {}

export const teachingAssignmentsApi = {
  // 1.1 GET /teaching-assignments
  getAll: (params?: GetAssignmentsParams, signal?: AbortSignal) => {
    return deduplicatedGet<{
      success: boolean;
      message: string;
      data: TeachingAssignmentsHierarchy;
      meta: PaginationMeta;
    }>('/teaching-assignments', { params, signal });
  },

  // 1.2 GET /teachers/:teacher_id/assignments
  getTeacherAssignments: (
    teacherId: number,
    params?: { academic_year_id?: number; search?: string; page?: number; per_page?: number },
    signal?: AbortSignal,
  ) => {
    return deduplicatedGet<{
      success: boolean;
      message: string;
      data: TeacherWorkloadItem[];
      meta: PaginationMeta;
    }>(`/teachers/${teacherId}/assignments`, { params, signal });
  },


  // 1.3 POST /teaching-assignments
  create: (payload: CreateAssignmentPayload) => {
    return apiClient.post<{
      success: boolean;
      message: string;
      data: {
        id: number;
        academic_year_id: number;
        class_section_id: number;
        subject_id: number;
        teacher_id: number;
        created_at: string;
      };
    }>('/teaching-assignments', payload);
  },

  // 1.3 PUT /teaching-assignments/:id
  update: (id: number, payload: UpdateAssignmentPayload) => {
    return apiClient.put<{
      success: boolean;
      message: string;
      data: {
        id: number;
        academic_year_id: number;
        class_section_id: number;
        subject_id: number;
        teacher_id: number;
      };
    }>(`/teaching-assignments/${id}`, payload);
  },

  // 1.4 DELETE /teaching-assignments/:id
  delete: (id: number) => {
    return apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/teaching-assignments/${id}`);
  },
};
