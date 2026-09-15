<script setup lang="ts">
import { computed } from 'vue';
import {
  FileText,
  Calendar,
  Paperclip,
  Download,
  School,
  Sparkles,
  Edit2,
} from 'lucide-vue-next';
import type { QuizDetailData, QuizAttachment } from '../../api/quizzes.api';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';

const props = defineProps<{
  modelValue: boolean;
  quiz: QuizDetailData | null;
  loading?: boolean;
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', item: QuizDetailData): void;
}>();

const close = () => {
  emit('update:modelValue', false);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

const attachmentsList = computed<QuizAttachment[]>(() => {
  if (!props.quiz) return [];
  const atts = props.quiz.attachments;
  if (Array.isArray(atts)) return atts;
  return [];
});

const isUpcoming = computed(() => {
  if (!props.quiz) return true;
  return props.quiz.status === 'upcoming';
});

const remainingDaysText = computed(() => {
  if (!props.quiz?.quiz_date) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const qDate = new Date(props.quiz.quiz_date);
  qDate.setHours(0, 0, 0, 0);

  const diffTime = qDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'موعد الاختبار اليوم ⚠️';
  if (diffDays === 1) return 'متبقي يوم واحد غداً';
  if (diffDays === 2) return 'متبقي يومان';
  if (diffDays > 2) return `متبقي ${diffDays} أيام`;
  return 'منتهي / مجرى';
});
</script>

<template>
  <TaqniyaDrawer
    :is-open="modelValue"
    title="تفاصيل الاختبار والمرفقات"
    max-width="max-w-[520px]"
    @close="close"
  >
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-400">
      <div class="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p class="text-sm font-medium">جاري تحميل بيانات الاختبار والمرفقات...</p>
    </div>

    <div v-else-if="quiz" class="space-y-6 pb-6 text-slate-800 dark:text-slate-200">
      <!-- Top Header Card with Subject Badge and Status -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-500/5 dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-slate-900/20 p-5 border border-indigo-500/20 dark:border-indigo-500/30">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 mb-2.5">
              <Sparkles class="w-3.5 h-3.5" />
              <span>{{ quiz.subject_name }}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {{ quiz.title }}
            </h3>
          </div>

          <span
            class="px-3 py-1 text-xs font-bold rounded-full border shadow-sm shrink-0"
            :class="
              isUpcoming
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            "
          >
            {{ isUpcoming ? 'قادم ومجدول' : 'مكتمل ومجرى' }}
          </span>
        </div>

        <!-- Class, Section, Teacher Info -->
        <div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <School class="w-4 h-4 text-indigo-500 shrink-0" />
            <span class="truncate">{{ quiz.class_name }} — {{ quiz.section_name }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <div class="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span class="truncate">المعلم: {{ quiz.teacher_name }}</span>
          </div>
        </div>
      </div>

      <!-- Schedule & Countdown Card -->
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar class="w-4 h-4 text-indigo-500" />
          <span>موعد إجراء الاختبار</span>
        </h4>

        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base border border-indigo-500/20">
              📅
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {{ formatDate(quiz.quiz_date) }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ quiz.term_name || 'الفصل الدراسي النشط' }}
              </p>
            </div>
          </div>

          <div
            v-if="remainingDaysText"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold"
            :class="
              isUpcoming
                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20'
            "
          >
            {{ remainingDaysText }}
          </div>
        </div>
      </div>

      <!-- Topics / Description Section -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FileText class="w-4 h-4 text-indigo-500" />
          <span>المواضيع المقررة والتعليمات الإرشادية</span>
        </h4>
        <div class="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300 min-h-[90px] whitespace-pre-line shadow-sm">
          {{ quiz.description || 'لم يتم إدخال تعليمات أو مواضيع مفصلة لهذا الاختبار.' }}
        </div>
      </div>

      <!-- Attachments & Review Guides -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Paperclip class="w-4 h-4 text-indigo-500" />
            <span>المرفقات ونماذج المراجعة ({{ attachmentsList.length }})</span>
          </h4>
        </div>

        <div v-if="attachmentsList.length === 0" class="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-slate-400 text-xs">
          لا توجد ملفات أو ملازم مرفقة بهذا الاختبار.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(att, idx) in attachmentsList"
            :key="idx"
            class="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm group"
          >
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText class="w-5 h-5" />
              </div>
              <div class="truncate">
                <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {{ att.file_name || 'ملف مراجعة' }}
                </p>
                <p v-if="att.file_size" class="text-[10px] text-slate-400">
                  {{ (att.file_size / 1024 / 1024).toFixed(2) }} MB
                </p>
              </div>
            </div>

            <a
              :href="att.file_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow transition-all shrink-0"
            >
              <Download class="w-3.5 h-3.5" />
              <span>تحميل</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          class="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          @click="close"
        >
          إغلاق
        </button>

        <button
          v-if="canEdit && quiz"
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all"
          @click="emit('edit', quiz)"
        >
          <Edit2 class="w-3.5 h-3.5" />
          <span>تعديل موعد الاختبار</span>
        </button>
      </div>
    </div>
  </TaqniyaDrawer>
</template>
