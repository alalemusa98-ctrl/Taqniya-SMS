<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue';
import {
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  Pen,
  Trash2,
  Paperclip,
  Printer,
  School,
  BookOpen,
  Layers,
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
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';
import TaqniyaModal from '../components/ui/TaqniyaModal.vue';

// Lazy-load heavier slide-over drawer components (satisfies component_lazy_loading: required)
const OfficialExamDrawerForm = defineAsyncComponent(() => import('../components/official-exams/OfficialExamDrawerForm.vue'));
const OfficialExamDetailDrawer = defineAsyncComponent(() => import('../components/official-exams/OfficialExamDetailDrawer.vue'));

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

// Active Year State (Managed internally, displayed in hero header)
const selectedYearId = ref<number>(0);

// Draft Filter States
const selectedClassFilter = ref<number | string>('all');
const selectedTermFilter = ref<number | string>('all');
const selectedSubjectFilter = ref<number | string>('all');
const selectedExamType = ref<string>('all');
const selectedStatusFilter = ref<'all' | 'upcoming' | 'completed'>('all');
const selectedExamDate = ref<string>('');
const searchKeyword = ref<string>('');

// Applied Filter States
const appliedClassFilter = ref<number | string>('all');
const appliedTermFilter = ref<number | string>('all');
const appliedSubjectFilter = ref<number | string>('all');
const appliedExamType = ref<string>('all');
const appliedStatusFilter = ref<'all' | 'upcoming' | 'completed'>('all');
const appliedExamDate = ref<string>('');
const appliedSearchKeyword = ref<string>('');

const currentPage = ref<number>(1);
const perPage = ref<number>(15);
const totalRecords = ref<number>(0);

// Data States
const loading = ref<boolean>(false);
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

// Active Academic Year object
const activeAcademicYear = computed(() => {
  return academicYears.value.find((y) => y.id === selectedYearId.value) || academicYears.value[0];
});

// Table Columns Configuration for TaqniyaTable
const tableColumns: TableColumn[] = [
  { key: 'index', label: '#', width: '50px', align: 'center' },
  { key: 'subject_exam', label: 'المادة المقررة ونوع الامتحان' },
  { key: 'class', label: 'الصف الدراسي المستهدف' },
  { key: 'exam_date', label: 'تاريخ الامتحان' },
  { key: 'attachments', label: 'المرفقات', width: '120px', align: 'center' },
  { key: 'status', label: 'الحالة', width: '140px', align: 'center' },
  { key: 'actions', label: 'الإجراءات', width: '140px', align: 'center' },
];

// AbortController for Request Cancellation & Debounce
let activeAbortController: AbortController | null = null;
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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

// Active Academic Term computed
const selectedTermId = computed<number | null>(() => {
  if (selectedTermFilter.value && selectedTermFilter.value !== 'all') {
    return Number(selectedTermFilter.value);
  }
  const activeTerm = academicTerms.value.find((t: any) => Number(t.is_active) === 1 || t.is_active === true);
  return activeTerm?.id || academicTerms.value[0]?.id || null;
});

function getErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  if (typeof msg === 'string' && msg.trim() && msg !== 'Internal server error') {
    return msg;
  }
  return fallback;
}

// 1. Term Filter Options (Dynamic based on selected class with active indicators)
const termOptions = computed<TaqniyaSelectOption[]>(() => {
  if (selectedClassFilter.value === 'all') {
    return [
      { value: 'all', label: 'جميع الفصول الدراسية' },
      ...academicTerms.value.map((t: any) => {
        const isActive = Number(t.is_active) === 1 || t.is_active === true;
        return {
          value: t.id,
          label: isActive ? `${t.name} (نشط)` : t.name,
          subtext: isActive ? 'الفصل النشط حالياً' : `فصل رقم ${t.term_number}`,
        };
      }),
    ];
  }
  const classId = Number(selectedClassFilter.value);
  const termsList = Array.isArray(allClassAcademicTerms.value)
    ? allClassAcademicTerms.value
    : (allClassAcademicTerms.value as any)?.classes || [];
  const classGroup = termsList.find((g: any) => Number(g.class_id) === classId);
  if (classGroup && classGroup.terms && classGroup.terms.length > 0) {
    return [
      { value: 'all', label: 'كافة الفصول للصف المختار' },
      ...classGroup.terms.map((t: any) => {
        const isActive = Number(t.is_active) === 1 || t.is_active === true;
        const baseName = t.term_name || `الفصل الدراسي ${t.academic_term_id}`;
        return {
          value: t.academic_term_id,
          label: isActive ? `${baseName} (نشط)` : baseName,
          subtext: isActive ? 'الفصل النشط حالياً للصف' : undefined,
        };
      }),
    ];
  }
  return [
    { value: 'all', label: 'جميع الفصول الدراسية' },
    ...academicTerms.value.map((t: any) => {
      const isActive = Number(t.is_active) === 1 || t.is_active === true;
      return {
        value: t.id,
        label: isActive ? `${t.name} (نشط)` : t.name,
        subtext: isActive ? 'الفصل النشط حالياً' : `فصل رقم ${t.term_number}`,
      };
    }),
  ];
});

// 2. Class Filter Options
const classOptions = computed<TaqniyaSelectOption[]>(() => [
  { value: 'all', label: 'جميع الصفوف الدراسية' },
  ...classes.value.map((c: AcademicClassItem) => ({
    value: c.id,
    label: c.name,
    subtext: `المستوى: ${c.grade_level}`,
  })),
]);

// 3. Subject Filter Options (Cascading: Dynamic based on selected class)
const subjectOptions = computed<TaqniyaSelectOption[]>(() => {
  if (selectedClassFilter.value === 'all') {
    return [
      { value: 'all', label: 'جميع المواد التعليمية' },
      ...subjects.value.map((s: AcademicSubjectItem) => ({
        value: s.id,
        label: s.name,
        description: s.code ? `كود: ${s.code}` : undefined,
      })),
    ];
  }
  const classId = Number(selectedClassFilter.value);
  const classObj = allClassSubjects.value.find((c: any) => Number(c.class_id) === classId);
  const subs: any[] = [];
  if (classObj && classObj.terms) {
    classObj.terms.forEach((t: any) => {
      t.subjects?.forEach((s: any) => {
        if (!subs.some((existing) => existing.subject_id === s.subject_id)) {
          subs.push(s);
        }
      });
    });
  }
  if (subs.length > 0) {
    return [
      { value: 'all', label: 'كافة المواد للصف المختار' },
      ...subs.map((s) => ({
        value: s.subject_id,
        label: s.name,
        description: s.code ? `كود: ${s.code}` : undefined,
      })),
    ];
  }
  return [
    { value: 'all', label: 'جميع المواد التعليمية' },
    ...subjects.value.map((s: AcademicSubjectItem) => ({
      value: s.id,
      label: s.name,
      description: s.code ? `كود: ${s.code}` : undefined,
    })),
  ];
});

// 4. Exam Type Filter Options
const examTypeFilterOptions: TaqniyaSelectOption[] = [
  { value: 'all', label: 'كافة أنواع الامتحانات' },
  { value: 'midterm', label: 'امتحانات نصفية (Midterm)' },
  { value: 'final', label: 'امتحانات نهائية (Final)' },
  { value: 'second_round', label: 'امتحانات الدور الثاني (Second Round)' },
];

// 5. Status Filter Options
const statusOptions: TaqniyaSelectOption[] = [
  { value: 'all', label: 'كافة الحالات' },
  { value: 'upcoming', label: 'الامتحانات القادمة (السارية)' },
  { value: 'completed', label: 'الامتحانات السابقة (المنتهية)' },
];

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return (
    appliedSearchKeyword.value.trim() !== '' ||
    appliedClassFilter.value !== 'all' ||
    appliedTermFilter.value !== 'all' ||
    appliedSubjectFilter.value !== 'all' ||
    appliedExamType.value !== 'all' ||
    appliedStatusFilter.value !== 'all' ||
    appliedExamDate.value !== ''
  );
});

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

// Flat array with countdown and status derived strictly from hierarchicalClasses
export interface EnrichedOfficialExamRow {
  id: number;
  class_id: number;
  class_name: string;
  grade_level?: number;
  exam_type: 'midterm' | 'final' | 'second_round';
  exam_type_ar?: string;
  subject_id: number;
  subject_name: string;
  exam_date: string;
  status: 'upcoming' | 'completed';
  countdownInfo: { label: string; isUrgent: boolean; isPast: boolean } | null;
  attachments_count: number;
  created_at?: string;
  raw: any;
}

const flatExamRows = computed<EnrichedOfficialExamRow[]>(() => {
  const rows: EnrichedOfficialExamRow[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  hierarchicalClasses.value.forEach((cls) => {
    cls.exam_types?.forEach((et: any) => {
      const subjectList = et.subjects || et.exams || [];
      subjectList.forEach((sub: any) => {
        let cdInfo: { label: string; isUrgent: boolean; isPast: boolean } | null = null;
        if (sub.exam_date) {
          const eDate = new Date(sub.exam_date);
          eDate.setHours(0, 0, 0, 0);
          const diffTime = eDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            cdInfo = { label: `تم إجراؤه منذ ${Math.abs(diffDays)} يوم`, isUrgent: false, isPast: true };
          } else if (diffDays === 0) {
            cdInfo = { label: 'موعد الامتحان اليوم!', isUrgent: true, isPast: false };
          } else if (diffDays === 1) {
            cdInfo = { label: 'موعد الامتحان غداً', isUrgent: true, isPast: false };
          } else {
            cdInfo = { label: `متبقي ${diffDays} أيام`, isUrgent: false, isPast: false };
          }
        }

        const isUpcoming = sub.exam_date ? new Date(sub.exam_date).setHours(0, 0, 0, 0) >= today.getTime() : true;

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
          status: sub.status || (isUpcoming ? 'upcoming' : 'completed'),
          countdownInfo: cdInfo,
          attachments_count: sub.attachments_count || 0,
          created_at: sub.created_at,
          raw: sub,
        });
      });
    });
  });
  return rows;
});

// Printable Classes Boards dynamically derived from filtered hierarchicalClasses
const printableBoards = computed(() => {
  if (isStudentOrParent.value && classBoardData.value) {
    return [classBoardData.value];
  }

  return hierarchicalClasses.value.map((cls) => {
    const classTermsList = Array.isArray(allClassAcademicTerms.value)
      ? allClassAcademicTerms.value
      : (allClassAcademicTerms.value as any)?.classes || [];
    const classGroup = classTermsList.find((g: any) => Number(g.class_id) === cls.class_id);
    let termName = '';
    if (appliedTermFilter.value !== 'all') {
      const selectedTerm = academicTerms.value.find((t) => Number(t.id) === Number(appliedTermFilter.value));
      if (selectedTerm) termName = selectedTerm.name;
    } else if (classGroup && classGroup.terms && classGroup.terms.length > 0) {
      const activeT = classGroup.terms.find((t: any) => Number(t.is_active) === 1 || t.is_active === true) || classGroup.terms[0];
      if (activeT) termName = activeT.term_name || `الفصل الدراسي ${activeT.academic_term_id}`;
    }

    return {
      class_id: cls.class_id,
      class_name: cls.class_name,
      grade_level: cls.grade_level,
      academic_year_name: activeAcademicYear.value?.name || '2025/2026',
      academic_term_name: termName || (academicTerms.value[0]?.name ?? 'الفصل الدراسي الأول'),
      exam_types: cls.exam_types,
    };
  });
});

const printDateFormatted = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
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

    selectedClassFilter.value = 'all';
    appliedClassFilter.value = 'all';
    selectedTermFilter.value = 'all';
    appliedTermFilter.value = 'all';
  } catch (err) {
    console.error('Failed to load academic context:', err);
  } finally {
    isInitialized.value = true;
  }
}

async function fetchOfficialExams(page = 1) {
  if (!isInitialized.value) return;

  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  const requestConfig = { signal: activeAbortController.signal };

  currentPage.value = page;
  loading.value = true;
  try {
    if (isStudentOrParent.value && appliedClassFilter.value !== 'all') {
      // Student/Parent fetch
      const res = await officialExamsApi.getByClass(
        Number(appliedClassFilter.value),
        appliedTermFilter.value !== 'all' ? Number(appliedTermFilter.value) : undefined,
        requestConfig,
      );
      classBoardData.value = res.data.data;
    } else if (isTeacher.value) {
      // Teacher fetch using user ID
      const teacherId = authStore.user?.id || 1;
      const res = await officialExamsApi.getByTeacher(
        teacherId,
        appliedTermFilter.value !== 'all' ? Number(appliedTermFilter.value) : undefined,
        requestConfig,
      );
      teacherExams.value = res.data.data.exams;
    } else {
      // Admin / Manager fetch
      const params: any = {
        page: currentPage.value,
        per_page: perPage.value,
      };

      if (selectedYearId.value) params.academic_year_id = selectedYearId.value;
      if (appliedTermFilter.value !== 'all') params.academic_term_id = Number(appliedTermFilter.value);
      if (appliedClassFilter.value !== 'all') params.class_id = Number(appliedClassFilter.value);
      if (appliedSubjectFilter.value !== 'all') params.subject_id = Number(appliedSubjectFilter.value);
      if (appliedExamType.value !== 'all') params.exam_type = appliedExamType.value;
      if (appliedStatusFilter.value !== 'all') params.status = appliedStatusFilter.value;
      if (appliedExamDate.value) params.exam_date = appliedExamDate.value;
      if (appliedSearchKeyword.value.trim()) params.search = appliedSearchKeyword.value.trim();

      const res = await officialExamsApi.getAll(params, requestConfig);

      hierarchicalClasses.value = res.data.data.classes || [];
      totalRecords.value = res.data.meta?.total || 0;

      // Also if class board tab is active and specific class is selected, fetch class board defensively
      if (appliedClassFilter.value !== 'all') {
        try {
          const boardRes = await officialExamsApi.getByClass(
            Number(appliedClassFilter.value),
            appliedTermFilter.value !== 'all' ? Number(appliedTermFilter.value) : undefined,
            requestConfig,
          );
          classBoardData.value = boardRes.data.data;
        } catch (boardErr: any) {
          if (boardErr.name === 'CanceledError' || boardErr.name === 'AbortError' || boardErr.code === 'ERR_CANCELED') return;
          console.warn('Could not fetch auxiliary class board data:', boardErr);
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
      return; // Request was canceled by user action, ignore cleanly
    }
    console.error('Failed to fetch official exams:', err);
    toast.error(getErrorMessage(err, 'تعذر جلب جدول الامتحانات الرسمية.'));
  } finally {
    loading.value = false;
  }
}

// Automatic debounced search keyword watcher
watch(searchKeyword, (newVal) => {
  if (!isInitialized.value) return;
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  searchDebounceTimer = setTimeout(() => {
    appliedSearchKeyword.value = newVal.trim();
    fetchOfficialExams(1);
  }, 400);
});

// Watch when Class Filter changes to reset subject filter & auto-select active term for that class
watch(selectedClassFilter, (newClassVal) => {
  if (!isInitialized.value) return;
  selectedSubjectFilter.value = 'all';

  if (newClassVal && newClassVal !== 'all') {
    const classIdNum = Number(newClassVal);
    const classTermsList = Array.isArray(allClassAcademicTerms.value)
      ? allClassAcademicTerms.value
      : (allClassAcademicTerms.value as any)?.classes || [];

    const classGroup = classTermsList.find((g: any) => Number(g.class_id) === classIdNum);
    if (classGroup && classGroup.terms && classGroup.terms.length > 0) {
      const activeTerm = classGroup.terms.find((t: any) => Number(t.is_active) === 1 || t.is_active === true);
      if (activeTerm && activeTerm.academic_term_id) {
        selectedTermFilter.value = Number(activeTerm.academic_term_id);
      } else {
        selectedTermFilter.value = 'all';
      }
    } else {
      selectedTermFilter.value = 'all';
    }
  } else {
    selectedTermFilter.value = 'all';
  }
});

function applyFilters() {
  appliedSearchKeyword.value = searchKeyword.value;
  appliedClassFilter.value = selectedClassFilter.value;
  appliedTermFilter.value = selectedTermFilter.value;
  appliedSubjectFilter.value = selectedSubjectFilter.value;
  appliedExamType.value = selectedExamType.value;
  appliedStatusFilter.value = selectedStatusFilter.value;
  appliedExamDate.value = selectedExamDate.value;

  fetchOfficialExams(1);
}

function resetFilters() {
  searchKeyword.value = '';
  selectedClassFilter.value = 'all';
  selectedTermFilter.value = 'all';
  selectedSubjectFilter.value = 'all';
  selectedExamType.value = 'all';
  selectedStatusFilter.value = 'all';
  selectedExamDate.value = '';

  appliedSearchKeyword.value = '';
  appliedClassFilter.value = 'all';
  appliedTermFilter.value = 'all';
  appliedSubjectFilter.value = 'all';
  appliedExamType.value = 'all';
  appliedStatusFilter.value = 'all';
  appliedExamDate.value = '';

  fetchOfficialExams(1);
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

onMounted(async () => {
  await loadInitialContext();
  await fetchOfficialExams();
});

onUnmounted(() => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
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
                  @keydown.enter="applyFilters"
                  type="text"
                  placeholder="بحث في المواد والتعليمات والقاعات..."
                  class="w-full pr-10 pl-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
                />
              </div>
              <button
                @click="applyFilters"
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

        <!-- 4. Filter Bar (Explicit Filter Controls with Dynamic Subject & Term) -->
        <div v-if="isAdmin" class="p-4 sm:p-5 rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-xs space-y-4 print:hidden">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            <!-- 1. Class Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-title mb-1 flex items-center gap-1.5">
                <School class="w-3.5 h-3.5 text-bx-primary" />
                <span>الصف الدراسي</span>
              </label>
              <TaqniyaSelect
                v-model="selectedClassFilter"
                :options="classOptions"
                placeholder="كافة الصفوف الدراسية..."
                searchable
                full-width
              />
            </div>

            <!-- 2. Term Filter (Dynamic based on selected class) -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-bx-primary" />
                <span>الفصل الدراسي</span>
              </label>
              <TaqniyaSelect
                v-model="selectedTermFilter"
                :options="termOptions"
                placeholder="كافة الفصول الدراسية..."
                full-width
              />
            </div>

            <!-- 3. Subject Filter (Cascading: Dynamic based on selected class) -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                  <span>المادة التعليمية</span>
                </span>
                <span v-if="selectedClassFilter === 'all'" class="text-[10px] text-amber-500 dark:text-amber-400 font-normal">
                  (عام لكافة الصفوف)
                </span>
              </label>
              <TaqniyaSelect
                v-model="selectedSubjectFilter"
                :options="subjectOptions"
                placeholder="كافة المواد التعليمية..."
                searchable
                full-width
              />
            </div>

            <!-- 4. Exam Type Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <Layers class="w-3.5 h-3.5 text-bx-primary" />
                <span>نوع الامتحان</span>
              </label>
              <TaqniyaSelect
                v-model="selectedExamType"
                :options="examTypeFilterOptions"
                placeholder="كافة أنواع الامتحانات"
                full-width
              />
            </div>

            <!-- 5. Status Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-bx-primary" />
                <span>حالة الاختبار</span>
              </label>
              <TaqniyaSelect
                v-model="selectedStatusFilter"
                :options="statusOptions"
                placeholder="كافة الحالات..."
                full-width
              />
            </div>

            <!-- 6. Exam Date Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                <span>تاريخ الامتحان</span>
              </label>
              <input
                v-model="selectedExamDate"
                type="date"
                class="w-full px-3 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title outline-none focus:border-bx-primary transition"
              />
            </div>
          </div>

          <!-- Filter Action Toolbar -->
          <div class="pt-3 border-t border-[#B4AED8]/40 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="applyFilters"
                :disabled="loading"
                class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                <Filter class="w-3.5 h-3.5" />
                <span>تطبيق التصفية</span>
              </button>

              <button
                type="button"
                @click="resetFilters"
                :disabled="loading"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)] disabled:opacity-50 transition-all cursor-pointer"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>إعادة تعيين الفلاتر</span>
              </button>
            </div>

            <div v-if="hasActiveFilters" class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
              <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
              <span>يتم تطبيق فلاتر مخصصة</span>
            </div>
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

          <!-- Unified Datatable Content: TaqniyaTable & TaqniyaPagination -->
          <div v-else class="space-y-4">
            <TaqniyaTable
              :columns="tableColumns"
              :items="flatExamRows"
              :is-loading="loading"
              row-key="id"
            >
              <!-- 0. Sequence Index Slot -->
              <template #cell-index="{ index }">
                <span class="font-bold text-bx-muted text-xs font-['Alexandria',sans-serif]">
                  {{ (currentPage - 1) * perPage + index + 1 }}
                </span>
              </template>

              <!-- 1. Subject & Exam Type -->
              <template #cell-subject_exam="{ item }">
                <div class="space-y-1">
                  <span
                    class="font-black text-xs sm:text-sm text-bx-title block leading-snug hover:text-bx-primary transition-colors cursor-pointer"
                    @click="openDetailsDrawer(item)"
                  >
                    {{ item.subject_name }}
                  </span>
                  <span
                    class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs"
                    :class="getExamTypeBadge(item.exam_type).class"
                  >
                    {{ item.exam_type_ar }}
                  </span>
                </div>
              </template>

              <!-- 2. Target Class -->
              <template #cell-class="{ item }">
                <div class="font-bold text-xs text-bx-title">
                  <span>{{ item.class_name }}</span>
                  <span v-if="item.grade_level" class="text-bx-muted mx-1 text-[11px] block font-normal">المستوى: {{ item.grade_level }}</span>
                </div>
              </template>

              <!-- 3. Exam Date & Day -->
              <template #cell-exam_date="{ item }">
                <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-bx-title">
                  <Calendar class="w-3.5 h-3.5 text-bx-primary shrink-0" />
                  <span>{{ item.exam_date }}</span>
                </div>
              </template>

              <!-- 4. Attachments Count Badge -->
              <template #cell-attachments="{ item }">
                <span
                  v-if="item.attachments_count && item.attachments_count > 0"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs"
                >
                  <Paperclip class="w-3.5 h-3.5" />
                  <span>{{ item.attachments_count }} ملفات</span>
                </span>
                <span v-else class="text-bx-muted text-xs font-medium">بدون مرفقات</span>
              </template>

              <!-- 5. Status Badge with Countdown -->
              <template #cell-status="{ item }">
                <span
                  class="inline-block px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs"
                  :class="
                    item.countdownInfo?.isPast || item.status === 'completed'
                      ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20'
                      : item.countdownInfo?.isUrgent
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  "
                >
                  {{ item.countdownInfo?.label || (item.status === 'upcoming' ? 'قادم ومجدول' : 'منجز ومكتمل') }}
                </span>
              </template>

              <!-- 6. Action Buttons Toolbar -->
              <template #cell-actions="{ item }">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- View Details Button -->
                  <button
                    type="button"
                    @click="openDetailsDrawer(item)"
                    class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
                    title="معاينة التفاصيل الكاملة والمرفقات والقاعة"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>

                  <!-- Edit Button -->
                  <button
                    type="button"
                    @click="openEditDrawer(item)"
                    class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
                    title="تعديل موعد وبيانات الامتحان"
                  >
                    <Pen class="w-3.5 h-3.5" />
                  </button>

                  <!-- Delete Button -->
                  <button
                    type="button"
                    @click="openDeleteModal(item)"
                    class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-rose-500 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="إلغاء وحذف موعد الامتحان"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </template>
            </TaqniyaTable>

            <!-- Standardized TaqniyaPagination Component -->
            <div class="pt-2">
              <TaqniyaPagination
                :current-page="currentPage"
                :total-pages="Math.ceil(totalRecords / perPage) || 1"
                :total="totalRecords"
                :is-loading="loading"
                item-name="امتحان"
                @page-change="fetchOfficialExams"
              />
            </div>
          </div>
        </div>

        <!-- View 2: Student / Parent & Printable Timetable Board -->
        <div v-else-if="isStudentOrParent || activeViewTab === 'class_board'" class="space-y-6">
          <div v-if="printableBoards.length === 0 && !loading" class="text-center py-16 bg-purple-500/[0.02] rounded-3xl border border-dashed border-[#B4AED8] dark:border-white/10">
            <School class="w-12 h-12 mx-auto text-bx-primary/40 mb-3" />
            <h3 class="text-base font-bold text-bx-title">لا توجد روزنامة امتحانات مطابقة للفلاتر الحالية</h3>
            <p class="text-xs text-bx-muted mt-1 max-w-sm mx-auto">
              يرجى اختيار صف دراسي أو ضبط محددات البحث لعرض جدول الامتحانات المعتمد.
            </p>
          </div>

          <div
            v-for="board in printableBoards"
            :key="board.class_id"
            class="p-6 sm:p-8 rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-transparent page-break-after"
          >
            <!-- 1. Official Printable Document Header -->
            <div class="space-y-3 pb-5 border-b-2 border-[#B4AED8]/70 dark:border-white/15">
              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-white/[0.05] border border-purple-500/20 flex items-center justify-center shrink-0">
                    <School class="w-6 h-6 text-bx-primary" />
                  </div>
                  <div>
                    <h3 class="text-base sm:text-lg font-black font-display text-bx-title">
                      نظام إدارة المدارس الذكي — Taqniya-SMS
                    </h3>
                    <p class="text-[11px] font-bold text-bx-muted">
                      إدارة الامتحانات والتقويم التربوي المعتمد
                    </p>
                  </div>
                </div>

                <!-- Document Stamp Meta Badge -->
                <div class="text-center sm:text-end space-y-0.5">
                  <span class="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs">
                    وثيقة رسمية معتمدة
                  </span>
                  <p class="text-[10px] text-bx-muted font-mono font-medium">
                    تاريخ الإصدار: {{ printDateFormatted }}
                  </p>
                </div>
              </div>

              <!-- Document Title & Academic Info Strip -->
              <div class="p-3.5 rounded-2xl bg-purple-500/[0.04] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/10 flex flex-wrap items-center justify-around gap-2 text-xs font-bold text-bx-title">
                <div class="flex items-center gap-1.5">
                  <span class="text-bx-muted">الصف الدراسي:</span>
                  <span class="text-bx-primary font-black">{{ board.class_name }}</span>
                </div>
                <div class="text-bx-muted hidden sm:inline">•</div>
                <div class="flex items-center gap-1.5">
                  <span class="text-bx-muted">الفصل الدراسي:</span>
                  <span>{{ board.academic_term_name }}</span>
                </div>
                <div class="text-bx-muted hidden sm:inline">•</div>
                <div class="flex items-center gap-1.5">
                  <span class="text-bx-muted">العام الدراسي:</span>
                  <span class="font-mono">{{ board.academic_year_name }}</span>
                </div>
              </div>
            </div>

            <!-- 2. Exam Groups by Type (Midterm, Final, Second Round) -->
            <div
              v-for="group in board.exam_types"
              :key="group.exam_type"
              class="space-y-3"
            >
              <div class="flex items-center justify-between gap-2">
                <span
                  class="text-xs px-3.5 py-1 rounded-full border font-bold shadow-2xs inline-flex items-center gap-1.5"
                  :class="getExamTypeBadge(group.exam_type).class"
                >
                  <Layers class="w-3.5 h-3.5" />
                  <span>{{ group.exam_type_ar }}</span>
                </span>
                <span class="text-[11px] font-bold text-bx-muted">
                  إجمالي المواد: {{ group.exams?.length || (group as any).subjects?.length || 0 }} مادة
                </span>
              </div>

              <!-- Official Clean Table (No Attachments Column, Exam Date before Day, Clean Subject) -->
              <div class="overflow-x-auto rounded-2xl border border-[#B4AED8] dark:border-white/15 bg-[var(--bx-surface-solid)]">
                <table class="w-full text-start border-collapse text-xs font-sans">
                  <thead class="bg-[var(--bx-table-header)] text-bx-title font-bold border-b border-[#B4AED8]/70 dark:border-white/15">
                    <tr>
                      <th class="py-3 px-3.5 w-12 text-center border-e border-[#B4AED8]/50 dark:border-white/10">#</th>
                      <th class="py-3 px-4 text-center w-36 border-e border-[#B4AED8]/50 dark:border-white/10">تاريخ الامتحان</th>
                      <th class="py-3 px-4 text-center w-28 border-e border-[#B4AED8]/50 dark:border-white/10">اليوم</th>
                      <th class="py-3 px-4 text-start min-w-[200px] border-e border-[#B4AED8]/50 dark:border-white/10">المادة الدراسية</th>
                      <th class="py-3 px-4 text-start min-w-[220px] last:border-e-0">القاعة والتعليمات الإرشادية</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10 text-bx-title">
                    <tr
                      v-for="(exam, idx) in (group.exams || (group as any).subjects || [])"
                      :key="exam.id"
                      class="hover:bg-purple-500/[0.02] transition-colors"
                    >
                      <td class="py-3.5 px-3.5 text-center font-bold text-bx-muted font-mono border-e border-[#B4AED8]/50 dark:border-white/10">
                        {{ idx + 1 }}
                      </td>
                      <td class="py-3.5 px-4 text-center font-bold text-bx-primary font-mono whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                        <div class="flex items-center justify-center gap-1.5">
                          <Calendar class="w-3.5 h-3.5 shrink-0 text-bx-primary/70" />
                          <span>{{ exam.exam_date }}</span>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-center font-bold text-bx-title whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                        {{ exam.exam_day_name || '—' }}
                      </td>
                      <td class="py-3.5 px-4 font-black text-bx-title text-sm border-e border-[#B4AED8]/50 dark:border-white/10">
                        {{ exam.subject_name }}
                      </td>
                      <td class="py-3.5 px-4 text-bx-muted font-medium last:border-e-0">
                        {{ exam.notes || 'الالتزام بالحضور بالزي المدرسي مصطحباً الأدوات المقررة' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. Official Document Footer (Signatures & Guidelines) -->
            <div class="pt-5 border-t border-[#B4AED8]/60 dark:border-white/10 space-y-4">
              <div class="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[11px] font-medium leading-relaxed">
                <strong>تعليمات هامة للطلاب:</strong> يرجى التواجد في القاعة الامتحانية قبل بدء الاختبار بـ 15 دقيقة، ويُمنع منعاً باتاً إدخال أجهزة الهواتف الذكية أو المذكرات داخل لجان الامتحانات.
              </div>

              <!-- Signatures Row -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center pt-2 text-xs font-bold text-bx-title">
                <div>
                  <p class="text-bx-muted text-[11px] mb-6">رئيس لجنة الامتحانات</p>
                  <p class="border-t border-dashed border-[#B4AED8] dark:border-white/20 pt-1">التوقيع: ....................</p>
                </div>
                <div>
                  <p class="text-bx-muted text-[11px] mb-6">يعتمد: مدير المدرسة</p>
                  <p class="border-t border-dashed border-[#B4AED8] dark:border-white/20 pt-1">الاسم والتوقيع: ....................</p>
                </div>
                <div class="col-span-2 sm:col-span-1">
                  <p class="text-bx-muted text-[11px] mb-6">الختم الرسمي للمدرسة</p>
                  <div class="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-[#B4AED8] dark:border-white/20 flex items-center justify-center text-[10px] text-bx-muted/60">
                    مكان الختم
                  </div>
                </div>
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

      <!-- Standardized TaqniyaModal Delete Confirmation (Admin) -->
      <TaqniyaModal
        :is-open="isDeleteModalOpen"
        max-width="sm"
        title="تأكيد إلغاء وحذف موعد الامتحان"
        subtitle="استبعاد موعد الامتحان من الجداول والروزنامة المعتمدة"
        @close="isDeleteModalOpen = false"
      >
        <template #icon>
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
            <Trash2 class="w-5 h-5" />
          </div>
        </template>

        <p class="text-xs text-bx-muted leading-relaxed">
          هل أنت متأكد من رغبتك في شطب موعد امتحان
          <span class="font-bold text-bx-title">{{ itemToDelete?.subject_name }}</span>
          للصف {{ itemToDelete?.class_name }}؟ سيتم استبعاد السجل من الجداول المعتمدة نهائياً مع توثيق العملية.
        </p>

        <template #footer>
          <div class="flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="isDeleteModalOpen = false"
              class="px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              @click="confirmDelete"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
              <Trash2 v-else class="w-3.5 h-3.5" />
              <span>{{ isDeleting ? 'جاري الحذف...' : 'نعم، احذف الامتحان' }}</span>
            </button>
          </div>
        </template>
      </TaqniyaModal>
    </div>
  </TaqniyaErrorBoundary>
</template>
