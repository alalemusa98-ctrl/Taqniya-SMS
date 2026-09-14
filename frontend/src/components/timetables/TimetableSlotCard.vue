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
    class="w-full h-full min-h-[92px] rounded-2xl border border-purple-500/25 bg-purple-500/[0.035] hover:bg-purple-500/[0.07] hover:border-bx-primary hover:shadow-sm dark:bg-purple-950/20 dark:border-purple-500/20 transition-all duration-300 group relative flex flex-col items-center justify-center p-2.5 cursor-pointer shadow-2xs overflow-hidden"
  >
    <!-- Text Content: Centers in default state, scales down and shifts up gracefully on hover -->
    <div
      class="flex flex-col items-center justify-center gap-1.5 w-full text-center px-1 transition-all duration-300 ease-out group-hover:-translate-y-2.5"
    >
      <!-- Subject Name (Shrinks slightly on hover) -->
      <span
        class="font-black text-sm group-hover:text-xs text-bx-title font-display block leading-snug tracking-tight truncate w-full transition-all duration-300"
        :title="slotData.subject_name"
      >
        {{ slotData.subject_name }}
      </span>

      <!-- Teacher Capsule (Refined & scales slightly on hover) -->
      <span
        class="inline-block px-2.5 py-0.5 group-hover:py-0 text-xs group-hover:text-[10px] font-bold bg-white/95 dark:bg-black/40 text-bx-primary border border-purple-500/20 rounded-full truncate max-w-full shadow-2xs transition-all duration-300"
        :title="slotData.teacher_name"
      >
        {{ slotData.teacher_name }}
      </span>
    </div>

    <!-- Actions Bar: Slides up smoothly from the bottom on hover -->
    <div
      v-if="isAdmin"
      class="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2 translate-y-7 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-10 pointer-events-none group-hover:pointer-events-auto"
    >
      <button
        type="button"
        @click.stop="emit('edit', slotData)"
        class="w-7 h-7 rounded-full bg-white dark:bg-gray-800 text-bx-primary hover:bg-purple-50 shadow-xs border border-purple-200 dark:border-purple-800/40 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
        title="تعديل موعد الحصة"
      >
        <Edit2 class="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        @click.stop="emit('delete', slotData)"
        class="w-7 h-7 rounded-full bg-white dark:bg-gray-800 text-red-600 hover:bg-red-50 shadow-xs border border-red-200 dark:border-red-800/40 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
        title="فك الحصة من الجدول"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
