<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import { academicApi, type AcademicTermItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';

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
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const terms = ref<AcademicTermItem[]>([]);

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeTermToEdit = ref<AcademicTermItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  name: '',
  term_number: 1,
});

// Delete Confirmation
const showDeleteModal = ref(false);
const termToDelete = ref<AcademicTermItem | null>(null);
const isDeleting = ref(false);

const fetchTerms = async () => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const res = await academicApi.getTerms(activeAbortController.signal);
    if (res.data.success) {
      terms.value = res.data.data;
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('تعذر جلب الفصول الدراسية', err.response?.data?.message);
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
    toast.warning('بيانات غير صالحة', 'يرجى إدخال اسم ورقم ترتيب الفصل بشكل صحيح.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createTerm(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تمت إضافة الفصل (${form.value.name}) إلى الكتالوج`);
        showDrawer.value = false;
        fetchTerms();
      }
    } else if (activeTermToEdit.value) {
      const res = await academicApi.updateTerm(activeTermToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات الفصل بنجاح`);
        showDrawer.value = false;
        fetchTerms();
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
      toast.success('تم الحذف بنجاح', `تم حذف الفصل الدراسي (${termToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchTerms();
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف الفصل لوجود فصول صفية أو امتحانات مرتبطة به.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchTerms();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Action Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] shadow-xs">
      <div>
        <h3 class="text-sm font-bold text-bx-title">كتالوج الفصول والأنصاف المعتمدة</h3>
        <p class="text-[11px] text-bx-muted">الفصول المرجعية العامة بالمدرسة (مثال: الفصل الأول، الفصل الثاني)</p>
      </div>

      <!-- Add Term Button -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة فصل دراسي</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-bx-muted space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل الفصول الدراسية...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="terms.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] border-dashed rounded-2xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-xs">
        <BookOpen class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد فصول دراسية مسجلة بالكتالوج</h3>
        <p class="text-xs text-bx-muted mt-1">قم بتسجيل الفصول المعيارية (مثال: الفصل الدراسي الأول، الفصل الدراسي الثاني).</p>
      </div>
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[40px] px-5 text-xs font-bold rounded-xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة فصل الآن</span>
      </button>
    </div>

    <!-- Terms Table Card (Taqniya Unified Bordered Card) -->
    <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
              <th class="py-3.5 px-5 font-bold text-start w-16">#</th>
              <th class="py-3.5 px-5 font-bold text-start">
                <div class="flex items-center gap-2">
                  <BookOpen class="w-3.5 h-3.5 text-blue-600" />
                  <span>اسم الفصل الدراسي</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center">
                <div class="inline-flex items-center justify-center gap-1.5">
                  <Hash class="w-3.5 h-3.5 text-blue-600" />
                  <span>الرقم الترتيبي بالتقويم</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center w-28">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12] font-medium text-bx-text">
            <tr
              v-for="(term, idx) in terms"
              :key="term.id"
              class="hover:bg-blue-500/[0.05] dark:hover:bg-white/[0.03] transition-colors duration-150 group"
            >
              <td class="py-3.5 px-5">
                <span class="w-7 h-7 rounded-xl bg-blue-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted group-hover:text-blue-600 group-hover:border-blue-500/30 transition-colors">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div>
                  <span class="font-black text-bx-title text-sm block leading-tight">{{ term.name }}</span>
                  <span class="text-[10px] text-bx-muted font-mono">TRM-{{ String(term.id).padStart(3, '0') }}#</span>
                </div>
              </td>
              <td class="py-3.5 px-5 text-center">
                <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 shadow-xs">
                  <Hash class="w-3.5 h-3.5" />
                  الفصل رقم: {{ term.term_number }}
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditDrawer(term)"
                    title="تعديل الفصل في القائمة الجانبية (Drawer)"
                    class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="confirmDelete(term)"
                    title="حذف الفصل"
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

      <!-- Table Bottom Stats Bar -->
      <div class="px-5 py-3.5 border-t border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] flex items-center justify-between text-xs text-bx-muted font-bold">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>إجمالي الفصول المعتمدة: <strong class="text-bx-title font-black">{{ terms.length }}</strong></span>
        </div>
        <div class="text-[11px] text-bx-muted">
          فترات التقويم الدراسي
        </div>
      </div>
    </div>

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة فصل إلى الكتالوج' : 'تعديل بيانات الفصل الدراسي'"
      :subtitle="drawerMode === 'create' ? 'تسجيل فصل دراسي جديد في الكتالوج العام للمدرسة' : `تحديث بيانات (${activeTermToEdit?.name})`"
      :icon="BookOpen"
      @close="showDrawer = false"
    >
      <form id="termDrawerForm" @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Term Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            اسم الفصل الدراسي <span class="text-rose-500">*</span>
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
            رقم الفصل الترتيبي (Term Number) <span class="text-rose-500">*</span>
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
          <p class="text-[11px] text-bx-muted">يحدد تسلسل الفصل زمنياً خلال العام الدراسي (1 للأول، 2 للثاني...)</p>
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
          <span>{{ drawerMode === 'create' ? 'حفظ الفصل' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Dialog) -->
    <div
      v-if="showDeleteModal && termToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف الفصل الدراسي</h3>
            <p class="text-[11px] text-bx-muted">الحماية من الحذف في حالة الارتباطات (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف الفصل <strong class="text-bx-title font-black">{{ termToDelete.name }}</strong> من الكتالوج العام؟
          سيتم رفض العملية إذا كان مستخدماً في أي سنة أو صف دراسي.
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
