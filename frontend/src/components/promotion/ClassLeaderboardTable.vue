<template>
  <div class="space-y-4" dir="rtl">
    <!-- Section Header Banner -->
    <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold border shadow-xs"
          :class="isStudentSearch ? 'bg-bx-primary/10 text-bx-primary border-bx-primary/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'"
        >
          <UserCheck v-if="isStudentSearch" class="w-5 h-5 text-bx-primary" />
          <Trophy v-else class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base font-black text-bx-title font-display">
            {{ isStudentSearch ? 'سجل كشوفات ودرجات الطالب' : 'لوحة شرف وترتيب الطلاب (Class Leaderboard)' }}
          </h3>
          <p class="text-xs text-bx-muted mt-0.5 font-medium">
            {{ isStudentSearch ? 'عرض كافة الصحائف المعتمدة المسجلة للطالب عبر الأعوام والفصول الدراسية' : 'ترتيب الطلاب تنازلياً حسب النسبة والمعدل العام' }}
          </p>
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
        <!-- In Student Search mode: simple sequence number (#) without medal or ranking badges -->
        <div v-if="isStudentSearch" class="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-lg text-xs font-mono font-bold text-bx-muted bg-black/5 dark:bg-white/5 border border-bx-border/50">
          <span>#{{ index + 1 }}</span>
        </div>
        <!-- In Leaderboard mode: competitive ranking with medals (tied percentages share the exact same rank) -->
        <div v-else class="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-xs font-black" :class="getRankBadgeClass(item.calculated_rank || (index + 1))">
          <span v-if="(item.calculated_rank || (index + 1)) === 1">🥇 1</span>
          <span v-else-if="(item.calculated_rank || (index + 1)) === 2">🥈 2</span>
          <span v-else-if="(item.calculated_rank || (index + 1)) === 3">🥉 3</span>
          <span v-else>{{ item.calculated_rank || (index + 1) }}</span>
        </div>
      </template>

      <!-- Academic Year Column -->
      <template #cell-academic_year="{ item }">
        <span class="font-bold text-xs text-bx-primary font-mono whitespace-nowrap bg-bx-primary/10 px-2 py-0.5 rounded-lg border border-bx-primary/20">
          {{ item.academic_year_name || '—' }}
        </span>
      </template>

      <!-- Student Code Column -->
      <template #cell-student_code="{ item }">
        <span class="font-mono text-xs font-bold text-bx-primary">{{ item.student_code || '—' }}</span>
      </template>

      <!-- Student Name Column -->
      <template #cell-student_name="{ item }">
        <span class="font-bold text-bx-title text-xs">{{ item.student_name || item.student_code || '—' }}</span>
      </template>

      <!-- Class Column -->
      <template #cell-class_name="{ item }">
        <span class="font-bold text-xs text-bx-title whitespace-nowrap">{{ item.class_name || '—' }}</span>
      </template>

      <!-- Section Column (Refined badge style) -->
      <template #cell-section_name="{ item }">
        <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-white/[0.06] text-bx-title border border-slate-300 dark:border-white/[0.12] shadow-2xs whitespace-nowrap">
          {{ item.section_name || '—' }}
        </span>
      </template>

      <!-- Transcript Type Column -->
      <template #cell-transcript_type="{ item }">
        <div class="flex items-center justify-center">
          <span
            v-if="item.transcript_type === 'annual'"
            class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 whitespace-nowrap"
          >
            صحيفة سنوية مجمعة
          </span>
          <span
            v-else
            class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 whitespace-nowrap"
          >
            صحيفة فصلية: {{ formatTermShortName(item.term_name || item.transcript_type_ar) }}
          </span>
        </div>
      </template>

      <!-- Total Score Column (Showing score 'من' total) -->
      <template #cell-total_score="{ item }">
        <div class="font-mono text-xs font-bold text-bx-title whitespace-nowrap">
          <span>{{ item.total_score }}</span>
          <span class="text-bx-muted font-normal mx-1">من</span>
          <span class="text-bx-muted">{{ item.max_possible_score || (item.transcript_data as any)?.max_possible_score || 700 }}</span>
        </div>
      </template>

      <!-- Percentage Column (With high-contrast visible track in light mode) -->
      <template #cell-percentage="{ item }">
        <div class="flex items-center gap-2.5 min-w-[140px]">
          <div class="flex-1 h-2.5 bg-slate-300/80 dark:bg-white/[0.15] rounded-full overflow-hidden border border-slate-400/60 dark:border-white/[0.25] shadow-xs">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="getPercentageFillClass(item.percentage)"
              :style="{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }"
            ></div>
          </div>
          <span class="font-mono text-xs font-black text-bx-title w-12 text-left shrink-0">{{ item.percentage }}%</span>
        </div>
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
        </div>
      </template>
    </TaqniyaTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Trophy, Search, Eye, UserCheck } from 'lucide-vue-next';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import type { StudentTranscript } from '../../api/promotion.api';

interface Props {
  transcripts?: StudentTranscript[];
  isLoading?: boolean;
  isStudentSearch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  transcripts: () => [],
  isLoading: false,
  isStudentSearch: false,
});

defineEmits<{
  (e: 'view-detail', transcript: StudentTranscript): void;
}>();

const searchTerm = ref('');

const formatTermShortName = (name?: string) => {
  if (!name) return 'الفصل الأول';
  if (name.includes('الأول')) return 'الفصل الأول';
  if (name.includes('الثاني')) return 'الفصل الثاني';
  if (name.includes('الثالث')) return 'الفصل الثالث';
  return name;
};

const columns = computed<TableColumn[]>(() => [
  { key: 'rank', label: props.isStudentSearch ? '#' : 'الترتيب', align: 'center', width: '60px' },
  { key: 'academic_year', label: 'العام الدراسي', align: 'start', width: '110px' },
  { key: 'student_code', label: 'كود الطالب', align: 'start', width: '95px' },
  { key: 'student_name', label: 'اسم الطالب الرباعي', align: 'start' },
  { key: 'class_name', label: 'الصف', align: 'start', width: '120px' },
  { key: 'section_name', label: 'الشعبة', align: 'center', width: '85px' },
  { key: 'transcript_type', label: 'نوع الصحيفة', align: 'center', width: '150px' },
  { key: 'total_score', label: 'المجموع الكلي', align: 'center', width: '115px' },
  { key: 'percentage', label: 'النسبة المئوية', align: 'start', width: '150px' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '80px' },
]);

interface RankedTranscript extends StudentTranscript {
  calculated_rank: number;
}

const rankedTranscripts = computed<RankedTranscript[]>(() => {
  const list = Array.isArray(props.transcripts) ? [...props.transcripts] : [];
  if (list.length === 0) return [];

  // Sort list by percentage descending, then total_score descending
  const sorted = [...list].sort((a, b) => {
    const diffPct = Number(b.percentage) - Number(a.percentage);
    if (Math.abs(diffPct) > 0.001) return diffPct;
    return Number(b.total_score) - Number(a.total_score);
  });

  let currentRank = 1;
  const result: RankedTranscript[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      const currentPct = Number(current.percentage);
      const prevPct = Number(prev.percentage);
      const currentScore = Number(current.total_score);
      const prevScore = Number(prev.total_score);

      // If percentage or total score differs from previous, advance the rank
      if (Math.abs(currentPct - prevPct) > 0.001 || Math.abs(currentScore - prevScore) > 0.001) {
        currentRank = currentRank + 1;
      }
    }

    result.push({
      ...current,
      calculated_rank: currentRank,
    });
  }

  return result;
});

const filteredTranscripts = computed(() => {
  const list = rankedTranscripts.value;
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
</script>
