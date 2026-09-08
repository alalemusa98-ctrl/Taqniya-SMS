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
  Loader2,
  GraduationCap,
  Layers,
  Calendar,
  Filter,
  User,
  CheckCircle2,
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

// Lazy load drawers
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
const statusFilter = ref<string>('all');
const selectedYearFilter = ref<number | string>('all');
const selectedClassFilter = ref<number | string>('all');
const selectedSectionFilter = ref<number | string>('all');

// Active section selection per class
const activeSectionPerClass = ref<Record<number, number>>({});

// Master Reference Data
const academicYears = ref<any[]>([]);
const rawClasses = ref<any[]>([]);
const rawSections = ref<any[]>([]);
const rawStudents = ref<Student[]>([]);

// Request cancellation & debouncing
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

// Form State
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

// Quick Metrics Banner Stats
const stats = computed(() => {
  let totalEnrolled = 0;
  let totalSections = 0;
  const activeClassesCount = classesList.value.length;

  for (const c of classesList.value) {
    totalSections += c.sections.length;
    for (const sec of c.sections) {
      totalEnrolled += sec.enrolled_count;
    }
  }

  return {
    totalEnrolled,
    activeClassesCount,
    totalSections,
    academicYearName: academicYearName.value || 'العام النشط',
  };
});

// Helper: Status Badges matching System
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

// Form status options
const formStatusOptions: TaqniyaSelectOption[] = [
  { value: 'enrolled', label: 'مسكن (Enrolled)' },
  { value: 'passed', label: 'ناجح (Passed)' },
  { value: 'second_round', label: 'دور ثانٍ (Second Round)' },
  { value: 'failed', label: 'راسب (Failed)' },
  { value: 'graduated', label: 'متخرج (Graduated)' },
];

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
  const options: TaqniyaSelectOption[] = [{ value: 'all', label: 'كافة الصفوف الدراسية' }];
  for (const c of rawClasses.value) {
    options.push({
      value: c.id,
      label: `${c.name} (المستوى ${c.grade_level})`,
    });
  }
  return options;
});

// Section Filter Options
const sectionFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  const options: TaqniyaSelectOption[] = [{ value: 'all', label: 'كافة الشعب الدراسية' }];
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

// Form Section Options
const formSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawSections.value.map((s) => ({
    value: s.id,
    label: `${s.class?.name || 'صف'} - ${s.section?.name || s.name || 'شعبة'}`,
  }));
});

// Available unenrolled students for bulk enroll
const availableStudentsForBulk = computed(() => {
  const searchLower = bulkForm.value.studentSearch.trim().toLowerCase();
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

// Has active academic filters check
const hasActiveFilters = computed(() => {
  return (
    (selectedClassFilter.value && selectedClassFilter.value !== 'all') ||
    (selectedSectionFilter.value && selectedSectionFilter.value !== 'all') ||
    (selectedYearFilter.value && selectedYearFilter.value !== 'all') ||
    (statusFilter.value && statusFilter.value !== 'all') ||
    search.value.trim().length > 0
  );
});

// Fetch Reference Metadata
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
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }
    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    const res = await studentEnrollmentsApi.getEnrollmentsMatrix(params, activeAbortController.signal);
    if (res.data?.data) {
      academicYearId.value = res.data.data.academic_year_id;
      academicYearName.value = res.data.data.academic_year_name;
      classesList.value = res.data.data.classes || [];

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

// Watch status filter change
watch(statusFilter, () => {
  fetchEnrollments();
});

// Reset Filters
const resetFilters = () => {
  search.value = '';
  statusFilter.value = 'all';
  selectedYearFilter.value = 'all';
  selectedClassFilter.value = 'all';
  selectedSectionFilter.value = 'all';
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
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card (Matching System SSoT Design System) -->
      <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
        
        <!-- Card Header: Title on Right, Controls & Filters on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <!-- Title -->
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                تسكين وتسجيل الطلاب بالفصول والشعب
              </h2>
              <span
                v-if="academicYearName"
                class="px-3 py-0.5 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.08] text-bx-primary border border-purple-500/20"
              >
                {{ academicYearName }}
              </span>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1">
              إدارة توزيع الطلاب على الفصول والشعب، توليد أرقام الجلوس، ومتابعة حالات التدرج الأكاديمي
            </p>
          </div>

          <!-- Controls: Action Buttons + Pill Search + Status Pills -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Single Button -->
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ تسكين فردي</span>
            </button>

            <!-- Bulk Enroll Button -->
            <button
              @click="openBulkModal"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold shadow-sm hover:bg-purple-700 transition-all cursor-pointer"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>⚡ تسكين جماعي</span>
            </button>

            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-56">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث في المسكنين..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Status Filter Pills -->
            <div class="flex items-center gap-1 p-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent">
              <button
                @click="statusFilter = 'all'"
                class="px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="statusFilter === 'all' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                الكل
              </button>
              <button
                @click="statusFilter = 'enrolled'"
                class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="statusFilter === 'enrolled' ? 'bg-emerald-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                مسكن
              </button>
              <button
                @click="statusFilter = 'passed'"
                class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="statusFilter === 'passed' ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                ناجح
              </button>
              <button
                @click="statusFilter = 'second_round'"
                class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="statusFilter === 'second_round' ? 'bg-amber-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                دور ثانٍ
              </button>
              <button
                @click="statusFilter = 'failed'"
                class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="statusFilter === 'failed' ? 'bg-rose-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                راسب
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Metrics Banner (Stats Ribbon matching Reference Design) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6">
          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-purple-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <GraduationCap class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">إجمالي المسكنين</span>
              <span class="text-base font-black font-display text-bx-title font-mono">{{ stats.totalEnrolled }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-blue-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Layers class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">الصفوف المسكنة</span>
              <span class="text-base font-black font-display text-blue-600 dark:text-blue-400 font-mono">{{ stats.activeClassesCount }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-emerald-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <School class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">الشعب الدراسية</span>
              <span class="text-base font-black font-display text-emerald-600 dark:text-emerald-400 font-mono">{{ stats.totalSections }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-indigo-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Calendar class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">العام الدراسي الحالي</span>
              <span class="text-sm font-black font-display text-indigo-600 dark:text-indigo-400">{{ stats.academicYearName }}</span>
            </div>
          </div>
        </div>

        <!-- Academic Hierarchy Filter Ribbon -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.08] mb-6 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between gap-2 border-b border-[#B4AED8]/30 dark:border-white/[0.06] pb-2.5">
            <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
              <Filter class="w-4 h-4 text-bx-primary shrink-0" />
              <span>تصفية مصفوفة التسكين حسب الصف والشعبة والعام</span>
            </div>
            <div class="flex items-center gap-3">
              <div v-if="hasActiveFilters" class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
                <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
                <span>فلاتر التسكين مفعلة</span>
              </div>
              <button
                @click="resetFilters"
                class="inline-flex items-center gap-1 text-[11px] text-bx-muted hover:text-bx-primary transition-colors cursor-pointer font-bold"
              >
                <RotateCcw class="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">العام الدراسي</label>
              <TaqniyaSelect
                v-model="selectedYearFilter"
                :options="yearOptions"
                placeholder="اختر العام الدراسي..."
                :icon="Calendar"
                full-width
                @update:model-value="fetchEnrollments"
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الصف الدراسي</label>
              <TaqniyaSelect
                v-model="selectedClassFilter"
                :options="classFilterOptions"
                placeholder="كافة الصفوف الدراسية..."
                :icon="Layers"
                full-width
                @update:model-value="fetchEnrollments"
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الشعبة الدراسية</label>
              <TaqniyaSelect
                v-model="selectedSectionFilter"
                :options="sectionFilterOptions"
                placeholder="كافة الشعب..."
                :icon="School"
                full-width
                @update:model-value="fetchEnrollments"
              />
            </div>
          </div>
        </div>

        <!-- ⚠️ Error State Banner -->
        <div
          v-if="errorMessage"
          class="mb-6 p-4 rounded-2xl bg-rose-500/[0.06] border border-rose-400/40 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between font-bold"
        >
          <div class="flex items-center gap-2.5">
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>
          <button
            @click="fetchEnrollments"
            class="px-3 py-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition text-[11px] cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>

        <!-- ⏳ Loading State -->
        <div v-if="loading" class="py-24 text-center text-bx-muted">
          <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
          <span class="text-xs font-bold">جاري تحميل مصفوفة تسكين الطلاب بالصفوف والشعب...</span>
        </div>

        <!-- ⚪ Empty State -->
        <div
          v-else-if="classesList.length === 0"
          class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
        >
          <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
          <h3 class="text-sm font-bold text-bx-title">لا توجد سجلات تسكين تطابق محددات البحث</h3>
          <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو البدء بتسكين أول طالب في الفصول الدراسية.</p>
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>تسكين أول طالب</span>
          </button>
        </div>

        <!-- 🟢 Success State: Class & Section Matrix Tables -->
        <div v-else class="space-y-6">
          <div
            v-for="cls in classesList"
            :key="cls.class_id"
            class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs"
          >
            <!-- Class Header Ribbon -->
            <div class="bg-[var(--bx-table-header)] border-b border-[#B4AED8]/60 dark:border-white/15 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold text-xs">
                  {{ cls.grade_level }}
                </div>
                <div>
                  <h3 class="text-sm font-black text-bx-title flex items-center gap-2">
                    {{ cls.class_name }}
                    <span class="text-[11px] font-bold text-bx-muted font-mono">
                      (المستوى {{ cls.grade_level }})
                    </span>
                  </h3>
                </div>
              </div>

              <div class="text-[11px] font-bold text-bx-muted">
                إجمالي الطلاب المسكنين بالصف:
                <strong class="text-bx-title font-mono font-bold mr-1">
                  {{ cls.sections.reduce((sum, s) => sum + s.enrolled_count, 0) }}
                </strong>
              </div>
            </div>

            <!-- Section Tabs Ribbon -->
            <div class="p-4 bg-purple-500/[0.01] border-b border-[#B4AED8]/40 dark:border-white/10 flex flex-wrap items-center gap-2">
              <button
                v-for="sec in cls.sections"
                :key="sec.class_section_id"
                @click="activeSectionPerClass[cls.class_id] = sec.class_section_id"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border"
                :class="
                  activeSectionPerClass[cls.class_id] === sec.class_section_id
                    ? 'bg-bx-primary text-white border-bx-primary shadow-xs'
                    : 'border-[#B4AED8]/60 dark:border-white/10 text-bx-muted hover:text-bx-title bg-transparent'
                "
              >
                <span>{{ sec.section_name }}</span>
                <span
                  class="px-2 py-0.2 rounded-full font-mono text-[10px] font-bold"
                  :class="
                    activeSectionPerClass[cls.class_id] === sec.class_section_id
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-500/10 text-bx-primary'
                  "
                >
                  {{ sec.enrolled_count }}
                </span>
              </button>
            </div>

            <!-- Active Section Students Table -->
            <div
              v-for="sec in cls.sections"
              :key="`sec-${sec.class_section_id}`"
              v-show="activeSectionPerClass[cls.class_id] === sec.class_section_id"
            >
              <div v-if="sec.students.length === 0" class="py-12 text-center text-bx-muted text-xs font-medium">
                لا يوجد طلاب مسكنين في {{ sec.section_name }}.
              </div>

              <div v-else class="overflow-x-auto">
                <table class="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8]/60 dark:border-white/15 text-bx-muted">
                      <th class="py-3 px-4 font-bold text-start w-12 font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">#</th>
                      <th class="py-3 px-4 font-bold text-start w-32 border-e border-[#B4AED8]/50 dark:border-white/10">الرمز الموحد</th>
                      <th class="py-3 px-4 font-bold text-start min-w-[220px] border-e border-[#B4AED8]/50 dark:border-white/10">
                        <div class="flex items-center gap-1.5">
                          <User class="w-3.5 h-3.5 text-bx-primary" />
                          <span>اسم الطالب الرباعي</span>
                        </div>
                      </th>
                      <th class="py-3 px-4 font-bold text-start min-w-[140px] border-e border-[#B4AED8]/50 dark:border-white/10">
                        <div class="flex items-center gap-1.5">
                          <Hash class="w-3.5 h-3.5 text-bx-primary" />
                          <span>رقم الجلوس</span>
                        </div>
                      </th>
                      <th class="py-3 px-4 font-bold text-center w-28 border-e border-[#B4AED8]/50 dark:border-white/10">
                        <div class="flex items-center justify-center gap-1.5">
                          <CheckCircle2 class="w-3.5 h-3.5 text-bx-primary" />
                          <span>الحالة الأكاديمية</span>
                        </div>
                      </th>
                      <th class="py-3 px-4 font-bold text-center w-36 last:border-e-0">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10">
                    <tr
                      v-for="(st, idx) in sec.students"
                      :key="st.enrollment_id"
                      class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                    >
                      <td class="py-3 px-4 font-bold text-bx-muted text-xs whitespace-nowrap font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">
                        {{ idx + 1 }}
                      </td>
                      <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                        <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-[#B4AED8]/50 dark:border-white/10 text-bx-title/80">
                          {{ st.student_code }}
                        </span>
                      </td>
                      <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                        <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight group-hover:text-bx-primary transition-colors">
                          {{ st.student_name }}
                        </span>
                      </td>
                      <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                        <span
                          v-if="st.seating_number"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-bx-title border border-slate-300 dark:border-slate-700"
                        >
                          {{ st.seating_number }}
                        </span>
                        <span v-else class="text-bx-muted font-bold text-xs">—</span>
                      </td>
                      <td class="py-3 px-4 text-center whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                        <span
                          :class="[
                            'inline-block px-3 py-0.5 rounded-full text-[11px] font-bold border',
                            getStatusBadge(st.status).bg
                          ]"
                        >
                          {{ getStatusBadge(st.status).label }}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center whitespace-nowrap last:border-e-0">
                        <div class="flex items-center justify-center gap-1.5">
                          <!-- History Button -->
                          <button
                            @click="openHistoryDrawer(st)"
                            class="w-7 h-7 rounded-full border border-[#B4AED8] bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                            title="السجل الأكاديمي والتاريخي"
                          >
                            <History class="w-3.5 h-3.5" />
                          </button>

                          <!-- Edit Button -->
                          <button
                            @click="openEditDrawer(st, sec.class_section_id)"
                            class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                            title="تعديل ونقل الشعبة"
                          >
                            <Edit2 class="w-3.5 h-3.5" />
                          </button>

                          <!-- Delete Button -->
                          <button
                            @click="confirmDelete(st)"
                            class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                            title="إلغاء التسكين"
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
        <form @submit.prevent="handleSaveEnrollment" class="space-y-4 p-6 font-sans" dir="rtl">
          <div
            v-if="formErrorMessage"
            class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 font-bold"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Academic Year -->
          <div v-if="drawerMode === 'create'">
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              العام الدراسي <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              v-model="form.academic_year_id"
              :options="yearOptions.filter(y => y.value !== 'all')"
              full-width
            />
            <p v-if="fieldErrors.academic_year_id" class="text-xs text-rose-500 mt-1 font-bold">
              {{ fieldErrors.academic_year_id[0] }}
            </p>
          </div>

          <!-- Student Selection (Create Only) -->
          <div v-if="drawerMode === 'create'">
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              الطالب المستهدف <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="form.student_id"
              class="w-full px-3.5 py-2 rounded-xl text-xs font-medium border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-title focus:outline-none focus:border-bx-primary transition-all"
            >
              <option :value="0" disabled>-- اختر الطالب المراد تسكينه --</option>
              <option v-for="s in rawStudents" :key="s.id" :value="s.id">
                {{ s.full_name }} ({{ s.user_code }})
              </option>
            </select>
            <p v-if="fieldErrors.student_id" class="text-xs text-rose-500 mt-1 font-bold">
              {{ fieldErrors.student_id[0] }}
            </p>
          </div>

          <!-- Class Section Selection -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              الصف والشعبة الدراسية <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              v-model="form.class_section_id"
              :options="formSectionOptions"
              full-width
            />
            <p v-if="fieldErrors.class_section_id" class="text-xs text-rose-500 mt-1 font-bold">
              {{ fieldErrors.class_section_id[0] }}
            </p>
          </div>

          <!-- Seating Number -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              رقم الجلوس (اختياري)
            </label>
            <input
              v-model="form.seating_number"
              type="text"
              placeholder="مثال: SEAT-5001"
              class="w-full px-3.5 py-2 rounded-xl text-xs font-medium border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              الحالة الأكاديمية
            </label>
            <TaqniyaSelect
              v-model="form.status"
              :options="formStatusOptions"
              full-width
            />
          </div>

          <!-- Actions -->
          <div class="pt-4 flex items-center justify-end gap-2 border-t border-[#B4AED8]/40 dark:border-white/10">
            <button
              type="button"
              @click="showDrawer = false"
              class="px-4 py-2 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 rounded-full text-xs font-bold bg-bx-primary text-white shadow-sm hover:bg-bx-primary-hover transition cursor-pointer disabled:opacity-50"
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
        <div class="bg-[var(--bx-surface-solid)] rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl max-w-xl w-full p-6 space-y-4 font-sans">
          <div class="flex items-center justify-between border-b border-[#B4AED8]/40 dark:border-white/10 pb-3">
            <h3 class="text-base font-black text-bx-title flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>التسكين والتوزيع الجماعي للطلاب</span>
            </h3>
            <button @click="showBulkModal = false" class="text-bx-muted hover:text-bx-title cursor-pointer text-xs font-bold">✕</button>
          </div>

          <div
            v-if="bulkErrorMessage"
            class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 font-bold"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ bulkErrorMessage }}</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-bx-muted mb-1.5">العام الدراسي</label>
              <TaqniyaSelect
                v-model="bulkForm.academic_year_id"
                :options="yearOptions.filter(y => y.value !== 'all')"
                full-width
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-bx-muted mb-1.5">الشعبة المستهدفة</label>
              <TaqniyaSelect
                v-model="bulkForm.class_section_id"
                :options="formSectionOptions"
                full-width
              />
            </div>
          </div>

          <!-- Students Multi-select list -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-bx-title">
                الطلاب غير المسكنين بالعام الحالي (تم اختيار {{ bulkForm.selected_student_ids.length }})
              </label>
            </div>
            <input
              v-model="bulkForm.studentSearch"
              type="text"
              placeholder="تصفية الطلاب غير المسكنين..."
              class="w-full px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-bx-title focus:outline-none focus:border-bx-primary"
            />
            <div class="max-h-56 overflow-y-auto border border-[#B4AED8]/60 dark:border-white/10 rounded-2xl divide-y divide-[#B4AED8]/40 dark:divide-white/10 bg-purple-500/[0.01]">
              <div
                v-for="s in availableStudentsForBulk"
                :key="s.id"
                class="flex items-center gap-3 p-2.5 hover:bg-purple-500/[0.05] dark:hover:bg-white/[0.03] text-xs cursor-pointer transition-colors"
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
                <span class="font-bold text-bx-title">{{ s.full_name }}</span>
                <span class="text-bx-muted font-mono text-[11px]">({{ s.user_code }})</span>
              </div>
              <div v-if="availableStudentsForBulk.length === 0" class="p-4 text-center text-bx-muted text-xs">
                لا يوجد طلاب غير مسكنين متاحين.
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#B4AED8]/40 dark:border-white/10">
            <button
              type="button"
              @click="showBulkModal = false"
              class="px-4 py-2 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="submitting || bulkForm.selected_student_ids.length === 0"
              @click="handleBulkEnrollSubmit"
              class="px-5 py-2 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer disabled:opacity-50"
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
        <div class="p-6 space-y-4 font-sans" dir="rtl">
          <p class="text-xs text-bx-muted font-medium">
            يعرض هذا السجل التدرج الأكاديمي للطالب عبر كافة الأعوام السابقة (المستمدة من الصحائف المدرسية المؤرشفة) والعام التشغيلي الحالي.
          </p>

          <div v-if="historyLoading" class="text-center py-12 text-bx-muted text-xs font-bold">
            جاري جلب الأرشيف الأكاديمي...
          </div>

          <div v-else-if="historyItems.length === 0" class="text-center py-8 text-bx-muted text-xs">
            لا توجد سجلات تسكين تاريخية مسجلة للطالب.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in historyItems"
              :key="item.id"
              class="p-4 rounded-2xl bg-purple-500/[0.02] border border-[#B4AED8]/60 dark:border-white/10 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-black text-xs sm:text-sm text-bx-title font-display">
                  {{ item.academic_year_name }}
                </span>
                <span
                  :class="[
                    'text-[11px] px-2.5 py-0.5 rounded-full font-bold border',
                    getStatusBadge(item.status).bg
                  ]"
                >
                  {{ getStatusBadge(item.status).label }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs text-bx-muted">
                <div>الصف: <strong class="text-bx-title">{{ item.class_name }}</strong></div>
                <div>الشعبة: <strong class="text-bx-title">{{ item.section_name }}</strong></div>
                <div>المستوى: <strong class="text-bx-title font-mono">{{ item.grade_level }}</strong></div>
                <div>رقم الجلوس: <strong class="text-bx-title font-mono">{{ item.seating_number || '—' }}</strong></div>
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
        <div class="bg-[var(--bx-surface-solid)] rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl max-w-md w-full p-6 space-y-4 font-sans text-center">
          <div class="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Trash2 class="w-5 h-5" />
          </div>
          <div class="space-y-1.5">
            <h3 class="text-base font-black text-bx-title">
              تأكيد إلغاء وتجريد تسكين الطالب
            </h3>
            <p class="text-xs text-bx-muted">
              هل أنت متأكد من رغبتك في إلغاء تسكين الطالب <strong class="text-bx-title">{{ enrollmentToDelete?.student_name }}</strong> وتفريغ مقعده؟
            </p>
          </div>

          <div class="flex items-center justify-center gap-2 pt-3 border-t border-[#B4AED8]/40 dark:border-white/10">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title cursor-pointer"
            >
              تراجع
            </button>
            <button
              type="button"
              :disabled="submitting"
              @click="handleDeleteEnrollment"
              class="px-5 py-2 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer disabled:opacity-50"
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
