<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next';

const { toasts, remove } = useToast();

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'danger':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getThemeClasses = (type: string) => {
  switch (type) {
    case 'success':
      return {
        iconClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        progressBar: 'bg-emerald-500',
        borderClass: 'border-emerald-500/40 dark:border-emerald-500/30',
      };
    case 'danger':
      return {
        iconClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        progressBar: 'bg-rose-500',
        borderClass: 'border-rose-500/40 dark:border-rose-500/30',
      };
    case 'warning':
      return {
        iconClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        progressBar: 'bg-amber-500',
        borderClass: 'border-amber-500/40 dark:border-amber-500/30',
      };
    default:
      return {
        iconClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        progressBar: 'bg-blue-500',
        borderClass: 'border-blue-500/40 dark:border-blue-500/30',
      };
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-5 start-5 z-[999999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      dir="rtl"
    >
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0 scale-95"
        enter-to-class="transform translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100 scale-100"
        leave-to-class="transform -translate-y-2 opacity-0 scale-95"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="bx-toast-item pointer-events-auto shadow-2xl"
          :class="getThemeClasses(toast.type).borderClass"
        >
          <!-- Icon -->
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
            :class="getThemeClasses(toast.type).iconClass"
          >
            <component :is="getIcon(toast.type)" class="w-5 h-5" />
          </div>

          <!-- Text content -->
          <div class="flex-1 text-start pe-2">
            <h4 v-if="toast.title" class="text-xs font-black text-bx-title font-display">
              {{ toast.title }}
            </h4>
            <p class="text-xs text-bx-muted font-bold leading-relaxed mt-0.5">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close button -->
          <button
            @click="remove(toast.id)"
            class="p-1 rounded-lg text-bx-muted hover:text-bx-title transition-colors shrink-0 cursor-pointer"
            title="إغلاق"
          >
            <X class="w-4 h-4" />
          </button>

          <!-- Animated Progress Bar -->
          <div
            class="bx-toast-progress"
            :class="getThemeClasses(toast.type).progressBar"
            :style="{ animationDuration: `${toast.duration ?? 4000}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
