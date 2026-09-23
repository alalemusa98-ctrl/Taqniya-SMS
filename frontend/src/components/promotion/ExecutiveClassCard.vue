<template>
  <div
    class="p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col gap-4 relative overflow-hidden group select-none"
    :class="
      isSelected
        ? 'bg-[var(--bx-surface-solid)] border-bx-primary ring-2 ring-bx-primary shadow-md'
        : 'bg-[var(--bx-surface-solid)] border-[#B4AED8]/50 dark:border-white/[0.08] hover:border-bx-primary/60 hover:shadow-sm'
    "
    @click="$emit('select', classSummary)"
  >
    <!-- Card Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col">
        <h3 class="text-base font-black text-bx-title font-display group-hover:text-bx-primary transition-colors">
          {{ classSummary.class_name }}
        </h3>
        <span class="text-xs text-bx-muted font-medium mt-0.5">
          المستوى الأكاديمي {{ classSummary.grade_level }}
        </span>
      </div>

      <div
        class="px-3 py-1 rounded-full text-xs font-black font-mono border flex items-center gap-1 shrink-0"
        :class="passRateBadgeClass"
      >
        <span>{{ passRate }}%</span>
        <span class="text-[10px] font-normal opacity-80">نجاح</span>
      </div>
    </div>

    <!-- Pass Rate Progress Bar -->
    <div class="w-full h-1.5 bg-black/[0.05] dark:bg-white/[0.08] rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="progressBarClass"
        :style="{ width: `${Math.min(100, Math.max(0, passRate))}%` }"
      ></div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-[#B4AED8]/30 dark:border-white/[0.04]">
      <div class="flex flex-col">
        <span class="text-[10px] font-bold text-bx-muted block">إجمالي الطلاب</span>
        <span class="text-sm font-black text-bx-title font-mono">{{ classSummary.total_students }}</span>
      </div>

      <div class="flex flex-col">
        <span class="text-[10px] font-bold text-bx-muted block">ناجح</span>
        <span class="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{{ classSummary.passed_count }}</span>
      </div>

      <div v-if="classSummary.second_round_count > 0" class="flex flex-col">
        <span class="text-[10px] font-bold text-bx-muted block">دور ثان</span>
        <span class="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{{ classSummary.second_round_count }}</span>
      </div>

      <div class="flex flex-col">
        <span class="text-[10px] font-bold text-bx-muted block">باقٍ للإعادة</span>
        <span class="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">{{ failedCount }}</span>
      </div>
    </div>

    <!-- Low Pass Alert -->
    <div
      v-if="passRate < 50 && classSummary.total_students > 0"
      class="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium"
    >
      <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
      <span>تنبيه: نسبة النجاح منخفضة تتطلب مراجعة.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import type { ExecutiveClassSummary } from '../../api/promotion.api';

interface Props {
  classSummary: ExecutiveClassSummary;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

defineEmits<{
  (e: 'select', summary: ExecutiveClassSummary): void;
}>();

const passRate = computed(() => {
  return props.classSummary.pass_rate_percentage ?? props.classSummary.passing_rate ?? 0;
});

const failedCount = computed(() => {
  return props.classSummary.failed_count ?? props.classSummary.retained_count ?? 0;
});

const passRateBadgeClass = computed(() => {
  const rate = passRate.value;
  if (rate >= 90) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (rate >= 75) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
});

const progressBarClass = computed(() => {
  const rate = passRate.value;
  if (rate >= 90) return 'bg-emerald-500';
  if (rate >= 75) return 'bg-amber-500';
  return 'bg-rose-500';
});
</script>
