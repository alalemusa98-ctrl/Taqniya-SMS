<script setup lang="ts">
import { computed } from 'vue';
import { Eye, Edit2, Trash2, Paperclip, Calendar, BookOpen } from 'lucide-vue-next';
import type { QuizItem } from '../../api/quizzes.api';

const props = defineProps<{
  quiz: QuizItem;
  canManage?: boolean;
}>();

const emit = defineEmits<{
  (e: 'view', item: QuizItem): void;
  (e: 'edit', item: QuizItem): void;
  (e: 'delete', item: QuizItem): void;
}>();

// Format date nicely
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

// Calculate days remaining or past
const countdownInfo = computed(() => {
  if (!props.quiz.quiz_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const qDate = new Date(props.quiz.quiz_date);
  qDate.setHours(0, 0, 0, 0);

  const diffTime = qDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `تم إجراؤه منذ ${Math.abs(diffDays)} يوم`, isUrgent: false, isPast: true };
  } else if (diffDays === 0) {
    return { label: 'موعد الاختبار اليوم!', isUrgent: true, isPast: false };
  } else if (diffDays === 1) {
    return { label: 'موعد الاختبار غداً', isUrgent: true, isPast: false };
  } else {
    return { label: `متبقي ${diffDays} أيام`, isUrgent: false, isPast: false };
  }
});
</script>

<template>
  <div
    class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 group relative"
  >
    <!-- Top Header: Subject & Status -->
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs"
        >
          <BookOpen class="w-3.5 h-3.5" />
          <span>{{ quiz.subject_name }}</span>
        </span>

        <span
          v-if="countdownInfo"
          class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
          :class="
            countdownInfo.isPast
              ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20'
              : countdownInfo.isUrgent
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          "
        >
          {{ countdownInfo.label }}
        </span>
      </div>

      <!-- Title & Teacher -->
      <div>
        <h3
          class="font-black text-xs sm:text-sm text-bx-title group-hover:text-bx-primary transition-colors line-clamp-2 cursor-pointer leading-snug"
          @click="emit('view', quiz)"
        >
          {{ quiz.title }}
        </h3>
        <p class="text-[11px] text-bx-muted font-medium mt-1">
          المعلم: <span class="text-bx-title font-semibold">{{ quiz.teacher_name }}</span>
        </p>
      </div>
    </div>

    <!-- Bottom Metadata: Date, Attachments, and Action Buttons -->
    <div class="pt-3 border-t border-[#B4AED8]/50 dark:border-white/[0.08] flex items-center justify-between gap-2">
      <div class="flex items-center gap-2.5 text-[11px] text-bx-muted font-mono">
        <div class="flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5 text-bx-primary" />
          <span>{{ formatDate(quiz.quiz_date) }}</span>
        </div>

        <div v-if="quiz.attachments_count > 0" class="flex items-center gap-1 text-bx-primary font-bold">
          <Paperclip class="w-3.5 h-3.5" />
          <span>{{ quiz.attachments_count }}</span>
        </div>
      </div>

      <!-- Actions Toolbar -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="emit('view', quiz)"
          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          title="معاينة التفاصيل"
        >
          <Eye class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="canManage"
          type="button"
          @click="emit('edit', quiz)"
          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          title="تعديل الاختبار"
        >
          <Edit2 class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="canManage"
          type="button"
          @click="emit('delete', quiz)"
          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-rose-500 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
          title="حذف الاختبار"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
