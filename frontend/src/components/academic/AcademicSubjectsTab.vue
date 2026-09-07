<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import {
  academicApi,
  type AcademicSubjectItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

import {
  BookOpenCheck,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Code,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const subjects = ref<AcademicSubjectItem[]>([]);
const search = ref('');

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

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

const fetchSubjects = async () => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      per_page: 100, // Non-paginated complete catalogue of subjects
    };
    if (search.value.trim()) params.search = search.value.trim();

    const res = await academicApi.getSubjects(params, activeAbortController.signal);
    if (res.data.success) {
      subjects.value = res.data.data;
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('تعذر جلب بنك المواد التعليمية', err.response?.data?.message);
  } finally {
    if (!activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
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
        toast.success('تمت الإضافة بنجاح', `تمت إضافة المادة (${form.value.name}) إلى بنك المواد`);
        showDrawer.value = false;
        fetchSubjects();
      }
    } else if (activeSubjectToEdit.value) {
      const res = await academicApi.updateSubject(activeSubjectToEdit.value.id, payload);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات المادة التعليمية بنجاح`);
        showDrawer.value = false;
        fetchSubjects();
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ غير متوقع');
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
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteSubject(subjectToDelete.value.id);
    if (res.data.success) {
      toast.success('تم الحذف بنجاح', `تم حذف المادة (${subjectToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchSubjects();
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف المادة لوجود ارتباطات بالمقررات والامتحانات.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchSubjects();
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
              @keyup.enter="fetchSubjects"
              type="text"
              placeholder="بحث باسم أو رمز المادة التعليمية..."
              class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
            />
          </div>
          <button
            @click="fetchSubjects"
            :disabled="loading"
            class="h-[42px] px-3.5 rounded-2xl bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="بحث فوري (أو اضغط Enter)"
          >
            <Search class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Add Subject Button -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مادة تعليمية</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-bx-muted space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل بنك المواد والمناهج...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="subjects.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] border-dashed rounded-2xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center shadow-xs">
        <BookOpenCheck class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد مواد تعليمية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">ابدأ بإنشاء المواد الدراسية ورموزها المرجعية لربطها بالصفوف لاحقاً.</p>
      </div>
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[40px] px-5 text-xs font-bold rounded-xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مادة جديدة</span>
      </button>
    </div>

    <!-- Subjects Table Card (Taqniya Unified Bordered Card with Sticky Header) -->
    <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
              <th class="py-3.5 px-5 font-bold text-start w-16">#</th>
              <th class="py-3.5 px-5 font-bold text-start">
                <div class="flex items-center gap-2">
                  <BookOpenCheck class="w-3.5 h-3.5 text-bx-primary" />
                  <span>اسم المادة التعليمية</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center">
                <div class="inline-flex items-center justify-center gap-1.5">
                  <Code class="w-3.5 h-3.5 text-bx-primary" />
                  <span>الرمز المرجعي (Code)</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center w-28">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12] font-medium text-bx-text">
            <tr
              v-for="(sub, idx) in subjects"
              :key="sub.id"
              class="hover:bg-purple-500/[0.05] dark:hover:bg-white/[0.03] transition-colors duration-150 group"
            >
              <td class="py-3.5 px-5">
                <span class="w-7 h-7 rounded-xl bg-purple-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted group-hover:text-bx-primary group-hover:border-bx-primary/30 transition-colors">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div>
                  <span class="font-black text-bx-title text-sm block leading-tight">{{ sub.name }}</span>
                  <span class="text-[10px] text-bx-muted font-mono">SUB-{{ String(sub.id).padStart(3, '0') }}#</span>
                </div>
              </td>
              <td class="py-3.5 px-5 text-center">
                <span
                  v-if="sub.code"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 shadow-xs"
                >
                  <Code class="w-3.5 h-3.5" />
                  {{ sub.code }}
                </span>
                <span v-else class="text-bx-muted text-xs font-bold">غير محدد</span>
              </td>
              <td class="py-3.5 px-5">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditDrawer(sub)"
                    title="تعديل المادة في القائمة الجانبية (Drawer)"
                    class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="confirmDelete(sub)"
                    title="حذف المادة"
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
          <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
          <span>إجمالي المواد التعليمية: <strong class="text-bx-title font-black">{{ subjects.length }}</strong></span>
        </div>
        <div class="text-[11px] text-bx-muted">
          بنك المواد والمناهج المعتمد (عرض كامل بدون تجزئة صفحات)
        </div>
      </div>
    </div>

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة مادة تعليمية جديدة' : 'تعديل بيانات المادة التعليمية'"
      :subtitle="drawerMode === 'create' ? 'تسجيل مادة جديدة في بنك المناهج والمقررات المدرسية' : `تحديث بيانات (${activeSubjectToEdit?.name})`"
      :icon="BookOpenCheck"
      @close="showDrawer = false"
    >
      <form id="subjectDrawerForm" @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Subject Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            اسم المادة التعليمية <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: الرياضيات ، العلوم ، التربية الإسلامية"
            class="w-full h-[42px] px-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Subject Code -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            الرمز المرجعي المختصر (Code)
          </label>
          <div class="relative">
            <Code class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model="form.code"
              type="text"
              placeholder="مثال: MATH, SCI, ISLAM"
              class="w-full h-[42px] pr-10 pl-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text uppercase placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
          </div>
          <p class="text-[11px] text-bx-muted">رمز إنجليزي فريد لتسهيل استيراد الدرجات والتقارير الأكاديمية.</p>
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
          form="subjectDrawerForm"
          :disabled="isSubmitting"
          class="bx-btn bx-btn-primary h-[42px] px-6 text-xs font-bold rounded-2xl cursor-pointer disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ drawerMode === 'create' ? 'حفظ المادة' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Dialog) -->
    <div
      v-if="showDeleteModal && subjectToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف المادة التعليمية</h3>
            <p class="text-[11px] text-bx-muted">حماية العلاقات الأكاديمية (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف مادة <strong class="text-bx-title font-black">({{ subjectToDelete.name }})</strong> من بنك المواد؟
          سيتم رفض العملية إذا تم إسناد هذه المادة لأي صفوف أو خطط دراسية.
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
