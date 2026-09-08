import { apiClient, deduplicatedGet } from './client';

export type EnrollmentStatusType = 'enrolled' | 'passed' | 'second_round' | 'failed' | 'graduated';

export interface EnrolledStudent {
  enrollment_id: number;
  student_id: number;
  student_code: string;
  student_name: string;
  seating_number: string | null;
  status: EnrollmentStatusType;
  created_at: string;
}

export interface ClassSectionWithEnrollments {
  class_section_id: number;
  section_name: string;
  enrolled_count: number;
  students: EnrolledStudent[];
}

export interface ClassWithSections {
  class_id: number;
  class_name: string;
  grade_level: number;
  sections: ClassSectionWithEnrollments[];
}

export interface EnrollmentMatrixData {
  academic_year_id: number | null;
  academic_year_name: string;
  classes: ClassWithSections[];
}

export interface EnrollmentMatrixResponse {
  success: boolean;
  message: string;
  data: EnrollmentMatrixData;
}

export interface StudentEnrollmentHistoryItem {
  id: number;
  academic_year_id: number | null;
  academic_year_name: string;
  class_name: string;
  grade_level: number;
  section_name: string;
  seating_number: string | null;
  status: EnrollmentStatusType;
  created_at: string;
}

export interface StudentEnrollmentHistoryResponse {
  success: boolean;
  message: string;
  data: StudentEnrollmentHistoryItem[];
}

export interface GetEnrollmentsParams {
  search?: string;
  academic_year_id?: number;
  class_id?: number;
  class_section_id?: number;
  status?: EnrollmentStatusType;
}

export interface CreateEnrollmentPayload {
  academic_year_id: number;
  student_id: number;
  class_section_id: number;
  seating_number?: string;
  status?: EnrollmentStatusType;
}

export interface UpdateEnrollmentPayload {
  academic_year_id?: number;
  student_id?: number;
  class_section_id?: number;
  seating_number?: string;
  status?: EnrollmentStatusType;
}

export interface BulkEnrollPayload {
  academic_year_id: number;
  class_section_id: number;
  student_ids: number[];
}

export interface CreateEnrollmentResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    academic_year_id: number;
    student_id: number;
    student_code: string;
    student_name: string;
    class_id: number;
    class_name: string;
    grade_level: number;
    class_section_id: number;
    section_name: string;
    seating_number: string | null;
    status: EnrollmentStatusType;
    created_at: string;
  };
}

export interface UpdateEnrollmentResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    class_section_id: number;
    section_name: string;
    seating_number: string | null;
    status: EnrollmentStatusType;
  };
}

export interface BulkEnrollResponse {
  success: boolean;
  message: string;
  data: {
    enrolled_count: number;
    class_id: number;
    class_name: string;
    class_section_id: number;
    academic_year_id: number;
  };
}

export interface DeleteEnrollmentResponse {
  success: boolean;
  message: string;
}

export const studentEnrollmentsApi = {
  getEnrollmentsMatrix: (params?: GetEnrollmentsParams, signal?: AbortSignal) =>
    deduplicatedGet<EnrollmentMatrixResponse>('/student-enrollments', { params, signal }),

  getStudentEnrollmentsHistory: (studentId: number, signal?: AbortSignal) =>
    deduplicatedGet<StudentEnrollmentHistoryResponse>(`/students/${studentId}/enrollments`, {
      signal,
    }),

  createEnrollment: (payload: CreateEnrollmentPayload) =>
    apiClient.post<CreateEnrollmentResponse>('/student-enrollments', payload),

  updateEnrollment: (id: number, payload: UpdateEnrollmentPayload) =>
    apiClient.put<UpdateEnrollmentResponse>(`/student-enrollments/${id}`, payload),

  bulkEnroll: (payload: BulkEnrollPayload) =>
    apiClient.post<BulkEnrollResponse>('/student-enrollments/bulk-enroll', payload),

  deleteEnrollment: (id: number) =>
    apiClient.delete<DeleteEnrollmentResponse>(`/student-enrollments/${id}`),
};
