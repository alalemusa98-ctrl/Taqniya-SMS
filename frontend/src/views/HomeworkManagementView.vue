<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Plus,
  BookOpen,
  Clock,
  Search,
  Filter,
  RotateCcw,
  School,
  CheckCircle2,
  Trash2,
  Loader2,
  TrendingUp,
  Eye,
  Edit2,
  Paperclip,
  FileText,
} from 'lucide-vue-next';
import {
  homeworkApi,
  type HomeworkItem,
  type HomeworkDetailData,
  type ClassWithHomework,
  type PaginationMeta,
} from '../api/homework.api';
import { academicApi, type AcademicYearItem } from '../api/academic.api';
import { teachersApi, type Teacher } from '../api/teachers.api';
import { teachingAssignmentsApi, type AssignmentItem } from '../api/teaching-assignments.api';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import HomeworkDetailDrawer from '../components/homework/HomeworkDetailDrawer.vue';
import HomeworkDrawerForm from '../components/homework/HomeworkDrawerForm.vue';

const authStore = useAuthStore();
const toast = useToast();

const isAdmin = computed(() => authStore.user?.role_type === 'admin');
const isTeacher = computed(() => authStore.user?.role_type === 'teacher');
const canManage = computed(() => isAdmin.value || isTeacher.value);

// State Management
const loading = ref(false);
const isSubmitting = ref(false);

// Academic Years & Structure
const academicYears = ref<AcademicYearItem[]>([]);
const selectedYearId = ref<number>(0);
const selectedTermId = ref<number | null>(null);
const currentYearName = ref('');
const currentTermName = ref('');

// Metadata for cascading filters
const allClasses = ref<any[]>([]);
const allTeachers = ref<Teacher[]>([]);
const allClassSections = ref<any[]>([]);
const allClassSubjects = ref<any[]>([]);

// Homework Data Hierarchy
const classesData = ref<ClassWithHomework[]>([]);
const paginationMeta = ref<PaginationMeta>({
  total: 0,
  current_page: 1,
  per_page: 15,
  last_page: 1,
});

// Available Teaching Assignments for Drawer Form
const availableTeachingAssignments = ref<AssignmentItem[]>([]);

// Filter States (Draft inputs)
const searchQuery = ref('');
const selectedClassFilter = ref<number | string>('all');
const selectedSectionFilter = ref<number | string>('all');
const selectedTeacherFilter = ref<number | string>('all');
const selectedSubjectFilter = ref<number | string>('all');
const selectedStatusFilter = ref<'all' | 'active' | 'expired'>('all');
const selectedDueDate = ref('');

// Applied Filter States
const appliedSearchQuery = ref('');
const appliedClassFilter = ref<number | string>('all');
const appliedSectionFilter = ref<number | string>('all');
const appliedTeacherFilter = ref<number | string>('all');
const appliedSubjectFilter = ref<number | string>('all');
const appliedStatusFilter = ref<'all' | 'active' | 'expired'>('all');
const appliedDueDate = ref('');

// Drawer & Modal States
const showFormDrawer = ref(false);
const formDrawerMode = ref<'create' | 'edit'>('create');
const itemToEdit = ref<HomeworkDetailData | null>(null);

const showDetailDrawer = ref(false);
const selectedHomeworkDetail = ref<HomeworkDetailData | null>(null);
const detailLoading = ref(false);

const showDeleteModal = ref(false);
const itemToDelete = ref<HomeworkItem | null>(null);
const isDeleting = ref(false);

// Active Academic Year object
const activeAcademicYear = computed(() => {
  return academicYears.value.find((y) => y.id === selectedYearId.value) || academicYears.value[0];
});

// 1. Class Filter Options
const classOptions = computed<TaqniyaSelectOption[]>(() => {
  const opts: TaqniyaSelectOption[] = [{ value: 'all', label: 'جميع الصفوف الدراسية' }];
  allClasses.value.forEach((c) => {
    opts.push({ value: c.id, label: c.name });
  });
  return opts;
});

// 2. Section Filter Options (Cascading: Dependent on Class Selection)
const sectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (selectedClassFilter.value === 'all') {
    return [{ value: 'all', label: 'يرجى اختيار الصف أولاً...' }];
  }
  const classId = Number(selectedClassFilter.value);
  const sections = allClassSections.value.filter((s) => s.class_id === classId);
  return [
    { value: 'all', label: 'جميع الشُعب الدراسية' },
    ...sections.map((s) => ({ value: s.id, label: s.name })),
  ];
});

// 3. Subject Filter Options (Cascading: Dependent on Class Selection)
const subjectOptions = computed<TaqniyaSelectOption[]>(() => {
  if (selectedClassFilter.value === 'all') {
    return [{ value: 'all', label: 'يرجى اختيار الصف أولاً...' }];
  }
  const classId = Number(selectedClassFilter.value);
  const classObj = allClassSubjects.value.find((c: any) => c.class_id === classId);
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
  return [
    { value: 'all', label: 'جميع المواد التعليمية' },
    ...subs.map((s) => ({
      value: s.subject_id,
      label: s.name,
      description: s.code ? `كود: ${s.code}` : undefined,
    })),
  ];
});

// 4. Teacher Filter Options
const teacherOptions = computed<TaqniyaSelectOption[]>(() => {
  return [
    { value: 'all', label: 'جميع المعلمين / الأساتذة' },
    ...allTeachers.value.map((t) => ({
      value: t.id,
      label: t.full_name,
      description: t.specialization ? `تخصص: ${t.specialization}` : undefined,
    })),
  ];
});

// 5. Status Filter Options
const statusOptions: TaqniyaSelectOption[] = [
  { value: 'all', label: 'كافة الحالات' },
  { value: 'active', label: 'الواجبات السارية فقط' },
  { value: 'expired', label: 'الواجبات المنتهية فقط' },
];

// When Class Filter changes, reset dependent Section and Subject filters
watch(selectedClassFilter, () => {
  selectedSectionFilter.value = 'all';
  selectedSubjectFilter.value = 'all';
});

// Active Filter Indicator
const hasActiveFilters = computed(() => {
  return (
    appliedSearchQuery.value.trim() !== '' ||
    appliedClassFilter.value !== 'all' ||
    appliedSectionFilter.value !== 'all' ||
    appliedTeacherFilter.value !== 'all' ||
    appliedSubjectFilter.value !== 'all' ||
    appliedStatusFilter.value !== 'all' ||
    appliedDueDate.value !== ''
  );
});

// Overall Homework Items Count
const totalActiveCount = computed(() => {
  let count = 0;
  classesData.value.forEach((c) => {
    c.sections.forEach((s) => {
      s.assignments.forEach((a) => {
        if (a.status === 'active') count++;
      });
    });
  });
  return count;
});

const totalExpiredCount = computed(() => {
  let count = 0;
  classesData.value.forEach((c) => {
    c.sections.forEach((s) => {
      s.assignments.forEach((a) => {
        if (a.status === 'expired') count++;
      });
    });
  });
  return count;
});

const totalClassesCount = computed(() => classesData.value.length);

export interface EnrichedHomeworkRow {
  id: number;
  indexNumber: number;
  class_id: number;
  class_name: string;
  class_section_id: number;
  section_name: string;
  subject_name: string;
  teacher_name: string;
  title: string;
  attachments_count: number;
  assigned_date: string;
  due_date: string;
  status: 'active' | 'expired';
  deadlineInfo: { label: string; isUrgent: boolean; isExpired: boolean } | null;
  raw: HomeworkItem;
}

// Flat list for Datatable presentation
const allHomeworkRows = computed<EnrichedHomeworkRow[]>(() => {
  const list: EnrichedHomeworkRow[] = [];
  let idx = (paginationMeta.value.current_page - 1) * paginationMeta.value.per_page + 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  classesData.value.forEach((cls) => {
    cls.sections?.forEach((sec) => {
      sec.assignments?.forEach((hw) => {
        let deadlineInfo: { label: string; isUrgent: boolean; isExpired: boolean } | null = null;
        if (hw.due_date) {
          const due = new Date(hw.due_date);
          due.setHours(0, 0, 0, 0);
          const diffTime = due.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            const days = Math.abs(diffDays);
            const dayText = days === 1 ? 'يوم واحد' : days === 2 ? 'يومين' : `${days} أيام`;
            deadlineInfo = { label: `منتهي (منذ ${dayText})`, isUrgent: false, isExpired: true };
          } else if (diffDays === 0) {
            deadlineInfo = { label: 'مستحق اليوم!', isUrgent: true, isExpired: false };
          } else if (diffDays === 1) {
            deadlineInfo = { label: 'مستحق غداً', isUrgent: true, isExpired: false };
          } else if (diffDays === 2) {
            deadlineInfo = { label: 'متبقي يومان', isUrgent: false, isExpired: false };
          } else {
            deadlineInfo = { label: `متبقي ${diffDays} أيام`, isUrgent: false, isExpired: false };
          }
        }
        if (hw.status === 'expired' && (!deadlineInfo || !deadlineInfo.isExpired)) {
          deadlineInfo = { label: 'منتهي الصلاحية', isUrgent: false, isExpired: true };
        }

        list.push({
          id: hw.id,
          indexNumber: idx++,
          class_id: cls.class_id,
          class_name: cls.class_name,
          class_section_id: sec.class_section_id,
          section_name: sec.section_name,
          subject_name: hw.subject_name,
          teacher_name: hw.teacher_name,
          title: hw.title,
          attachments_count: hw.attachments_count,
          assigned_date: hw.assigned_date,
          due_date: hw.due_date,
          status: hw.status,
          deadlineInfo,
          raw: hw,
        });
      });
    });
  });

  return list;
});

// Fetch Initial Data
const loadInitialData = async () => {
  try {
    const [yearsRes, termsRes, classesRes, teachersRes, classSectionsRes, classSubjectsRes] = await Promise.all([
      academicApi.getYears(),
      academicApi.getTerms().catch(() => ({ data: { data: [] } })),
      academicApi.getClasses({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
      teachersApi.getTeachers({ per_page: 200, is_active: 1 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClassSections({ per_page: 200 }).catch(() => ({ data: { data: { classes: [] } } })),
      academicApi.getClassSubjects({ per_page: 100 }).catch(() => ({ data: { data: { classes: [] } } })),
    ]);

    if (yearsRes.data && Array.isArray(yearsRes.data)) {
      academicYears.value = yearsRes.data;
      const activeYear = yearsRes.data.find((y: any) => y.is_active === 1) || yearsRes.data[0];
      if (activeYear) {
        selectedYearId.value = activeYear.id;
        currentYearName.value = activeYear.name;
      }
    }

    const termsList = termsRes.data?.data || termsRes.data || [];
    if (Array.isArray(termsList) && termsList.length > 0) {
      selectedTermId.value = termsList[0].id;
      currentTermName.value = termsList[0].name;
    }

    allClasses.value = classesRes.data?.data || classesRes.data || [];
    allTeachers.value = teachersRes.data?.data || teachersRes.data || [];
    allClassSubjects.value = classSubjectsRes.data?.data?.classes || classSubjectsRes.data?.data || [];

    // Flatten class sections
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
  } catch (err: any) {
    console.error('Failed to fetch initial metadata', err);
  }

  // Load Teaching Assignments for drawer dropdown
  if (canManage.value) {
    try {
      const res = await teachingAssignmentsApi.getAll({
        academic_year_id: selectedYearId.value || undefined,
        per_page: 50,
      });
      if (res.data?.data?.classes) {
        const flatAssignments: AssignmentItem[] = [];
        res.data.data.classes.forEach((c: any) => {
          c.sections?.forEach((s: any) => {
            s.assignments?.forEach((a: any) => {
              flatAssignments.push({
                ...a,
                class_section_id: s.class_section_id,
                section_name: `${c.class_name} - ${s.section_name}`,
              });
            });
          });
        });
        availableTeachingAssignments.value = flatAssignments;
      }
    } catch (err: any) {
      console.error('Failed to load teaching assignments', err);
    }
  }

  await fetchHomework();
};

// Fetch Homework List with Full Filters
const fetchHomework = async (page = 1) => {
  loading.value = true;
  try {
    const params: any = {
      academic_year_id: selectedYearId.value || undefined,
      academic_term_id: selectedTermId.value || undefined,
      page,
      per_page: paginationMeta.value.per_page,
    };

    if (appliedSearchQuery.value.trim()) {
      params.search = appliedSearchQuery.value.trim();
    }
    if (appliedClassFilter.value !== 'all') {
      params.class_id = Number(appliedClassFilter.value);
    }
    if (appliedSectionFilter.value !== 'all') {
      params.class_section_id = Number(appliedSectionFilter.value);
    }
    if (appliedTeacherFilter.value !== 'all') {
      params.teacher_id = Number(appliedTeacherFilter.value);
    }
    if (appliedSubjectFilter.value !== 'all') {
      params.subject_id = Number(appliedSubjectFilter.value);
    }
    if (appliedStatusFilter.value !== 'all') {
      params.status = appliedStatusFilter.value;
    }
    if (appliedDueDate.value) {
      params.due_date = appliedDueDate.value;
    }

    const res = await homeworkApi.getAll(params);
    if (res.data?.data) {
      currentYearName.value = res.data.data.academic_year_name;
      currentTermName.value = res.data.data.academic_term_name;
      classesData.value = res.data.data.classes || [];
    }
    if (res.data?.meta) {
      paginationMeta.value = res.data.meta;
    }
  } catch (err: any) {
    toast.error('حدث خطأ أثناء تحميل كشوفات الواجبات المدرسية');
  } finally {
    loading.value = false;
  }
};

// Filter actions
const applyFilters = () => {
  appliedSearchQuery.value = searchQuery.value;
  appliedClassFilter.value = selectedClassFilter.value;
  appliedSectionFilter.value = selectedSectionFilter.value;
  appliedTeacherFilter.value = selectedTeacherFilter.value;
  appliedSubjectFilter.value = selectedSubjectFilter.value;
  appliedStatusFilter.value = selectedStatusFilter.value;
  appliedDueDate.value = selectedDueDate.value;
  fetchHomework(1);
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedClassFilter.value = 'all';
  selectedSectionFilter.value = 'all';
  selectedTeacherFilter.value = 'all';
  selectedSubjectFilter.value = 'all';
  selectedStatusFilter.value = 'all';
  selectedDueDate.value = '';

  appliedSearchQuery.value = '';
  appliedClassFilter.value = 'all';
  appliedSectionFilter.value = 'all';
  appliedTeacherFilter.value = 'all';
  appliedSubjectFilter.value = 'all';
  appliedStatusFilter.value = 'all';
  appliedDueDate.value = '';

  fetchHomework(1);
};

watch(selectedYearId, () => {
  fetchHomework(1);
});

// Handlers for Drawer & Actions
const handleOpenCreate = () => {
  formDrawerMode.value = 'create';
  itemToEdit.value = null;
  showFormDrawer.value = true;
};

const handleOpenEdit = async (item: HomeworkItem | HomeworkDetailData) => {
  formDrawerMode.value = 'edit';
  try {
    const res = await homeworkApi.getById(item.id);
    if (res.data?.data) {
      itemToEdit.value = res.data.data;
      showFormDrawer.value = true;
      return;
    }
  } catch (err: any) {
    // fallback
  }
  itemToEdit.value = item as any;
  showFormDrawer.value = true;
};

const handleOpenView = async (item: HomeworkItem) => {
  selectedHomeworkDetail.value = null;
  showDetailDrawer.value = true;
  detailLoading.value = true;
  try {
    const res = await homeworkApi.getById(item.id);
    if (res.data?.data) {
      selectedHomeworkDetail.value = res.data.data;
    }
  } catch (err: any) {
    // error fallback
  } finally {
    detailLoading.value = false;
  }
};

const handleFormSubmit = async (payload: any) => {
  isSubmitting.value = true;
  try {
    if (formDrawerMode.value === 'create') {
      await homeworkApi.create(payload);
      toast.success('تم إنشاء ونشر الواجب المدرسي بنجاح');
    } else if (itemToEdit.value) {
      await homeworkApi.update(itemToEdit.value.id, payload);
      toast.success('تم تحديث بيانات الواجب المدرسي بنجاح');
    }
    showFormDrawer.value = false;
    await fetchHomework(paginationMeta.value.current_page);
  } catch (err: any) {
    const msg = err.response?.data?.message || 'فشل حفظ الواجب المدرسي';
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
};

const handleOpenDelete = (item: HomeworkItem) => {
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    await homeworkApi.delete(itemToDelete.value.id);
    toast.success('تم حذف وإلغاء الواجب المدرسي بنجاح');
    showDeleteModal.value = false;
    itemToDelete.value = null;
    await fetchHomework(paginationMeta.value.current_page);
  } catch (err: any) {
    const msg = err.response?.data?.message || 'فشل حذف الواجب';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  loadInitialData();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card (Matching Taqniya Reference Design System) -->
      <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
        
        <!-- 1. Card Header: Title on Right, Controls & Actions on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#B4AED8]/60 dark:border-white/10">
          <!-- Title & Subtitle with Taqniya Brand Accent -->
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                الواجبات المدرسية والتكاليف المنزلية
              </h2>
              <span
                v-if="activeAcademicYear"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-xs"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>العام الدراسي النشط: {{ activeAcademicYear.name }}</span>
              </span>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              متابعة وإدارة التكاليف والأنشطة المنزلية، الملازم والمرفقات، ومواعيد الاستحقاق
            </p>
          </div>

          <!-- Controls: Add Button + Search Trigger -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Button (Admin / Teacher) -->
            <button
              v-if="canManage"
              type="button"
              @click="handleOpenCreate"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ إنشاء واجب جديد</span>
            </button>

            <!-- Search Input with Search Trigger -->
            <div class="relative flex-1 sm:w-72 flex items-center gap-1.5">
              <div class="relative flex-1">
                <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
                <input
                  v-model="searchQuery"
                  @keydown.enter="applyFilters"
                  type="text"
                  placeholder="بحث في العناوين والمواد والمعلمين..."
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

        <!-- 2. KPI Metrics Cards (Exact Taqniya Spatial Theme) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
          <TaqniyaKpiCard
            title="إجمالي الواجبات المسجلة"
            :value="`${paginationMeta.total} واجب`"
            subtitle="سجل تكليف مدرسي"
            :icon="BookOpen"
            variant="primary"
            badge-text="التراكمي"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
          />

          <TaqniyaKpiCard
            title="الواجبات السارية للتسليم"
            :value="`${totalActiveCount} نشط`"
            subtitle="قيد الإنجاز حالياً"
            :icon="Clock"
            variant="emerald"
            badge-text="متاح للتسليم"
          />

          <TaqniyaKpiCard
            title="الواجبات المنتهية"
            :value="`${totalExpiredCount} منتهي`"
            subtitle="انتهى موعد استحقاقها"
            :icon="CheckCircle2"
            variant="blue"
          />

          <TaqniyaKpiCard
            title="الصفوف الدراسية المغطاة"
            :value="`${totalClassesCount} صف`"
            subtitle="صف دراسي مسجل"
            :icon="School"
            variant="amber"
          />
        </div>

        <!-- 3. Filters Toolbar with Cascading Class/Section/Subject Dependencies -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] mb-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <!-- 1. Class Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الصف الدراسي</label>
              <TaqniyaSelect
                v-model="selectedClassFilter"
                :options="classOptions"
                placeholder="كافة الصفوف..."
                searchable
                full-width
              />
            </div>

            <!-- 2. Section Filter (Cascading: Dependent on Class) -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center justify-between">
                <span>الشعبة الدراسية</span>
                <span v-if="selectedClassFilter === 'all'" class="text-[10px] text-amber-500 dark:text-amber-400 font-normal">
                  (يتطلب اختيار الصف)
                </span>
              </label>
              <TaqniyaSelect
                v-model="selectedSectionFilter"
                :options="sectionOptions"
                :disabled="selectedClassFilter === 'all'"
                placeholder="كافة الشُعب..."
                full-width
              />
            </div>

            <!-- 3. Subject Filter (Cascading: Dependent on Class) -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1 flex items-center justify-between">
                <span>المادة التعليمية</span>
                <span v-if="selectedClassFilter === 'all'" class="text-[10px] text-amber-500 dark:text-amber-400 font-normal">
                  (يتطلب اختيار الصف)
                </span>
              </label>
              <TaqniyaSelect
                v-model="selectedSubjectFilter"
                :options="subjectOptions"
                :disabled="selectedClassFilter === 'all'"
                placeholder="كافة المواد..."
                searchable
                full-width
              />
            </div>

            <!-- 4. Teacher Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">المعلم / الأستاذ</label>
              <TaqniyaSelect
                v-model="selectedTeacherFilter"
                :options="teacherOptions"
                placeholder="كافة المعلمين..."
                searchable
                full-width
              />
            </div>

            <!-- 5. Status Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">حالة الواجب</label>
              <TaqniyaSelect
                v-model="selectedStatusFilter"
                :options="statusOptions"
                placeholder="كافة الحالات..."
                full-width
              />
            </div>

            <!-- 6. Due Date Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">موعد الاستحقاق</label>
              <input
                v-model="selectedDueDate"
                type="date"
                class="w-full px-4 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title focus:outline-none focus:border-bx-primary transition-all"
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

        <!-- 4. Loading State -->
        <div v-if="loading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
          <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
          <span class="text-xs font-bold">جاري تحميل كشوفات الواجبات والتكاليف المدرسية...</span>
        </div>

        <!-- 5. Empty State -->
        <div
          v-else-if="classesData.length === 0"
          class="py-14 text-center space-y-3 rounded-2xl border border-dashed border-[#B4AED8] dark:border-white/[0.12] p-8"
        >
          <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-bx-primary flex items-center justify-center mx-auto">
            <BookOpen class="w-6 h-6" />
          </div>
          <h3 class="text-sm font-bold text-bx-title">لا توجد واجبات مدرسية مسجلة تطابق محددات البحث</h3>
          <p class="text-xs text-bx-muted max-w-sm mx-auto">
            يمكنك البدء بإنشاء ونشر أول تكليف منزلي للطلاب وإرفاق الملازم ومواعيد التسليم.
          </p>
          <button
            v-if="canManage"
            @click="handleOpenCreate"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>إنشاء أول واجب الآن</span>
          </button>
        </div>

        <!-- 6. Unified Datatable Content: Enclosed in a Bordered Card -->
        <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-start border-collapse text-xs">
              <!-- Table Header with Distinct Background and Crisp Dividers -->
              <thead>
                <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8]/60 dark:border-white/15 text-bx-muted">
                  <th class="py-3 px-4 font-bold text-start w-12 font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">#</th>
                  
                  <!-- 1. Subject & Teacher combined -->
                  <th class="py-3 px-4 font-bold text-start min-w-[190px] border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center gap-1.5">
                      <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                      <span>المادة والمعلم</span>
                    </div>
                  </th>

                  <!-- 2. Homework Title -->
                  <th class="py-3 px-4 font-bold text-start min-w-[200px] border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center gap-1.5">
                      <FileText class="w-3.5 h-3.5 text-bx-primary" />
                      <span>عنوان الواجب</span>
                    </div>
                  </th>

                  <!-- 3. Class & Section -->
                  <th class="py-3 px-4 font-bold text-start min-w-[150px] border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center gap-1.5">
                      <School class="w-3.5 h-3.5 text-bx-primary" />
                      <span>الصف والشعبة</span>
                    </div>
                  </th>

                  <!-- 4. Dates & Deadline -->
                  <th class="py-3 px-4 font-bold text-start min-w-[160px] border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center gap-1.5">
                      <Clock class="w-3.5 h-3.5 text-rose-500" />
                      <span>تاريخ النشر والاستحقاق</span>
                    </div>
                  </th>

                  <!-- 5. Attachments -->
                  <th class="py-3 px-4 font-bold text-center w-28 border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center justify-center gap-1.5">
                      <Paperclip class="w-3.5 h-3.5 text-bx-primary" />
                      <span>المرفقات</span>
                    </div>
                  </th>

                  <!-- 6. Status -->
                  <th class="py-3 px-4 font-bold text-center w-28 border-e border-[#B4AED8]/50 dark:border-white/10">الحالة</th>
                  
                  <!-- 7. Actions -->
                  <th class="py-3 px-4 font-bold text-center w-36 last:border-e-0">الإجراءات</th>
                </tr>
              </thead>

              <!-- Table Body with Crisp Dividers -->
              <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10">
                <tr
                  v-for="(row, idx) in allHomeworkRows"
                  :key="row.id"
                  class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                >
                  <!-- Sequence Counter # -->
                  <td class="py-3.5 px-4 font-bold text-bx-muted text-xs whitespace-nowrap font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">
                    {{ (paginationMeta.current_page - 1) * paginationMeta.per_page + idx + 1 }}
                  </td>

                  <!-- 1. Subject & Teacher (Combined) -->
                  <td class="py-3.5 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="space-y-1">
                      <div>
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs">
                          {{ row.subject_name }}
                        </span>
                      </div>
                      <div class="text-xs text-bx-title font-medium">
                        {{ row.teacher_name }}
                      </div>
                    </div>
                  </td>

                  <!-- 2. Homework Title -->
                  <td class="py-3.5 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <span
                      class="font-black text-xs sm:text-sm text-bx-title block leading-snug group-hover:text-bx-primary transition-colors cursor-pointer"
                      @click="handleOpenView(row.raw)"
                    >
                      {{ row.title }}
                    </span>
                  </td>

                  <!-- 3. Class & Section -->
                  <td class="py-3.5 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="font-bold text-xs text-bx-title">
                      <span>{{ row.class_name }}</span>
                      <span class="text-bx-muted mx-1">•</span>
                      <span class="text-bx-primary">{{ row.section_name }}</span>
                    </div>
                  </td>

                  <!-- 4. Dates -->
                  <td class="py-3.5 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="space-y-1 text-[11px]">
                      <div class="text-bx-muted font-mono">
                        نشر: {{ row.assigned_date.slice(0, 10) }}
                      </div>
                      <div class="font-mono font-medium text-bx-title">
                        استحقاق: {{ row.due_date.slice(0, 10) }}
                      </div>
                    </div>
                  </td>

                  <!-- 5. Attachments Count Badge -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <span
                      v-if="row.attachments_count > 0"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs"
                    >
                      <Paperclip class="w-3.5 h-3.5" />
                      <span>{{ row.attachments_count }} مرفقات</span>
                    </span>
                    <span v-else class="text-bx-muted text-xs font-medium">بدون مرفقات</span>
                  </td>

                  <!-- 6. Status Badge (Displays dynamic remaining days or expired notice) -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <span
                      class="inline-block px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs"
                      :class="
                        row.status === 'expired' || row.deadlineInfo?.isExpired
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : row.deadlineInfo?.isUrgent
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      "
                    >
                      {{ row.deadlineInfo?.label || (row.status === 'active' ? 'ساري للتسليم' : 'منتهي الصلاحية') }}
                    </span>
                  </td>

                  <!-- 7. Action Buttons Toolbar -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap last:border-e-0">
                    <div class="flex items-center justify-center gap-1.5">
                      <!-- View Button -->
                      <button
                        type="button"
                        @click="handleOpenView(row.raw)"
                        class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
                        title="معاينة التفاصيل والمرفقات"
                      >
                        <Eye class="w-3.5 h-3.5" />
                      </button>

                      <!-- Edit Button (Teachers / Admins) -->
                      <button
                        v-if="canManage"
                        type="button"
                        @click="handleOpenEdit(row.raw)"
                        class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-bx-primary text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
                        title="تعديل بيانات الواجب"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>

                      <!-- Delete Button (Teachers / Admins) -->
                      <button
                        v-if="canManage"
                        type="button"
                        @click="handleOpenDelete(row.raw)"
                        class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] hover:border-rose-500 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="حذف الواجب المدرسي"
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

        <!-- 7. Pagination Footer -->
        <div
          v-if="paginationMeta.total > 0 && paginationMeta.last_page > 1"
          class="flex items-center justify-between pt-6 mt-6 border-t border-[#B4AED8]/60 dark:border-white/10 text-xs"
        >
          <span class="text-bx-muted">
            عرض الصفحة {{ paginationMeta.current_page }} من {{ paginationMeta.last_page }} (إجمالي {{ paginationMeta.total }} واجب)
          </span>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="paginationMeta.current_page <= 1"
              @click="fetchHomework(paginationMeta.current_page - 1)"
              class="px-4 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-title disabled:opacity-40 hover:bg-[var(--bx-row-hover)] transition-colors cursor-pointer"
            >
              السابق
            </button>
            <button
              type="button"
              :disabled="paginationMeta.current_page >= paginationMeta.last_page"
              @click="fetchHomework(paginationMeta.current_page + 1)"
              class="px-4 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-title disabled:opacity-40 hover:bg-[var(--bx-row-hover)] transition-colors cursor-pointer"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Slide-over Drawer -->
      <HomeworkDetailDrawer
        v-model="showDetailDrawer"
        :homework="selectedHomeworkDetail"
        :loading="detailLoading"
        @edit="handleOpenEdit"
      />

      <!-- Create / Edit Form Drawer -->
      <HomeworkDrawerForm
        v-model="showFormDrawer"
        :mode="formDrawerMode"
        :item-to-edit="itemToEdit"
        :academic-year-id="selectedYearId"
        :academic-term-id="selectedTermId"
        :available-teaching-assignments="availableTeachingAssignments"
        :is-submitting="isSubmitting"
        @submit="handleFormSubmit"
      />

      <!-- Delete Confirmation Modal (Matching Project Modal Standard) -->
      <Teleport to="body">
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div
            class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            @click="showDeleteModal = false"
          />

          <div class="relative z-10 w-full max-w-sm bg-[var(--bx-surface-solid)] rounded-3xl p-6 shadow-2xl border border-[#B4AED8] dark:border-white/[0.08] space-y-4 text-center">
            <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 class="w-6 h-6" />
            </div>

            <div class="space-y-1">
              <h3 class="text-base font-black text-bx-title font-display">
                حذف الواجب المدرسي
              </h3>
              <p class="text-xs text-bx-muted">
                هل أنت متأكد من رغبتك في حذف هذا الواجب؟ سيتم إلغاؤه من سجلات الطلاب وأولياء الأمور.
              </p>
            </div>

            <div class="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                @click="showDeleteModal = false"
                class="px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                @click="confirmDelete"
                :disabled="isDeleting"
                class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
                <Trash2 v-else class="w-3.5 h-3.5" />
                <span>نعم، حذف الواجب</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </TaqniyaErrorBoundary>
</template>
