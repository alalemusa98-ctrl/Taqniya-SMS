<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { academicApi, type AcademicStageItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
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

// Modal state
const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
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
  loading.value = true;
  try {
    const res = await academicApi.getStages();
    if (res.data.success) {
      stages.value = res.data.data;
    }
  } catch (err: any) {
    toast.error('تعذر جلب المراحل الدراسية', err.response?.data?.message);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  modalMode.value = 'create';
  activeStageToEdit.value = null;
  form.value = {
    name: '',
    order_index: stages.value.length + 1,
  };
  showModal.value = true;
};

const openEditModal = (stage: AcademicStageItem) => {
  modalMode.value = 'edit';
  activeStageToEdit.value = stage;
  form.value = {
    name: stage.name,
    order_index: stage.order_index,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || form.value.order_index < 1) {
    toast.warning('بيانات غير صالحة', 'يرجى إدخال اسم المرحلة وترتيبها بشكل صحيح.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (modalMode.value === 'create') {
      const res = await academicApi.createStage(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تمت إضافة المرحلة (${form.value.name}) بنجاح`);
        showModal.value = false;
        fetchStages();
      }
    } else if (activeStageToEdit.value) {
      const res = await academicApi.updateStage(activeStageToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات المرحلة بنجاح`);
        showModal.value = false;
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
    <div class="flex items-center justify-between gap-4 bg-[var(--bx-surface)] p-4 rounded-2xl border border-bx-border shadow-xs">
      <div>
        <h3 class="text-xs font-bold text-bx-title">الهيكل التنظيمي للمراحل التعليمية</h3>
        <p class="text-[11px] text-bx-muted">المراحل الأساسية (مثل: رياض الأطفال، الابتدائية، الإعدادية، الثانوية)</p>
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 px-5 py-2.5 bg-bx-primary text-white text-xs font-bold rounded-xl shadow-md shadow-bx-primary/20 hover:bg-opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مرحلة دراسية</span>
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
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface)] border border-bx-border border-dashed rounded-3xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center">
        <GraduationCap class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد مراحل دراسية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">المراحل التعليمية هي الركيزة الأساسية لتعريف الصفوف والمستويات الدراسية.</p>
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2 bg-bx-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مرحلة جديدة</span>
      </button>
    </div>

    <!-- Stages List -->
    <div v-else class="space-y-3">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="flex items-center justify-between p-4 bg-[var(--bx-surface)] border border-bx-border hover:border-bx-primary/40 rounded-2xl shadow-xs transition-all"
      >
        <div class="flex items-center gap-4">
          <!-- Order Badge -->
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-mono font-black text-sm">
            #{{ stage.order_index }}
          </div>

          <div>
            <h4 class="text-sm font-black text-bx-title">{{ stage.name }}</h4>
            <span class="text-[11px] text-bx-muted flex items-center gap-1.5 mt-0.5">
              <ArrowDownUp class="w-3 h-3 text-bx-muted" />
              الترتيب الهرمي: المستوى {{ stage.order_index }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            @click="openEditModal(stage)"
            class="p-2 text-bx-muted hover:text-bx-primary hover:bg-bx-primary/10 rounded-xl transition-colors cursor-pointer"
            title="تعديل"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button
            @click="confirmDelete(stage)"
            class="p-2 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="حذف"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-bx-border shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between pb-3 border-b border-bx-border">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold">
              <GraduationCap class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-bold text-bx-title">
              {{ modalMode === 'create' ? 'إضافة مرحلة دراسية جديدة' : 'تعديل المرحلة الدراسية' }}
            </h3>
          </div>
          <button @click="showModal = false" class="text-bx-muted hover:text-bx-text text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">اسم المرحلة الدراسية *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="مثال: المرحلة الابتدائية"
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">الترتيب الهرمي (Order Index) *</label>
            <input
              v-model.number="form.order_index"
              type="number"
              min="1"
              max="99"
              required
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
            <p class="text-[10px] text-bx-muted mt-1">يحدد الترتيب التصاعدي للمراحل في القوائم وسجلات الانتقال والترقية.</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-bx-border">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 text-xs font-bold text-bx-muted hover:text-bx-text rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex items-center gap-2 px-5 py-2.5 bg-bx-primary text-white text-xs font-bold rounded-xl shadow-md shadow-bx-primary/20 hover:bg-opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ modalMode === 'create' ? 'حفظ المرحلة' : 'تحديث' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal && stageToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-bx-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف المرحلة التعليمية</h3>
            <p class="text-[11px] text-bx-muted">حماية العلاقات الصفية (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف المرحلة <strong class="text-bx-title font-black">{{ stageToDelete.name }}</strong>؟
          سيتم رفض الحذف إذا كانت تحتوي على صفوف دراسية تابعة لها.
        </p>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-bx-border">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-xs font-bold text-bx-muted hover:text-bx-text rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>حذف نهائي</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
