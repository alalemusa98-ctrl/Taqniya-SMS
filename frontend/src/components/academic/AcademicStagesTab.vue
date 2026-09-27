<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import { academicApi, type AcademicStageItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaPagination from '../ui/TaqniyaPagination.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  ArrowDownUp,
  Search,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const stages = ref<AcademicStageItem[]>([]);
const search = ref('');

// Pagination State
const currentPage = ref(1);
const totalPages = ref(1);
const totalRecords = ref(0);
const perPage = ref(15);

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

const columns: TableColumn[] = [
  { key: 'index', label: '#', align: 'start', width: '60px' },
  { key: 'name', label: 'اسم المرحلة التعليمية', align: 'start' },
  { key: 'order_index', label: 'الترتيب الهرمي النظامي', align: 'center' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '110px' },
];

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeStageToEdit = ref<AcademicStageItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  name: '',
  order_index: 1,
});

// Delete Confirmation Modal
const showDeleteModal = ref(false);
const stageToDelete = ref<AcademicStageItem | null>(null);
const isDeleting = ref(false);

const fetchStages = async (page = 1, silent = false) => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  if (!silent) {
    loading.value = true;
  }
  currentPage.value = page;

  try {
    const params: any = {
      page: currentPage.value,
      per_page: perPage.value,
    };
    if (search.value.trim()) params.search = search.value.trim();

    const res = await academicApi.getStages(params, activeAbortController.signal);
    if (res.data.success) {
      stages.value = res.data.data;
      if (res.data.meta) {
        currentPage.value = res.data.meta.current_page;
        totalPages.value = res.data.meta.last_page;
        totalRecords.value = res.data.meta.total;
      }
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('خطأ في الشبكة', err.response?.data?.message || 'تعذر جلب المراحل الدراسية.');
  } finally {
    if (!silent && !activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
};

const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeStageToEdit.value = null;
  form.value = {
    name: '',
    order_index: stages.value.length + 1,
  };
  showDrawer.value = true;
};

const openEditDrawer = (stage: AcademicStageItem) => {
  drawerMode.value = 'edit';
  activeStageToEdit.value = stage;
  form.value = {
    name: stage.name,
    order_index: stage.order_index,
  };
  showDrawer.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || form.value.order_index < 1) {
    toast.warning('بيانات غير صالحة', 'يرجى إدخال اسم المرحلة وترتيبها بشكل صحيح.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createStage(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', res.data.message || `تمت إضافة المرحلة (${form.value.name}) بنجاح`);
        showDrawer.value = false;
        fetchStages(1, true);
      }
    } else if (activeStageToEdit.value) {
      const res = await academicApi.updateStage(activeStageToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', res.data.message || 'تم تحديث بيانات المرحلة بنجاح');
        showDrawer.value = false;
        fetchStages(currentPage.value, true);
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ غير متوقع');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (stage: AcademicStageItem) => {
  stageToDelete.value = stage;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!stageToDelete.value) return;
  const deletedStage = stageToDelete.value;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteStage(deletedStage.id);
    if (res.data.success) {
      stages.value = stages.value.filter((s) => s.id !== deletedStage.id);
      showDeleteModal.value = false;
      toast.success('تم الحذف بنجاح', `تم حذف المرحلة الدراسية (${deletedStage.name})`);
      fetchStages(currentPage.value, true);
    }
  } catch (err: any) {
    showDeleteModal.value = false;
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف المرحلة لوجود صفوف دراسية تابعة لها (RESTRICT).');
  } finally {
    isDeleting.value = false;
    stageToDelete.value = null;
  }
};

onMounted(() => {
  fetchStages(1);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Action Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] shadow-xs">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <!-- Search input with action trigger -->
        <div class="relative flex-1 min-w-[220px] max-w-md flex items-center gap-1.5">
          <div class="relative flex-1">
            <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model="search"
              @keyup.enter="fetchStages(1)"
              type="text"
              placeholder="بحث باسم المرحلة التعليمية..."
              class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
            />
          </div>
          <button
            @click="fetchStages(1)"
            :disabled="loading"
            class="h-[42px] px-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-600 text-purple-600 hover:text-white border border-purple-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="بحث"
          >
            <Search class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Add Stage Button -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مرحلة تعليمية</span>
      </button>
    </div>

    <!-- Reusable Table Component (TaqniyaTable) -->
    <TaqniyaTable
      :columns="columns"
      :items="stages"
      :is-loading="loading"
      row-key="id"
      empty-title="لا توجد مراحل تعليمية مسجلة"
      empty-subtitle="ابدأ بإنشاء أول مرحلة تعليمية (مثال: المرحلة الابتدائية)."
      :empty-icon="GraduationCap"
      loading-text="جاري تحميل قائمة المراحل التعليمية..."
    >
      <!-- Index Cell -->
      <template #cell-index="{ index }">
        <span class="w-7 h-7 rounded-xl bg-purple-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted">
          {{ (currentPage - 1) * perPage + index + 1 }}
        </span>
      </template>

      <!-- Name Cell -->
      <template #cell-name="{ item }">
        <div>
          <span class="font-black text-bx-title text-sm block leading-tight">{{ item.name }}</span>
          <span class="text-[10px] text-bx-muted font-mono">STG-{{ String(item.id).padStart(3, '0') }}#</span>
        </div>
      </template>

      <!-- Order Index Cell -->
      <template #cell-order_index="{ item }">
        <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 shadow-xs">
          <ArrowDownUp class="w-3.5 h-3.5" />
          المستوى رقم: {{ item.order_index }}
        </span>
      </template>

      <!-- Actions Cell -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-center gap-2">
          <button
            @click="openEditDrawer(item)"
            title="تعديل المرحلة"
            class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="confirmDelete(item)"
            title="حذف المرحلة"
            class="w-8 h-8 rounded-full border border-red-300 dark:border-red-500/40 bg-red-100/70 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </TaqniyaTable>

    <!-- Incremental Pagination Component -->
    <TaqniyaPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total="totalRecords"
      :is-loading="loading"
      item-name="مرحلة تعليمية"
      @page-change="fetchStages"
    />

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة مرحلة تعليمية جديدة' : 'تعديل بيانات المرحلة التعليمية'"
      :subtitle="drawerMode === 'create' ? 'تسجيل مرحلة دراسية في التسلسل الهرمي للمدرسة' : `تحديث بيانات (${activeStageToEdit?.name})`"
      :icon="GraduationCap"
      @close="showDrawer = false"
    >
      <form id="stageDrawerForm" @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Stage Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            اسم المرحلة التعليمية <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: المرحلة الابتدائية"
            class="w-full h-[42px] px-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Order Index -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            ترتيب الظهور الهرمي (Order Index) <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <ArrowDownUp class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model.number="form.order_index"
              type="number"
              min="1"
              required
              class="w-full h-[42px] pr-10 pl-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
          </div>
          <p class="text-[11px] text-bx-muted">يحدد ترتيب ظهور المرحلة وتدرجها التعليمي في التقارير والقوائم.</p>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          @click="showDrawer = false"
          class="bx-btn bx-btn-outline h-[42px] px-6 text-xs font-bold rounded-2xl cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="submit"
          form="stageDrawerForm"
          :disabled="isSubmitting"
          class="bx-btn bx-btn-primary h-[42px] px-6 text-xs font-bold rounded-2xl cursor-pointer disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ drawerMode === 'create' ? 'حفظ المرحلة' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (TaqniyaModal) -->
    <TaqniyaModal
      :is-open="showDeleteModal && !!stageToDelete"
      title="تأكيد حذف المرحلة التعليمية"
      subtitle="حماية العلاقات الهرمية (RESTRICT)"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <template #icon>
        <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle class="w-5 h-5" />
        </div>
      </template>

      <p class="text-xs text-bx-text leading-relaxed">
        هل تريد حذف المرحلة <strong class="text-bx-title font-black">{{ stageToDelete?.name }}</strong>؟
        سيتم رفض الحذف فوراً في حال وجود صفوف دراسية مسجلة تحت هذه المرحلة.
      </p>

      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="showDeleteModal = false"
            class="bx-btn bx-btn-outline h-[38px] px-5 text-xs font-bold rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="bx-btn bx-btn-danger h-[38px] px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>حذف نهائي</span>
          </button>
        </div>
      </template>
    </TaqniyaModal>
  </div>
</template>
