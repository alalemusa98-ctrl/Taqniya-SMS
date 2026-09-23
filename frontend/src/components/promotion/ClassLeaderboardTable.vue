<template>
  <div class="space-y-4" dir="rtl">
    <!-- Section Header Banner -->
    <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold border border-amber-500/20 shadow-xs">
          <Trophy class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base font-black text-bx-title font-display">لوحة شرف وترتيب الطلاب (Class Leaderboard)</h3>
          <p class="text-xs text-bx-muted mt-0.5 font-medium">ترتيب الطلاب تنازلياً حسب النسبة والمعدل العام</p>
        </div>
      </div>

      <!-- Quick Search Filter -->
      <div class="relative min-w-[240px]">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="بحث سريع بالاسم أو الرمز..."
          class="w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl px-4 py-2 pr-9 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all"
        />
        <Search class="w-4 h-4 text-bx-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>

    <!-- TaqniyaTable Component -->
    <TaqniyaTable
      :columns="columns"
      :items="filteredTranscripts"
      :is-loading="isLoading"
      row-key="id"
      empty-title="لا توجد بيانات كشوفات مطابقة للبحث أو الفلتر المحدد"
      empty-subtitle="جرب تعديل محددات البحث أو اختيار صف دراسي آخر."
      :empty-icon="Trophy"
    >
      <!-- Rank Column -->
      <template #cell-rank="{ item, index }">
        <div class="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-xs font-black" :class="getRankBadgeClass(item.calculated_rank || item.rank || (index + 1))">
          <span v-if="(item.calculated_rank || item.rank || (index + 1)) === 1">🥇 1</span>
          <span v-else-if="(item.calculated_rank || item.rank || (index + 1)) === 2">🥈 2</span>
          <span v-else-if="(item.calculated_rank || item.rank || (index + 1)) === 3">🥉 3</span>
          <span v-else>{{ item.calculated_rank || item.rank || (index + 1) }}</span>
        </div>
      </template>

      <!-- Student Code Column -->
      <template #cell-student_code="{ item }">
        <span class="font-mono text-xs font-bold text-bx-primary">{{ item.student_code || '—' }}</span>
      </template>

      <!-- Student Name Column -->
      <template #cell-student_name="{ item }">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-bx-primary/10 text-bx-primary flex items-center justify-center text-xs font-bold shrink-0">
            {{ (item.student_name || item.student_code || 'ط').charAt(0) }}
          </div>
          <span class="font-bold text-bx-title text-xs">{{ item.student_name || item.student_code || '—' }}</span>
        </div>
      </template>

      <!-- Section Column -->
      <template #cell-section_name="{ item }">
        <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-bx-surface-2 text-bx-muted border border-bx-border">
          {{ item.section_name || '—' }}
        </span>
      </template>

      <!-- Total Score Column -->
      <template #cell-total_score="{ item }">
        <div class="font-mono text-xs font-bold text-bx-title">
          <span>{{ item.total_score }}</span>
          <span v-if="item.max_possible_score" class="text-[10px] text-bx-muted font-normal mr-1">/ {{ item.max_possible_score }}</span>
        </div>
      </template>

      <!-- Percentage Column -->
      <template #cell-percentage="{ item }">
        <div class="flex items-center gap-2 min-w-[120px]">
          <div class="flex-1 h-2 bg-bx-surface-2 rounded-full overflow-hidden border border-bx-border/50">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="getPercentageFillClass(item.percentage)"
              :style="{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }"
            ></div>
          </div>
          <span class="font-mono text-xs font-black text-bx-title w-12 text-left">{{ item.percentage }}%</span>
        </div>
      </template>

      <!-- Final Status Column -->
      <template #cell-final_status="{ item }">
        <span
          class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold"
          :class="getStatusPillClass(item.final_status)"
        >
          {{ item.final_status_ar || getStatusText(item.final_status) }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #cell-actions="{ item }">
        <div class="flex items-center gap-1.5 justify-center">
          <button
            type="button"
            class="p-1.5 rounded-lg border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-colors cursor-pointer"
            title="عرض كشف الدرجات التفصيلي"
            @click="$emit('view-detail', item)"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg border border-bx-border hover:border-amber-500 text-bx-muted hover:text-amber-600 transition-colors cursor-pointer"
            title="تجميد وتثبيت السجل الأكاديمي"
            @click="$emit('freeze', item)"
          >
            <Lock class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </TaqniyaTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Trophy, Search, Eye, Lock } from 'lucide-vue-next';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import type { StudentTranscript } from '../../api/promotion.api';

interface Props {
  transcripts?: StudentTranscript[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  transcripts: () => [],
  isLoading: false,
});

defineEmits<{
  (e: 'view-detail', transcript: StudentTranscript): void;
  (e: 'freeze', transcript: StudentTranscript): void;
}>();

const searchTerm = ref('');

const columns: TableColumn[] = [
  { key: 'rank', label: 'الترتيب', align: 'center', width: '80px' },
  { key: 'student_code', label: 'كود الطالب', align: 'start', width: '110px' },
  { key: 'student_name', label: 'اسم الطالب الرباعي', align: 'start' },
  { key: 'section_name', label: 'الشعبة', align: 'center', width: '100px' },
  { key: 'total_score', label: 'المجموع الكلي', align: 'center', width: '120px' },
  { key: 'percentage', label: 'النسبة المئوية', align: 'start', width: '180px' },
  { key: 'final_status', label: 'القرار النهائي', align: 'center', width: '130px' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '90px' },
];

const filteredTranscripts = computed(() => {
  const list = Array.isArray(props.transcripts) ? props.transcripts : [];
  if (!searchTerm.value.trim()) {
    return list;
  }
  const q = searchTerm.value.trim().toLowerCase();
  return list.filter(
    (t) =>
      (t.student_name && t.student_name.toLowerCase().includes(q)) ||
      (t.student_code && t.student_code.toLowerCase().includes(q)) ||
      (t.national_id && t.national_id.includes(q))
  );
});

const getRankBadgeClass = (rank: number) => {
  if (rank === 1) return 'bg-amber-500/15 text-amber-700 border border-amber-500/30';
  if (rank === 2) return 'bg-slate-300/30 text-slate-700 border border-slate-400/30';
  if (rank === 3) return 'bg-orange-500/15 text-orange-700 border border-orange-500/30';
  return 'bg-bx-surface-2 text-bx-muted border border-bx-border';
};

const getPercentageFillClass = (percentage: number) => {
  if (percentage >= 85) return 'bg-emerald-500';
  if (percentage >= 65) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
};

const getStatusPillClass = (status: string) => {
  switch (status) {
    case 'passed':
      return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    case 'second_round':
      return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    case 'retained':
    case 'failed':
      return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    case 'graduated':
      return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
    default:
      return 'bg-bx-surface-2 text-bx-muted border border-bx-border';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'passed':
      return 'ناجح ومرحل';
    case 'second_round':
      return 'دور ثان';
    case 'retained':
    case 'failed':
      return 'باق للإعادة';
    case 'graduated':
      return 'متخرج';
    default:
      return status;
  }
};
</script>
