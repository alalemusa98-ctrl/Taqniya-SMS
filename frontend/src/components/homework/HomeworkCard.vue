<script setup lang="ts">
import { computed } from 'vue';
import { Eye, Edit2, Trash2, Paperclip, Calendar, User, Clock } from 'lucide-vue-next';
import type { HomeworkItem } from '../../api/homework.api';

const props = defineProps<{
  homework: HomeworkItem;
  canManage?: boolean;
}>();

const emit = defineEmits<{
  (e: 'view', item: HomeworkItem): void;
  (e: 'edit', item: HomeworkItem): void;
  (e: 'delete', item: HomeworkItem): void;
}>();

// Format date nicely
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

// Calculate days remaining or expired
const deadlineInfo = computed(() => {
  if (!props.homework.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(props.homework.due_date);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `منتهي منذ ${Math.abs(diffDays)} يوم`, isUrgent: false, isExpired: true };
  } else if (diffDays === 0) {
    return { label: 'مستحق اليوم!', isUrgent: true, isExpired: false };
  } else if (diffDays === 1) {
    return { label: 'مستحق غداً', isUrgent: true, isExpired: false };
  } else {
    return { label: `متبقي ${diffDays} أيام`, isUrgent: diffDays <= 3, isExpired: false };
  }
});
</script>

<template>
  <div
    class="relative group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between overflow-hidden"
  >
    <!-- Top Bar: Subject & Status -->
    <div>
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <!-- Subject Badge -->
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
        >
          {{ homework.subject_name }}
        </span>

        <!-- Deadline Badge -->
        <span
          v-if="deadlineInfo"
          class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full border transition-colors"
          :class="[
            deadlineInfo.isExpired
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              : deadlineInfo.isUrgent
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          ]"
        >
          <Clock class="w-3 h-3" />
          {{ deadlineInfo.label }}
        </span>
      </div>

      <!-- Title -->
      <h4
        class="font-black text-sm text-slate-800 dark:text-slate-100 font-display leading-snug line-clamp-2 mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
      >
        {{ homework.title }}
      </h4>

      <!-- Description snippet if present -->
      <p
        v-if="homework.description"
        class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed"
      >
        {{ homework.description }}
      </p>
    </div>

    <!-- Bottom Metadata & Actions -->
    <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
      <!-- Info Capsule -->
      <div class="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
        <!-- Teacher -->
        <span class="flex items-center gap-1 truncate" :title="homework.teacher_name">
          <User class="w-3 h-3 text-slate-400" />
          {{ homework.teacher_name }}
        </span>

        <!-- Due Date -->
        <span class="flex items-center gap-1" :title="`تاريخ الاستحقاق: ${formatDate(homework.due_date)}`">
          <Calendar class="w-3 h-3 text-slate-400" />
          {{ formatDate(homework.due_date) }}
        </span>

        <!-- Attachments Count -->
        <span
          v-if="homework.attachments_count > 0"
          class="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold"
          :title="`${homework.attachments_count} مرفقات`"
        >
          <Paperclip class="w-3 h-3" />
          {{ homework.attachments_count }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- Preview Button -->
        <button
          type="button"
          @click="emit('view', homework)"
          class="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs"
          title="معاينة التفاصيل والمرفقات"
        >
          <Eye class="w-3.5 h-3.5" />
        </button>

        <!-- Edit Button -->
        <button
          v-if="canManage"
          type="button"
          @click="emit('edit', homework)"
          class="w-7 h-7 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs"
          title="تعديل الواجب"
        >
          <Edit2 class="w-3.5 h-3.5" />
        </button>

        <!-- Delete Button -->
        <button
          v-if="canManage"
          type="button"
          @click="emit('delete', homework)"
          class="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs"
          title="حذف الواجب"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
