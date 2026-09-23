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
          title="إجمالي الكشوفات المسجلة"
          :value="totalTranscriptsCount"
          subtext="سجلات مؤرشفة ومجمدة"
          color="purple"
        />

        <TaqniyaKpiCard
          :icon="CheckCircle2"
          title="نسبة النجاح العامة"
          :value="`${overallPassRate}%`"
          subtext="على مستوى المدرسة"
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
        <!-- Filters Panel using TaqniyaSelect -->
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-2 font-bold text-sm text-bx-title">
              <Filter class="w-4 h-4 text-bx-primary" />
              <span>تصفية وفلترة الكشوفات الأكاديمية</span>
            </div>

            <!-- Search input with icon -->
            <div class="relative min-w-[260px]">
              <input
                v-model="searchInput"
                type="text"
                placeholder="بحث باسم الطالب أو رمزه..."
                class="w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl px-4 py-2 pr-9 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all"
                @input="onSearchInput"
              />
              <Search class="w-4 h-4 text-bx-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-bx-muted">العام الدراسي:</label>
              <TaqniyaSelect
                v-model="filters.academic_year_name"
                :options="yearFilterOptions"
                placeholder="جميع الأعوام الدراسية"
                :full-width="true"
                @update:model-value="fetchTranscripts"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-bx-muted">نوع الصحيفة:</label>
              <TaqniyaSelect
                v-model="filters.transcript_type"
                :options="transcriptTypeFilterOptions"
                placeholder="جميع أنواع الصحائف"
                :full-width="true"
                @update:model-value="fetchTranscripts"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-bx-muted">الصف الدراسي:</label>
              <TaqniyaSelect
                v-model="selectedClassIdModel"
                :options="classFilterOptions"
                placeholder="كافة الصفوف الدراسية"
                :full-width="true"
                @update:model-value="onClassFilterChange"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-bx-muted">الحالة النهائية للطالب:</label>
              <TaqniyaSelect
                v-model="filters.final_status"
                :options="statusFilterOptions"
                placeholder="كافة الحالات الأكاديمية"
                :full-width="true"
                @update:model-value="fetchTranscripts"
              />
            </div>
          </div>
        </div>

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

        <!-- Leaderboard Table -->
        <div v-if="isLoadingTranscripts" class="flex flex-col items-center justify-center p-12 text-bx-muted gap-3">
          <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
          <span class="text-sm font-semibold">جاري تحميل كشوفات الدرجات الأكاديمية...</span>
        </div>
        <div v-else class="space-y-4">
          <ClassLeaderboardTable
            :transcripts="transcripts"
            @view-detail="handleViewTranscriptDetail"
            @freeze="handleOpenGradeEntry"
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

      <!-- Grade Entry & Freeze Modal -->
      <GradeEntrySheetModal
        :is-open="isGradeModalOpen"
        :student-data="selectedTranscript"
        :is-submitting="isFreezing"
        @close="isGradeModalOpen = false"
        @submit-freeze="handleSubmitFreeze"
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
  Loader2,
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
import GradeEntrySheetModal from '../components/promotion/GradeEntrySheetModal.vue';
import PromotionExecutionModal from '../components/promotion/PromotionExecutionModal.vue';

import {
  promotionApi,
  type StudentTranscript,
  type ExecutiveClassSummary,
  type PromotionBatch,
  type PromotionSimulationResult,
  type QueryTranscriptsDto,
  type FreezeTranscriptDto,
  type ExecutePromotionDto,
} from '../api/promotion.api';
import { academicApi, type AcademicYearItem, type AcademicClassItem } from '../api/academic.api';
import { useToast } from '../composables/useToast';

const toast = useToast();

const activeTab = ref<'transcripts' | 'batches'>('transcripts');

// Data State
const transcripts = ref<StudentTranscript[]>([]);
const executiveClassSummaries = ref<ExecutiveClassSummary[]>([]);
const promotionBatches = ref<PromotionBatch[]>([]);
const academicYearsList = ref<AcademicYearItem[]>([]);
const classesList = ref<AcademicClassItem[]>([]);
const promotionSimulation = ref<PromotionSimulationResult | null>(null);

// Selected Items & Drawers/Modals
const selectedTranscript = ref<StudentTranscript | null>(null);
const selectedBatch = ref<PromotionBatch | null>(null);
const isDetailDrawerOpen = ref(false);
const isBatchDetailDrawerOpen = ref(false);
const isGradeModalOpen = ref(false);
const isPromotionModalOpen = ref(false);

// Loading Flags
const isLoadingTranscripts = ref(false);
const isLoadingBatches = ref(false);
const isFreezing = ref(false);
const isSimulating = ref(false);
const isExecutingPromotion = ref(false);

// Search input & debounce
const searchInput = ref('');
let searchDebounceTimer: any = null;

// Filters & Pagination
const filters = ref<QueryTranscriptsDto>({
  page: 1,
  per_page: 15,
  academic_year_name: undefined,
  grade_level: undefined,
  class_id: undefined,
  transcript_type: undefined,
  final_status: undefined,
  search: undefined,
});

const selectedClassIdModel = ref<string | number>('all');

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
    subtext: y.is_active ? 'العام الأكاديمي النشط حالياً' : undefined,
  })),
]);

const transcriptTypeFilterOptions: TaqniyaSelectOption[] = [
  { label: 'جميع أنواع الصحائف', value: 'all' },
  { label: 'صحيفة سنوية نهائية (Annual)', value: 'annual' },
  { label: 'صحيفة فصلية (Term)', value: 'term' },
];

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'كافة الصفوف الدراسية', value: 'all' },
  ...classesList.value.map((c) => ({
    label: `${c.name} (المستوى ${c.grade_level})`,
    value: c.grade_level,
    subtext: `المستوى الدراسي ${c.grade_level}`,
  })),
]);

const statusFilterOptions: TaqniyaSelectOption[] = [
  { label: 'كافة الحالات الأكاديمية', value: 'all' },
  { label: 'ناجح ومرحل (Passed)', value: 'passed' },
  { label: 'دور ثانٍ (Second Round)', value: 'second_round' },
  { label: 'باقٍ للإعادة (Failed)', value: 'failed' },
  { label: 'متخرج (Graduated)', value: 'graduated' },
];

// Computed Metrics
const totalTranscriptsCount = computed(() => meta.value.total);

const overallPassRate = computed(() => {
  if (executiveClassSummaries.value.length === 0) return 0;
  const total = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.total_students, 0);
  const passed = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.passed_count, 0);
  return total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0;
});

// Search input handler
const onSearchInput = () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    filters.value.search = searchInput.value.trim() || undefined;
    filters.value.page = 1;
    fetchTranscripts();
  }, 300);
};

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchAcademicLookups(),
    fetchTranscripts(),
    fetchPromotionBatches(),
  ]);
});

const fetchAcademicLookups = async () => {
  try {
    const [yearsRes, classesRes] = await Promise.all([
      academicApi.getYears({ per_page: 50 }),
      academicApi.getClasses({ per_page: 50 }),
    ]);
    if (yearsRes.data?.success) academicYearsList.value = yearsRes.data.data;
    if (classesRes.data?.success) classesList.value = classesRes.data.data;
  } catch (err: any) {
    console.error('Failed to load academic lookups:', err);
  }
};

const onClassFilterChange = (val: any) => {
  if (val === 'all' || !val) {
    filters.value.grade_level = undefined;
    filters.value.class_id = undefined;
  } else {
    filters.value.grade_level = Number(val);
  }
  filters.value.page = 1;
  fetchTranscripts();
};

const fetchTranscripts = async () => {
  isLoadingTranscripts.value = true;
  try {
    const queryParams: QueryTranscriptsDto = {
      page: filters.value.page,
      per_page: filters.value.per_page,
      academic_year_name: filters.value.academic_year_name === 'all' ? undefined : filters.value.academic_year_name,
      grade_level: filters.value.grade_level,
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
  if (filters.value.grade_level === cSum.grade_level) {
    filters.value.grade_level = undefined;
    selectedClassIdModel.value = 'all';
  } else {
    filters.value.grade_level = cSum.grade_level;
    selectedClassIdModel.value = cSum.grade_level;
  }
  filters.value.page = 1;
  fetchTranscripts();
};

const handlePageChange = (page: number) => {
  filters.value.page = page;
  fetchTranscripts();
};

const handleViewTranscriptDetail = (transcript: StudentTranscript) => {
  selectedTranscript.value = transcript;
  isDetailDrawerOpen.value = true;
};

const handleViewBatchDetail = (batch: PromotionBatch) => {
  selectedBatch.value = batch;
  isBatchDetailDrawerOpen.value = true;
};

const handleOpenGradeEntry = (transcript: StudentTranscript) => {
  selectedTranscript.value = transcript;
  isGradeModalOpen.value = true;
};

const handleSubmitFreeze = async (payload: FreezeTranscriptDto) => {
  isFreezing.value = true;
  try {
    const res = await promotionApi.freezeTranscript(payload);
    if (res.success) {
      toast.success(res.message || 'تم تجميد وتثبيت كشف الدرجات رسمياً.');
      isGradeModalOpen.value = false;
      await fetchTranscripts();
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل تجميد الكشف الأكاديمي.');
  } finally {
    isFreezing.value = false;
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
