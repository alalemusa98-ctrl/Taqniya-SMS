<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
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
  Loader2,
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
import { useToast } from '../composables/useToast';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../components/ui/TaqniyaDrawer.vue';
import AcademicDetailHeroCard from '../components/ui/AcademicDetailHeroCard.vue';
import OfficialExamDrawerForm from '../components/official-exams/OfficialExamDrawerForm.vue';
import OfficialExamDetailDrawer from '../components/official-exams/OfficialExamDetailDrawer.vue';

const authStore = useAuthStore();
const toast = useToast();
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
const allClassSubjects = ref<any[]>([]);
const allClassAcademicTerms = ref<any[]>([]);

// Filter States
const selectedClassId = ref<number | null>(null);
const selectedYearId = ref<number>(0);
const selectedTermId = ref<number>(0);
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

// Lifecycle / Initialization Guard
const isInitialized = ref(false);

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

function getErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  if (typeof msg === 'string' && msg.trim() && msg !== 'Internal server error') {
    return msg;
  }
  return fallback;
}

// Options
const yearOptions = computed<TaqniyaSelectOption[]>(() =>
  academicYears.value.map((y: AcademicYearItem) => ({
    value: y.id,
    label: y.name,
    subtext: y.is_active ? 'العام الحالي' : undefined,
  })),
);

const termOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedClassId.value) {
    return [
      { value: '', label: 'كافة الفصول الدراسية' },
      ...academicTerms.value.map((t: AcademicTermItem) => ({
        value: t.id,
        label: t.name,
        subtext: `فصل رقم ${t.term_number}`,
      })),
    ];
  }
  const classId = Number(selectedClassId.value);
  const termsList = Array.isArray(allClassAcademicTerms.value)
    ? allClassAcademicTerms.value
    : (allClassAcademicTerms.value as any)?.classes || [];
  const classGroup = termsList.find((g: any) => Number(g.class_id) === classId);
  if (classGroup && classGroup.terms && classGroup.terms.length > 0) {
    return [
      { value: '', label: 'كافة الفصول للصف المختار' },
      ...classGroup.terms.map((t: any) => ({
        value: t.academic_term_id,
        label: t.term_name || `الفصل الدراسي ${t.academic_term_id}`,
        subtext: Number(t.is_active) === 1 || t.is_active === true ? 'الفصل النشط حالياً' : undefined,
      })),
    ];
  }
  return [
    { value: '', label: 'كافة الفصول الدراسية' },
    ...academicTerms.value.map((t: AcademicTermItem) => ({
      value: t.id,
      label: t.name,
      subtext: `فصل رقم ${t.term_number}`,
    })),
  ];
});

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

// KPI Computations from hierarchicalClasses (SSoT)
const kpiStats = computed(() => {
  let midtermCount = 0;
  let finalCount = 0;
  let secondRoundCount = 0;
  let totalSubjectsCount = 0;

  hierarchicalClasses.value.forEach((cls) => {
    cls.exam_types?.forEach((et: any) => {
      const count = et.total_subjects ?? et.subjects?.length ?? et.exams?.length ?? 0;
      totalSubjectsCount += count;
      if (et.exam_type === 'midterm') midtermCount += count;
      else if (et.exam_type === 'final') finalCount += count;
      else if (et.exam_type === 'second_round') secondRoundCount += count;
    });
  });

  return {
    total: totalRecords.value || totalSubjectsCount,
    midterm: midtermCount,
    final: finalCount,
    second_round: secondRoundCount,
  };
});

// Flat array derived strictly from hierarchicalClasses
const flatExamRows = computed(() => {
  const rows: any[] = [];
  hierarchicalClasses.value.forEach((cls) => {
    cls.exam_types?.forEach((et: any) => {
      const subjectList = et.subjects || et.exams || [];
      subjectList.forEach((sub: any) => {
        rows.push({
          id: sub.id,
          class_id: cls.class_id,
          class_name: cls.class_name,
          grade_level: cls.grade_level,
          exam_type: et.exam_type,
          exam_type_ar: et.exam_type_ar,
          subject_id: sub.subject_id,
          subject_name: sub.subject_name,
          exam_date: sub.exam_date,
          attachments_count: sub.attachments_count || 0,
          created_at: sub.created_at,
        });
      });
    });
  });
  return rows;
});

async function loadInitialContext() {
  try {
    const [yearsRes, termsRes, classesRes, subjectsRes, classSubjectsRes, classTermsRes] = await Promise.all([
      academicApi.getYears({ per_page: 100 }),
      academicApi.getTerms(),
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getSubjects({ per_page: 100 }),
      academicApi.getClassSubjects({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClassAcademicTerms({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
    ]);

    academicYears.value = yearsRes.data.data?.years || yearsRes.data.data || [];
    academicTerms.value = termsRes.data.data?.terms || termsRes.data.data || [];
    classes.value = classesRes.data.data?.classes || classesRes.data.data || [];
    subjects.value = subjectsRes.data.data?.subjects || subjectsRes.data.data || [];
    allClassSubjects.value = classSubjectsRes.data.data?.classes || classSubjectsRes.data.data || [];
    allClassAcademicTerms.value = classTermsRes.data.data?.classes || classTermsRes.data.data || [];

    const activeYear = academicYears.value.find((y: AcademicYearItem) => y.is_active) || academicYears.value[0];
    if (activeYear) selectedYearId.value = activeYear.id;

    selectedClassId.value = '';
    selectedTermId.value = '';
  } catch (err) {
    console.error('Failed to load academic context:', err);
  } finally {
    isInitialized.value = true;
  }
}

async function fetchOfficialExams() {
  if (!isInitialized.value) return;
  loading.value = true;
  try {
    if (isStudentOrParent.value && selectedClassId.value) {
      // Student/Parent fetch
      const res = await officialExamsApi.getByClass(Number(selectedClassId.value), selectedTermId.value || undefined);
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
      totalRecords.value = res.data.meta?.total || 0;

      // Also if class board tab is active, fetch class board defensively
      if (selectedClassId.value) {
        try {
          const boardRes = await officialExamsApi.getByClass(Number(selectedClassId.value), selectedTermId.value || undefined);
          classBoardData.value = boardRes.data.data;
        } catch (boardErr) {
          console.warn('Could not fetch auxiliary class board data:', boardErr);
        }
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch official exams:', err);
    toast.error(getErrorMessage(err, 'تعذر جلب جدول الامتحانات الرسمية.'));
  } finally {
    loading.value = false;
  }
}

// Watch when Class Filter changes to automatically select Active Year & Active Term for that class
watch(selectedClassId, (newClassId) => {
  if (!isInitialized.value) return;
  if (newClassId) {
    const classIdNum = Number(newClassId);
    const classTermsList = Array.isArray(allClassAcademicTerms.value)
      ? allClassAcademicTerms.value
      : (allClassAcademicTerms.value as any)?.classes || [];

    const classGroup = classTermsList.find((g: any) => Number(g.class_id) === classIdNum);
    if (classGroup && classGroup.terms && classGroup.terms.length > 0) {
      const activeTerm = classGroup.terms.find((t: any) => Number(t.is_active) === 1 || t.is_active === true);
      if (activeTerm && activeTerm.academic_term_id) {
        selectedTermId.value = Number(activeTerm.academic_term_id);
      }
    }

    // Auto set active academic year
    const activeYear = academicYears.value.find((y: AcademicYearItem) => y.is_active) || academicYears.value[0];
    if (activeYear) selectedYearId.value = activeYear.id;
  } else {
    selectedTermId.value = '';
  }
});

watch(
  [selectedYearId, selectedTermId, selectedClassId, selectedExamType, selectedExamDate, currentPage],
  () => {
    if (isInitialized.value) {
      fetchOfficialExams();
    }
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
  if (classes.value.length > 0) {
    selectedClassId.value = classes.value[0].id;
  } else {
    selectedClassId.value = null;
  }
  const activeYear = academicYears.value.find((y: AcademicYearItem) => y.is_active) || academicYears.value[0];
  if (activeYear) selectedYearId.value = activeYear.id;
  currentPage.value = 1;
  fetchOfficialExams();
}

function openCreateDrawer() {
  drawerMode.value = 'create';
  itemToEdit.value = null;
  isDrawerOpen.value = true;
}

async function openEditDrawer(exam: any) {
  drawerMode.value = 'edit';
  try {
    const res = await officialExamsApi.getById(exam.id);
    itemToEdit.value = res.data.data;
  } catch {
    itemToEdit.value = exam;
  }
  isDrawerOpen.value = true;
}

async function openDetailsDrawer(exam: any) {
  try {
    const res = await officialExamsApi.getById(exam.id);
    selectedExamDetails.value = res.data.data;
  } catch {
    selectedExamDetails.value = exam;
  }
  isDetailsDrawerOpen.value = true;
}

function handleEditFromDetails(exam: any) {
  isDetailsDrawerOpen.value = false;
  openEditDrawer(exam);
}

function openDeleteModal(exam: any) {
  itemToDelete.value = exam;
  isDeleteModalOpen.value = true;
}

async function handleFormSubmit(payload: any) {
  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      await officialExamsApi.create(payload);
      toast.success('تمت جدولة الامتحان الرسمي بنجاح.');
    } else if (itemToEdit.value) {
      await officialExamsApi.update(itemToEdit.value.id, payload);
      toast.success('تم تحديث موعد الامتحان الرسمي بنجاح.');
    }
    isDrawerOpen.value = false;
    fetchOfficialExams();
  } catch (err: any) {
    toast.error(getErrorMessage(err, 'تعذر حفظ موعد الامتحان.'));
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmDelete() {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    await officialExamsApi.delete(itemToDelete.value.id);
    toast.success('تم إلغاء وحذف موعد الامتحان بنجاح.');
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
    fetchOfficialExams();
  } catch (err: any) {
    toast.error(getErrorMessage(err, 'تعذر حذف موعد الامتحان.'));
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
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer"
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

        <!-- 2. KPI Metrics Cards (Exact Taqniya Spatial Theme with Icons and Variant styling) -->
        <div v-if="isAdmin" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <TaqniyaKpiCard
            title="إجمالي الامتحانات المسجلة"
            :value="`${kpiStats.total} امتحان`"
            subtitle="سجل رسمي مثبت"
            :icon="Calendar"
            variant="primary"
            badge-text="التراكمي"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
          />
          <TaqniyaKpiCard
            title="امتحانات نصفية (Midterm)"
            :value="`${kpiStats.midterm} نصفي`"
            subtitle="منتصف الفصل الدراسي"
            :icon="Clock"
            variant="blue"
            badge-text="النصفية"
          />
          <TaqniyaKpiCard
            title="امتحانات نهائية (Final)"
            :value="`${kpiStats.final} نهائي`"
            subtitle="نهاية الفصل الدراسي"
            :icon="GraduationCap"
            variant="rose"
            badge-text="النهائية"
          />
          <TaqniyaKpiCard
            title="امتحانات الدور الثاني"
            :value="`${kpiStats.second_round} دور ثانٍ`"
            subtitle="الإعادة والتكميلي"
            :icon="Sparkles"
            variant="amber"
            badge-text="التكميلي"
          />
        </div>

        <!-- 3. Admin View Switcher Tabs -->
        <div v-if="isAdmin" class="flex items-center gap-2 p-1 rounded-full bg-purple-500/5 dark:bg-white/[0.03] border border-[#B4AED8]/40 dark:border-white/[0.06] w-fit print:hidden">
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            :class="activeViewTab === 'matrix' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title'"
            @click="activeViewTab = 'matrix'"
          >
            <Layers class="w-3.5 h-3.5" />
            <span>مصفوفة إدارة الامتحانات المدرسية</span>
          </button>

          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            :class="activeViewTab === 'class_board' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title'"
            @click="activeViewTab = 'class_board'"
          >
            <School class="w-3.5 h-3.5" />
            <span>روزنامة جدول الصف للطباعة</span>
          </button>
        </div>

        <!-- 4. Filter Bar (Class First, followed by auto-assigned active Year & Term) -->
        <div v-if="isAdmin" class="p-4 sm:p-5 rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-xs space-y-4 print:hidden">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <!-- 1. Class Filter (First) -->
            <div>
              <label class="block text-[11px] font-bold text-bx-title mb-1 flex items-center gap-1.5">
                <School class="w-3.5 h-3.5 text-bx-primary" />
                <span>الصف الدراسي:</span>
              </label>
              <TaqniyaSelect
                v-model="selectedClassId"
                :options="classOptions"
                placeholder="اختر الصف الدراسي..."
                searchable
                full-width
              />
            </div>

            <!-- 2. Year Filter (Auto-Determined) -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                <span>العام الدراسي:</span>
              </label>
              <TaqniyaSelect
                v-model="selectedYearId"
                :options="yearOptions"
                placeholder="اختر العام الدراسي"
                full-width
              />
            </div>

            <!-- 3. Term Filter (Auto-Assigned from Class Active Term) -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-bx-primary" />
                <span>الفصل الدراسي:</span>
              </label>
              <TaqniyaSelect
                v-model="selectedTermId"
                :options="termOptions"
                placeholder="اختر الفصل الدراسي"
                full-width
              />
            </div>

            <!-- 4. Exam Type Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <Layers class="w-3.5 h-3.5 text-bx-primary" />
                <span>نوع الامتحان:</span>
              </label>
              <TaqniyaSelect
                v-model="selectedExamType"
                :options="examTypeFilterOptions"
                placeholder="كافة أنواع الامتحانات"
                full-width
              />
            </div>

            <!-- 5. Exam Date Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                <span>تاريخ الامتحان:</span>
              </label>
              <input
                v-model="selectedExamDate"
                type="date"
                class="w-full px-3 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title outline-none focus:border-bx-primary transition"
              />
            </div>
          </div>

          <!-- Filter Summary & Reset Action -->
          <div class="flex items-center justify-between gap-3 pt-2 border-t border-[#B4AED8]/40 dark:border-white/[0.06]">
            <span class="text-xs font-bold text-bx-muted flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>تصفية الامتحانات المعتمدة وفق الصف المختار وفترته النشطة تلقائياً</span>
            </span>

            <button
              type="button"
              @click="resetFilters"
              class="px-4 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-title hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw class="w-3.5 h-3.5 text-bx-primary" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          </div>
        </div>

        <!-- Main Content Area -->

        <!-- View 1: Admin Unified Data Table View -->
        <div v-if="isAdmin && activeViewTab === 'matrix'" class="space-y-4">
          <!-- Loading State -->
          <div v-if="loading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
            <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
            <span class="text-xs font-bold">جاري تحميل جدول الامتحانات الرسمية المعتمد...</span>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="flatExamRows.length === 0"
            class="text-center py-16 px-4 rounded-3xl bg-purple-500/[0.02] border border-dashed border-[#B4AED8] dark:border-white/10"
          >
            <Calendar class="w-12 h-12 mx-auto text-bx-primary/40 mb-3" />
            <h3 class="text-base font-bold text-bx-title">لا توجد امتحانات رسمية مجدولة</h3>
            <p class="text-xs text-bx-muted mt-1 max-w-sm mx-auto">
              لم يتم العثور على أي موعد امتحان رسمي يطابق محددات البحث والفلاتر الحالية. يمكنك البدء بجدولة امتحان جديد.
            </p>
            <button
              type="button"
              @click="openCreateDrawer"
              class="mt-4 px-5 py-2 rounded-full bg-bx-primary hover:bg-bx-primary-hover text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              + جدولة امتحان جديد
            </button>
          </div>

          <!-- Unified Datatable Content: Enclosed in a Bordered Card -->
          <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-start border-collapse text-xs font-sans">
                <!-- Table Header with Distinct Background and Crisp Dividers -->
                <thead>
                  <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8]/60 dark:border-white/15 text-bx-muted">
                    <th class="py-3.5 px-4 font-bold text-start w-12 font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">#</th>
                    
                    <!-- 1. Subject & Exam Type -->
                    <th class="py-3.5 px-4 font-bold text-start min-w-[200px] border-e border-[#B4AED8]/50 dark:border-white/10">
                      <div class="flex items-center gap-1.5">
                        <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                        <span>المادة المقررة ونوع الامتحان</span>
                      </div>
                    </th>

                    <!-- 2. Target Class -->
                    <th class="py-3.5 px-4 font-bold text-start min-w-[150px] border-e border-[#B4AED8]/50 dark:border-white/10">
                      <div class="flex items-center gap-1.5">
                        <School class="w-3.5 h-3.5 text-bx-primary" />
                        <span>الصف الدراسي المستهدف</span>
                      </div>
                    </th>

                    <!-- 3. Exam Date & Day -->
                    <th class="py-3.5 px-4 font-bold text-start min-w-[170px] border-e border-[#B4AED8]/50 dark:border-white/10">
                      <div class="flex items-center gap-1.5">
                        <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                        <span>تاريخ الامتحان</span>
                      </div>
                    </th>

                    <!-- 4. Attachments Count Badge -->
                    <th class="py-3.5 px-4 font-bold text-center w-28 border-e border-[#B4AED8]/50 dark:border-white/10">
                      <div class="flex items-center justify-center gap-1.5">
                        <Paperclip class="w-3.5 h-3.5 text-bx-primary" />
                        <span>المرفقات</span>
                      </div>
                    </th>

                    <!-- 5. Actions Toolbar -->
                    <th class="py-3.5 px-4 font-bold text-center w-36 last:border-e-0">الإجراءات</th>
                  </tr>
                </thead>

                <!-- Table Body with Crisp Dividers -->
                <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10">
                  <tr
                    v-for="(row, idx) in flatExamRows"
                    :key="row.id"
                    class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                  >
                    <!-- Sequence Counter # -->
                    <td class="py-3.5 px-4 font-bold text-bx-muted text-xs whitespace-nowrap font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">
                      {{ (currentPage - 1) * perPage + idx + 1 }}
                    </td>

                    <!-- 1. Subject & Exam Type -->
                    <td class="py-3.5 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                      <div class="space-y-1">
                        <span
                          class="font-black text-xs sm:text-sm text-bx-title block leading-snug group-hover:text-bx-primary transition-colors cursor-pointer"
                          @click="openDetailsDrawer(row)"
                        >
                          {{ row.subject_name }}
                        </span>
                        <span
                          class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs"
                          :class="getExamTypeBadge(row.exam_type).class"
                        >
                          {{ row.exam_type_ar }}
                        </span>
                      </div>
                    </td>

                    <!-- 2. Target Class -->
                    <td class="py-3.5 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                      <div class="font-bold text-xs text-bx-title">
                        <span>{{ row.class_name }}</span>
                        <span v-if="row.grade_level" class="text-bx-muted mx-1 text-[11px] block font-normal">المستوى: {{ row.grade_level }}</span>
                      </div>
                    </td>

                    <!-- 3. Exam Date & Day -->
                    <td class="py-3.5 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                      <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-bx-title">
                        <Calendar class="w-3.5 h-3.5 text-bx-primary shrink-0" />
                        <span>{{ row.exam_date }}</span>
                      </div>
                    </td>

                    <!-- 4. Attachments Count Badge -->
                    <td class="py-3.5 px-4 text-center whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                      <span
                        v-if="row.attachments_count && row.attachments_count > 0"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs"
                      >
                        <Paperclip class="w-3.5 h-3.5" />
                        <span>{{ row.attachments_count }} ملفات</span>
                      </span>
                      <span v-else class="text-bx-muted text-xs font-medium">بدون مرفقات</span>
                    </td>

                    <!-- 5. Action Buttons Toolbar -->
                    <td class="py-3.5 px-4 text-center whitespace-nowrap last:border-e-0">
                      <div class="flex items-center justify-center gap-1.5">
                        <!-- View Details Button (Fetches full record with notes & attachments) -->
                        <button
                          type="button"
                          @click="openDetailsDrawer(row)"
                          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
                          title="معاينة التفاصيل الكاملة والمرفقات والقاعة"
                        >
                          <Eye class="w-3.5 h-3.5" />
                        </button>

                        <!-- Edit Button -->
                        <button
                          type="button"
                          @click="openEditDrawer(row)"
                          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
                          title="تعديل موعد وبيانات الامتحان"
                        >
                          <Pen class="w-3.5 h-3.5" />
                        </button>

                        <!-- Delete Button -->
                        <button
                          type="button"
                          @click="openDeleteModal(row)"
                          class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-rose-500 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="إلغاء وحذف موعد الامتحان"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination Footer -->
          <div
            v-if="totalRecords > 0 && Math.ceil(totalRecords / perPage) > 1"
            class="flex items-center justify-between pt-4 border-t border-[#B4AED8]/60 dark:border-white/10 text-xs"
          >
            <span class="text-bx-muted font-bold">
              عرض الصفحة {{ currentPage }} من {{ Math.ceil(totalRecords / perPage) }} (إجمالي {{ totalRecords }} موعد امتحان)
            </span>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                :disabled="currentPage <= 1"
                @click="currentPage--; fetchOfficialExams()"
                class="px-4 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-title disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                السابق
              </button>
              <button
                type="button"
                :disabled="currentPage >= Math.ceil(totalRecords / perPage)"
                @click="currentPage++; fetchOfficialExams()"
                class="px-4 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-title disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                التالي
              </button>
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
      <OfficialExamDetailDrawer
        v-model="isDetailsDrawerOpen"
        :exam="selectedExamDetails"
        :can-edit="isAdmin"
        @edit="handleEditFromDetails"
      />

      <!-- Create / Edit Drawer Form (Admin) -->
      <OfficialExamDrawerForm
        v-model="isDrawerOpen"
        :mode="drawerMode"
        :item-to-edit="itemToEdit"
        :academic-years="academicYears"
        :academic-terms="academicTerms"
        :classes="classes"
        :subjects="subjects"
        :class-subjects="allClassSubjects"
        :class-academic-terms="allClassAcademicTerms"
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
