<script setup lang="ts">
import { Inbox } from 'lucide-vue-next';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
  headerClass?: string;
  cellClass?: string;
  width?: string;
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    items: any[];
    isLoading?: boolean;
    rowKey?: string;
    emptyTitle?: string;
    emptySubtitle?: string;
    emptyIcon?: any;
    loadingText?: string;
  }>(),
  {
    isLoading: false,
    rowKey: 'id',
    emptyTitle: 'لا توجد سجلات متاحة حالياً',
    emptySubtitle: 'جرب تعديل محددات البحث أو إعادة ضبط الفلاتر.',
    loadingText: 'جاري تحميل واستدعاء البيانات...',
  },
);

defineEmits<{
  (e: 'row-click', item: any): void;
}>();
</script>

<template>
  <div class="bx-card bg-bx-surface border border-bx-border rounded-2xl overflow-hidden shadow-xs" dir="rtl">
    <div class="overflow-x-auto">
      <table class="w-full text-start text-xs">
        <!-- Table Header -->
        <thead>
          <tr class="text-bx-muted bg-bx-table-header border-b border-bx-divider">
            <th
              v-for="col in columns"
              :key="col.key"
              class="py-3.5 px-4 font-black"
              :class="[
                col.align === 'end' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start',
                col.headerClass || '',
              ]"
              :style="col.width ? { width: col.width } : {}"
            >
              <slot :name="`header-${col.key}`" :column="col">
                {{ col.label }}
              </slot>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-bx-divider">
          <!-- 1. Loading State -->
          <tr v-if="isLoading">
            <td :colspan="columns.length" class="py-14 text-center text-bx-muted">
              <slot name="loading">
                <div class="w-7 h-7 border-2 border-bx-primary border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
                <span class="font-medium">{{ loadingText }}</span>
              </slot>
            </td>
          </tr>

          <!-- 2. Empty State -->
          <tr v-else-if="!items || items.length === 0">
            <td :colspan="columns.length" class="py-14 text-center text-bx-muted font-bold">
              <slot name="empty">
                <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-bx-primary flex items-center justify-center mx-auto mb-2.5 font-black">
                  <component :is="emptyIcon || Inbox" class="w-5 h-5" />
                </div>
                <p class="text-bx-title font-bold text-sm">{{ emptyTitle }}</p>
                <p class="text-[11px] text-bx-muted mt-1 font-normal">{{ emptySubtitle }}</p>
              </slot>
            </td>
          </tr>

          <!-- 3. Success / Data Rows -->
          <tr
            v-else
            v-for="(item, index) in items"
            :key="item[rowKey] ?? index"
            class="hover:bg-bx-row-hover transition-colors"
            @click="$emit('row-click', item)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="py-3.5 px-4 text-bx-title"
              :class="[
                col.align === 'end' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start',
                col.cellClass || '',
              ]"
            >
              <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]" :index="index">
                {{ item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
