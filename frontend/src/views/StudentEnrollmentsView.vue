<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import {
  Plus,
  Search,
  Sparkles,
  School,
  Edit2,
  Trash2,
  History,
  RotateCcw,
  AlertCircle,
  Hash,
} from 'lucide-vue-next';
import {
  studentEnrollmentsApi,
  type ClassWithSections,
  type EnrolledStudent,
  type StudentEnrollmentHistoryItem,
  type EnrollmentStatusType,
} from '../api/student-enrollments.api';
import { studentsApi, type Student } from '../api/students.api';
import { academicApi } from '../api/academic.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';

// Lazy load drawers and modals
const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));

const toast = useToast();

// Loading and Error states
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

// Matrix Data
const academicYearId = ref<number | null>(null);
const academicYearName = ref<string>('');
const classesList = ref<ClassWithSections[]>([]);

// Filter inputs
const search = ref('');
const selectedYearFilter = ref<number | string>('all');
const selectedClassFilter = ref<number | string>('all');
const selectedSectionFilter = ref<number | string>('all');
const selectedStatusFilter = ref<string>('all');

// Active section selection per class (for tabbed view)
const activeSectionPerClass = ref<Record<number, number>>({});

// Master Reference Data
const academicYears = ref<any[]>([]);
const rawClasses = ref<any[]>([]);
const rawSections = ref<any[]>([]);
const rawStudents = ref<Student[]>([]);

// Request cancellation controller
let activeAbortController: AbortController | null = null;
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Drawers & Modals State
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeEnrollmentId = ref<number | null>(null);

const showHistoryDrawer = ref(false);
const historyStudentName = ref('');
const historyItems = ref<StudentEnrollmentHistoryItem[]>([]);
const historyLoading = ref(false);

const showBulkModal = ref(false);
const showDeleteModal = ref(false);
const enrollmentToDelete = ref<EnrolledStudent | null>(null);

// Single Form State
const form = ref({
  academic_year_id: 0,
  student_id: 0,
  class_section_id: 0,
  seating_number: '',
  status: 'enrolled' as EnrollmentStatusType,
});
const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);

// Bulk Form State
const bulkForm = ref({
  academic_year_id: 0,
  class_id: 0,
  class_section_id: 0,
  selected_student_ids: [] as number[],
  studentSearch: '',
});
const bulkErrorMessage = ref<string | null>(null);

// Status options mapping
const statusOptions: TaqniyaSelectOption[] = [
  { value: 'all', label: 'جميع الحالات الأكاديمية' },
  { value: 'enrolled', label: 'مسكن (Enrolled)' },
  { value: 'passed', label: 'ناجح (Passed)' },
  { value: 'second_round', label: 'دور ثانٍ (Second Round)' },
  { value: 'failed', label: 'راسب (Failed)' },
  { value: 'graduated', label: 'متخرج (Graduated)' },
];

const formStatusOptions: TaqniyaSelectOption[] = [
  { value: 'enrolled', label: 'مسكن (Enrolled)' },
  { value: 'passed', label: 'ناجح (Passed)' },
  { value: 'second_round', label: 'دور ثانٍ (Second Round)' },
  { value: 'failed', label: 'راسب (Failed)' },
  { value: 'graduated', label: 'متخرج (Graduated)' },
];

// Helper: Status Badges
const getStatusBadge = (status: EnrollmentStatusType) => {
  switch (status) {
    case 'enrolled':
      return {
        label: 'مسكن',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    case 'passed':
      return {
        label: 'ناجح',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      };
    case 'second_round':
      return {
        label: 'دور ثانٍ',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    case 'failed':
      return {
        label: 'راسب',
        bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    case 'graduated':
      return {
        label: 'متخرج',
        bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
      };
  }
};

// Year Options
const yearOptions = computed<TaqniyaSelectOption[]>(() => {
  const options: TaqniyaSelectOption[] = [{ value: 'all', label: 'العام الدراسي النشط' }];
  for (const y of academicYears.value) {
    options.push({
      value: y.id,
      label: `${y.name} ${y.is_active ? ' (النشط)' : ''}`,
    });
  }
  return options;
});

// Class Filter Options
const classFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  const options: TaqniyaSelectOption[] = [{ value: 'all', label: 'جميع الصفوف الدراسية' }];
  for (const c of rawClasses.value) {
    options.push({
      value: c.id,
      label: `${c.name} (المستوى ${c.grade_level})`,
    });
  }
  return options;
});

// Section Filter Options (dependent on class filter if chosen)
const sectionFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  const options: TaqniyaSelectOption[] = [{ value: 'all', label: 'جميع الشعب' }];
  const filtered = selectedClassFilter.value !== 'all'
    ? rawSections.value.filter((s) => s.class_id === Number(selectedClassFilter.value))
    : rawSections.value;
  for (const s of filtered) {
    options.push({
      value: s.id,
      label: `${s.section?.name || s.name || `شعبة #${s.id}`} (${s.class?.name || ''})`,
    });
  }
  return options;
});

// Class Section Options for Form
const formSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawSections.value.map((s) => ({
    value: s.id,
    label: `${s.class?.name || 'صف'} - ${s.section?.name || s.name || 'شعبة'}`,
  }));
});

// Available unenrolled students for bulk enroll
const availableStudentsForBulk = computed(() => {
  const searchLower = bulkForm.value.studentSearch.trim().toLowerCase();
  // Get all currently enrolled student IDs in the current academic year
  const enrolledIds = new Set<number>();
  for (const c of classesList.value) {
    for (const sec of c.sections) {
      for (const st of sec.students) {
        enrolledIds.add(st.student_id);
      }
    }
  }

  return rawStudents.value
    .filter((s) => !enrolledIds.has(s.id))
    .filter((s) => {
      if (!searchLower) return true;
      return (
        s.full_name.toLowerCase().includes(searchLower) ||
        s.user_code.toLowerCase().includes(searchLower)
      );
    });
});

// Fetch reference metadata
const loadMetadata = async () => {
  try {
    const [yearsRes, classesRes, sectionsRes, studentsRes] = await Promise.all([
      academicApi.getYears({ per_page: 50 }),
      academicApi.getClasses(),
      academicApi.getClassSections(),
      studentsApi.getStudents({ per_page: 200 }),
    ]);

    academicYears.value = yearsRes.data?.data || yearsRes.data || [];
    rawClasses.value = classesRes.data?.data || classesRes.data || [];
    rawSections.value = sectionsRes.data?.data || sectionsRes.data || [];
    rawStudents.value = (studentsRes.data?.data as Student[]) || [];

    // Set default active year if available
    const active = academicYears.value.find((y) => y.is_active === 1);
    if (active && selectedYearFilter.value === 'all') {
      academicYearId.value = active.id;
      form.value.academic_year_id = active.id;
      bulkForm.value.academic_year_id = active.id;
    }
  } catch (err) {
    console.error('Failed to load metadata:', err);
  }
};

// Fetch Matrix Data
const fetchEnrollments = async () => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  errorMessage.value = null;

  try {
    const params: any = {};
    if (selectedYearFilter.value !== 'all') {
      params.academic_year_id = Number(selectedYearFilter.value);
    }
    if (selectedClassFilter.value !== 'all') {
      params.class_id = Number(selectedClassFilter.value);
    }
    if (selectedSectionFilter.value !== 'all') {
      params.class_section_id = Number(selectedSectionFilter.value);
    }
    if (selectedStatusFilter.value !== 'all') {
      params.status = selectedStatusFilter.value;
    }
    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    const res = await studentEnrollmentsApi.getEnrollmentsMatrix(params, activeAbortController.signal);
    if (res.data?.data) {
      academicYearId.value = res.data.data.academic_year_id;
      academicYearName.value = res.data.data.academic_year_name;
      classesList.value = res.data.data.classes || [];

      // Auto-select first section of each class if not selected
      for (const cls of classesList.value) {
        if (!activeSectionPerClass.value[cls.class_id] && cls.sections.length > 0) {
          activeSectionPerClass.value[cls.class_id] = cls.sections[0].class_section_id;
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'CanceledError' && !err.message?.includes('canceled')) {
      errorMessage.value = err.response?.data?.message || 'حدث خطأ أثناء تحميل بيانات تسكين الطلاب.';
      toast.error(errorMessage.value || 'تعذر تحميل البيانات');
    }
  } finally {
    loading.value = false;
  }
};

// Debounced search watcher (350ms)
watch(search, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    fetchEnrollments();
  }, 350);
});

// Reset Filters
const resetFilters = () => {
  search.value = '';
  selectedYearFilter.value = 'all';
  selectedClassFilter.value = 'all';
  selectedSectionFilter.value = 'all';
  selectedStatusFilter.value = 'all';
  fetchEnrollments();
};

// Open Single Enrollment Drawer (Create Mode)
const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeEnrollmentId.value = null;
  form.value = {
    academic_year_id: academicYearId.value || academicYears.value[0]?.id || 0,
    student_id: 0,
    class_section_id: rawSections.value[0]?.id || 0,
    seating_number: '',
    status: 'enrolled',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
};

// Open Single Enrollment Drawer (Edit Mode)
const openEditDrawer = (student: EnrolledStudent, sectionId: number) => {
  drawerMode.value = 'edit';
  activeEnrollmentId.value = student.enrollment_id;
  form.value = {
    academic_year_id: academicYearId.value || 0,
    student_id: student.student_id,
    class_section_id: sectionId,
    seating_number: student.seating_number || '',
    status: student.status,
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
};

// Submit Single Form
const handleSaveEnrollment = async () => {
  submitting.value = true;
  fieldErrors.value = {};
  formErrorMessage.value = null;

  try {
    if (drawerMode.value === 'create') {
      const res = await studentEnrollmentsApi.createEnrollment({
        academic_year_id: Number(form.value.academic_year_id),
        student_id: Number(form.value.student_id),
        class_section_id: Number(form.value.class_section_id),
        seating_number: form.value.seating_number ? form.value.seating_number.trim() : undefined,
        status: form.value.status,
      });
      toast.success(res.data.message || 'تم تسكين الطالب بنجاح');
    } else if (activeEnrollmentId.value) {
      const res = await studentEnrollmentsApi.updateEnrollment(activeEnrollmentId.value, {
        class_section_id: Number(form.value.class_section_id),
        seating_number: form.value.seating_number ? form.value.seating_number.trim() : undefined,
        status: form.value.status,
      });
      toast.success(res.data.message || 'تم تحديث بيانات التسكين بنجاح');
    }

    showDrawer.value = false;
    await fetchEnrollments();
  } catch (err: any) {
    if (err.response?.status === 422) {
      fieldErrors.value = err.response.data?.errors || {};
      formErrorMessage.value = err.response.data?.message || 'يرجى مراجعة الحقول المطلوبة.';
    } else if (err.response?.status === 409) {
      formErrorMessage.value = err.response.data?.message || 'تعارض في التسكين.';
      toast.error(formErrorMessage.value || 'تعارض في التسكين');
    } else {
      formErrorMessage.value = err.response?.data?.message || 'حدث خطأ أثناء حفظ التسكين.';
      toast.error(formErrorMessage.value || 'خطأ في الحفظ');
    }
  } finally {
    submitting.value = false;
  }
};

// Open Bulk Enroll Modal
const openBulkModal = () => {
  bulkForm.value = {
    academic_year_id: academicYearId.value || academicYears.value[0]?.id || 0,
    class_id: rawClasses.value[0]?.id || 0,
    class_section_id: rawSections.value[0]?.id || 0,
    selected_student_ids: [],
    studentSearch: '',
  };
  bulkErrorMessage.value = null;
  showBulkModal.value = true;
};

// Handle Bulk Submit
const handleBulkEnrollSubmit = async () => {
  if (bulkForm.value.selected_student_ids.length === 0) {
    bulkErrorMessage.value = 'يرجى اختيار طالب واحد على الأقل للتسكين.';
    return;
  }
  submitting.value = true;
  bulkErrorMessage.value = null;

  try {
    const res = await studentEnrollmentsApi.bulkEnroll({
      academic_year_id: Number(bulkForm.value.academic_year_id),
      class_section_id: Number(bulkForm.value.class_section_id),
      student_ids: bulkForm.value.selected_student_ids,
    });
    toast.success(res.data.message || 'تم التسكين الجماعي للطلاب بنجاح');
    showBulkModal.value = false;
    await fetchEnrollments();
  } catch (err: any) {
    bulkErrorMessage.value = err.response?.data?.message || 'فشل التسكين الجماعي للطلاب.';
    toast.error(bulkErrorMessage.value || 'خطأ بالتسكين الجماعي');
  } finally {
    submitting.value = false;
  }
};

// Open History Drawer
const openHistoryDrawer = async (student: EnrolledStudent) => {
  historyStudentName.value = student.student_name;
  historyItems.value = [];
  historyLoading.value = true;
  showHistoryDrawer.value = true;

  try {
    const res = await studentEnrollmentsApi.getStudentEnrollmentsHistory(student.student_id);
    historyItems.value = res.data?.data || [];
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'تعذر تحميل السجل الأكاديمي للطالب');
  } finally {
    historyLoading.value = false;
  }
};

// Open Delete Confirmation Modal
const confirmDelete = (student: EnrolledStudent) => {
  enrollmentToDelete.value = student;
  showDeleteModal.value = true;
};

// Execute Delete Enrollment
const handleDeleteEnrollment = async () => {
  if (!enrollmentToDelete.value) return;
  submitting.value = true;

  try {
    const res = await studentEnrollmentsApi.deleteEnrollment(enrollmentToDelete.value.enrollment_id);
    toast.success(res.data?.message || 'تم إلغاء سجل التسكين بنجاح');
    showDeleteModal.value = false;
    enrollmentToDelete.value = null;
    await fetchEnrollments();
  } catch (err: any) {
    if (err.response?.status === 409) {
      toast.error(err.response.data?.message || 'لا يمكن إلغاء التسكين لارتباط الطالب بدرجات أو امتحانات.');
    } else {
      toast.error(err.response?.data?.message || 'فشل إلغاء التسكين.');
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await loadMetadata();
  await fetchEnrollments();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- 🌟 Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
        <div>
          <div class="flex items-center gap-2.5 mb-1.5">
            <div class="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <School class="w-5 h-5" />
            </div>
            <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              تسكين وتسجيل الطلاب بالفصول والشعب
            </h1>
            <span
              v-if="academicYearName"
              class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
            >
              {{ academicYearName }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            توزيع وتسكين الطلاب على الفصول والشعب وتوليد أرقام الجلوس ومتابعة حالات التدرج الأكاديمي
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5">
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm shadow-md shadow-blue-600/20 transition-all duration-200"
          >
            <Plus class="w-4 h-4" />
            <span>+ تسكين فردي</span>
          </button>

          <button
            @click="openBulkModal"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-medium text-sm shadow-md shadow-purple-600/20 transition-all duration-200"
          >
            <Sparkles class="w-4 h-4" />
            <span>⚡ تسكين جماعي</span>
          </button>
        </div>
      </div>

      <!-- 🔍 Filters & Search Bar -->
      <div class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Academic Year Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">العام الدراسي</label>
            <TaqniyaSelect
              v-model="selectedYearFilter"
              :options="yearOptions"
              @update:model-value="fetchEnrollments"
            />
          </div>

          <!-- Class Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">الصف الدراسي</label>
            <TaqniyaSelect
              v-model="selectedClassFilter"
              :options="classFilterOptions"
              @update:model-value="fetchEnrollments"
            />
          </div>

          <!-- Section Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">الشعبة الدراسية</label>
            <TaqniyaSelect
              v-model="selectedSectionFilter"
              :options="sectionFilterOptions"
              @update:model-value="fetchEnrollments"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">الحالة الأكاديمية</label>
            <TaqniyaSelect
              v-model="selectedStatusFilter"
              :options="statusOptions"
              @update:model-value="fetchEnrollments"
            />
          </div>

          <!-- Search Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">بحث سريع</label>
            <div class="relative">
              <input
                v-model="search"
                type="text"
                placeholder="اسم الطالب، الكود، رقم الجلوس..."
                class="w-full pl-3 pr-9 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
              <Search class="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span class="text-slate-500 dark:text-slate-400">
            عدد الصفوف المعروضة: <strong class="text-slate-800 dark:text-slate-200">{{ classesList.length }}</strong>
          </span>
          <button
            @click="resetFilters"
            class="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>إعادة ضبط الفلاتر</span>
          </button>
        </div>
      </div>

      <!-- ⚠️ Error State Banner -->
      <div
        v-if="errorMessage"
        class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm"
      >
        <div class="flex items-center gap-2.5">
          <AlertCircle class="w-5 h-5 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>
        <button
          @click="fetchEnrollments"
          class="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700 transition"
        >
          إعادة المحاولة
        </button>
      </div>

      <!-- ⏳ Loading State (Skeleton Cards) -->
      <div v-if="loading" class="space-y-6">
        <div
          v-for="n in 2"
          :key="n"
          class="bg-white/60 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 animate-pulse space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div class="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
          <div class="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div class="h-40 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
        </div>
      </div>

      <!-- ⚪ Empty State -->
      <div
        v-else-if="classesList.length === 0"
        class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center max-w-lg mx-auto space-y-4"
      >
        <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
          <School class="w-8 h-8" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
            لا توجد سجلات تسكين تطابق محددات البحث
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            لم يتم العثور على طلاب مسكنين بالعام والصف المحدد. يمكنك البدء بتسكين أول طالب الآن.
          </p>
        </div>
        <button
          @click="openCreateDrawer"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>+ تسكين أول طالب</span>
        </button>
      </div>

      <!-- 🟢 Success State: Classes & Sections Accordions/Cards -->
      <div v-else class="space-y-6">
        <div
          v-for="cls in classesList"
          :key="cls.class_id"
          class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <!-- Class Card Header -->
          <div class="px-6 py-4.5 bg-gradient-to-l from-slate-50/80 to-white dark:from-slate-800/50 dark:to-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                {{ cls.grade_level }}
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {{ cls.class_name }}
                  <span class="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                    المستوى الأكاديمي: {{ cls.grade_level }}
                  </span>
                </h2>
              </div>
            </div>

            <!-- Total Enrolled in Class -->
            <div class="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              إجمالي الطلاب بالصف:
              <strong class="text-slate-800 dark:text-slate-200 mr-1">
                {{ cls.sections.reduce((sum, s) => sum + s.enrolled_count, 0) }}
              </strong>
            </div>
          </div>

          <!-- Section Tabs Navigation -->
          <div class="p-6 space-y-6">
            <div class="flex flex-wrap items-center gap-2 border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
              <button
                v-for="sec in cls.sections"
                :key="sec.class_section_id"
                @click="activeSectionPerClass[cls.class_id] = sec.class_section_id"
                :class="[
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border',
                  activeSectionPerClass[cls.class_id] === sec.class_section_id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                ]"
              >
                <span>{{ sec.section_name }}</span>
                <span
                  :class="[
                    'text-xs px-2 py-0.5 rounded-full font-bold',
                    activeSectionPerClass[cls.class_id] === sec.class_section_id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  ]"
                >
                  {{ sec.enrolled_count }}
                </span>
              </button>
            </div>

            <!-- Active Section Students Table -->
            <div
              v-for="sec in cls.sections"
              :key="`sec-content-${sec.class_section_id}`"
              v-show="activeSectionPerClass[cls.class_id] === sec.class_section_id"
            >
              <div v-if="sec.students.length === 0" class="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                لا يوجد طلاب مسكنين في {{ sec.section_name }}.
              </div>

              <div v-else class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table class="w-full text-right text-sm">
                  <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs">
                    <tr>
                      <th class="px-4 py-3">#</th>
                      <th class="px-4 py-3">كود الطالب</th>
                      <th class="px-4 py-3">اسم الطالب الرباعي</th>
                      <th class="px-4 py-3">رقم الجلوس</th>
                      <th class="px-4 py-3">الحالة الأكاديمية</th>
                      <th class="px-4 py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr
                      v-for="st in sec.students"
                      :key="st.enrollment_id"
                      class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td class="px-4 py-3.5 text-xs text-slate-400 font-mono">
                        {{ st.enrollment_id }}
                      </td>
                      <td class="px-4 py-3.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {{ st.student_code }}
                      </td>
                      <td class="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {{ st.student_name }}
                      </td>
                      <td class="px-4 py-3.5">
                        <span
                          v-if="st.seating_number"
                          class="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                        >
                          <Hash class="w-3 h-3 text-slate-400" />
                          {{ st.seating_number }}
                        </span>
                        <span v-else class="text-xs text-slate-400">-</span>
                      </td>
                      <td class="px-4 py-3.5">
                        <span
                          :class="[
                            'inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                            getStatusBadge(st.status).bg
                          ]"
                        >
                          {{ getStatusBadge(st.status).label }}
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <!-- History Button -->
                          <button
                            @click="openHistoryDrawer(st)"
                            title="السجل الأكاديمي والتاريخي"
                            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all active:scale-95"
                          >
                            <History class="w-4 h-4" />
                          </button>

                          <!-- Edit Button -->
                          <button
                            @click="openEditDrawer(st, sec.class_section_id)"
                            title="تعديل ونقل الشعبة ورقم الجلوس"
                            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-all active:scale-95"
                          >
                            <Edit2 class="w-4 h-4" />
                          </button>

                          <!-- Delete Button -->
                          <button
                            @click="confirmDelete(st)"
                            title="إلغاء التسكين وتجريد المقعد"
                            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all active:scale-95"
                          >
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 📋 Single Enrollment Drawer (Create / Edit) -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        @close="showDrawer = false"
        :title="drawerMode === 'create' ? 'تسكين طالب جديد في فصل وشعبة' : 'تعديل بيانات التسكين ونقل الشعبة'"
        max-width="max-w-[520px]"
      >
        <form @submit.prevent="handleSaveEnrollment" class="space-y-4 p-6" dir="rtl">
          <div
            v-if="formErrorMessage"
            class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Academic Year -->
          <div v-if="drawerMode === 'create'">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              العام الدراسي <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              v-model="form.academic_year_id"
              :options="yearOptions.filter(y => y.value !== 'all')"
            />
            <p v-if="fieldErrors.academic_year_id" class="text-xs text-rose-500 mt-1">
              {{ fieldErrors.academic_year_id[0] }}
            </p>
          </div>

          <!-- Student Selection (Create Only) -->
          <div v-if="drawerMode === 'create'">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              الطالب المستهدف <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="form.student_id"
              class="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option :value="0" disabled>-- اختر الطالب --</option>
              <option v-for="s in rawStudents" :key="s.id" :value="s.id">
                {{ s.full_name }} ({{ s.user_code }})
              </option>
            </select>
            <p v-if="fieldErrors.student_id" class="text-xs text-rose-500 mt-1">
              {{ fieldErrors.student_id[0] }}
            </p>
          </div>

          <!-- Class Section Selection -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              الصف والشعبة الدراسية <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              v-model="form.class_section_id"
              :options="formSectionOptions"
            />
            <p v-if="fieldErrors.class_section_id" class="text-xs text-rose-500 mt-1">
              {{ fieldErrors.class_section_id[0] }}
            </p>
          </div>

          <!-- Seating Number -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              رقم الجلوس (اختياري)
            </label>
            <input
              v-model="form.seating_number"
              type="text"
              placeholder="مثال: SEAT-5001"
              class="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              الحالة الأكاديمية
            </label>
            <TaqniyaSelect
              v-model="form.status"
              :options="formStatusOptions"
            />
          </div>

          <!-- Actions -->
          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="showDrawer = false"
              class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition disabled:opacity-50"
            >
              <span v-if="submitting">جاري الحفظ...</span>
              <span v-else>{{ drawerMode === 'create' ? 'تسكين الطالب' : 'تحديث البيانات' }}</span>
            </button>
          </div>
        </form>
      </TaqniyaDrawer>

      <!-- ⚡ Bulk Enroll Modal -->
      <div
        v-if="showBulkModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        dir="rtl"
      >
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>التسكين والتوزيع الجماعي للطلاب</span>
            </h3>
            <button @click="showBulkModal = false" class="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div
            v-if="bulkErrorMessage"
            class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ bulkErrorMessage }}</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">العام الدراسي</label>
              <TaqniyaSelect
                v-model="bulkForm.academic_year_id"
                :options="yearOptions.filter(y => y.value !== 'all')"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الشعبة المستهدفة</label>
              <TaqniyaSelect
                v-model="bulkForm.class_section_id"
                :options="formSectionOptions"
              />
            </div>
          </div>

          <!-- Students Multi-select list -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                قائمة الطلاب غير المسكنين بالعام الحالي (تم اختيار {{ bulkForm.selected_student_ids.length }})
              </label>
            </div>
            <input
              v-model="bulkForm.studentSearch"
              type="text"
              placeholder="تصفية الطلاب غير المسكنين..."
              class="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            />
            <div class="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              <div
                v-for="s in availableStudentsForBulk"
                :key="s.id"
                class="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs cursor-pointer"
                @click="
                  bulkForm.selected_student_ids.includes(s.id)
                    ? bulkForm.selected_student_ids = bulkForm.selected_student_ids.filter(id => id !== s.id)
                    : bulkForm.selected_student_ids.push(s.id)
                "
              >
                <input
                  type="checkbox"
                  :value="s.id"
                  v-model="bulkForm.selected_student_ids"
                  class="rounded text-purple-600 focus:ring-purple-500"
                  @click.stop
                />
                <span class="font-medium text-slate-800 dark:text-slate-200">{{ s.full_name }}</span>
                <span class="text-slate-400 font-mono text-[11px]">({{ s.user_code }})</span>
              </div>
              <div v-if="availableStudentsForBulk.length === 0" class="p-4 text-center text-slate-400 text-xs">
                لا يوجد طلاب غير مسكنين متاحين.
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="showBulkModal = false"
              class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="submitting || bulkForm.selected_student_ids.length === 0"
              @click="handleBulkEnrollSubmit"
              class="px-5 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-700 active:scale-95 text-white transition disabled:opacity-50"
            >
              <span v-if="submitting">جاري التسكين الذري...</span>
              <span v-else>تسكين {{ bulkForm.selected_student_ids.length }} طلاب</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 📜 Student Academic Progression Drawer -->
      <TaqniyaDrawer
        :is-open="showHistoryDrawer"
        @close="showHistoryDrawer = false"
        :title="`السجل والأرشيف التسكيني — ${historyStudentName}`"
        max-width="max-w-[520px]"
      >
        <div class="p-6 space-y-4" dir="rtl">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            يعرض هذا السجل التدرج الأكاديمي للطالب عبر كافة الأعوام السابقة (المستمدة من الصحائف المدرسية المؤرشفة) والعام التشغيلي الحالي.
          </p>

          <div v-if="historyLoading" class="text-center py-12 text-slate-400 text-sm">
            جاري جلب الأرشيف الأكاديمي...
          </div>

          <div v-else-if="historyItems.length === 0" class="text-center py-8 text-slate-400 text-sm">
            لا توجد سجلات تسكين تاريخية مسجلة للطالب.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in historyItems"
              :key="item.id"
              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {{ item.academic_year_name }}
                </span>
                <span
                  :class="[
                    'text-xs px-2 py-0.5 rounded-full font-semibold border',
                    getStatusBadge(item.status).bg
                  ]"
                >
                  {{ getStatusBadge(item.status).label }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div>الصف: <strong class="text-slate-800 dark:text-slate-200">{{ item.class_name }}</strong></div>
                <div>الشعبة: <strong class="text-slate-800 dark:text-slate-200">{{ item.section_name }}</strong></div>
                <div>المستوى الأكاديمي: <strong class="text-slate-800 dark:text-slate-200">{{ item.grade_level }}</strong></div>
                <div>رقم الجلوس: <strong class="text-slate-800 dark:text-slate-200 font-mono">{{ item.seating_number || '-' }}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </TaqniyaDrawer>

      <!-- 🗑️ Delete Confirmation Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        dir="rtl"
      >
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
          <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Trash2 class="w-6 h-6" />
          </div>
          <div class="text-center space-y-1.5">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">
              تأكيد إلغاء وتجريد تسكين الطالب
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              هل أنت متأكد من رغبتك في إلغاء تسكين الطالب <strong class="text-slate-800 dark:text-slate-200">{{ enrollmentToDelete?.student_name }}</strong> وتفريغ مقعده؟
            </p>
          </div>

          <div class="flex items-center justify-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              تراجع
            </button>
            <button
              type="button"
              :disabled="submitting"
              @click="handleDeleteEnrollment"
              class="px-5 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
            >
              <span v-if="submitting">جاري الإلغاء...</span>
              <span v-else>نعم، إلغاء التسكين</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
