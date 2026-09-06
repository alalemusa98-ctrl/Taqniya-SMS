<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  academicApi,
  type AcademicClassItem,
  type AcademicStageItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Hash,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const classes = ref<AcademicClassItem[]>([]);
const stages = ref<AcademicStageItem[]>([]);

const search = ref('');
const selectedStageFilter = ref<string | number>('all');
const pagination = ref({
  page: 1,
  per_page: 15,
  total: 0,
});

// Drawer state for Create / Edit
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeClassToEdit = ref<AcademicClassItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  stage_id: 0,
  name: '',
  grade_level: 1,
});

// Options for TaqniyaSelect
const stageFilterOptions = computed(() => [
  { value: 'all', label: 'كافة المراحل التعليمية' },
  ...stages.value.map((s) => ({ value: s.id, label: s.name })),
]);

const stageFormOptions = computed(() =>
  stages.value.map((s) => ({
    value: s.id,
    label: `${s.name} (الترتيب: ${s.order_index})`,
  })),
);

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

const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeClassToEdit.value = null;
  form.value = {
    stage_id: stages.value.length > 0 ? stages.value[0].id : 0,
    name: '',
    grade_level: 1,
  };
  showDrawer.value = true;
};

const openEditDrawer = (classItem: AcademicClassItem) => {
  drawerMode.value = 'edit';
  activeClassToEdit.value = classItem;
  form.value = {
    stage_id: classItem.stage_id,
    name: classItem.name,
    grade_level: classItem.grade_level,
  };
  showDrawer.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.stage_id || form.value.grade_level < 1) {
    toast.warning('بيانات غير مكتملة', 'يرجى ملء جميع الحقول المطلوبة والتأكد من تحديد المرحلة.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createClass(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تم إنشاء الصف الدراسي (${form.value.name})`);
        showDrawer.value = false;
        fetchClasses();
      }
    } else if (activeClassToEdit.value) {
      const res = await academicApi.updateClass(activeClassToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات الصف الدراسي بنجاح`);
        showDrawer.value = false;
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
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[220px] max-w-md">
          <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
          <input
            v-model="search"
            @keyup.enter="fetchClasses"
            type="text"
            placeholder="بحث باسم الصف الدراسي..."
            class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Stage Filter (Taqniya Custom Select) -->
        <TaqniyaSelect
          v-model="selectedStageFilter"
          :options="stageFilterOptions"
          :icon="GraduationCap"
          @update:model-value="fetchClasses"
        />
      </div>

      <!-- Add Class Button (Taqniya Standard Button) -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0"
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
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center shadow-xs">
        <Layers class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد صفوف دراسية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">قم بإضافة الصفوف وتسكينها في المراحل المناسبة (مثال: الصف الأول، الصف الخامس).</p>
      </div>
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[40px] px-5 text-xs font-bold"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة صف جديد</span>
      </button>
    </div>

    <!-- Classes Table Card (Taqniya Spatial Card) -->
    <div v-else class="bx-card bg-[var(--bx-surface-solid)] border border-bx-border rounded-3xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-bx-border bg-[var(--bx-table-header)] text-bx-muted font-black">
              <th class="py-4 px-5 text-start w-16">#</th>
              <th class="py-4 px-5">
                <div class="flex items-center gap-2">
                  <Layers class="w-3.5 h-3.5 text-bx-primary" />
                  <span>اسم الصف الدراسي</span>
                </div>
              </th>
              <th class="py-4 px-5">
                <div class="flex items-center gap-2">
                  <GraduationCap class="w-3.5 h-3.5 text-purple-600" />
                  <span>المرحلة التعليمية</span>
                </div>
              </th>
              <th class="py-4 px-5 text-center">
                <div class="inline-flex items-center justify-center gap-1.5">
                  <Hash class="w-3.5 h-3.5 text-emerald-600" />
                  <span>المستوى الأكاديمي</span>
                </div>
              </th>
              <th class="py-4 px-5 text-center w-28">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bx-divider font-medium text-bx-text">
            <tr
              v-for="(cls, idx) in classes"
              :key="cls.id"
              class="hover:bg-[var(--bx-row-hover)] transition-all duration-150 group"
            >
              <td class="py-4 px-5">
                <span class="w-7 h-7 rounded-xl bg-[var(--bx-pill)] border border-bx-border/80 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted group-hover:text-bx-primary group-hover:border-bx-primary/30 transition-colors">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="py-4 px-5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Layers class="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span class="font-black text-bx-title text-sm block leading-tight">{{ cls.name }}</span>
                    <span class="text-[10px] text-bx-muted font-mono">معرف الصف: #{{ cls.id }}</span>
                  </div>
                </div>
              </td>
              <td class="py-4 px-5">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-xs">
                  <GraduationCap class="w-3.5 h-3.5" />
                  {{ cls.stage_name || 'غير محدد' }}
                </span>
              </td>
              <td class="py-4 px-5 text-center">
                <span class="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  المستوى {{ cls.grade_level }}
                </span>
              </td>
              <td class="py-4 px-5">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditDrawer(cls)"
                    title="تعديل الصف في القائمة الجانبية (Drawer)"
                    class="bx-icon-btn w-8 h-8 rounded-xl border border-bx-border text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 transition-all cursor-pointer"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="confirmDelete(cls)"
                    title="حذف الصف"
                    class="bx-icon-btn w-8 h-8 rounded-xl border border-bx-border text-bx-muted hover:text-rose-500 hover:border-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
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
      <div class="px-5 py-3 border-t border-bx-border bg-[var(--bx-table-header)]/50 flex items-center justify-between text-xs text-bx-muted font-bold">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-bx-primary"></span>
          <span>إجمالي الصفوف المعروضة: <strong class="text-bx-title font-black">{{ classes.length }}</strong></span>
        </div>
        <div class="text-[11px] text-bx-muted font-mono">
          Phase 02-B • Academic Classes
        </div>
      </div>
    </div>

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة صف دراسي جديد' : 'تعديل بيانات الصف الدراسي'"
      :subtitle="drawerMode === 'create' ? 'تسكين الصف في المرحلة التعليمية وضبط المستوى الرقمي' : `تحديث بيانات (${activeClassToEdit?.name})`"
      :icon="Layers"
      @close="showDrawer = false"
    >
      <form id="classDrawerForm" @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Stage Dropdown (Taqniya Custom Select) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            المرحلة التعليمية التابع لها <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            v-model="form.stage_id"
            :options="stageFormOptions"
            :full-width="true"
            placeholder="اختر المرحلة التعليمية..."
            :icon="GraduationCap"
          />
          <p class="text-[11px] text-bx-muted">المرحلة الأم الحاضنة للصف (الروضة، الابتدائي، الإعدادي، الثانوي).</p>
        </div>

        <!-- Class Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            اسم الصف الدراسي <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: الصف الخامس الابتدائي"
            class="w-full h-[42px] px-4 bg-[var(--bx-surface)] border border-bx-border rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Grade Level -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            المستوى الرقمي الأكاديمي (Grade Level) <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <Hash class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model.number="form.grade_level"
              type="number"
              min="1"
              max="12"
              required
              placeholder="1 - 12"
              class="w-full h-[42px] pr-10 pl-4 bg-[var(--bx-surface)] border border-bx-border rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
          </div>
          <div class="p-3 bg-bx-primary/5 border border-bx-primary/15 rounded-2xl text-[11px] text-bx-muted leading-relaxed flex items-start gap-2 mt-2">
            <Sparkles class="w-4 h-4 text-bx-primary shrink-0 mt-0.5" />
            <span>الرقم من 1 إلى 12 يُعتمد آلياً لترقية وترحيل الطلاب بين الصفوف ويمنع تكراره لنفس المرحلة التعليمية.</span>
          </div>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          @click="showDrawer = false"
          class="bx-btn bx-btn-outline h-[42px] px-6 text-xs font-bold"
        >
          إلغاء
        </button>
        <button
          type="submit"
          form="classDrawerForm"
          :disabled="isSubmitting"
          class="bx-btn bx-btn-primary h-[42px] px-6 text-xs font-bold disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ drawerMode === 'create' ? 'حفظ الصف الدراسي' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Dialog) -->
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

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-bx-border">
          <button
            @click="showDeleteModal = false"
            class="bx-btn bx-btn-outline h-[38px] px-5 text-xs font-bold"
          >
            إلغاء
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="bx-btn bx-btn-danger h-[38px] px-5 text-xs font-bold disabled:opacity-50"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>حذف نهائي</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
