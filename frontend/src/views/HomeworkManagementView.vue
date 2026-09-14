<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Plus,
  BookOpen,
  Clock,
  Search,
  School,
  CheckCircle2,
  Trash2,
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
import HomeworkEmptyState from '../components/homework/HomeworkEmptyState.vue';

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

// Filter States
const searchQuery = ref('');
const selectedClassFilter = ref<number | string>('all');
const selectedStatusFilter = ref<'all' | 'active' | 'expired'>('all');
const selectedDueDate = ref('');

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

// Year Filter Options
const yearOptions = computed<TaqniyaSelectOption[]>(() => {
  return academicYears.value.map((y) => ({
    value: y.id,
    label: y.name,
  }));
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
    const res = await academicApi.getYears();
    if (res.data && Array.isArray(res.data)) {
      academicYears.value = res.data;
      const activeYear = res.data.find((y: any) => y.is_active === 1) || res.data[0];
      if (activeYear) {
        selectedYearId.value = activeYear.id;
        currentYearName.value = activeYear.name;
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch academic years', err);
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

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    if (selectedClassFilter.value !== 'all') {
      params.class_id = Number(selectedClassFilter.value);
    }
    if (selectedStatusFilter.value !== 'all') {
      params.status = selectedStatusFilter.value;
    }
    if (selectedDueDate.value) {
      params.due_date = selectedDueDate.value;
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

// Debounced search watcher
let searchTimer: any = null;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchHomework(1);
  }, 350);
});

watch([selectedYearId, selectedClassFilter, selectedStatusFilter, selectedDueDate], () => {
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
    <div class="space-y-6 pb-12">
      <!-- Top Title & Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-display flex items-center gap-2.5">
            <BookOpen class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            الواجبات المدرسية والتكاليف المنزلية
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة وإدارة التكاليف والأنشطة المنزلية، الملازم المرفقة، ومواعيد الاستحقاق
          </p>
        </div>

        <!-- Add Button (Admin / Teacher) -->
        <button
          v-if="canManage"
          type="button"
          @click="handleOpenCreate"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus class="w-4 h-4" />
          إنشاء واجب جديد
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TaqniyaKpiCard
          title="إجمالي الواجبات المسجلة"
          :value="paginationMeta.total"
          subtitle="سجل تكليف مدرسي"
          :icon="BookOpen"
          variant="primary"
        />

        <TaqniyaKpiCard
          title="الواجبات السارية للتسليم"
          :value="totalActiveCount"
          subtitle="قيد الإنجاز حالياً"
          :icon="Clock"
          variant="emerald"
        />

        <TaqniyaKpiCard
          title="الواجبات المنتهية"
          :value="totalExpiredCount"
          subtitle="انتهى موعد استحقاقها"
          :icon="CheckCircle2"
          variant="blue"
        />

        <TaqniyaKpiCard
          title="الصفوف الدراسية المغطاة"
          :value="totalClassesCount"
          subtitle="صف دراسي نشط"
          :icon="School"
          variant="amber"
        />
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Search Input -->
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="البحث بعنوان الواجب أو التكليف..."
              class="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Academic Year Selector -->
          <TaqniyaSelect
            v-model="selectedYearId"
            :options="yearOptions"
            placeholder="اختر العام الدراسي..."
          />

          <!-- Class Filter Selector -->
          <TaqniyaSelect
            v-model="selectedClassFilter"
            :options="classOptions"
            placeholder="تصفية حسب الصف الدراسي..."
          />

          <!-- Status Filter Selector -->
          <TaqniyaSelect
            v-model="selectedStatusFilter"
            :options="statusOptions"
            placeholder="تصفية حسب الحالة..."
          />
        </div>
      </div>

      <!-- Main Content Grid -->
      <!-- 1. Loading Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="i in 6"
          :key="i"
          class="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-pulse p-4 space-y-3"
        >
          <div class="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div class="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div class="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-md" />
        </div>
      </div>

      <!-- 2. Empty State -->
      <HomeworkEmptyState
        v-else-if="classesData.length === 0"
        :can-create="canManage"
        @create="handleOpenCreate"
      />

      <!-- 3. Hierarchical Classes & Sections Matrix -->
      <div v-else class="space-y-8">
        <div
          v-for="classGroup in classesData"
          :key="classGroup.class_id"
          class="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-5 sm:p-6 space-y-6"
        >
          <!-- Class Header -->
          <div class="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                {{ classGroup.grade_level }}
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-slate-100 font-display">
                  {{ classGroup.class_name }}
                </h3>
                <span class="text-[11px] text-slate-500 dark:text-slate-400">
                  عدد الشُعب الدراسية: {{ classGroup.sections.length }}
                </span>
              </div>
            </div>
          </div>

          <!-- Sections Subgroups -->
          <div class="space-y-6">
            <div
              v-for="section in classGroup.sections"
              :key="section.class_section_id"
              class="space-y-3"
            >
              <!-- Section Label -->
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h4 class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {{ section.section_name }} ({{ section.assignments.length }} واجبات)
                </h4>
              </div>

              <!-- Assignments Grid -->
              <div
                v-if="section.assignments.length > 0"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <HomeworkCard
                  v-for="hw in section.assignments"
                  :key="hw.id"
                  :homework="hw"
                  :can-manage="canManage"
                  @view="handleOpenView"
                  @edit="handleOpenEdit"
                  @delete="handleOpenDelete"
                />
              </div>

              <!-- No homework in section -->
              <div
                v-else
                class="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-900/40"
              >
                لا توجد واجبات منشورة لهذه الشعبة حالياً.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Bar -->
      <div
        v-if="paginationMeta.total > 0 && paginationMeta.last_page > 1"
        class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
      >
        <span class="text-xs text-slate-500 dark:text-slate-400">
          عرض الصفحة {{ paginationMeta.current_page }} من {{ paginationMeta.last_page }} (إجمالي {{ paginationMeta.total }} واجب)
        </span>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            :disabled="paginationMeta.current_page <= 1"
            @click="fetchHomework(paginationMeta.current_page - 1)"
            class="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            السابق
          </button>
          <button
            type="button"
            :disabled="paginationMeta.current_page >= paginationMeta.last_page"
            @click="fetchHomework(paginationMeta.current_page + 1)"
            class="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            التالي
          </button>
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

      <!-- Delete Confirmation Modal -->
      <Teleport to="body">
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            @click="showDeleteModal = false"
          />

          <div class="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
              <Trash2 class="w-6 h-6" />
            </div>

            <div class="space-y-1">
              <h3 class="text-base font-black text-slate-900 dark:text-slate-100 font-display">
                حذف الواجب المدرسي
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                هل أنت متأكد من رغبتك في حذف هذا الواجب؟ سيتم إلغاؤه من قوائم الطلاب وأولياء الأمور.
              </p>
            </div>

            <div v-if="itemToDelete" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
              {{ itemToDelete.title }}
            </div>

            <div class="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                @click="showDeleteModal = false"
                class="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                :disabled="isDeleting"
                @click="confirmDelete"
                class="flex-1 px-4 py-2.5 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <div v-if="isDeleting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>نعم، احذف</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </TaqniyaErrorBoundary>
</template>
