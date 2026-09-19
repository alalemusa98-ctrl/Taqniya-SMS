<script setup lang="ts">
import { AlertCircle, Loader2, Plus } from 'lucide-vue-next';

export interface GroupedTableColumn {
  key: string;
  label: string;
  minWidth?: string;
  width?: string;
  align?: 'start' | 'center' | 'end';
  icon?: any;
  headerClass?: string;
  cellClass?: string;
}

export interface TableGroup {
  id: string | number;
  title: string;
  icon?: any;
  badge?: string;
  badgeClass?: string;
  subtitle?: string;
  columns?: GroupedTableColumn[];
  items: any[];
  [key: string]: any;
}

withDefaults(
  defineProps<{
    groups: TableGroup[];
    defaultColumns?: GroupedTableColumn[];
    isLoading?: boolean;
    emptyTitle?: string;
    emptySubtitle?: string;
    emptyIcon?: any;
    loadingText?: string;
    groupEmptyText?: string;
    showGroupAction?: boolean;
    groupActionText?: string;
    groupActionIcon?: any;
  }>(),
  {
    isLoading: false,
    emptyTitle: 'لا توجد بيانات تطابق محددات البحث',
    emptySubtitle: 'جرب تعديل محددات التصفية أو إضافة عناصر جديدة.',
    loadingText: 'جاري تحميل البيانات المجمعة...',
    groupEmptyText: 'لا توجد عناصر مسندة ضمن هذه المجموعة بعد.',
    showGroupAction: true,
    groupActionText: 'إضافة عنصر',
  },
);

defineEmits<{
  (e: 'group-action', group: TableGroup): void;
}>();
</script>

<template>
  <div dir="rtl" class="w-full">
    <!-- 1. Loading State -->
    <div v-if="isLoading" class="py-24 text-center text-bx-muted">
      <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
      <span class="text-xs font-bold">{{ loadingText }}</span>
    </div>

    <!-- 2. Empty Groups State -->
    <div
      v-else-if="!groups || groups.length === 0"
      class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
    >
      <component :is="emptyIcon || AlertCircle" class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
      <h3 class="text-sm font-bold text-bx-title">{{ emptyTitle }}</h3>
      <p class="text-xs text-bx-muted">{{ emptySubtitle }}</p>
    </div>

    <!-- 3. Grouped Cards List -->
    <div v-else class="space-y-6">
      <div
        v-for="grp in groups"
        :key="grp.id"
        :id="grp.domId || ('class-group-' + grp.id)"
        class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] shadow-xs transition-all duration-300"
      >
        <!-- Group Header Bar -->
        <div class="bg-purple-500/[0.04] dark:bg-white/[0.03] py-3.5 px-5 border-b border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-between rounded-t-2xl">
          <slot name="group-header" :group="grp">
            <div class="flex items-center gap-3">
              <div
                v-if="grp.icon"
                class="w-8 h-8 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-400/40 flex items-center justify-center text-bx-primary dark:text-purple-300 shrink-0"
              >
                <component :is="grp.icon" class="w-4 h-4" />
              </div>
              <div>
                <span class="font-black text-sm text-bx-title block leading-tight">{{ grp.title }}</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <span v-if="grp.badge" class="px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="grp.badgeClass || ''">
                    {{ grp.badge }}
                  </span>
                  <span v-if="grp.subtitle" class="text-[10px] font-semibold text-bx-muted">
                    {{ grp.subtitle }}
                  </span>
                </div>
              </div>
            </div>
          </slot>

          <slot name="group-actions" :group="grp">
            <button
              v-if="showGroupAction"
              @click="$emit('group-action', grp)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <component :is="groupActionIcon || Plus" class="w-3.5 h-3.5" />
              <span>{{ groupActionText }}</span>
            </button>
          </slot>
        </div>

        <!-- Sub-table -->
        <div class="rounded-b-2xl overflow-x-auto">
          <table class="w-full text-start border-collapse text-[11px]">
            <!-- Table Header -->
            <thead>
              <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8]/60 dark:border-white/15 text-bx-muted text-[11px]">
                <th
                  v-for="col in (grp.columns || defaultColumns || [])"
                  :key="col.key"
                  class="py-2.5 px-3.5 font-bold border-e border-[#B4AED8]/50 dark:border-white/10 last:border-e-0"
                  :class="[
                    col.align === 'center' ? 'text-center' : col.align === 'end' ? 'text-end' : 'text-start',
                    col.headerClass || '',
                  ]"
                  :style="{
                    minWidth: col.minWidth,
                    width: col.width,
                  }"
                >
                  <slot :name="`header-${col.key}`" :column="col" :group="grp">
                    <slot name="header" :column="col" :group="grp">
                      <div
                        class="flex items-center gap-1.5"
                        :class="{ 'justify-center': col.align === 'center', 'justify-end': col.align === 'end' }"
                      >
                        <component :is="col.icon" v-if="col.icon" class="w-3 h-3 text-bx-primary" />
                        <span>{{ col.label }}</span>
                      </div>
                    </slot>
                  </slot>
                </th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10">
              <!-- Empty rows in group -->
              <tr v-if="!grp.items || grp.items.length === 0" class="hover:bg-[var(--bx-row-hover)]/20 transition-colors">
                <td
                  :colspan="(grp.columns || defaultColumns || []).length || 1"
                  class="py-6 px-3.5 text-center text-bx-muted text-[11px]"
                >
                  <slot name="group-empty" :group="grp">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <AlertCircle class="w-7 h-7 text-bx-muted opacity-40" />
                      <span>{{ groupEmptyText }}</span>
                    </div>
                  </slot>
                </td>
              </tr>

              <!-- Data rows -->
              <tr
                v-else
                v-for="(item, itemIndex) in grp.items"
                :key="item.id || item.subject_id || itemIndex"
                class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150"
              >
                <td
                  v-for="col in (grp.columns || defaultColumns || [])"
                  :key="col.key"
                  class="py-2 px-3.5 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10 last:border-e-0"
                  :class="[
                    col.align === 'center' ? 'text-center' : col.align === 'end' ? 'text-end' : 'text-start',
                    col.cellClass || '',
                  ]"
                >
                  <slot
                    :name="`cell-${col.key}`"
                    :row="item"
                    :column="col"
                    :group="grp"
                    :value="item[col.key]"
                  >
                    <slot
                      name="cell"
                      :row="item"
                      :column="col"
                      :group="grp"
                      :value="item[col.key]"
                    >
                      <span class="text-bx-title font-medium">{{ item[col.key] ?? '—' }}</span>
                    </slot>
                  </slot>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
