<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import {
  academicApi,
  type AcademicClassItem,
  type AcademicStageItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaPagination from '../ui/TaqniyaPagination.vue';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertCircle,
  GraduationCap,
  Hash,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const classes = ref<AcademicClassItem[]>([]);
const stages = ref<AcademicStageItem[]>([]);

const search = ref('');
const selectedStageFilter = ref<string | number>('all');

// Pagination State
const currentPage = ref(1);
const totalPages = ref(1);
const totalRecords = ref(0);
const perPage = ref(15);

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

const columns: TableColumn[] = [
  { key: 'index', label: '#', align: 'start', width: '60px' },
  { key: 'name', label: 'اسم الصف الدراسي', align: 'start' },
  { key: 'stage_name', label: 'المرحلة التعليمية', align: 'start' },
  { key: 'grade_level', label: 'المستوى الأكاديمي', align: 'center' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '120px' },
];

// Drawer state for Create / Edit
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeClassToEdit = ref<AcademicClassItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  stage_id: 0,
  name: '',
  grade_level: 1,
});

// Options for TaqniyaSelect
const stageFilterOptions = computed(() => [
  { value: 'all', label: 'كافة المراحل التعليمية' },
  ...stages.value.map((s) => ({ value: s.id, label: s.name })),
]);

// Delete Confirmation Modal
const showDeleteModal = ref(false);
const classToDelete = ref<AcademicClassItem | null>(null);
const isDeleting = ref(false);

const fetchStages = async () => {
  try {
    const res = await academicApi.getStages();
    if (res.data.success) {
      stages.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load stages for filter', err);
  }
};

const fetchClasses = async (page = 1) => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  currentPage.value = page;

  try {
    const params: any = {
      page: currentPage.value,
      per_page: perPage.value,
      sort_by: 'grade_level',
      sort_order: 'asc',
    };
    if (search.value.trim()) params.search = search.value.trim();
    if (selectedStageFilter.value !== 'all') {
      params.stage_id = Number(selectedStageFilter.value);
    }

    const res = await academicApi.getClasses(params, activeAbortController.signal);
    if (res.data.success) {
      classes.value = res.data.data;
      if (res.data.meta) {
        currentPage.value = res.data.meta.current_page || page;
        totalPages.value = res.data.meta.last_page || 1;
        totalRecords.value = res.data.meta.total || 0;
      }
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('تعذر جلب قائمة الصفوف الدراسية', err.response?.data?.message);
  } finally {
    if (!activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
};

const handlePageChange = (newPage: number) => {
  fetchClasses(newPage);
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  fetchClasses(1);
};

const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeClassToEdit.value = null;
  form.value = {
    stage_id: stages.value.length > 0 ? stages.value[0].id : 0,
    name: '',
    grade_level: 1,
  };
  showDrawer.value = true;
};

const openEditDrawer = (classItem: AcademicClassItem) => {
  drawerMode.value = 'edit';
  activeClassToEdit.value = classItem;
  form.value = {
    stage_id: classItem.stage_id,
    name: classItem.name,
    grade_level: classItem.grade_level,
  };
  showDrawer.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.stage_id || form.value.grade_level < 1) {
    toast.warning('بيانات غير مكتملة', 'يرجى ملء جميع الحقول المطلوبة والتأكد من تحديد المرحلة.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createClass(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تم إنشاء الصف الدراسي (${form.value.name})`);
        showDrawer.value = false;
        fetchClasses(currentPage.value);
      }
    } else if (activeClassToEdit.value) {
      const res = await academicApi.updateClass(activeClassToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات الصف الدراسي بنجاح`);
        showDrawer.value = false;
        fetchClasses(currentPage.value);
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ أثناء حفظ الصف الدراسي');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (classItem: AcademicClassItem) => {
  classToDelete.value = classItem;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!classToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteClass(classToDelete.value.id);
    if (res.data.success) {
      toast.success('تم الحذف بنجاح', `تم حذف الصف الدراسي (${classToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchClasses(currentPage.value);
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف الصف لارتباطه ببيانات دراسية نشطة.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(async () => {
  await fetchStages();
  fetchClasses(1);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Action & Filter Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] shadow-xs">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <!-- Search Input with Action Trigger Button -->
        <div class="relative flex-1 min-w-[220px] max-w-md flex items-center gap-1.5">
          <div class="relative flex-1">
            <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model="search"
              @keyup.enter="fetchClasses(1)"
              type="text"
              placeholder="بحث باسم الصف الدراسي..."
              class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
            />
          </div>
          <button
            @click="fetchClasses(1)"
            :disabled="loading"
            class="h-[42px] px-3.5 rounded-2xl bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="بحث فوري (أو اضغط Enter)"
          >
            <Search class="w-4 h-4" />
          </button>
        </div>

        <!-- Stage Filter (Taqniya Custom Select) -->
        <TaqniyaSelect
          v-model="selectedStageFilter"
          :options="stageFilterOptions"
          :icon="GraduationCap"
          @update:model-value="fetchClasses(1)"
        />
      </div>

      <!-- Add Class Button (Taqniya Standard Button) -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة صف دراسي</span>
      </button>
    </div>

    <!-- Standardized Taqniya Table Component -->
    <TaqniyaTable
      :columns="columns"
      :items="classes"
      :is-loading="loading"
      empty-title="لا توجد صفوف دراسية مسجلة حالياً"
      empty-subtitle="قم بإضافة الصفوف وتسكينها في المراحل المناسبة (مثال: الصف الأول، الصف الخامس)."
    >
      <template #cell-index="{ index }">
        <span class="w-7 h-7 rounded-xl bg-purple-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted">
          {{ (currentPage - 1) * perPage + index + 1 }}
        </span>
      </template>

      <template #cell-name="{ item }">
        <div>
          <span class="font-black text-bx-title text-sm block leading-tight">{{ item.name }}</span>
          <span class="text-[10px] text-bx-muted font-mono">CLS-{{ String(item.id).padStart(3, '0') }}#</span>
        </div>
      </template>

      <template #cell-stage_name="{ item }">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 shadow-xs">
          <GraduationCap class="w-3.5 h-3.5 shrink-0" />
          <span>{{ item.stage_name || 'غير محدد' }}</span>
        </span>
      </template>

      <template #cell-grade_level="{ item }">
        <span class="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-black border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shadow-xs">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>المستوى {{ item.grade_level }}</span>
        </span>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex items-center justify-center gap-2">
          <button
            @click="openEditDrawer(item)"
            title="تعديل بيانات الصف"
            class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="confirmDelete(item)"
            title="حذف الصف"
            class="w-8 h-8 rounded-full border border-red-300 dark:border-red-500/40 bg-red-100/70 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </TaqniyaTable>

    <!-- Standardized Taqniya Pagination Component -->
    <TaqniyaPagination
      v-if="totalRecords > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalRecords"
      :per-page="perPage"
      @update:page="handlePageChange"
      @update:per-page="handlePerPageChange"
    />

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة صف دراسي جديد' : 'تعديل بيانات الصف الدراسي'"
      :description="drawerMode === 'create' ? 'تسكين صف دراسي جديد وتحديد مرحلته التعليمية ومستواه الأكاديمي' : 'تحديث مسمى الصف أو مرحلته التعليمية أو مستواه'"
      @close="showDrawer = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Stage Selection -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <GraduationCap class="w-3.5 h-3.5 text-bx-primary" />
            <span>المرحلة التعليمية التابع لها <span class="text-red-500">*</span></span>
          </label>
          <select
            v-model="form.stage_id"
            required
            class="w-full px-3.5 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary font-bold"
          >
            <option :value="0" disabled>-- اختر المرحلة التعليمية --</option>
            <option v-for="s in stages" :key="s.id" :value="s.id">
              {{ s.name }} (الترتيب: {{ s.order_index }})
            </option>
          </select>
        </div>

        <!-- Class Name -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <Layers class="w-3.5 h-3.5 text-bx-primary" />
            <span>اسم الصف الدراسي <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: الصف الخامس الابتدائي"
            class="w-full px-3.5 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary font-bold"
          />
        </div>

        <!-- Grade Level (Academic Progression Level) -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <Hash class="w-3.5 h-3.5 text-emerald-600" />
            <span>المستوى الأكاديمي الرقمي (1 إلى 12) <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model.number="form.grade_level"
            type="number"
            min="1"
            max="12"
            required
            placeholder="مثال: 5"
            class="w-full px-3.5 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary font-bold font-mono"
          />
          <p class="text-[11px] text-bx-muted leading-relaxed">
            * المستوى الرقمي يحدد الترتيب التصاعدي للصفوف وترحيل الطلاب بنهاية العام.
          </p>
        </div>

        <!-- Drawer Submit Buttons -->
        <div class="pt-4 flex items-center justify-end gap-3 border-t border-[#B4AED8]/40 dark:border-white/10">
          <button
            type="button"
            @click="showDrawer = false"
            class="bx-btn h-[40px] px-4 text-xs font-bold rounded-xl border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-text"
          >
            إلغاء
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="bx-btn bx-btn-primary h-[40px] px-6 text-xs font-bold rounded-xl"
          >
            <span v-if="isSubmitting">جاري الحفظ...</span>
            <span v-else>{{ drawerMode === 'create' ? 'إنشاء الصف' : 'حفظ التعديلات' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Standard Modal) -->
    <TaqniyaModal
      :is-open="showDeleteModal"
      title="تأكيد حذف الصف الدراسي"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <div class="space-y-4 text-start">
        <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
          <div class="text-xs space-y-1">
            <span class="font-bold block">تحذير حوكمي بشأن الحذف:</span>
            <span class="leading-relaxed block text-bx-muted">
              هل أنت متأكد من حذف الصف الدراسي (<strong>{{ classToDelete?.name }}</strong>)؟ سيتم تنفيذ الحذف المنطقي بشرط عدم ارتباطه بشُعب أو فترات أو مقررات مسندة.
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            @click="showDeleteModal = false"
            class="bx-btn h-[38px] px-4 text-xs font-bold rounded-xl border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-text"
          >
            إلغاء
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="bx-btn bg-red-600 hover:bg-red-700 text-white h-[38px] px-5 text-xs font-bold rounded-xl shadow-xs"
          >
            <span v-if="isDeleting">جاري الحذف...</span>
            <span v-else>تأكيد الحذف</span>
          </button>
        </div>
      </template>
    </TaqniyaModal>
  </div>
</template>
