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
  Users,
  UserX,
  ArrowLeftRight,
  CheckSquare,
  Check,
  Minus,
  TrendingUp,
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
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';

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

// Fast Class Counts Map (Aggregated strictly by class_id)
const classCountsMap = ref<Record<number, number>>({});
const enrolledStudentIds = ref<Set<number>>(new Set());

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
const activeStudentForDrawer = ref<EnrolledStudent | null>(null);
const currentSectionInfo = ref<{ className: string; sectionName: string } | null>(null);
const selectedDrawerClassId = ref<number | ''>('');

const showHistoryDrawer = ref(false);
const historyStudentName = ref('');
const historyItems = ref<StudentEnrollmentHistoryItem[]>([]);
const historyLoading = ref(false);

const showBulkModal = ref(false);
const showDeleteModal = ref(false);
const enrollmentToDelete = ref<EnrolledStudent | null>(null);

// Batch Multi-Select & Transfer State
const selectedEnrollmentIds = ref<number[]>([]);
const showBatchTransferModal = ref(false);
const batchTransferClassId = ref<number | ''>('');
const batchTransferSectionId = ref<number | ''>('');
const batchTransferSubmitting = ref(false);
const batchTransferError = ref<string | null>(null);

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
    totalEnrolled += classCountsMap.value[c.class_id] || 0;
  }

  const totalRegistered = rawStudents.value.length;
  // Accurate unenrolled count based on enrolled student IDs
  const unenrolledCount = rawStudents.value.filter((s) => !enrolledStudentIds.value.has(s.id)).length;
  const enrollmentRate = totalRegistered > 0 ? Math.round((totalEnrolled / totalRegistered) * 100) : (totalEnrolled > 0 ? 100 : 0);

  return {
    totalEnrolled,
    activeClassesCount,
    totalSections,
    unenrolledCount,
    totalRegistered,
    enrollmentRate,
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
      label: c.name,
    });
  }
  return options;
});

// Section Filter Options
const sectionFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  const options: TaqniyaSelectOption[] = [{ value: 'all', label: 'كافة الشعب الدراسية' }];
  const list = Array.isArray(rawSections.value) ? rawSections.value : [];
  const filtered = selectedClassFilter.value !== 'all'
    ? list.filter((s) => s.class_id === Number(selectedClassFilter.value))
    : list;
  for (const s of filtered) {
    options.push({
      value: s.id,
      label: `${s.name || `شعبة #${s.id}`} (${s.class_name || ''})`,
    });
  }
  return options;
});

// Drawer Class Options
const drawerClassOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawClasses.value.map((c) => ({
    value: c.id,
    label: c.name,
  }));
});

// Drawer Section Options (filtered strictly by selectedDrawerClassId)
const drawerSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedDrawerClassId.value) return [];
  const list = Array.isArray(rawSections.value) ? rawSections.value : [];
  return list
    .filter((s) => s.class_id === Number(selectedDrawerClassId.value))
    .map((s) => ({
      value: s.id,
      label: s.name || `شعبة #${s.id}`,
    }));
});

// Create Student Options (unenrolled students in the current active matrix)
const createStudentOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawStudents.value
    .filter((s) => !enrolledStudentIds.value.has(s.id))
    .map((s) => ({
      value: s.id,
      label: s.full_name,
      code: s.user_code,
      subtext: s.user_code ? `الرمز الموحد: ${s.user_code}` : undefined,
    }));
});

// Bulk Class & Section Options
const bulkClassOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawClasses.value.map((c) => ({
    value: c.id,
    label: c.name,
  }));
});

const bulkSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!bulkForm.value.class_id) return [];
  const list = Array.isArray(rawSections.value) ? rawSections.value : [];
  return list
    .filter((s) => s.class_id === Number(bulkForm.value.class_id))
    .map((s) => ({
      value: s.id,
      label: s.name || `شعبة #${s.id}`,
    }));
});

// Synchronize Drawer Section with Selected Drawer Class
watch(selectedDrawerClassId, (newClassId) => {
  if (!newClassId) {
    form.value.class_section_id = 0;
    return;
  }
  const available = rawSections.value.filter((s) => s.class_id === Number(newClassId));
  const stillValid = available.some((s) => s.id === form.value.class_section_id);
  if (!stillValid) {
    form.value.class_section_id = available.length > 0 ? available[0].id : 0;
  }
});

// Synchronize Bulk Section with Selected Bulk Class
watch(
  () => bulkForm.value.class_id,
  (newClassId) => {
    if (!newClassId) {
      bulkForm.value.class_section_id = 0;
      return;
    }
    const available = rawSections.value.filter((s) => s.class_id === Number(newClassId));
    bulkForm.value.class_section_id = available.length > 0 ? available[0].id : 0;
  },
);

// Batch Transfer Options & Watcher
const batchTransferClassOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawClasses.value.map((c) => ({
    value: c.id,
    label: c.name,
  }));
});

const batchTransferSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!batchTransferClassId.value) return [];
  const list = Array.isArray(rawSections.value) ? rawSections.value : [];
  return list
    .filter((s) => s.class_id === Number(batchTransferClassId.value))
    .map((s) => ({
      value: s.id,
      label: s.name || `شعبة #${s.id}`,
    }));
});

watch(batchTransferClassId, (newClassId) => {
  if (!newClassId) {
    batchTransferSectionId.value = '';
    return;
  }
  const available = rawSections.value.filter((s) => s.class_id === Number(newClassId));
  batchTransferSectionId.value = available.length > 0 ? available[0].id : '';
});

// Selected Students Info for Batch Transfer UI
const selectedStudentsInfo = computed(() => {
  const selectedSet = new Set(selectedEnrollmentIds.value);
  const infoList: { enrollment_id: number; student_name: string; student_code: string; class_name?: string; section_name?: string }[] = [];
  for (const c of classesList.value) {
    for (const sec of c.sections) {
      for (const st of sec.students) {
        if (selectedSet.has(st.enrollment_id)) {
          infoList.push({
            enrollment_id: st.enrollment_id,
            student_name: st.student_name,
            student_code: st.student_code,
            class_name: c.class_name,
            section_name: sec.section_name,
          });
        }
      }
    }
  }
  return infoList;
});

// Section multi-select helpers
const isSectionAllSelected = (students: EnrolledStudent[]) => {
  if (!students || students.length === 0) return false;
  return students.every((st) => selectedEnrollmentIds.value.includes(st.enrollment_id));
};

const isSectionPartiallySelected = (students: EnrolledStudent[]) => {
  if (!students || students.length === 0) return false;
  const count = students.filter((st) => selectedEnrollmentIds.value.includes(st.enrollment_id)).length;
  return count > 0 && count < students.length;
};

const toggleSelectAllSection = (students: EnrolledStudent[]) => {
  if (!students || students.length === 0) return;
  const allSelected = isSectionAllSelected(students);
  if (allSelected) {
    const secEnrollmentIds = new Set(students.map((st) => st.enrollment_id));
    selectedEnrollmentIds.value = selectedEnrollmentIds.value.filter((id) => !secEnrollmentIds.has(id));
  } else {
    const currentSet = new Set(selectedEnrollmentIds.value);
    for (const st of students) {
      currentSet.add(st.enrollment_id);
    }
    selectedEnrollmentIds.value = Array.from(currentSet);
  }
};

const toggleSelectStudent = (enrollmentId: number) => {
  const index = selectedEnrollmentIds.value.indexOf(enrollmentId);
  if (index >= 0) {
    selectedEnrollmentIds.value.splice(index, 1);
  } else {
    selectedEnrollmentIds.value.push(enrollmentId);
  }
};

const openBatchTransferModal = () => {
  if (selectedEnrollmentIds.value.length === 0) return;
  batchTransferError.value = null;
  batchTransferClassId.value = '';
  batchTransferSectionId.value = '';
  showBatchTransferModal.value = true;
};

const handleBatchTransferSubmit = async () => {
  if (!batchTransferSectionId.value || selectedEnrollmentIds.value.length === 0) {
    batchTransferError.value = 'يرجى تحديد الصف والشعبة الدراسية المستهدفة.';
    return;
  }

  batchTransferSubmitting.value = true;
  batchTransferError.value = null;

  try {
    const targetSectionId = Number(batchTransferSectionId.value);
    const targetClass = rawClasses.value.find((c) => c.id === Number(batchTransferClassId.value));
    const targetSection = rawSections.value.find((s) => s.id === targetSectionId);
    const destinationLabel = targetSection && targetClass ? `${targetClass.name} — ${targetSection.name}` : 'الشعبة الجديدة';

    // Execute transfer requests concurrently
    const promises = selectedEnrollmentIds.value.map((id) =>
      studentEnrollmentsApi.updateEnrollment(id, {
        class_section_id: targetSectionId,
      })
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter((r) => r.status === 'fulfilled' && (r.value as any).data?.success !== false).length;
    const failureCount = results.length - successCount;

    if (failureCount > 0) {
      toast.warning(`تم نقل ${successCount} طالب، بينما تعذر نقل ${failureCount} طلاب.`);
    } else {
      toast.success(`تم نقل جميع الطلاب المحددين (${successCount} طالب) بنجاح إلى ${destinationLabel}`);
    }

    selectedEnrollmentIds.value = [];
    showBatchTransferModal.value = false;
    await refreshActiveSections();
  } catch (err: any) {
    batchTransferError.value = err.response?.data?.message || 'حدث خطأ أثناء نقل الطلاب.';
  } finally {
    batchTransferSubmitting.value = false;
  }
};

// Available unenrolled students for bulk enroll
const availableStudentsForBulk = computed(() => {
  const searchLower = bulkForm.value.studentSearch.trim().toLowerCase();

  return rawStudents.value
    .filter((s) => !enrolledStudentIds.value.has(s.id))
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
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getClassSections({ per_page: 100 }),
      studentsApi.getStudents({ per_page: 200 }),
    ]);

    academicYears.value = Array.isArray(yearsRes.data?.data)
      ? yearsRes.data.data
      : Array.isArray(yearsRes.data)
        ? yearsRes.data
        : [];
    rawClasses.value = Array.isArray(classesRes.data?.data)
      ? classesRes.data.data
      : Array.isArray(classesRes.data)
        ? classesRes.data
        : [];

    // Flatten sections: getClassSections returns { data: { classes: [ { class_id, class_name, sections: [...] } ] } }
    const sectionsList: any[] = [];
    const groupedClasses = sectionsRes.data?.data?.classes || sectionsRes.data?.classes || [];
    if (Array.isArray(groupedClasses)) {
      for (const cls of groupedClasses) {
        for (const sec of cls.sections || []) {
          sectionsList.push({
            id: Number(sec.id),
            section_id: Number(sec.section_id),
            name: sec.name,
            class_id: Number(cls.class_id),
            class_name: cls.class_name,
          });
        }
      }
    }
    rawSections.value = sectionsList;
    rawStudents.value = (studentsRes.data?.data as Student[]) || [];

    const active = academicYears.value.find((y) => y.is_active === 1);
    if (active && selectedYearFilter.value === 'all') {
      academicYearId.value = active.id;
      form.value.academic_year_id = active.id;
      bulkForm.value.academic_year_id = active.id;
    }

    initClassesListFromMetadata();
    await fetchClassCounts();
  } catch (err) {
    console.error('Failed to load metadata:', err);
  }
};

// Fetch fast aggregate class counts (grouped strictly by class_id)
const fetchClassCounts = async () => {
  try {
    const params = academicYearId.value ? { academic_year_id: academicYearId.value } : undefined;
    const res = await studentEnrollmentsApi.getClassCounts(params);
    const map: Record<number, number> = {};
    for (const item of res.data?.data || []) {
      map[item.class_id] = item.count;
    }
    classCountsMap.value = map;
    if (Array.isArray(res.data?.enrolled_student_ids)) {
      enrolledStudentIds.value = new Set(res.data.enrolled_student_ids);
    }
  } catch (err) {
    console.error('Failed to fetch class counts:', err);
  }
};

// Initialize classes and sections structure from metadata (no students loaded initially)
const initClassesListFromMetadata = () => {
  classesList.value = rawClasses.value.map((c) => {
    const classSections = rawSections.value.filter((s) => s.class_id === c.id);
    return {
      class_id: c.id,
      class_name: c.name,
      grade_level: c.grade_level,
      sections: classSections.map((s) => ({
        class_section_id: s.id,
        section_name: s.name,
        enrolled_count: 0,
        students: [] as EnrolledStudent[],
        isLoaded: false,
        isLoading: false,
      })),
    };
  });
  activeSectionPerClass.value = {};
};

// Filtered list of classes based on selectedClassFilter
const displayClassesList = computed(() => {
  if (selectedClassFilter.value !== 'all') {
    return classesList.value.filter((c) => c.class_id === Number(selectedClassFilter.value));
  }
  return classesList.value;
});

// Load a specific section's students on-demand (when clicked or filtered)
const handleSectionClick = async (classId: number, sectionId: number, forceRefresh = false) => {
  // If clicking an already open section, toggle close
  if (!forceRefresh && activeSectionPerClass.value[classId] === sectionId) {
    delete activeSectionPerClass.value[classId];
    return;
  }

  activeSectionPerClass.value[classId] = sectionId;

  // Find section in classesList
  const cls = classesList.value.find((c) => c.class_id === classId);
  const sec = cls?.sections.find((s: any) => s.class_section_id === sectionId);

  // If already loaded and not force-refreshing, return immediately (served from cache)
  if (sec && (sec as any).isLoaded && !forceRefresh) {
    return;
  }

  if (sec) (sec as any).isLoading = true;
  try {
    const params: any = {
      academic_year_id: academicYearId.value,
      class_section_id: sectionId,
    };
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    const res = await studentEnrollmentsApi.getEnrollmentsMatrix(params);
    const returnedClass = res.data?.data?.classes?.[0];
    const returnedSec =
      returnedClass?.sections?.find((s: any) => s.class_section_id === sectionId) ||
      returnedClass?.sections?.[0];

    if (sec) {
      sec.students = returnedSec?.students || [];
      sec.enrolled_count = returnedSec?.enrolled_count ?? sec.students.length;
      (sec as any).isLoaded = true;
    }
  } catch (err: any) {
    toast.error('تعذر جلب بيانات طلاب الشعبة.');
  } finally {
    if (sec) (sec as any).isLoading = false;
  }
};

// Refresh currently open sections after changes (e.g. transfer, delete, create)
const refreshActiveSections = async () => {
  const activeEntries = Object.entries(activeSectionPerClass.value);
  for (const [classIdStr, sectionId] of activeEntries) {
    if (sectionId) {
      await handleSectionClick(Number(classIdStr), Number(sectionId), true);
    }
  }
  await fetchClassCounts();
};

// Search handler: searches server and automatically opens matching sections
const handleSearch = async () => {
  const q = search.value.trim();
  if (!q) {
    if (!hasActiveFilters.value) {
      initClassesListFromMetadata();
    }
    return;
  }

  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      academic_year_id: academicYearId.value,
      search: q,
    };
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    const res = await studentEnrollmentsApi.getEnrollmentsMatrix(params, activeAbortController.signal);
    if (res.data?.data) {
      classesList.value = (res.data.data.classes || []).map((c) => ({
        ...c,
        sections: (c.sections || []).map((s) => ({
          ...s,
          isLoaded: true,
          isLoading: false,
        })),
      }));

      // Automatically activate sections that have search results
      activeSectionPerClass.value = {};
      for (const c of classesList.value) {
        if (c.sections.length > 0) {
          activeSectionPerClass.value[c.class_id] = c.sections[0].class_section_id;
        }
      }
    }
  } catch (err: any) {
    toast.error('تعذر إجراء البحث.');
  } finally {
    loading.value = false;
  }
};

// Debounced search watcher (350ms)
watch(search, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    handleSearch();
  }, 350);
});

// Watch section filter change: automatically open and load that section
watch(selectedSectionFilter, (newSecId) => {
  if (!newSecId || newSecId === 'all') return;
  const secId = Number(newSecId);
  const secObj = rawSections.value.find((s) => s.id === secId);
  if (secObj) {
    handleSectionClick(secObj.class_id, secId, true);
  }
});

// Watch status filter change: refresh active sections with status
watch(statusFilter, () => {
  refreshActiveSections();
});

// Watch academic year filter change: refresh counts and active sections
watch(selectedYearFilter, async (newYear) => {
  if (newYear !== 'all') {
    academicYearId.value = Number(newYear);
  } else {
    const active = academicYears.value.find((y) => y.is_active === 1);
    academicYearId.value = active ? active.id : null;
  }
  await fetchClassCounts();
  await refreshActiveSections();
});

// Reset Filters
const resetFilters = async () => {
  search.value = '';
  statusFilter.value = 'all';
  selectedYearFilter.value = 'all';
  selectedClassFilter.value = 'all';
  selectedSectionFilter.value = 'all';
  initClassesListFromMetadata();
  await fetchClassCounts();
};

// Open Single Enrollment Drawer (Create Mode)
const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeEnrollmentId.value = null;
  activeStudentForDrawer.value = null;
  currentSectionInfo.value = null;

  const firstClassId = rawClasses.value[0]?.id || '';
  selectedDrawerClassId.value = firstClassId;

  const initialSections = firstClassId
    ? rawSections.value.filter((s) => s.class_id === Number(firstClassId))
    : [];

  const availableStudents = createStudentOptions.value;
  const firstStudentId = availableStudents[0]?.value ? Number(availableStudents[0].value) : 0;

  form.value = {
    academic_year_id: academicYearId.value || academicYears.value[0]?.id || 0,
    student_id: firstStudentId,
    class_section_id: initialSections[0]?.id || 0,
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
  activeStudentForDrawer.value = student;

  const sectionObj = rawSections.value.find((s) => s.id === sectionId);
  if (sectionObj) {
    selectedDrawerClassId.value = sectionObj.class_id;
    currentSectionInfo.value = {
      className: sectionObj.class_name,
      sectionName: sectionObj.name,
    };
  } else {
    selectedDrawerClassId.value = '';
    currentSectionInfo.value = null;
  }

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
      toast.success(res.data.message || 'تم تحديث بيانات التسكين ونقل الشعبة بنجاح');
    }

    showDrawer.value = false;
    await refreshActiveSections();
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
  const firstClassId = rawClasses.value[0]?.id || 0;
  const initialSections = rawSections.value.filter((s) => s.class_id === Number(firstClassId));
  bulkForm.value = {
    academic_year_id: academicYearId.value || academicYears.value[0]?.id || 0,
    class_id: firstClassId,
    class_section_id: initialSections[0]?.id || 0,
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
    await refreshActiveSections();
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
    await refreshActiveSections();
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
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card (Matching System SSoT Design System) -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        
        <!-- Card Header: Title on Right, Controls & Filters on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <!-- Title with Brand Accent Bar -->
          <div>
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
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
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
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
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>تسكين جماعي</span>
            </button>

            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-56">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث في المسكنين..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Status Filter Pills -->
            <div class="flex items-center gap-1 p-1 rounded-full border border-bx-border bg-transparent">
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

        <!-- 2. مؤشرات الأداء والبطاقات (8. KPI & Metrics - Exact Framework Section 8 Standard) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
          <!-- Card 1: Total Enrolled -->
          <TaqniyaKpiCard
            title="إجمالي الطلاب المسكنين"
            :value="stats.totalEnrolled"
            :icon="GraduationCap"
            variant="primary"
            badge-text="توزيع الطلاب"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
            :progress="stats.enrollmentRate"
          />

          <!-- Card 2: Active Classes -->
          <TaqniyaKpiCard
            title="الصفوف الدراسية"
            :value="`${stats.activeClassesCount} صف`"
            :icon="Layers"
            variant="blue"
            badge-text="المستويات الأكاديمية"
            :badge-icon="TrendingUp"
            :progress="100"
          />

          <!-- Card 3: Total Sections -->
          <TaqniyaKpiCard
            title="الشعب الدراسية"
            :value="`${stats.totalSections} شعبة`"
            :icon="School"
            variant="emerald"
            badge-text="الطاقة الاستيعابية"
            :badge-icon="TrendingUp"
            :progress="100"
          />

          <!-- Card 4: Students Awaiting Enrollment -->
          <TaqniyaKpiCard
            title="بانتظار التسكين"
            :value="`${stats.unenrolledCount} طالب`"
            :icon="UserX"
            :variant="stats.unenrolledCount > 0 ? 'amber' : 'emerald'"
            :badge-text="stats.unenrolledCount > 0 ? 'بحاجة لتسكين' : 'مكتمل التسكين'"
            :badge-icon="TrendingUp"
            :pulse-badge="stats.unenrolledCount > 0"
            :progress="stats.unenrolledCount > 0 ? Math.min(100, Math.round((stats.unenrolledCount / (stats.totalRegistered || 1)) * 100)) : 100"
          />
        </div>

        <!-- Academic Hierarchy Filter Ribbon -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-bx-border mb-6 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between gap-2 border-b border-bx-divider pb-2.5">
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
                @update:model-value="refreshActiveSections"
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
            @click="refreshActiveSections"
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
          class="py-20 text-center border-t border-bx-border space-y-3"
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
            v-for="cls in displayClassesList"
            :key="cls.class_id"
            class="rounded-2xl border border-bx-border overflow-hidden bg-bx-surface shadow-xs"
          >
            <!-- Class Header Ribbon -->
            <div class="bg-bx-table-header border-b border-bx-border px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
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
                  {{ classCountsMap[cls.class_id] ?? 0 }}
                </strong>
              </div>
            </div>

            <!-- Section Tabs Ribbon -->
            <div class="p-4 bg-purple-500/[0.01] border-b border-bx-divider flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="sec in cls.sections"
                  :key="sec.class_section_id"
                  @click="handleSectionClick(cls.class_id, sec.class_section_id)"
                  class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border"
                  :class="
                    activeSectionPerClass[cls.class_id] === sec.class_section_id
                      ? 'bg-bx-primary text-white border-bx-primary shadow-xs'
                      : 'border-bx-border text-bx-muted hover:text-bx-title bg-transparent'
                  "
                >
                  <Loader2 v-if="(sec as any).isLoading" class="w-3 h-3 animate-spin shrink-0" />
                  <span>{{ sec.section_name }}</span>
                  <span
                    v-if="(sec as any).isLoaded"
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

              <!-- Quick Batch Action Button if students in this class/system are selected -->
              <div v-if="selectedEnrollmentIds.length > 0" class="flex items-center gap-2">
                <button
                  @click="openBatchTransferModal"
                  class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-bx-primary hover:bg-bx-primary-hover text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <ArrowLeftRight class="w-3.5 h-3.5" />
                  <span>نقل الطلاب المحددين ({{ selectedEnrollmentIds.length }})</span>
                </button>
              </div>
            </div>

            <!-- Empty guide when no section is active in this class -->
            <div
              v-if="!activeSectionPerClass[cls.class_id]"
              class="py-9 px-4 text-center text-bx-muted"
            >
              <div class="w-10 h-10 rounded-full bg-purple-500/5 text-bx-primary flex items-center justify-center mx-auto mb-2 border border-purple-500/10">
                <School class="w-5 h-5 opacity-50" />
              </div>
              <p class="text-xs font-bold text-bx-title/80">انقر على إحدى الشعب أعلاه لعرض قائمة طلابها</p>
              <p class="text-[11px] text-bx-muted mt-0.5">يتم جلب بيانات كل شعبة بشكل مستقل عند طلبها فقط</p>
            </div>

            <!-- Active Section Students Table -->
            <div
              v-for="sec in cls.sections"
              :key="`sec-${sec.class_section_id}`"
              v-show="activeSectionPerClass[cls.class_id] === sec.class_section_id"
            >
              <div v-if="(sec as any).isLoading" class="py-12 text-center text-bx-muted">
                <Loader2 class="w-6 h-6 mx-auto animate-spin mb-2 text-bx-primary" />
                <span class="text-xs font-bold">جاري تحميل بيانات طلاب {{ sec.section_name }}...</span>
              </div>

              <div v-else-if="sec.students.length === 0" class="py-12 text-center text-bx-muted text-xs font-medium">
                لا يوجد طلاب مسكنين في {{ sec.section_name }}.
              </div>

              <div v-else class="overflow-x-auto">
                <table class="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr class="bg-bx-table-header border-b border-bx-border text-bx-muted">
                      <!-- Checkbox column for entire section selection -->
                      <th class="py-3 px-3 text-center w-12 border-e border-bx-divider">
                        <div class="flex items-center justify-center">
                          <button
                            type="button"
                            role="checkbox"
                            :aria-checked="isSectionAllSelected(sec.students) ? 'true' : isSectionPartiallySelected(sec.students) ? 'mixed' : 'false'"
                            @click="toggleSelectAllSection(sec.students)"
                            class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
                            :class="[
                              isSectionAllSelected(sec.students)
                                ? 'bg-bx-primary border-bx-primary text-white shadow-xs'
                                : isSectionPartiallySelected(sec.students)
                                  ? 'bg-bx-primary border-bx-primary text-white shadow-xs'
                                  : 'border-bx-border dark:border-white/30 bg-white dark:bg-slate-800 hover:border-bx-primary'
                            ]"
                            title="تحديد أو إلغاء تحديد كل طلاب الشعبة"
                          >
                            <Check v-if="isSectionAllSelected(sec.students)" class="w-3.5 h-3.5 stroke-[3]" />
                            <Minus v-else-if="isSectionPartiallySelected(sec.students)" class="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </th>
                      <th class="py-3 px-4 font-bold text-start w-12 font-['Alexandria',sans-serif] border-e border-bx-divider">#</th>
                      <th class="py-3 px-4 font-bold text-start w-32 border-e border-bx-divider">الرمز الموحد</th>
                      <th class="py-3 px-4 font-bold text-start min-w-[220px] border-e border-bx-divider">
                        <div class="flex items-center gap-1.5">
                          <User class="w-3.5 h-3.5 text-bx-primary" />
                          <span>اسم الطالب الرباعي</span>
                        </div>
                      </th>
                      <th class="py-3 px-4 font-bold text-start min-w-[140px] border-e border-bx-divider">
                        <div class="flex items-center gap-1.5">
                          <Hash class="w-3.5 h-3.5 text-bx-primary" />
                          <span>رقم الجلوس</span>
                        </div>
                      </th>
                      <th class="py-3 px-4 font-bold text-center w-36 last:border-e-0">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-bx-divider">
                    <tr
                      v-for="(st, idx) in sec.students"
                      :key="st.enrollment_id"
                      :class="[
                        'transition-colors duration-150 group',
                        selectedEnrollmentIds.includes(st.enrollment_id)
                          ? 'bg-purple-500/[0.08] dark:bg-purple-900/20'
                          : 'hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02]'
                      ]"
                    >
                      <!-- Checkbox column for individual student -->
                      <td class="py-3 px-3 text-center border-e border-bx-divider">
                        <div class="flex items-center justify-center">
                          <button
                            type="button"
                            role="checkbox"
                            :aria-checked="selectedEnrollmentIds.includes(st.enrollment_id)"
                            @click="toggleSelectStudent(st.enrollment_id)"
                            class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
                            :class="[
                              selectedEnrollmentIds.includes(st.enrollment_id)
                                ? 'bg-bx-primary border-bx-primary text-white shadow-xs'
                                : 'border-bx-border dark:border-white/30 bg-white dark:bg-slate-800 group-hover:border-bx-primary'
                            ]"
                            :title="`تحديد الطالب ${st.student_name}`"
                          >
                            <Check v-if="selectedEnrollmentIds.includes(st.enrollment_id)" class="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </td>
                      <td class="py-3 px-4 font-bold text-bx-muted text-xs whitespace-nowrap font-['Alexandria',sans-serif] border-e border-bx-divider">
                        {{ idx + 1 }}
                      </td>
                      <td class="py-3 px-4 whitespace-nowrap border-e border-bx-divider">
                        <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-bx-border text-bx-title/80">
                          {{ st.student_code }}
                        </span>
                      </td>
                      <td class="py-3 px-4 whitespace-nowrap border-e border-bx-divider">
                        <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight group-hover:text-bx-primary transition-colors">
                          {{ st.student_name }}
                        </span>
                      </td>
                      <td class="py-3 px-4 whitespace-nowrap border-e border-bx-divider">
                        <span
                          v-if="st.seating_number"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-bx-title border border-slate-300 dark:border-slate-700"
                        >
                          {{ st.seating_number }}
                        </span>
                        <span v-else class="text-bx-muted font-bold text-xs">—</span>
                      </td>
                      <td class="py-3 px-4 text-center whitespace-nowrap last:border-e-0">
                        <div class="flex items-center justify-center gap-1.5">
                          <!-- History Button -->
                          <button
                            @click="openHistoryDrawer(st)"
                            class="w-7 h-7 rounded-full border border-bx-border bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
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
        :title="drawerMode === 'create' ? 'تسكين طالب جديد في صف وشعبة' : 'نقل الشعبة وتعديل بيانات التسكين'"
        max-width="max-w-[660px]"
      >
        <form @submit.prevent="handleSaveEnrollment" class="space-y-4 font-sans" dir="rtl">
          <!-- Form Error Alert -->
          <div
            v-if="formErrorMessage"
            class="p-3.5 bg-rose-500/[0.08] dark:bg-rose-950/50 border border-rose-400/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 font-bold"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- ============================================== -->
          <!-- 🟢 CREATE MODE: ENROLL STUDENT INTO CLASS & SECTION -->
          <!-- ============================================== -->
          <template v-if="drawerMode === 'create'">
            <!-- Card 1: Student Selection (Active Year is automatically used) -->
            <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
              <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
                <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
                  <User class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-xs font-black text-bx-title">بيانات الطالب المستهدف</h4>
                  <p class="text-[10px] text-bx-muted">ابحث عن الطالب غير المسكن لتسكينه في العام الدراسي النشط</p>
                </div>
              </div>

              <!-- Student Selection via Searchable TaqniyaSelect -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-bx-title block">
                  الطالب المستهدف <span class="text-rose-500">*</span>
                </label>
                <TaqniyaSelect
                  v-model="form.student_id"
                  :options="createStudentOptions"
                  :placeholder="createStudentOptions.length === 0 ? 'لا يوجد طلاب غير مسكنين بالعام الحالي' : 'ابحث عن الطالب بالاسم أو الرمز الموحد...'"
                  :icon="User"
                  :disabled="createStudentOptions.length === 0"
                  full-width
                />
                <p v-if="fieldErrors.student_id" class="text-[11px] text-rose-500 font-bold mt-1">
                  {{ fieldErrors.student_id[0] }}
                </p>
              </div>
            </div>

            <!-- Card 2: Academic Placement (Hierarchical: Class THEN Section) -->
            <div class="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] space-y-3.5 shadow-xs">
              <div class="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <School class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-xs font-black text-bx-title">التسكين الأكاديمي وتحديد الشعبة</h4>
                    <p class="text-[10px] text-bx-muted">اختر الصف الدراسي أولاً لتفعيل الشعب المتاحة له</p>
                  </div>
                </div>
              </div>

              <!-- 2-Column Dependent Selectors -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <!-- 1. Select Class -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-bx-title block">
                    1. الصف الدراسي <span class="text-rose-500">*</span>
                  </label>
                  <TaqniyaSelect
                    v-model="selectedDrawerClassId"
                    :options="drawerClassOptions"
                    placeholder="اختر الصف الدراسي..."
                    :icon="School"
                    full-width
                  />
                </div>

                <!-- 2. Select Section -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-bx-title block">
                    2. الشعبة الدراسية <span class="text-rose-500">*</span>
                  </label>
                  <TaqniyaSelect
                    v-model="form.class_section_id"
                    :options="drawerSectionOptions"
                    :placeholder="
                      !selectedDrawerClassId
                        ? 'يرجى اختيار الصف أولاً...'
                        : drawerSectionOptions.length === 0
                        ? 'لا توجد شعب لهذا الصف'
                        : 'اختر الشعبة المتاحة...'
                    "
                    :disabled="!selectedDrawerClassId || drawerSectionOptions.length === 0"
                    :icon="GraduationCap"
                    full-width
                  />
                  <p v-if="fieldErrors.class_section_id" class="text-[11px] text-rose-500 font-bold mt-1">
                    {{ fieldErrors.class_section_id[0] }}
                  </p>
                </div>
              </div>

              <!-- Seating Number (Optional) -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center gap-1.5 text-bx-title">
                  <Hash class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <label class="text-[11px] font-bold">رقم الجلوس في الشعبة (اختياري)</label>
                </div>
                <input
                  v-model="form.seating_number"
                  type="text"
                  maxlength="50"
                  placeholder="مثال: 101، أو SEAT-501"
                  class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
                />
              </div>
            </div>
          </template>

          <!-- ============================================== -->
          <!-- 🔵 EDIT MODE: SECTION TRANSFER & PLACEMENT EDIT -->
          <!-- ============================================== -->
          <template v-else>
            <!-- Card 1: Current Student & Placement Information -->
            <div v-if="activeStudentForDrawer" class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3 shadow-xs">
              <div class="flex items-center justify-between border-b border-bx-divider pb-2.5">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
                    <User class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-xs font-black text-bx-title">بيانات القيد الحالي للطالب</h4>
                    <p class="text-[10px] text-bx-muted">معلومات الطالب والشعبة المسكن بها حالياً</p>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20">
                  {{ activeStudentForDrawer.student_code }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="p-3 rounded-xl bg-purple-500/[0.03] border border-bx-border">
                  <span class="text-[10px] text-bx-muted font-bold block mb-1">اسم الطالب الرباعي</span>
                  <span class="font-black text-bx-title">{{ activeStudentForDrawer.student_name }}</span>
                </div>
                <div class="p-3 rounded-xl bg-purple-500/[0.03] border border-bx-border">
                  <span class="text-[10px] text-bx-muted font-bold block mb-1">الشعبة والصف الحالي</span>
                  <span class="font-black text-indigo-600 dark:text-indigo-400">
                    {{ currentSectionInfo ? `${currentSectionInfo.className} — ${currentSectionInfo.sectionName}` : 'الشعبة الحالية' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card 2: Transfer to Target Class & Section -->
            <div class="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3.5 shadow-xs">
              <div class="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <ArrowLeftRight class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-xs font-black text-bx-title">نقل الطالب إلى شعبة جديدة</h4>
                    <p class="text-[10px] text-bx-muted">حدد الصف والشعبة المستهدفة لنقل قيد الطالب</p>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  نقل الشعبة
                </span>
              </div>

              <!-- 2-Column Dependent Selectors -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <!-- 1. Target Class -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-bx-title block">
                    1. الصف الدراسي المستهدف <span class="text-rose-500">*</span>
                  </label>
                  <TaqniyaSelect
                    v-model="selectedDrawerClassId"
                    :options="drawerClassOptions"
                    placeholder="اختر الصف الدراسي..."
                    :icon="School"
                    full-width
                  />
                </div>

                <!-- 2. Target Section -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-bx-title block">
                    2. الشعبة الدراسية المستهدفة <span class="text-rose-500">*</span>
                  </label>
                  <TaqniyaSelect
                    v-model="form.class_section_id"
                    :options="drawerSectionOptions"
                    :placeholder="
                      !selectedDrawerClassId
                        ? 'يرجى اختيار الصف أولاً...'
                        : drawerSectionOptions.length === 0
                        ? 'لا توجد شعب لهذا الصف'
                        : 'اختر الشعبة المتاحة...'
                    "
                    :disabled="!selectedDrawerClassId || drawerSectionOptions.length === 0"
                    :icon="GraduationCap"
                    full-width
                  />
                  <p v-if="fieldErrors.class_section_id" class="text-[11px] text-rose-500 font-bold mt-1">
                    {{ fieldErrors.class_section_id[0] }}
                  </p>
                </div>
              </div>

              <!-- Seating Number -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center gap-1.5 text-bx-title">
                  <Hash class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <label class="text-[11px] font-bold">رقم الجلوس في الشعبة الجديدة (اختياري)</label>
                </div>
                <input
                  v-model="form.seating_number"
                  type="text"
                  maxlength="50"
                  placeholder="مثال: 101، أو SEAT-501"
                  class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
                />
              </div>

              <!-- Optional Status Update in Edit Mode -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-bx-title">
                  <label class="text-[11px] font-bold">الحالة الأكاديمية للقيد</label>
                  <span class="text-[10px] text-bx-muted">(مسكن افتراضياً)</span>
                </div>
                <TaqniyaSelect
                  v-model="form.status"
                  :options="formStatusOptions"
                  full-width
                />
              </div>
            </div>
          </template>

          <!-- Drawer Actions Footer -->
          <div class="pt-4 flex items-center justify-end gap-3 border-t border-bx-divider">
            <button
              type="button"
              @click="showDrawer = false"
              class="px-5 py-2.5 rounded-full text-xs font-bold border border-bx-border text-bx-muted hover:text-bx-title hover:bg-bx-row-hover transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              :disabled="submitting || (drawerMode === 'create' && (!form.student_id || !form.class_section_id)) || (drawerMode === 'edit' && !form.class_section_id)"
              class="px-6 py-2.5 rounded-full text-xs font-bold bg-bx-primary text-white shadow-sm hover:bg-bx-primary-hover transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
              <span>{{ drawerMode === 'create' ? 'تسكين الطالب' : 'تأكيد نقل الشعبة والتحديث' }}</span>
            </button>
          </div>
        </form>
      </TaqniyaDrawer>

      <!-- ⚡ Bulk Enroll Drawer -->
      <TaqniyaDrawer
        :is-open="showBulkModal"
        @close="showBulkModal = false"
        title="التسكين والتوزيع الجماعي للطلاب"
        subtitle="تسكين دفعة من الطلاب غير المسكنين بالعام الدراسي الحالي في صف وشعبة محددة"
        :icon="Sparkles"
        max-width="max-w-[560px]"
      >
        <div class="space-y-4 font-sans" dir="rtl">
          <!-- Error alert -->
          <div
            v-if="bulkErrorMessage"
            class="p-3.5 bg-rose-500/[0.08] dark:bg-rose-950/50 border border-rose-400/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 font-bold"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ bulkErrorMessage }}</span>
          </div>

          <!-- Card 1: Target Class & Section -->
          <div class="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/[0.02] space-y-3.5 shadow-xs">
            <div class="flex items-center gap-2 border-b border-purple-500/20 pb-2.5">
              <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
                <School class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-black text-bx-title">الصف والشعبة المستهدفة</h4>
                <p class="text-[10px] text-bx-muted">حدد وجهة تسكين الطلاب</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-bx-title">
                  1. الصف المستهدف <span class="text-rose-500">*</span>
                </label>
                <TaqniyaSelect
                  v-model="bulkForm.class_id"
                  :options="bulkClassOptions"
                  placeholder="اختر الصف..."
                  :icon="School"
                  full-width
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-bx-title">
                  2. الشعبة المستهدفة <span class="text-rose-500">*</span>
                </label>
                <TaqniyaSelect
                  v-model="bulkForm.class_section_id"
                  :options="bulkSectionOptions"
                  :placeholder="!bulkForm.class_id ? 'اختر الصف أولاً...' : bulkSectionOptions.length === 0 ? 'لا توجد شعب' : 'اختر الشعبة...'"
                  :disabled="!bulkForm.class_id || bulkSectionOptions.length === 0"
                  :icon="GraduationCap"
                  full-width
                />
              </div>
            </div>
          </div>

          <!-- Card 2: Students Multi-select with Search & Quick Actions -->
          <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
                  <Users class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-xs font-black text-bx-title">الطلاب غير المسكنين</h4>
                  <p class="text-[10px] text-bx-muted">
                    المتاح: {{ availableStudentsForBulk.length }} طالب
                  </p>
                </div>
              </div>

              <!-- Quick Selection Actions -->
              <div v-if="availableStudentsForBulk.length > 0" class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="
                    bulkForm.selected_student_ids = availableStudentsForBulk.map((s) => s.id)
                  "
                  class="text-[10.5px] font-bold text-bx-primary hover:underline cursor-pointer px-2 py-0.5 rounded-full hover:bg-purple-500/10 transition"
                >
                  تحديد الكل
                </button>
                <span class="text-bx-muted text-[10px] opacity-40">|</span>
                <button
                  type="button"
                  @click="bulkForm.selected_student_ids = []"
                  class="text-[10.5px] font-bold text-bx-muted hover:text-rose-500 cursor-pointer px-2 py-0.5 rounded-full hover:bg-rose-500/10 transition"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            <!-- Search input -->
            <div class="relative flex items-center">
              <Search class="w-3.5 h-3.5 text-bx-muted absolute right-3 pointer-events-none" />
              <input
                v-model="bulkForm.studentSearch"
                type="text"
                placeholder="تصفية الطلاب بالاسم أو الرمز الموحد..."
                class="w-full pr-9 pl-4 py-2 rounded-full text-xs font-medium border border-bx-border bg-transparent text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all"
              />
            </div>

            <!-- Scrollable Student List -->
            <div class="max-h-60 overflow-y-auto border border-bx-border rounded-2xl divide-y divide-bx-divider bg-purple-500/[0.01]">
              <div
                v-for="s in availableStudentsForBulk"
                :key="s.id"
                class="flex items-center justify-between p-2.5 hover:bg-purple-500/[0.05] dark:hover:bg-white/[0.03] text-xs cursor-pointer transition-colors"
                @click="
                  bulkForm.selected_student_ids.includes(s.id)
                    ? bulkForm.selected_student_ids = bulkForm.selected_student_ids.filter(id => id !== s.id)
                    : bulkForm.selected_student_ids.push(s.id)
                "
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 shadow-2xs"
                    :class="[
                      bulkForm.selected_student_ids.includes(s.id)
                        ? 'bg-bx-primary border-bx-primary text-white shadow-xs'
                        : 'border-bx-border dark:border-white/30 bg-white dark:bg-slate-800'
                    ]"
                  >
                    <Check v-if="bulkForm.selected_student_ids.includes(s.id)" class="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div class="truncate">
                    <span class="font-bold text-bx-title block leading-tight truncate">{{ s.full_name }}</span>
                    <span v-if="s.user_code" class="text-bx-muted font-mono text-[10px] block mt-0.5">
                      الرمز: {{ s.user_code }}
                    </span>
                  </div>
                </div>

                <span
                  v-if="bulkForm.selected_student_ids.includes(s.id)"
                  class="text-[10px] font-bold text-bx-primary px-2 py-0.5 rounded-full bg-purple-500/10 shrink-0"
                >
                  تم الاختيار
                </span>
              </div>

              <div v-if="availableStudentsForBulk.length === 0" class="p-8 text-center text-bx-muted text-xs space-y-1">
                <AlertCircle class="w-7 h-7 mx-auto opacity-40 text-amber-500 mb-1" />
                <p class="font-bold text-bx-title">لا يوجد طلاب غير مسكنين متاحين</p>
                <p class="text-[11px]">كافة الطلاب مقيدون ومسكنون في شعب دراسية للعام الحالي.</p>
              </div>
            </div>

            <!-- Counter Info Bar -->
            <div class="flex items-center justify-between text-[11px] font-bold pt-1">
              <span class="text-bx-muted">المحددون للتسكين:</span>
              <span class="text-bx-primary font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                {{ bulkForm.selected_student_ids.length }} طالب
              </span>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-bx-divider">
            <button
              type="button"
              @click="showBulkModal = false"
              class="px-5 py-2 rounded-full text-xs font-bold border border-bx-border text-bx-muted hover:text-bx-title hover:bg-bx-row-hover cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="submitting || bulkForm.selected_student_ids.length === 0 || !bulkForm.class_section_id"
              @click="handleBulkEnrollSubmit"
              class="px-6 py-2 rounded-full text-xs font-bold bg-bx-primary hover:bg-bx-primary-hover text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-3.5 h-3.5" />
              <span>تسكين {{ bulkForm.selected_student_ids.length }} طلاب في الشعبة</span>
            </button>
          </div>
        </div>
      </TaqniyaDrawer>

      <!-- 📜 Student Academic Progression Drawer -->
      <TaqniyaDrawer
        :is-open="showHistoryDrawer"
        @close="showHistoryDrawer = false"
        :title="`السجل والأرشيف التسكيني — ${historyStudentName}`"
        max-width="max-w-[600px]"
      >
        <div class="space-y-4 font-sans" dir="rtl">
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
              class="p-4 rounded-2xl bg-purple-500/[0.02] border border-bx-border space-y-2"
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
        <div class="bg-bx-surface rounded-3xl border border-bx-border shadow-2xl max-w-md w-full p-6 space-y-4 font-sans text-center">
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

          <div class="flex items-center justify-center gap-2 pt-3 border-t border-bx-divider">
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

      <!-- 🔄 Batch Transfer Modal -->
      <div
        v-if="showBatchTransferModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        dir="rtl"
      >
        <div class="bg-bx-surface rounded-3xl border border-bx-border shadow-2xl max-w-lg w-full p-6 space-y-4 font-sans">
          <div class="flex items-center justify-between border-b border-bx-divider pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold">
                <ArrowLeftRight class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-black text-bx-title">نقل الطلاب المحددين إلى صف أو شعبة أخرى</h3>
                <p class="text-[11px] text-bx-muted">تم تحديد {{ selectedEnrollmentIds.length }} طالب للنقل الجماعي</p>
              </div>
            </div>
            <button @click="showBatchTransferModal = false" class="text-bx-muted hover:text-bx-title cursor-pointer text-xs font-bold p-1">✕</button>
          </div>

          <div
            v-if="batchTransferError"
            class="p-3.5 bg-rose-500/[0.08] dark:bg-rose-950/50 border border-rose-400/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 font-bold"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ batchTransferError }}</span>
          </div>

          <!-- List of Selected Students -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-bx-title">الطلاب المحددين للنقل ({{ selectedStudentsInfo.length }}):</label>
            <div class="max-h-32 overflow-y-auto p-2.5 rounded-2xl bg-purple-500/[0.02] border border-bx-border flex flex-wrap gap-1.5">
              <span
                v-for="st in selectedStudentsInfo"
                :key="st.enrollment_id"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20"
              >
                <span>{{ st.student_name }}</span>
                <span class="text-[10px] text-bx-muted font-mono">({{ st.student_code }})</span>
                <button
                  type="button"
                  @click="toggleSelectStudent(st.enrollment_id)"
                  class="text-bx-muted hover:text-rose-500 cursor-pointer text-xs ml-0.5 leading-none"
                  title="إلغاء تحديد هذا الطالب"
                >
                  ×
                </button>
              </span>
            </div>
          </div>

          <!-- Target Class & Target Section Selectors -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-[11px] font-bold text-bx-title mb-1.5">
                1. الصف الدراسي المستهدف <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="batchTransferClassId"
                :options="batchTransferClassOptions"
                placeholder="اختر الصف..."
                :icon="School"
                full-width
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-bx-title mb-1.5">
                2. الشعبة الدراسية المستهدفة <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="batchTransferSectionId"
                :options="batchTransferSectionOptions"
                :placeholder="!batchTransferClassId ? 'اختر الصف أولاً...' : batchTransferSectionOptions.length === 0 ? 'لا توجد شعب' : 'اختر الشعبة...'"
                :disabled="!batchTransferClassId || batchTransferSectionOptions.length === 0"
                :icon="GraduationCap"
                full-width
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-bx-divider">
            <button
              type="button"
              @click="showBatchTransferModal = false"
              class="px-5 py-2 rounded-full text-xs font-bold border border-bx-border text-bx-muted hover:text-bx-title hover:bg-bx-row-hover cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="batchTransferSubmitting || selectedEnrollmentIds.length === 0 || !batchTransferSectionId"
              @click="handleBatchTransferSubmit"
              class="px-6 py-2 rounded-full text-xs font-bold bg-bx-primary hover:bg-bx-primary-hover text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <Loader2 v-if="batchTransferSubmitting" class="w-4 h-4 animate-spin" />
              <span>تأكيد نقل {{ selectedEnrollmentIds.length }} طلاب</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ⚡ Floating Bottom Action Bar for Selected Students -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform translate-y-8 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-8 opacity-0"
      >
        <div
          v-if="selectedEnrollmentIds.length > 0"
          class="fixed bottom-6 inset-x-0 mx-auto max-w-xl z-40 px-4"
          dir="rtl"
        >
          <div class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-bx-primary/30 shadow-2xl p-3 px-5 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold">
                <CheckSquare class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs font-black text-bx-title">
                  تم تحديد <span class="text-bx-primary font-mono text-sm font-black">{{ selectedEnrollmentIds.length }}</span> طالب
                </p>
                <p class="text-[10px] text-bx-muted">يمكنك نقل الطلاب المحددين إلى أي صف أو شعبة أخرى دفعة واحدة</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="selectedEnrollmentIds = []"
                class="px-3 py-1.5 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title border border-bx-border hover:bg-bx-surface transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
              <button
                @click="openBatchTransferModal"
                class="px-4 py-1.5 rounded-full text-xs font-bold bg-bx-primary hover:bg-bx-primary-hover text-white flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <ArrowLeftRight class="w-3.5 h-3.5" />
                <span>نقل إلى صف أو شعبة</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </TaqniyaErrorBoundary>
</template>
