<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  UserCheck,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Save,
  BarChart3,
  School,
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

// 1. Lazy loaded UI components
const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));

const authStore = useAuthStore();
const toast = useToast();

const isAdmin = computed(() => authStore.user?.role_type === 'admin');

// 2. Main View Modes
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

// Selected Section & Matrix Grid
const selectedSectionId = ref<number | null>(null);
const selectedSectionInfo = ref<{ class_name: string; section_name: string } | null>(null);
const sectionTimetable = ref<DayTimetableGroup[]>([]);

// Period Slots & Teaching Assignments for Form
const periodSlots = ref<PeriodSlot[]>([]);
const availableAssignments = ref<AssignmentItem[]>([]);
const teachersList = ref<Teacher[]>([]);

// Teacher View State
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

// Day of week options
const daysOfWeekOptions: { id: DayOfWeek; name: string }[] = [
  { id: 'sunday', name: 'الأحد' },
  { id: 'monday', name: 'الإثنين' },
  { id: 'tuesday', name: 'الثلاثاء' },
  { id: 'wednesday', name: 'الأربعاء' },
  { id: 'thursday', name: 'الخميس' },
  { id: 'saturday', name: 'السبت' },
];

// Computed: Filtered Classes Structure
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

// Computed: Non-break Period Slots
const teachingPeriods = computed(() => {
  return periodSlots.value
    .filter((p) => p.is_break === 0)
    .sort((a, b) => a.slot_number - b.slot_number);
});

// Map of audit stats by class_id and class_section_id
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

// Fetch Initial Academic Years & Period Slots
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
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'حدث خطأ أثناء تحميل البيانات الأساسية.');
  } finally {
    loading.value = false;
  }
}

// Fetch Structure (Lightweight mode)
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

// Select Section & Fetch Matrix (Lazy Loading)
async function selectSection(sectionId: number, className: string, sectionName: string) {
  selectedSectionId.value = sectionId;
  selectedSectionInfo.value = { class_name: className, section_name: sectionName };
  await fetchSectionTimetable(sectionId);
  await fetchAssignmentsForSection(sectionId);
}

// Fetch Timetable Matrix for Selected Section
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

// Fetch Teaching Assignments for selected section to populate Drawer dropdown
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

// Toggle Audit / Completion Status Mode
async function toggleAuditMode() {
  if (!isAuditMode.value) {
    isAuditMode.value = true;
    try {
      const res = await timetablesApi.getCompletionStatus({
        academic_year_id: selectedYearId.value,
      });
      if (res.data?.success && res.data?.data) {
        auditData.value = res.data.data.classes;
        totalUnscheduledSlots.value = res.data.data.total_unscheduled_school_slots;
        toast.success(res.data.message || 'تم تحديث تقرير تدقيق الجداول بنجاح.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'تعذر جلب تقرير تدقيق اكتمال الجداول.');
    }
  } else {
    isAuditMode.value = false;
  }
}

// Open Drawer to Schedule or Edit
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

// Submit Drawer (Create / Update)
async function submitDrawer() {
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
    if (isAuditMode.value) {
      const auditRes = await timetablesApi.getCompletionStatus({ academic_year_id: selectedYearId.value });
      if (auditRes.data?.success && auditRes.data?.data) {
        auditData.value = auditRes.data.data.classes;
        totalUnscheduledSlots.value = auditRes.data.data.total_unscheduled_school_slots;
      }
    }
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
    if (isAuditMode.value) {
      const auditRes = await timetablesApi.getCompletionStatus({ academic_year_id: selectedYearId.value });
      if (auditRes.data?.success && auditRes.data?.data) {
        auditData.value = auditRes.data.data.classes;
        totalUnscheduledSlots.value = auditRes.data.data.total_unscheduled_school_slots;
      }
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'تعذر إلغاء الحصة من الجدول.');
  } finally {
    isDeleting.value = false;
  }
}

// Teacher Timetable View
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

// Helper: Get slot for day and period in section timetable
function getSlotFor(dayKey: string, periodSlotId: number): TimetableSlotItem | undefined {
  const dayGroup = sectionTimetable.value.find((d) => d.day_of_week === dayKey);
  return dayGroup?.slots.find((s) => s.period_slot_id === periodSlotId);
}

// Helper: Get slot for day and period in teacher timetable
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
  if (isAuditMode.value) {
    await toggleAuditMode();
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
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- 1. Header Toolbar -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <Calendar class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                جدول الحصص الأسبوعي
              </h1>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                إدارة وتوزيع الحصص المدرسية، مصفوفة الشعب، وفحص حظر تضارب المعلمين والشعب
              </p>
            </div>
          </div>
        </div>

        <!-- Mode & Action Buttons -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- View Switcher -->
          <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              @click="activeViewTab = 'sections'"
              class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
              :class="activeViewTab === 'sections' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
            >
              جدول الشُعب الدراسية
            </button>
            <button
              type="button"
              @click="activeViewTab = 'teachers'"
              class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
              :class="activeViewTab === 'teachers' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
            >
              جدول المعلمين
            </button>
          </div>

          <!-- Audit Mode Toggle (Admin Only) -->
          <button
            v-if="isAdmin && activeViewTab === 'sections'"
            type="button"
            @click="toggleAuditMode"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
            :class="isAuditMode ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-400/30' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'"
          >
            <BarChart3 class="w-4 h-4" />
            <span>{{ isAuditMode ? 'إلغاء وضع التدقيق' : '📊 تدقيق اكتمال الجدول والشواغر' }}</span>
          </button>

          <!-- Add Slot Button (Admin Only) -->
          <button
            v-if="isAdmin"
            type="button"
            @click="openCreateDrawer()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus class="w-4 h-4" />
            <span>+ تسكين حصة بالجدول</span>
          </button>
        </div>
      </div>

      <!-- 2. Controls & Selectors Bar -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <!-- Academic Year Selector -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            العام الدراسي
          </label>
          <select
            v-model="selectedYearId"
            class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option v-for="y in academicYears" :key="y.id" :value="y.id">
              {{ y.name }} {{ y.is_active ? '(العام النشط)' : '' }}
            </option>
          </select>
        </div>

        <!-- Filter By Class (in sections view) -->
        <div v-if="activeViewTab === 'sections'">
          <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            تصفية الصف الدراسي
          </label>
          <select
            v-model="selectedClassFilter"
            class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="all">كافة الصفوف الدراسية</option>
            <option v-for="c in classesStructure" :key="c.class_id" :value="c.class_id">
              {{ c.class_name }}
            </option>
          </select>
        </div>

        <!-- Filter / Search -->
        <div v-if="activeViewTab === 'sections'">
          <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            بحث سريع
          </label>
          <div class="relative">
            <input
              v-model="search"
              type="text"
              placeholder="اسم الصف أو الشعبة..."
              class="w-full pl-3.5 pr-9 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <Search class="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
        </div>

        <!-- Teacher Selector (in teachers view) -->
        <div v-if="activeViewTab === 'teachers'" class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            اختر المعلم
          </label>
          <select
            :value="selectedTeacherId"
            @change="selectTeacher(Number(($event.target as HTMLSelectElement).value))"
            class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option v-for="t in teachersList" :key="t.id" :value="t.id">
              {{ t.full_name }} ({{ t.specialization || 'عام' }})
            </option>
          </select>
        </div>
      </div>

      <!-- 3. Audit Banner (When Audit Mode is Active) -->
      <div
        v-if="isAuditMode && activeViewTab === 'sections'"
        class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-amber-900 dark:text-amber-200">
              وضع تدقيق الجداول والشواغر مفعّل
            </h3>
            <p class="text-xs text-amber-700 dark:text-amber-400">
              يتم إبراز الصفوف والشعب التي تعاني من نقص في الحصص الأسبوعية بشارات تحذيرية برتقالية.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
          <span class="text-xs text-slate-500 dark:text-slate-400">إجمالي الحصص الشاغرة بالمدرسة:</span>
          <span class="text-lg font-black text-amber-600 dark:text-amber-400">{{ totalUnscheduledSlots }} حصة</span>
        </div>
      </div>

      <!-- 4. Section Mode: Classes & Sections Cards Grid -->
      <div v-if="activeViewTab === 'sections'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <School class="w-4 h-4 text-blue-500" />
            صفوف وشُعب العام الدراسي
          </h2>
          <span class="text-xs text-slate-400">اضغط على الشعبة لتحميل جدولها الأسبوعي</span>
        </div>

        <div v-if="structureLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
        </div>

        <div v-else-if="filteredClasses.length === 0" class="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <School class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p class="text-sm text-slate-500 dark:text-slate-400">لا توجد صفوف أو شُعب مطابقة للبحث.</p>
        </div>

        <!-- Class Cards Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="cls in filteredClasses"
            :key="cls.class_id"
            class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border transition-all shadow-sm"
            :class="[
              isAuditMode && auditMap[cls.class_id]?.classTotalUnscheduled > 0
                ? 'border-amber-400/80 dark:border-amber-500/50 bg-amber-50/20'
                : isAuditMode
                ? 'border-emerald-400/80 dark:border-emerald-500/50 bg-emerald-50/20'
                : 'border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/50',
            ]"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <h3 class="font-bold text-slate-900 dark:text-white text-sm">
                  {{ cls.class_name }}
                </h3>
              </div>

              <!-- Audit Badge on Class -->
              <div v-if="isAuditMode && auditMap[cls.class_id]">
                <span
                  v-if="auditMap[cls.class_id].classTotalUnscheduled > 0"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                >
                  ⚠️ {{ auditMap[cls.class_id].classTotalUnscheduled }} شاغر
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                >
                  ✅ مكتمل
                </span>
              </div>
            </div>

            <!-- Sections Buttons -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="sec in cls.sections"
                :key="sec.class_section_id"
                type="button"
                @click="selectSection(sec.class_section_id, cls.class_name, sec.section_name)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5"
                :class="[
                  selectedSectionId === sec.class_section_id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100',
                  isAuditMode && auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count > 0
                    ? 'border-amber-400 text-amber-700 dark:text-amber-300'
                    : '',
                ]"
              >
                <span>{{ sec.section_name }}</span>
                <!-- Section Deficit Badge in Audit Mode -->
                <span
                  v-if="isAuditMode && auditMap[cls.class_id]?.sections[sec.class_section_id]"
                  class="text-[10px] px-1.5 py-0.2 rounded-md font-bold"
                  :class="
                    auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count > 0
                      ? 'bg-amber-200/80 text-amber-900'
                      : 'bg-emerald-200/80 text-emerald-900'
                  "
                >
                  {{
                    auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count > 0
                      ? `-${auditMap[cls.class_id]?.sections[sec.class_section_id]?.unscheduled_slots_count} ⚠️`
                      : '✓'
                  }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Weekly Timetable Matrix Section -->
      <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <!-- Matrix Header -->
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <Clock class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">
                {{
                  activeViewTab === 'sections'
                    ? selectedSectionInfo
                      ? `${selectedSectionInfo.class_name} — ${selectedSectionInfo.section_name}`
                      : 'اختر شعبة دراسية'
                    : teacherTimetableData
                    ? `جدول المعلم: ${teacherTimetableData.teacher_name}`
                    : 'اختر معلماً لعرض جدوله'
                }}
              </h3>
              <p class="text-xs text-slate-400">
                مصفوفة توزيع الحصص الأسبوعية المنظمة بالأيام والفترات الزمنية
              </p>
            </div>
          </div>

          <div v-if="activeViewTab === 'sections' && selectedSectionId && isAdmin">
            <button
              type="button"
              @click="openCreateDrawer()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all border border-blue-200 dark:border-blue-800"
            >
              <Plus class="w-3.5 h-3.5" />
              تسكين حصة جديدة بالشعبة
            </button>
          </div>
        </div>

        <!-- Matrix Content / Table Grid -->
        <div class="p-4 overflow-x-auto">
          <div v-if="matrixLoading" class="p-12 text-center">
            <Loader2 class="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p class="text-sm text-slate-400">جاري تحميل مصفوفة الجدول الأسبوعي...</p>
          </div>

          <table v-else class="w-full border-collapse min-w-[750px]">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800">
                <th class="p-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 w-28 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl">
                  اليوم / الحصة
                </th>
                <th
                  v-for="period in teachingPeriods"
                  :key="period.id"
                  class="p-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60"
                >
                  <div class="font-bold">{{ period.name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                    {{ period.start_time?.slice(0, 5) }} - {{ period.end_time?.slice(0, 5) }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Section Timetable Rows -->
              <template v-if="activeViewTab === 'sections'">
                <tr
                  v-for="day in daysOfWeekOptions"
                  :key="day.id"
                  class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <!-- Day Label -->
                  <td class="p-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50/30 dark:bg-slate-800/20">
                    {{ day.name }}
                  </td>

                  <!-- Period Cells -->
                  <td
                    v-for="period in teachingPeriods"
                    :key="period.id"
                    class="p-2.5 border-r border-slate-100 dark:border-slate-800/60 align-top h-24 min-w-[130px]"
                  >
                    <!-- Scheduled Slot Cell -->
                    <div
                      v-if="getSlotFor(day.id, period.id)"
                      class="h-full bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-2.5 flex flex-col justify-between group transition-all hover:shadow-md"
                    >
                      <div>
                        <div class="font-bold text-xs text-blue-950 dark:text-blue-200 line-clamp-1">
                          {{ getSlotFor(day.id, period.id)?.subject_name }}
                        </div>
                        <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 line-clamp-1">
                          <UserCheck class="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{{ getSlotFor(day.id, period.id)?.teacher_name }}</span>
                        </div>
                      </div>

                      <!-- Action Buttons (Admin Only) -->
                      <div
                        v-if="isAdmin"
                        class="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-blue-100 dark:border-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <button
                          type="button"
                          @click="openEditDrawer(getSlotFor(day.id, period.id)!, day.id)"
                          class="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-100/50 dark:hover:bg-blue-900/50 transition-colors"
                          title="تعديل الحصة"
                        >
                          <Edit2 class="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          @click="promptDeleteSlot(getSlotFor(day.id, period.id)!)"
                          class="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="إلغاء الحصة"
                        >
                          <Trash2 class="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <!-- Empty Slot Cell -->
                    <div
                      v-else
                      class="h-full rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50"
                    >
                      <button
                        v-if="isAdmin"
                        type="button"
                        @click="openCreateDrawer(day.id, period.id)"
                        class="text-[11px] font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                      >
                        <Plus class="w-3 h-3" />
                        <span>تسكين</span>
                      </button>
                      <span v-else class="text-[10px] text-slate-300 dark:text-slate-600">شاغر</span>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Teacher Timetable Rows -->
              <template v-else>
                <tr
                  v-for="day in daysOfWeekOptions"
                  :key="day.id"
                  class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <td class="p-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50/30 dark:bg-slate-800/20">
                    {{ day.name }}
                  </td>
                  <td
                    v-for="period in teachingPeriods"
                    :key="period.id"
                    class="p-2.5 border-r border-slate-100 dark:border-slate-800/60 align-top h-24 min-w-[130px]"
                  >
                    <div
                      v-if="getTeacherSlotFor(day.id, period.id)"
                      class="h-full bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-2.5 flex flex-col justify-between"
                    >
                      <div>
                        <div class="font-bold text-xs text-emerald-950 dark:text-emerald-200 line-clamp-1">
                          {{ getTeacherSlotFor(day.id, period.id)?.subject_name }}
                        </div>
                        <div class="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 line-clamp-1">
                          <School class="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{{ getTeacherSlotFor(day.id, period.id)?.class_name }} - {{ getTeacherSlotFor(day.id, period.id)?.section_name }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="h-full rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
                      <span class="text-[10px] text-slate-300 dark:text-slate-600">فراغ</span>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 6. Slide-Over Drawer for Slot Create / Update -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        @close="showDrawer = false"
        :title="drawerMode === 'create' ? 'تسكين حصة جديدة بالجدول الأسبوعي' : 'تعديل وتحديث موعد الحصة'"
        :subtitle="selectedSectionInfo ? `${selectedSectionInfo.class_name} — ${selectedSectionInfo.section_name}` : ''"
      >
        <form @submit.prevent="submitDrawer" class="space-y-5 p-1">
          <!-- General Form Error Banner -->
          <div
            v-if="formErrorMessage"
            class="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Day of Week -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              يوم الحصة في الأسبوع <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.day_of_week"
              class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option v-for="d in daysOfWeekOptions" :key="d.id" :value="d.id">
                {{ d.name }}
              </option>
            </select>
          </div>

          <!-- Period Slot -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              الحصة اليومية والتوقيت <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.period_slot_id"
              class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option v-for="p in teachingPeriods" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.start_time?.slice(0, 5) }} - {{ p.end_time?.slice(0, 5) }})
              </option>
            </select>
            <p v-if="formErrors.period_slot_id" class="text-xs text-red-500 mt-1">
              {{ formErrors.period_slot_id }}
            </p>
          </div>

          <!-- Teaching Assignment (Subject + Teacher) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              المادة والمعلم المكلف <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.teaching_assignment_id"
              class="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option v-for="asgn in availableAssignments" :key="asgn.id" :value="asgn.id">
                {{ asgn.subject_name }} — أ. {{ asgn.teacher_name }}
              </option>
            </select>
            <p v-if="formErrors.teaching_assignment_id" class="text-xs text-red-500 mt-1">
              {{ formErrors.teaching_assignment_id }}
            </p>
            <p class="text-[11px] text-slate-400 mt-1">
              💡 الربط التلقائي: يتم جلب المعلم المكلف بتدريس المادة في هذه الشعبة مباشرة من سجلات التكليفات.
            </p>
          </div>

          <!-- Submit Button -->
          <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="showDrawer = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <Save v-else class="w-3.5 h-3.5" />
              <span>{{ drawerMode === 'create' ? 'تسكين الحصة الآن' : 'تحديث الحصة' }}</span>
            </button>
          </div>
        </form>
      </TaqniyaDrawer>

      <!-- 7. Confirmation Modal for Delete -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-xl space-y-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600">
              <Trash2 class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white">إلغاء وتفريغ الحصة من الجدول</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">تأكيد حذف الحصة وإخلاء الفترة الزمنية بالشعبة</p>
            </div>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <div><strong>المادة:</strong> {{ slotToDelete?.subject_name }}</div>
            <div><strong>المعلم:</strong> {{ slotToDelete?.teacher_name }}</div>
            <div><strong>الحصة:</strong> {{ slotToDelete?.period_name }}</div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              تراجع
            </button>
            <button
              type="button"
              @click="confirmDeleteSlot"
              :disabled="isDeleting"
              class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 transition-all"
            >
              <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
              <span>تأكيد الحذف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
