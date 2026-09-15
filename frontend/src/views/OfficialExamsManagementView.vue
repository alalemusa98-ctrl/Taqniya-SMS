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
  <div class="space-y-6 animate-fade-in print:p-0 print:m-0">
    <!-- Toast Message -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 left-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium transition-all duration-300 animate-slide-up"
      :class="toastMessage.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-rose-600/20'"
    >
      <CheckCircle2 v-if="toastMessage.type === 'success'" class="w-5 h-5" />
      <AlertCircle v-else class="w-5 h-5" />
      <span>{{ toastMessage.text }}</span>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Calendar class="w-7 h-7 text-brand-500" />
          <span>جدول الامتحانات الرسمية</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          إدارة وجدولة ونشر مواعيد الامتحانات النصفية والنهائية والدور الثاني ومرفقاتها المعتمدة
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Print Button for Student / Parent or Admin in Board View -->
        <button
          v-if="isStudentOrParent || activeViewTab === 'class_board'"
          type="button"
          @click="printTimetable"
          class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold transition flex items-center gap-2 shadow-xs"
        >
          <Printer class="w-4 h-4" />
          <span>طباعة الجدول المعتمد</span>
        </button>

        <!-- New Exam Button (Admin only) -->
        <button
          v-if="isAdmin"
          type="button"
          @click="openCreateDrawer"
          class="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          <span>جدولة امتحان رسمي جديد</span>
        </button>
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
    <div v-if="isAdmin" class="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-fit print:hidden border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2"
        :class="activeViewTab === 'matrix' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
        @click="activeViewTab = 'matrix'"
      >
        <Layers class="w-4 h-4" />
        <span>مصفوفة إدارة الامتحانات المدرسية</span>
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2"
        :class="activeViewTab === 'class_board' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
        @click="activeViewTab = 'class_board'"
      >
        <School class="w-4 h-4" />
        <span>روزنامة جدول الصف للطباعة</span>
      </button>
    </div>

    <!-- Filter Bar (Admin) -->
    <div v-if="isAdmin" class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4 print:hidden">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <!-- Year -->
        <TaqniyaSelect
          v-model="selectedYearId"
          :options="yearOptions"
          placeholder="اختر العام الدراسي"
        />

        <!-- Term -->
        <TaqniyaSelect
          v-model="selectedTermId"
          :options="termOptions"
          placeholder="اختر الفصل الدراسي"
        />

        <!-- Class Filter -->
        <TaqniyaSelect
          v-model="selectedClassId"
          :options="classOptions"
          placeholder="تصفية بالصف الدراسي"
        />

        <!-- Exam Type Filter -->
        <TaqniyaSelect
          v-model="selectedExamType"
          :options="examTypeFilterOptions"
          placeholder="تصفية بنوع الامتحان"
        />

        <!-- Exam Date -->
        <div>
          <input
            v-model="selectedExamDate"
            type="date"
            class="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>
      </div>

      <!-- Search & Reset -->
      <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <div class="relative flex-1 max-w-md">
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="بحث باسم المادة أو التعليمات والقاعات..."
            @input="handleSearch"
            class="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
        </div>

        <button
          type="button"
          @click="resetFilters"
          class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition flex items-center gap-1.5"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>إعادة ضبط</span>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->

    <!-- View 1: Admin Hierarchical Matrix View -->
    <div v-if="isAdmin && activeViewTab === 'matrix'" class="space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="i in 4" :key="i" class="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="hierarchicalClasses.length === 0"
        class="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800"
      >
        <Calendar class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">لا توجد امتحانات رسمية مجدولة</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          لم يتم العثور على أي موعد امتحان يطابق محددات البحث الحالية. يمكنك البدء بجدولة أول امتحان.
        </p>
        <button
          type="button"
          @click="openCreateDrawer"
          class="mt-4 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition"
        >
          + جدولة امتحان جديد
        </button>
      </div>

      <!-- Classes Groups Matrix -->
      <div v-else class="space-y-6">
        <div
          v-for="classGroup in hierarchicalClasses"
          :key="classGroup.class_id"
          class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4"
        >
          <!-- Class Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                <School class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">
                  {{ classGroup.class_name }}
                </h2>
                <p class="text-xs text-slate-400 dark:text-slate-500">
                  المستوى الأكاديمي: {{ classGroup.grade_level }}
                </p>
              </div>
            </div>

            <span class="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
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
                  class="text-xs px-2.5 py-1 rounded-lg border font-semibold"
                  :class="getExamTypeBadge(typeGroup.exam_type).class"
                >
                  {{ typeGroup.exam_type_ar }}
                </span>
                <span class="text-xs text-slate-400 font-normal">({{ typeGroup.count }} مواد)</span>
              </div>

              <!-- Exams Table / Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  v-for="exam in typeGroup.exams"
                  :key="exam.id"
                  class="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-brand-500/40 transition flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div class="flex items-start justify-between gap-2">
                      <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BookOpen class="w-4 h-4 text-brand-500 shrink-0" />
                        <span>{{ exam.subject_name }}</span>
                      </h4>

                      <span
                        v-if="exam.attachments_count && exam.attachments_count > 0"
                        class="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0"
                      >
                        <Paperclip class="w-3 h-3" />
                        <span>{{ exam.attachments_count }}</span>
                      </span>
                    </div>

                    <div class="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <p class="flex items-center gap-2 font-medium">
                        <Calendar class="w-3.5 h-3.5 text-slate-400" />
                        <span>{{ exam.exam_day_name }} — {{ exam.exam_date }}</span>
                      </p>
                      <p v-if="exam.notes" class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {{ exam.notes }}
                      </p>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center justify-between pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      @click="openDetailsDrawer(exam)"
                      class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      <span>المعاينة والمرفقات</span>
                    </button>

                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        @click="openEditDrawer(exam)"
                        class="w-7 h-7 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 flex items-center justify-center transition"
                        title="تعديل الموعد"
                      >
                        <Pen class="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        @click="openDeleteModal(exam)"
                        class="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition"
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
      <div v-if="!classBoardData && !loading" class="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <School class="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">يرجى اختيار صف دراسي لعرض الروزنامة المعتمدة</p>
      </div>

      <div
        v-else-if="classBoardData"
        class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0"
      >
        <!-- Printable Board Header -->
        <div class="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-lg">
            <School class="w-6 h-6" />
            <span>نظام إدارة المدارس الذكي — جدول الامتحانات الرسمية المعتمد</span>
          </div>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-200">
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
              class="text-sm px-3 py-1 rounded-lg border font-bold"
              :class="getExamTypeBadge(group.exam_type).class"
            >
              {{ group.exam_type_ar }}
            </span>
          </div>

          <!-- Printable Table -->
          <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table class="w-full text-right text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="p-3 w-12 text-center">#</th>
                  <th class="p-3">اليوم والتاريخ</th>
                  <th class="p-3">المادة الدراسية</th>
                  <th class="p-3">القاعة والتعليمات الإرشادية</th>
                  <th class="p-3 w-32 text-center print:hidden">المرفقات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                <tr
                  v-for="(exam, idx) in group.exams"
                  :key="exam.id"
                  class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                >
                  <td class="p-3 text-center font-bold text-slate-400">{{ idx + 1 }}</td>
                  <td class="p-3 font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                    {{ exam.exam_day_name }} — {{ exam.exam_date }}
                  </td>
                  <td class="p-3 font-bold text-slate-900 dark:text-slate-100">
                    {{ exam.subject_name }}
                  </td>
                  <td class="p-3 text-slate-600 dark:text-slate-400">
                    {{ exam.notes || '—' }}
                  </td>
                  <td class="p-3 text-center print:hidden">
                    <button
                      v-if="exam.attachments && exam.attachments.length > 0"
                      type="button"
                      @click="openDetailsDrawer(exam)"
                      class="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Paperclip class="w-3.5 h-3.5" />
                      <span>{{ exam.attachments.length }} مرفق</span>
                    </button>
                    <span v-else class="text-slate-400 text-xs">—</span>
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
      <div v-if="teacherExams.length === 0 && !loading" class="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <BookOpen class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">لا توجد امتحانات مسندة إليك حالياً</h3>
        <p class="text-xs text-slate-500 mt-1">تظهر هنا مواعيد امتحانات المواد والصفوف المسندة إلى بروفايلك الأكاديمي.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="exam in teacherExams"
          :key="exam.id"
          class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <span
                class="text-[10px] px-2 py-0.5 rounded-md border font-bold"
                :class="getExamTypeBadge(exam.exam_type).class"
              >
                {{ exam.exam_type_ar }}
              </span>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                {{ exam.subject_name }}
              </h3>
              <p class="text-xs text-slate-500">{{ exam.class_name }}</p>
            </div>

            <button
              type="button"
              @click="openDetailsDrawer(exam)"
              class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition"
              title="عرض التفاصيل والمرفقات"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <p class="flex items-center gap-2">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ exam.exam_day_name }} — {{ exam.exam_date }}</span>
            </p>
            <p v-if="exam.notes" class="text-xs text-slate-500">
              القاعة / التعليمات: {{ exam.notes }}
            </p>
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
      <div v-if="selectedExamDetails" class="space-y-6">
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
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-500">نوع الامتحان:</span>
            <span
              class="px-2.5 py-0.5 rounded-lg border font-bold"
              :class="getExamTypeBadge(selectedExamDetails.exam_type).class"
            >
              {{ selectedExamDetails.exam_type_ar }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-slate-500">يوم وتاريخ الامتحان:</span>
            <span class="font-bold text-slate-900 dark:text-slate-100">
              {{ selectedExamDetails.exam_day_name }} — {{ selectedExamDetails.exam_date }}
            </span>
          </div>

          <div v-if="selectedExamDetails.notes" class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span class="text-slate-500 block mb-1">التعليمات والإرشادات:</span>
            <p class="text-slate-800 dark:text-slate-200 font-medium">
              {{ selectedExamDetails.notes }}
            </p>
          </div>
        </div>

        <!-- Attachments Section with 48x48 icon style -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Paperclip class="w-4 h-4 text-brand-500" />
              <span>المرفقات وجداول المواصفات</span>
            </h4>
            <span class="text-xs text-slate-400">
              {{ selectedExamDetails.attachments?.length || 0 }} ملف
            </span>
          </div>

          <div
            v-if="!selectedExamDetails.attachments || selectedExamDetails.attachments.length === 0"
            class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/20 text-center text-xs text-slate-400"
          >
            لا توجد ملفات مرفقة بهذا الامتحان.
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="(att, idx) in selectedExamDetails.attachments"
              :key="idx"
              class="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 hover:border-brand-500/30 transition group"
            >
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <component :is="getFileIcon(att.file_type)" class="w-6 h-6" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {{ att.file_name }}
                  </p>
                  <p class="text-[11px] text-slate-400 mt-0.5">
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
                  class="w-9 h-9 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-brand-600 hover:border-brand-500 flex items-center justify-center transition shadow-xs"
                  title="تحميل الملف"
                >
                  <Download class="w-4 h-4" />
                </a>

                <a
                  :href="att.file_url"
                  target="_blank"
                  class="w-9 h-9 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-brand-600 hover:border-brand-500 flex items-center justify-center transition shadow-xs"
                  title="فتح الرابط"
                >
                  <ExternalLink class="w-4 h-4" />
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
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div class="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
          <Trash2 class="w-6 h-6" />
        </div>

        <div class="text-center space-y-1">
          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
            تأكيد إلغاء وحذف موعد الامتحان
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            هل أنت متأكد من رغبتك في شطب موعد امتحان
            <span class="font-bold text-slate-800 dark:text-slate-200">{{ itemToDelete?.subject_name }}</span>
            للصف {{ itemToDelete?.class_name }}؟ سيتم استبعاد السجل من الجداول المعتمدة.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="isDeleteModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            :disabled="isDeleting"
            @click="confirmDelete"
            class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition disabled:opacity-50"
          >
            {{ isDeleting ? 'جاري الحذف...' : 'نعم، احذف الامتحان' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
