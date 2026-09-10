import { apiClient, deduplicatedGet } from './client';

export interface PeriodSlot {
  id: number;
  name: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  is_break: number;
  created_at?: string;
}

export interface GetPeriodSlotsParams {
  search?: string;
  is_break?: number | string;
  sort_by?: 'id' | 'slot_number' | 'start_time';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreatePeriodSlotPayload {
  name: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  is_break?: number;
}

export interface UpdatePeriodSlotPayload {
  name?: string;
  slot_number?: number;
  start_time?: string;
  end_time?: string;
  is_break?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PeriodSlotsResponse {
  success: boolean;
  message: string;
  data: PeriodSlot[];
  meta: PaginationMeta;
}

export interface PeriodSlotDetailResponse {
  success: boolean;
  message: string;
  data: PeriodSlot;
}

export const periodSlotsApi = {
  getPeriodSlots: (params?: GetPeriodSlotsParams, signal?: AbortSignal) =>
    deduplicatedGet<PeriodSlotsResponse>('/period-slots', { params, signal }),

  createPeriodSlot: (payload: CreatePeriodSlotPayload) =>
    apiClient.post<PeriodSlotDetailResponse>('/period-slots', payload),

  updatePeriodSlot: (id: number, payload: UpdatePeriodSlotPayload) =>
    apiClient.put<PeriodSlotDetailResponse>(`/period-slots/${id}`, payload),

  deletePeriodSlot: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/period-slots/${id}`),
};
