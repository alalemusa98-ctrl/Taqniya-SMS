<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

interface Option {
  value: string | number;
  label: string;
}

const props = defineProps<{
  modelValue: string | number;
  options: Option[];
  placeholder?: string;
  icon?: any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | number): void;
}>();

const isOpen = ref(false);

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue);
  return found ? found.label : props.placeholder || 'اختر...';
});

const selectOption = (val: string | number) => {
  emit('update:modelValue', val);
  isOpen.value = false;
};
</script>

<template>
  <div class="relative inline-block text-start w-auto min-w-[170px]">
    <!-- Trigger Button (Taqniya bx-dropdown-trigger) -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="bx-dropdown-trigger !h-[42px] !min-h-[42px] !py-0 px-4 rounded-2xl w-full text-xs font-bold text-bx-title border border-bx-border bg-[var(--bx-surface-solid)] hover:border-bx-primary transition-all shadow-sm flex items-center justify-between gap-3"
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
      class="bx-dropdown-menu !min-w-full !w-max z-50 p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-xl border border-bx-border bg-[var(--bx-surface-solid)]"
    >
      <div
        v-for="opt in options"
        :key="opt.value"
        @click="selectOption(opt.value)"
        class="bx-dropdown-item flex items-center justify-between gap-3 text-xs font-bold text-bx-text rounded-xl !py-2 !px-3 cursor-pointer transition-all hover:!bg-[var(--bx-row-hover)] hover:text-bx-title"
        :class="{ 'active !bg-[var(--bx-primary)]/10 !text-bx-primary font-black': opt.value === modelValue }"
      >
        <span class="whitespace-nowrap">{{ opt.label }}</span>
        <Check v-if="opt.value === modelValue" class="w-3.5 h-3.5 text-bx-primary shrink-0" />
      </div>
    </div>
  </div>
</template>
