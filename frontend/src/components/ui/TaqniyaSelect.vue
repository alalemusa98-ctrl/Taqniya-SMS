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
  <div class="relative inline-block text-start w-auto min-w-[140px]">
    <!-- Trigger Button (Taqniya bx-dropdown-trigger) -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="bx-dropdown-trigger w-full text-xs font-bold text-bx-title"
    >
      <div class="flex items-center gap-2">
        <component :is="icon" v-if="icon" class="w-3.5 h-3.5 text-bx-muted" />
        <span>{{ selectedLabel }}</span>
      </div>
      <ChevronDown
        class="w-3.5 h-3.5 text-bx-muted ms-2 transition-transform duration-200"
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
      class="bx-dropdown-menu z-50 py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
    >
      <div
        v-for="opt in options"
        :key="opt.value"
        @click="selectOption(opt.value)"
        class="bx-dropdown-item flex items-center justify-between text-xs font-bold text-bx-text"
        :class="{ 'active text-bx-primary font-black': opt.value === modelValue }"
      >
        <span>{{ opt.label }}</span>
        <Check v-if="opt.value === modelValue" class="w-3.5 h-3.5 text-bx-primary" />
      </div>
    </div>
  </div>
</template>
