<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

export interface TaqniyaSelectOption {
  value: string | number;
  label: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    options: TaqniyaSelectOption[];
    placeholder?: string;
    icon?: any;
    fullWidth?: boolean;
    disabled?: boolean;
  }>(),
  {
    fullWidth: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | number): void;
}>();

const isOpen = ref(false);

const selectedLabel = computed(() => {
  const found = props.options.find((o) => String(o.value) === String(props.modelValue));
  return found ? found.label : props.placeholder || 'اختر...';
});

const selectOption = (val: string | number) => {
  emit('update:modelValue', val);
  isOpen.value = false;
};
</script>

<template>
  <div
    class="relative text-start"
    :class="fullWidth ? 'w-full block' : 'inline-block w-auto min-w-[170px]'"
  >
    <!-- Trigger Button (Taqniya bx-dropdown-trigger) -->
    <button
      type="button"
      :disabled="disabled"
      @click="isOpen = !isOpen"
      class="bx-dropdown-trigger !h-[42px] !min-h-[42px] !py-0 px-4 rounded-2xl w-full text-xs font-bold text-bx-title border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] hover:border-bx-primary transition-all shadow-xs flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <div class="flex items-center gap-2 truncate">
        <component :is="icon" v-if="icon" class="w-3.5 h-3.5 text-bx-muted shrink-0" />
        <span class="truncate">{{ selectedLabel }}</span>
      </div>
      <ChevronDown
        class="w-3.5 h-3.5 text-bx-muted shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180 text-bx-primary': isOpen }"
      />
    </button>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40"
    ></div>

    <!-- Dropdown Menu (Taqniya bx-dropdown-menu) -->
    <div
      v-if="isOpen"
      class="bx-dropdown-menu z-50 p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)]"
      :class="fullWidth ? 'w-full min-w-full' : '!min-w-full !w-max'"
    >
      <div
        v-for="opt in options"
        :key="opt.value"
        @click="selectOption(opt.value)"
        class="bx-dropdown-item flex items-center justify-between gap-3 text-xs font-bold text-bx-text rounded-xl !py-2 !px-3 cursor-pointer transition-all hover:!bg-[var(--bx-row-hover)] hover:text-bx-title"
        :class="{ 'active !bg-[var(--bx-primary)]/10 !text-bx-primary font-black': String(opt.value) === String(modelValue) }"
      >
        <span class="whitespace-nowrap">{{ opt.label }}</span>
        <Check v-if="String(opt.value) === String(modelValue)" class="w-3.5 h-3.5 text-bx-primary shrink-0" />
      </div>
    </div>
  </div>
</template>
