<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { academicApi, type AcademicTermItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
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

// Modal state
const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
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
  loading.value = true;
  try {
    const res = await academicApi.getTerms();
    if (res.data.success) {
      terms.value = res.data.data;
    }
  } catch (err: any) {
    toast.error('تعذر جلب الفصول الدراسية', err.response?.data?.message);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  modalMode.value = 'create';
  activeTermToEdit.value = null;
  form.value = {
    name: '',
    term_number: terms.value.length + 1,
  };
  showModal.value = true;
};

const openEditModal = (term: AcademicTermItem) => {
  modalMode.value = 'edit';
  activeTermToEdit.value = term;
  form.value = {
    name: term.name,
    term_number: term.term_number,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || form.value.term_number < 1) {
    toast.warning('بيانات غير صالحة', 'يرجى إدخال اسم ورقم ترتيب الفصل بشكل صحيح.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (modalMode.value === 'create') {
      const res = await academicApi.createTerm(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تمت إضافة الفصل (${form.value.name}) إلى الكتالوج`);
        showModal.value = false;
        fetchTerms();
      }
    } else if (activeTermToEdit.value) {
      const res = await academicApi.updateTerm(activeTermToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات الفصل بنجاح`);
        showModal.value = false;
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
    <div class="flex items-center justify-between gap-4 bg-[var(--bx-surface)] p-4 rounded-2xl border border-bx-border shadow-xs">
      <div>
        <h3 class="text-xs font-bold text-bx-title">كتالوج الفصول المعتمدة للنظام</h3>
        <p class="text-[11px] text-bx-muted">الفصول المرجعية العامة (مثل: الفصل الأول، الفصل الثاني، الصيفي)</p>
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 px-5 py-2.5 bg-bx-primary text-white text-xs font-bold rounded-xl shadow-md shadow-bx-primary/20 hover:bg-opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface)] border border-bx-border border-dashed rounded-3xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center">
        <BookOpen class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد فصول دراسية في الكتالوج</h3>
        <p class="text-xs text-bx-muted mt-1">أنشئ الفصول الدراسية ليتم ربطها لاحقاً بالصفوف والسنة الدراسية.</p>
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2 bg-bx-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة فصل دراسي</span>
      </button>
    </div>

    <!-- Terms Grid Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="term in terms"
        :key="term.id"
        class="bg-[var(--bx-surface)] border border-bx-border hover:border-bx-primary/40 rounded-2xl p-5 shadow-xs transition-all space-y-4 relative group"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-black">
              <Hash class="w-5 h-5" />
            </div>
            <div>
              <span class="text-[11px] font-bold text-bx-muted">الفصل رقم {{ term.term_number }}</span>
              <h4 class="text-sm font-black text-bx-title">{{ term.name }}</h4>
            </div>
          </div>

          <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              @click="openEditModal(term)"
              class="p-1.5 text-bx-muted hover:text-bx-primary hover:bg-bx-primary/10 rounded-lg transition-colors cursor-pointer"
              title="تعديل"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click="confirmDelete(term)"
              class="p-1.5 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="حذف"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="pt-3 border-t border-bx-border flex items-center justify-between text-[11px] text-bx-muted">
          <span>معرف الكتالوج: #{{ term.id }}</span>
          <span class="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">معتمد رسمياً</span>
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
              <BookOpen class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-bold text-bx-title">
              {{ modalMode === 'create' ? 'إضافة فصل إلى الكتالوج' : 'تعديل بيانات الفصل' }}
            </h3>
          </div>
          <button @click="showModal = false" class="text-bx-muted hover:text-bx-text text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">اسم الفصل الدراسي *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="مثال: الفصل الدراسي الأول"
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">رقم الفصل الترتيبي (Term Number) *</label>
            <input
              v-model.number="form.term_number"
              type="number"
              min="1"
              max="12"
              required
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
            <p class="text-[10px] text-bx-muted mt-1">يحدد تسلسل الفصل زمنياً خلال العام الدراسي (1 للأول، 2 للثاني...)</p>
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
              <span>{{ modalMode === 'create' ? 'حفظ الفصل' : 'تحديث' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal && termToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-bx-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
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
