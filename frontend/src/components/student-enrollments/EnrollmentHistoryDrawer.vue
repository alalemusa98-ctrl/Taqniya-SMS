<script setup lang="ts">
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import type { StudentEnrollmentHistoryItem, EnrollmentStatusType } from '../../api/student-enrollments.api';

defineProps<{
  isOpen: boolean;
  studentName: string;
  historyItems: StudentEnrollmentHistoryItem[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const getStatusBadge = (status: EnrollmentStatusType) => {
  switch (status) {
    case 'enrolled':
      return { label: 'مسكن', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    case 'passed':
      return { label: 'ناجح', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'second_round':
      return { label: 'دور ثانٍ', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    case 'failed':
      return { label: 'راسب', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    case 'graduated':
      return { label: 'متخرج', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    default:
      return { label: status, bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  }
};
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    @close="emit('close')"
    :title="`السجل والأرشيف التسكيني — ${studentName}`"
    max-width="max-w-[600px]"
  >
    <div class="space-y-4 font-sans" dir="rtl">
      <p class="text-xs text-bx-muted font-medium">
        يعرض هذا السجل التدرج الأكاديمي للطالب عبر كافة الأعوام السابقة (المستمدة من الصحائف المدرسية المؤرشفة) والعام التشغيلي الحالي.
      </p>

      <div v-if="loading" class="text-center py-12 text-bx-muted text-xs font-bold">
        جاري جلب الأرشيف الأكاديمي...
      </div>

      <div v-else-if="historyItems.length === 0" class="text-center py-8 text-bx-muted text-xs">
        لا توجد سجلات تسكين تاريخية مسجلة للطالب.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in historyItems"
          :key="item.id"
          class="p-4 rounded-2xl bg-purple-500/[0.02] border border-bx-border space-y-2"
        >
          <div class="flex items-center justify-between">
            <span class="font-black text-xs sm:text-sm text-bx-title font-display">
              {{ item.academic_year_name }}
            </span>
            <span
              :class="[
                'text-[11px] px-2.5 py-0.5 rounded-full font-bold border',
                getStatusBadge(item.status).bg
              ]"
            >
              {{ getStatusBadge(item.status).label }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs text-bx-muted">
            <div>الصف: <strong class="text-bx-title">{{ item.class_name }}</strong></div>
            <div>الشعبة: <strong class="text-bx-title">{{ item.section_name }}</strong></div>
            <div>المستوى: <strong class="text-bx-title font-mono">{{ item.grade_level }}</strong></div>
            <div>رقم الجلوس: <strong class="text-bx-title font-mono">{{ item.seating_number || '—' }}</strong></div>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaDrawer>
</template>
