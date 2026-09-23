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
          <div class="flex items-center gap-2 font-bold text-sm text-bx-title">
            <Filter class="w-4 h-4 text-bx-primary" />
            <span>تصفية وفلترة الكشوفات الأكاديمية</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            :key="cSum.class_id"
            :class-summary="cSum"
            :is-selected="filters.class_id === cSum.class_id"
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
          <div v-if="meta.total_pages > 1" class="flex justify-center pt-4">
            <TaqniyaPagination
              :current-page="meta.current_page"
              :total-pages="meta.total_pages"
              @page-change="handlePageChange"
            />
          </div>
        </div>
      </section>

      <!-- TAB 2: Promotion Batches History -->
      <section v-if="activeTab === 'batches'" class="space-y-6">
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div class="border-b border-[#B4AED8] dark:border-white/[0.08] pb-4">
            <h3 class="text-lg font-bold text-bx-title font-display">سجل عمليات الترحيل الأكاديمي الجماعي (Promotion Batches SSoT)</h3>
            <p class="text-xs text-bx-muted mt-1 font-medium">كافة العمليات مؤرخة وموثقة بسجلات التدقيق الأمني Audit Logs</p>
          </div>

          <div v-if="isLoadingBatches" class="flex flex-col items-center justify-center p-12 text-bx-muted gap-3">
            <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
            <span class="text-sm font-semibold">جاري تحميل سجل الدفعات...</span>
          </div>
          <div v-else-if="promotionBatches.length === 0" class="text-center py-12 text-bx-muted text-sm">
            <span>لا توجد دفعات ترحيل منفذة حتى الآن.</span>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr class="border-b border-[#B4AED8] dark:border-white/[0.08] text-bx-muted font-bold">
                  <th class="py-3 px-4">معرف الدفعة</th>
                  <th class="py-3 px-4">من عام دراسي</th>
                  <th class="py-3 px-4">إلى عام دراسي</th>
                  <th class="py-3 px-4">إجمالي الطلاب</th>
                  <th class="py-3 px-4">المنقولون</th>
                  <th class="py-3 px-4">الدور الثاني</th>
                  <th class="py-3 px-4">الباقون للإعادة</th>
                  <th class="py-3 px-4">نسبة النجاح العامة</th>
                  <th class="py-3 px-4">تاريخ التنفيذ</th>
                  <th class="py-3 px-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#B4AED8]/40 dark:divide-white/[0.04]">
                <tr v-for="b in promotionBatches" :key="b.id" class="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td class="py-3 px-4 font-mono font-bold text-bx-primary">BAT-{{ b.id }}</td>
                  <td class="py-3 px-4 font-bold text-bx-title">{{ b.from_academic_year?.name || b.from_academic_year_id }}</td>
                  <td class="py-3 px-4 font-bold text-bx-primary">{{ b.to_academic_year?.name || b.to_academic_year_id }}</td>
                  <td class="py-3 px-4 font-black">{{ b.total_students }}</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">{{ b.total_promoted }}</td>
                  <td class="py-3 px-4 text-amber-600 font-bold">{{ b.total_second_round }}</td>
                  <td class="py-3 px-4 text-rose-600 font-bold">{{ b.total_retained }}</td>
                  <td class="py-3 px-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {{ b.overall_passing_rate }}%
                    </span>
                  </td>
                  <td class="py-3 px-4 text-bx-muted text-xs">{{ formatDate(b.created_at) }}</td>
                  <td class="py-3 px-4 text-xs text-bx-muted max-w-[200px] truncate">{{ b.execution_notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Detail Drawer -->
      <TranscriptDetailDrawer
        :is-open="isDetailDrawerOpen"
        :transcript="selectedTranscript"
        @close="isDetailDrawerOpen = false"
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
} from 'lucide-vue-next';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';
import ExecutiveClassCard from '../components/promotion/ExecutiveClassCard.vue';
import ClassLeaderboardTable from '../components/promotion/ClassLeaderboardTable.vue';
import TranscriptDetailDrawer from '../components/promotion/TranscriptDetailDrawer.vue';
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

// Selected Items & Modals
const selectedTranscript = ref<StudentTranscript | null>(null);
const isDetailDrawerOpen = ref(false);
const isGradeModalOpen = ref(false);
const isPromotionModalOpen = ref(false);

// Loading Flags
const isLoadingTranscripts = ref(false);
const isLoadingBatches = ref(false);
const isFreezing = ref(false);
const isSimulating = ref(false);
const isExecutingPromotion = ref(false);

// Filters & Pagination
const filters = ref<QueryTranscriptsDto>({
  page: 1,
  per_page: 20,
  academic_year_name: undefined,
  class_id: undefined,
  final_status: undefined,
});

const selectedClassIdModel = ref<string | number>('all');

const meta = ref({
  current_page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
});

// Dropdown Options
const yearFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'جميع الأعوام الدراسية', value: 'all' },
  ...academicYearsList.value.map((y) => ({
    label: `${y.name} ${y.is_active ? '(النشط)' : ''}`,
    value: y.name,
    subtext: y.is_active ? 'العام الأكاديمي النشط حالياً' : undefined,
  })),
]);

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'كافة الصفوف الدراسية', value: 'all' },
  ...classesList.value.map((c) => ({
    label: `${c.name} (المستوى ${c.grade_level})`,
    value: c.id,
    subtext: `المستوى الدراسي ${c.grade_level}`,
  })),
]);

const statusFilterOptions: TaqniyaSelectOption[] = [
  { label: 'كافة الحالات الأكاديمية', value: 'all' },
  { label: 'ناجح ومنقول (Passed)', value: 'passed' },
  { label: 'دور ثانٍ (Second Round)', value: 'second_round' },
  { label: 'باقٍ للإعادة (Retained)', value: 'retained' },
];

// Computed Metrics
const totalTranscriptsCount = computed(() => meta.value.total);

const overallPassRate = computed(() => {
  if (executiveClassSummaries.value.length === 0) return 0;
  const total = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.total_students, 0);
  const passed = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.passed_count, 0);
  return total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0;
});

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
    filters.value.class_id = undefined;
  } else {
    filters.value.class_id = Number(val);
  }
  fetchTranscripts();
};

const fetchTranscripts = async () => {
  isLoadingTranscripts.value = true;
  try {
    const queryParams: QueryTranscriptsDto = {
      page: filters.value.page,
      per_page: filters.value.per_page,
      academic_year_name: filters.value.academic_year_name === 'all' ? undefined : filters.value.academic_year_name,
      class_id: filters.value.class_id,
      final_status: filters.value.final_status === 'all' ? undefined : filters.value.final_status,
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
        per_page: res.meta?.per_page || 20,
        total: res.meta?.total !== undefined ? res.meta.total : transcripts.value.length,
        total_pages: res.meta?.total_pages || 1,
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
  if (filters.value.class_id === cSum.class_id) {
    filters.value.class_id = undefined;
    selectedClassIdModel.value = 'all';
  } else {
    filters.value.class_id = cSum.class_id;
    selectedClassIdModel.value = cSum.class_id;
  }
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
