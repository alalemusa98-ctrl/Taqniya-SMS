<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Pen,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  Paperclip,
  Printer,
  School,
  BookOpen,
  Layers,
  Download,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
} from 'lucide-vue-next';
import {
  officialExamsApi,
  type OfficialExam,
  type ClassExamGroup,
  type ExamTypeGroup,
} from '../api/official-exams.api';
import {
  academicApi,
  type AcademicYearItem,
  type AcademicTermItem,
  type AcademicClassItem,
  type AcademicSubjectItem,
} from '../api/academic.api';
import { useAuthStore } from '../stores/auth.store';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../components/ui/TaqniyaDrawer.vue';
import AcademicDetailHeroCard from '../components/ui/AcademicDetailHeroCard.vue';
import OfficialExamDrawerForm from '../components/official-exams/OfficialExamDrawerForm.vue';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role_type === 'admin');
const isTeacher = computed(() => authStore.user?.role_type === 'teacher');
const isStudentOrParent = computed(() => ['student', 'parent'].includes(authStore.user?.role_type || ''));

// Navigation / View Tabs for Admin
const activeViewTab = ref<'matrix' | 'class_board'>('matrix');

// Academic Context States
const academicYears = ref<AcademicYearItem[]>([]);
const academicTerms = ref<AcademicTermItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const subjects = ref<AcademicSubjectItem[]>([]);

// Filter States
const selectedYearId = ref<number>(0);
const selectedTermId = ref<number>(0);
const selectedClassId = ref<number | null>(null);
const selectedExamType = ref<string>('');
const selectedExamDate = ref<string>('');
const searchKeyword = ref<string>('');
const currentPage = ref<number>(1);
const perPage = ref<number>(15);
const totalRecords = ref<number>(0);

// Data States
const loading = ref<boolean>(false);
const examsList = ref<OfficialExam[]>([]);
const hierarchicalClasses = ref<ClassExamGroup[]>([]);
const classBoardData = ref<{
  class_id: number;
  class_name: string;
  grade_level: number;
  academic_year_name: string;
  academic_term_name: string;
  exam_types: ExamTypeGroup[];
} | null>(null);

// Teacher Schedule Data
const teacherExams = ref<OfficialExam[]>([]);

// Drawer & Modal States
const isDrawerOpen = ref<boolean>(false);
const drawerMode = ref<'create' | 'edit'>('create');
const itemToEdit = ref<OfficialExam | null>(null);
const isSubmitting = ref<boolean>(false);

// Details Drawer
const isDetailsDrawerOpen = ref<boolean>(false);
const selectedExamDetails = ref<OfficialExam | null>(null);

// Delete Modal State
const isDeleteModalOpen = ref<boolean>(false);
const itemToDelete = ref<OfficialExam | null>(null);
const isDeleting = ref<boolean>(false);

// Toast / Feedback
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

function showToast(text: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = { type, text };
  setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
}

// Options
const yearOptions = computed<TaqniyaSelectOption[]>(() =>
  academicYears.value.map((y: AcademicYearItem) => ({
    value: y.id,
    label: y.name,
    subtext: y.is_active ? 'العام الحالي' : undefined,
  })),
);

const termOptions = computed<TaqniyaSelectOption[]>(() =>
  academicTerms.value.map((t: AcademicTermItem) => ({
    value: t.id,
    label: t.name,
    subtext: `فصل رقم ${t.term_number}`,
  })),
);

const classOptions = computed<TaqniyaSelectOption[]>(() => [
  { value: '', label: 'كافة الصفوف الدراسية' },
  ...classes.value.map((c: AcademicClassItem) => ({
    value: c.id,
    label: c.name,
    subtext: `المستوى: ${c.grade_level}`,
  })),
]);

const examTypeFilterOptions: TaqniyaSelectOption[] = [
  { value: '', label: 'كافة أنواع الامتحانات' },
  { value: 'midterm', label: 'امتحانات نصفية (Midterm)' },
  { value: 'final', label: 'امتحانات نهائية (Final)' },
  { value: 'second_round', label: 'امتحانات الدور الثاني (Second Round)' },
];

// KPI Computations
const kpiStats = computed(() => {
  const all = examsList.value;
  return {
    total: totalRecords.value || all.length,
    midterm: all.filter((e) => e.exam_type === 'midterm').length,
    final: all.filter((e) => e.exam_type === 'final').length,
    second_round: all.filter((e) => e.exam_type === 'second_round').length,
  };
});

async function loadInitialContext() {
  try {
    const [yearsRes, termsRes, classesRes, subjectsRes] = await Promise.all([
      academicApi.getYears(),
      academicApi.getTerms(),
      academicApi.getClasses(),
      academicApi.getSubjects(),
    ]);

    academicYears.value = yearsRes.data.data;
    academicTerms.value = termsRes.data.data;
    classes.value = classesRes.data.data;
    subjects.value = subjectsRes.data.data;

    const activeYear = academicYears.value.find((y: AcademicYearItem) => y.is_active) || academicYears.value[0];
    if (activeYear) selectedYearId.value = activeYear.id;

    const activeTerm = academicTerms.value[0];
    if (activeTerm) selectedTermId.value = activeTerm.id;
  } catch (err) {
    console.error('Failed to load academic context:', err);
  }
}

async function fetchOfficialExams() {
  loading.value = true;
  try {
    if (isStudentOrParent.value && selectedClassId.value) {
      // Student/Parent fetch
      const res = await officialExamsApi.getByClass(selectedClassId.value, selectedTermId.value || undefined);
      classBoardData.value = res.data.data;
    } else if (isTeacher.value) {
      // Teacher fetch using user ID
      const teacherId = authStore.user?.id || 1;
      const res = await officialExamsApi.getByTeacher(
        teacherId,
        selectedTermId.value || undefined,
      );
      teacherExams.value = res.data.data.exams;
    } else {
      // Admin / Manager fetch
      const res = await officialExamsApi.getAll({
        academic_year_id: selectedYearId.value || undefined,
        academic_term_id: selectedTermId.value || undefined,
        class_id: selectedClassId.value ? Number(selectedClassId.value) : undefined,
        exam_type: selectedExamType.value || undefined,
        exam_date: selectedExamDate.value || undefined,
        search: searchKeyword.value || undefined,
        page: currentPage.value,
        per_page: perPage.value,
      });

      hierarchicalClasses.value = res.data.data.classes || [];
      examsList.value = res.data.data.items || [];
      totalRecords.value = res.data.meta?.total || 0;

      // Also if class board tab is active, fetch class board
      if (selectedClassId.value) {
        const boardRes = await officialExamsApi.getByClass(selectedClassId.value, selectedTermId.value || undefined);
        classBoardData.value = boardRes.data.data;
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch official exams:', err);
    showToast(err?.response?.data?.message || 'تعذر جلب جدول الامتحانات الرسمية.', 'error');
  } finally {
    loading.value = false;
  }
}

watch(
  [selectedYearId, selectedTermId, selectedClassId, selectedExamType, selectedExamDate, currentPage],
  () => {
    fetchOfficialExams();
  },
);

let searchTimeout: any = null;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchOfficialExams();
  }, 400);
}

function resetFilters() {
  selectedExamType.value = '';
  selectedExamDate.value = '';
  searchKeyword.value = '';
  selectedClassId.value = null;
  currentPage.value = 1;
  fetchOfficialExams();
}

function openCreateDrawer() {
  drawerMode.value = 'create';
  itemToEdit.value = null;
  isDrawerOpen.value = true;
}

function openEditDrawer(exam: OfficialExam) {
  drawerMode.value = 'edit';
  itemToEdit.value = exam;
  isDrawerOpen.value = true;
}

function openDetailsDrawer(exam: OfficialExam) {
  selectedExamDetails.value = exam;
  isDetailsDrawerOpen.value = true;
}

function openDeleteModal(exam: OfficialExam) {
  itemToDelete.value = exam;
  isDeleteModalOpen.value = true;
}

async function handleFormSubmit(payload: any) {
  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      await officialExamsApi.create(payload);
      showToast('تمت جدولة الامتحان الرسمي بنجاح.');
    } else if (itemToEdit.value) {
      await officialExamsApi.update(itemToEdit.value.id, payload);
      showToast('تم تحديث موعد الامتحان الرسمي بنجاح.');
    }
    isDrawerOpen.value = false;
    fetchOfficialExams();
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'تعذر حفظ موعد الامتحان.', 'error');
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmDelete() {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    await officialExamsApi.delete(itemToDelete.value.id);
    showToast('تم إلغاء وحذف موعد الامتحان بنجاح.');
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
    fetchOfficialExams();
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'تعذر حذف موعد الامتحان.', 'error');
  } finally {
    isDeleting.value = false;
  }
}

function printTimetable() {
  window.print();
}

function getExamTypeBadge(type: string) {
  switch (type) {
    case 'midterm':
      return { label: 'امتحان نصفي', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'final':
      return { label: 'امتحان نهائي', class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    case 'second_round':
      return { label: 'دور ثانٍ', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    default:
      return { label: type, class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  }
}

function getFileIcon(type?: string) {
  if (!type) return FileText;
  if (type.includes('pdf')) return FileText;
  if (type.includes('image')) return ImageIcon;
  if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('presentation') || type.includes('powerpoint')) return Presentation;
  return FileText;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

onMounted(async () => {
  await loadInitialContext();
  await fetchOfficialExams();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans print:p-0 print:m-0" dir="rtl">
      <!-- Toast Message -->
      <div
        v-if="toastMessage"
        class="fixed bottom-6 left-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all duration-300 animate-slide-up"
        :class="toastMessage.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-rose-600/20'"
      >
        <CheckCircle2 v-if="toastMessage.type === 'success'" class="w-4 h-4" />
        <AlertCircle v-else class="w-4 h-4" />
        <span>{{ toastMessage.text }}</span>
      </div>

      <!-- Main Unified Container Card -->
      <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm space-y-6">
        
        <!-- 1. Card Header: Title on Right, Controls & Actions on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#B4AED8]/60 dark:border-white/10 print:hidden">
          <!-- Title & Subtitle with Taqniya Brand Accent -->
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                جدول الامتحانات الرسمية
              </h2>
              <span
                v-if="academicYears.find((y) => y.id === selectedYearId)"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-xs"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>العام النشط: {{ academicYears.find((y) => y.id === selectedYearId)?.name }}</span>
              </span>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              إدارة وجدولة ونشر مواعيد الامتحانات النصفية والنهائية والدور الثاني ومذكرات المراجعة المعتمدة
            </p>
          </div>

          <!-- Controls: Add Button + Print + Search Trigger -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Print Button for Student / Parent or Admin in Board View -->
            <button
              v-if="isStudentOrParent || activeViewTab === 'class_board'"
              type="button"
              @click="printTimetable"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition shadow-2xs"
            >
              <Printer class="w-3.5 h-3.5 text-bx-primary" />
              <span>طباعة الجدول المعتمد</span>
            </button>

            <!-- New Exam Button (Admin only) -->
            <button
              v-if="isAdmin"
              type="button"
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ جدولة امتحان جديد</span>
            </button>

            <!-- Search Input with Search Trigger -->
            <div class="relative flex-1 sm:w-72 flex items-center gap-1.5">
              <div class="relative flex-1">
                <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
                <input
                  v-model="searchKeyword"
                  @keydown.enter="handleSearch"
                  type="text"
                  placeholder="بحث في المواد والتعليمات والقاعات..."
                  class="w-full pr-10 pl-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
                />
              </div>
              <button
                @click="handleSearch"
                :disabled="loading"
                class="h-8 px-3 rounded-full bg-purple-500/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-purple-500/30 dark:border-purple-400/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="بحث فوري (أو اضغط Enter)"
              >
                <Search class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- KPI Statistics (Admin only) -->
        <div v-if="isAdmin" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <TaqniyaKpiCard
            title="إجمالي الامتحانات"
            :value="kpiStats.total"
            icon="Calendar"
            color="brand"
            subtitle="امتحانات مجدولة ومثبتة"
          />
          <TaqniyaKpiCard
            title="امتحانات نصفية"
            :value="kpiStats.midterm"
            icon="Clock"
            color="blue"
            subtitle="امتحانات منتصف الفصل"
          />
          <TaqniyaKpiCard
            title="امتحانات نهائية"
            :value="kpiStats.final"
            icon="GraduationCap"
            color="rose"
            subtitle="نهاية الفصل الدراسي"
          />
          <TaqniyaKpiCard
            title="امتحانات الدور الثاني"
            :value="kpiStats.second_round"
            icon="Sparkles"
            color="amber"
            subtitle="الإعادة والتكميلي"
          />
        </div>

        <!-- Admin View Switcher Tabs -->
        <div v-if="isAdmin" class="flex items-center gap-2 p-1 rounded-full bg-purple-500/5 dark:bg-white/[0.03] border border-[#B4AED8]/40 dark:border-white/[0.06] w-fit print:hidden">
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2"
            :class="activeViewTab === 'matrix' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title'"
            @click="activeViewTab = 'matrix'"
          >
            <Layers class="w-3.5 h-3.5" />
            <span>مصفوفة إدارة الامتحانات المدرسية</span>
          </button>

          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2"
            :class="activeViewTab === 'class_board' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title'"
            @click="activeViewTab = 'class_board'"
          >
            <School class="w-3.5 h-3.5" />
            <span>روزنامة جدول الصف للطباعة</span>
          </button>
        </div>

        <!-- Filter Bar (Admin) -->
        <div v-if="isAdmin" class="p-4 sm:p-5 rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-xs space-y-4 print:hidden">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <!-- Year -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">العام الدراسي:</label>
              <TaqniyaSelect
                v-model="selectedYearId"
                :options="yearOptions"
                placeholder="اختر العام الدراسي"
              />
            </div>

            <!-- Term -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الفصل الدراسي:</label>
              <TaqniyaSelect
                v-model="selectedTermId"
                :options="termOptions"
                placeholder="اختر الفصل الدراسي"
              />
            </div>

            <!-- Class Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الصف الدراسي:</label>
              <TaqniyaSelect
                v-model="selectedClassId"
                :options="classOptions"
                placeholder="تصفية بالصف الدراسي"
              />
            </div>

            <!-- Exam Type Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">نوع الامتحان:</label>
              <TaqniyaSelect
                v-model="selectedExamType"
                :options="examTypeFilterOptions"
                placeholder="تصفية بنوع الامتحان"
              />
            </div>

            <!-- Exam Date -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">تاريخ الامتحان:</label>
              <input
                v-model="selectedExamDate"
                type="date"
                class="w-full px-3 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title outline-none focus:border-bx-primary transition"
              />
            </div>
          </div>

          <!-- Search & Reset -->
          <div class="flex items-center justify-between gap-3 pt-2 border-t border-[#B4AED8]/40 dark:border-white/[0.06]">
            <span class="text-xs font-bold text-bx-muted">تصفية متقدمة للامتحانات والمواد</span>

            <button
              type="button"
              @click="resetFilters"
              class="px-3.5 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-title hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw class="w-3.5 h-3.5 text-bx-primary" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          </div>
        </div>

        <!-- Main Content Area -->

        <!-- View 1: Admin Hierarchical Matrix View -->
        <div v-if="isAdmin && activeViewTab === 'matrix'" class="space-y-6">
          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="i in 4" :key="i" class="h-48 rounded-3xl bg-purple-500/5 animate-pulse border border-[#B4AED8]/30"></div>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="hierarchicalClasses.length === 0"
            class="text-center py-16 px-4 rounded-3xl bg-purple-500/[0.02] border border-dashed border-[#B4AED8] dark:border-white/10"
          >
            <Calendar class="w-12 h-12 mx-auto text-bx-primary/40 mb-3" />
            <h3 class="text-base font-bold text-bx-title">لا توجد امتحانات رسمية مجدولة</h3>
            <p class="text-xs text-bx-muted mt-1 max-w-sm mx-auto">
              لم يتم العثور على أي موعد امتحان يطابق محددات البحث الحالية. يمكنك البدء بجدولة أول امتحان.
            </p>
            <button
              type="button"
              @click="openCreateDrawer"
              class="mt-4 px-5 py-2 rounded-full bg-bx-primary hover:bg-bx-primary-hover text-white text-xs font-bold shadow-sm transition"
            >
              + جدولة امتحان جديد
            </button>
          </div>

          <!-- Classes Groups Matrix -->
          <div v-else class="space-y-6">
            <div
              v-for="classGroup in hierarchicalClasses"
              :key="classGroup.class_id"
              class="p-5 sm:p-6 rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-sm space-y-5"
            >
              <!-- Class Header -->
              <div class="flex items-center justify-between pb-3 border-b border-[#B4AED8]/60 dark:border-white/10">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold border border-purple-500/20">
                    <School class="w-5 h-5" />
                  </div>
                  <div>
                    <h2 class="text-base font-bold font-display text-bx-title">
                      {{ classGroup.class_name }}
                    </h2>
                    <p class="text-xs text-bx-muted">
                      المستوى الأكاديمي: {{ classGroup.grade_level }}
                    </p>
                  </div>
                </div>

                <span class="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-bx-primary font-bold border border-purple-500/20 shadow-2xs">
                  {{ classGroup.exam_types.reduce((acc, curr) => acc + curr.count, 0) }} مادة مجدولة
                </span>
              </div>

              <!-- Exam Type Sections Inside Class -->
              <div class="space-y-4">
                <div
                  v-for="typeGroup in classGroup.exam_types"
                  :key="typeGroup.exam_type"
                  class="space-y-3"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs px-3 py-1 rounded-full border font-bold shadow-2xs"
                      :class="getExamTypeBadge(typeGroup.exam_type).class"
                    >
                      {{ typeGroup.exam_type_ar }}
                    </span>
                    <span class="text-xs text-bx-muted font-bold">({{ typeGroup.count }} مواد)</span>
                  </div>

                  <!-- Exams Grid Cards -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <div
                      v-for="exam in typeGroup.exams"
                      :key="exam.id"
                      class="p-4 rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.06] bg-purple-500/[0.02] dark:bg-white/[0.01] hover:border-bx-primary/40 transition flex flex-col justify-between gap-3 group shadow-2xs"
                    >
                      <div>
                        <div class="flex items-start justify-between gap-2">
                          <h4 class="text-sm font-bold text-bx-title flex items-center gap-2">
                            <BookOpen class="w-4 h-4 text-bx-primary shrink-0" />
                            <span>{{ exam.subject_name }}</span>
                          </h4>

                          <span
                            v-if="exam.attachments_count && exam.attachments_count > 0"
                            class="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-bx-primary font-bold border border-purple-500/20 flex items-center gap-1 shrink-0"
                          >
                            <Paperclip class="w-3 h-3" />
                            <span>{{ exam.attachments_count }}</span>
                          </span>
                        </div>

                        <div class="mt-2.5 space-y-1.5 text-xs text-bx-muted">
                          <p class="flex items-center gap-2 font-bold text-bx-title">
                            <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                            <span>{{ exam.exam_day_name }} — {{ exam.exam_date }}</span>
                          </p>
                          <p v-if="exam.notes" class="text-[11px] text-bx-muted line-clamp-2">
                            {{ exam.notes }}
                          </p>
                        </div>
                      </div>

                      <!-- Actions -->
                      <div class="flex items-center justify-between pt-2.5 border-t border-[#B4AED8]/40 dark:border-white/[0.06]">
                        <button
                          type="button"
                          @click="openDetailsDrawer(exam)"
                          class="text-xs font-bold text-bx-primary hover:underline flex items-center gap-1"
                        >
                          <Eye class="w-3.5 h-3.5" />
                          <span>المعاينة والمرفقات</span>
                        </button>

                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            @click="openEditDrawer(exam)"
                            class="w-7 h-7 rounded-lg text-bx-muted hover:text-bx-primary hover:bg-purple-500/10 flex items-center justify-center transition"
                            title="تعديل الموعد"
                          >
                            <Pen class="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            @click="openDeleteModal(exam)"
                            class="w-7 h-7 rounded-lg text-bx-muted hover:text-rose-600 hover:bg-rose-500/10 flex items-center justify-center transition"
                            title="حذف الامتحان"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- View 2: Student / Parent & Printable Timetable Board -->
        <div v-else-if="isStudentOrParent || activeViewTab === 'class_board'" class="space-y-6">
          <div v-if="!classBoardData && !loading" class="text-center py-12 bg-purple-500/[0.02] rounded-3xl border border-[#B4AED8] dark:border-white/10">
            <School class="w-10 h-10 mx-auto text-bx-primary/40 mb-2" />
            <p class="text-xs font-bold text-bx-title">يرجى اختيار صف دراسي لعرض الروزنامة المعتمدة</p>
          </div>

          <div
            v-else-if="classBoardData"
            class="p-6 rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-sm space-y-6 print:border-none print:shadow-none print:p-0"
          >
            <!-- Printable Board Header -->
            <div class="text-center space-y-1 pb-4 border-b border-[#B4AED8]/60 dark:border-white/10">
              <div class="flex items-center justify-center gap-2 text-bx-primary font-bold text-lg font-display">
                <School class="w-6 h-6" />
                <span>نظام إدارة المدارس الذكي — جدول الامتحانات الرسمية المعتمد</span>
              </div>
              <p class="text-xs font-bold text-bx-title">
                {{ classBoardData.class_name }} — {{ classBoardData.academic_term_name || 'الفصل الدراسي الأول' }} ({{ classBoardData.academic_year_name || '2025/2026' }})
              </p>
            </div>

            <!-- Groups by Exam Type -->
            <div
              v-for="group in classBoardData.exam_types"
              :key="group.exam_type"
              class="space-y-4"
            >
              <div class="flex items-center gap-2">
                <span
                  class="text-xs px-3.5 py-1 rounded-full border font-bold shadow-2xs"
                  :class="getExamTypeBadge(group.exam_type).class"
                >
                  {{ group.exam_type_ar }}
                </span>
              </div>

              <!-- Printable Table -->
              <div class="overflow-x-auto rounded-2xl border border-[#B4AED8]/60 dark:border-white/10">
                <table class="w-full text-right text-xs font-sans">
                  <thead class="bg-purple-500/5 dark:bg-white/[0.03] text-bx-title font-bold border-b border-[#B4AED8]/60 dark:border-white/10">
                    <tr>
                      <th class="p-3.5 w-12 text-center">#</th>
                      <th class="p-3.5">اليوم والتاريخ</th>
                      <th class="p-3.5">المادة الدراسية</th>
                      <th class="p-3.5">القاعة والتعليمات الإرشادية</th>
                      <th class="p-3.5 w-32 text-center print:hidden">المرفقات</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#B4AED8]/40 dark:divide-white/[0.06] text-bx-title">
                    <tr
                      v-for="(exam, idx) in group.exams"
                      :key="exam.id"
                      class="hover:bg-purple-500/[0.02]"
                    >
                      <td class="p-3.5 text-center font-bold text-bx-muted">{{ idx + 1 }}</td>
                      <td class="p-3.5 font-bold text-bx-primary whitespace-nowrap">
                        {{ exam.exam_day_name }} — {{ exam.exam_date }}
                      </td>
                      <td class="p-3.5 font-black text-bx-title">
                        {{ exam.subject_name }}
                      </td>
                      <td class="p-3.5 text-bx-muted font-medium">
                        {{ exam.notes || '—' }}
                      </td>
                      <td class="p-3.5 text-center print:hidden">
                        <button
                          v-if="exam.attachments && exam.attachments.length > 0"
                          type="button"
                          @click="openDetailsDrawer(exam)"
                          class="px-3 py-1 rounded-full bg-purple-500/10 text-bx-primary border border-purple-500/20 text-xs font-bold hover:underline inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Paperclip class="w-3.5 h-3.5" />
                          <span>{{ exam.attachments.length }} مرفق</span>
                        </button>
                        <span v-else class="text-bx-muted text-xs">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- View 3: Teacher's View -->
        <div v-else-if="isTeacher" class="space-y-6">
          <div v-if="teacherExams.length === 0 && !loading" class="text-center py-16 bg-purple-500/[0.02] rounded-3xl border border-[#B4AED8] dark:border-white/10">
            <BookOpen class="w-12 h-12 mx-auto text-bx-primary/40 mb-3" />
            <h3 class="text-base font-bold text-bx-title">لا توجد امتحانات مسندة إليك حالياً</h3>
            <p class="text-xs text-bx-muted mt-1">تظهر هنا مواعيد امتحانات المواد والصفوف المسندة إلى بروفايلك الأكاديمي.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="exam in teacherExams"
              :key="exam.id"
              class="p-5 rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-sm space-y-4"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span
                    class="text-[10px] px-2.5 py-0.5 rounded-full border font-bold shadow-2xs"
                    :class="getExamTypeBadge(exam.exam_type).class"
                  >
                    {{ exam.exam_type_ar }}
                  </span>
                  <h3 class="text-base font-bold font-display text-bx-title mt-2">
                    {{ exam.subject_name }}
                  </h3>
                  <p class="text-xs text-bx-muted font-bold">{{ exam.class_name }}</p>
                </div>

                <button
                  type="button"
                  @click="openDetailsDrawer(exam)"
                  class="w-8 h-8 rounded-full bg-purple-500/10 text-bx-primary flex items-center justify-center hover:bg-bx-primary hover:text-white transition"
                  title="عرض التفاصيل والمرفقات"
                >
                  <Eye class="w-4 h-4" />
                </button>
              </div>

              <div class="p-3.5 rounded-2xl bg-purple-500/[0.03] border border-[#B4AED8]/40 space-y-1.5 text-xs text-bx-title font-medium">
                <p class="flex items-center gap-2 font-bold">
                  <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                  <span>{{ exam.exam_day_name }} — {{ exam.exam_date }}</span>
                </p>
                <p v-if="exam.notes" class="text-xs text-bx-muted">
                  القاعة / التعليمات: {{ exam.notes }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Exam Details Drawer (For all roles) -->
      <TaqniyaDrawer
        :is-open="isDetailsDrawerOpen"
        title="تفاصيل الامتحان الرسمي والمرفقات"
        subtitle="دليل المراجعة، جدول المواصفات، والتعليمات المعتمدة"
        max-width="max-w-[540px]"
        @close="isDetailsDrawerOpen = false"
      >
        <div v-if="selectedExamDetails" class="space-y-6 font-sans" dir="rtl">
          <!-- Reusable Academic Hero Card -->
          <AcademicDetailHeroCard
            type="exam"
            :title="selectedExamDetails.notes || `${selectedExamDetails.exam_type_ar || 'امتحان رسمي'} - ${selectedExamDetails.subject_name}`"
            :subject-name="selectedExamDetails.subject_name || 'امتحان رسمي'"
            :class-name="selectedExamDetails.class_name || ''"
            :target-date="selectedExamDetails.exam_date"
            :record-id="selectedExamDetails.id"
            teacher-name="إدارة المدرسة والكنترول"
          />

          <!-- Exam Specific Info -->
          <div class="p-4 rounded-2xl bg-purple-500/[0.03] border border-[#B4AED8]/60 dark:border-slate-700/60 space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-bx-muted font-bold">نوع الامتحان:</span>
              <span
                class="px-2.5 py-0.5 rounded-full border font-bold shadow-2xs"
                :class="getExamTypeBadge(selectedExamDetails.exam_type).class"
              >
                {{ selectedExamDetails.exam_type_ar }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-bx-muted font-bold">يوم وتاريخ الامتحان:</span>
              <span class="font-black text-bx-title">
                {{ selectedExamDetails.exam_day_name }} — {{ selectedExamDetails.exam_date }}
              </span>
            </div>

            <div v-if="selectedExamDetails.notes" class="pt-2 border-t border-[#B4AED8]/40 dark:border-slate-700/60">
              <span class="text-bx-muted block mb-1 font-bold">التعليمات والإرشادات:</span>
              <p class="text-bx-title font-medium">
                {{ selectedExamDetails.notes }}
              </p>
            </div>
          </div>

          <!-- Attachments Section with 48x48 icon style -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold font-display text-bx-title flex items-center gap-2">
                <Paperclip class="w-4 h-4 text-bx-primary" />
                <span>المرفقات وجداول المواصفات</span>
              </h4>
              <span class="text-xs text-bx-muted font-bold">
                {{ selectedExamDetails.attachments?.length || 0 }} ملف
              </span>
            </div>

            <div
              v-if="!selectedExamDetails.attachments || selectedExamDetails.attachments.length === 0"
              class="p-6 rounded-2xl bg-purple-500/[0.02] border border-[#B4AED8]/40 text-center text-xs text-bx-muted font-medium"
            >
              لا توجد ملفات مرفقة بهذا الامتحان.
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="(att, idx) in selectedExamDetails.attachments"
                :key="idx"
                class="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#B4AED8]/60 dark:border-white/10 hover:border-bx-primary/40 transition group shadow-xs"
              >
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 text-bx-primary flex items-center justify-center shrink-0 border border-purple-500/20 shadow-2xs">
                    <component :is="getFileIcon(att.file_type)" class="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-bx-title truncate">
                      {{ att.file_name }}
                    </p>
                    <p class="text-[11px] text-bx-muted mt-0.5">
                      <span v-if="att.file_size">{{ formatBytes(att.file_size) }}</span>
                      <span v-else>مرفق سحابي</span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <a
                    :href="att.file_url"
                    target="_blank"
                    download
                    class="w-8 h-8 rounded-full bg-purple-500/10 text-bx-primary hover:bg-bx-primary hover:text-white flex items-center justify-center transition shadow-2xs"
                    title="تحميل الملف"
                  >
                    <Download class="w-3.5 h-3.5" />
                  </a>

                  <a
                    :href="att.file_url"
                    target="_blank"
                    class="w-8 h-8 rounded-full bg-purple-500/10 text-bx-primary hover:bg-bx-primary hover:text-white flex items-center justify-center transition shadow-2xs"
                    title="فتح الرابط"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TaqniyaDrawer>

      <!-- Create / Edit Drawer Form (Admin) -->
      <OfficialExamDrawerForm
        v-model="isDrawerOpen"
        :mode="drawerMode"
        :item-to-edit="itemToEdit"
        :academic-years="academicYears"
        :academic-terms="academicTerms"
        :classes="classes"
        :subjects="subjects"
        :active-year-id="selectedYearId"
        :active-term-id="selectedTermId"
        :is-submitting="isSubmitting"
        @submit="handleFormSubmit"
      />

      <!-- Delete Confirmation Modal (Admin) -->
      <div
        v-if="isDeleteModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans"
        dir="rtl"
      >
        <div class="w-full max-w-md p-6 rounded-3xl bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] shadow-2xl space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
            <Trash2 class="w-6 h-6" />
          </div>

          <div class="text-center space-y-1">
            <h3 class="text-base font-bold font-display text-bx-title">
              تأكيد إلغاء وحذف موعد الامتحان
            </h3>
            <p class="text-xs text-bx-muted">
              هل أنت متأكد من رغبتك في شطب موعد امتحان
              <span class="font-bold text-bx-title">{{ itemToDelete?.subject_name }}</span>
              للصف {{ itemToDelete?.class_name }}؟ سيتم استبعاد السجل من الجداول المعتمدة.
            </p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#B4AED8]/40 dark:border-white/[0.06]">
            <button
              type="button"
              @click="isDeleteModalOpen = false"
              class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              @click="confirmDelete"
              class="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition disabled:opacity-50"
            >
              {{ isDeleting ? 'جاري الحذف...' : 'نعم، احذف الامتحان' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
