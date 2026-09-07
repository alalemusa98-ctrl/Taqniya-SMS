<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import { academicApi, type AcademicStageItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';

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
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const stages = ref<AcademicStageItem[]>([]);

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeStageToEdit = ref<AcademicStageItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  name: '',
  order_index: 1,
});

// Delete Confirmation
const showDeleteModal = ref(false);
const stageToDelete = ref<AcademicStageItem | null>(null);
const isDeleting = ref(false);

const fetchStages = async () => {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const res = await academicApi.getStages(activeAbortController.signal);
    if (res.data.success) {
      stages.value = res.data.data;
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('تعذر جلب المراحل الدراسية', err.response?.data?.message);
  } finally {
    if (!activeAbortController?.signal.aborted) {
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
        toast.success('تمت الإضافة بنجاح', `تمت إضافة المرحلة (${form.value.name}) بنجاح`);
        showDrawer.value = false;
        fetchStages();
      }
    } else if (activeStageToEdit.value) {
      const res = await academicApi.updateStage(activeStageToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات المرحلة بنجاح`);
        showDrawer.value = false;
        fetchStages();
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
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteStage(stageToDelete.value.id);
    if (res.data.success) {
      toast.success('تم الحذف بنجاح', `تم حذف المرحلة الدراسية (${stageToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchStages();
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف المرحلة لوجود صفوف دراسية تابعة لها.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchStages();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Action Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] shadow-xs">
      <div>
        <h3 class="text-sm font-bold text-bx-title">الهيكل الهرمي للمراحل التعليمية</h3>
        <p class="text-[11px] text-bx-muted">المراحل الأساسية الحاضنة للصفوف (الروضة، الابتدائية، الإعدادية، الثانوية)</p>
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

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-bx-muted space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل المراحل الدراسية...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="stages.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] border-dashed rounded-2xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shadow-xs">
        <GraduationCap class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد مراحل تعليمية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">ابدأ بإنشاء أول مرحلة تعليمية (مثال: المرحلة الابتدائية).</p>
      </div>
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[40px] px-5 text-xs font-bold rounded-xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مرحلة الآن</span>
      </button>
    </div>

    <!-- Stages Table Card (Taqniya Unified Bordered Card) -->
    <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
              <th class="py-3.5 px-5 font-bold text-start w-16">#</th>
              <th class="py-3.5 px-5 font-bold text-start">
                <div class="flex items-center gap-2">
                  <GraduationCap class="w-3.5 h-3.5 text-purple-600" />
                  <span>اسم المرحلة التعليمية</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center">
                <div class="inline-flex items-center justify-center gap-1.5">
                  <ArrowDownUp class="w-3.5 h-3.5 text-purple-600" />
                  <span>الترتيب الهرمي النظامي</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center w-28">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12] font-medium text-bx-text">
            <tr
              v-for="(stage, idx) in stages"
              :key="stage.id"
              class="hover:bg-purple-500/[0.05] dark:hover:bg-white/[0.03] transition-colors duration-150 group"
            >
              <td class="py-3.5 px-5">
                <span class="w-7 h-7 rounded-xl bg-purple-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted group-hover:text-purple-600 group-hover:border-purple-500/30 transition-colors">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div>
                  <span class="font-black text-bx-title text-sm block leading-tight">{{ stage.name }}</span>
                  <span class="text-[10px] text-bx-muted font-mono">STG-{{ String(stage.id).padStart(3, '0') }}#</span>
                </div>
              </td>
              <td class="py-3.5 px-5 text-center">
                <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 shadow-xs">
                  <ArrowDownUp class="w-3.5 h-3.5" />
                  المستوى رقم: {{ stage.order_index }}
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditDrawer(stage)"
                    title="تعديل المرحلة في القائمة الجانبية (Drawer)"
                    class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="confirmDelete(stage)"
                    title="حذف المرحلة"
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
          <span class="w-2 h-2 rounded-full bg-purple-600"></span>
          <span>إجمالي المراحل المعتمدة: <strong class="text-bx-title font-black">{{ stages.length }}</strong></span>
        </div>
        <div class="text-[11px] text-bx-muted">
          المراحل التعليمية الرسمية
        </div>
      </div>
    </div>

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

    <!-- Delete Confirmation Modal (Taqniya Dialog) -->
    <div
      v-if="showDeleteModal && stageToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف المرحلة التعليمية</h3>
            <p class="text-[11px] text-bx-muted">حماية العلاقات الهرمية (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف المرحلة <strong class="text-bx-title font-black">{{ stageToDelete.name }}</strong>؟
          سيتم رفض الحذف فوراً في حال وجود صفوف دراسية مسجلة تحت هذه المرحلة.
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
