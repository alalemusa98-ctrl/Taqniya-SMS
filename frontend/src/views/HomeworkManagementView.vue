<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Search,
  Filter,
  RotateCcw,
  School,
  CheckCircle2,
  Trash2,
  Loader2,
  TrendingUp,
  Layers,
  GraduationCap,
} from 'lucide-vue-next';
import {
  homeworkApi,
  type HomeworkItem,
  type HomeworkDetailData,
  type ClassWithHomework,
  type PaginationMeta,
} from '../api/homework.api';
import { academicApi, type AcademicYearItem } from '../api/academic.api';
import { teachingAssignmentsApi, type AssignmentItem } from '../api/teaching-assignments.api';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import HomeworkCard from '../components/homework/HomeworkCard.vue';
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
const selectedStatusFilter = ref<'all' | 'active' | 'expired'>('all');
const selectedDueDate = ref('');

// Applied Filter States
const appliedSearchQuery = ref('');
const appliedClassFilter = ref<number | string>('all');
const appliedStatusFilter = ref<'all' | 'active' | 'expired'>('all');
const appliedDueDate = ref('');

// Drawer & Modal States
const showFormDrawer = ref(false);
const formDrawerMode = ref<'create' | 'edit'>('create');
const itemToEdit = ref<HomeworkItem | HomeworkDetailData | null>(null);

const showDetailDrawer = ref(false);
const selectedHomeworkDetail = ref<HomeworkDetailData | HomeworkItem | null>(null);
const detailLoading = ref(false);

const showDeleteModal = ref(false);
const itemToDelete = ref<HomeworkItem | null>(null);
const isDeleting = ref(false);

// Active Academic Year object
const activeAcademicYear = computed(() => {
  return academicYears.value.find((y) => y.id === selectedYearId.value) || academicYears.value[0];
});

// Class Filter Options
const classOptions = computed<TaqniyaSelectOption[]>(() => {
  const opts: TaqniyaSelectOption[] = [{ value: 'all', label: 'جميع الصفوف الدراسية' }];
  classesData.value.forEach((c) => {
    opts.push({ value: c.class_id, label: c.class_name });
  });
  return opts;
});

// Status Filter Options
const statusOptions: TaqniyaSelectOption[] = [
  { value: 'all', label: 'كافة الحالات' },
  { value: 'active', label: 'الواجبات السارية فقط' },
  { value: 'expired', label: 'الواجبات المنتهية فقط' },
];

// Active Filter Indicator
const hasActiveFilters = computed(() => {
  return (
    appliedSearchQuery.value.trim() !== '' ||
    appliedClassFilter.value !== 'all' ||
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

// Fetch Initial Data
const loadInitialData = async () => {
  try {
    const [yearsRes, termsRes] = await Promise.all([
      academicApi.getYears(),
      academicApi.getTerms().catch(() => ({ data: { data: [] } })),
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
  } catch (err: any) {
    console.error('Failed to fetch academic years or terms', err);
  }

  // Load Teaching Assignments for dropdown
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

// Fetch Homework List
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
  appliedStatusFilter.value = selectedStatusFilter.value;
  appliedDueDate.value = selectedDueDate.value;
  fetchHomework(1);
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedClassFilter.value = 'all';
  selectedStatusFilter.value = 'all';
  selectedDueDate.value = '';
  appliedSearchQuery.value = '';
  appliedClassFilter.value = 'all';
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

const handleOpenEdit = (item: HomeworkItem | HomeworkDetailData) => {
  formDrawerMode.value = 'edit';
  itemToEdit.value = item;
  showFormDrawer.value = true;
};

const handleOpenView = async (item: HomeworkItem) => {
  selectedHomeworkDetail.value = item;
  showDetailDrawer.value = true;
  detailLoading.value = true;
  try {
    const res = await homeworkApi.getById(item.id);
    if (res.data?.data) {
      selectedHomeworkDetail.value = res.data.data;
    }
  } catch (err: any) {
    // Keep local item as fallback
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

        <!-- 3. Filters Toolbar -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] mb-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">تصفية حسب الصف الدراسي</label>
              <TaqniyaSelect
                v-model="selectedClassFilter"
                :options="classOptions"
                placeholder="كافة الصفوف..."
                full-width
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">تصفية حسب الحالة</label>
              <TaqniyaSelect
                v-model="selectedStatusFilter"
                :options="statusOptions"
                placeholder="كافة الحالات..."
                full-width
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">تصفية بحسب تاريخ الاستحقاق</label>
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

        <!-- 6. Hierarchical Classes & Sections Cards Grid -->
        <div v-else class="space-y-6">
          <div
            v-for="cls in classesData"
            :key="cls.class_id"
            class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs"
          >
            <!-- Class Header Bar -->
            <div class="bg-purple-500/[0.04] dark:bg-white/[0.03] py-3.5 px-5 border-b border-[#B4AED8]/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-400/40 flex items-center justify-center text-bx-primary dark:text-purple-300 shrink-0">
                  <GraduationCap class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="font-black text-sm text-bx-title font-display block leading-tight">{{ cls.class_name }}</h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-semibold text-bx-muted px-2 py-0.5 rounded-full border border-[#B4AED8]/60 dark:border-white/10 bg-[var(--bx-surface-solid)]">
                      {{ cls.sections?.length || 0 }} شُعب دراسية
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sections Container Inside Class -->
            <div class="p-4 space-y-5">
              <div
                v-for="sec in cls.sections"
                :key="sec.class_section_id"
                class="space-y-3"
              >
                <!-- Section Ribbon -->
                <div class="flex items-center justify-between px-1">
                  <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
                    <Layers class="w-4 h-4 text-bx-primary" />
                    <span>{{ sec.section_name }}</span>
                  </div>
                  <span class="text-[11px] font-mono font-bold text-bx-muted">
                    {{ sec.assignments?.length || 0 }} واجبات مسجلة
                  </span>
                </div>

                <!-- Homework Cards Grid -->
                <div
                  v-if="sec.assignments && sec.assignments.length > 0"
                  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
                >
                  <HomeworkCard
                    v-for="hw in sec.assignments"
                    :key="hw.id"
                    :homework="hw"
                    :can-manage="canManage"
                    @view="handleOpenView"
                    @edit="handleOpenEdit"
                    @delete="handleOpenDelete"
                  />
                </div>

                <!-- Empty Section State -->
                <div
                  v-else
                  class="py-6 text-center text-xs text-bx-muted border border-dashed border-[#B4AED8]/60 dark:border-white/10 rounded-xl"
                >
                  لا توجد واجبات منزلية مسجلة لهذه الشعبة حالياً
                </div>
              </div>
            </div>
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
