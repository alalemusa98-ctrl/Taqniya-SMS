<script setup lang="ts">
import {
  Calendar,
  School,
  Layers,
  Hash,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Clock,
  TrendingUp,
} from 'lucide-vue-next';
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

const getStatusBadge = (status: EnrollmentStatusType | string) => {
  switch (status) {
    case 'passed':
      return {
        label: 'ناجح',
        icon: CheckCircle2,
        classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      };
    case 'failed':
      return {
        label: 'راسب',
        icon: XCircle,
        classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      };
    case 'second_round':
      return {
        label: 'دور ثانٍ',
        icon: AlertTriangle,
        classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    case 'graduated':
      return {
        label: 'متخرج',
        icon: GraduationCap,
        classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      };
    case 'enrolled':
    default:
      return {
        label: 'مسكن / قيد الدراسة',
        icon: Clock,
        classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      };
  }
};
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    @close="emit('close')"
    :title="`السجل والأرشيف التسكيني — ${studentName}`"
    max-width="max-w-[540px]"
  >
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12 text-bx-muted text-xs font-bold space-y-2">
        <div class="w-8 h-8 border-2 border-bx-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>جاري جلب السجل التسكيني والأرشيف الأكاديمي...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="historyItems.length === 0"
        class="text-center py-10 bg-purple-500/[0.02] rounded-3xl border border-bx-border space-y-2"
      >
        <School class="w-10 h-10 text-bx-muted opacity-40 mx-auto" />
        <p class="text-xs font-bold text-bx-title">لا توجد سجلات تسكين تاريخية مسجلة للطالب</p>
        <p class="text-[11px] text-bx-muted">سوف تظهر هنا كافة الأعوام والصفوف والشعب السابقة فور تسكينه وترحيله.</p>
      </div>

      <!-- History Items Cards -->
      <div v-else class="space-y-3">
        <div
          v-for="item in historyItems"
          :key="item.id"
          class="p-4 rounded-3xl bg-[var(--bx-surface-solid)] border border-[#B4AED8]/50 dark:border-white/[0.08] shadow-xs space-y-3 transition-all hover:border-bx-primary/40"
        >
          <!-- Card Header: Academic Year & Status Badge -->
          <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-[#B4AED8]/20 dark:border-white/[0.06]">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center border border-purple-500/20 shadow-2xs">
                <Calendar class="w-3.5 h-3.5" />
              </div>
              <span class="font-black text-xs sm:text-sm text-bx-title font-display">
                العام الدراسي: {{ item.academic_year_name }}
              </span>
            </div>

            <!-- Status Badge -->
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs"
              :class="getStatusBadge(item.status).classes"
            >
              <component :is="getStatusBadge(item.status).icon" class="w-3.5 h-3.5" />
              <span>{{ getStatusBadge(item.status).label }}</span>
            </span>
          </div>

          <!-- Academic Details Grid -->
          <div class="grid grid-cols-2 gap-2.5">
            <!-- 1. Class Name -->
            <div class="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#B4AED8]/20 dark:border-white/[0.04] space-y-1">
              <span class="text-[10px] font-bold text-bx-muted flex items-center gap-1">
                <School class="w-3 h-3 text-bx-primary" />
                <span>الصف الدراسي:</span>
              </span>
              <span class="text-xs font-black text-bx-title block">
                {{ item.class_name }}
              </span>
            </div>

            <!-- 2. Section Name -->
            <div class="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#B4AED8]/20 dark:border-white/[0.04] space-y-1">
              <span class="text-[10px] font-bold text-bx-muted flex items-center gap-1">
                <Layers class="w-3 h-3 text-bx-primary" />
                <span>الشعبة:</span>
              </span>
              <span class="text-xs font-black text-bx-title block">
                {{ item.section_name }}
              </span>
            </div>

            <!-- 3. Seating Number -->
            <div class="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#B4AED8]/20 dark:border-white/[0.04] space-y-1">
              <span class="text-[10px] font-bold text-bx-muted flex items-center gap-1">
                <Hash class="w-3 h-3 text-bx-primary" />
                <span>رقم الجلوس:</span>
              </span>
              <span class="text-xs font-black text-bx-title font-mono block">
                {{ item.seating_number || '—' }}
              </span>
            </div>

            <!-- 4. Overall Percentage -->
            <div class="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#B4AED8]/20 dark:border-white/[0.04] space-y-1">
              <span class="text-[10px] font-bold text-bx-muted flex items-center gap-1">
                <TrendingUp class="w-3 h-3 text-bx-primary" />
                <span>النسبة الكلية:</span>
              </span>
              <span
                v-if="item.percentage !== null && item.percentage !== undefined"
                class="text-xs font-black font-mono"
                :class="item.percentage >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
              >
                {{ item.percentage }}%
              </span>
              <span v-else class="text-xs font-bold text-bx-muted block">
                —
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaDrawer>
</template>
