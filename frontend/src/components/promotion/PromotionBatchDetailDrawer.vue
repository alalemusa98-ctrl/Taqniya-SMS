<script setup lang="ts">
import { computed } from 'vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import type { PromotionBatch } from '../../api/promotion.api';
import { Award, Layers, Users, CheckCircle, AlertTriangle, XCircle, GraduationCap } from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  batch: PromotionBatch | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  batch: null,
  isLoading: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const drawerTitle = computed(() => {
  if (!props.batch) return 'تفاصيل دفعة الترحيل';
  const fromName = props.batch.from_academic_year_name || props.batch.from_academic_year?.name || `العام ${props.batch.from_academic_year_id}`;
  const toName = props.batch.to_academic_year_name || props.batch.to_academic_year?.name || `العام ${props.batch.to_academic_year_id}`;
  return `دفعة الترحيل: من ${fromName} إلى ${toName}`;
});

const drawerSubtitle = computed(() => {
  if (!props.batch) return '';
  const dateStr = new Date(props.batch.created_at).toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const executor = props.batch.executed_by_name || 'مدير النظام';
  return `تم التنفيذ بواسطة: ${executor} — ${dateStr}`;
});

const statsColumns: TableColumn[] = [
  { key: 'class_name', label: 'الصف الدراسي', align: 'start' },
  { key: 'total', label: 'العدد الإجمالي', align: 'center' },
  { key: 'promoted', label: 'المنقولون', align: 'center' },
  { key: 'retained', label: 'الباقون للإعادة', align: 'center' },
  { key: 'pass_rate', label: 'نسبة النجاح', align: 'center' },
];

const classStatsItems = computed(() => {
  if (!props.batch?.class_statistics || !Array.isArray(props.batch.class_statistics)) {
    return [];
  }
  return props.batch.class_statistics;
});
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="drawerTitle"
    :subtitle="drawerSubtitle"
    :icon="Layers"
    max-width="max-w-[700px]"
    @close="emit('close')"
  >
    <div v-if="batch" class="space-y-6" dir="rtl">
      <!-- KPI Overview Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <!-- Total Students -->
        <div class="bg-bx-surface-2 border border-bx-border rounded-xl p-3.5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Users class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted block">إجمالي الطلاب</span>
            <span class="text-base font-black text-bx-title">{{ batch.total_students }}</span>
          </div>
        </div>

        <!-- Promoted -->
        <div class="bg-bx-surface-2 border border-bx-border rounded-xl p-3.5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted block">المنقولون (ناجح)</span>
            <span class="text-base font-black text-emerald-600">{{ batch.total_promoted }}</span>
          </div>
        </div>

        <!-- Pass Rate -->
        <div class="bg-bx-surface-2 border border-bx-border rounded-xl p-3.5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Award class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted block">نسبة النجاح العامة</span>
            <span class="text-base font-black text-indigo-600">{{ batch.overall_passing_rate }}%</span>
          </div>
        </div>

        <!-- Second Round -->
        <div class="bg-bx-surface-2 border border-bx-border rounded-xl p-3.5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted block">دور ثان</span>
            <span class="text-base font-black text-amber-600">{{ batch.total_second_round }}</span>
          </div>
        </div>

        <!-- Retained -->
        <div class="bg-bx-surface-2 border border-bx-border rounded-xl p-3.5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted block">باقون للإعادة</span>
            <span class="text-base font-black text-rose-600">{{ batch.total_retained }}</span>
          </div>
        </div>

        <!-- Graduated -->
        <div class="bg-bx-surface-2 border border-bx-border rounded-xl p-3.5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <GraduationCap class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted block">المتخرجون</span>
            <span class="text-base font-black text-purple-600">{{ batch.total_graduated }}</span>
          </div>
        </div>
      </div>

      <!-- Class Statistics Table -->
      <div>
        <h4 class="text-xs font-black text-bx-title mb-2.5 flex items-center gap-2">
          <Layers class="w-4 h-4 text-bx-primary" />
          <span>إحصائيات الصفوف الدراسية في هذه الدفعة</span>
        </h4>
        <TaqniyaTable
          :columns="statsColumns"
          :items="classStatsItems"
          row-key="class_name"
          empty-title="لا توجد إحصائيات صفوف متوفرة لهذه الدفعة"
        >
          <template #cell-class_name="{ value }">
            <span class="font-bold text-bx-title">{{ value }}</span>
          </template>

          <template #cell-promoted="{ value }">
            <span class="font-bold text-emerald-600">{{ value }}</span>
          </template>

          <template #cell-retained="{ value }">
            <span class="font-bold text-rose-600">{{ value }}</span>
          </template>

          <template #cell-pass_rate="{ value }">
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                 :class="value >= 90 ? 'bg-emerald-500/10 text-emerald-600' : value >= 75 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'">
              <span>{{ value }}%</span>
            </div>
          </template>
        </TaqniyaTable>
      </div>

      <!-- Execution Notes -->
      <div v-if="batch.execution_notes" class="bg-bx-surface-2 border border-bx-border rounded-xl p-4">
        <h4 class="text-xs font-bold text-bx-muted mb-1">ملاحظات التنفيذ</h4>
        <p class="text-xs text-bx-title leading-relaxed">{{ batch.execution_notes }}</p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="px-4 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
      >
        إغلاق
      </button>
    </template>
  </TaqniyaDrawer>
</template>
