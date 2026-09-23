import { apiClient } from './client';

export interface SubjectScoreDetail {
  subject_name: string;
  coursework_score?: number;
  exam_score?: number;
  total_score: number;
  max_score?: number;
  grade_label?: string;
}

export interface StudentTranscript {
  id: number;
  student_id: number;
  student_name: string;
  student_code: string;
  national_id?: string;
  class_id?: number;
  class_name: string;
  section_id?: number;
  section_name: string;
  grade_level?: number;
  academic_term_id?: number;
  academic_term_name?: string;
  academic_year_name: string;
  transcript_type: 'final_year' | 'term';
  total_score: number;
  max_possible_score: number;
  percentage: number;
  final_status: 'passed' | 'second_round' | 'retained';
  calculated_rank?: number;
  transcript_data?: {
    student_id?: number;
    student_name?: string;
    student_code?: string;
    class_name?: string;
    section_name?: string;
    academic_year_name?: string;
    subjects?: SubjectScoreDetail[];
    subject_scores?: SubjectScoreDetail[];
    total_score?: number;
    max_possible_score?: number;
    percentage?: number;
    final_status?: string;
    frozen_at?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface ExecutiveClassSummary {
  class_id: number;
  class_name: string;
  grade_level: number;
  total_students: number;
  passed_count: number;
  second_round_count: number;
  retained_count: number;
  graduated_count: number;
  passing_rate: number;
}

export interface PromotionBatch {
  id: number;
  from_academic_year_id: number;
  to_academic_year_id: number;
  from_academic_year?: { id: number; name: string };
  to_academic_year?: { id: number; name: string };
  executed_by_user_id: number;
  total_students: number;
  total_promoted: number;
  total_second_round: number;
  total_retained: number;
  total_graduated: number;
  overall_passing_rate: number;
  class_statistics?: Array<{
    class_name: string;
    total: number;
    promoted: number;
    retained: number;
    pass_rate: number;
  }>;
  execution_notes?: string;
  created_at: string;
}

export interface LowEnrollmentWarning {
  class_name: string;
  section_name: string;
  projected_count: number;
  threshold_limit: number;
  warning_message: string;
}

export interface PromotionSimulationResult {
  from_academic_year: { id: number; name: string };
  to_academic_year: { id: number; name: string };
  total_eligible_students: number;
  total_promoted: number;
  total_second_round: number;
  total_retained: number;
  total_graduated: number;
  class_breakdown: Array<{
    class_name: string;
    total: number;
    promoted: number;
    retained: number;
    pass_rate: number;
  }>;
  low_enrollment_warnings: LowEnrollmentWarning[];
}

export interface QueryTranscriptsDto {
  page?: number;
  per_page?: number;
  academic_year_name?: string;
  class_id?: number;
  section_id?: number;
  academic_term_id?: number;
  transcript_type?: string;
  final_status?: string;
  search?: string;
}

export interface FreezeTranscriptDto {
  student_id: number;
  academic_term_id?: number;
  academic_year_name: string;
  transcript_type: 'final_year' | 'term';
  total_score: number;
  max_possible_score: number;
  percentage: number;
  final_status: 'passed' | 'second_round' | 'retained';
  transcript_data: Record<string, any>;
}

export interface ExecutePromotionDto {
  from_academic_year_id: number;
  to_academic_year_id: number;
  execution_notes?: string;
}

export const promotionApi = {
  /**
   * 1.1 GET /api/v1/transcripts
   */
  async getTranscripts(params: QueryTranscriptsDto = {}) {
    const res = await apiClient.get('/transcripts', { params });
    return res.data;
  },

  /**
   * 1.2 GET /api/v1/transcripts/:id
   */
  async getTranscriptById(id: number) {
    const res = await apiClient.get(`/transcripts/${id}`);
    return res.data;
  },

  /**
   * 1.3 GET /api/v1/students/:student_id/transcripts
   */
  async getStudentTranscripts(studentId: number, params: any = {}) {
    const res = await apiClient.get(`/students/${studentId}/transcripts`, { params });
    return res.data;
  },

  /**
   * 1.4 POST /api/v1/transcripts/freeze
   */
  async freezeTranscript(payload: FreezeTranscriptDto) {
    const res = await apiClient.post('/transcripts/freeze', payload);
    return res.data;
  },

  /**
   * 2.1 GET /api/v1/promotions/batches
   */
  async getPromotionBatches(params: any = {}) {
    const res = await apiClient.get('/promotions/batches', { params });
    return res.data;
  },

  /**
   * 2.2 GET /api/v1/promotions/batches/:id
   */
  async getPromotionBatchById(id: number) {
    const res = await apiClient.get(`/promotions/batches/${id}`);
    return res.data;
  },

  /**
   * 2.3 POST /api/v1/promotions/preview
   */
  async previewPromotion(payload: { from_academic_year_id: number; to_academic_year_id: number }) {
    const res = await apiClient.post('/promotions/preview', payload);
    return res.data;
  },

  /**
   * 2.4 POST /api/v1/promotions/execute
   */
  async executePromotion(payload: ExecutePromotionDto) {
    const res = await apiClient.post('/promotions/execute', payload);
    return res.data;
  },
};
