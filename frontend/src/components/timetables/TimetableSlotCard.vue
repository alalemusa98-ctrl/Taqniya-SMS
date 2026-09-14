<script setup lang="ts">
import { Edit2, Trash2 } from 'lucide-vue-next';
import type { TimetableSlotItem } from '../../api/timetables.api';

defineProps<{
  slotData: TimetableSlotItem;
  isAdmin?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', slot: TimetableSlotItem): void;
  (e: 'delete', slot: TimetableSlotItem): void;
}>();
</script>

<template>
  <div
    @click="isAdmin && emit('edit', slotData)"
    class="w-full h-full min-h-[76px] rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] hover:bg-purple-500/[0.06] hover:border-bx-primary/70 hover:shadow-xs dark:bg-purple-950/20 dark:border-purple-500/20 transition-all duration-200 group relative flex items-center justify-center px-3 py-2 cursor-pointer shadow-2xs overflow-hidden"
  >
    <!-- Text Content: Centered in normal state, smoothly aligned to the opposite side (Right / Start) on hover -->
    <div
      class="flex flex-col items-center group-hover:items-start justify-center gap-1 w-full text-center group-hover:text-start transition-all duration-200 group-hover:pe-20"
    >
      <!-- Subject Name -->
      <span
        class="font-black text-xs sm:text-[13px] text-bx-title font-display block leading-tight tracking-tight truncate w-full"
        :title="slotData.subject_name"
      >
        {{ slotData.subject_name }}
      </span>

      <!-- Teacher Capsule -->
      <span
        class="inline-block px-2.5 py-0.5 text-[11px] font-bold bg-white/95 dark:bg-black/40 text-bx-muted group-hover:text-bx-primary border border-purple-500/15 rounded-full truncate max-w-full shadow-2xs transition-colors duration-200"
        :title="slotData.teacher_name"
      >
        {{ slotData.teacher_name }}
      </span>
    </div>

    <!-- Actions: Standard Taqniya Action Buttons on the Left (Side-by-side circular buttons matching project design system) -->
    <div
      v-if="isAdmin"
      class="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-10 pointer-events-none group-hover:pointer-events-auto"
    >
      <!-- Edit Button -->
      <button
        type="button"
        @click.stop="emit('edit', slotData)"
        class="w-8 h-8 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-110 active:scale-95"
        title="تعديل موعد الحصة"
      >
        <Edit2 class="w-4 h-4" />
      </button>

      <!-- Delete Button -->
      <button
        type="button"
        @click.stop="emit('delete', slotData)"
        class="w-8 h-8 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-110 active:scale-95"
        title="فك الحصة من الجدول"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
