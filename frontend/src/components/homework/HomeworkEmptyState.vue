<script setup lang="ts">
import { BookOpen, Plus } from 'lucide-vue-next';

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
    class="w-full py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center backdrop-blur-xs"
  >
    <div
      class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm"
    >
      <BookOpen class="w-8 h-8" />
    </div>

    <h3 class="text-base font-black text-slate-800 dark:text-slate-100 font-display mb-1">
      {{ message || 'لا توجد واجبات مدرسية مسجلة بحسب خيارات الفلترة المحددة' }}
    </h3>

    <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
      يمكنك تعديل خيارات التصفية والبحث في الأعلى أو إنشاء ونشر تكليف منزلي جديد للطلاب.
    </p>

    <button
      v-if="canCreate"
      type="button"
      @click="emit('create')"
      class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
    >
      <Plus class="w-4 h-4" />
      إنشاء أول واجب مدرسي
    </button>
  </div>
</template>
