import { apiClient, deduplicatedGet } from './client';

export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday';

export interface TimetableClassSectionInfo {
  class_section_id: number;
  section_name: string;
}

export interface TimetableClassInfo {
  class_id: number;
  class_name: string;
  grade_level: number;
  sections: TimetableClassSectionInfo[];
}

export interface TimetableStructureResponse {
  success: boolean;
  message: string;
  data: {
    academic_year_id: number | null;
    academic_year_name: string;
    classes: TimetableClassInfo[];
  };
}

export interface TimetableSectionAuditInfo {
  class_section_id: number;
  section_name: string;
  total_slots: number;
  scheduled_slots_count: number;
  unscheduled_slots_count: number;
  is_fully_scheduled: boolean;
}

export interface TimetableClassAuditInfo {
  class_id: number;
  class_name: string;
  grade_level: number;
  total_unscheduled_slots: number;
  is_fully_scheduled: boolean;
  sections: TimetableSectionAuditInfo[];
}

export interface TimetableCompletionStatusResponse {
  success: boolean;
  message: string;
  data: {
    academic_year_id: number | null;
    academic_year_name: string;
    total_unscheduled_school_slots: number;
    classes: TimetableClassAuditInfo[];
  };
}

export interface TimetableSlotItem {
  id: number;
  period_slot_id: number;
  period_name: string;
  slot_number: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  teaching_assignment_id: number;
}

export interface DayTimetableGroup {
  day_of_week: DayOfWeek;
  day_of_week_ar: string;
  slots: TimetableSlotItem[];
}

export interface SectionTimetableResponse {
  success: boolean;
  message: string;
  data: {
    class_section_id: number;
    class_name: string;
    section_name: string;
    timetable: DayTimetableGroup[];
  };
}

export interface TeacherTimetableSlotItem {
  id: number;
  period_slot_id: number;
  period_name: string;
  slot_number: number;
  class_name: string;
  section_name: string;
  subject_name: string;
}

export interface TeacherDayTimetableGroup {
  day_of_week: DayOfWeek;
  day_of_week_ar: string;
  slots: TeacherTimetableSlotItem[];
}

export interface TeacherTimetableResponse {
  success: boolean;
  message: string;
  data: {
    teacher_id: number;
    teacher_name: string;
    timetable: TeacherDayTimetableGroup[];
  };
}

export interface CreateTimetableSlotPayload {
  academic_year_id: number;
  class_section_id: number;
  day_of_week: DayOfWeek;
  period_slot_id: number;
  teaching_assignment_id: number;
}

export interface UpdateTimetableSlotPayload {
  academic_year_id?: number;
  class_section_id?: number;
  day_of_week?: DayOfWeek;
  period_slot_id?: number;
  teaching_assignment_id?: number;
}

export interface TimetableSlotDetailResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    academic_year_id: number;
    academic_year_name: string;
    class_id: number;
    class_name: string;
    class_section_id: number;
    section_name: string;
    subject_id: number;
    subject_name: string;
    teacher_id: number;
    teacher_name: string;
    day_of_week: DayOfWeek;
    day_of_week_ar: string;
    period_slot_id: number;
    period_name: string;
    created_at?: string;
  };
}

// SWR Cache for Timetables (client_caching_swr)
const CACHE_TTL_MS = 60000;
const structureCache = new Map<string, { timestamp: number; data: TimetableStructureResponse }>();
const sectionTimetableCache = new Map<number, { timestamp: number; data: SectionTimetableResponse }>();
const teacherTimetableCache = new Map<number, { timestamp: number; data: TeacherTimetableResponse }>();
const completionCache = new Map<string, { timestamp: number; data: TimetableCompletionStatusResponse }>();

const clearAllTimetableCaches = () => {
  structureCache.clear();
  sectionTimetableCache.clear();
  teacherTimetableCache.clear();
  completionCache.clear();
};

export const timetablesApi = {
  getStructure: async (params?: { academic_year_id?: number; class_id?: number }, signal?: AbortSignal) => {
    const res = await deduplicatedGet<TimetableStructureResponse>('/timetable-slots', { params, signal });
    if (res.data && res.data.success) {
      const key = JSON.stringify(params || {});
      structureCache.set(key, { timestamp: Date.now(), data: res.data });
    }
    return res;
  },

  getCachedStructure: (params?: { academic_year_id?: number; class_id?: number }): TimetableStructureResponse | null => {
    const key = JSON.stringify(params || {});
    const cached = structureCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  },

  getCompletionStatus: async (params?: { academic_year_id?: number; class_id?: number }, signal?: AbortSignal) => {
    const res = await deduplicatedGet<TimetableCompletionStatusResponse>('/timetable-slots/completion-status', { params, signal });
    if (res.data && res.data.success) {
      const key = JSON.stringify(params || {});
      completionCache.set(key, { timestamp: Date.now(), data: res.data });
    }
    return res;
  },

  getSectionTimetable: async (classSectionId: number, signal?: AbortSignal) => {
    const res = await deduplicatedGet<SectionTimetableResponse>(`/class-sections/${classSectionId}/timetable`, { signal });
    if (res.data && res.data.success) {
      sectionTimetableCache.set(classSectionId, { timestamp: Date.now(), data: res.data });
    }
    return res;
  },

  getCachedSectionTimetable: (classSectionId: number): SectionTimetableResponse | null => {
    const cached = sectionTimetableCache.get(classSectionId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  },

  getTeacherTimetable: async (teacherId: number, signal?: AbortSignal) => {
    const res = await deduplicatedGet<TeacherTimetableResponse>(`/teachers/${teacherId}/timetable`, { signal });
    if (res.data && res.data.success) {
      teacherTimetableCache.set(teacherId, { timestamp: Date.now(), data: res.data });
    }
    return res;
  },

  clearCache: clearAllTimetableCaches,

  createTimetableSlot: async (payload: CreateTimetableSlotPayload) => {
    clearAllTimetableCaches();
    return apiClient.post<TimetableSlotDetailResponse>('/timetable-slots', payload);
  },

  updateTimetableSlot: async (id: number, payload: UpdateTimetableSlotPayload) => {
    clearAllTimetableCaches();
    return apiClient.put<TimetableSlotDetailResponse>(`/timetable-slots/${id}`, payload);
  },

  deleteTimetableSlot: async (id: number) => {
    clearAllTimetableCaches();
    return apiClient.delete<{ success: boolean; message: string }>(`/timetable-slots/${id}`);
  },
};
