<script setup lang="ts">
import { watch, onUnmounted, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: any;
    maxWidth?: string;
  }>(),
  {
    maxWidth: 'max-w-[500px]',
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-right">
      <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden" dir="rtl">
        <!-- Backdrop with click-to-close -->
        <div
          @click="emit('close')"
          class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        ></div>

        <!-- Drawer Panel docked on the RIGHT -->
        <div
          class="fixed inset-y-0 right-0 max-w-full flex drawer-right-panel"
          style="right: 0 !important; left: auto !important;"
        >
          <div
            class="w-screen h-full bg-[var(--bx-surface-solid)] border-s-2 border-bx-border shadow-2xl flex flex-col justify-between overflow-hidden"
            :class="maxWidth"
          >
            <!-- Fixed Header -->
            <div class="px-6 py-4 border-b border-bx-border shrink-0 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  v-if="icon"
                  class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold border border-bx-primary/20 shadow-xs"
                >
                  <component :is="icon" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-display font-black text-sm text-bx-title leading-snug">
                    {{ title }}
                  </h3>
                  <p v-if="subtitle" class="text-[11px] text-bx-muted font-medium mt-0.5">
                    {{ subtitle }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                @click="emit('close')"
                class="bx-icon-btn p-2 rounded-xl border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-all cursor-pointer"
                title="إغلاق (Esc)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Scrollable Content Body -->
            <div class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bx-drawer-scroll">
              <slot></slot>
            </div>

            <!-- Fixed Action Buttons Footer -->
            <div
              v-if="$slots.footer"
              class="p-6 sm:p-8 pt-4 border-t border-bx-border bg-[var(--bx-surface-solid)] shrink-0 flex items-center justify-end gap-3"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
