<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Calendar,
  Clock,
  Loader2,
  BarChart3,
  School,
  CheckCircle2,
  TrendingUp,
  Trash2,
  Search,
  UserCheck,
} from 'lucide-vue-next';
import {
  timetablesApi,
  type TimetableClassInfo,
  type TimetableClassAuditInfo,
  type DayTimetableGroup,
  type TimetableSlotItem,
  type TeacherTimetableResponse,
  type DayOfWeek,
} from '../api/timetables.api';
import { academicApi, type AcademicYearItem } from '../api/academic.api';
import { periodSlotsApi, type PeriodSlot } from '../api/period-slots.api';
import { teachingAssignmentsApi, type AssignmentItem } from '../api/teaching-assignments.api';
import { teachersApi, type Teacher } from '../api/teachers.api';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaModal from '../components/ui/TaqniyaModal.vue';
import TimetableMatrixGrid from '../components/timetables/TimetableMatrixGrid.vue';
import TimetableSlotDrawer from '../components/timetables/TimetableSlotDrawer.vue';

const authStore = useAuthStore();
const toast = useToast();

const isAdmin = computed(() => authStore.user?.role_type === 'admin');

// 2. View Mode Switcher
const activeViewTab = ref<'sections' | 'teachers'>('sections');
const isAuditMode = ref(false);

// 3. State Management
const loading = ref(false);
const structureLoading = ref(false);
const matrixLoading = ref(false);
const isSubmitting = ref(false);

// Academic Years & Hierarchy
const academicYears = ref<AcademicYearItem[]>([]);
const selectedYearId = ref<number>(0);
const classesStructure = ref<TimetableClassInfo[]>([]);
const auditData = ref<TimetableClassAuditInfo[]>([]);
const totalUnscheduledSlots = ref<number>(0);

// Selected Section & Matrix
const selectedSectionId = ref<number | null>(null);
const selectedSectionInfo = ref<{ class_name: string; section_name: string } | null>(null);
const sectionTimetable = ref<DayTimetableGroup[]>([]);

// Periods, Assignments & Teachers
const periodSlots = ref<PeriodSlot[]>([]);
const availableAssignments = ref<AssignmentItem[]>([]);
const teachersList = ref<Teacher[]>([]);

// Teacher Timetable View
const selectedTeacherId = ref<number | null>(null);
const teacherTimetableData = ref<TeacherTimetableResponse['data'] | null>(null);

// Filters
const search = ref('');
const selectedClassFilter = ref<number | string>('all');

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const slotToEdit = ref<TimetableSlotItem | null>(null);

// Form State
const formData = ref<{
  academic_year_id: number;
  class_section_id: number;
  day_of_week: DayOfWeek;
  period_slot_id: number;
  teaching_assignment_id: number;
}>({
  academic_year_id: 0,
  class_section_id: 0,
  day_of_week: 'sunday',
  period_slot_id: 0,
  teaching_assignment_id: 0,
});
const formErrors = ref<Record<string, string>>({});
const formErrorMessage = ref<string | null>(null);

// Delete Modal State
const showDeleteModal = ref(false);
const slotToDelete = ref<TimetableSlotItem | null>(null);
const isDeleting = ref(false);

// Days of week (Standard 5 school days: Sunday to Thursday)
const daysOfWeekOptions: { id: DayOfWeek; name: string }[] = [
  { id: 'sunday', name: 'الأحد' },
  { id: 'monday', name: 'الإثنين' },
  { id: 'tuesday', name: 'الثلاثاء' },
  { id: 'wednesday', name: 'الأربعاء' },
  { id: 'thursday', name: 'الخميس' },
];

const daySelectOptions: TaqniyaSelectOption[] = daysOfWeekOptions.map((d) => ({
  value: d.id,
  label: d.name,
}));

// Active Academic Year object
const activeAcademicYear = computed(() => {
  return academicYears.value.find((y) => y.id === selectedYearId.value) || academicYears.value[0];
});

// Dropdown Options
const yearOptions = computed<TaqniyaSelectOption[]>(() =>
  academicYears.value.map((y) => ({
    value: y.id,
    label: `${y.name} ${y.is_active === 1 ? '(النشط)' : ''}`,
  })),
);

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { value: 'all', label: 'كافة الصفوف الدراسية' },
  ...classesStructure.value.map((c) => ({
    value: c.class_id,
    label: c.class_name,
  })),
]);

const teacherSelectOptions = computed<TaqniyaSelectOption[]>(() =>
  teachersList.value.map((t) => ({
    value: t.id,
    label: `${t.full_name} (${t.user_code})`,
    subtext: t.specialization || undefined,
  })),
);

const formPeriodOptions = computed<TaqniyaSelectOption[]>(() =>
  teachingPeriods.value.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.start_time.substring(0, 5)} - ${p.end_time.substring(0, 5)})`,
  })),
);

const formAssignmentOptions = computed<TaqniyaSelectOption[]>(() =>
  availableAssignments.value.map((asgn) => ({
    value: asgn.id,
    label: `${asgn.subject_name} — أ. ${asgn.teacher_name}`,
    subtext: asgn.teacher_code,
  })),
);

// Teaching Periods (non-break)
const teachingPeriods = computed(() => {
  return periodSlots.value
    .filter((p) => p.is_break === 0)
    .sort((a, b) => a.slot_number - b.slot_number);
});

// Filtered Classes
const filteredClasses = computed(() => {
  let list = classesStructure.value;
  if (selectedClassFilter.value !== 'all') {
    list = list.filter((c) => c.class_id === Number(selectedClassFilter.value));
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.class_name.toLowerCase().includes(q) ||
        c.sections.some((s) => s.section_name.toLowerCase().includes(q)),
    );
  }
  return list;
});

// Audit Map lookup
const auditMap = computed(() => {
  const map: Record<number, { classTotalUnscheduled: number; isClassFullyScheduled: boolean; sections: Record<number, any> }> = {};
  for (const c of auditData.value) {
    const secMap: Record<number, any> = {};
    for (const s of c.sections) {
      secMap[s.class_section_id] = s;
    }
    map[c.class_id] = {
      classTotalUnscheduled: c.total_unscheduled_slots,
      isClassFullyScheduled: c.is_fully_scheduled,
      sections: secMap,
    };
  }
  return map;
});

// KPI Metrics
const stats = computed(() => {
  let totalScheduled = 0;
  for (const d of sectionTimetable.value) {
    totalScheduled += d.slots.length;
  }

  let totalSectionsCount = 0;
  for (const c of classesStructure.value) {
    totalSectionsCount += c.sections.length;
  }

  let fullyScheduledCount = 0;
  for (const c of auditData.value) {
    if (c.is_fully_scheduled) fullyScheduledCount++;
  }

  return {
    totalScheduled,
    totalSectionsCount,
    fullyScheduledCount,
    totalUnscheduled: totalUnscheduledSlots.value,
  };
});

// Initial Data Fetching
async function initData() {
  loading.value = true;
  try {
    const [yearsRes, periodsRes] = await Promise.all([
      academicApi.getYears(),
      periodSlotsApi.getPeriodSlots({ per_page: 50, sort_by: 'slot_number', sort_order: 'asc' }),
    ]);

    if (yearsRes.data?.success && yearsRes.data?.data) {
      academicYears.value = yearsRes.data.data;
      const active = yearsRes.data.data.find((y: AcademicYearItem) => y.is_active === 1);
      selectedYearId.value = active ? active.id : yearsRes.data.data[0]?.id || 0;
    }

    if (periodsRes.data?.success && periodsRes.data?.data) {
      periodSlots.value = periodsRes.data.data;
    }

    if (selectedYearId.value) {
      await fetchStructure();
      if (isAdmin.value) {
        await fetchAuditSilent();
      }
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'تعذر تحميل البيانات الأساسية.');
  } finally {
    loading.value = false;
  }
}

// Fetch Structure
async function fetchStructure() {
  if (!selectedYearId.value) return;
  structureLoading.value = true;
  try {
    const res = await timetablesApi.getStructure({
      academic_year_id: selectedYearId.value,
    });
    if (res.data?.success && res.data?.data) {
      classesStructure.value = res.data.data.classes;
      if (!selectedSectionId.value && res.data.data.classes.length > 0) {
        const firstSec = res.data.data.classes[0].sections[0];
        if (firstSec) {
          selectSection(firstSec.class_section_id, res.data.data.classes[0].class_name, firstSec.section_name);
        }
      }
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'تعذر جلب هيكل الصفوف والشعب.');
  } finally {
    structureLoading.value = false;
  }
}

// Fetch Audit data in background for KPI and alert indicators
async function fetchAuditSilent() {
  try {
    const res = await timetablesApi.getCompletionStatus({
      academic_year_id: selectedYearId.value,
    });
    if (res.data?.success && res.data?.data) {
      auditData.value = res.data.data.classes;
      totalUnscheduledSlots.value = res.data.data.total_unscheduled_school_slots;
    }
  } catch (_e) {}
}

// Select Section & Fetch Matrix (Lazy Loading)
async function selectSection(sectionId: number, className: string, sectionName: string) {
  selectedSectionId.value = sectionId;
  selectedSectionInfo.value = { class_name: className, section_name: sectionName };
  await fetchSectionTimetable(sectionId);
  await fetchAssignmentsForSection(sectionId);
}

// Fetch Section Timetable Matrix
async function fetchSectionTimetable(sectionId: number) {
  matrixLoading.value = true;
  try {
    const res = await timetablesApi.getSectionTimetable(sectionId);
    if (res.data?.success && res.data?.data) {
      sectionTimetable.value = res.data.data.timetable;
    }
  } catch (err: any) {
    sectionTimetable.value = [];
    toast.error(err?.response?.data?.message || 'تعذر تحميل مصفوفة جدول الشعبة.');
  } finally {
    matrixLoading.value = false;
  }
}

// Fetch Assignments for section
async function fetchAssignmentsForSection(sectionId: number) {
  try {
    const res = await teachingAssignmentsApi.getAll({
      academic_year_id: selectedYearId.value,
      class_section_id: sectionId,
      per_page: 50,
    });
    if (res.data?.success && res.data?.data?.classes) {
      const allAssignments: AssignmentItem[] = [];
      for (const cls of res.data.data.classes) {
        for (const sec of cls.sections) {
          if (sec.class_section_id === sectionId) {
            allAssignments.push(...sec.assignments);
          }
        }
      }
      availableAssignments.value = allAssignments;
    }
  } catch (_e) {
    availableAssignments.value = [];
  }
}

// Toggle Audit Mode
async function toggleAuditMode() {
  isAuditMode.value = !isAuditMode.value;
  if (isAuditMode.value) {
    await fetchAuditSilent();
    toast.success('تم تفعيل وضع تدقيق الجداول وإبراز الشواغر والنواقص.');
  }
}

// Open Drawer to Schedule
function openCreateDrawer(day?: DayOfWeek, periodSlotId?: number) {
  drawerMode.value = 'create';
  slotToEdit.value = null;
  formErrors.value = {};
  formErrorMessage.value = null;

  formData.value = {
    academic_year_id: selectedYearId.value,
    class_section_id: selectedSectionId.value || 0,
    day_of_week: day || 'sunday',
    period_slot_id: periodSlotId || (teachingPeriods.value[0]?.id || 0),
    teaching_assignment_id: availableAssignments.value[0]?.id || 0,
  };
  showDrawer.value = true;
}

function openEditDrawer(slot: TimetableSlotItem, day: DayOfWeek) {
  drawerMode.value = 'edit';
  slotToEdit.value = slot;
  formErrors.value = {};
  formErrorMessage.value = null;

  formData.value = {
    academic_year_id: selectedYearId.value,
    class_section_id: selectedSectionId.value || 0,
    day_of_week: day,
    period_slot_id: slot.period_slot_id,
    teaching_assignment_id: slot.teaching_assignment_id,
  };
  showDrawer.value = true;
}

// Submit Drawer Form
async function submitDrawer(payload?: typeof formData.value) {
  if (payload) {
    formData.value = { ...formData.value, ...payload };
  }
  formErrors.value = {};
  formErrorMessage.value = null;

  if (!formData.value.class_section_id) {
    formErrors.value.class_section_id = 'الشعبة الدراسية مطلوبة.';
  }
  if (!formData.value.period_slot_id) {
    formErrors.value.period_slot_id = 'توقيت الحصة مطلوب.';
  }
  if (!formData.value.teaching_assignment_id) {
    formErrors.value.teaching_assignment_id = 'المادة والمعلم المكلف مطلوب.';
  }

  if (Object.keys(formErrors.value).length > 0) return;

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await timetablesApi.createTimetableSlot({
        academic_year_id: formData.value.academic_year_id,
        class_section_id: formData.value.class_section_id,
        day_of_week: formData.value.day_of_week,
        period_slot_id: formData.value.period_slot_id,
        teaching_assignment_id: formData.value.teaching_assignment_id,
      });
      toast.success(res.data.message || 'تم إضافة وتسكين الحصة بالجدول الأسبوعي بنجاح.');
    } else if (slotToEdit.value) {
      const res = await timetablesApi.updateTimetableSlot(slotToEdit.value.id, {
        academic_year_id: formData.value.academic_year_id,
        class_section_id: formData.value.class_section_id,
        day_of_week: formData.value.day_of_week,
        period_slot_id: formData.value.period_slot_id,
        teaching_assignment_id: formData.value.teaching_assignment_id,
      });
      toast.success(res.data.message || 'تم تحديث وتعديل الحصة بالجدول الأسبوعي بنجاح.');
    }

    showDrawer.value = false;
    if (selectedSectionId.value) {
      await fetchSectionTimetable(selectedSectionId.value);
    }
    await fetchAuditSilent();
  } catch (err: any) {
    const errorData = err?.response?.data;
    if (err?.response?.status === 409) {
      formErrorMessage.value =
        errorData?.message || 'تعارض في الجدول: الشعبة أو المعلم مرتبط بحصة أخرى في نفس اليوم والتوقيت.';
      toast.error(formErrorMessage.value || 'تعارض في الجدول');
    } else if (err?.response?.status === 422 && errorData?.errors) {
      formErrors.value = errorData.errors;
    } else {
      formErrorMessage.value = errorData?.message || 'حدث خطأ أثناء حفظ الحصة.';
      toast.error(formErrorMessage.value || 'خطأ في الحفظ');
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Delete Confirmation
function promptDeleteSlot(slot: TimetableSlotItem) {
  slotToDelete.value = slot;
  showDeleteModal.value = true;
}

function handleUnassignFromDrawer() {
  if (!slotToEdit.value) return;
  const currentSlot = slotToEdit.value;
  showDrawer.value = false;
  promptDeleteSlot(currentSlot);
}

async function confirmDeleteSlot() {
  if (!slotToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await timetablesApi.deleteTimetableSlot(slotToDelete.value.id);
    toast.success(res.data.message || 'تم حذف وإلغاء الحصة من الجدول الأسبوعي بنجاح.');
    showDeleteModal.value = false;
    slotToDelete.value = null;

    if (selectedSectionId.value) {
      await fetchSectionTimetable(selectedSectionId.value);
    }
    await fetchAuditSilent();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'تعذر إلغاء الحصة من الجدول.');
  } finally {
    isDeleting.value = false;
  }
}

// Teacher View Handlers
async function loadTeachers() {
  if (teachersList.value.length > 0) return;
  try {
    const res = await teachersApi.getTeachers({ per_page: 100 });
    if (res.data?.success && res.data?.data) {
      teachersList.value = res.data.data;
      if (!selectedTeacherId.value && teachersList.value.length > 0) {
        selectTeacher(teachersList.value[0].id);
      }
    }
  } catch (_e) {}
}

async function selectTeacher(teacherId: number) {
  selectedTeacherId.value = teacherId;
  matrixLoading.value = true;
  try {
    const res = await timetablesApi.getTeacherTimetable(teacherId);
    if (res.data?.success && res.data?.data) {
      teacherTimetableData.value = res.data.data;
    }
  } catch (err: any) {
    teacherTimetableData.value = null;
    toast.error(err?.response?.data?.message || 'تعذر جلب جدول المعلم.');
  } finally {
    matrixLoading.value = false;
  }
}

// Lookup Helper: Section slot
function getSlotFor(dayKey: string, periodSlotId: number): TimetableSlotItem | undefined {
  const dayGroup = sectionTimetable.value.find((d) => d.day_of_week === dayKey);
  return dayGroup?.slots.find((s) => s.period_slot_id === periodSlotId);
}

// Lookup Helper: Teacher slot
function getTeacherSlotFor(dayKey: string, periodSlotId: number) {
  const dayGroup = teacherTimetableData.value?.timetable.find((d) => d.day_of_week === dayKey);
  return dayGroup?.slots.find((s) => s.period_slot_id === periodSlotId);
}

// Watchers
watch(selectedYearId, async () => {
  selectedSectionId.value = null;
  selectedSectionInfo.value = null;
  sectionTimetable.value = [];
  await fetchStructure();
  if (isAdmin.value) {
    await fetchAuditSilent();
  }
});

watch(activeViewTab, async (newTab) => {
  if (newTab === 'teachers') {
    await loadTeachers();
  }
});

onMounted(async () => {
  await initData();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card (Matching Taqniya Reference Design System) -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        
        <!-- 1. Card Header: Title on Right, Controls & Actions on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-bx-divider">
          <!-- Title & Subtitle with Taqniya Brand Accent -->
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                جدول الحصص الأسبوعي وتوزيع الشعب
              </h2>
              <span
                v-if="activeAcademicYear"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-xs"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>العام الدراسي: {{ activeAcademicYear.name }}</span>
              </span>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              إدارة وتوزيع الحصص المدرسية، مصفوفة الشعب، وفحص حظر تضارب المعلمين والشعب
            </p>
          </div>

          <!-- Controls: Mode Switcher + Audit Button + Add Button + Search -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Period Button (Admin Only) -->
            <button
              v-if="isAdmin"
              @click="openCreateDrawer()"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ تسكين حصة بالجدول</span>
            </button>

            <!-- Audit Toggle Button (Admin Only) -->
            <button
              v-if="isAdmin && activeViewTab === 'sections'"
              @click="toggleAuditMode"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm"
              :class="
                isAuditMode
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-2 ring-amber-400/20'
                  : 'border-bx-border text-bx-title hover:bg-purple-500/[0.04]'
              "
            >
              <BarChart3 class="w-3.5 h-3.5" />
              <span>{{ isAuditMode ? 'إلغاء وضع التدقيق' : '📊 تدقيق الشواغر' }}</span>
            </button>

            <!-- View Mode Switcher Pills -->
            <div class="flex items-center gap-1.5 p-1 rounded-full border border-bx-border bg-transparent">
              <button
                @click="activeViewTab = 'sections'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                :class="activeViewTab === 'sections' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <School class="w-3.5 h-3.5" />
                <span>جدول الشُعب</span>
              </button>
              <button
                @click="activeViewTab = 'teachers'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                :class="activeViewTab === 'teachers' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <UserCheck class="w-3.5 h-3.5" />
                <span>جدول المعلمين</span>
              </button>
            </div>

            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-60">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث في الصفوف والشعب..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
              />
            </div>
          </div>
        </div>

        <!-- 2. KPI Metrics Cards (Section 8 Standard - Exact Taqniya Theme) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
          <TaqniyaKpiCard
            title="الحصص المسكنة بالشعبة"
            :value="`${stats.totalScheduled} حصة`"
            :icon="Calendar"
            variant="primary"
            badge-text="الأسبوعية"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
            :progress="100"
          />

          <TaqniyaKpiCard
            title="إجمالي الشعب الدراسية"
            :value="`${stats.totalSectionsCount} شعبة`"
            :icon="School"
            variant="blue"
            badge-text="متاح بالعام"
            :progress="100"
          />

          <TaqniyaKpiCard
            title="الحصص الشاغرة بالمدرسة"
            :value="`${stats.totalUnscheduled} شاغر`"
            :icon="Clock"
            variant="amber"
            :badge-text="stats.totalUnscheduled > 0 ? 'نواقص ⚠️' : 'مكتمل ✅'"
            :progress="Math.max(0, 100 - stats.totalUnscheduled * 2)"
          />

          <TaqniyaKpiCard
            title="الفترات اليومية المعتمدة"
            :value="`${teachingPeriods.length} فترات`"
            :icon="CheckCircle2"
            variant="emerald"
            badge-text="غير فسح"
            :progress="100"
          />
        </div>

        <!-- 3. Filters Bar: Year & Class / Teacher Selectors -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] mb-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <!-- Academic Year Select -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">العام الدراسي</label>
              <TaqniyaSelect
                v-model="selectedYearId"
                :options="yearOptions"
                placeholder="اختر العام الدراسي..."
                full-width
              />
            </div>

            <!-- Class Filter (in sections view) -->
            <div v-if="activeViewTab === 'sections'">
              <label class="block text-[11px] font-bold text-bx-muted mb-1">تصفية حسب الصف الدراسي</label>
              <TaqniyaSelect
                v-model="selectedClassFilter"
                :options="classFilterOptions"
                placeholder="كافة الصفوف..."
                full-width
              />
            </div>

            <!-- Teacher Select (in teachers view) -->
            <div v-if="activeViewTab === 'teachers'" class="lg:col-span-2">
              <label class="block text-[11px] font-bold text-bx-muted mb-1">اختر المعلم لعرض جدوله</label>
              <TaqniyaSelect
                v-model="selectedTeacherId"
                :options="teacherSelectOptions"
                placeholder="اختر المعلم المكلف..."
                full-width
                @update:model-value="(val) => selectTeacher(Number(val))"
              />
            </div>
          </div>
        </div>

        <!-- 4. Section View: Classes & Sections Cards -->
        <div v-if="activeViewTab === 'sections'" class="mb-6 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-bx-muted flex items-center gap-1.5">
              <School class="w-3.5 h-3.5 text-bx-primary" />
              <span>صفوف وشعب المدرسة (اختر الشعبة لعرض جدولها):</span>
            </h3>
            <span class="text-[11px] text-bx-muted">التحميل عند الطلب (Lazy Load)</span>
          </div>

          <div v-if="structureLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="i in 3" :key="i" class="h-24 rounded-2xl bg-purple-500/[0.04] animate-pulse border border-bx-border"></div>
          </div>

          <div v-else-if="filteredClasses.length === 0" class="text-center py-8 bg-purple-500/[0.02] rounded-2xl border border-bx-border">
            <School class="w-8 h-8 text-bx-muted mx-auto mb-2 opacity-50" />
            <p class="text-xs text-bx-muted">لا توجد صفوف أو شعب مطابقة للبحث.</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="cls in filteredClasses"
              :key="cls.class_id"
              class="p-3.5 rounded-2xl border transition-all"
              :class="[
                isAuditMode && auditMap[cls.class_id]?.classTotalUnscheduled > 0
                  ? 'border-amber-400/80 bg-amber-500/[0.04]'
                  : isAuditMode
                  ? 'border-emerald-400/80 bg-emerald-500/[0.03]'
                  : 'border-bx-border bg-bx-surface hover:border-bx-primary/40',
              ]"
            >
              <!-- Class Name & Badge -->
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-bx-primary"></span>
                  <span class="font-black text-xs text-bx-title font-display">{{ cls.class_name }}</span>
                </div>

                <!-- Audit Deficit Badge on Class -->
                <div v-if="isAuditMode && auditMap[cls.class_id]">
                  <span
                    v-if="auditMap[cls.class_id].classTotalUnscheduled > 0"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  >
                    ⚠️ {{ auditMap[cls.class_id].classTotalUnscheduled }} شاغر
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  >
                    ✅ مكتمل
                  </span>
                </div>
              </div>

              <!-- Sections Buttons (Pills) -->
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="sec in cls.sections"
                  :key="sec.class_section_id"
                  @click="selectSection(sec.class_section_id, cls.class_name, sec.section_name)"
                  type="button"
                  class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
                  :class="[
                    selectedSectionId === sec.class_section_id
                      ? 'bg-bx-primary text-white border-bx-primary shadow-xs'
                      : 'border-bx-border text-bx-muted hover:text-bx-title hover:border-bx-primary/40 bg-transparent',
                    isAuditMode && auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count > 0
                      ? 'border-amber-400 text-amber-600'
                      : '',
                  ]"
                >
                  <span>{{ sec.section_name }}</span>
                  <span
                    v-if="isAuditMode && auditMap[cls.class_id]?.sections[sec.class_section_id]"
                    class="text-[9px] px-1 rounded-full font-mono"
                    :class="
                      auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    "
                  >
                    {{
                      auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count > 0
                        ? `-${auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count}`
                        : '✓'
                    }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Timetable Matrix Grid Feature Component -->
        <TimetableMatrixGrid
          :active-view-tab="activeViewTab"
          :matrix-loading="matrixLoading"
          :is-admin="isAdmin"
          :teaching-periods="teachingPeriods"
          :days="daysOfWeekOptions"
          :selected-section-id="selectedSectionId"
          :selected-section-info="selectedSectionInfo"
          :teacher-timetable-data="teacherTimetableData"
          :get-slot-for="getSlotFor"
          :get-teacher-slot-for="getTeacherSlotFor"
          @create-slot="openCreateDrawer"
          @edit-slot="openEditDrawer"
          @delete-slot="promptDeleteSlot"
        />
      </div>

      <!-- 6. Slide-Over Drawer Feature Component for Slot Create / Update -->
      <TimetableSlotDrawer
        :is-open="showDrawer"
        :drawer-mode="drawerMode"
        :subtitle="selectedSectionInfo ? `${selectedSectionInfo.class_name} — ${selectedSectionInfo.section_name}` : ''"
        :initial-data="formData"
        :day-options="daySelectOptions"
        :period-options="formPeriodOptions"
        :assignment-options="formAssignmentOptions"
        :is-submitting="isSubmitting"
        :form-errors="formErrors"
        :form-error-message="formErrorMessage"
        :slot-to-edit="slotToEdit"
        @close="showDrawer = false"
        @submit="submitDrawer"
        @unassign="handleUnassignFromDrawer"
      />

      <!-- 7. Confirmation Modal for Delete (Shared TaqniyaModal) -->
      <TaqniyaModal
        :is-open="showDeleteModal"
        title="إلغاء وتفريغ الحصة من الجدول"
        subtitle="تأكيد حذف الحصة وإخلاء الفترة الزمنية بالشعبة"
        max-width="md"
        @close="showDeleteModal = false"
      >
        <template #icon>
          <div class="p-2.5 rounded-2xl bg-red-500/10 text-red-600">
            <Trash2 class="w-6 h-6" />
          </div>
        </template>

        <div class="p-3 bg-purple-500/[0.03] border border-bx-border rounded-2xl text-xs space-y-1.5 text-bx-title">
          <div><span class="text-bx-muted">المادة:</span> <strong>{{ slotToDelete?.subject_name }}</strong></div>
          <div><span class="text-bx-muted">المعلم:</span> <strong>{{ slotToDelete?.teacher_name }}</strong></div>
          <div><span class="text-bx-muted">الحصة:</span> <strong>{{ slotToDelete?.period_name }}</strong></div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 text-xs font-bold rounded-full border border-bx-border text-bx-title hover:bg-purple-500/[0.04] transition-colors"
            >
              تراجع
            </button>
            <button
              type="button"
              @click="confirmDeleteSlot"
              :disabled="isDeleting"
              class="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
              <span>تأكيد الإلغاء</span>
            </button>
          </div>
        </template>
      </TaqniyaModal>
    </div>
  </TaqniyaErrorBoundary>
</template>
