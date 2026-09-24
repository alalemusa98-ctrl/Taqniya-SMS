<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-8 p-6 sm:p-8 max-w-[1600px] mx-auto min-h-screen text-bx-text font-sans" dir="rtl">
      <!-- Page Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#B4AED8] dark:border-white/[0.08]">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20 shadow-xs">
            <GraduationCap class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-bx-title font-display tracking-tight">
              الترحيل الأكاديمي وكشوفات النتائج والأرشيف
            </h1>
            <p class="text-xs sm:text-sm text-bx-muted mt-1 font-medium">
              إدارة كشوفات الدرجات الرسمية، لوحة الشرف، المحاكاة الذكية، والترحيل السنوي المتوازن مع الحفاظ على تسكين الشعب
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            @click="openPromotionModal"
          >
            <Sparkles class="w-4 h-4" />
            <span>تنفيذ الترحيل السنوي وتوزيع الفصول</span>
          </button>
        </div>
      </header>

      <!-- KPI Overview Cards using TaqniyaKpiCard -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <TaqniyaKpiCard
          :icon="Layers"
          title="إجمالي الكشوفات المستعلمة"
          :value="hasExecutedSearch ? totalTranscriptsCount : '—'"
          subtext="سجلات كشوفات مطابقة"
          color="purple"
        />

        <TaqniyaKpiCard
          :icon="CheckCircle2"
          title="نسبة النجاح العامة"
          :value="hasExecutedSearch ? `${overallPassRate}%` : '—'"
          subtext="للكشوفات المعروضة"
          color="emerald"
        />

        <TaqniyaKpiCard
          :icon="RotateCcw"
          title="دفعات الترحيل المعتمدة"
          :value="promotionBatches.length"
          subtext="عمليات ترحيل سنوية مكتملة"
          color="amber"
        />
      </section>

      <!-- Navigation Tabs -->
      <nav class="flex items-center gap-2 border-b border-[#B4AED8] dark:border-white/[0.08] pb-1">
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'transcripts' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title hover:bg-black/5 dark:hover:bg-white/5'"
          @click="activeTab = 'transcripts'"
        >
          <BookOpen class="w-4 h-4" />
          <span>كشوفات الدرجات ولوحة الشرف</span>
        </button>
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'batches' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title hover:bg-black/5 dark:hover:bg-white/5'"
          @click="activeTab = 'batches'"
        >
          <History class="w-4 h-4" />
          <span>سجل دفعات الترحيل المؤرشفة</span>
        </button>
      </nav>

      <!-- TAB 1: Transcripts & Leaderboard -->
      <section v-if="activeTab === 'transcripts'" class="space-y-6">
        <!-- 1. School Classes & Sections Grid (Matching Grade Entry View) -->
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs">
          <PromotionClassSectionsGrid
            :sections="allSections"
            :classes="classesList"
            :selected-class-id="filters.class_id"
            :selected-class-name="filters.class_name"
            :selected-section-id="filters.class_section_id"
            :selected-section-name="filters.section_name"
            @select-class="handleSelectGridClass"
            @select-section="handleSelectGridSection"
          />
        </div>

        <!-- 2. Filters & Search Panel -->
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-bx-title">
              <Filter class="w-4 h-4 text-bx-primary" />
              <span>محددات وفلاتر الاستعلام عن الكشوفات</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <!-- 1. العام الدراسي -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">العام الدراسي:</label>
              <TaqniyaSelect
                v-model="filters.academic_year_name"
                :options="yearFilterOptions"
                placeholder="جميع الأعوام..."
                full-width
                @update:model-value="onYearFilterChange"
              />
            </div>

            <!-- 2. الصف الدراسي -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">الصف الدراسي:</label>
              <TaqniyaSelect
                v-model="selectedClassIdModel"
                :options="classFilterOptions"
                placeholder="اختر الصف..."
                full-width
                @update:model-value="onClassFilterChange"
              />
            </div>

            <!-- 3. الشعبة -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">الشعبة:</label>
              <TaqniyaSelect
                v-model="selectedSectionName"
                :options="sectionFilterOptions"
                placeholder="كافة الشعب..."
                full-width
                @update:model-value="onSectionFilterChange"
              />
            </div>

            <!-- 4. نوع الصحيفة (إلزامي) -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">
                <span>نوع الصحيفة:</span>
                <span class="text-rose-500 font-bold ms-0.5" title="حقل إلزامي">*</span>
              </label>
              <TaqniyaSelect
                v-model="selectedTranscriptOption"
                :options="transcriptTypeFilterOptions"
                placeholder="اختر نوع الصحيفة..."
                full-width
                @update:model-value="onTranscriptTypeChange"
              />
            </div>

            <!-- 5. الحالة الأكاديمية -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">الحالة الأكاديمية:</label>
              <TaqniyaSelect
                v-model="filters.final_status"
                :options="statusFilterOptions"
                placeholder="كافة الحالات..."
                full-width
              />
            </div>
          </div>

          <!-- Search & Actions Bar (Unified & Balanced Heights) -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#B4AED8]/30 dark:border-white/[0.06]">
            <!-- Search input with matched height -->
            <div class="relative w-full sm:w-auto sm:min-w-[300px]">
              <input
                v-model="searchInput"
                type="text"
                placeholder="بحث سريع باسم الطالب أو رقمه (اضغط Enter)..."
                class="h-10 w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl px-3.5 pr-9 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all shadow-xs"
                @keyup.enter="executeSearch"
              />
              <Search class="w-4 h-4 text-bx-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <!-- Action Buttons with matched height -->
            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                class="h-10 px-4 rounded-xl border border-bx-border hover:bg-black/5 dark:hover:bg-white/5 text-bx-muted hover:text-bx-title font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                @click="resetFilters"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>

              <button
                type="button"
                class="h-10 px-6 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                :disabled="isLoadingTranscripts"
                @click="executeSearch"
              >
                <Search class="w-3.5 h-3.5" />
                <span>{{ isLoadingTranscripts ? 'جاري الاستعلام...' : 'استعلام وعرض الكشوفات' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Guidance / Prompt State before searching -->
        <div
          v-if="!hasExecutedSearch"
          class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-12 text-center shadow-xs space-y-4"
        >
          <div class="w-16 h-16 rounded-3xl bg-bx-primary/10 text-bx-primary flex items-center justify-center mx-auto border border-bx-primary/20 shadow-xs">
            <Filter class="w-8 h-8" />
          </div>
          <div class="max-w-md mx-auto space-y-1.5">
            <h3 class="text-lg font-black text-bx-title font-display">
              يرجى تحديد الصف الدراسي ونوع الصحيفة
            </h3>
            <p class="text-xs text-bx-muted font-medium leading-relaxed">
              اختر الصف الدراسي من المصفوفة أو القائمة أعلاه، وتأكد من تحديد <strong>نوع الصحيفة (سنوية نهائية أو فصلية)</strong>، ثم اضغط على زر <strong>"استعلام وعرض الكشوفات"</strong> للبدء في استعراض النتائج الرسمية ولوحة الشرف.
            </p>
          </div>
        </div>

        <!-- When search has been executed -->
        <template v-else>
          <!-- Executive Class Cards Grid -->
          <div v-if="executiveClassSummaries.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <ExecutiveClassCard
              v-for="cSum in executiveClassSummaries"
              :key="cSum.grade_level"
              :class-summary="cSum"
              :is-selected="filters.grade_level === cSum.grade_level"
              @select="handleSelectClassCard"
            />
          </div>

          <!-- Leaderboard Table using TaqniyaTable -->
          <div class="space-y-4">
            <ClassLeaderboardTable
              :transcripts="transcripts"
              :is-loading="isLoadingTranscripts"
              @view-detail="handleViewTranscriptDetail"
            />

            <!-- Pagination using TaqniyaPagination -->
            <div v-if="totalPages > 1" class="flex justify-center pt-4">
              <TaqniyaPagination
                :current-page="meta.current_page"
                :total-pages="totalPages"
                @page-change="handlePageChange"
              />
            </div>
          </div>
        </template>
      </section>

      <!-- TAB 2: Promotion Batches History using TaqniyaTable -->
      <section v-if="activeTab === 'batches'" class="space-y-6">
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div class="border-b border-[#B4AED8] dark:border-white/[0.08] pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="text-lg font-bold text-bx-title font-display">سجل عمليات الترحيل الأكاديمي الجماعي (Promotion Batches)</h3>
              <p class="text-xs text-bx-muted mt-1 font-medium">كافة العمليات مؤرخة وموثقة بسجلات التدقيق الأمني Audit Logs</p>
            </div>
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors flex items-center gap-1.5 cursor-pointer"
              @click="fetchPromotionBatches"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>تحديث السجل</span>
            </button>
          </div>

          <TaqniyaTable
            :columns="batchColumns"
            :items="promotionBatches"
            :is-loading="isLoadingBatches"
            row-key="id"
            empty-title="لا توجد دفعات ترحيل منفذة حتى الآن"
            empty-subtitle="يمكنك إنشاء دفعة ترحيل جديدة بالضغط على زر تنفيذ الترحيل السنوي."
          >
            <!-- Custom Cell Templates -->
            <template #cell-id="{ value }">
              <span class="font-mono font-bold text-bx-primary">BAT-{{ value }}</span>
            </template>

            <template #cell-from_year="{ item }">
              <span class="font-bold text-bx-title">{{ item.from_academic_year_name || item.from_academic_year?.name || item.from_academic_year_id }}</span>
            </template>

            <template #cell-to_year="{ item }">
              <span class="font-bold text-bx-primary">{{ item.to_academic_year_name || item.to_academic_year?.name || item.to_academic_year_id }}</span>
            </template>

            <template #cell-total_promoted="{ value }">
              <span class="font-bold text-emerald-600">{{ value }}</span>
            </template>

            <template #cell-total_second_round="{ value }">
              <span class="font-bold text-amber-600">{{ value }}</span>
            </template>

            <template #cell-total_retained="{ value }">
              <span class="font-bold text-rose-600">{{ value }}</span>
            </template>

            <template #cell-overall_passing_rate="{ value }">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {{ value }}%
              </span>
            </template>

            <template #cell-created_at="{ value }">
              <span class="text-xs text-bx-muted">{{ formatDate(value) }}</span>
            </template>

            <template #cell-actions="{ item }">
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-bold rounded-lg bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                @click="handleViewBatchDetail(item)"
              >
                <Eye class="w-3.5 h-3.5" />
                <span>التفاصيل</span>
              </button>
            </template>
          </TaqniyaTable>
        </div>
      </section>

      <!-- Detail Drawer for Transcripts -->
      <TranscriptDetailDrawer
        :is-open="isDetailDrawerOpen"
        :transcript="selectedTranscript"
        @close="isDetailDrawerOpen = false"
      />

      <!-- Detail Drawer for Promotion Batches -->
      <PromotionBatchDetailDrawer
        :is-open="isBatchDetailDrawerOpen"
        :batch="selectedBatch"
        @close="isBatchDetailDrawerOpen = false"
      />

      <!-- Promotion Execution Modal -->
      <PromotionExecutionModal
        :is-open="isPromotionModalOpen"
        :academic-years="academicYearsList"
        :preview-result="promotionSimulation"
        :is-preview-loading="isSimulating"
        :is-executing="isExecutingPromotion"
        @close="isPromotionModalOpen = false"
        @preview="handleRunSimulation"
        @execute="handleExecutePromotion"
      />
    </div>
  </TaqniyaErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  History,
  Filter,
  Search,
  Eye,
} from 'lucide-vue-next';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';
import ExecutiveClassCard from '../components/promotion/ExecutiveClassCard.vue';
import ClassLeaderboardTable from '../components/promotion/ClassLeaderboardTable.vue';
import TranscriptDetailDrawer from '../components/promotion/TranscriptDetailDrawer.vue';
import PromotionBatchDetailDrawer from '../components/promotion/PromotionBatchDetailDrawer.vue';
import PromotionExecutionModal from '../components/promotion/PromotionExecutionModal.vue';
import PromotionClassSectionsGrid from '../components/promotion/PromotionClassSectionsGrid.vue';

import {
  promotionApi,
  type StudentTranscript,
  type ExecutiveClassSummary,
  type PromotionBatch,
  type PromotionSimulationResult,
  type QueryTranscriptsDto,
  type ExecutePromotionDto,
} from '../api/promotion.api';
import {
  academicApi,
  type AcademicYearItem,
  type AcademicClassItem,
  type AcademicTermItem,
} from '../api/academic.api';
import {
  gradeEntryApi,
  type SectionAuditProgressItem,
} from '../api/grade-entry.api';
import { useToast } from '../composables/useToast';

const toast = useToast();

const activeTab = ref<'transcripts' | 'batches'>('transcripts');

// Data State
const transcripts = ref<StudentTranscript[]>([]);
const executiveClassSummaries = ref<ExecutiveClassSummary[]>([]);
const promotionBatches = ref<PromotionBatch[]>([]);
const academicYearsList = ref<AcademicYearItem[]>([]);
const classesList = ref<AcademicClassItem[]>([]);
const academicTermsList = ref<AcademicTermItem[]>([]);
const allClassAcademicTerms = ref<any[]>([]);
const allSections = ref<SectionAuditProgressItem[]>([]);
const promotionSimulation = ref<PromotionSimulationResult | null>(null);

// Selected Items & Drawers/Modals
const selectedTranscript = ref<StudentTranscript | null>(null);
const selectedBatch = ref<PromotionBatch | null>(null);
const isDetailDrawerOpen = ref(false);
const isBatchDetailDrawerOpen = ref(false);
const isPromotionModalOpen = ref(false);

// Loading Flags
const isLoadingTranscripts = ref(false);
const isLoadingBatches = ref(false);
const isSimulating = ref(false);
const isExecutingPromotion = ref(false);

// Search execution flag (Transcripts not shown initially)
const hasExecutedSearch = ref(false);

// Search input
const searchInput = ref('');

// Filters & Pagination
const filters = ref<QueryTranscriptsDto>({
  page: 1,
  per_page: 15,
  academic_year_name: undefined,
  grade_level: undefined,
  class_name: undefined,
  section_name: undefined,
  class_academic_term_id: undefined,
  transcript_type: undefined,
  final_status: undefined,
  search: undefined,
});

const selectedClassIdModel = ref<string | number>('all');
const selectedSectionName = ref<string>('all');
const selectedTranscriptOption = ref<string>('all');

const meta = ref({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  total_pages: 1,
});

const totalPages = computed(() => meta.value.last_page || meta.value.total_pages || 1);

// Table Columns for Batches
const batchColumns: TableColumn[] = [
  { key: 'id', label: 'معرف الدفعة', align: 'start' },
  { key: 'from_year', label: 'من عام دراسي', align: 'start' },
  { key: 'to_year', label: 'إلى عام دراسي', align: 'start' },
  { key: 'total_students', label: 'إجمالي الطلاب', align: 'center' },
  { key: 'total_promoted', label: 'المنقولون', align: 'center' },
  { key: 'total_second_round', label: 'الدور الثاني', align: 'center' },
  { key: 'total_retained', label: 'الباقون للإعادة', align: 'center' },
  { key: 'overall_passing_rate', label: 'نسبة النجاح العامة', align: 'center' },
  { key: 'created_at', label: 'تاريخ التنفيذ', align: 'start' },
  { key: 'actions', label: 'الإجراءات', align: 'center' },
];

// Dropdown Options
const yearFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'جميع الأعوام الدراسية', value: 'all' },
  ...academicYearsList.value.map((y) => ({
    label: `${y.name} ${y.is_active ? '(النشط)' : ''}`,
    value: y.name,
  })),
]);

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'كافة الصفوف الدراسية', value: 'all' },
  ...classesList.value.map((c) => ({
    label: `${c.name} ${c.stage_name ? `(${c.stage_name})` : ''}`,
    value: c.id,
  })),
]);

const sectionFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  if (selectedClassIdModel.value === 'all' || !selectedClassIdModel.value) {
    return [{ label: 'كافة الشعب المدرسية', value: 'all' }];
  }
  const currentClassSections = allSections.value.filter(
    (s) => s.class_id === Number(selectedClassIdModel.value)
  );
  if (currentClassSections.length === 0) {
    return [{ label: 'كافة الشعب (ترتيب عام)', value: 'all' }];
  }
  return [
    { label: 'كافة شعب الصف (ترتيب عام)', value: 'all' },
    ...currentClassSections.map((s) => ({
      label: `${s.section_name} (${s.total_enrolled} طالب)`,
      value: s.section_name,
    })),
  ];
});

const transcriptTypeFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  const options: TaqniyaSelectOption[] = [
    { label: 'اختر نوع الصحيفة (إلزامي)...', value: 'all' },
    { label: 'النهائية', value: 'annual' },
  ];

  const classId = Number(selectedClassIdModel.value);
  if (classId && !isNaN(classId)) {
    const termsList = Array.isArray(allClassAcademicTerms.value)
      ? allClassAcademicTerms.value
      : (allClassAcademicTerms.value as any)?.classes || [];
    const classGroup = termsList.find((g: any) => Number(g.class_id) === classId);

    if (classGroup && classGroup.terms && classGroup.terms.length > 0) {
      classGroup.terms.forEach((t: any) => {
        options.push({
          label: t.term_name || `الفصل الدراسي ${t.academic_term_id}`,
          value: `term_cat_${t.id}`,
        });
      });
      return options;
    }
  }

  if (academicTermsList.value && academicTermsList.value.length > 0) {
    academicTermsList.value.forEach((t: any) => {
      options.push({
        label: t.name || `الفصل ${t.id}`,
        value: `term_at_${t.id}`,
      });
    });
  } else {
    options.push({ label: 'الفصل الأول', value: 'term_default_1' });
    options.push({ label: 'الفصل الثاني', value: 'term_default_2' });
  }

  return options;
});

const statusFilterOptions: TaqniyaSelectOption[] = [
  { label: 'كافة الحالات الأكاديمية', value: 'all' },
  { label: 'ناجح ومرحل', value: 'passed' },
  { label: 'دور ثانٍ', value: 'second_round' },
  { label: 'باقٍ للإعادة', value: 'failed' },
  { label: 'متخرج', value: 'graduated' },
];

// Computed Metrics
const totalTranscriptsCount = computed(() => meta.value.total);

const overallPassRate = computed(() => {
  if (executiveClassSummaries.value.length === 0) return 0;
  const total = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.total_students, 0);
  const passed = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.passed_count, 0);
  return total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0;
});

// Grid Selection Handlers
const handleSelectGridClass = (classId: number, className: string, gradeLevel: number) => {
  selectedClassIdModel.value = classId;
  filters.value.class_id = classId;
  filters.value.class_name = className;
  filters.value.grade_level = gradeLevel;
  // Unset section so all sections of this class are included for general ranking
  filters.value.section_name = undefined;
  filters.value.class_section_id = undefined;
  selectedSectionName.value = 'all';
};

const handleSelectGridSection = (sec: SectionAuditProgressItem) => {
  selectedClassIdModel.value = sec.class_id;
  filters.value.class_id = sec.class_id;
  filters.value.class_name = sec.class_name;
  filters.value.grade_level = sec.grade_level;
  filters.value.section_name = sec.section_name;
  filters.value.class_section_id = sec.class_section_id;
  selectedSectionName.value = sec.section_name;
};

// Filter Change Handlers (No auto-fetch; only updates state)
const onYearFilterChange = (val: any) => {
  if (val === 'all' || !val) {
    filters.value.academic_year_name = undefined;
  } else {
    filters.value.academic_year_name = val;
  }
  fetchSections();
};

const onClassFilterChange = (val: any) => {
  if (val === 'all' || !val) {
    filters.value.class_id = undefined;
    filters.value.class_name = undefined;
    filters.value.grade_level = undefined;
    selectedClassIdModel.value = 'all';
  } else {
    const classId = Number(val);
    selectedClassIdModel.value = classId;
    filters.value.class_id = classId;
    const cls = classesList.value.find((c) => c.id === classId);
    filters.value.class_name = cls?.name;
    filters.value.grade_level = cls?.grade_level;
  }
  selectedSectionName.value = 'all';
  filters.value.section_name = undefined;
  filters.value.class_section_id = undefined;
};

const onSectionFilterChange = (val: any) => {
  if (val === 'all' || !val) {
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
    selectedSectionName.value = 'all';
  } else {
    filters.value.section_name = val;
    selectedSectionName.value = val;
    const sec = allSections.value.find(
      (s) => s.class_id === Number(selectedClassIdModel.value) && s.section_name === val,
    );
    filters.value.class_section_id = sec?.class_section_id;
  }
};

const onTranscriptTypeChange = (val: any) => {
  selectedTranscriptOption.value = val;
  if (val === 'all' || !val) {
    filters.value.transcript_type = undefined;
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = undefined;
  } else if (val === 'annual') {
    filters.value.transcript_type = 'annual';
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = undefined;
  } else if (typeof val === 'string' && val.startsWith('term_cat_')) {
    filters.value.transcript_type = 'term';
    filters.value.class_academic_term_id = Number(val.replace('term_cat_', ''));
    filters.value.academic_term_id = undefined;
  } else if (typeof val === 'string' && val.startsWith('term_at_')) {
    filters.value.transcript_type = 'term';
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = Number(val.replace('term_at_', ''));
  } else {
    filters.value.transcript_type = 'term';
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = undefined;
  }
};

// Explicit Search & Reset Actions
const executeSearch = () => {
  if (!filters.value.class_id && !filters.value.class_name && !searchInput.value.trim()) {
    toast.warning('يرجى تحديد الصف الدراسي أولاً للاستعلام.');
    return;
  }
  if (!filters.value.transcript_type || selectedTranscriptOption.value === 'all') {
    toast.warning('يلزم تحديد "نوع الصحيفة" (مثلاً: النهائية، الفصل الأول...) قبل عرض النتائج.');
    return;
  }
  filters.value.search = searchInput.value.trim() || undefined;
  filters.value.page = 1;
  hasExecutedSearch.value = true;
  fetchTranscripts();
};

const resetFilters = () => {
  filters.value.class_id = undefined;
  filters.value.class_name = undefined;
  filters.value.grade_level = undefined;
  filters.value.class_section_id = undefined;
  filters.value.section_name = undefined;
  filters.value.class_academic_term_id = undefined;
  filters.value.academic_term_id = undefined;
  filters.value.transcript_type = undefined;
  filters.value.final_status = undefined;
  filters.value.search = undefined;
  filters.value.page = 1;
  selectedClassIdModel.value = 'all';
  selectedSectionName.value = 'all';
  selectedTranscriptOption.value = 'all';
  searchInput.value = '';
  transcripts.value = [];
  executiveClassSummaries.value = [];
  hasExecutedSearch.value = false;
};

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchAcademicLookups(),
    fetchSections(),
    fetchPromotionBatches(),
  ]);
});

const fetchAcademicLookups = async () => {
  try {
    const [yearsRes, classesRes, termsRes, classTermsRes] = await Promise.all([
      academicApi.getYears({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClasses({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getTerms({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClassAcademicTerms({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
    ]);
    if (yearsRes.data?.data) {
      academicYearsList.value = Array.isArray(yearsRes.data.data)
        ? yearsRes.data.data
        : yearsRes.data.data.years || [];
    } else if (Array.isArray(yearsRes.data)) {
      academicYearsList.value = yearsRes.data;
    }

    if (classesRes.data?.data) {
      classesList.value = Array.isArray(classesRes.data.data)
        ? classesRes.data.data
        : classesRes.data.data.classes || [];
    } else if (Array.isArray(classesRes.data)) {
      classesList.value = classesRes.data;
    }

    academicTermsList.value = termsRes.data?.data?.terms || termsRes.data?.data || [];
    allClassAcademicTerms.value = classTermsRes.data?.data?.classes || classTermsRes.data?.data || [];
  } catch (err: any) {
    console.error('Failed to load academic lookups:', err);
  }
};

const fetchSections = async () => {
  try {
    const res = await gradeEntryApi.getSectionAuditProgress({
      academic_year_name: filters.value.academic_year_name,
    });
    if (res.success && res.data?.sections) {
      allSections.value = res.data.sections;
    }
  } catch (err: any) {
    console.error('Failed to load section audit progress:', err);
  }
};

const fetchTranscripts = async () => {
  isLoadingTranscripts.value = true;
  try {
    const queryParams: QueryTranscriptsDto = {
      page: filters.value.page,
      per_page: filters.value.per_page,
      academic_year_name: filters.value.academic_year_name === 'all' ? undefined : filters.value.academic_year_name,
      class_id: filters.value.class_id,
      class_name: filters.value.class_name,
      grade_level: filters.value.grade_level,
      class_section_id: filters.value.class_section_id,
      section_name: filters.value.section_name,
      academic_term_id: filters.value.academic_term_id,
      class_academic_term_id: filters.value.class_academic_term_id,
      transcript_type: filters.value.transcript_type === 'all' ? undefined : filters.value.transcript_type,
      final_status: filters.value.final_status === 'all' ? undefined : filters.value.final_status,
      search: filters.value.search,
    };

    const res = await promotionApi.getTranscripts(queryParams);
    if (res.success) {
      if (Array.isArray(res.data)) {
        transcripts.value = res.data;
      } else if (res.data && Array.isArray(res.data.transcripts)) {
        transcripts.value = res.data.transcripts;
        if (Array.isArray(res.data.classes_summary)) {
          executiveClassSummaries.value = res.data.classes_summary;
        }
      } else {
        transcripts.value = [];
      }

      if (res.meta?.class_summaries && Array.isArray(res.meta.class_summaries) && res.meta.class_summaries.length > 0) {
        executiveClassSummaries.value = res.meta.class_summaries;
      }

      meta.value = {
        current_page: res.meta?.current_page || 1,
        per_page: res.meta?.per_page || 15,
        total: res.meta?.total !== undefined ? res.meta.total : transcripts.value.length,
        last_page: res.meta?.last_page || 1,
        total_pages: res.meta?.last_page || res.meta?.total_pages || 1,
      };
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل جلب كشوفات الدرجات.');
  } finally {
    isLoadingTranscripts.value = false;
  }
};

const fetchPromotionBatches = async () => {
  isLoadingBatches.value = true;
  try {
    const res = await promotionApi.getPromotionBatches({ per_page: 50 });
    if (res.success) {
      promotionBatches.value = res.data;
    }
  } catch (err: any) {
    console.error('Failed to load promotion batches:', err);
  } finally {
    isLoadingBatches.value = false;
  }
};

const handleSelectClassCard = (cSum: ExecutiveClassSummary) => {
  const matchClass = classesList.value.find((c) => c.name === cSum.class_name);
  if (filters.value.class_name === cSum.class_name) {
    filters.value.class_id = undefined;
    filters.value.class_name = undefined;
    filters.value.grade_level = undefined;
    selectedClassIdModel.value = 'all';
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
    selectedSectionName.value = 'all';
  } else {
    filters.value.class_id = matchClass?.id;
    filters.value.class_name = cSum.class_name;
    filters.value.grade_level = cSum.grade_level;
    selectedClassIdModel.value = matchClass ? matchClass.id : 'all';
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
    selectedSectionName.value = 'all';
  }
  filters.value.class_academic_term_id = undefined;
  filters.value.page = 1;
  fetchTranscripts();
};

const handlePageChange = (page: number) => {
  filters.value.page = page;
  fetchTranscripts();
};

const handleViewTranscriptDetail = async (transcript: StudentTranscript) => {
  selectedTranscript.value = transcript;
  isDetailDrawerOpen.value = true;
  try {
    const res = await promotionApi.getTranscriptById(transcript.id);
    if (res.success && res.data) {
      selectedTranscript.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch full transcript details:', err);
  }
};

const handleViewBatchDetail = async (batch: PromotionBatch) => {
  selectedBatch.value = batch;
  isBatchDetailDrawerOpen.value = true;
  try {
    const res = await promotionApi.getPromotionBatchById(batch.id);
    if (res.success && res.data) {
      selectedBatch.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch full batch details:', err);
  }
};

const openPromotionModal = () => {
  promotionSimulation.value = null;
  isPromotionModalOpen.value = true;
};

const handleRunSimulation = async (payload: { from_year_id: number; to_year_id: number }) => {
  isSimulating.value = true;
  try {
    const res = await promotionApi.previewPromotion({
      from_academic_year_id: payload.from_year_id,
      to_academic_year_id: payload.to_year_id,
    });
    if (res.success) {
      promotionSimulation.value = res.data;
      toast.success(res.message || 'تم توليد محاكاة الترحيل بنجاح.');
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل تشغيل محاكاة الترحيل.');
  } finally {
    isSimulating.value = false;
  }
};

const handleExecutePromotion = async (payload: ExecutePromotionDto) => {
  isExecutingPromotion.value = true;
  try {
    const res = await promotionApi.executePromotion(payload);
    if (res.success) {
      toast.success(res.message || 'تم تنفيذ الترحيل الأكاديمي بنجاح.');
      isPromotionModalOpen.value = false;
      await Promise.all([fetchTranscripts(), fetchPromotionBatches()]);
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل تنفيذ الترحيل السنوي.');
  } finally {
    isExecutingPromotion.value = false;
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>
