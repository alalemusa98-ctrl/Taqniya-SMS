<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  maxWidth: 'md',
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-[96vw]',
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('close');
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (props.isOpen && props.closeOnEscape && e.key === 'Escape') {
    emit('close');
  }
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <!-- Backdrop click handler -->
      <div class="fixed inset-0" @click="handleBackdropClick"></div>

      <!-- Modal Card -->
      <div
        class="relative z-10 w-full max-h-[92vh] flex flex-col rounded-3xl bg-bx-surface border border-bx-border shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200"
        :class="maxWidthClasses[maxWidth]"
      >
        <!-- Header slot or default header -->
        <div class="shrink-0">
          <slot name="header">
            <div v-if="title || showCloseButton" class="flex items-center justify-between border-b border-bx-divider pb-4">
              <div class="flex items-center gap-3">
                <slot name="icon" />
                <div>
                  <h3 v-if="title" class="text-base font-bold text-bx-title font-display">{{ title }}</h3>
                  <p v-if="subtitle" class="text-xs text-bx-muted font-normal mt-0.5">{{ subtitle }}</p>
                </div>
              </div>

              <button
                v-if="showCloseButton"
                type="button"
                @click="emit('close')"
                class="p-1.5 rounded-xl text-bx-muted hover:text-bx-primary hover:bg-purple-500/10 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </slot>
        </div>

        <!-- Body Content -->
        <div class="space-y-5 overflow-y-auto py-2 flex-1 pr-1 pl-1">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="pt-4 border-t border-bx-divider shrink-0">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
