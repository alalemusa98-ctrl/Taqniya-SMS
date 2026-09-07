<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Save,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Filter,
  RotateCcw,
  Calendar,
} from 'lucide-vue-next';
import {
  teachingAssignmentsApi,
  type TeachingAssignmentsHierarchy,
  type AssignmentItem,
  type PaginationMeta,
  type TeacherWorkloadItem,
} from '../api/teaching-assignments.api';
import { teachersApi, type Teacher } from '../api/teachers.api';
import { academicApi } from '../api/academic.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));

const toast = useToast();

// State
const hierarchyData = ref<TeachingAssignmentsHierarchy | null>(null);
const meta = ref<PaginationMeta>({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const loading = ref(false);
const isSubmitting = ref(false);

// Filter Form Inputs (Draft - Non-immediate)
const search = ref('');
const selectedYearId = ref<number>(0);
const selectedClassFilter = ref<number | string>('all');
const selectedTeacherFilter = ref<number | string>('all');

// Applied Filter Values (Triggered explicitly by button / Enter)
const appliedSearch = ref('');
const appliedYearId = ref<number>(0);
const appliedClassFilter = ref<number | string>('all');
const appliedTeacherFilter = ref<number | string>('all');

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

const currentPage = ref(1);


// Metadata for selects
const academicYears = ref<any[]>([]);
const allClasses = ref<any[]>([]);
const allSections = ref<any[]>([]);
const allSubjects = ref<any[]>([]);
const allTeachers = ref<Teacher[]>([]);
const allClassSections = ref<any[]>([]);
const rawClassSubjects = ref<any[]>([]);

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeAssignmentId = ref<number | null>(null);

// Teacher Workload Drawer
const showWorkloadDrawer = ref(false);
const selectedWorkloadTeacher = ref<Teacher | null>(null);
const teacherWorkload = ref<TeacherWorkloadItem[]>([]);
const loadingWorkload = ref(false);

// Form State
const form = ref({
  academic_year_id: 0,
  class_id: 0,
  class_section_id: 0,
  subject_id: 0,
  teacher_id: 0,
});
const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);

// Delete Modal State
const showDeleteModal = ref(false);
const assignmentToDelete = ref<AssignmentItem | null>(null);
const isDeleting = ref(false);
const deleteErrorMessage = ref<string | null>(null);

// Matrix Interfaces
export interface ClassMatrixSubjectRow {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  assignmentsBySection: Record<number, AssignmentItem>;
  assignedCount: number;
  totalSections: number;
}

export interface ClassMatrixGroup {
  class_id: number;
  class_name: string;
  sections: {
    class_section_id: number;
    section_name: string;
  }[];
  subjects: ClassMatrixSubjectRow[];
  totalAssignmentsCount: number;
}

// Fetch Initial Meta Options
async function fetchPrerequisites() {
  try {
    const [yearsRes, classesRes, sectionsRes, subjectsRes, teachersRes, classSectionsRes, classSubjectsRes] = await Promise.all([
      academicApi.getYears({ per_page: 50 }),
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getSections({ per_page: 100 }),
      academicApi.getSubjects({ per_page: 100 }),
      teachersApi.getTeachers({ per_page: 200, is_active: 1 }),
      academicApi.getClassSections({ per_page: 200 }),
      academicApi.getClassSubjects({ per_page: 100 }).catch(() => ({ data: { data: { classes: [] } } })),
    ]);

    academicYears.value = yearsRes.data?.data || [];
    allClasses.value = classesRes.data?.data || [];
    allSections.value = sectionsRes.data?.data || [];
    allSubjects.value = subjectsRes.data?.data || [];
    allTeachers.value = teachersRes.data?.data || [];
    rawClassSubjects.value = classSubjectsRes.data?.data?.classes || classSubjectsRes.data?.data || [];

    // Extract class-sections list from grouped response (data.classes -> sections)
    const groupedClasses = classSectionsRes.data?.data?.classes || [];
    const flattened: any[] = [];
    for (const gc of groupedClasses) {
      if (gc.sections && Array.isArray(gc.sections)) {
        for (const s of gc.sections) {
          flattened.push({
            id: s.id,
            class_id: gc.class_id,
            class_name: gc.class_name,
            section_id: s.section_id,
            name: s.name,
          });
        }
      }
    }
    allClassSections.value = flattened;

    // Set default active academic year
    const activeY = academicYears.value.find((y) => y.is_active === 1) || academicYears.value[0];
    if (activeY) {
      selectedYearId.value = activeY.id;
      appliedYearId.value = activeY.id;
      form.value.academic_year_id = activeY.id;
    }
  } catch (err) {
    console.error('Failed to load prerequisites:', err);
  }
}

// Fetch Assignments Hierarchy with Request Cancellation & Applied Filters
async function fetchAssignments() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      per_page: 15,
    };
    if (appliedYearId.value) params.academic_year_id = appliedYearId.value;
    if (appliedClassFilter.value !== 'all') params.class_id = appliedClassFilter.value;
    if (appliedSearch.value.trim()) params.search = appliedSearch.value.trim();

    const res = await teachingAssignmentsApi.getAll(params, activeAbortController.signal);
    hierarchyData.value = res.data.data;
    meta.value = res.data.meta;
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
      return;
    }
    const msg = err.response?.data?.message || 'تعذر تحميل كشوفات إسناد التدريس.';
    toast.error(msg);
  } finally {
    if (!activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
}

// Active Academic Year (Always prioritize active year)
const activeAcademicYear = computed(() => {
  return academicYears.value.find((y) => y.is_active === 1) || academicYears.value[0];
});

// Explicit Filter Execution (Non-immediate, triggered by filter button or Enter)
function applyFilters() {
  appliedSearch.value = search.value.trim();
  const activeY = activeAcademicYear.value || academicYears.value[0];
  if (activeY) {
    selectedYearId.value = activeY.id;
    appliedYearId.value = activeY.id;
  }
  appliedClassFilter.value = selectedClassFilter.value;
  appliedTeacherFilter.value = selectedTeacherFilter.value;
  currentPage.value = 1;
  fetchAssignments();
}

function resetFilters() {
  search.value = '';
  appliedSearch.value = '';
  selectedClassFilter.value = 'all';
  appliedClassFilter.value = 'all';
  selectedTeacherFilter.value = 'all';
  appliedTeacherFilter.value = 'all';
  const activeY = activeAcademicYear.value || academicYears.value[0];
  if (activeY) {
    selectedYearId.value = activeY.id;
    appliedYearId.value = activeY.id;
  }
  currentPage.value = 1;
  fetchAssignments();
}

const hasActiveFilters = computed(() => {
  return (
    appliedSearch.value.trim() !== '' ||
    appliedClassFilter.value !== 'all' ||
    appliedTeacherFilter.value !== 'all'
  );
});

// Watch only pagination changes
watch(currentPage, () => {
  fetchAssignments();
});


// Options mappings
const yearOptions = computed<TaqniyaSelectOption[]>(() =>
  academicYears.value.map((y) => ({
    value: y.id,
    label: `${y.name} ${y.is_active === 1 ? '(النشط)' : ''}`,
  })),
);

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { value: 'all', label: 'كافة الصفوف الدراسية' },
  ...allClasses.value.map((c) => ({
    value: c.id,
    label: c.name,
  })),
]);

const teacherFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { value: 'all', label: 'كافة أعضاء الكادر التعليمي' },
  ...allTeachers.value.map((t) => ({
    value: t.id,
    label: `${t.full_name} (${t.user_code})`,
    subtext: t.specialization || undefined,
  })),
]);

// Sections available for the chosen class in form
const availableClassSections = computed<TaqniyaSelectOption[]>(() => {
  if (!form.value.class_id) return [];
  const matches = allClassSections.value.filter(
    (cs) => Number(cs.class_id) === Number(form.value.class_id),
  );
  return matches.map((cs) => ({
    value: cs.id,
    label: cs.name || `شعبة #${cs.id}`,
  }));
});

// Watch class_id change in form: auto-select first available section or reset
watch(
  () => form.value.class_id,
  (newClassId) => {
    if (!newClassId) {
      form.value.class_section_id = 0;
      return;
    }
    const available = allClassSections.value.filter(
      (cs) => Number(cs.class_id) === Number(newClassId),
    );
    if (available.length > 0) {
      const stillValid = available.some((a) => a.id === form.value.class_section_id);
      if (!stillValid) {
        form.value.class_section_id = available[0].id;
      }
    } else {
      form.value.class_section_id = 0;
    }
  },
);

const formSubjectOptions = computed<TaqniyaSelectOption[]>(() =>
  allSubjects.value.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  })),
);

const formTeacherOptions = computed<TaqniyaSelectOption[]>(() =>
  allTeachers.value.map((t) => ({
    value: t.id,
    label: `${t.full_name} (${t.user_code})`,
    subtext: t.specialization || undefined,
  })),
);

// Drawer Openers
function openCreateDrawer(classId?: number, sectionId?: number, subjectId?: number) {
  drawerMode.value = 'create';
  activeAssignmentId.value = null;

  const targetClassId = classId || allClasses.value[0]?.id || 0;
  const availableForClass = allClassSections.value.filter(
    (cs) => Number(cs.class_id) === Number(targetClassId),
  );
  const targetSectionId = sectionId || availableForClass[0]?.id || 0;
  const targetSubjectId = subjectId || allSubjects.value[0]?.id || 0;

  form.value = {
    academic_year_id: selectedYearId.value || academicYears.value[0]?.id || 0,
    class_id: targetClassId,
    class_section_id: targetSectionId,
    subject_id: targetSubjectId,
    teacher_id: allTeachers.value[0]?.id || 0,
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

// Compute Class Assignment Matrix Groups (One Table per Class with Dynamic Columns for Sections)
const classMatrixGroups = computed<ClassMatrixGroup[]>(() => {
  if (!hierarchyData.value?.classes) return [];

  return hierarchyData.value.classes.map((cls) => {
    // 1. Gather all sections for this class
    const sections = (cls.sections || []).map((s) => ({
      class_section_id: s.class_section_id,
      section_name: s.section_name,
    }));

    // 2. Gather all distinct subjects from curriculum + existing assignments
    const subjectsMap = new Map<number, { id: number; name: string; code: string }>();

    // From curriculum
    const currClass = rawClassSubjects.value.find((c: any) => c.class_id === cls.class_id);
    if (currClass && currClass.terms) {
      for (const t of currClass.terms) {
        for (const sub of t.subjects || []) {
          if (!subjectsMap.has(sub.subject_id)) {
            subjectsMap.set(sub.subject_id, {
              id: sub.subject_id,
              name: sub.name,
              code: sub.code || `SUB-${sub.subject_id}`,
            });
          }
        }
      }
    }

    // From existing assignments in all sections of this class
    for (const sec of cls.sections || []) {
      for (const asgn of sec.assignments || []) {
        if (!subjectsMap.has(asgn.subject_id)) {
          subjectsMap.set(asgn.subject_id, {
            id: asgn.subject_id,
            name: asgn.subject_name,
            code: asgn.subject_code || `SUB-${asgn.subject_id}`,
          });
        }
      }
    }

    // Build assignment lookup: [subject_id][class_section_id] -> AssignmentItem
    const assignmentLookup: Record<number, Record<number, AssignmentItem>> = {};
    let totalAssignmentsCount = 0;

    for (const sec of cls.sections || []) {
      for (const asgn of sec.assignments || []) {
        if (!assignmentLookup[asgn.subject_id]) {
          assignmentLookup[asgn.subject_id] = {};
        }
        assignmentLookup[asgn.subject_id][sec.class_section_id] = asgn;
        totalAssignmentsCount++;
      }
    }

    // Build subject rows
    let subjectList = Array.from(subjectsMap.values());

    // Filter if text search or teacher filter is active (using explicitly applied values)
    const searchVal = appliedSearch.value.trim().toLowerCase();
    const hasTeacherFilter = appliedTeacherFilter.value !== 'all';

    if (searchVal || hasTeacherFilter) {
      subjectList = subjectList.filter((sub) => {
        const asgns = assignmentLookup[sub.id] || {};
        const assignmentsList = Object.values(asgns);

        // Teacher filter: Subject MUST have the selected teacher assigned in at least one section
        if (hasTeacherFilter) {
          const matchTeacher = assignmentsList.some(
            (a) => Number(a.teacher_id) === Number(appliedTeacherFilter.value),
          );
          if (!matchTeacher) return false;
        }

        // Search filter:
        if (searchVal) {
          const matchSub =
            sub.name.toLowerCase().includes(searchVal) ||
            sub.code.toLowerCase().includes(searchVal);
          const matchAnyTeacher = assignmentsList.some(
            (a) =>
              a.teacher_name.toLowerCase().includes(searchVal) ||
              a.teacher_code.toLowerCase().includes(searchVal),
          );
          const matchClass = cls.class_name.toLowerCase().includes(searchVal);
          if (!matchSub && !matchAnyTeacher && !matchClass) return false;
        }

        return true;
      });
    }

    const subjectRows: ClassMatrixSubjectRow[] = subjectList.map((sub) => {
      const sectionAssignments = assignmentLookup[sub.id] || {};
      const assignedCount = Object.keys(sectionAssignments).length;
      return {
        subject_id: sub.id,
        subject_name: sub.name,
        subject_code: sub.code,
        assignmentsBySection: sectionAssignments,
        assignedCount,
        totalSections: sections.length,
      };
    });

    return {
      class_id: cls.class_id,
      class_name: cls.class_name,
      sections,
      subjects: subjectRows,
      totalAssignmentsCount,
    };
  });
});

const filteredClassMatrixGroups = computed(() => {
  const searchVal = appliedSearch.value.trim().toLowerCase();
  const hasTeacherFilter = appliedTeacherFilter.value !== 'all';

  if (searchVal || hasTeacherFilter) {
    return (classMatrixGroups.value || []).filter((g) => (g.subjects?.length || 0) > 0);
  }
  return classMatrixGroups.value || [];
});

function openEditDrawer(assignment: AssignmentItem, classId: number, sectionId: number) {
  drawerMode.value = 'edit';
  activeAssignmentId.value = assignment.id;
  form.value = {
    academic_year_id: selectedYearId.value,
    class_id: classId,
    class_section_id: sectionId,
    subject_id: assignment.subject_id,
    teacher_id: assignment.teacher_id,
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

// Workload Drawer
async function openWorkloadDrawer(teacherId: number) {
  const teacher = allTeachers.value.find((t) => t.id === teacherId);
  selectedWorkloadTeacher.value = teacher || null;
  showWorkloadDrawer.value = true;
  loadingWorkload.value = true;
  try {
    const res = await teachingAssignmentsApi.getTeacherAssignments(teacherId, {
      academic_year_id: selectedYearId.value,
    });
    teacherWorkload.value = res.data.data;
  } catch (err: any) {
    toast.error('تعذر جلب النصاب التدريسي للمعلم.');
  } finally {
    loadingWorkload.value = false;
  }
}

// Submit Form
async function handleSubmit() {
  fieldErrors.value = {};
  formErrorMessage.value = null;

  if (!form.value.class_section_id) {
    toast.warning('يرجى اختيار الشعبة الدراسية.');
    return;
  }
  if (!form.value.subject_id) {
    toast.warning('يرجى اختيار المادة التعليمية.');
    return;
  }
  if (!form.value.teacher_id) {
    toast.warning('يرجى اختيار المعلم المكلف.');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      academic_year_id: form.value.academic_year_id,
      class_section_id: form.value.class_section_id,
      subject_id: form.value.subject_id,
      teacher_id: form.value.teacher_id,
    };

    if (drawerMode.value === 'create') {
      const res = await teachingAssignmentsApi.create(payload);
      toast.success(res.data.message || 'تم إسناد تدريس المادة للمعلم بنجاح.');
    } else if (activeAssignmentId.value) {
      const res = await teachingAssignmentsApi.update(activeAssignmentId.value, payload);
      toast.success(res.data.message || 'تم تحديث وتعديل إسناد التدريس بنجاح.');
    }

    showDrawer.value = false;
    await fetchAssignments();
  } catch (err: any) {
    const statusCode = err.response?.status;
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ الإسناد.';

    if (statusCode === 409) {
      formErrorMessage.value = msg;
      toast.error(msg);
    } else if (statusCode === 422 && err.response?.data?.errors) {
      fieldErrors.value = err.response.data.errors;
      toast.error('بيانات الإسناد غير مكتملة.');
    } else {
      formErrorMessage.value = msg;
      toast.error(msg);
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Delete Handlers
function confirmDelete(assignment: AssignmentItem) {
  assignmentToDelete.value = assignment;
  deleteErrorMessage.value = null;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!assignmentToDelete.value) return;
  isDeleting.value = true;
  deleteErrorMessage.value = null;

  try {
    const res = await teachingAssignmentsApi.delete(assignmentToDelete.value.id);
    toast.success(res.data.message || 'تم فك وإلغاء إسناد التدريس بنجاح.');
    showDeleteModal.value = false;
    assignmentToDelete.value = null;
    await fetchAssignments();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر فك إسناد التدريس.';
    deleteErrorMessage.value = msg;
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

onMounted(async () => {
  await fetchPrerequisites();
  await fetchAssignments();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
    <!-- Top Container Card -->
    <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
      <!-- Card Header: Title on Right, Controls & Filters on Left -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
        <!-- Title -->
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
              كشوفات إسناد التدريس والنصاب الأكاديمي
            </h2>
            <span
              v-if="activeAcademicYear"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-xs"
            >
              <Calendar class="w-3.5 h-3.5" />
              <span>العام الدراسي النشط: {{ activeAcademicYear.name }}</span>
            </span>
          </div>
          <p class="text-xs text-bx-muted font-medium mt-1">
            إدارة توزيع وتكليف المعلمين بالمواد المقررة لكل شعبة، وفحص النصاب والقيود الأكاديمية
          </p>
        </div>

        <!-- Controls: Add Button + Manual Search -->
        <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <!-- Add Button -->
          <button
            @click="openCreateDrawer()"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>+ إسناد تدريس جديد</span>
          </button>

          <!-- Search Input with Explicit Search Trigger -->
          <div class="relative flex-1 sm:w-72 flex items-center gap-1.5">
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                @keydown.enter="applyFilters"
                type="text"
                placeholder="بحث باسم المعلم أو المادة أو الشعبة..."
                class="w-full pr-10 pl-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
              />
            </div>
            <button
              @click="applyFilters"
              :disabled="loading"
              class="h-8 px-3 rounded-full bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="بحث فوري (أو اضغط Enter)"
            >
              <Search class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Bar: Class & Teacher Filters + Action Buttons -->
      <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] mb-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-bx-muted mb-1">تصفية حسب الصف الدراسي</label>
            <TaqniyaSelect
              v-model="selectedClassFilter"
              :options="classFilterOptions"
              placeholder="كافة الصفوف..."
              full-width
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-bx-muted mb-1">تصفية حسب المعلم</label>
            <TaqniyaSelect
              v-model="selectedTeacherFilter"
              :options="teacherFilterOptions"
              placeholder="كافة المعلمين..."
              full-width
            />
          </div>
        </div>

        <!-- Filter Action Toolbar: Apply Button, Reset Button, and Active Filter Indicator -->
        <div class="pt-3 border-t border-[#B4AED8]/40 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <!-- Apply Filters Button -->
            <button
              type="button"
              @click="applyFilters"
              :disabled="loading"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              <Filter class="w-3.5 h-3.5" />
              <span>تطبيق التصفية</span>
            </button>

            <!-- Reset Filters Button -->
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

          <!-- Active Filter Indicator Badge -->
          <div v-if="hasActiveFilters" class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
            <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
            <span>يتم تطبيق فلاتر مخصصة (انقر تطبيق بعد التعديل)</span>
          </div>
        </div>
      </div>


      <!-- Loading State -->
      <div v-if="loading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
        <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
        <span class="text-xs font-bold">جاري تحميل كشوفات إسناد التدريس...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!filteredClassMatrixGroups || filteredClassMatrixGroups.length === 0"
        class="py-14 text-center space-y-3 rounded-2xl border border-dashed border-[#B4AED8] dark:border-white/[0.12] p-8"
      >
        <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-bx-primary flex items-center justify-center mx-auto">
          <BookOpen class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-bold text-bx-title">لا توجد إسنادات تدريس مسجلة تطابق محددات البحث</h3>
        <p class="text-xs text-bx-muted max-w-sm mx-auto">
          يمكنك البدء بتكليف المعلمين وتوزيع المواد على الشُعب الدراسية للعام الدراسي المعتمد.
        </p>
        <button
          @click="openCreateDrawer()"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>إسناد أول مادة الآن</span>
        </button>
      </div>

      <!-- Hierarchical Classes Matrix List: Each Class has its own unified Table with dynamic columns for Sections -->
      <div v-else class="space-y-6">
        <div
          v-for="grp in filteredClassMatrixGroups"
          :key="grp.class_id"
          class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs"
        >
          <!-- Class Header Bar -->
          <div class="bg-purple-500/[0.05] dark:bg-white/[0.03] py-3.5 px-5 border-b border-[#B4AED8] dark:border-white/[0.12] flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-bx-primary"></span>
              <h3 class="font-black text-sm text-bx-title font-display">{{ grp.class_name }}</h3>
              <span class="text-[11px] font-semibold text-bx-muted px-2.5 py-0.5 rounded-full border border-[#B4AED8]/60 dark:border-white/10 bg-[var(--bx-surface-solid)]">
                {{ grp.sections?.length || 0 }} شُعب دراسية
              </span>
              <span class="text-[11px] font-bold text-bx-primary px-2.5 py-0.5 rounded-full border border-bx-primary/20 bg-bx-primary/10">
                {{ grp.totalAssignmentsCount }} إسنادات مسجلة
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="openCreateDrawer(grp.class_id)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-bx-primary dark:text-purple-300 hover:bg-bx-primary hover:text-white hover:border-bx-primary text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="إسناد مادة لهذا الصف الدراسي"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>إسناد مادة لهذا الصف</span>
              </button>
            </div>
          </div>

          <!-- If class has no sections -->
          <div v-if="!grp.sections || grp.sections.length === 0" class="p-8 text-center text-xs text-bx-muted space-y-2">
            <AlertCircle class="w-8 h-8 text-amber-500 mx-auto opacity-70" />
            <p class="font-bold text-bx-title">لم يتم تسجيل شُعب دراسية لهذا الصف حتى الآن</p>
            <p class="text-[11px]">يرجى إضافة شُعب دراسية في تبويب الهيكل الأكاديمي لتتمكن من توزيع الكادر التعليمي.</p>
          </div>

          <!-- Class Matrix Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-start border-collapse text-xs">
              <thead>
                <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
                  <th class="py-3 px-4 font-bold text-start w-12">#</th>
                  <th class="py-3 px-4 font-bold text-start min-w-[200px]">المادة الدراسية</th>
                  <!-- Dynamic Section Headers for THIS class -->
                  <th
                    v-for="sec in (grp.sections || [])"
                    :key="sec.class_section_id"
                    class="py-3 px-4 font-bold text-center min-w-[210px]"
                  >
                    <div class="inline-flex items-center justify-center gap-1.5 font-bold text-bx-title">
                      <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>{{ sec.section_name }}</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-center w-28">نسبة التغطية</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12]">
                <!-- Empty subjects row -->
                <tr v-if="!grp.subjects || grp.subjects.length === 0" class="hover:bg-[var(--bx-row-hover)]/20 transition-colors">
                  <td :colspan="3 + (grp.sections?.length || 0)" class="py-8 px-4 text-center text-bx-muted text-xs">
                    <span>لا توجد مواد مسندة لهذا الصف بعد.</span>
                    <button
                      @click="openCreateDrawer(grp.class_id)"
                      class="text-bx-primary font-bold hover:underline me-2 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>إسناد أول مادة الآن</span>
                    </button>
                  </td>
                </tr>

                <!-- Subject Rows -->
                <tr
                  v-for="(row, idx) in grp.subjects"
                  :key="row.subject_id"
                  class="hover:bg-purple-500/[0.04] dark:hover:bg-white/[0.02] transition-colors duration-150"
                >
                  <!-- Index -->
                  <td class="py-3.5 px-4 font-mono font-bold text-bx-muted text-[11px]">
                    {{ idx + 1 }}
                  </td>

                  <!-- Subject Name -->
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <span class="font-bold text-xs text-bx-title block">
                      {{ row.subject_name }}
                    </span>
                  </td>

                  <!-- Columns per Section showing Teacher Name -->
                  <td
                    v-for="sec in grp.sections"
                    :key="sec.class_section_id"
                    class="py-3 px-3 text-center whitespace-nowrap"
                  >
                    <!-- Assigned: Interactive Teacher Capsule (Click anywhere to edit, with discreet remove icon) -->
                    <div
                      v-if="row.assignmentsBySection[sec.class_section_id]"
                      @click="openEditDrawer(row.assignmentsBySection[sec.class_section_id], grp.class_id, sec.class_section_id)"
                      class="inline-flex items-center justify-between gap-2.5 h-[42px] px-3 rounded-full border transition-all cursor-pointer group/pill shadow-xs max-w-[220px] w-full"
                      :class="[
                        appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[sec.class_section_id].teacher_id)
                          ? 'border-bx-primary ring-2 ring-bx-primary/50 bg-purple-500/15 dark:bg-purple-500/25 shadow-md scale-[1.02]'
                          : 'border-purple-300/80 dark:border-white/10 bg-purple-500/[0.05] dark:bg-purple-950/30 hover:border-bx-primary hover:bg-purple-500/[0.1] dark:hover:bg-purple-900/40'
                      ]"
                      :title="'انقر لتعديل إسناد المعلم ' + row.assignmentsBySection[sec.class_section_id].teacher_name"
                    >
                      <!-- Avatar -->
                      <div
                        class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs transition-colors"
                        :class="appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[sec.class_section_id].teacher_id)
                          ? 'bg-bx-primary text-white ring-2 ring-bx-primary/30'
                          : 'bg-bx-primary text-white'"
                      >
                        <UserCheck class="w-3.5 h-3.5" />
                      </div>

                      <!-- Teacher Info -->
                      <div class="flex-1 min-w-0 text-start leading-tight">
                        <div class="flex items-center gap-1.5">
                          <span
                            v-if="appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[sec.class_section_id].teacher_id)"
                            class="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"
                            title="المعلم المختار"
                          ></span>
                          <div
                            class="font-bold text-xs group-hover/pill:text-bx-primary transition-colors truncate"
                            :class="appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[sec.class_section_id].teacher_id)
                              ? 'text-bx-primary font-black'
                              : 'text-bx-title'"
                            dir="auto"
                          >
                            {{ row.assignmentsBySection[sec.class_section_id].teacher_name }}
                          </div>
                        </div>
                        <div class="text-[10px] text-bx-muted font-mono leading-none mt-0.5">
                          {{ row.assignmentsBySection[sec.class_section_id].teacher_code }}
                        </div>
                      </div>


                      <!-- Approved Taqniya Delete Button -->
                      <button
                        @click.stop="confirmDelete(row.assignmentsBySection[sec.class_section_id])"
                        class="w-7 h-7 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-100/70 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                        title="فك وإلغاء إسناد المادة"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <!-- Unassigned: + تعيين معلم button (Matching pill geometry) -->
                    <button
                      v-else
                      @click="openCreateDrawer(grp.class_id, sec.class_section_id, row.subject_id)"
                      class="inline-flex items-center justify-center gap-1.5 h-[42px] px-3 rounded-full border border-dashed border-[#B4AED8] dark:border-white/20 bg-transparent hover:bg-bx-primary/5 hover:border-bx-primary text-bx-muted hover:text-bx-primary text-xs font-bold transition-all cursor-pointer max-w-[220px] w-full shadow-xs"
                      title="إسناد معلم لهذه المادة في هذه الشعبة"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>تعيين معلم</span>
                    </button>
                  </td>

                  <!-- Coverage Badge -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      class="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold border shadow-xs"
                      :class="row.assignedCount === row.totalSections && row.totalSections > 0
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : row.assignedCount > 0
                        ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                        : 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10'"
                    >
                      <span class="font-mono font-black">{{ row.assignedCount }}</span>
                      <span class="text-[10px] opacity-70">من</span>
                      <span class="font-mono font-black">{{ row.totalSections }}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination Footer -->
        <div
          v-if="meta.last_page > 1"
          class="p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-table-header)] flex items-center justify-between gap-4"
        >
          <div class="text-xs text-bx-muted">
            الصفحة <span class="font-bold text-bx-title">{{ meta.current_page }}</span> من <span class="font-bold text-bx-title">{{ meta.last_page }}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              :disabled="currentPage <= 1"
              @click="currentPage--"
              class="p-1.5 rounded-lg border border-[#B4AED8] dark:border-white/[0.12] hover:bg-[var(--bx-pill)] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <button
              :disabled="currentPage >= meta.last_page"
              @click="currentPage++"
              class="p-1.5 rounded-lg border border-[#B4AED8] dark:border-white/[0.12] hover:bg-[var(--bx-pill)] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Teaching Assignment Drawer -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إسناد تدريس مادة لمعلم' : 'تعديل إسناد التدريس الأكاديمي'"
      :subtitle="drawerMode === 'create' ? 'تكليف معلم مسؤول عن تدريس مادة بشعبة دراسية' : 'تغيير المعلم المكلف أو تعديل بيانات التكليف'"
      :icon="GraduationCap"
      @close="showDrawer = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Conflict or Form Error Alert -->
        <div
          v-if="formErrorMessage"
          class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ formErrorMessage }}</span>
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1">
            العام الدراسي <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            v-model="form.academic_year_id"
            :options="yearOptions"
            placeholder="اختر العام الدراسي..."
            full-width
            :disabled="drawerMode === 'edit'"
          />
        </div>

        <!-- Class Selection -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1">
            الصف الدراسي <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            v-model="form.class_id"
            :options="allClasses.map((c) => ({ value: c.id, label: c.name }))"
            placeholder="اختر الصف..."
            full-width
            :disabled="drawerMode === 'edit'"
          />
        </div>

        <!-- Section Selection -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1">
            الشعبة الدراسية <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            v-model="form.class_section_id"
            :options="availableClassSections"
            placeholder="اختر الشعبة..."
            full-width
            :disabled="drawerMode === 'edit'"
          />
          <p v-if="fieldErrors.class_section_id" class="text-[11px] text-rose-500 mt-1 font-bold">
            {{ fieldErrors.class_section_id[0] }}
          </p>
        </div>

        <!-- Subject Selection -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1">
            المادة التعليمية <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            v-model="form.subject_id"
            :options="formSubjectOptions"
            placeholder="اختر المادة..."
            full-width
            :disabled="drawerMode === 'edit'"
          />
          <p v-if="fieldErrors.subject_id" class="text-[11px] text-rose-500 mt-1 font-bold">
            {{ fieldErrors.subject_id[0] }}
          </p>
        </div>

        <!-- Teacher Selection -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1">
            المعلم المسؤول المكلف <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            v-model="form.teacher_id"
            :options="formTeacherOptions"
            placeholder="اختر المعلم المكلف..."
            full-width
          />
          <p v-if="fieldErrors.teacher_id" class="text-[11px] text-rose-500 mt-1 font-bold">
            {{ fieldErrors.teacher_id[0] }}
          </p>
        </div>

        <!-- Actions -->
        <div class="pt-4 border-t border-[#B4AED8] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="showDrawer = false"
            class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            <span>{{ drawerMode === 'create' ? 'إسناد المادة الآن' : 'حفظ التعديلات' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Teacher Workload Drawer -->
    <TaqniyaDrawer
      :is-open="showWorkloadDrawer"
      :title="selectedWorkloadTeacher ? `النصاب التدريسي: ${selectedWorkloadTeacher.full_name}` : 'النصاب التدريسي'"
      :subtitle="selectedWorkloadTeacher ? `كشف الشعب والمواد المسندة للمعلم (${selectedWorkloadTeacher.user_code})` : ''"
      :icon="UserCheck"
      @close="showWorkloadDrawer = false"
    >
      <div v-if="loadingWorkload" class="p-8 text-center text-bx-muted">
        <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2 text-bx-primary" />
        <span class="text-xs font-bold">جاري استرجاع النصاب التدريسي...</span>
      </div>
      <div v-else-if="teacherWorkload.length === 0" class="py-8 text-center text-xs text-bx-muted">
        لا توجد أي مهام تدريسية مسندة لهذا المعلم في العام الدراسي المحدد.
      </div>
      <div v-else class="space-y-3">
        <div class="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 flex items-center justify-between text-xs font-bold">
          <span>إجمالي الشعب والمواد المسندة:</span>
          <span class="font-['Alexandria',sans-serif] text-bx-primary">{{ teacherWorkload.length }} مهام</span>
        </div>

        <div
          v-for="wl in teacherWorkload"
          :key="wl.id"
          class="p-3.5 rounded-xl border border-[#B4AED8]/70 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-1"
        >
          <div class="flex items-center justify-between">
            <span class="font-black text-xs text-bx-title">{{ wl.subject_name }}</span>
            <span v-if="wl.subject_code" class="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
              {{ wl.subject_code }}
            </span>
          </div>
          <div class="text-[11px] text-bx-muted flex items-center gap-2">
            <span>{{ wl.class_name }}</span>
            <span>•</span>
            <span class="font-bold text-bx-title">{{ wl.section_name }}</span>
          </div>
        </div>
      </div>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        dir="rtl"
      >
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div class="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle class="w-6 h-6" />
          </div>

          <div class="text-center space-y-1">
            <h3 class="text-base font-black text-bx-title">تأكيد فك وإلغاء إسناد التدريس</h3>
            <p class="text-xs text-bx-muted leading-relaxed">
              هل أنت متأكد من رغبتك في إلغاء إسناد مادة
              <strong class="text-bx-title font-bold">({{ assignmentToDelete?.subject_name }})</strong>
              للمعلم
              <strong class="text-bx-title font-bold">({{ assignmentToDelete?.teacher_name }})</strong>؟
            </p>
          </div>

          <div
            v-if="deleteErrorMessage"
            class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold text-center"
          >
            {{ deleteErrorMessage }}
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
            >
              تراجع
            </button>
            <button
              @click="handleDelete"
              :disabled="isDeleting"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
              <Trash2 v-else class="w-3.5 h-3.5" />
              <span>تأكيد فك الإسناد</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</TaqniyaErrorBoundary>
</template>


