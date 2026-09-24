<script setup lang="ts">
import { computed } from 'vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import TaqniyaKpiCard from '../ui/TaqniyaKpiCard.vue';
import type { PromotionBatch } from '../../api/promotion.api';
import {
  Award,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  RotateCcw,
  GraduationCap,
  FileText,
} from 'lucide-vue-next';

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
    hour: '2-digit',
    minute: '2-digit',
  });
  const executor = props.batch.executed_by_name || 'مدير النظام';
  return `تم التنفيذ بواسطة: ${executor} — ${dateStr}`;
});

const statsColumns: TableColumn[] = [
  { key: 'class_name', label: 'الصف الدراسي', align: 'start' },
  { key: 'total', label: 'العدد الإجمالي', align: 'center', width: '120px' },
  { key: 'promoted', label: 'المنقولون', align: 'center', width: '110px' },
  { key: 'retained', label: 'الباقون للإعادة', align: 'center', width: '120px' },
  { key: 'pass_rate', label: 'نسبة النجاح', align: 'center', width: '120px' },
];

const classStatsItems = computed(() => {
  if (!props.batch?.class_statistics) return [];
  let stats: any = props.batch.class_statistics;
  if (typeof stats === 'string') {
    try {
      stats = JSON.parse(stats);
    } catch {
      return [];
    }
  }
  return Array.isArray(stats) ? stats : [];
});
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="drawerTitle"
    :subtitle="drawerSubtitle"
    :icon="Layers"
    max-width="max-w-[760px]"
    @close="emit('close')"
  >
    <div v-if="batch" class="space-y-6" dir="rtl">
      <!-- 1. Official TaqniyaKpiCard Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <!-- 1. Total Students -->
        <TaqniyaKpiCard
          title="إجمالي الطلاب"
          :value="batch.total_students"
          :icon="Users"
          variant="blue"
          badge-text="معالجة الدفعة"
          :progress="100"
        />

        <!-- 2. Promoted Students -->
        <TaqniyaKpiCard
          title="المنقولون (ناجح)"
          :value="batch.total_promoted"
          :icon="CheckCircle2"
          variant="emerald"
          badge-text="مرحلون"
          :progress="batch.total_students > 0 ? (batch.total_promoted / batch.total_students) * 100 : 0"
        />

        <!-- 3. Overall Pass Rate -->
        <TaqniyaKpiCard
          title="نسبة النجاح العامة"
          :value="`${batch.overall_passing_rate}%`"
          :icon="Award"
          variant="primary"
          badge-text="معدل عام"
          :progress="batch.overall_passing_rate"
        />

        <!-- 4. Second Round -->
        <TaqniyaKpiCard
          title="الدور الثاني"
          :value="batch.total_second_round"
          :icon="Clock"
          variant="amber"
          badge-text="معلقون"
          :progress="batch.total_students > 0 ? (batch.total_second_round / batch.total_students) * 100 : 0"
        />

        <!-- 5. Retained Students -->
        <TaqniyaKpiCard
          title="باقون للإعادة"
          :value="batch.total_retained"
          :icon="RotateCcw"
          variant="rose"
          badge-text="إعادة"
          :progress="batch.total_students > 0 ? (batch.total_retained / batch.total_students) * 100 : 0"
        />

        <!-- 6. Graduated Students -->
        <TaqniyaKpiCard
          title="الخريجون"
          :value="batch.total_graduated"
          :icon="GraduationCap"
          variant="primary"
          badge-text="تخرج"
          :progress="batch.total_students > 0 ? (batch.total_graduated / batch.total_students) * 100 : 0"
        />
      </div>

      <!-- 2. Class Statistics Table -->
      <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 shadow-xs space-y-3.5">
        <div class="flex items-center justify-between border-b border-[#B4AED8]/30 dark:border-white/[0.06] pb-3">
          <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-bx-title">
            <Layers class="w-4 h-4 text-bx-primary" />
            <span>إحصائيات وتوزيع الصفوف الدراسية في هذه الدفعة</span>
          </div>
          <span class="text-xs font-mono font-bold text-bx-muted">
            {{ classStatsItems.length }} صفوف دراسية
          </span>
        </div>

        <TaqniyaTable
          :columns="statsColumns"
          :items="classStatsItems"
          row-key="class_name"
          empty-title="لا توجد إحصائيات صفوف متوفرة لهذه الدفعة"
          empty-subtitle="لم يتم تسجيل تفاصيل صفوف منفصلة لهذه العملية."
        >
          <template #cell-class_name="{ value }">
            <span class="font-bold text-bx-title text-xs">{{ value }}</span>
          </template>

          <template #cell-total="{ value }">
            <span class="font-mono font-bold text-bx-title text-xs">{{ value }} طالب</span>
          </template>

          <template #cell-promoted="{ value }">
            <span class="font-mono font-bold text-emerald-600 text-xs">{{ value }}</span>
          </template>

          <template #cell-retained="{ value }">
            <span class="font-mono font-bold text-rose-600 text-xs">{{ value }}</span>
          </template>

          <template #cell-pass_rate="{ value }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
              :class="
                value >= 85
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                  : value >= 60
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/25'
              "
            >
              {{ value }}%
            </span>
          </template>
        </TaqniyaTable>
      </div>

      <!-- 3. Execution Notes -->
      <div v-if="batch.execution_notes" class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 shadow-xs space-y-1.5">
        <div class="flex items-center gap-2 text-xs font-bold text-bx-muted">
          <FileText class="w-3.5 h-3.5 text-bx-primary" />
          <span>ملاحظات وقرار لجنة الترحيل:</span>
        </div>
        <p class="text-xs text-bx-title leading-relaxed pr-5 font-medium">{{ batch.execution_notes }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end w-full">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
