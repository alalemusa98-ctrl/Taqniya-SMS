import { apiClient } from './client';
import type { FreezeTranscriptDto } from './promotion.api';

export interface SectionAuditProgressItem {
  class_section_id: number;
  class_id: number;
  class_name: string;
  grade_level: number;
  section_id: number;
  section_name: string;
  total_enrolled: number;
  graded_count: number;
  missing_count: number;
  completion_rate: number;
  passed_count: number;
  second_round_count: number;
  failed_count: number;
  pass_rate: number;
  is_fully_graded: boolean;
  is_all_terms_completed?: boolean;
  has_annual_generated: boolean;
  required_terms_count?: number;
  all_terms_transcripts_count?: number;
}

export interface SectionAuditProgressResponse {
  academic_year_name: string;
  sections: SectionAuditProgressItem[];
}

export interface ClassSubjectRosterItem {
  subject_id: number;
  subject_name: string;
  passing_score: number;
  max_score: number;
  max_coursework_score: number;
  max_exam_score: number;
}

export interface StudentRosterItem {
  student_id: number;
  student_code: string;
  student_name: string;
  seating_number?: string | null;
  enrollment_status: string;
  is_graded: boolean;
  transcript: {
    id: number;
    total_score: number;
    percentage: number;
    final_status: string;
    final_status_ar: string;
    transcript_data: any;
    created_at: string;
  } | null;
}

export interface SectionRosterResponse {
  class_section: {
    id: number;
    class_id: number;
    class_name: string;
    grade_level: number;
    section_id: number;
    section_name: string;
  };
  subjects: ClassSubjectRosterItem[];
  students: StudentRosterItem[];
}

export const gradeEntryApi = {
  /**
   * 3.1 Get section grading progress & audit
   */
  async getSectionAuditProgress(params: {
    academic_year_name?: string;
    class_academic_term_id?: number;
  } = {}) {
    const cleanParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        cleanParams[key] = value;
      }
    }
    const res = await apiClient.get<{ success: boolean; message: string; data: SectionAuditProgressResponse }>(
      '/transcripts/sections/audit-progress',
      { params: cleanParams },
    );
    return res.data;
  },

  /**
   * 3.2 Get enrolled students roster for a section
   */
  async getSectionRoster(
    classSectionId: number,
    params: {
      academic_year_name?: string;
      class_academic_term_id?: number;
    } = {},
  ) {
    const cleanParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        cleanParams[key] = value;
      }
    }
    const res = await apiClient.get<{ success: boolean; message: string; data: SectionRosterResponse }>(
      `/transcripts/sections/${classSectionId}/roster`,
      { params: cleanParams },
    );
    return res.data;
  },

  /**
   * 3.3 Freeze / save individual student transcript
   */
  async freezeTranscript(payload: FreezeTranscriptDto) {
    const res = await apiClient.post('/transcripts/freeze', payload);
    return res.data;
  },

  /**
   * 3.4 Batch generate annual transcripts for section
   */
  async generateAnnualForSection(payload: {
    class_section_id: number;
    academic_year_name?: string;
  }) {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: { generated_count: number; total_students: number };
    }>('/transcripts/generate-annual-for-section', payload);
    return res.data;
  },

  /**
   * 3.5 Batch generate annual transcripts for entire class
   */
  async generateAnnualForClass(payload: {
    class_id: number;
    academic_year_name?: string;
  }) {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: { generated_count: number; total_students: number };
    }>('/transcripts/generate-annual-for-class', payload);
    return res.data;
  },
};
