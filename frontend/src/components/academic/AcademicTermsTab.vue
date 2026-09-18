<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import { academicApi, type AcademicTermItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaPagination from '../ui/TaqniyaPagination.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Hash,
  Search,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const terms = ref<AcademicTermItem[]>([]);
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
  { key: 'name', label: 'اسم الفترة المعياري', align: 'start' },
  { key: 'term_number', label: 'الرقم الترتيبي بالتقويم', align: 'center' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '110px' },
];

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeTermToEdit = ref<AcademicTermItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  name: '',
  term_number: 1,
});

// Delete Confirmation Modal
const showDeleteModal = ref(false);
const termToDelete = ref<AcademicTermItem | null>(null);
const isDeleting = ref(false);

const fetchTerms = async (page = 1) => {
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
    };
    if (search.value.trim()) params.search = search.value.trim();

    const res = await academicApi.getTerms(params, activeAbortController.signal);
    if (res.data.success) {
      terms.value = res.data.data;
      if (res.data.meta) {
        currentPage.value = res.data.meta.current_page;
        totalPages.value = res.data.meta.last_page;
        totalRecords.value = res.data.meta.total;
      }
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('خطأ في الشبكة', err.response?.data?.message || 'تعذر جلب الفصول الدراسية.');
  } finally {
    if (!activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
};

const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeTermToEdit.value = null;
  form.value = {
    name: '',
    term_number: terms.value.length + 1,
  };
  showDrawer.value = true;
};

const openEditDrawer = (term: AcademicTermItem) => {
  drawerMode.value = 'edit';
  activeTermToEdit.value = term;
  form.value = {
    name: term.name,
    term_number: term.term_number,
  };
  showDrawer.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || form.value.term_number < 1) {
    toast.warning('بيانات غير صالحة', 'يرجى إدخال اسم ورقم ترتيب الفترة بشكل صحيح.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createTerm(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', res.data.message || `تمت إضافة الفترة (${form.value.name}) إلى الكتالوج`);
        showDrawer.value = false;
        fetchTerms(1);
      }
    } else if (activeTermToEdit.value) {
      const res = await academicApi.updateTerm(activeTermToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', res.data.message || 'تم تحديث بيانات الفترة بنجاح');
        showDrawer.value = false;
        fetchTerms(currentPage.value);
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ غير متوقع');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (term: AcademicTermItem) => {
  termToDelete.value = term;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!termToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteTerm(termToDelete.value.id);
    if (res.data.success) {
      toast.success('تم الحذف بنجاح', res.data.message || `تم حذف الفترة (${termToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchTerms(currentPage.value);
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف الفترة المرجعية لارتباطها بتخصيصات صفوف (RESTRICT).');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchTerms(1);
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
              @keyup.enter="fetchTerms(1)"
              type="text"
              placeholder="بحث باسم الفترة المعيارية..."
              class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
            />
          </div>
          <button
            @click="fetchTerms(1)"
            :disabled="loading"
            class="h-[42px] px-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="بحث"
          >
            <Search class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Add Term Button -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة فترة للكتالوج</span>
      </button>
    </div>

    <!-- Reusable Table Component (TaqniyaTable) -->
    <TaqniyaTable
      :columns="columns"
      :items="terms"
      :is-loading="loading"
      row-key="id"
      empty-title="لا توجد فترات مسجلة بالكتالوج"
      empty-subtitle="قم بتسجيل الفترات المعيارية (مثال: الفصل الدراسي الأول، الفصل الدراسي الثاني)."
      :empty-icon="BookOpen"
      loading-text="جاري تحميل كتالوج الفترات المعيارية..."
    >
      <!-- Index Cell -->
      <template #cell-index="{ index }">
        <span class="w-7 h-7 rounded-xl bg-blue-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted">
          {{ (currentPage - 1) * perPage + index + 1 }}
        </span>
      </template>

      <!-- Name Cell -->
      <template #cell-name="{ item }">
        <div>
          <span class="font-black text-bx-title text-sm block leading-tight">{{ item.name }}</span>
          <span class="text-[10px] text-bx-muted font-mono">TRM-{{ String(item.id).padStart(3, '0') }}#</span>
        </div>
      </template>

      <!-- Term Number Cell -->
      <template #cell-term_number="{ item }">
        <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 shadow-xs">
          <Hash class="w-3.5 h-3.5" />
          الفترة رقم: {{ item.term_number }}
        </span>
      </template>

      <!-- Actions Cell -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-center gap-2">
          <button
            @click="openEditDrawer(item)"
            title="تعديل الفترة"
            class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="confirmDelete(item)"
            title="حذف الفترة"
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
      item-name="فترة معيارية"
      @page-change="fetchTerms"
    />

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة فترة إلى الكتالوج' : 'تعديل بيانات الفترة المعيارية'"
      :subtitle="drawerMode === 'create' ? 'تسجيل فترة دراسية جديدة في الكتالوج العام للمدرسة' : `تحديث بيانات (${activeTermToEdit?.name})`"
      :icon="BookOpen"
      @close="showDrawer = false"
    >
      <form id="termDrawerForm" @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Term Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            اسم الفترة المعياري <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: الفصل الدراسي الأول"
            class="w-full h-[42px] px-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Term Number -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            رقم الفترة الترتيبي (Term Number) <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <Hash class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model.number="form.term_number"
              type="number"
              min="1"
              max="12"
              required
              class="w-full h-[42px] pr-10 pl-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
          </div>
          <p class="text-[11px] text-bx-muted">يحدد تسلسل الفترة زمنياً خلال العام الدراسي (1 للأول، 2 للثاني...)</p>
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
          form="termDrawerForm"
          :disabled="isSubmitting"
          class="bx-btn bx-btn-primary h-[42px] px-6 text-xs font-bold rounded-2xl cursor-pointer disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ drawerMode === 'create' ? 'حفظ الفترة' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (TaqniyaModal) -->
    <TaqniyaModal
      :is-open="showDeleteModal && !!termToDelete"
      title="تأكيد حذف الفترة الدراسية"
      subtitle="الحماية من الحذف في حالة الارتباطات (RESTRICT)"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <template #icon>
        <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle class="w-5 h-5" />
        </div>
      </template>

      <p class="text-xs text-bx-text leading-relaxed">
        هل تريد حذف الفترة <strong class="text-bx-title font-black">{{ termToDelete?.name }}</strong> من الكتالوج العام؟
        سيتم رفض العملية إذا كانت مستخدمة في أي سنة أو صف دراسي.
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
