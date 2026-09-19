<script setup lang="ts">
import { AlertCircle, Loader2 } from 'lucide-vue-next';

export interface MatrixColumn {
  id: string | number;
  name: string;
  subtext?: string;
  icon?: any;
}

export interface MatrixRow {
  id: string | number;
  title: string;
  badge?: string;
  badgeClass?: string;
  subtext?: string;
  cells?: Record<string | number, any>;
  [key: string]: any;
}

withDefaults(
  defineProps<{
    columns: MatrixColumn[];
    rows: MatrixRow[];
    yAxisTitle?: string;
    yAxisIcon?: any;
    isLoading?: boolean;
    emptyTitle?: string;
    emptySubtitle?: string;
    emptyIcon?: any;
    loadingText?: string;
  }>(),
  {
    yAxisTitle: 'الصف الدراسي والمرحلة',
    isLoading: false,
    emptyTitle: 'لا توجد بيانات تطابق محددات البحث والتصفية',
    emptySubtitle: 'جرب تعديل محددات التصفية أو إضافة عناصر جديدة.',
    loadingText: 'جاري تحميل مصفوفة البيانات...',
  },
);
</script>

<template>
  <div dir="rtl" class="w-full">
    <!-- 1. Loading State -->
    <div v-if="isLoading" class="py-24 text-center text-bx-muted">
      <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
      <span class="text-xs font-bold">{{ loadingText }}</span>
    </div>

    <!-- 2. Empty State -->
    <div
      v-else-if="!rows || rows.length === 0"
      class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
    >
      <component :is="emptyIcon || AlertCircle" class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
      <h3 class="text-sm font-bold text-bx-title">{{ emptyTitle }}</h3>
      <p class="text-xs text-bx-muted">{{ emptySubtitle }}</p>
    </div>

    <!-- 3. Matrix Table Content -->
    <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <!-- Table Header -->
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/15 text-bx-muted">
              <!-- Sticky Y-Axis Header -->
              <th class="py-3.5 px-5 font-bold text-start whitespace-nowrap w-72 min-w-[240px] max-w-[280px] sticky start-0 bg-[var(--bx-table-header)] z-20 border-e border-[#B4AED8]/60 dark:border-white/15">
                <slot name="y-header">
                  <div class="flex items-center gap-2">
                    <component :is="yAxisIcon" v-if="yAxisIcon" class="w-4 h-4 text-bx-primary" />
                    <span>{{ yAxisTitle }}</span>
                  </div>
                </slot>
              </th>

              <!-- Dynamic X-Axis Columns -->
              <th
                v-for="col in columns"
                :key="col.id"
                class="py-3 px-3 font-bold text-center whitespace-nowrap border-e border-[#B4AED8]/60 dark:border-white/15 last:border-e-0"
              >
                <slot name="column-header" :column="col">
                  <div class="flex flex-col items-center justify-center gap-1">
                    <div class="flex items-center gap-1.5 text-bx-title font-black text-xs sm:text-sm">
                      <component :is="col.icon" v-if="col.icon" class="w-3.5 h-3.5 text-bx-primary" />
                      <span>{{ col.name }}</span>
                    </div>
                    <span v-if="col.subtext" class="text-[10px] font-mono text-bx-muted">{{ col.subtext }}</span>
                  </div>
                </slot>
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/15">
            <tr
              v-for="row in rows"
              :key="row.id"
              class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors"
            >
              <!-- Sticky Y-Axis Cell -->
              <td class="py-3 px-5 whitespace-nowrap sticky start-0 bg-[var(--bx-surface-solid)] z-10 border-e border-[#B4AED8]/60 dark:border-white/15">
                <slot name="row-header" :row="row">
                  <div class="space-y-1">
                    <span class="font-black text-sm text-bx-title block leading-tight">{{ row.title }}</span>
                    <div class="flex items-center gap-2">
                      <span v-if="row.badge" class="px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="row.badgeClass || ''">
                        {{ row.badge }}
                      </span>
                      <span v-if="row.subtext" class="text-[10px] font-semibold text-bx-muted">
                        {{ row.subtext }}
                      </span>
                    </div>
                  </div>
                </slot>
              </td>

              <!-- Matrix Intersection Cells -->
              <td
                v-for="col in columns"
                :key="col.id"
                class="py-2.5 px-3 text-center align-middle border-e border-[#B4AED8]/60 dark:border-white/15 last:border-e-0"
              >
                <slot
                  name="cell"
                  :row="row"
                  :column="col"
                  :cell-data="row.cells ? row.cells[col.id] : undefined"
                >
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">—</span>
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
