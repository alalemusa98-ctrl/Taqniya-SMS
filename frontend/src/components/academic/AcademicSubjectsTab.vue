<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  academicApi,
  type AcademicSubjectItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
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
const pagination = ref({
  page: 1,
  per_page: 15,
  total: 0,
});

// Modal state
const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
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
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      per_page: pagination.value.per_page,
    };
    if (search.value.trim()) params.search = search.value.trim();

    const res = await academicApi.getSubjects(params);
    if (res.data.success) {
      subjects.value = res.data.data;
      if (res.data.meta) {
        pagination.value.total = res.data.meta.total;
      }
    }
  } catch (err: any) {
    toast.error('تعذر جلب بنك المواد التعليمية', err.response?.data?.message);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  modalMode.value = 'create';
  activeSubjectToEdit.value = null;
  form.value = {
    name: '',
    code: '',
  };
  showModal.value = true;
};

const openEditModal = (subject: AcademicSubjectItem) => {
  modalMode.value = 'edit';
  activeSubjectToEdit.value = subject;
  form.value = {
    name: subject.name,
    code: subject.code || '',
  };
  showModal.value = true;
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

    if (modalMode.value === 'create') {
      const res = await academicApi.createSubject(payload);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تمت إضافة المادة (${form.value.name}) إلى بنك المواد`);
        showModal.value = false;
        fetchSubjects();
      }
    } else if (activeSubjectToEdit.value) {
      const res = await academicApi.updateSubject(activeSubjectToEdit.value.id, payload);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات المادة التعليمية بنجاح`);
        showModal.value = false;
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
      toast.success('تم الحذف بنجاح', `تم حذف المادة (${subjectToDelete.value.name}) من بنك المواد`);
      showDeleteModal.value = false;
      fetchSubjects();
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف المادة لإسنادها في مناهج ومقررات صفوف دراسية (RESTRICT).');
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
    <!-- Action & Search Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface)] p-4 rounded-2xl border border-bx-border shadow-xs">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted" />
        <input
          v-model="search"
          @keyup.enter="fetchSubjects"
          type="text"
          placeholder="بحث باسم المادة أو الكود الرمزي..."
          class="w-full pr-10 pl-4 py-2 bg-[var(--bx-surface-solid)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
        />
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 px-5 py-2.5 bg-bx-primary text-white text-xs font-bold rounded-xl shadow-md shadow-bx-primary/20 hover:bg-opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة مادة تعليمية</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-bx-muted space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل بنك المواد التعليمية...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="subjects.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface)] border border-bx-border border-dashed rounded-3xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center">
        <BookOpenCheck class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد مواد تعليمية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">أنشئ بنك المواد والمناهج المعتمدة بالمدرسة (مثل: الرياضيات، اللغة العربية، العلوم).</p>
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2 bg-bx-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة أول مادة الآن</span>
      </button>
    </div>

    <!-- Subjects Grid Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="subject in subjects"
        :key="subject.id"
        class="bg-[var(--bx-surface)] border border-bx-border hover:border-bx-primary/40 rounded-2xl p-5 shadow-xs transition-all space-y-4 relative group"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <BookOpenCheck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-sm font-black text-bx-title">{{ subject.name }}</h4>
              <span v-if="subject.code" class="inline-flex items-center gap-1 font-mono font-bold text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded mt-0.5">
                <Code class="w-2.5 h-2.5" />
                {{ subject.code }}
              </span>
              <span v-else class="text-[10px] text-bx-muted block mt-0.5">بدون كود رمزي</span>
            </div>
          </div>

          <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              @click="openEditModal(subject)"
              class="p-1.5 text-bx-muted hover:text-bx-primary hover:bg-bx-primary/10 rounded-lg transition-colors cursor-pointer"
              title="تعديل"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click="confirmDelete(subject)"
              class="p-1.5 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="حذف"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="pt-3 border-t border-bx-border flex items-center justify-between text-[11px] text-bx-muted">
          <span>معرف البنك: #{{ subject.id }}</span>
          <span class="font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">منهج معتمد</span>
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
              <BookOpenCheck class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-bold text-bx-title">
              {{ modalMode === 'create' ? 'إضافة مادة تعليمية جديدة' : 'تعديل بيانات المادة' }}
            </h3>
          </div>
          <button @click="showModal = false" class="text-bx-muted hover:text-bx-text text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">اسم المادة التعليمية *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="مثال: الرياضيات العامة أو اللغة الإنجليزية"
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">الكود الرمزي للمادة (اختياري)</label>
            <input
              v-model="form.code"
              type="text"
              placeholder="مثال: MATH, ENG, ARAB"
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold uppercase"
            />
            <p class="text-[10px] text-bx-muted mt-1">يُستخدم للاختصار في جداول الحصص والشهادات. يمنع تكراره إن وجد.</p>
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
              <span>{{ modalMode === 'create' ? 'حفظ المادة' : 'تحديث' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal && subjectToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-bx-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف المادة التعليمية</h3>
            <p class="text-[11px] text-bx-muted">الحماية من الحذف المرجعي (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف المادة التعليمية <strong class="text-bx-title font-black">{{ subjectToDelete.name }}</strong> من بنك المواد؟
          سيتم رفض الحذف إذا كانت مسندة في مقررات صفوف دراسية أو امتحانات.
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
