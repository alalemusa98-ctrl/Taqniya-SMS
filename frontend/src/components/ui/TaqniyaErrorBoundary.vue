<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { AlertTriangle, RefreshCw } from 'lucide-vue-next';

const hasError = ref(false);
const errorMessage = ref<string>('');
const errorDetails = ref<string>('');
const retryKey = ref(0);

onErrorCaptured((err: any, _instance, info) => {
  console.error('[TaqniyaErrorBoundary] Caught rendering/component error:', err, info);
  hasError.value = true;
  errorMessage.value = err?.message || 'حدث خطأ غير متوقع أثناء عرض هذا القسم.';
  errorDetails.value = info || '';
  return false; // prevent further propagation
});

function handleRetry() {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  retryKey.value++;
}
</script>

<template>
  <div v-if="hasError" class="p-8 text-center" dir="rtl">
    <div
      class="max-w-md mx-auto p-6 rounded-3xl border border-rose-500/30 bg-rose-500/[0.04] backdrop-blur-xs shadow-lg space-y-4"
    >
      <div
        class="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto"
      >
        <AlertTriangle class="w-6 h-6" />
      </div>

      <div class="space-y-1">
        <h3 class="text-sm font-black text-bx-title font-display">تعذر عرض محتوى الشاشة</h3>
        <p class="text-xs text-bx-muted leading-relaxed">
          {{ errorMessage }}
        </p>
      </div>

      <div class="pt-2">
        <button
          @click="handleRetry"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>إعادة المحاولة وتحديث العرض</span>
        </button>
      </div>
    </div>
  </div>

  <template v-else>
    <div :key="retryKey">
      <slot />
    </div>
  </template>
</template>
