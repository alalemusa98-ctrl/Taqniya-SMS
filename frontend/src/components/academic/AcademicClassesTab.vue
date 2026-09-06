<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  academicApi,
  type AcademicClassItem,
  type AcademicStageItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  GraduationCap,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const classes = ref<AcademicClassItem[]>([]);
const stages = ref<AcademicStageItem[]>([]);

const search = ref('');
const selectedStageFilter = ref<string>('all');
const pagination = ref({
  page: 1,
  per_page: 15,
  total: 0,
});

// Modal state
const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const activeClassToEdit = ref<AcademicClassItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  stage_id: 0,
  name: '',
  grade_level: 1,
});

// Delete Confirmation Modal
const showDeleteModal = ref(false);
const classToDelete = ref<AcademicClassItem | null>(null);
const isDeleting = ref(false);

const fetchStages = async () => {
  try {
    const res = await academicApi.getStages();
    if (res.data.success) {
      stages.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load stages for filter', err);
  }
};

const fetchClasses = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      per_page: pagination.value.per_page,
    };
    if (search.value.trim()) params.search = search.value.trim();
    if (selectedStageFilter.value !== 'all') {
      params.stage_id = Number(selectedStageFilter.value);
    }

    const res = await academicApi.getClasses(params);
    if (res.data.success) {
      classes.value = res.data.data;
      if (res.data.meta) {
        pagination.value.total = res.data.meta.total;
      }
    }
  } catch (err: any) {
    toast.error('تعذر جلب قائمة الصفوف الدراسية', err.response?.data?.message);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  modalMode.value = 'create';
  activeClassToEdit.value = null;
  form.value = {
    stage_id: stages.value.length > 0 ? stages.value[0].id : 0,
    name: '',
    grade_level: 1,
  };
  showModal.value = true;
};

const openEditModal = (classItem: AcademicClassItem) => {
  modalMode.value = 'edit';
  activeClassToEdit.value = classItem;
  form.value = {
    stage_id: classItem.stage_id,
    name: classItem.name,
    grade_level: classItem.grade_level,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.stage_id || form.value.grade_level < 1) {
    toast.warning('بيانات غير مكتملة', 'يرجى ملء جميع الحقول المطلوبة والتأكد من تحديد المرحلة.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (modalMode.value === 'create') {
      const res = await academicApi.createClass(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تم إنشاء الصف الدراسي (${form.value.name})`);
        showModal.value = false;
        fetchClasses();
      }
    } else if (activeClassToEdit.value) {
      const res = await academicApi.updateClass(activeClassToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات الصف الدراسي بنجاح`);
        showModal.value = false;
        fetchClasses();
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ أثناء حفظ الصف الدراسي');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (classItem: AcademicClassItem) => {
  classToDelete.value = classItem;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!classToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteClass(classToDelete.value.id);
    if (res.data.success) {
      toast.success('تم الحذف بنجاح', `تم حذف الصف الدراسي (${classToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchClasses();
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف الصف لارتباطه ببيانات دراسية نشطة.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(async () => {
  await fetchStages();
  fetchClasses();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Action & Filter Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface)] p-4 rounded-2xl border border-bx-border shadow-xs">
      <div class="flex flex-1 items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted" />
          <input
            v-model="search"
            @keyup.enter="fetchClasses"
            type="text"
            placeholder="بحث باسم الصف الدراسي..."
            class="w-full pr-10 pl-4 py-2 bg-[var(--bx-surface-solid)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Stage Filter -->
        <select
          v-model="selectedStageFilter"
          @change="fetchClasses"
          class="px-3 py-2 bg-[var(--bx-surface-solid)] border border-bx-border rounded-xl text-xs font-bold text-bx-text focus:outline-hidden focus:border-bx-primary transition-all cursor-pointer"
        >
          <option value="all">كافة المراحل التعليمية</option>
          <option v-for="stg in stages" :key="stg.id" :value="stg.id">
            {{ stg.name }}
          </option>
        </select>
      </div>

      <!-- Add Class Button -->
      <button
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 px-5 py-2.5 bg-bx-primary text-white text-xs font-bold rounded-xl shadow-md shadow-bx-primary/20 hover:bg-opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة صف دراسي</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-bx-muted space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل الصفوف الدراسية...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="classes.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface)] border border-bx-border border-dashed rounded-3xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center">
        <Layers class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد صفوف دراسية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">قم بإضافة الصفوف وتسكينها في المراحل المناسبة (مثال: الصف الأول، الصف الخامس).</p>
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2 bg-bx-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة صف جديد</span>
      </button>
    </div>

    <!-- Classes Table -->
    <div v-else class="bg-[var(--bx-surface)] border border-bx-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-bx-border bg-[var(--bx-surface-solid)]/70 text-bx-muted font-bold">
              <th class="py-3.5 px-4">#</th>
              <th class="py-3.5 px-4">اسم الصف الدراسي</th>
              <th class="py-3.5 px-4">المرحلة التعليمية</th>
              <th class="py-3.5 px-4 text-center">المستوى الأكاديمي الرقمي</th>
              <th class="py-3.5 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bx-border font-medium text-bx-text">
            <tr
              v-for="(cls, idx) in classes"
              :key="cls.id"
              class="hover:bg-[var(--bx-surface-solid)]/40 transition-colors"
            >
              <td class="py-3.5 px-4 text-bx-muted font-mono font-bold">{{ idx + 1 }}</td>
              <td class="py-3.5 px-4">
                <span class="font-bold text-bx-title text-sm">{{ cls.name }}</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <GraduationCap class="w-3.5 h-3.5" />
                  {{ cls.stage_name || 'غير محدد' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-center">
                <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  المستوى {{ cls.grade_level }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditModal(cls)"
                    title="تعديل الصف"
                    class="p-1.5 text-bx-muted hover:text-bx-primary hover:bg-bx-primary/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(cls)"
                    title="حذف الصف"
                    class="p-1.5 text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
              <Layers class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-bold text-bx-title">
              {{ modalMode === 'create' ? 'إضافة صف دراسي جديد' : 'تعديل بيانات الصف الدراسي' }}
            </h3>
          </div>
          <button @click="showModal = false" class="text-bx-muted hover:text-bx-text text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">المرحلة التعليمية التابع لها *</label>
            <select
              v-model="form.stage_id"
              required
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-bold cursor-pointer"
            >
              <option :value="0" disabled>اختر المرحلة التعليمية...</option>
              <option v-for="stg in stages" :key="stg.id" :value="stg.id">
                {{ stg.name }} (الترتيب: {{ stg.order_index }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">اسم الصف الدراسي *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="مثال: الصف الخامس الابتدائي"
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">المستوى الرقمي الأكاديمي (Grade Level) *</label>
            <input
              v-model.number="form.grade_level"
              type="number"
              min="1"
              max="12"
              required
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
            <p class="text-[10px] text-bx-muted mt-1">الرقم من 1 إلى 12 لحساب الترفيع والترحيل التلقائي. يمنع تكراره لنفس المرحلة.</p>
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
              <span>{{ modalMode === 'create' ? 'حفظ الصف' : 'تحديث' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal && classToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-bx-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف الصف الدراسي</h3>
            <p class="text-[11px] text-bx-muted">حماية العلاقات الصفية (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف الصف الدراسي <strong class="text-bx-title font-black">{{ classToDelete.name }}</strong>؟
          سيتم رفض العملية فوراً في حال وجود فصول تقويم أو شُعب أو مقررات مسندة لهذا الصف.
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
