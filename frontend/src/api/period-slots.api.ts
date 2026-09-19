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

// SWR Cache for Period Slots (client_caching_swr)
const swrCache = new Map<string, { timestamp: number; data: PeriodSlotsResponse }>();
const CACHE_TTL_MS = 60000;

export const periodSlotsApi = {
  getPeriodSlots: async (params?: GetPeriodSlotsParams, signal?: AbortSignal) => {
    const res = await deduplicatedGet<PeriodSlotsResponse>('/period-slots', { params, signal });
    if (res.data && res.data.success) {
      const key = JSON.stringify(params || {});
      swrCache.set(key, { timestamp: Date.now(), data: res.data });
    }
    return res;
  },

  getCachedPeriodSlots: (params?: GetPeriodSlotsParams): PeriodSlotsResponse | null => {
    const key = JSON.stringify(params || {});
    const cached = swrCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  },

  clearCache: () => {
    swrCache.clear();
  },

  createPeriodSlot: async (payload: CreatePeriodSlotPayload) => {
    swrCache.clear();
    return apiClient.post<PeriodSlotDetailResponse>('/period-slots', payload);
  },

  updatePeriodSlot: async (id: number, payload: UpdatePeriodSlotPayload) => {
    swrCache.clear();
    return apiClient.put<PeriodSlotDetailResponse>(`/period-slots/${id}`, payload);
  },

  deletePeriodSlot: async (id: number) => {
    swrCache.clear();
    return apiClient.delete<{ success: boolean; message: string }>(`/period-slots/${id}`);
  },
};
