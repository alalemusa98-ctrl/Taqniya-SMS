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

export const timetablesApi = {
  getStructure: (params?: { academic_year_id?: number; class_id?: number }, signal?: AbortSignal) =>
    deduplicatedGet<TimetableStructureResponse>('/timetable-slots', { params, signal }),

  getCompletionStatus: (params?: { academic_year_id?: number; class_id?: number }, signal?: AbortSignal) =>
    deduplicatedGet<TimetableCompletionStatusResponse>('/timetable-slots/completion-status', { params, signal }),

  getSectionTimetable: (classSectionId: number, signal?: AbortSignal) =>
    deduplicatedGet<SectionTimetableResponse>(`/class-sections/${classSectionId}/timetable`, { signal }),

  getTeacherTimetable: (teacherId: number, signal?: AbortSignal) =>
    deduplicatedGet<TeacherTimetableResponse>(`/teachers/${teacherId}/timetable`, { signal }),

  createTimetableSlot: (payload: CreateTimetableSlotPayload) =>
    apiClient.post<TimetableSlotDetailResponse>('/timetable-slots', payload),

  updateTimetableSlot: (id: number, payload: UpdateTimetableSlotPayload) =>
    apiClient.put<TimetableSlotDetailResponse>(`/timetable-slots/${id}`, payload),

  deleteTimetableSlot: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/timetable-slots/${id}`),
};
