<script setup lang="ts">
import { ChevronRight, ChevronLeft } from 'lucide-vue-next';

interface Props {
  currentPage: number;
  totalPages: number;
  total?: number;
  isLoading?: boolean;
  itemName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  total: undefined,
  isLoading: false,
  itemName: 'سجل',
});

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
}>();

const goToPage = (page: number) => {
  if (page < 1 || page > props.totalPages || props.isLoading || page === props.currentPage) {
    return;
  }
  emit('page-change', page);
};
</script>

<template>
  <div
    v-if="totalPages > 1"
    class="px-5 py-3 border-t border-bx-divider flex items-center justify-between text-xs font-bold text-bx-muted bg-purple-500/[0.01]"
    dir="rtl"
  >
    <div>
      صفحة <span class="text-bx-title font-black">{{ currentPage }}</span> من
      <span class="text-bx-title font-black">{{ totalPages }}</span>
      <template v-if="total !== undefined">
        (إجمالي {{ total }} {{ itemName }})
      </template>
    </div>

    <div class="flex items-center gap-2">
      <!-- Previous Page (in RTL, Right Chevron points backwards) -->
      <button
        type="button"
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage <= 1 || isLoading"
        class="p-1.5 rounded-xl border border-bx-border disabled:opacity-30 hover:border-bx-primary cursor-pointer transition text-bx-title disabled:cursor-not-allowed shadow-2xs hover:bg-purple-500/10 active:scale-95"
        title="الصفحة السابقة"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <!-- Next Page (in RTL, Left Chevron points forwards) -->
      <button
        type="button"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages || isLoading"
        class="p-1.5 rounded-xl border border-bx-border disabled:opacity-30 hover:border-bx-primary cursor-pointer transition text-bx-title disabled:cursor-not-allowed shadow-2xs hover:bg-purple-500/10 active:scale-95"
        title="الصفحة التالية"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
