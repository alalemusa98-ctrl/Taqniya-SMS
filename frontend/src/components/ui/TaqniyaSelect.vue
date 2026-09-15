<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Search, X } from 'lucide-vue-next';

export interface TaqniyaSelectOption {
  value: string | number;
  label: string;
  code?: string;
  subtext?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | (string | number)[] | null;
    options: TaqniyaSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    icon?: any;
    fullWidth?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    searchable?: boolean;
    placement?: 'auto' | 'up' | 'down';
  }>(),
  {
    fullWidth: false,
    disabled: false,
    multiple: false,
    searchable: true,
    placement: 'auto',
    searchPlaceholder: 'بحث سريع في الخيارات...',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

const selectedValues = computed<(string | number)[]>(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue;
  }
  if (props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== '') {
    return [props.modelValue];
  }
  return [];
});

const isSelected = (val: string | number) => {
  return selectedValues.value.some((v) => String(v) === String(val));
};

const selectedLabel = computed(() => {
  if (props.multiple) {
    if ((selectedValues.value?.length || 0) === 0) return props.placeholder || 'اختر...';
    return `${selectedValues.value?.length || 0} محددة`;
  }
  const found = (props.options || []).find((o) => String(o.value) === String(props.modelValue));
  return found ? found.label : props.placeholder || 'اختر...';
});

const getOption = (val: string | number) => {
  return (props.options || []).find((o) => String(o.value) === String(val));
};

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return props.options || [];
  const q = searchQuery.value.trim().toLowerCase();
  return (props.options || []).filter((opt) => {
    const matchLabel = (opt.label || '').toLowerCase().includes(q);
    const matchCode = (opt.code || '').toLowerCase().includes(q);
    const matchSubtext = (opt.subtext || '').toLowerCase().includes(q);
    const matchVal = String(opt.value).toLowerCase().includes(q);
    return matchLabel || matchCode || matchSubtext || matchVal;
  });
});

const containerRef = ref<HTMLElement | null>(null);
const dropdownMenuRef = ref<HTMLElement | null>(null);
const actualPlacement = ref<'down' | 'up'>('down');

const displayOptions = computed(() => {
  if (actualPlacement.value === 'up') {
    return [...filteredOptions.value].reverse();
  }
  return filteredOptions.value;
});

const updatePlacement = () => {
  if (props.placement === 'up') {
    actualPlacement.value = 'up';
    return;
  }
  if (props.placement === 'down') {
    actualPlacement.value = 'down';
    return;
  }
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // Detect nearest scrollable parent container (e.g. Drawer, Modal, or overflow element)
  let scrollParentBottom = viewportHeight;
  let parent = containerRef.value.parentElement;
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      const parentRect = parent.getBoundingClientRect();
      scrollParentBottom = Math.min(scrollParentBottom, parentRect.bottom);
      break;
    }
    parent = parent.parentElement;
  }

  const spaceBelow = scrollParentBottom - rect.bottom;
  const spaceAbove = rect.top;

  // If space below is less than 230px (fewer than ~4 items comfortably)
  // and there is more room above than below, open upwards!
  if (spaceBelow < 230 && spaceAbove > spaceBelow) {
    actualPlacement.value = 'up';
  } else {
    actualPlacement.value = 'down';
  }
};

const handleWindowEvents = () => {
  if (isOpen.value) {
    updatePlacement();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleWindowEvents);
  window.addEventListener('scroll', handleWindowEvents, true);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowEvents);
  window.removeEventListener('scroll', handleWindowEvents, true);
});

const toggleOpen = async () => {
  if (props.disabled) return;
  if (!isOpen.value) {
    updatePlacement();
  }
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    await nextTick();
    updatePlacement();
    if (actualPlacement.value === 'up' && dropdownMenuRef.value) {
      dropdownMenuRef.value.scrollTop = dropdownMenuRef.value.scrollHeight;
    }
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  }
};

const selectOption = (val: string | number) => {
  if (props.multiple) {
    const current = [...selectedValues.value];
    const index = current.findIndex((v) => String(v) === String(val));
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(val);
    }
    emit('update:modelValue', current);
  } else {
    emit('update:modelValue', val);
    isOpen.value = false;
  }
};

const removeOption = (val: string | number) => {
  if (props.multiple) {
    const current = selectedValues.value.filter((v) => String(v) !== String(val));
    emit('update:modelValue', current);
  }
};
</script>

<template>
  <div
    ref="containerRef"
    class="relative text-start font-sans"
    :class="fullWidth ? 'w-full block' : 'inline-block w-auto min-w-[190px]'"
    dir="rtl"
  >
    <!-- Trigger Button -->
    <button
      type="button"
      :disabled="disabled"
      @click="toggleOpen"
      class="min-h-[44px] py-2 px-4 rounded-2xl w-full text-xs font-bold text-bx-title border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] hover:border-bx-primary transition-all shadow-xs flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <!-- Multi-select chips or single select label -->
      <div class="flex items-center gap-2 truncate flex-1 min-w-0">
        <component :is="icon" v-if="icon" class="w-3.5 h-3.5 text-bx-muted shrink-0" />

        <!-- Multiple selection chips mode -->
        <template v-if="multiple && (selectedValues?.length || 0) > 0">
          <div class="flex flex-wrap items-center gap-1.5 py-0.5 overflow-hidden">
            <span
              v-for="val in selectedValues"
              :key="val"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-bx-primary/30 bg-purple-50 dark:bg-bx-primary/15 text-bx-primary text-[11px] font-bold shadow-xs"
            >
              <span class="truncate max-w-[120px]">{{ getOption(val)?.label || val }}</span>
              <X
                class="w-3 h-3 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                @click.stop="removeOption(val)"
              />
            </span>
          </div>
        </template>

        <!-- Single select mode -->
        <template v-else>
          <span class="truncate" :class="{ 'text-bx-muted font-normal': !modelValue && modelValue !== 0 }">
            {{ selectedLabel }}
          </span>
        </template>
      </div>

      <!-- Chevron Down -->
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

    <!-- Dropdown Menu (Matching Reference Image) -->
    <div
      v-if="isOpen"
      ref="dropdownMenuRef"
      class="z-50 p-2.5 max-h-72 overflow-y-auto rounded-2xl shadow-xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] space-y-2 absolute end-0"
      :class="[
        fullWidth ? 'w-full min-w-full' : 'min-w-[240px] w-max max-w-sm',
        actualPlacement === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      ]"
    >
      <!-- Quick Fuzzy Search Bar -->
      <div v-if="searchable && (options?.length || 0) > 0" class="relative">
        <div class="relative flex items-center">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full pl-8 pr-3.5 py-2 rounded-xl border border-[#B4AED8]/70 dark:border-white/15 bg-purple-500/[0.03] dark:bg-white/[0.04] text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all"
            @click.stop
          />
          <Search class="w-3.5 h-3.5 text-bx-muted absolute left-3 pointer-events-none" />
        </div>
      </div>

      <!-- Options List with Smooth Dividers -->
      <div class="divide-y divide-purple-100/60 dark:divide-white/[0.06]">
        <div
          v-for="opt in displayOptions"
          :key="opt.value"
          @click="selectOption(opt.value)"
          class="flex items-center justify-between gap-3 text-xs font-bold py-2.5 px-3 cursor-pointer transition-all rounded-xl"
          :class="
            isSelected(opt.value)
              ? 'bg-purple-100/80 dark:bg-bx-primary/25 text-bx-primary font-black'
              : 'text-bx-title hover:bg-purple-500/[0.05] dark:hover:bg-white/[0.04]'
          "
        >
          <!-- Right side (in RTL): Custom Radio/Checkbox + Label -->
          <div class="flex items-center gap-3 min-w-0">
            <!-- Custom Radio Button for Single Select (Taqniya official .bx-custom-radio) -->
            <input
              v-if="!multiple"
              type="radio"
              :checked="isSelected(opt.value)"
              class="bx-custom-radio pointer-events-none shrink-0"
              tabindex="-1"
            />

            <!-- Custom Checkbox for Multi Select (Taqniya official .bx-custom-check) -->
            <input
              v-else
              type="checkbox"
              :checked="isSelected(opt.value)"
              class="bx-custom-check pointer-events-none shrink-0"
              tabindex="-1"
            />

            <!-- Main Label -->
            <span class="truncate">{{ opt.label }}</span>
          </div>

          <!-- Left side (in RTL): Secondary Code / Badge / Subtext -->
          <span
            v-if="opt.code || opt.subtext"
            class="text-[11px] font-mono text-bx-muted shrink-0"
          >
            {{ opt.code || opt.subtext }}
          </span>
        </div>

        <!-- Empty Search State -->
        <div v-if="!filteredOptions || filteredOptions.length === 0" class="py-4 text-center text-xs text-bx-muted">
          لا توجد خيارات مطابقة للبحث
        </div>
      </div>
    </div>
  </div>
</template>
