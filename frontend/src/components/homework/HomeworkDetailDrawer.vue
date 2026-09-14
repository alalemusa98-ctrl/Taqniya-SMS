<script setup lang="ts">
import { computed } from 'vue';
import {
  X,
  BookOpen,
  Calendar,
  User,
  Clock,
  Paperclip,
  Download,
  FileText,
} from 'lucide-vue-next';
import type { HomeworkDetailData, HomeworkItem } from '../../api/homework.api';

const props = defineProps<{
  modelValue: boolean;
  homework: HomeworkDetailData | HomeworkItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', item: HomeworkDetailData | HomeworkItem): void;
}>();

const close = () => {
  emit('update:modelValue', false);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

const attachmentsList = computed(() => {
  if (!props.homework) return [];
  const atts = props.homework.attachments;
  if (Array.isArray(atts)) return atts;
  return [];
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 overflow-hidden flex justify-end"
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        @click="close"
      />

      <!-- Drawer Panel -->
      <div class="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full overflow-hidden border-s border-slate-200 dark:border-slate-800 transition-transform duration-300">
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-black text-slate-800 dark:text-slate-100 font-display">
                تفاصيل الواجب المدرسي
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                المعاينة الشاملة للتعليمات والمرفقات ومواعيد التسليم
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="close"
            class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <div class="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span class="text-xs font-medium">جاري تحميل بيانات الواجب...</span>
          </div>

          <template v-else-if="homework">
            <!-- Subject & Section Pill Banner -->
            <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-indigo-700 dark:text-indigo-300">
                  {{ homework.subject_name }}
                </span>
                <span
                  class="px-2.5 py-0.5 text-xs font-bold rounded-full border"
                  :class="[
                    homework.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                  ]"
                >
                  {{ homework.status === 'active' ? 'ساري للتسليم' : 'منتهي الموعد' }}
                </span>
              </div>
              <h2 class="text-lg font-black text-slate-900 dark:text-slate-100 font-display">
                {{ homework.title }}
              </h2>
            </div>

            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-2 gap-3">
              <!-- Assigned Date -->
              <div class="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">تاريخ النشر</span>
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {{ formatDate(homework.assigned_date) }}
                  </span>
                </div>
              </div>

              <!-- Due Date -->
              <div class="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">موعد الاستحقاق</span>
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {{ formatDate(homework.due_date) }}
                  </span>
                </div>
              </div>

              <!-- Teacher -->
              <div class="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3 col-span-2">
                <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <User class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">المعلم المكلف</span>
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {{ homework.teacher_name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Description / Instructions -->
            <div class="space-y-2">
              <label class="text-xs font-black text-slate-700 dark:text-slate-300 block">
                التعليمات والتفاصيل الإرشادية
              </label>
              <div class="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line min-h-[90px]">
                {{ homework.description || 'لا توجد تعليمات إضافية مسجلة لهذا الواجب.' }}
              </div>
            </div>

            <!-- Attachments Section -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Paperclip class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  المرفقات والملازم الدراسية ({{ attachmentsList.length }})
                </label>
              </div>

              <div v-if="attachmentsList.length === 0" class="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                لا توجد ملفات أو ملازم مرفقة بهذا الواجب.
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="(att, idx) in attachmentsList"
                  :key="idx"
                  class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3 hover:border-indigo-400 transition-colors group"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText class="w-4 h-4" />
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate" :title="att.name">
                        {{ att.name }}
                      </span>
                      <span v-if="att.size" class="text-[10px] text-slate-400 dark:text-slate-500 block">
                        {{ att.size }}
                      </span>
                    </div>
                  </div>

                  <a
                    :href="att.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Download class="w-3.5 h-3.5" />
                    تحميل
                  </a>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
