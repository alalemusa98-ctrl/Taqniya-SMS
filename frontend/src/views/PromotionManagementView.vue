<template>
  <TaqniyaErrorBoundary>
    <div class="promotion-management-view" dir="rtl">
      <!-- Spatial View Header -->
      <header class="spatial-page-header">
        <div class="header-left">
          <div class="icon-wrap">
            <GraduationCap class="header-icon" />
          </div>
          <div>
            <h1 class="page-title">الترحيل الأكاديمي وكشوفات النتائج والأرشيف</h1>
            <p class="page-subtitle">
              إدارة كشوفات الدرجات المعتمدة، لوحة الشرف، المحاكاة الذكية، والترحيل السنوي المتوازن مع الحفاظ على تسكين الشعب
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="btn-spatial-primary"
            @click="openPromotionModal"
          >
            <Sparkles class="btn-icon" />
            <span>تنفيذ الترحيل السنوي وتوزيع الفصول</span>
          </button>
        </div>
      </header>

      <!-- Executive KPI Cards -->
      <section class="kpis-section">
        <div class="kpi-card glassmorphic">
          <div class="kpi-icon-wrap bg-indigo">
            <Layers class="kpi-icon" />
          </div>
          <div class="kpi-content">
            <span class="kpi-title">إجمالي الكشوفات المسجلة</span>
            <span class="kpi-number">{{ totalTranscriptsCount }}</span>
            <span class="kpi-subtext">سجلات مؤرشفة ومجمدة</span>
          </div>
        </div>

        <div class="kpi-card glassmorphic">
          <div class="kpi-icon-wrap bg-emerald">
            <CheckCircle2 class="kpi-icon" />
          </div>
          <div class="kpi-content">
            <span class="kpi-title">نسبة النجاح العامة</span>
            <span class="kpi-number">{{ overallPassRate }}%</span>
            <span class="kpi-subtext">على مستوى المدرسة</span>
          </div>
        </div>

        <div class="kpi-card glassmorphic">
          <div class="kpi-icon-wrap bg-amber">
            <RotateCcw class="kpi-icon" />
          </div>
          <div class="kpi-content">
            <span class="kpi-title">دفعات الترحيل المعتمدة</span>
            <span class="kpi-number">{{ promotionBatches.length }}</span>
            <span class="kpi-subtext">عمليات ترحيل سنوية مكتملة</span>
          </div>
        </div>
      </section>

      <!-- Navigation Tabs -->
      <nav class="tabs-nav-bar">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'transcripts' }"
          @click="activeTab = 'transcripts'"
        >
          <span>📑 كشوفات الدرجات ولوحة الشرف</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'batches' }"
          @click="activeTab = 'batches'"
        >
          <span>📜 سجل دفعات الترحيل المؤرشفة</span>
        </button>
      </nav>

      <!-- TAB 1: Transcripts & Leaderboard -->
      <section v-if="activeTab === 'transcripts'" class="tab-content">
        <!-- Filters Bar -->
        <div class="filters-panel glassmorphic">
          <div class="filter-controls">
            <div class="filter-item">
              <label class="filter-label">العام الدراسي:</label>
              <select v-model="filters.academic_year_name" class="spatial-input" @change="fetchTranscripts">
                <option value="">جميع الأعوام</option>
                <option v-for="y in academicYearsList" :key="y.id" :value="y.name">{{ y.name }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">الصف الدراسي:</label>
              <select v-model="filters.class_id" class="spatial-input" @change="fetchTranscripts">
                <option :value="undefined">جميع الصفوف</option>
                <option v-for="c in classesList" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">الحالة النهائية:</label>
              <select v-model="filters.final_status" class="spatial-input" @change="fetchTranscripts">
                <option value="">الكل</option>
                <option value="passed">ناجح</option>
                <option value="second_round">دور ثان</option>
                <option value="retained">باق للإعادة</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Executive Class Cards Grid -->
        <div v-if="executiveClassSummaries.length > 0" class="classes-cards-grid">
          <ExecutiveClassCard
            v-for="cSum in executiveClassSummaries"
            :key="cSum.class_id"
            :class-summary="cSum"
            :is-selected="filters.class_id === cSum.class_id"
            @select="handleSelectClassCard"
          />
        </div>

        <!-- Leaderboard Table -->
        <div v-if="isLoadingTranscripts" class="loading-state">
          <Loader2 class="spinner" />
          <span>جاري تحميل كشوفات الدرجات الأكاديمية...</span>
        </div>
        <div v-else>
          <ClassLeaderboardTable
            :transcripts="transcripts"
            @view-detail="handleViewTranscriptDetail"
            @freeze="handleOpenGradeEntry"
          />

          <!-- Pagination -->
          <div v-if="meta.total_pages > 1" class="pagination-wrap">
            <TaqniyaPagination
              :current-page="meta.current_page"
              :total-pages="meta.total_pages"
              @page-change="handlePageChange"
            />
          </div>
        </div>
      </section>

      <!-- TAB 2: Promotion Batches History -->
      <section v-if="activeTab === 'batches'" class="tab-content">
        <div class="glassmorphic batches-table-card">
          <div class="batches-card-header">
            <h3 class="card-title">سجل عمليات الترحيل الأكاديمي الجماعي (Promotion Batches SSoT)</h3>
            <span class="card-subtitle">كافة العمليات مؤرخة وموثقة بسجلات التدقيق الأمني Audit Logs</span>
          </div>

          <div v-if="isLoadingBatches" class="loading-state">
            <Loader2 class="spinner" />
            <span>جاري تحميل سجل الدفعات...</span>
          </div>
          <div v-else-if="promotionBatches.length === 0" class="empty-state">
            <span>لا توجد دفعات ترحيل منفذة حتى الآن.</span>
          </div>
          <div v-else class="table-responsive">
            <table class="spatial-table">
              <thead>
                <tr>
                  <th>معرف الدفعة</th>
                  <th>من عام دراسي</th>
                  <th>إلى عام دراسي</th>
                  <th>إجمالي الطلاب</th>
                  <th>المنقولون</th>
                  <th>الدور الثاني</th>
                  <th>الباقون للإعادة</th>
                  <th>نسبة النجاح العامة</th>
                  <th>تاريخ التنفيذ</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in promotionBatches" :key="b.id">
                  <td><code>BAT-{{ b.id }}</code></td>
                  <td class="font-semibold">{{ b.from_academic_year?.name || b.from_academic_year_id }}</td>
                  <td class="font-semibold text-primary">{{ b.to_academic_year?.name || b.to_academic_year_id }}</td>
                  <td class="font-bold">{{ b.total_students }}</td>
                  <td class="text-success font-semibold">{{ b.total_promoted }}</td>
                  <td class="text-warning font-semibold">{{ b.total_second_round }}</td>
                  <td class="text-danger font-semibold">{{ b.total_retained }}</td>
                  <td>
                    <span class="rate-badge">{{ b.overall_passing_rate }}%</span>
                  </td>
                  <td class="text-muted">{{ formatDate(b.created_at) }}</td>
                  <td class="text-sm">{{ b.execution_notes || '—' }}</td>
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
  Loader2,
} from 'lucide-vue-next';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
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
  academic_year_name: '',
  class_id: undefined,
  final_status: '',
});

const meta = ref({
  current_page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
});

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

const fetchTranscripts = async () => {
  isLoadingTranscripts.value = true;
  try {
    const res = await promotionApi.getTranscripts(filters.value);
    if (res.success) {
      transcripts.value = res.data;
      executiveClassSummaries.value = res.meta?.class_summaries || [];
      meta.value = {
        current_page: res.meta?.current_page || 1,
        per_page: res.meta?.per_page || 20,
        total: res.meta?.total || 0,
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
  } else {
    filters.value.class_id = cSum.class_id;
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

<style scoped>
.promotion-management-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 1440px;
  margin: 0 auto;
}

.spatial-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #818cf8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.header-icon {
  width: 28px;
  height: 28px;
}

.page-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.2rem 0 0 0;
}

.btn-spatial-primary {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}

.btn-spatial-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.kpis-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.glassmorphic {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

.kpi-card {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.kpi-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.bg-indigo {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.bg-emerald {
  background: linear-gradient(135deg, #10b981, #059669);
}

.bg-amber {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.kpi-icon {
  width: 26px;
  height: 26px;
}

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-title {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.kpi-number {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.kpi-subtext {
  font-size: 0.75rem;
  color: #94a3b8;
}

.tabs-nav-bar {
  display: flex;
  gap: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.25rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.6rem 1.2rem;
  font-weight: 700;
  font-size: 0.95rem;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #4f46e5;
  background: rgba(238, 242, 255, 0.6);
}

.tab-btn.active {
  color: #4f46e5;
  background: #eef2ff;
  border-bottom: 2px solid #4f46e5;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filters-panel {
  padding: 1rem 1.25rem;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-label {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 600;
}

.spatial-input {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  outline: none;
  transition: border 0.2s ease;
}

.spatial-input:focus {
  border-color: #6366f1;
}

.classes-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  color: #4f46e5;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.batches-table-card {
  padding: 1.5rem;
}

.batches-card-header {
  margin-bottom: 1.25rem;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.card-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

.spatial-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  font-size: 0.85rem;
}

.spatial-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.spatial-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.rate-badge {
  background: #ecfdf5;
  color: #047857;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
}

.text-primary {
  color: #4f46e5;
}

.text-success {
  color: #059669;
}

.text-warning {
  color: #d97706;
}

.text-danger {
  color: #dc2626;
}

.text-muted {
  color: #94a3b8;
}

@media (max-width: 900px) {
  .kpis-section {
    grid-template-columns: 1fr;
  }
}
</style>
