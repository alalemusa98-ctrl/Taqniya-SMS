<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import {
  academicApi,
  type AcademicSectionItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

import {
  Users2,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const sections = ref<AcademicSectionItem[]>([]);
const search = ref('');

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

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

const fetchSections = async () => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      per_page: 100, // Non-paginated complete catalogue of sections
    };
    if (search.value.trim()) params.search = search.value.trim();

    const res = await academicApi.getSections(params, activeAbortController.signal);
    if (res.data.success) {
      sections.value = res.data.data;
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
        toast.success('تمت الإضافة بنجاح', `تمت إضافة الشعبة (${form.value.name}) إلى الكتالوج`);
        showDrawer.value = false;
        fetchSections();
      }
    } else if (activeSectionToEdit.value) {
      const res = await academicApi.updateSection(activeSectionToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث مسمى الشعبة بنجاح`);
        showDrawer.value = false;
        fetchSections();
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ غير متوقع');
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
      toast.success('تم الحذف بنجاح', `تم حذف الشعبة العامة (${sectionToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchSections();
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف الشعبة لوجود ارتباطات فعلية بالصفوف.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchSections();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Action Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] shadow-xs">
      <div class="flex flex-1 items-center gap-3">
        <!-- Search Input with Action Trigger Button -->
        <div class="relative flex-1 max-w-md flex items-center gap-1.5">
          <div class="relative flex-1">
            <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model="search"
              @keyup.enter="fetchSections"
              type="text"
              placeholder="بحث في كتالوج الشُعب العامة..."
              class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
            />
          </div>
          <button
            @click="fetchSections"
            :disabled="loading"
            class="h-[42px] px-3.5 rounded-2xl bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="بحث فوري (أو اضغط Enter)"
          >
            <Search class="w-4 h-4" />
          </button>
        </div>
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

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-bx-muted space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل كتالوج الشُعب العامة...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="sections.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] border-dashed rounded-2xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shadow-xs">
        <Users2 class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد شُعب دراسية عامة مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">قم بتعريف كتالوج الشعب المعيارية بالمدرسة (مثال: أ، ب، ج، د).</p>
      </div>
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[40px] px-5 text-xs font-bold rounded-xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة شعبة الآن</span>
      </button>
    </div>

    <!-- Sections Table Card (Taqniya Unified Bordered Card with Sticky Header) -->
    <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
              <th class="py-3.5 px-5 font-bold text-start w-16">#</th>
              <th class="py-3.5 px-5 font-bold text-start">
                <div class="flex items-center gap-2">
                  <Users2 class="w-3.5 h-3.5 text-teal-600" />
                  <span>مسمى الشعبة العامة</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center">
                <span>الحالة والاعتماد النظامي</span>
              </th>
              <th class="py-3.5 px-5 font-bold text-center w-28">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12] font-medium text-bx-text">
            <tr
              v-for="(sec, idx) in sections"
              :key="sec.id"
              class="hover:bg-teal-500/[0.05] dark:hover:bg-white/[0.03] transition-colors duration-150 group"
            >
              <td class="py-3.5 px-5">
                <span class="w-7 h-7 rounded-xl bg-teal-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted group-hover:text-teal-600 group-hover:border-teal-500/30 transition-colors">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div>
                  <span class="font-black text-bx-title text-sm block leading-tight">شعبة ({{ sec.name }})</span>
                  <span class="text-[10px] text-bx-muted font-mono">SEC-{{ String(sec.id).padStart(3, '0') }}#</span>
                </div>
              </td>
              <td class="py-3.5 px-5 text-center">
                <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 shadow-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                  <span>شعبة معتمدة بالكتالوج العام</span>
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditDrawer(sec)"
                    title="تعديل مسمى الشعبة في القائمة الجانبية (Drawer)"
                    class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="confirmDelete(sec)"
                    title="حذف الشعبة"
                    class="w-8 h-8 rounded-full border border-red-300 dark:border-red-500/40 bg-red-100/70 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Bottom Stats Bar (Non-paginated full catalogue) -->
      <div class="px-5 py-3.5 border-t border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] flex items-center justify-between text-xs text-bx-muted font-bold">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>إجمالي الشُعب العامة: <strong class="text-bx-title font-black">{{ sections.length }}</strong></span>
        </div>
        <div class="text-[11px] text-bx-muted">
          بنك الشُعب المعتمد (عرض كامل بدون تجزئة صفحات)
        </div>
      </div>
    </div>

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة شعبة عامة جديدة' : 'تعديل مسمى الشعبة العامة'"
      :subtitle="drawerMode === 'create' ? 'تسجيل شعبة معتمدة جديدة في الكتالوج العام للمدرسة' : `تحديث بيانات (${activeSectionToEdit?.name})`"
      :icon="Users2"
      @close="showDrawer = false"
    >
      <form id="sectionDrawerForm" @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Section Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            مسمى أو حرف الشعبة <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: أ ، ب ، ج ، د"
            class="w-full h-[48px] px-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-sm text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-black text-center"
          />
          <p class="text-[11px] text-bx-muted">أدخل الرمز أو الحرف التعريفي للشعبة لتمييز فصول الصفوف لاحقاً.</p>
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
          form="sectionDrawerForm"
          :disabled="isSubmitting"
          class="bx-btn bx-btn-primary h-[42px] px-6 text-xs font-bold rounded-2xl cursor-pointer disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ drawerMode === 'create' ? 'حفظ الشعبة' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Dialog) -->
    <div
      v-if="showDeleteModal && sectionToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف الشعبة العامة</h3>
            <p class="text-[11px] text-bx-muted">حماية العلاقات المدرسية (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف الشعبة <strong class="text-bx-title font-black">({{ sectionToDelete.name }})</strong> من الكتالوج العام؟
          سيتم رفض العملية إذا تم إسناد هذه الشعبة لأي صفوف دراسية.
        </p>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#B4AED8] dark:border-white/[0.12]">
          <button
            @click="showDeleteModal = false"
            class="bx-btn bx-btn-outline h-[38px] px-5 text-xs font-bold rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="bx-btn bx-btn-danger h-[38px] px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>حذف نهائي</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
