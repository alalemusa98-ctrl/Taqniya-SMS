<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import {
  academicApi,
  type AcademicSubjectItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaPagination from '../ui/TaqniyaPagination.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertCircle,
  Tag,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const subjects = ref<AcademicSubjectItem[]>([]);
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
  { key: 'name', label: 'اسم المادة التعليمية', align: 'start' },
  { key: 'code', label: 'الكود الرمزي', align: 'center', width: '150px' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '120px' },
];

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeSubjectToEdit = ref<AcademicSubjectItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  name: '',
  code: '',
});

// Delete Confirmation
const showDeleteModal = ref(false);
const subjectToDelete = ref<AcademicSubjectItem | null>(null);
const isDeleting = ref(false);

const fetchSubjects = async (page = 1, silent = false) => {
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
      sort_by: 'name',
      sort_order: 'asc',
    };
    if (search.value.trim()) params.search = search.value.trim();

    const res = await academicApi.getSubjects(params, activeAbortController.signal);
    if (res.data.success) {
      subjects.value = res.data.data;
      if (res.data.meta) {
        currentPage.value = res.data.meta.current_page || page;
        totalPages.value = res.data.meta.last_page || 1;
        totalRecords.value = res.data.meta.total || 0;
      }
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('تعذر جلب بنك المواد العامة', err.response?.data?.message);
  } finally {
    if (!silent && !activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
};

const handlePageChange = (newPage: number) => {
  fetchSubjects(newPage);
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  fetchSubjects(1);
};

const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeSubjectToEdit.value = null;
  form.value = {
    name: '',
    code: '',
  };
  showDrawer.value = true;
};

const openEditDrawer = (subject: AcademicSubjectItem) => {
  drawerMode.value = 'edit';
  activeSubjectToEdit.value = subject;
  form.value = {
    name: subject.name,
    code: subject.code || '',
  };
  showDrawer.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    toast.warning('بيانات غير مكتملة', 'يرجى إدخال اسم المادة التعليمية.');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      code: form.value.code.trim() ? form.value.code.trim().toUpperCase() : undefined,
    };

    if (drawerMode.value === 'create') {
      const res = await academicApi.createSubject(payload);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تم إضافة المادة (${form.value.name}) إلى بنك المواد`);
        showDrawer.value = false;
        fetchSubjects(currentPage.value, true);
      }
    } else if (activeSubjectToEdit.value) {
      const res = await academicApi.updateSubject(activeSubjectToEdit.value.id, payload);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات المادة التعليمية بنجاح`);
        showDrawer.value = false;
        fetchSubjects(currentPage.value, true);
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ أثناء حفظ المادة');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (subject: AcademicSubjectItem) => {
  subjectToDelete.value = subject;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!subjectToDelete.value) return;
  const deletedSubject = subjectToDelete.value;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteSubject(deletedSubject.id);
    if (res.data.success) {
      subjects.value = subjects.value.filter((s) => s.id !== deletedSubject.id);
      showDeleteModal.value = false;
      toast.success('تم الحذف بنجاح', `تم حذف المادة (${deletedSubject.name}) من بنك المواد`);
      fetchSubjects(currentPage.value, true);
    }
  } catch (err: any) {
    showDeleteModal.value = false;
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف المادة لإسنادها في مناهج ومقررات صفوف.');
  } finally {
    isDeleting.value = false;
    subjectToDelete.value = null;
  }
};

onMounted(() => {
  fetchSubjects(1);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Action & Search Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] shadow-xs">
      <div class="relative flex-1 max-w-md flex items-center gap-1.5">
        <div class="relative flex-1">
          <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
          <input
            v-model="search"
            @keyup.enter="fetchSubjects(1)"
            type="text"
            placeholder="بحث باسم المادة أو الكود الرمزي..."
            class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
          />
        </div>
        <button
          @click="fetchSubjects(1)"
          :disabled="loading"
          class="h-[42px] px-3.5 rounded-2xl bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="بحث فوري (أو اضغط Enter)"
        >
          <Search class="w-4 h-4" />
        </button>
      </div>

      <!-- Add Subject Button -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مادة لبنك المواد</span>
      </button>
    </div>

    <!-- Standardized Taqniya Table Component -->
    <TaqniyaTable
      :columns="columns"
      :items="subjects"
      :is-loading="loading"
      empty-title="لا توجد مواد مسجلة ببنك المواد حالياً"
      empty-subtitle="قم بإضافة المواد الدراسية العامة وتحديد رموزها لتسكينها لاحقاً في خطط المقررات."
    >
      <template #cell-index="{ index }">
        <span class="w-7 h-7 rounded-xl bg-purple-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted">
          {{ (currentPage - 1) * perPage + index + 1 }}
        </span>
      </template>

      <template #cell-name="{ item }">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen class="w-4 h-4" />
          </div>
          <div>
            <span class="font-black text-bx-title text-sm block leading-tight">{{ item.name }}</span>
            <span class="text-[10px] text-bx-muted font-mono">SUB-{{ String(item.id).padStart(3, '0') }}#</span>
          </div>
        </div>
      </template>

      <template #cell-code="{ item }">
        <span v-if="item.code" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 shadow-xs">
          <Tag class="w-3.5 h-3.5 shrink-0" />
          <span>{{ item.code }}</span>
        </span>
        <span v-else class="text-bx-muted text-xs font-mono">-</span>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex items-center justify-center gap-2">
          <button
            @click="openEditDrawer(item)"
            title="تعديل المادة"
            class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="confirmDelete(item)"
            title="حذف المادة"
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
      :title="drawerMode === 'create' ? 'إضافة مادة جديدة لبنك المواد' : 'تعديل بيانات المادة التعليمية'"
      :description="drawerMode === 'create' ? 'تعريف مادة تعليمية جديدة في بنك المواد العام وتعيين الرمز الكودي للمقرر' : 'تحديث اسم المادة أو الرمز الكودي المعتمد'"
      @close="showDrawer = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Subject Name -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
            <span>اسم المادة التعليمية <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: الرياضيات، العلوم، اللغة العربية"
            class="w-full px-3.5 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary font-bold"
          />
        </div>

        <!-- Subject Code -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <Tag class="w-3.5 h-3.5 text-bx-primary" />
            <span>الرمز الكودي للمادة (Code) <span class="text-bx-muted font-normal">(اختياري)</span></span>
          </label>
          <input
            v-model="form.code"
            type="text"
            placeholder="مثال: MATH, SCI, ARAB"
            class="w-full px-3.5 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary font-bold font-mono uppercase"
          />
          <p class="text-[11px] text-bx-muted leading-relaxed">
            * يساعد الرمز الكودي في تقارير الجداول المدرسية وبطاقات الدرجات.
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
            <span v-else>{{ drawerMode === 'create' ? 'إضافة المادة' : 'حفظ التعديل' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Standard Modal) -->
    <TaqniyaModal
      :is-open="showDeleteModal"
      title="تأكيد حذف المادة التعليمية"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <div class="space-y-4 text-start">
        <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
          <div class="text-xs space-y-1">
            <span class="font-bold block">تحذير حوكمي بشأن الحذف:</span>
            <span class="leading-relaxed block text-bx-muted">
              هل أنت متأكد من حذف المادة (<strong>{{ subjectToDelete?.name }}</strong>) من بنك المواد العام؟ سيتم تنفيذ الحذف بشرط عدم إسنادها في مناهج ومقررات الصفوف أو جداول الحصص أو الاختبارات.
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
