<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import {
  academicApi,
  type AcademicSectionItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaPagination from '../ui/TaqniyaPagination.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

import {
  Users2,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const sections = ref<AcademicSectionItem[]>([]);
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
  { key: 'name', label: 'مسمى الشعبة العامة', align: 'start' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '120px' },
];

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeSectionToEdit = ref<AcademicSectionItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  name: '',
});

// Delete Confirmation
const showDeleteModal = ref(false);
const sectionToDelete = ref<AcademicSectionItem | null>(null);
const isDeleting = ref(false);

const fetchSections = async (page = 1) => {
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
      sort_by: 'name',
      sort_order: 'asc',
    };
    if (search.value.trim()) params.search = search.value.trim();

    const res = await academicApi.getSections(params, activeAbortController.signal);
    if (res.data.success) {
      sections.value = res.data.data;
      if (res.data.meta) {
        currentPage.value = res.data.meta.current_page || page;
        totalPages.value = res.data.meta.last_page || 1;
        totalRecords.value = res.data.meta.total || 0;
      }
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('تعذر جلب كتالوج الشعب العامة', err.response?.data?.message);
  } finally {
    if (!activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
};

const handlePageChange = (newPage: number) => {
  fetchSections(newPage);
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  fetchSections(1);
};

const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeSectionToEdit.value = null;
  form.value = {
    name: '',
  };
  showDrawer.value = true;
};

const openEditDrawer = (section: AcademicSectionItem) => {
  drawerMode.value = 'edit';
  activeSectionToEdit.value = section;
  form.value = {
    name: section.name,
  };
  showDrawer.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    toast.warning('بيانات غير مكتملة', 'يرجى إدخال مسمى الشعبة العامة.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createSection(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تم إنشاء الشعبة العامة (${form.value.name})`);
        showDrawer.value = false;
        fetchSections(currentPage.value);
      }
    } else if (activeSectionToEdit.value) {
      const res = await academicApi.updateSection(activeSectionToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث مسمى الشعبة العامة بنجاح`);
        showDrawer.value = false;
        fetchSections(currentPage.value);
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ أثناء حفظ الشعبة');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (section: AcademicSectionItem) => {
  sectionToDelete.value = section;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!sectionToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteSection(sectionToDelete.value.id);
    if (res.data.success) {
      toast.success('تم الحذف بنجاح', `تم حذف الشعبة (${sectionToDelete.value.name}) من الكتالوج العام`);
      showDeleteModal.value = false;
      fetchSections(currentPage.value);
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف الشعبة لاستخدامها في صفوف دراسية.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchSections(1);
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
            @keyup.enter="fetchSections(1)"
            type="text"
            placeholder="بحث باسم الشعبة (مثال: شعبة أ)..."
            class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
          />
        </div>
        <button
          @click="fetchSections(1)"
          :disabled="loading"
          class="h-[42px] px-3.5 rounded-2xl bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="بحث فوري (أو اضغط Enter)"
        >
          <Search class="w-4 h-4" />
        </button>
      </div>

      <!-- Add Section Button -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة شعبة عامة</span>
      </button>
    </div>

    <!-- Standardized Taqniya Table Component -->
    <TaqniyaTable
      :columns="columns"
      :items="sections"
      :is-loading="loading"
      empty-title="لا توجد شُعب عامة مسجلة بالكتالوج"
      empty-subtitle="قم بإضافة الشعب العامة لمرة واحدة وتخصيصها لاحقاً لصفوف المدرسة."
    >
      <template #cell-index="{ index }">
        <span class="w-7 h-7 rounded-xl bg-purple-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted">
          {{ (currentPage - 1) * perPage + index + 1 }}
        </span>
      </template>

      <template #cell-name="{ item }">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users2 class="w-4 h-4" />
          </div>
          <div>
            <span class="font-black text-bx-title text-sm block leading-tight">{{ item.name }}</span>
            <span class="text-[10px] text-bx-muted font-mono">SEC-{{ String(item.id).padStart(3, '0') }}#</span>
          </div>
        </div>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex items-center justify-center gap-2">
          <button
            @click="openEditDrawer(item)"
            title="تعديل مسمى الشعبة"
            class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="confirmDelete(item)"
            title="حذف الشعبة"
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
      :title="drawerMode === 'create' ? 'إضافة شعبة عامة جديدة' : 'تعديل مسمى الشعبة العامة'"
      :description="drawerMode === 'create' ? 'إضافة مسمى شعبة عامة لكتالوج المدرسة المرجعي لتخصيصها لاحقاً بالصفوف' : 'تحديث مسمى الشعبة المرجعية'"
      @close="showDrawer = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Section Name -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <Users2 class="w-3.5 h-3.5 text-bx-primary" />
            <span>مسمى الشعبة العامة <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: شعبة أ، شعبة ب، شعبة 1"
            class="w-full px-3.5 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary font-bold"
          />
          <p class="text-[11px] text-bx-muted leading-relaxed">
            * يتم تسجيل الشعبة العامة لمرة واحدة وتخصيصها لاحقاً لكافة صفوف المدرسة.
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
            <span v-else>{{ drawerMode === 'create' ? 'إنشاء الشعبة' : 'حفظ التعديل' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Standard Modal) -->
    <TaqniyaModal
      :is-open="showDeleteModal"
      title="تأكيد حذف الشعبة العامة"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <div class="space-y-4 text-start">
        <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
          <div class="text-xs space-y-1">
            <span class="font-bold block">تحذير حوكمي بشأن الحذف:</span>
            <span class="leading-relaxed block text-bx-muted">
              هل أنت متأكد من حذف الشعبة (<strong>{{ sectionToDelete?.name }}</strong>) من الكتالوج العام؟ سيتم تنفيذ الحذف بشرط عدم تسكينها في أي صفوف دراسية.
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
