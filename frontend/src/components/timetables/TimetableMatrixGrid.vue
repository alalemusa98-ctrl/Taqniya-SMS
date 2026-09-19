<script setup lang="ts">
import { Clock, Plus, Loader2 } from 'lucide-vue-next';
import type { PeriodSlot } from '../../api/period-slots.api';
import type {
  DayOfWeek,
  TimetableSlotItem,
  TeacherTimetableSlotItem,
  TeacherTimetableResponse,
} from '../../api/timetables.api';
import TimetableSlotCard from './TimetableSlotCard.vue';
import TimetableEmptySlot from './TimetableEmptySlot.vue';
import TeacherSlotCard from './TeacherSlotCard.vue';

defineProps<{
  activeViewTab: 'sections' | 'teachers';
  matrixLoading: boolean;
  isAdmin: boolean;
  teachingPeriods: PeriodSlot[];
  days: { id: DayOfWeek; name: string }[];
  selectedSectionId?: number | null;
  selectedSectionInfo?: { class_name: string; section_name: string } | null;
  teacherTimetableData?: TeacherTimetableResponse['data'] | null;
  getSlotFor: (dayId: DayOfWeek, periodId: number) => TimetableSlotItem | undefined;
  getTeacherSlotFor: (dayId: DayOfWeek, periodId: number) => TeacherTimetableSlotItem | undefined;
}>();

const emit = defineEmits<{
  (e: 'edit-slot', slot: TimetableSlotItem, dayId: DayOfWeek): void;
  (e: 'delete-slot', slot: TimetableSlotItem): void;
  (e: 'create-slot', dayId?: DayOfWeek, periodId?: number): void;
}>();
</script>

<template>
  <div class="rounded-3xl border border-bx-border overflow-hidden bg-bx-surface shadow-xs">
    <!-- Matrix Card Header -->
    <div class="p-4 sm:p-5 bg-purple-500/[0.03] dark:bg-white/[0.02] border-b border-bx-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-2xl bg-purple-500/10 text-bx-primary flex items-center justify-center border border-purple-500/20 shadow-xs">
          <Clock class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm sm:text-base font-black text-bx-title font-display">
            {{
              activeViewTab === 'sections'
                ? selectedSectionInfo
                  ? `مصفوفة الحصص: ${selectedSectionInfo.class_name} — ${selectedSectionInfo.section_name}`
                  : 'يرجى اختيار شعبة لعرض جدولها'
                : teacherTimetableData
                ? `مصفوفة جدول المعلم: ${teacherTimetableData.teacher_name}`
                : 'يرجى اختيار معلم لعرض جدوله'
            }}
          </h3>
          <p v-if="activeViewTab === 'sections' && selectedSectionInfo" class="text-[11px] text-bx-muted font-medium mt-0.5 font-sans">
            انقر على أي مربع فارغ لتسكين حصة مباشرة، أو مرر فوق الحصة لتعديلها أو إلغائها
          </p>
        </div>
      </div>

      <div v-if="activeViewTab === 'sections' && selectedSectionId && isAdmin">
        <button
          @click="emit('create-slot')"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-bx-primary bg-purple-500/10 hover:bg-bx-primary hover:text-white border border-purple-500/30 transition-all duration-200 cursor-pointer shadow-2xs"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>تسكين حصة جديدة للشعبة</span>
        </button>
      </div>
    </div>

    <!-- Matrix Loading State -->
    <div v-if="matrixLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold font-sans">جاري تحميل مصفوفة الجدول الأسبوعي...</span>
    </div>

    <!-- Table Content -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-start border-collapse min-w-[800px]">
        <thead>
          <tr class="bg-purple-500/[0.03] dark:bg-white/[0.02] border-b border-[#B4AED8]/60 dark:border-white/10">
            <!-- Corner Header (Day / Period) -->
            <th class="py-3 px-4 font-bold text-center w-28 border-e border-[#B4AED8]/50 dark:border-white/10 font-display text-bx-title text-xs">
              اليوم / الحصة
            </th>

            <!-- Period Columns Headers -->
            <th
              v-for="period in teachingPeriods"
              :key="period.id"
              class="py-3 px-3 text-center border-e border-[#B4AED8]/50 dark:border-white/10 min-w-[140px]"
            >
              <div class="font-bold text-xs sm:text-sm text-bx-title font-display leading-tight">
                {{ period.name }}
              </div>
              <div class="text-[11px] sm:text-xs text-bx-muted font-mono mt-1 font-medium" dir="ltr">
                {{ period.start_time.substring(0, 5) }} - {{ period.end_time.substring(0, 5) }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10 text-xs font-medium text-bx-title">
          <!-- Section View Rows -->
          <template v-if="activeViewTab === 'sections'">
            <tr
              v-for="day in days"
              :key="day.id"
              class="hover:bg-purple-500/[0.015] dark:hover:bg-white/[0.01] transition-colors duration-150"
            >
              <!-- Day Title Column -->
              <td class="py-4 px-4 font-bold font-display text-bx-title whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10 bg-purple-500/[0.02] dark:bg-white/[0.02] text-center align-middle text-sm">
                {{ day.name }}
              </td>

              <!-- Periods Slots Columns -->
              <td
                v-for="period in teachingPeriods"
                :key="period.id"
                class="p-1 border-e border-[#B4AED8]/50 dark:border-white/10 align-top h-20 min-w-[140px]"
              >
                <!-- Scheduled Slot Component -->
                <TimetableSlotCard
                  v-if="getSlotFor(day.id, period.id)"
                  :slot-data="getSlotFor(day.id, period.id)!"
                  :is-admin="isAdmin"
                  @edit="(slot) => emit('edit-slot', slot, day.id)"
                  @delete="(slot) => emit('delete-slot', slot)"
                />

                <!-- Empty Slot Component (Full Box Clickable for Admin) -->
                <TimetableEmptySlot
                  v-else
                  :is-admin="isAdmin"
                  @click="emit('create-slot', day.id, period.id)"
                />
              </td>
            </tr>
          </template>

          <!-- Teacher View Rows -->
          <template v-else>
            <tr
              v-for="day in days"
              :key="day.id"
              class="hover:bg-emerald-500/[0.015] dark:hover:bg-white/[0.01] transition-colors duration-150"
            >
              <td class="py-4 px-4 font-bold font-display text-emerald-950 dark:text-emerald-200 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10 bg-emerald-500/[0.02] dark:bg-white/[0.02] text-center align-middle text-sm">
                {{ day.name }}
              </td>
              <td
                v-for="period in teachingPeriods"
                :key="period.id"
                class="p-1 border-e border-[#B4AED8]/50 dark:border-white/10 align-top h-20 min-w-[140px]"
              >
                <TeacherSlotCard
                  v-if="getTeacherSlotFor(day.id, period.id)"
                  :subject-name="getTeacherSlotFor(day.id, period.id)?.subject_name"
                  :class-name="getTeacherSlotFor(day.id, period.id)?.class_name"
                  :section-name="getTeacherSlotFor(day.id, period.id)?.section_name"
                />
                <div
                  v-else
                  class="w-full h-full min-h-[78px] rounded-2xl border border-dashed border-[#B4AED8]/40 bg-gray-50/40 dark:bg-white/[0.01] flex items-center justify-center text-[11px] font-medium text-bx-muted/50 select-none"
                >
                  فراغ
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
