<script setup lang="ts">
import { computed } from 'vue';
import { Eye, Edit2, Trash2, Paperclip, User, Clock, BookOpen } from 'lucide-vue-next';
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
    return { label: `متبقي ${diffDays} أيام`, isUrgent: false, isExpired: false };
  }
});
</script>

<template>
  <div
    class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 group relative"
  >
    <!-- Top Header: Subject, Status & Deadline Badge -->
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs"
        >
          <BookOpen class="w-3.5 h-3.5" />
          <span>{{ homework.subject_name }}</span>
        </span>

        <div class="flex items-center gap-1.5">
          <!-- Status Badge -->
          <span
            class="px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-2xs"
            :class="
              homework.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30'
            "
          >
            {{ homework.status === 'active' ? 'ساري' : 'منتهي' }}
          </span>

          <!-- Deadline Urgent Badge -->
          <span
            v-if="deadlineInfo"
            class="px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-2xs"
            :class="
              deadlineInfo.isUrgent
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
                : deadlineInfo.isExpired
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-purple-500/10 text-bx-primary border-purple-500/20'
            "
          >
            {{ deadlineInfo.label }}
          </span>
        </div>
      </div>

      <!-- Title -->
      <h4
        class="text-sm font-black text-bx-title group-hover:text-bx-primary transition-colors line-clamp-2 leading-snug cursor-pointer font-display"
        @click="emit('view', homework)"
      >
        {{ homework.title }}
      </h4>

      <!-- Description preview if available -->
      <p
        v-if="homework.description"
        class="text-xs text-bx-muted line-clamp-2 leading-relaxed"
      >
        {{ homework.description }}
      </p>
    </div>

    <!-- Metadata Footer & Actions -->
    <div class="pt-3 border-t border-[#B4AED8]/50 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs text-bx-muted">
      <!-- Dates & Attachments info -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1 font-medium" title="تاريخ الاستحقاق">
          <Clock class="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span class="font-mono font-bold">{{ formatDate(homework.due_date) }}</span>
        </div>

        <div
          v-if="homework.attachments_count > 0"
          class="flex items-center gap-1 text-bx-primary font-bold"
          title="الملفات والملازم المرفقة"
        >
          <Paperclip class="w-3.5 h-3.5" />
          <span>{{ homework.attachments_count }}</span>
        </div>

        <div class="flex items-center gap-1" :title="`المعلم: ${homework.teacher_name}`">
          <User class="w-3.5 h-3.5 text-bx-muted shrink-0" />
          <span class="truncate max-w-[110px]">{{ homework.teacher_name }}</span>
        </div>
      </div>

      <!-- Actions Toolbar -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- View Button -->
        <button
          type="button"
          @click="emit('view', homework)"
          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          title="معاينة التفاصيل والمرفقات"
        >
          <Eye class="w-3.5 h-3.5" />
        </button>

        <!-- Edit Button (Teachers / Admins) -->
        <button
          v-if="canManage"
          type="button"
          @click="emit('edit', homework)"
          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          title="تعديل بيانات الواجب"
        >
          <Edit2 class="w-3.5 h-3.5" />
        </button>

        <!-- Delete Button (Teachers / Admins) -->
        <button
          v-if="canManage"
          type="button"
          @click="emit('delete', homework)"
          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-rose-500 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
          title="حذف الواجب المدرسي"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
