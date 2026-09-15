<script setup lang="ts">
import { Calendar, Plus } from 'lucide-vue-next';

defineProps<{
  canCreate?: boolean;
  message?: string;
}>();

const emit = defineEmits<{
  (e: 'create'): void;
}>();
</script>

<template>
  <div
    class="w-full py-16 px-4 rounded-3xl border border-dashed border-[#B4AED8] dark:border-white/[0.12] bg-purple-500/[0.02] dark:bg-white/[0.02] flex flex-col items-center justify-center text-center backdrop-blur-xs"
  >
    <div
      class="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-bx-primary mb-4 shadow-sm"
    >
      <Calendar class="w-8 h-8" />
    </div>

    <h3 class="text-base font-black text-bx-title font-display mb-1">
      {{ message || 'لا توجد اختبارات أو تطبيقات دورية مسجلة بحسب خيارات الفلترة المحددة' }}
    </h3>

    <p class="text-xs text-bx-muted max-w-sm mb-5 leading-relaxed">
      يمكنك تعديل خيارات التصفية والبحث في الأعلى أو جدولة ونشر اختبار دوري جديد للطلاب.
    </p>

    <button
      v-if="canCreate"
      type="button"
      @click="emit('create')"
      class="px-5 py-2.5 rounded-full bg-bx-primary hover:bg-bx-primary-hover text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
    >
      <Plus class="w-4 h-4" />
      <span>جدولة أول اختبار الآن</span>
    </button>
  </div>
</template>
