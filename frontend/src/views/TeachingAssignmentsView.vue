<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import {
  Plus,
  Search,
  Loader2,
  Calendar,
  Filter,
  RotateCcw,
  LayoutGrid,
  FileSpreadsheet,
} from 'lucide-vue-next';
import {
  teachingAssignmentsApi,
  type TeachingAssignmentsHierarchy,
  type AssignmentItem,
  type PaginationMeta,
} from '../api/teaching-assignments.api';
import { teachersApi, type Teacher } from '../api/teachers.api';
import { academicApi } from '../api/academic.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';

// Feature Components
import AssignmentDeleteModal from '../components/teaching-assignments/AssignmentDeleteModal.vue';
import AssignmentFormDrawer from '../components/teaching-assignments/AssignmentFormDrawer.vue';
import TeacherWorkloadDrawer from '../components/teaching-assignments/TeacherWorkloadDrawer.vue';
import ClassAssignmentsMatrix, {
  type ClassMatrixGroup,
  type ClassMatrixSubjectRow,
} from '../components/teaching-assignments/ClassAssignmentsMatrix.vue';
import TeacherWorkloadScheduleTab from '../components/teaching-assignments/TeacherWorkloadScheduleTab.vue';

const toast = useToast();

// View Mode Tabs
const activeViewTab = ref<'matrix' | 'teacher-workload'>('matrix');

// State
const hierarchyData = ref<TeachingAssignmentsHierarchy | null>(null);
const meta = ref<PaginationMeta>({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const loading = ref(false);

// Filter Form Inputs (Draft - Non-immediate)
const search = ref('');
const selectedYearId = ref<number>(0);
const selectedClassFilter = ref<number | string>('all');
const selectedSectionFilter = ref<number | string>('all');
const selectedSubjectFilter = ref<number | string>('all');
const selectedTeacherFilter = ref<number | string>('all');

// Applied Filter Values (Triggered explicitly by button / Enter)
const appliedSearch = ref('');
const appliedYearId = ref<number>(0);
const appliedClassFilter = ref<number | string>('all');
const appliedSectionFilter = ref<number | string>('all');
const appliedSubjectFilter = ref<number | string>('all');
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

// Drawer & Modal State
const showFormDrawer = ref(false);
const formDrawerMode = ref<'create' | 'edit'>('create');
const activeAssignmentId = ref<number | null>(null);
const formInitialData = ref({
  academic_year_id: 0,
  class_id: 0,
  class_section_id: 0,
  subject_id: 0,
  teacher_id: 0,
});

// Teacher Workload Drawer
const showWorkloadDrawer = ref(false);
const selectedWorkloadTeacher = ref<Teacher | null>(null);

// Delete Modal State
const showDeleteModal = ref(false);
const assignmentToDelete = ref<AssignmentItem | null>(null);

// Fetch Initial Meta Options
async function fetchPrerequisites() {
  try {
    const [yearsRes, classesRes, sectionsRes, subjectsRes, teachersRes, classSectionsRes, classSubjectsRes] =
      await Promise.all([
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
      per_page: 25,
    };
    if (appliedYearId.value) params.academic_year_id = appliedYearId.value;
    if (appliedClassFilter.value !== 'all') params.class_id = appliedClassFilter.value;
    if (appliedSectionFilter.value !== 'all') params.class_section_id = appliedSectionFilter.value;
    if (appliedSubjectFilter.value !== 'all') params.subject_id = appliedSubjectFilter.value;
    if (appliedTeacherFilter.value !== 'all') params.teacher_id = appliedTeacherFilter.value;
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

// Active Academic Year
const activeAcademicYear = computed(() => {
  return academicYears.value.find((y) => y.id === appliedYearId.value) || academicYears.value.find((y) => y.is_active === 1) || academicYears.value[0];
});

// Explicit Filter Execution
function applyFilters() {
  appliedSearch.value = search.value.trim();
  appliedYearId.value = selectedYearId.value;
  appliedClassFilter.value = selectedClassFilter.value;
  appliedSectionFilter.value = selectedSectionFilter.value;
  appliedSubjectFilter.value = selectedSubjectFilter.value;
  appliedTeacherFilter.value = selectedTeacherFilter.value;
  currentPage.value = 1;
  fetchAssignments();
}

function resetFilters() {
  search.value = '';
  appliedSearch.value = '';
  const activeY = academicYears.value.find((y) => y.is_active === 1) || academicYears.value[0];
  if (activeY) {
    selectedYearId.value = activeY.id;
    appliedYearId.value = activeY.id;
  }
  selectedClassFilter.value = 'all';
  appliedClassFilter.value = 'all';
  selectedSectionFilter.value = 'all';
  appliedSectionFilter.value = 'all';
  selectedSubjectFilter.value = 'all';
  appliedSubjectFilter.value = 'all';
  selectedTeacherFilter.value = 'all';
  appliedTeacherFilter.value = 'all';
  currentPage.value = 1;
  fetchAssignments();
}

const hasActiveFilters = computed(() => {
  const activeY = academicYears.value.find((y) => y.is_active === 1);
  const isYearFiltered = activeY ? appliedYearId.value !== activeY.id : false;
  return (
    appliedSearch.value.trim() !== '' ||
    appliedClassFilter.value !== 'all' ||
    appliedSectionFilter.value !== 'all' ||
    appliedSubjectFilter.value !== 'all' ||
    appliedTeacherFilter.value !== 'all' ||
    isYearFiltered
  );
});

// Watch pagination changes
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

// Dynamic sections for filter based on selected class
const sectionFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedClassFilter.value || selectedClassFilter.value === 'all') {
    return [{ value: 'all', label: 'كافة الشعب الدراسية' }];
  }
  const matches = allClassSections.value.filter(
    (cs) => Number(cs.class_id) === Number(selectedClassFilter.value),
  );
  return [
    { value: 'all', label: 'كافة شُعب الصف المختار' },
    ...matches.map((cs) => ({
      value: cs.id,
      label: cs.name || `شعبة #${cs.id}`,
    })),
  ];
});

const subjectFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { value: 'all', label: 'كافة المواد التعليمية' },
  ...allSubjects.value.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code || 'كود: ' + s.id})`,
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

// Compute Class Assignment Matrix Groups with Strict Teacher Filtering
const classMatrixGroups = computed<ClassMatrixGroup[]>(() => {
  if (!hierarchyData.value?.classes) return [];

  const rawGroups = hierarchyData.value.classes.map((cls) => {
    // 1. Gather all sections for this class
    const sections = (cls.sections || []).map((s) => ({
      class_section_id: s.class_section_id,
      section_name: s.section_name,
    }));

    // 2. Gather distinct subjects
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

    // Subject rows
    const subjectList = Array.from(subjectsMap.values());

    let subjectRows: ClassMatrixSubjectRow[] = subjectList.map((sub) => {
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

    // STRICT TEACHER FILTERING: If a specific teacher is selected, only keep subjects taught by that teacher!
    if (appliedTeacherFilter.value !== 'all') {
      const targetTeacherId = Number(appliedTeacherFilter.value);
      subjectRows = subjectRows.filter((row) => {
        return Object.values(row.assignmentsBySection).some(
          (asgn) => Number(asgn.teacher_id) === targetTeacherId,
        );
      });
    }

    return {
      class_id: cls.class_id,
      class_name: cls.class_name,
      sections,
      subjects: subjectRows,
      totalAssignmentsCount,
    };
  });

  // If a teacher filter is active, only include classes that have matching subjects taught by this teacher
  if (appliedTeacherFilter.value !== 'all') {
    return rawGroups.filter((g) => g.subjects.length > 0);
  }

  return rawGroups;
});

// Handlers for Drawer & Modal
function handleOpenCreate(classId?: number, sectionId?: number, subjectId?: number) {
  formDrawerMode.value = 'create';
  activeAssignmentId.value = null;

  const targetClassId = classId || allClasses.value[0]?.id || 0;
  const availableForClass = allClassSections.value.filter(
    (cs) => Number(cs.class_id) === Number(targetClassId),
  );
  const targetSectionId = sectionId || availableForClass[0]?.id || 0;
  const targetSubjectId = subjectId || allSubjects.value[0]?.id || 0;

  formInitialData.value = {
    academic_year_id: selectedYearId.value || academicYears.value[0]?.id || 0,
    class_id: targetClassId,
    class_section_id: targetSectionId,
    subject_id: targetSubjectId,
    teacher_id: allTeachers.value[0]?.id || 0,
  };
  showFormDrawer.value = true;
}

function handleOpenEdit(assignment: AssignmentItem, classId: number, sectionId: number) {
  formDrawerMode.value = 'edit';
  activeAssignmentId.value = assignment.id;
  formInitialData.value = {
    academic_year_id: selectedYearId.value || appliedYearId.value,
    class_id: classId,
    class_section_id: sectionId,
    subject_id: assignment.subject_id,
    teacher_id: assignment.teacher_id,
  };
  showFormDrawer.value = true;
}

function handleConfirmDelete(assignment: AssignmentItem) {
  assignmentToDelete.value = assignment;
  showDeleteModal.value = true;
}

function handleOpenWorkload(teacherId: number) {
  const t = allTeachers.value.find((item) => Number(item.id) === Number(teacherId));
  if (t) {
    selectedWorkloadTeacher.value = t;
    showWorkloadDrawer.value = true;
  }
}

function onPageChange(newPage: number) {
  currentPage.value = newPage;
}

async function handleSaved(_target?: { class_id?: number; section_id?: number }) {
  const currentScrollY = window.scrollY;
  await fetchAssignments();
  await nextTick();
  window.scrollTo({ top: currentScrollY, behavior: 'instant' });
}

async function handleDeleted() {
  const currentScrollY = window.scrollY;
  await fetchAssignments();
  await nextTick();
  window.scrollTo({ top: currentScrollY, behavior: 'instant' });
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
        <!-- Card Header: Title on Right, Controls & Search on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#B4AED8]/40 dark:border-white/[0.06]">
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
                <span>العام الدراسي: {{ activeAcademicYear.name }}</span>
              </span>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1">
              إدارة توزيع وتكليف المعلمين بالمواد المقررة لكل شعبة، وفحص النصاب والطباعة الأكاديمية
            </p>
          </div>

          <!-- Controls: Add Button + Quick Search Input -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Button -->
            <button
              type="button"
              @click="handleOpenCreate()"
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
                  placeholder="بحث باسم المعلم أو المادة..."
                  class="w-full pr-10 pl-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
                />
              </div>
              <button
                type="button"
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

        <!-- VIEW MODE NAVIGATION TABS -->
        <div class="pt-5 pb-2">
          <div class="inline-flex items-center p-1.5 rounded-2xl bg-purple-500/[0.06] dark:bg-white/[0.04] border border-[#B4AED8]/50 dark:border-white/[0.08] gap-1.5 flex-wrap">
            <!-- Tab 1: Matrix View -->
            <button
              type="button"
              @click="activeViewTab = 'matrix'"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="[
                activeViewTab === 'matrix'
                  ? 'bg-bx-primary text-white shadow-md shadow-purple-500/20 font-black'
                  : 'text-bx-muted hover:text-bx-title hover:bg-white/50 dark:hover:bg-white/5'
              ]"
            >
              <LayoutGrid class="w-4 h-4" />
              <span>مصفوفة إسناد الصفوف والشُعب</span>
            </button>

            <!-- Tab 2: Dedicated Teacher Workload & Print View -->
            <button
              type="button"
              @click="activeViewTab = 'teacher-workload'"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="[
                activeViewTab === 'teacher-workload'
                  ? 'bg-bx-primary text-white shadow-md shadow-purple-500/20 font-black'
                  : 'text-bx-muted hover:text-bx-title hover:bg-white/50 dark:hover:bg-white/5'
              ]"
            >
              <FileSpreadsheet class="w-4 h-4" />
              <span>كشف إسناد وجدول المعلم (طباعة)</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 1: MATRIX VIEW (With Filter & Class Cards)                 -->
        <!-- ============================================================== -->
        <div v-show="activeViewTab === 'matrix'" class="space-y-6 pt-4">
          <!-- Filter Bar: Year, Class, Section, Subject, Teacher -->
          <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <!-- 1. Academic Year Filter -->
              <div>
                <label class="block text-[11px] font-bold text-bx-muted mb-1">العام الدراسي</label>
                <TaqniyaSelect
                  v-model="selectedYearId"
                  :options="yearOptions"
                  placeholder="اختر العام..."
                  full-width
                />
              </div>

              <!-- 2. Class Filter -->
              <div>
                <label class="block text-[11px] font-bold text-bx-muted mb-1">الصف الدراسي</label>
                <TaqniyaSelect
                  v-model="selectedClassFilter"
                  :options="classFilterOptions"
                  placeholder="كافة الصفوف..."
                  full-width
                />
              </div>

              <!-- 3. Section Filter -->
              <div>
                <label class="block text-[11px] font-bold text-bx-muted mb-1">الشعبة الدراسية</label>
                <TaqniyaSelect
                  v-model="selectedSectionFilter"
                  :options="sectionFilterOptions"
                  placeholder="كافة الشعب..."
                  full-width
                />
              </div>

              <!-- 4. Subject Filter -->
              <div>
                <label class="block text-[11px] font-bold text-bx-muted mb-1">المادة التعليمية</label>
                <TaqniyaSelect
                  v-model="selectedSubjectFilter"
                  :options="subjectFilterOptions"
                  placeholder="كافة المواد..."
                  full-width
                />
              </div>

              <!-- 5. Teacher Filter -->
              <div>
                <label class="block text-[11px] font-bold text-bx-muted mb-1">المعلم المكلف</label>
                <TaqniyaSelect
                  v-model="selectedTeacherFilter"
                  :options="teacherFilterOptions"
                  placeholder="كافة المعلمين..."
                  full-width
                />
              </div>
            </div>

            <!-- Filter Action Toolbar: Apply, Reset, Active Indicator -->
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

              <!-- Active Filter Indicator Badge -->
              <div v-if="hasActiveFilters" class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
                <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
                <span>
                  {{ appliedTeacherFilter !== 'all' ? 'يتم عرض الصفوف والمواد المسندة للمعلم المختار فقط' : 'يتم تطبيق فلاتر مخصصة' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Loading State for Initial Load -->
          <div v-if="loading && (!hierarchyData || !hierarchyData.classes || hierarchyData.classes.length === 0)" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
            <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
            <span class="text-xs font-bold">جاري تحميل كشوفات إسناد التدريس...</span>
          </div>

          <!-- Class Assignments Matrix Component with Non-Destructive Refresh Overlay -->
          <div v-else class="relative">
            <div
              v-if="loading"
              class="absolute inset-0 bg-[var(--bx-surface-solid)]/60 backdrop-blur-[0.5px] z-20 flex items-start justify-center pt-24 transition-all duration-200 pointer-events-none rounded-2xl"
            >
              <div class="px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-bx-border shadow-md flex items-center gap-2 text-xs font-bold text-bx-primary">
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>جاري تحديث البيانات...</span>
              </div>
            </div>

            <ClassAssignmentsMatrix
              :groups="classMatrixGroups"
              :applied-teacher-filter="appliedTeacherFilter"
              @create="handleOpenCreate"
              @edit="handleOpenEdit"
              @delete="handleConfirmDelete"
              @view-workload="handleOpenWorkload"
            />
          </div>

          <!-- Shared TaqniyaPagination Component -->
          <div v-if="meta.last_page > 1" class="mt-6">
            <TaqniyaPagination
              :current-page="meta.current_page"
              :total-pages="meta.last_page"
              :total="meta.total"
              item-name="صف دراسي"
              :is-loading="loading"
              @page-change="onPageChange"
            />
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 2: DEDICATED TEACHER WORKLOAD SCHEDULE & PRINT VIEW       -->
        <!-- ============================================================== -->
        <div v-show="activeViewTab === 'teacher-workload'" class="pt-4">
          <TeacherWorkloadScheduleTab
            :teachers="allTeachers"
            :academic-year-id="appliedYearId || selectedYearId"
            :academic-year-name="activeAcademicYear?.name || 'العام الحالي'"
            @edit="handleOpenEdit"
            @delete="handleConfirmDelete"
          />
        </div>
      </div>

      <!-- Feature Drawer: Create / Edit Teaching Assignment -->
      <AssignmentFormDrawer
        :is-open="showFormDrawer"
        :mode="formDrawerMode"
        :assignment-id="activeAssignmentId"
        :initial-data="formInitialData"
        :academic-years="academicYears"
        :all-classes="allClasses"
        :all-class-sections="allClassSections"
        :all-subjects="allSubjects"
        :all-teachers="allTeachers"
        @close="showFormDrawer = false"
        @saved="handleSaved"
      />

      <!-- Feature Drawer: Teacher Workload Inspector -->
      <TeacherWorkloadDrawer
        :is-open="showWorkloadDrawer"
        :teacher="selectedWorkloadTeacher"
        :academic-year-id="appliedYearId"
        @close="showWorkloadDrawer = false"
        @assign-more="() => { showWorkloadDrawer = false; handleOpenCreate(); }"
      />

      <!-- Feature Modal: Delete Confirmation (wrapping TaqniyaModal) -->
      <AssignmentDeleteModal
        :is-open="showDeleteModal"
        :assignment="assignmentToDelete"
        @close="showDeleteModal = false"
        @deleted="handleDeleted"
      />
    </div>
  </TaqniyaErrorBoundary>
</template>
