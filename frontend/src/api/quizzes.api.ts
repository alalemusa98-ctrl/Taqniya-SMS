import { apiClient } from './client';

export interface QuizAttachment {
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  // Aliases for unified attachment interface
  name?: string;
  url?: string;
  size?: number;
  type?: string;
}

export interface QuizItem {
  id: number;
  subject_name: string;
  teacher_name: string;
  title: string;
  attachments_count: number;
  quiz_date: string;
  status: 'upcoming' | 'completed';
}

export interface SectionWithQuizzes {
  class_section_id: number;
  section_name: string;
  quizzes: QuizItem[];
}

export interface ClassWithQuizzes {
  class_id: number;
  class_name: string;
  grade_level: number;
  sections: SectionWithQuizzes[];
}

export interface QuizHierarchyData {
  academic_year_id: number;
  academic_year_name: string;
  academic_term_id: number | null;
  academic_term_name: string;
  classes: ClassWithQuizzes[];
}

export interface QuizDetailData {
  id: number;
  academic_year_id: number;
  academic_term_id: number;
  term_name: string;
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
  created_by_name: string;
  title: string;
  description: string | null;
  attachments: QuizAttachment[];
  quiz_date: string;
  status: 'upcoming' | 'completed';
  created_at?: string;
  updated_at?: string | null;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface GetQuizzesParams {
  search?: string;
  academic_year_id?: number;
  academic_term_id?: number;
  class_id?: number;
  class_section_id?: number;
  teacher_id?: number;
  subject_id?: number;
  teaching_assignment_id?: number;
  status?: 'upcoming' | 'completed' | 'all';
  quiz_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateQuizPayload {
  academic_year_id: number;
  academic_term_id: number;
  class_section_id: number;
  teaching_assignment_id: number;
  title: string;
  description?: string;
  attachments?: QuizAttachment[];
  quiz_date: string;
}

export interface UpdateQuizPayload {
  academic_year_id?: number;
  academic_term_id?: number;
  class_section_id?: number;
  teaching_assignment_id?: number;
  title?: string;
  description?: string;
  attachments?: QuizAttachment[];
  quiz_date?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export const quizzesApi = {
  /**
   * 1.1 GET /api/v1/quizzes
   */
  async getQuizzes(params?: GetQuizzesParams): Promise<ApiResponse<QuizHierarchyData>> {
    const res = await apiClient.get<ApiResponse<QuizHierarchyData>>('/quizzes', { params });
    return res.data;
  },
  async getAll(params?: GetQuizzesParams): Promise<ApiResponse<QuizHierarchyData>> {
    const res = await apiClient.get<ApiResponse<QuizHierarchyData>>('/quizzes', { params });
    return res.data;
  },

  /**
   * 1.2 GET /api/v1/quizzes/:id
   */
  async getQuizById(id: number): Promise<ApiResponse<QuizDetailData>> {
    const res = await apiClient.get<ApiResponse<QuizDetailData>>(`/quizzes/${id}`);
    return res.data;
  },
  async getById(id: number): Promise<ApiResponse<QuizDetailData>> {
    const res = await apiClient.get<ApiResponse<QuizDetailData>>(`/quizzes/${id}`);
    return res.data;
  },

  /**
   * 1.3 POST /api/v1/quizzes
   */
  async createQuiz(payload: CreateQuizPayload): Promise<ApiResponse<any>> {
    const res = await apiClient.post<ApiResponse<any>>('/quizzes', payload);
    return res.data;
  },
  async create(payload: CreateQuizPayload): Promise<ApiResponse<any>> {
    const res = await apiClient.post<ApiResponse<any>>('/quizzes', payload);
    return res.data;
  },

  /**
   * 1.4 PUT /api/v1/quizzes/:id
   */
  async updateQuiz(id: number, payload: UpdateQuizPayload): Promise<ApiResponse<any>> {
    const res = await apiClient.put<ApiResponse<any>>(`/quizzes/${id}`, payload);
    return res.data;
  },
  async update(id: number, payload: UpdateQuizPayload): Promise<ApiResponse<any>> {
    const res = await apiClient.put<ApiResponse<any>>(`/quizzes/${id}`, payload);
    return res.data;
  },

  /**
   * 1.5 DELETE /api/v1/quizzes/:id
   */
  async deleteQuiz(id: number): Promise<ApiResponse<any>> {
    const res = await apiClient.delete<ApiResponse<any>>(`/quizzes/${id}`);
    return res.data;
  },
  async delete(id: number): Promise<ApiResponse<any>> {
    const res = await apiClient.delete<ApiResponse<any>>(`/quizzes/${id}`);
    return res.data;
  },
};
