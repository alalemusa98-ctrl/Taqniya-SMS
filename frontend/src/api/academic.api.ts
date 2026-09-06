import { apiClient } from './client';

export interface AcademicYearItem {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

export interface AcademicTermItem {
  id: number;
  name: string;
  term_number: number;
  created_at: string;
  updated_at?: string;
}

export interface AcademicStageItem {
  id: number;
  name: string;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

export interface AcademicClassItem {
  id: number;
  stage_id: number;
  stage_name?: string;
  name: string;
  grade_level: number;
  created_at: string;
  updated_at?: string;
}

export interface AcademicSectionItem {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface AcademicSubjectItem {
  id: number;
  name: string;
  code?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface QueryYearsParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: number;
}

export interface QueryClassesParams {
  stage_id?: number;
  grade_level?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface QuerySectionsParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface QuerySubjectsParams {
  search?: string;
  code?: string;
  page?: number;
  per_page?: number;
}

export interface CreateYearPayload {
  name: string;
  start_date: string;
  end_date: string;
}

export interface UpdateYearPayload {
  name?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateTermPayload {
  name: string;
  term_number: number;
}

export interface UpdateTermPayload {
  name?: string;
  term_number?: number;
}

export interface CreateStagePayload {
  name: string;
  order_index: number;
}

export interface UpdateStagePayload {
  name?: string;
  order_index?: number;
}

export interface CreateClassPayload {
  stage_id: number;
  name: string;
  grade_level: number;
}

export interface UpdateClassPayload {
  stage_id?: number;
  name?: string;
  grade_level?: number;
}

export interface CreateSectionPayload {
  name: string;
}

export interface UpdateSectionPayload {
  name?: string;
}

export interface CreateSubjectPayload {
  name: string;
  code?: string;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
}

// Phase 02-C Interfaces
export interface ClassTermItem {
  id: number;
  academic_term_id: number;
  term_name: string;
  is_active: number;
  is_closed: number;
}

export interface ClassAcademicTermsGroupItem {
  class_id: number;
  class_name: string;
  terms: ClassTermItem[];
}

export interface ClassSectionItem {
  id: number;
  section_id: number;
  name: string;
}

export interface ClassSectionsGroupItem {
  class_id: number;
  class_name: string;
  sections_count: number;
  sections: ClassSectionItem[];
}

export interface ClassSubjectItem {
  id: number;
  subject_id: number;
  name: string;
  code?: string | null;
  passing_score: string;
  max_score: string;
}

export interface ClassSubjectsTermGroup {
  class_academic_term_id: number;
  term_name: string;
  is_active: number;
  is_closed: number;
  subjects: ClassSubjectItem[];
}

export interface ClassSubjectsGroupItem {
  class_id: number;
  class_name: string;
  terms: ClassSubjectsTermGroup[];
}

export interface CreateClassAcademicTermPayload {
  class_id: number;
  academic_term_id: number;
}

export interface UpdateClassAcademicTermPayload {
  class_id?: number;
  academic_term_id?: number;
}

export interface CreateClassSectionPayload {
  class_id: number;
  section_id: number;
}

export interface CreateClassSubjectPayload {
  class_academic_term_id: number;
  subject_id: number;
  passing_score: number;
  max_score: number;
}

export interface UpdateClassSubjectPayload {
  class_academic_term_id?: number;
  subject_id?: number;
  passing_score?: number;
  max_score?: number;
}

export const academicApi = {
  // Years (02-A)
  getYears: (params?: QueryYearsParams) => apiClient.get('/academic/years', { params }),
  getYearById: (id: number) => apiClient.get(`/academic/years/${id}`),
  createYear: (payload: CreateYearPayload) => apiClient.post('/academic/years', payload),
  updateYear: (id: number, payload: UpdateYearPayload) => apiClient.put(`/academic/years/${id}`, payload),
  activateYear: (id: number) => apiClient.patch(`/academic/years/${id}/activate`),
  deleteYear: (id: number) => apiClient.delete(`/academic/years/${id}`),

  // Terms (02-A)
  getTerms: () => apiClient.get('/academic/terms'),
  getTermById: (id: number) => apiClient.get(`/academic/terms/${id}`),
  createTerm: (payload: CreateTermPayload) => apiClient.post('/academic/terms', payload),
  updateTerm: (id: number, payload: UpdateTermPayload) => apiClient.put(`/academic/terms/${id}`, payload),
  deleteTerm: (id: number) => apiClient.delete(`/academic/terms/${id}`),

  // Stages (02-A)
  getStages: () => apiClient.get('/academic/stages'),
  getStageById: (id: number) => apiClient.get(`/academic/stages/${id}`),
  createStage: (payload: CreateStagePayload) => apiClient.post('/academic/stages', payload),
  updateStage: (id: number, payload: UpdateStagePayload) => apiClient.put(`/academic/stages/${id}`, payload),
  deleteStage: (id: number) => apiClient.delete(`/academic/stages/${id}`),

  // Classes (02-B)
  getClasses: (params?: QueryClassesParams) => apiClient.get('/academic/classes', { params }),
  getClassById: (id: number) => apiClient.get(`/academic/classes/${id}`),
  createClass: (payload: CreateClassPayload) => apiClient.post('/academic/classes', payload),
  updateClass: (id: number, payload: UpdateClassPayload) => apiClient.put(`/academic/classes/${id}`, payload),
  deleteClass: (id: number) => apiClient.delete(`/academic/classes/${id}`),

  // Sections (02-B)
  getSections: (params?: QuerySectionsParams) => apiClient.get('/academic/sections', { params }),
  getSectionById: (id: number) => apiClient.get(`/academic/sections/${id}`),
  createSection: (payload: CreateSectionPayload) => apiClient.post('/academic/sections', payload),
  updateSection: (id: number, payload: UpdateSectionPayload) => apiClient.put(`/academic/sections/${id}`, payload),
  deleteSection: (id: number) => apiClient.delete(`/academic/sections/${id}`),

  // Subjects (02-B)
  getSubjects: (params?: QuerySubjectsParams) => apiClient.get('/academic/subjects', { params }),
  getSubjectById: (id: number) => apiClient.get(`/academic/subjects/${id}`),
  createSubject: (payload: CreateSubjectPayload) => apiClient.post('/academic/subjects', payload),
  updateSubject: (id: number, payload: UpdateSubjectPayload) => apiClient.put(`/academic/subjects/${id}`, payload),
  deleteSubject: (id: number) => apiClient.delete(`/academic/subjects/${id}`),

  // Class Academic Terms (02-C)
  getClassAcademicTerms: (params?: any) => apiClient.get('/academic/class-academic-terms', { params }),
  getClassAcademicTermById: (id: number) => apiClient.get(`/academic/class-academic-terms/${id}`),
  createClassAcademicTerm: (payload: CreateClassAcademicTermPayload) => apiClient.post('/academic/class-academic-terms', payload),
  updateClassAcademicTerm: (id: number, payload: UpdateClassAcademicTermPayload) => apiClient.put(`/academic/class-academic-terms/${id}`, payload),
  activateClassAcademicTerm: (id: number) => apiClient.post(`/academic/class-academic-terms/${id}/activate`),
  closeClassAcademicTerm: (id: number) => apiClient.post(`/academic/class-academic-terms/${id}/close`),

  // Class Sections (02-C)
  getClassSections: (params?: any) => apiClient.get('/academic/class-sections', { params }),
  getClassSectionById: (id: number) => apiClient.get(`/academic/class-sections/${id}`),
  createClassSection: (payload: CreateClassSectionPayload) => apiClient.post('/academic/class-sections', payload),
  deleteClassSection: (id: number) => apiClient.delete(`/academic/class-sections/${id}`),

  // Class Subjects (02-C)
  getClassSubjects: (params?: any) => apiClient.get('/academic/class-subjects', { params }),
  getClassSubjectById: (id: number) => apiClient.get(`/academic/class-subjects/${id}`),
  createClassSubject: (payload: CreateClassSubjectPayload) => apiClient.post('/academic/class-subjects', payload),
  updateClassSubject: (id: number, payload: UpdateClassSubjectPayload) => apiClient.put(`/academic/class-subjects/${id}`, payload),
  deleteClassSubject: (id: number) => apiClient.delete(`/academic/class-subjects/${id}`),
};

