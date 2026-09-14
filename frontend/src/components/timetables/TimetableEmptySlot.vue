<script setup lang="ts">
defineProps<{
  isAdmin?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <!-- Admin: Entire Box is an interactive button -->
  <button
    v-if="isAdmin"
    type="button"
    @click="emit('click')"
    class="w-full h-full min-h-[92px] rounded-2xl border-2 border-dashed border-[#B4AED8]/60 hover:border-bx-primary bg-purple-500/[0.015] hover:bg-purple-500/[0.05] dark:hover:bg-purple-950/20 transition-all duration-150 flex items-center justify-center p-2 cursor-pointer group shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-bx-primary/30"
    title="انقر لتسكين حصة في هذا الموعد"
  >
    <span
      class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold text-bx-muted group-hover:text-bx-primary group-hover:bg-purple-500/10 border border-transparent group-hover:border-purple-500/20 transition-all duration-150 select-none"
    >
      + تسكين
    </span>
  </button>

  <!-- Non-Admin: Static empty state placeholder -->
  <div
    v-else
    class="w-full h-full min-h-[92px] rounded-2xl border border-dashed border-bx-border/40 bg-gray-50/40 dark:bg-white/[0.01] flex items-center justify-center text-[11px] font-medium text-bx-muted/50 select-none"
  >
    شاغر
  </div>
</template>
