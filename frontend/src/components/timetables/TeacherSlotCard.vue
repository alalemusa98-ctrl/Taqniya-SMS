<script setup lang="ts">
defineProps<{
  subjectName?: string;
  className?: string;
  sectionName?: string;
}>();
</script>

<template>
  <div
    class="w-full h-full min-h-[78px] rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-950/20 dark:border-emerald-500/20 shadow-2xs overflow-hidden flex flex-col justify-center"
  >
    <div class="flex flex-col items-center justify-center h-full w-full gap-2 px-2.5 py-3 text-center">
      <!-- Subject Name -->
      <span
        class="font-black text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 font-display block leading-snug tracking-tight truncate w-full"
        :title="subjectName"
      >
        {{ subjectName }}
      </span>

      <!-- Class & Section Pill -->
      <span
        class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/95 dark:bg-black/40 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 truncate max-w-full shadow-2xs"
        :title="`${className} - ${sectionName}`"
      >
        {{ className }} - {{ sectionName }}
      </span>
    </div>
  </div>
</template>
