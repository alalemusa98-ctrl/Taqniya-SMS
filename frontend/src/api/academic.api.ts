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

export interface QueryYearsParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: number;
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

export const academicApi = {
  // Years
  getYears: (params?: QueryYearsParams) => apiClient.get('/academic/years', { params }),
  getYearById: (id: number) => apiClient.get(`/academic/years/${id}`),
  createYear: (payload: CreateYearPayload) => apiClient.post('/academic/years', payload),
  updateYear: (id: number, payload: UpdateYearPayload) => apiClient.put(`/academic/years/${id}`, payload),
  activateYear: (id: number) => apiClient.patch(`/academic/years/${id}/activate`),
  deleteYear: (id: number) => apiClient.delete(`/academic/years/${id}`),

  // Terms
  getTerms: () => apiClient.get('/academic/terms'),
  getTermById: (id: number) => apiClient.get(`/academic/terms/${id}`),
  createTerm: (payload: CreateTermPayload) => apiClient.post('/academic/terms', payload),
  updateTerm: (id: number, payload: UpdateTermPayload) => apiClient.put(`/academic/terms/${id}`, payload),
  deleteTerm: (id: number) => apiClient.delete(`/academic/terms/${id}`),

  // Stages
  getStages: () => apiClient.get('/academic/stages'),
  getStageById: (id: number) => apiClient.get(`/academic/stages/${id}`),
  createStage: (payload: CreateStagePayload) => apiClient.post('/academic/stages', payload),
  updateStage: (id: number, payload: UpdateStagePayload) => apiClient.put(`/academic/stages/${id}`, payload),
  deleteStage: (id: number) => apiClient.delete(`/academic/stages/${id}`),
};
