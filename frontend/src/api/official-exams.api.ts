import { apiClient } from './client';

export interface ExamAttachment {
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
}

export interface OfficialExam {
  id: number;
  academic_year_id: number;
  academic_year_name?: string;
  academic_term_id: number;
  academic_term_name?: string;
  class_id: number;
  class_name?: string;
  grade_level?: number;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  exam_type: 'midterm' | 'final' | 'second_round';
  exam_type_ar?: string;
  exam_date: string;
  exam_day_name?: string;
  status?: 'upcoming' | 'completed';
  notes?: string | null;
  attachments_count?: number;
  attachments?: ExamAttachment[] | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface ExamTypeGroup {
  exam_type: string;
  exam_type_ar: string;
  count: number;
  exams: OfficialExam[];
}

export interface ClassExamGroup {
  class_id: number;
  class_name: string;
  grade_level?: number;
  exam_types: ExamTypeGroup[];
}

export interface OfficialExamsListResponse {
  academic_year_id: number | null;
  academic_year_name: string | null;
  academic_term_id: number | null;
  academic_term_name: string | null;
  classes: ClassExamGroup[];
  items: OfficialExam[];
}

export interface QueryOfficialExamsParams {
  search?: string;
  academic_year_id?: number;
  academic_term_id?: number;
  class_id?: number;
  subject_id?: number;
  teacher_id?: number;
  exam_type?: string;
  status?: string;
  exam_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateOfficialExamPayload {
  academic_year_id: number;
  academic_term_id: number;
  class_id: number;
  subject_id: number;
  exam_type: 'midterm' | 'final' | 'second_round';
  exam_date: string;
  notes?: string;
  attachments?: ExamAttachment[];
}

export interface UpdateOfficialExamPayload {
  academic_year_id?: number;
  academic_term_id?: number;
  class_id?: number;
  subject_id?: number;
  exam_type?: 'midterm' | 'final' | 'second_round';
  exam_date?: string;
  notes?: string;
  attachments?: ExamAttachment[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}

export const officialExamsApi = {
  // 1.1 List school-wide official exams (Admin)
  getAll(params?: QueryOfficialExamsParams) {
    return apiClient.get<ApiResponse<OfficialExamsListResponse>>('/official-exams', {
      params,
    });
  },

  // 1.2 Get details by ID (All roles)
  getById(id: number) {
    return apiClient.get<ApiResponse<OfficialExam>>(`/official-exams/${id}`);
  },

  // 1.3 Get class timetable schedule (Student / Parent)
  getByClass(classId: number, termId?: number) {
    return apiClient.get<ApiResponse<{
      class_id: number;
      class_name: string;
      grade_level: number;
      academic_year_name: string;
      academic_term_name: string;
      exam_types: ExamTypeGroup[];
    }>>(`/classes/${classId}/official-exams`, {
      params: termId ? { academic_term_id: termId } : undefined,
    });
  },

  // 1.4 Get teacher assigned subjects schedule (Teacher)
  getByTeacher(teacherId: number, termId?: number) {
    return apiClient.get<ApiResponse<{
      teacher_id: number;
      teacher_name: string;
      exams: OfficialExam[];
    }>>(`/teachers/${teacherId}/official-exams`, {
      params: termId ? { academic_term_id: termId } : undefined,
    });
  },

  // 1.5 Create official exam (Admin)
  create(payload: CreateOfficialExamPayload) {
    return apiClient.post<ApiResponse<OfficialExam>>('/official-exams', payload);
  },

  // 1.6 Update official exam (Admin)
  update(id: number, payload: UpdateOfficialExamPayload) {
    return apiClient.put<ApiResponse<OfficialExam>>(`/official-exams/${id}`, payload);
  },

  // 1.7 Delete official exam (Admin)
  delete(id: number) {
    return apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/official-exams/${id}`,
    );
  },
};
