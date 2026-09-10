<script setup lang="ts">
import { computed } from 'vue';

export interface TaqniyaKpiCardProps {
  title: string;
  value: string | number;
  icon?: any;
  variant?: 'primary' | 'blue' | 'amber' | 'emerald' | 'rose';
  badgeText?: string;
  pulseBadge?: boolean;
  progress?: number;
}

const props = withDefaults(defineProps<TaqniyaKpiCardProps>(), {
  variant: 'primary',
  pulseBadge: false,
  progress: 100,
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'blue':
      return {
        icon: 'border-2 border-blue-500/30 text-blue-500 bg-blue-500/[0.04]',
        badge: 'border-blue-500/30 text-blue-600 dark:text-blue-400',
        value: 'text-blue-600 dark:text-blue-400',
        progressBar: 'bg-blue-500',
        progressBorder: 'border-blue-500/30',
      };
    case 'amber':
      return {
        icon: 'border-2 border-amber-500/30 text-amber-500 bg-amber-500/[0.04]',
        badge: 'border-amber-500/30 text-amber-600 dark:text-amber-400',
        value: 'text-amber-600 dark:text-amber-400',
        progressBar: 'bg-amber-500',
        progressBorder: 'border-amber-500/30',
      };
    case 'emerald':
      return {
        icon: 'border-2 border-emerald-500/30 text-emerald-500 bg-emerald-500/[0.04]',
        badge: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        value: 'text-emerald-600 dark:text-emerald-400',
        progressBar: 'bg-emerald-500',
        progressBorder: 'border-emerald-500/30',
      };
    case 'rose':
      return {
        icon: 'border-2 border-rose-500/30 text-rose-500 bg-rose-500/[0.04]',
        badge: 'border-rose-500/30 text-rose-600 dark:text-rose-400',
        value: 'text-rose-600 dark:text-rose-400',
        progressBar: 'bg-rose-500',
        progressBorder: 'border-rose-500/30',
      };
    case 'primary':
    default:
      return {
        icon: 'border border-[#B4AED8]/70 dark:border-white/10 text-bx-primary bg-purple-500/[0.04]',
        badge: 'border-[#B4AED8]/70 dark:border-white/10 text-bx-primary',
        value: 'text-bx-title',
        progressBar: 'bg-bx-primary',
        progressBorder: 'border-[#B4AED8]/50 dark:border-white/10',
      };
  }
});

const clampedProgress = computed(() => {
  const val = Number(props.progress ?? 100);
  if (isNaN(val)) return 100;
  return Math.min(100, Math.max(0, val));
});
</script>

<template>
  <div class="bx-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
    <!-- Top Tier: Icon & Badge/Tag -->
    <div class="flex items-center justify-between">
      <span
        v-if="icon"
        class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
        :class="variantClasses.icon"
      >
        <component :is="icon" class="w-5 h-5" />
      </span>
      <div v-else></div>

      <span
        v-if="badgeText || $slots.badge"
        class="bx-tag font-mono text-[11px]"
        :class="variantClasses.badge"
      >
        <span
          v-if="pulseBadge"
          class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
        ></span>
        <slot name="badge">
          <span>{{ badgeText }}</span>
        </slot>
      </span>
    </div>

    <!-- Middle Tier: Title & Metric Value -->
    <div>
      <span class="text-xs font-bold text-bx-muted uppercase tracking-wider block">
        {{ title }}
      </span>
      <h4
        class="text-2xl sm:text-3xl font-black font-display font-mono mt-0.5"
        :class="variantClasses.value"
      >
        {{ value }}
      </h4>
    </div>

    <!-- Bottom Tier: Micro Progress / Indicator Bar -->
    <div
      class="w-full h-2 rounded-full overflow-hidden border bg-slate-100 dark:bg-white/[0.05]"
      :class="variantClasses.progressBorder"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="variantClasses.progressBar"
        :style="{ width: `${clampedProgress}%` }"
      ></div>
    </div>
  </div>
</template>
