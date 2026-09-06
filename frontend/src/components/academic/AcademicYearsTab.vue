<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { academicApi, type AcademicYearItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import {
  Calendar,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Zap,
  Filter,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const years = ref<AcademicYearItem[]>([]);
const search = ref('');
const statusFilter = ref<string | number>('all');
const pagination = ref({
  page: 1,
  per_page: 10,
  total: 0,
});

const statusOptions = [
  { value: 'all', label: 'كافة الحالات' },
  { value: '1', label: 'السنوات النشطة (الحالية)' },
  { value: '0', label: 'السنوات الأرشيفية' },
];

// Drawer states
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeYearToEdit = ref<AcademicYearItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  name: '',
  start_date: '',
  end_date: '',
});

// Confirmation Delete Modal
const showDeleteModal = ref(false);
const yearToDelete = ref<AcademicYearItem | null>(null);
const isDeleting = ref(false);

// Activate Confirmation
const showActivateModal = ref(false);
const yearToActivate = ref<AcademicYearItem | null>(null);
const isActivating = ref(false);

const fetchYears = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      per_page: pagination.value.per_page,
    };
    if (search.value.trim()) params.search = search.value.trim();
    if (statusFilter.value !== 'all') params.is_active = Number(statusFilter.value);

    const res = await academicApi.getYears(params);
    if (res.data.success) {
      years.value = res.data.data;
      if (res.data.meta) {
        pagination.value.total = res.data.meta.total;
      }
    }
  } catch (err: any) {
    toast.error('تعذر جلب قائمة السنوات الدراسية', err.response?.data?.message);
  } finally {
    loading.value = false;
  }
};

const openCreateDrawer = () => {
  drawerMode.value = 'create';
  activeYearToEdit.value = null;
  form.value = {
    name: '',
    start_date: '',
    end_date: '',
  };
  showDrawer.value = true;
};

const openEditDrawer = (year: AcademicYearItem) => {
  drawerMode.value = 'edit';
  activeYearToEdit.value = year;
  form.value = {
    name: year.name,
    start_date: year.start_date,
    end_date: year.end_date,
  };
  showDrawer.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.start_date || !form.value.end_date) {
    toast.warning('بيانات غير مكتملة', 'يرجى ملء جميع الحقول الإلزامية.');
    return;
  }

  if (new Date(form.value.start_date) >= new Date(form.value.end_date)) {
    toast.warning('تواريخ غير متوافقة', 'يجب أن يكون تاريخ بداية السنة قبل تاريخ نهايتها.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createYear(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تم إنشاء السنة الدراسية (${form.value.name})`);
        showDrawer.value = false;
        fetchYears();
      }
    } else if (activeYearToEdit.value) {
      const res = await academicApi.updateYear(activeYearToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات السنة الدراسية بنجاح`);
        showDrawer.value = false;
        fetchYears();
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ أثناء حفظ السنة الدراسية');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmActivate = (year: AcademicYearItem) => {
  yearToActivate.value = year;
  showActivateModal.value = true;
};

const handleActivate = async () => {
  if (!yearToActivate.value) return;
  isActivating.value = true;
  try {
    const res = await academicApi.activateYear(yearToActivate.value.id);
    if (res.data.success) {
      toast.success('تم التفعيل بنجاح', `أصبحت السنة (${yearToActivate.value.name}) هي السنة النشطة الوحيدة.`);
      showActivateModal.value = false;
      fetchYears();
    }
  } catch (err: any) {
    toast.error('فشل التفعيل', err.response?.data?.message || 'حدث خطأ أثناء تفعيل السنة الدراسية');
  } finally {
    isActivating.value = false;
  }
};

const confirmDelete = (year: AcademicYearItem) => {
  yearToDelete.value = year;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!yearToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteYear(yearToDelete.value.id);
    if (res.data.success) {
      toast.success('تم الحذف بنجاح', `تم حذف السنة الدراسية (${yearToDelete.value.name})`);
      showDeleteModal.value = false;
      fetchYears();
    }
  } catch (err: any) {
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف السنة لارتباطها ببيانات دراسية أو لكونها السنة النشطة.');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchYears();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Action & Filter Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface)] p-4 rounded-2xl border border-bx-border shadow-xs">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 min-w-[220px] max-w-md">
          <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
          <input
            v-model="search"
            @keyup.enter="fetchYears"
            type="text"
            placeholder="بحث باسم السنة الدراسية..."
            class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Filter Active (Taqniya Select) -->
        <TaqniyaSelect
          v-model="statusFilter"
          :options="statusOptions"
          :icon="Filter"
          @update:model-value="fetchYears"
        />
      </div>

      <!-- Add Year Button -->
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>إضافة سنة دراسية</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-bx-muted space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل بيانات السنوات الدراسية...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="years.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface)] border border-bx-border border-dashed rounded-3xl text-center p-6 space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center shadow-xs">
        <Calendar class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد سنوات دراسية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">ابدأ بإنشاء السنة الدراسية الأولى لإطلاق الهيكل التعليمي للمدرسة.</p>
      </div>
      <button
        @click="openCreateDrawer"
        class="bx-btn bx-btn-primary h-[40px] px-5 text-xs font-bold"
      >
        <Plus class="w-4 h-4" />
        <span>إنشاء سنة الآن</span>
      </button>
    </div>

    <!-- Years Table -->
    <div v-else class="bg-[var(--bx-surface)] border border-bx-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-bx-border bg-[var(--bx-surface-solid)]/70 text-bx-muted font-bold">
              <th class="py-3.5 px-4">#</th>
              <th class="py-3.5 px-4">السنة الدراسية</th>
              <th class="py-3.5 px-4">تاريخ البداية</th>
              <th class="py-3.5 px-4">تاريخ النهاية</th>
              <th class="py-3.5 px-4 text-center">الحالة التشغيلية</th>
              <th class="py-3.5 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bx-border font-medium text-bx-text">
            <tr
              v-for="(yr, idx) in years"
              :key="yr.id"
              class="hover:bg-[var(--bx-surface-solid)]/50 transition-colors"
              :class="{ 'bg-emerald-500/5': yr.is_active === 1 }"
            >
              <td class="py-3.5 px-4 text-bx-muted font-mono font-bold">{{ idx + 1 }}</td>
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
                    :class="yr.is_active === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-bx-primary/10 text-bx-primary'"
                  >
                    <Calendar class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="font-bold text-bx-title text-sm">{{ yr.name }}</span>
                    <span v-if="yr.is_active === 1" class="mr-2 text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      السنة الحالية النشطة
                    </span>
                  </div>
                </div>
              </td>
              <td class="py-3.5 px-4 font-mono font-bold text-bx-muted">
                {{ yr.start_date }}
              </td>
              <td class="py-3.5 px-4 font-mono font-bold text-bx-muted">
                {{ yr.end_date }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                  :class="yr.is_active === 1
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="yr.is_active === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
                  {{ yr.is_active === 1 ? 'نشطة (جارية)' : 'مؤرشفة' }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center justify-center gap-2">
                  <!-- Activate Year -->
                  <button
                    v-if="yr.is_active !== 1"
                    @click="confirmActivate(yr)"
                    title="تفعيل هذه السنة (جعلها السنة النشطة)"
                    class="bx-icon-btn p-2 text-bx-muted hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    <Zap class="w-4 h-4" />
                  </button>
                  <button
                    @click="openEditDrawer(yr)"
                    title="تعديل السنة في القائمة الجانبية (Drawer)"
                    class="bx-icon-btn p-2 text-bx-muted hover:text-bx-primary hover:bg-bx-primary/10 rounded-xl transition-all cursor-pointer"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(yr)"
                    :disabled="yr.is_active === 1"
                    :title="yr.is_active === 1 ? 'لا يمكن حذف السنة النشطة' : 'حذف السنة'"
                    class="bx-icon-btn p-2 rounded-xl transition-all cursor-pointer"
                    :class="yr.is_active === 1 ? 'text-bx-muted/30 cursor-not-allowed' : 'text-bx-muted hover:text-rose-500 hover:bg-rose-500/10'"
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

    <!-- Create/Edit Side Drawer (Taqniya Spatial Drawer) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="drawerMode === 'create' ? 'إضافة سنة دراسية جديدة' : 'تعديل بيانات السنة الدراسية'"
      :subtitle="drawerMode === 'create' ? 'تسجيل سنة جديدة في التقويم الأكاديمي للمدرسة' : `تحديث بيانات (${activeYearToEdit?.name})`"
      :icon="Calendar"
      @close="showDrawer = false"
    >
      <form id="yearDrawerForm" @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Year Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            اسم السنة الدراسية <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="مثال: 2025-2026"
            class="w-full h-[42px] px-4 bg-[var(--bx-surface)] border border-bx-border rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
          />
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-bx-title">
              تاريخ البداية <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.start_date"
              type="date"
              required
              class="w-full h-[42px] px-4 bg-[var(--bx-surface)] border border-bx-border rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-bx-title">
              تاريخ النهاية <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.end_date"
              type="date"
              required
              class="w-full h-[42px] px-4 bg-[var(--bx-surface)] border border-bx-border rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-mono font-bold"
            />
          </div>
        </div>

        <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>السنة الجديدة تنشأ كغير نشطة افتراضياً لحماية البيانات، ويمكنك تفعيلها بعد التأكد من مطابقة الجداول وتجهيز المقررات.</span>
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
          form="yearDrawerForm"
          :disabled="isSubmitting"
          class="bx-btn bx-btn-primary h-[42px] px-6 text-xs font-bold disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ drawerMode === 'create' ? 'حفظ السنة' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Activation Confirmation Modal (Taqniya Dialog) -->
    <div
      v-if="showActivateModal && yearToActivate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-bx-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-emerald-600">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Zap class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد تفعيل السنة الدراسية</h3>
            <p class="text-[11px] text-bx-muted">القاعدة الحاكمة: سنة نشطة واحدة فقط</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل أنت متأكد من تفعيل السنة الدراسية <strong class="text-bx-title font-black">{{ yearToActivate.name }}</strong>؟
          سيتم تلقائياً وبشكل ذري تحويل أي سنة نشطة أخرى إلى حالة الأرشفة.
        </p>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-bx-border">
          <button
            @click="showActivateModal = false"
            class="bx-btn bx-btn-outline h-[38px] px-5 text-xs font-bold"
          >
            تراجع
          </button>
          <button
            @click="handleActivate"
            :disabled="isActivating"
            class="bx-btn bx-btn-success h-[38px] px-5 text-xs font-bold disabled:opacity-50"
          >
            <Loader2 v-if="isActivating" class="w-3.5 h-3.5 animate-spin" />
            <span>تأكيد التفعيل</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal (Taqniya Dialog) -->
    <div
      v-if="showDeleteModal && yearToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-bx-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد حذف السنة الدراسية</h3>
            <p class="text-[11px] text-bx-muted">حماية العلاقات المدرسية (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف السنة الدراسية <strong class="text-bx-title font-black">{{ yearToDelete.name }}</strong>؟
          سيتم رفض العملية فوراً في حال وجود طلاب أو فصول دراسية أو قيود مالية مسندة لهذه السنة.
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
