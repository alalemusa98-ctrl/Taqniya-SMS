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
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';

// Lazy-loaded Feature Components (Governed by frontend_capabilities.yaml)
const EnrollmentFormDrawer = defineAsyncComponent(
  () => import('../components/student-enrollments/EnrollmentFormDrawer.vue'),
);
const EnrollmentBulkDrawer = defineAsyncComponent(
  () => import('../components/student-enrollments/EnrollmentBulkDrawer.vue'),
);
const EnrollmentHistoryDrawer = defineAsyncComponent(
  () => import('../components/student-enrollments/EnrollmentHistoryDrawer.vue'),
);
const EnrollmentDeleteModal = defineAsyncComponent(
  () => import('../components/student-enrollments/EnrollmentDeleteModal.vue'),
);
const EnrollmentBatchTransferModal = defineAsyncComponent(
  () => import('../components/student-enrollments/EnrollmentBatchTransferModal.vue'),
);

const toast = useToast();

// Loading & Error states
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

// Section Pagination state (per section: currentPage)
const sectionPages = ref<Record<number, number>>({});
const SECTION_PAGE_SIZE = 15;

// Fast Class Counts Map
const classCountsMap = ref<Record<number, number>>({});
const enrolledStudentIds = ref<Set<number>>(new Set());

// Master Reference Data
const academicYears = ref<any[]>([]);
const rawClasses = ref<any[]>([]);
const rawSections = ref<any[]>([]);
const rawStudents = ref<Student[]>([]);

// Request cancellation & debouncing
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

const showBulkDrawer = ref(false);
const showDeleteModal = ref(false);
const enrollmentToDelete = ref<EnrolledStudent | null>(null);

// Batch Multi-Select & Transfer State
const selectedEnrollmentIds = ref<number[]>([]);
const showBatchTransferModal = ref(false);
const batchTransferClassId = ref<number | ''>('');
const batchTransferSectionId = ref<number | ''>('');
const batchTransferSubmitting = ref(false);
const batchTransferError = ref<string | null>(null);

// Form and Field Errors
const form = ref<{
  academic_year_id: number | '';
  student_id: number | '';
  class_section_id: number | '';
  seating_number: string;
  status: EnrollmentStatusType;
}>({
  academic_year_id: '',
  student_id: '',
  class_section_id: '',
  seating_number: '',
  status: 'enrolled',
});
const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);

// Bulk Form
const bulkForm = ref<{
  academic_year_id: number | '';
  class_id: number | '';
  class_section_id: number | '';
  selected_student_ids: number[];
  studentSearch: string;
}>({
  academic_year_id: '',
  class_id: '',
  class_section_id: '',
  selected_student_ids: [],
  studentSearch: '',
});
const bulkErrorMessage = ref<string | null>(null);

// --- KPI Statistics ---
const stats = computed(() => {
  const totalEnrolled = Object.values(classCountsMap.value).reduce((sum, val) => sum + val, 0);
  const totalRegistered = rawStudents.value.length;
  const unenrolledCount = Math.max(0, totalRegistered - enrolledStudentIds.value.size);
  const activeClassesCount = rawClasses.value.length;
  const totalSections = rawSections.value.length;
  const enrollmentRate = totalRegistered > 0 ? Math.min(100, Math.round((totalEnrolled / totalRegistered) * 100)) : 0;

  return {
    totalEnrolled,
    totalRegistered,
    unenrolledCount,
    activeClassesCount,
    totalSections,
    enrollmentRate,
  };
});

// Options for Dropdowns
const yearOptions = computed<TaqniyaSelectOption[]>(() => {
  return [
    { label: 'العام النشط افتراضياً', value: 'all' },
    ...academicYears.value.map((y) => ({
      label: `${y.name} ${y.is_active ? '(النشط)' : ''}`,
      value: y.id,
    })),
  ];
});

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  return [
    { label: 'كافة الصفوف الدراسية', value: 'all' },
    ...rawClasses.value.map((c) => ({
      label: `${c.name} (المستوى ${c.grade_level})`,
      value: c.id,
    })),
  ];
});

const sectionFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  let list = rawSections.value;
  if (selectedClassFilter.value !== 'all') {
    list = list.filter((s) => s.class_id === Number(selectedClassFilter.value));
  }
  return [
    { label: 'كافة الشعب الدراسية', value: 'all' },
    ...list.map((s) => ({
      label: `${s.class_name ? s.class_name + ' — ' : ''}${s.name}`,
      value: s.id,
    })),
  ];
});

const createStudentOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawStudents.value
    .filter((s) => !enrolledStudentIds.value.has(s.id))
    .map((s) => ({
      label: `${s.full_name} (${s.user_code || 'بدون رمز'})`,
      value: s.id,
      subtext: s.user_code,
    }));
});

const drawerClassOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawClasses.value.map((c) => ({
    label: `${c.name} (المستوى ${c.grade_level})`,
    value: c.id,
  }));
});

const drawerSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedDrawerClassId.value) return [];
  return rawSections.value
    .filter((s) => s.class_id === Number(selectedDrawerClassId.value))
    .map((s) => ({
      label: s.name,
      value: s.id,
    }));
});

const formStatusOptions: TaqniyaSelectOption[] = [
  { label: 'مسكن (Enrolled)', value: 'enrolled' },
  { label: 'ناجح (Passed)', value: 'passed' },
  { label: 'دور ثانٍ (Second Round)', value: 'second_round' },
  { label: 'راسب (Failed)', value: 'failed' },
  { label: 'متخرج (Graduated)', value: 'graduated' },
];

const bulkClassOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawClasses.value.map((c) => ({
    label: `${c.name} (المستوى ${c.grade_level})`,
    value: c.id,
  }));
});

const bulkSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!bulkForm.value.class_id) return [];
  return rawSections.value
    .filter((s) => s.class_id === Number(bulkForm.value.class_id))
    .map((s) => ({
      label: s.name,
      value: s.id,
    }));
});

const availableStudentsForBulk = computed(() => {
  const searchLower = bulkForm.value.studentSearch.trim().toLowerCase();
  return rawStudents.value
    .filter((s) => !enrolledStudentIds.value.has(s.id))
    .filter((s) => {
      if (!searchLower) return true;
      return (
        s.full_name.toLowerCase().includes(searchLower) ||
        (s.user_code && s.user_code.toLowerCase().includes(searchLower))
      );
    });
});

const batchTransferClassOptions = computed<TaqniyaSelectOption[]>(() => {
  return rawClasses.value.map((c) => ({
    label: `${c.name} (المستوى ${c.grade_level})`,
    value: c.id,
  }));
});

const batchTransferSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!batchTransferClassId.value) return [];
  return rawSections.value
    .filter((s) => s.class_id === Number(batchTransferClassId.value))
    .map((s) => ({
      label: s.name,
      value: s.id,
    }));
});

const selectedStudentsInfo = computed(() => {
  const list: Array<{ enrollment_id: number; student_name: string; student_code: string }> = [];
  for (const cls of classesList.value) {
    for (const sec of cls.sections) {
      for (const st of sec.students) {
        if (selectedEnrollmentIds.value.includes(st.enrollment_id)) {
          list.push({
            enrollment_id: st.enrollment_id,
            student_name: st.student_name,
            student_code: st.student_code,
          });
        }
      }
    }
  }
  return list;
});

const hasActiveFilters = computed(() => {
  return (
    (selectedClassFilter.value && selectedClassFilter.value !== 'all') ||
    (selectedSectionFilter.value && selectedSectionFilter.value !== 'all') ||
    (selectedYearFilter.value && selectedYearFilter.value !== 'all') ||
    (statusFilter.value && statusFilter.value !== 'all') ||
    search.value.trim().length > 0
  );
});

// Filtered list of classes
const displayClassesList = computed(() => {
  if (selectedClassFilter.value !== 'all') {
    return classesList.value.filter((c) => c.class_id === Number(selectedClassFilter.value));
  }
  return classesList.value;
});

// Paginated students per section
const getPaginatedStudents = (sec: any) => {
  const page = sectionPages.value[sec.class_section_id] || 1;
  const start = (page - 1) * SECTION_PAGE_SIZE;
  return sec.students.slice(start, start + SECTION_PAGE_SIZE);
};

const getSectionTotalPages = (sec: any) => {
  return Math.max(1, Math.ceil(sec.students.length / SECTION_PAGE_SIZE));
};

const handleSectionPageChange = (sectionId: number, page: number) => {
  sectionPages.value[sectionId] = page;
};

// Batch Multi-Select helpers
const toggleSelectStudent = (enrollmentId: number) => {
  const idx = selectedEnrollmentIds.value.indexOf(enrollmentId);
  if (idx > -1) {
    selectedEnrollmentIds.value.splice(idx, 1);
  } else {
    selectedEnrollmentIds.value.push(enrollmentId);
  }
};

const isSectionAllSelected = (students: EnrolledStudent[]) => {
  if (students.length === 0) return false;
  return students.every((st) => selectedEnrollmentIds.value.includes(st.enrollment_id));
};

const isSectionPartiallySelected = (students: EnrolledStudent[]) => {
  if (students.length === 0) return false;
  const count = students.filter((st) => selectedEnrollmentIds.value.includes(st.enrollment_id)).length;
  return count > 0 && count < students.length;
};

const toggleSelectAllSection = (students: EnrolledStudent[]) => {
  if (isSectionAllSelected(students)) {
    const studentIds = new Set(students.map((st) => st.enrollment_id));
    selectedEnrollmentIds.value = selectedEnrollmentIds.value.filter((id) => !studentIds.has(id));
  } else {
    for (const st of students) {
      if (!selectedEnrollmentIds.value.includes(st.enrollment_id)) {
        selectedEnrollmentIds.value.push(st.enrollment_id);
      }
    }
  }
};

// Reset Filters
const resetFilters = () => {
  search.value = '';
  statusFilter.value = 'all';
  selectedYearFilter.value = 'all';
  selectedClassFilter.value = 'all';
  selectedSectionFilter.value = 'all';
  refreshActiveSections();
};

// Fetch Metadata
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

// Fetch class counts
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

// Init classes and sections structure
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

// Handle section toggle & lazy load
const handleSectionClick = async (classId: number, sectionId: number, forceRefresh = false) => {
  if (!forceRefresh && activeSectionPerClass.value[classId] === sectionId) {
    delete activeSectionPerClass.value[classId];
    return;
  }

  activeSectionPerClass.value[classId] = sectionId;
  const cls = classesList.value.find((c) => c.class_id === classId);
  const sec = cls?.sections.find((s: any) => s.class_section_id === sectionId);

  if (sec && (sec as any).isLoaded && !forceRefresh) {
    return;
  }

  if (sec) (sec as any).isLoading = true;
  try {
    const params: any = {
      class_id: classId,
      class_section_id: sectionId,
    };
    if (selectedYearFilter.value !== 'all') {
      params.academic_year_id = Number(selectedYearFilter.value);
    }
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }
    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    const res = await studentEnrollmentsApi.getEnrollmentsMatrix(params);
    const matrixClasses = res.data?.data?.classes || [];
    const serverClass = matrixClasses.find((c: any) => c.class_id === classId);
    const serverSection = serverClass?.sections.find((s: any) => s.class_section_id === sectionId);

    if (sec) {
      sec.students = serverSection ? serverSection.students : [];
      sec.enrolled_count = serverSection ? serverSection.enrolled_count : 0;
      (sec as any).isLoaded = true;
      (sec as any).isLoading = false;
    }
  } catch (err) {
    console.error('Failed to load section students:', err);
    if (sec) (sec as any).isLoading = false;
  }
};

const refreshActiveSections = async () => {
  await fetchClassCounts();
  for (const [classIdStr, sectionId] of Object.entries(activeSectionPerClass.value)) {
    await handleSectionClick(Number(classIdStr), Number(sectionId), true);
  }
};

// Drawer Handlers
const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeEnrollmentId.value = null;
  activeStudentForDrawer.value = null;
  currentSectionInfo.value = null;

  const firstClassId = rawClasses.value[0]?.id || '';
  selectedDrawerClassId.value = firstClassId;

  const initialSections = rawSections.value.filter((s) => s.class_id === Number(firstClassId));
  const firstSectionId = initialSections[0]?.id || '';

  const unenrolledStudents = rawStudents.value.filter((s) => !enrolledStudentIds.value.has(s.id));
  const defaultStudentId = unenrolledStudents[0]?.id || '';

  form.value = {
    academic_year_id: academicYearId.value || academicYears.value[0]?.id || '',
    student_id: defaultStudentId,
    class_section_id: firstSectionId,
    seating_number: '',
    status: 'enrolled',
  };

  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
};

const openEditDrawer = (student: EnrolledStudent, classItem: ClassWithSections, sectionItem: any) => {
  drawerMode.value = 'edit';
  activeEnrollmentId.value = student.enrollment_id;
  activeStudentForDrawer.value = student;
  currentSectionInfo.value = {
    className: classItem.class_name,
    sectionName: sectionItem.section_name,
  };

  selectedDrawerClassId.value = classItem.class_id;

  form.value = {
    academic_year_id: academicYearId.value || '',
    student_id: student.student_id,
    class_section_id: sectionItem.class_section_id,
    seating_number: student.seating_number || '',
    status: student.status,
  };

  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
};

const handleSaveEnrollment = async () => {
  fieldErrors.value = {};
  formErrorMessage.value = null;
  submitting.value = true;

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

// Bulk Drawer
const openBulkDrawer = () => {
  const firstClassId = rawClasses.value[0]?.id || '';
  const initialSections = rawSections.value.filter((s) => s.class_id === Number(firstClassId));
  bulkForm.value = {
    academic_year_id: academicYearId.value || academicYears.value[0]?.id || '',
    class_id: firstClassId,
    class_section_id: initialSections[0]?.id || '',
    selected_student_ids: [],
    studentSearch: '',
  };
  bulkErrorMessage.value = null;
  showBulkDrawer.value = true;
};

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
    showBulkDrawer.value = false;
    await refreshActiveSections();
  } catch (err: any) {
    bulkErrorMessage.value = err.response?.data?.message || 'فشل التسكين الجماعي للطلاب.';
    toast.error(bulkErrorMessage.value || 'خطأ بالتسكين الجماعي');
  } finally {
    submitting.value = false;
  }
};

// History Drawer
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

// Delete Modal
const confirmDelete = (student: EnrolledStudent) => {
  enrollmentToDelete.value = student;
  showDeleteModal.value = true;
};

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

// Batch Transfer Modal
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

    const promises = selectedEnrollmentIds.value.map((id) =>
      studentEnrollmentsApi.updateEnrollment(id, {
        class_section_id: targetSectionId,
      }),
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

// Watchers
watch(search, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    refreshActiveSections();
  }, 350);
});

watch([statusFilter, selectedSectionFilter], () => {
  refreshActiveSections();
});

onMounted(async () => {
  await loadMetadata();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        
        <!-- Header Ribbon: Title & Top Controls -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
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

          <!-- Controls: Action Buttons + Pill Search + Status Filters -->
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
              @click="openBulkDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>تسكين جماعي</span>
            </button>

            <!-- Pill Search -->
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

        <!-- 2. KPI Metrics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
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
          <TaqniyaKpiCard
            title="الصفوف الدراسية"
            :value="`${stats.activeClassesCount} صف`"
            :icon="Layers"
            variant="blue"
            badge-text="المستويات الأكاديمية"
            :badge-icon="TrendingUp"
            :progress="100"
          />
          <TaqniyaKpiCard
            title="الشعب الدراسية"
            :value="`${stats.totalSections} شعبة`"
            :icon="School"
            variant="emerald"
            badge-text="الطاقة الاستيعابية"
            :badge-icon="TrendingUp"
            :progress="100"
          />
          <TaqniyaKpiCard
            title="بانتظار التسكين"
            :value="`${stats.unenrolledCount} طالب`"
            :icon="User"
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
                  <h3 class="text-sm font-black text-bx-title flex items-center gap-2 font-display">
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

              <!-- Quick Batch Action Button -->
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

            <!-- Empty guide when no section is active -->
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

            <!-- Active Section Students Table Container -->
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
                      <!-- Select All Checkbox -->
                      <th class="py-3 px-3 text-center w-12 border-e border-bx-divider">
                        <div class="flex items-center justify-center">
                          <button
                            type="button"
                            role="checkbox"
                            :aria-checked="isSectionAllSelected(sec.students) ? 'true' : isSectionPartiallySelected(sec.students) ? 'mixed' : 'false'"
                            @click="toggleSelectAllSection(sec.students)"
                            class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
                            :class="[
                              isSectionAllSelected(sec.students) || isSectionPartiallySelected(sec.students)
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
                      v-for="(st, idx) in getPaginatedStudents(sec)"
                      :key="st.enrollment_id"
                      :class="[
                        'transition-colors duration-150 group',
                        selectedEnrollmentIds.includes(st.enrollment_id)
                          ? 'bg-purple-500/[0.08] dark:bg-purple-900/20'
                          : 'hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02]'
                      ]"
                    >
                      <!-- Checkbox -->
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

                      <!-- Index -->
                      <td class="py-3 px-4 text-start font-mono text-bx-muted border-e border-bx-divider">
                        {{ ((sectionPages[sec.class_section_id] || 1) - 1) * SECTION_PAGE_SIZE + Number(idx) + 1 }}
                      </td>

                      <!-- Code -->
                      <td class="py-3 px-4 text-start border-e border-bx-divider">
                        <span class="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.08] text-bx-primary border border-purple-500/20">
                          {{ st.student_code }}
                        </span>
                      </td>

                      <!-- Name -->
                      <td class="py-3 px-4 font-black text-bx-title text-start border-e border-bx-divider">
                        {{ st.student_name }}
                      </td>

                      <!-- Seating Number -->
                      <td class="py-3 px-4 text-start border-e border-bx-divider">
                        <span
                          v-if="st.seating_number"
                          class="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        >
                          {{ st.seating_number }}
                        </span>
                        <span v-else class="text-bx-muted font-mono text-[11px]">—</span>
                      </td>

                      <!-- Row Actions -->
                      <td class="py-3 px-4 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <button
                            @click="openHistoryDrawer(st)"
                            class="p-1.5 rounded-xl border border-bx-border text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-purple-500/10 transition cursor-pointer"
                            title="السجل التسكيني التاريخي"
                          >
                            <History class="w-3.5 h-3.5" />
                          </button>
                          <button
                            @click="openEditDrawer(st, cls, sec)"
                            class="p-1.5 rounded-xl border border-bx-border text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-purple-500/10 transition cursor-pointer"
                            title="نقل الشعبة وتعديل بيانات التسكين"
                          >
                            <Edit2 class="w-3.5 h-3.5" />
                          </button>
                          <button
                            @click="confirmDelete(st)"
                            class="p-1.5 rounded-xl border border-bx-border text-bx-muted hover:text-rose-600 hover:border-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="إلغاء التسكين وتجريد الطالب"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Incremental Pagination per section -->
                <TaqniyaPagination
                  v-if="sec.students.length > SECTION_PAGE_SIZE"
                  :current-page="sectionPages[sec.class_section_id] || 1"
                  :total-pages="getSectionTotalPages(sec)"
                  :total="sec.students.length"
                  item-name="طالب"
                  @page-change="(p) => handleSectionPageChange(sec.class_section_id, p)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 📋 Single Enrollment Drawer (Extracted Component) -->
      <EnrollmentFormDrawer
        :is-open="showDrawer"
        :mode="drawerMode"
        :form="form"
        :student-options="createStudentOptions"
        :class-options="drawerClassOptions"
        :section-options="drawerSectionOptions"
        :status-options="formStatusOptions"
        :selected-class-id="selectedDrawerClassId"
        :active-student="activeStudentForDrawer"
        :current-section-info="currentSectionInfo"
        :field-errors="fieldErrors"
        :error-message="formErrorMessage"
        :submitting="submitting"
        @close="showDrawer = false"
        @submit="handleSaveEnrollment"
        @update:selected-class-id="(val) => (selectedDrawerClassId = val)"
      />

      <!-- ⚡ Bulk Enroll Drawer (Extracted Component) -->
      <EnrollmentBulkDrawer
        :is-open="showBulkDrawer"
        :class-options="bulkClassOptions"
        :section-options="bulkSectionOptions"
        :available-students="availableStudentsForBulk"
        :selected-class-id="bulkForm.class_id"
        :selected-section-id="bulkForm.class_section_id"
        :selected-student-ids="bulkForm.selected_student_ids"
        :student-search="bulkForm.studentSearch"
        :error-message="bulkErrorMessage"
        :submitting="submitting"
        @close="showBulkDrawer = false"
        @submit="handleBulkEnrollSubmit"
        @update:selected-class-id="(val) => (bulkForm.class_id = val)"
        @update:selected-section-id="(val) => (bulkForm.class_section_id = val)"
        @update:selected-student-ids="(val) => (bulkForm.selected_student_ids = val)"
        @update:student-search="(val) => (bulkForm.studentSearch = val)"
      />

      <!-- 📜 Student Progression Drawer (Extracted Component) -->
      <EnrollmentHistoryDrawer
        :is-open="showHistoryDrawer"
        :student-name="historyStudentName"
        :history-items="historyItems"
        :loading="historyLoading"
        @close="showHistoryDrawer = false"
      />

      <!-- 🗑️ Delete Confirmation Modal (Extracted Component wrapping TaqniyaModal) -->
      <EnrollmentDeleteModal
        :is-open="showDeleteModal"
        :student="enrollmentToDelete"
        :submitting="submitting"
        @close="showDeleteModal = false"
        @confirm="handleDeleteEnrollment"
      />

      <!-- 🔄 Batch Transfer Modal (Extracted Component wrapping TaqniyaModal) -->
      <EnrollmentBatchTransferModal
        :is-open="showBatchTransferModal"
        :selected-enrollment-ids="selectedEnrollmentIds"
        :selected-students-info="selectedStudentsInfo"
        :class-options="batchTransferClassOptions"
        :section-options="batchTransferSectionOptions"
        :selected-class-id="batchTransferClassId"
        :selected-section-id="batchTransferSectionId"
        :error-message="batchTransferError"
        :submitting="batchTransferSubmitting"
        @close="showBatchTransferModal = false"
        @submit="handleBatchTransferSubmit"
        @toggle-student="toggleSelectStudent"
        @update:selected-class-id="(val) => (batchTransferClassId = val)"
        @update:selected-section-id="(val) => (batchTransferSectionId = val)"
      />

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
