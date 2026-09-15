<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Plus,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  Trash2,
  Loader2,
  Eye,
  Edit2,
  Paperclip,
} from 'lucide-vue-next';
import {
  quizzesApi,
  type QuizItem,
  type QuizDetailData,
  type ClassWithQuizzes,
  type PaginationMeta,
} from '../api/quizzes.api';
import { academicApi, type AcademicYearItem } from '../api/academic.api';
import { teachersApi, type Teacher } from '../api/teachers.api';
import { teachingAssignmentsApi, type AssignmentItem } from '../api/teaching-assignments.api';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import QuizDetailDrawer from '../components/quizzes/QuizDetailDrawer.vue';
import QuizDrawerForm from '../components/quizzes/QuizDrawerForm.vue';

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

// Quizzes Data Hierarchy
const classesData = ref<ClassWithQuizzes[]>([]);
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
const selectedStatusFilter = ref<'all' | 'upcoming' | 'completed'>('all');
const selectedQuizDate = ref('');

// Applied Filter States
const appliedSearchQuery = ref('');
const appliedClassFilter = ref<number | string>('all');
const appliedSectionFilter = ref<number | string>('all');
const appliedTeacherFilter = ref<number | string>('all');
const appliedSubjectFilter = ref<number | string>('all');
const appliedStatusFilter = ref<'all' | 'upcoming' | 'completed'>('all');
const appliedQuizDate = ref('');

// Drawer & Modal States
const showFormDrawer = ref(false);
const formDrawerMode = ref<'create' | 'edit'>('create');
const itemToEdit = ref<QuizDetailData | null>(null);

const showDetailDrawer = ref(false);
const selectedQuizDetail = ref<QuizDetailData | null>(null);
const detailLoading = ref(false);

const showDeleteModal = ref(false);
const itemToDelete = ref<QuizItem | null>(null);
const isDeleting = ref(false);

// Class Filter Options
const classOptions = computed<TaqniyaSelectOption[]>(() => {
  const opts: TaqniyaSelectOption[] = [{ value: 'all', label: 'جميع الصفوف الدراسية' }];
  allClasses.value.forEach((c) => {
    opts.push({ value: c.id, label: c.name });
  });
  return opts;
});

// Section Filter Options (Cascading)
const sectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (selectedClassFilter.value === 'all') {
    return [{ value: 'all', label: 'اختر الصف أولاً...' }];
  }
  const classId = Number(selectedClassFilter.value);
  const sections = allClassSections.value.filter((s) => s.class_id === classId);
  return [
    { value: 'all', label: 'جميع الشُعب الدراسية' },
    ...sections.map((s) => ({ value: s.id, label: s.name })),
  ];
});

// Teacher Filter Options
const teacherOptions = computed<TaqniyaSelectOption[]>(() => {
  const opts: TaqniyaSelectOption[] = [{ value: 'all', label: 'جميع المعلمين' }];
  allTeachers.value.forEach((t) => {
    opts.push({ value: t.id, label: t.full_name });
  });
  return opts;
});

// Status Filter Options
const statusOptions: TaqniyaSelectOption[] = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'upcoming', label: 'القادمة والمجدولة' },
  { value: 'completed', label: 'المكتملة والمنفذة' },
];

// Computed KPIs
const totalQuizzesCount = computed(() => paginationMeta.value.total);

const upcomingQuizzesCount = computed(() => {
  let count = 0;
  classesData.value.forEach((c) => {
    c.sections.forEach((s) => {
      count += s.quizzes.filter((q) => q.status === 'upcoming').length;
    });
  });
  return count;
});

const completedQuizzesCount = computed(() => {
  let count = 0;
  classesData.value.forEach((c) => {
    c.sections.forEach((s) => {
      count += s.quizzes.filter((q) => q.status === 'completed').length;
    });
  });
  return count;
});

const totalAttachmentsCount = computed(() => {
  let count = 0;
  classesData.value.forEach((c) => {
    c.sections.forEach((s) => {
      s.quizzes.forEach((q) => {
        count += q.attachments_count || 0;
      });
    });
  });
  return count;
});

// Load Metadata
const loadMetadata = async () => {
  try {
    const [yearsRes, classesRes, teachersRes, sectionsRes, subsRes, taRes] = await Promise.all([
      academicApi.getYears().catch(() => ({ data: { data: [] } })),
      academicApi.getClasses({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
      teachersApi.getTeachers({ per_page: 200, is_active: 1 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClassSections({ per_page: 200 }).catch(() => ({ data: { data: { classes: [] } } })),
      academicApi.getClassSubjects({ per_page: 100 }).catch(() => ({ data: { data: { classes: [] } } })),
      teachingAssignmentsApi.getAll({ per_page: 100 }).catch(() => ({ data: { data: { classes: [] } } })),
    ]);

    const yData = yearsRes.data?.data || yearsRes.data || [];
    if (Array.isArray(yData) && yData.length > 0) {
      academicYears.value = yData;
      const activeYear = yData.find((y: any) => y.is_active === 1) || yData[0];
      if (activeYear) {
        selectedYearId.value = activeYear.id;
      }
    }

    allClasses.value = classesRes.data?.data || classesRes.data || [];
    allTeachers.value = teachersRes.data?.data || teachersRes.data || [];
    allClassSubjects.value = subsRes.data?.data?.classes || subsRes.data?.data || [];

    const groupedClasses = sectionsRes.data?.data?.classes || [];
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

    const taClasses = taRes.data?.data?.classes || [];
    const flatList: any[] = [];
    taClasses.forEach((c: any) => {
      c.sections?.forEach((s: any) => {
        s.assignments?.forEach((a: any) => {
          flatList.push({
            ...a,
            class_id: c.class_id,
            class_name: c.class_name,
            class_section_id: s.class_section_id,
            section_name: s.section_name,
          });
        });
      });
    });
    availableTeachingAssignments.value = flatList;
  } catch (err) {
    console.error('Failed to load quizzes metadata:', err);
  }
};

// Fetch Quizzes List
const fetchQuizzes = async (page = 1) => {
  loading.value = true;
  try {
    const params: any = {
      page,
      per_page: paginationMeta.value.per_page,
      sort_by: 'quiz_date',
      sort_order: 'asc',
    };

    if (selectedYearId.value) params.academic_year_id = selectedYearId.value;
    if (selectedTermId.value) params.academic_term_id = selectedTermId.value;

    if (appliedSearchQuery.value.trim()) params.search = appliedSearchQuery.value.trim();
    if (appliedClassFilter.value !== 'all') params.class_id = Number(appliedClassFilter.value);
    if (appliedSectionFilter.value !== 'all') params.class_section_id = Number(appliedSectionFilter.value);
    if (appliedTeacherFilter.value !== 'all') params.teacher_id = Number(appliedTeacherFilter.value);
    if (appliedStatusFilter.value !== 'all') params.status = appliedStatusFilter.value;
    if (appliedQuizDate.value) params.quiz_date = appliedQuizDate.value;

    const res = await quizzesApi.getQuizzes(params);

    if (res.success && res.data) {
      currentYearName.value = res.data.academic_year_name;
      currentTermName.value = res.data.academic_term_name;
      classesData.value = res.data.classes || [];

      if (res.meta) {
        paginationMeta.value = res.meta;
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch quizzes:', err);
    toast.error(err.message || 'حدث خطأ أثناء جلب مصفوفة الاختبارات');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  appliedSearchQuery.value = searchQuery.value;
  appliedClassFilter.value = selectedClassFilter.value;
  appliedSectionFilter.value = selectedSectionFilter.value;
  appliedTeacherFilter.value = selectedTeacherFilter.value;
  appliedSubjectFilter.value = selectedSubjectFilter.value;
  appliedStatusFilter.value = selectedStatusFilter.value;
  appliedQuizDate.value = selectedQuizDate.value;

  fetchQuizzes(1);
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedClassFilter.value = 'all';
  selectedSectionFilter.value = 'all';
  selectedTeacherFilter.value = 'all';
  selectedSubjectFilter.value = 'all';
  selectedStatusFilter.value = 'all';
  selectedQuizDate.value = '';

  appliedSearchQuery.value = '';
  appliedClassFilter.value = 'all';
  appliedSectionFilter.value = 'all';
  appliedTeacherFilter.value = 'all';
  appliedSubjectFilter.value = 'all';
  appliedStatusFilter.value = 'all';
  appliedQuizDate.value = '';

  fetchQuizzes(1);
};

// Open Create Drawer
const openCreateDrawer = () => {
  formDrawerMode.value = 'create';
  itemToEdit.value = null;
  showFormDrawer.value = true;
};

// Open Edit Drawer
const openEditDrawer = async (item: QuizItem | QuizDetailData) => {
  try {
    const res = await quizzesApi.getQuizById(item.id);
    if (res.success && res.data) {
      itemToEdit.value = res.data;
      formDrawerMode.value = 'edit';
      showDetailDrawer.value = false;
      showFormDrawer.value = true;
    }
  } catch (err: any) {
    toast.error('تعذر جلب تفاصيل الاختبار للتعديل');
  }
};

// Open Detail Drawer
const openDetailDrawer = async (item: QuizItem) => {
  showDetailDrawer.value = true;
  detailLoading.value = true;
  try {
    const res = await quizzesApi.getQuizById(item.id);
    if (res.success && res.data) {
      selectedQuizDetail.value = res.data;
    }
  } catch (err: any) {
    toast.error('تعذر جلب تفاصيل ومرفقات الاختبار');
  } finally {
    detailLoading.value = false;
  }
};

// Open Delete Modal
const openDeleteModal = (item: QuizItem) => {
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

// Confirm Delete
const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await quizzesApi.deleteQuiz(itemToDelete.value.id);
    if (res.success) {
      toast.success(res.message || 'تم حذف الاختبار الدوري بنجاح.');
      showDeleteModal.value = false;
      itemToDelete.value = null;
      fetchQuizzes(paginationMeta.value.current_page);
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'تعذر حذف الاختبار الدوري');
  } finally {
    isDeleting.value = false;
  }
};

// Form Submit (Create / Edit)
const handleFormSubmit = async (payload: any) => {
  isSubmitting.value = true;
  try {
    if (formDrawerMode.value === 'create') {
      const res = await quizzesApi.createQuiz(payload);
      if (res.success) {
        toast.success(res.message || 'تم جدولة ونشر الاختبار الدوري بنجاح.');
        showFormDrawer.value = false;
        fetchQuizzes(1);
      }
    } else if (itemToEdit.value) {
      const res = await quizzesApi.updateQuiz(itemToEdit.value.id, payload);
      if (res.success) {
        toast.success(res.message || 'تم تحديث موعد وتفاصيل الاختبار الدوري بنجاح.');
        showFormDrawer.value = false;
        fetchQuizzes(paginationMeta.value.current_page);
      }
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل حفظ بيانات الاختبار');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  await loadMetadata();
  await fetchQuizzes(1);
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-6 pb-12">
      <!-- Page Header with KPIs -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              المرحلة 07
            </span>
            <span class="text-xs text-slate-400 font-medium">
              {{ currentYearName || 'العام الدراسي النشط' }} • {{ currentTermName || 'الفصل الدراسي الأول' }}
            </span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            جدول ومواعيد الاختبارات والتطبيقات الدورية
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة وجدولة ونشر الاختبارات والتطبيقات الشهرية ومذكرات المراجعة والمرفقات لكافة الصفوف والشُعب.
          </p>
        </div>

        <button
          v-if="canManage"
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 shrink-0"
          @click="openCreateDrawer"
        >
          <Plus class="w-4 h-4" />
          <span>+ جدولة اختبار جديد</span>
        </button>
      </div>

      <!-- KPI Statistics Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TaqniyaKpiCard
          title="إجمالي الاختبارات المجدولة"
          :value="totalQuizzesCount"
          subtitle="بالعام والسمستر النشط"
          icon="Calendar"
          gradient="indigo"
        />
        <TaqniyaKpiCard
          title="الاختبارات القادمة"
          :value="upcomingQuizzesCount"
          subtitle="تتطلب استعداد الطلاب"
          icon="Clock"
          gradient="purple"
        />
        <TaqniyaKpiCard
          title="الاختبارات المنجزة"
          :value="completedQuizzesCount"
          subtitle="تم إجراؤها في الفصول"
          icon="CheckCircle2"
          gradient="emerald"
        />
        <TaqniyaKpiCard
          title="ملازم ونماذج المراجعة"
          :value="totalAttachmentsCount"
          subtitle="ملفات ومرفقات دراسية"
          icon="Paperclip"
          gradient="blue"
        />
      </div>

      <!-- Advanced Filter & Search Bar -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter class="w-4 h-4 text-indigo-500" />
            <span>خيارات التصفية والبحث المتقدم</span>
          </div>

          <button
            type="button"
            class="text-xs font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
            @click="resetFilters"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Text Search -->
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ابحث بعنوان الاختبار أو الموضوع..."
              class="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400"
              @keyup.enter="applyFilters"
            />
          </div>

          <!-- Class Selector -->
          <TaqniyaSelect
            v-model="selectedClassFilter"
            :options="classOptions"
            placeholder="تصفية بالصف الدراسي..."
            searchable
          />

          <!-- Section Selector -->
          <TaqniyaSelect
            v-model="selectedSectionFilter"
            :options="sectionOptions"
            placeholder="تصفية بالشعبة..."
            searchable
            :disabled="selectedClassFilter === 'all'"
          />

          <!-- Teacher Selector -->
          <TaqniyaSelect
            v-model="selectedTeacherFilter"
            :options="teacherOptions"
            placeholder="تصفية بالمعلم..."
            searchable
          />

          <!-- Status Selector -->
          <TaqniyaSelect
            v-model="selectedStatusFilter"
            :options="statusOptions"
            placeholder="حالة الموعد..."
          />

          <!-- Quiz Date Picker -->
          <input
            v-model="selectedQuizDate"
            type="date"
            class="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
          />

          <!-- Filter Submit Action Button -->
          <div class="sm:col-span-2 lg:col-span-2 flex items-center gap-2">
            <button
              type="button"
              class="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
              @click="applyFilters"
            >
              تطبيق التصفية والبحث
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 class="w-10 h-10 animate-spin text-indigo-500 mb-3" />
        <p class="text-xs font-medium">جاري تحميل مصفوفة الاختبارات والتطبيقات...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="classesData.length === 0"
        class="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
          <Calendar class="w-8 h-8" />
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">
          لا توجد اختبارات أو تطبيقات دورية مسجلة
        </h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
          لم يتم العثور على أي اختبارات تطابق محددات البحث والفلاتر المختارة بالسمستر الحالي.
        </p>
        <button
          v-if="canManage"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
          @click="openCreateDrawer"
        >
          <Plus class="w-4 h-4" />
          <span>جدولة أول اختبار الآن</span>
        </button>
      </div>

      <!-- Hierarchical Quizzes Grid: Class -> Sections -> Quizzes -->
      <div v-else class="space-y-6">
        <div
          v-for="cls in classesData"
          :key="cls.class_id"
          class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm"
        >
          <!-- Class Header Banner -->
          <div class="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                {{ cls.grade_level }}
              </div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-white">
                {{ cls.class_name }}
              </h2>
            </div>
            <span class="text-xs text-slate-400 font-medium">
              {{ cls.sections.length }} شُعب دراسية
            </span>
          </div>

          <!-- Sections Layout -->
          <div class="p-6 space-y-6">
            <div
              v-for="sec in cls.sections"
              :key="sec.class_section_id"
              class="space-y-3"
            >
              <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div class="w-2 h-2 rounded-full bg-indigo-500" />
                <span>{{ sec.section_name }}</span>
                <span class="text-[11px] font-normal text-slate-400">
                  ({{ sec.quizzes.length }} اختبارات)
                </span>
              </div>

              <!-- Quizzes Cards Grid inside Section -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="quiz in sec.quizzes"
                  :key="quiz.id"
                  class="rounded-xl p-4 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/40 hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between group"
                >
                  <!-- Card Top: Subject & Status -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 truncate">
                        {{ quiz.subject_name }}
                      </span>
                      <span
                        class="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                        :class="
                          quiz.status === 'upcoming'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        "
                      >
                        {{ quiz.status === 'upcoming' ? 'قادم' : 'منجز' }}
                      </span>
                    </div>

                    <h3 class="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {{ quiz.title }}
                    </h3>

                    <p class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>الأستاذ:</span>
                      <span class="font-semibold text-slate-700 dark:text-slate-300">{{ quiz.teacher_name }}</span>
                    </p>
                  </div>

                  <!-- Card Bottom: Date, Attachments, Actions -->
                  <div class="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      <Calendar class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{{ quiz.quiz_date }}</span>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <span v-if="quiz.attachments_count" class="text-[11px] text-slate-400 flex items-center gap-0.5 me-1" title="عدد المرفقات">
                        <Paperclip class="w-3 h-3 text-indigo-500" />
                        <span>{{ quiz.attachments_count }}</span>
                      </span>

                      <!-- View Details -->
                      <button
                        type="button"
                        class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        title="معاينة التفاصيل والمرفقات"
                        @click="openDetailDrawer(quiz)"
                      >
                        <Eye class="w-4 h-4" />
                      </button>

                      <!-- Edit Button (Staff only) -->
                      <button
                        v-if="canManage"
                        type="button"
                        class="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        title="تعديل الاختبار"
                        @click="openEditDrawer(quiz)"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>

                      <!-- Delete Button (Staff only) -->
                      <button
                        v-if="canManage"
                        type="button"
                        class="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        title="إلغاء وحذف الاختبار"
                        @click="openDeleteModal(quiz)"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Standard Pagination Footer -->
        <div class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
          <span class="text-slate-500">
            إجمالي السجلات: <span class="font-bold text-slate-900 dark:text-white">{{ paginationMeta.total }}</span> • الصفحة {{ paginationMeta.current_page }} من {{ paginationMeta.last_page }}
          </span>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              :disabled="paginationMeta.current_page <= 1 || loading"
              @click="fetchQuizzes(paginationMeta.current_page - 1)"
            >
              السابق
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              :disabled="paginationMeta.current_page >= paginationMeta.last_page || loading"
              @click="fetchQuizzes(paginationMeta.current_page + 1)"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Slide-Over Drawer -->
      <QuizDetailDrawer
        v-model="showDetailDrawer"
        :quiz="selectedQuizDetail"
        :loading="detailLoading"
        :can-edit="canManage"
        @edit="openEditDrawer"
      />

      <!-- Create / Edit Slide-Over Drawer Form -->
      <QuizDrawerForm
        v-model="showFormDrawer"
        :mode="formDrawerMode"
        :item-to-edit="itemToEdit"
        :academic-year-id="selectedYearId"
        :academic-term-id="selectedTermId"
        :available-teaching-assignments="availableTeachingAssignments"
        :is-submitting="isSubmitting"
        @submit="handleFormSubmit"
      />

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <div class="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto border border-red-500/20">
            <Trash2 class="w-6 h-6" />
          </div>

          <div class="text-center space-y-1">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              تأكيد حذف الاختبار الدوري
            </h3>
            <p class="text-xs text-slate-500">
              هل أنت متأكد من رغبتك في حذف وإلغاء اختبار "<span class="font-semibold text-slate-800 dark:text-slate-200">{{ itemToDelete?.title }}</span>"؟
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              :disabled="isDeleting"
              @click="showDeleteModal = false"
            >
              إلغاء
            </button>
            <button
              type="button"
              class="flex-1 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
              <span>تأكيد الحذف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
