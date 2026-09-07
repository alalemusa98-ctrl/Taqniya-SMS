<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue';
import { academicApi, type AcademicYearItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaErrorBoundary from '../ui/TaqniyaErrorBoundary.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

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

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

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
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      per_page: 100, // Non-paginated complete view of academic years
    };
    if (search.value.trim()) params.search = search.value.trim();
    if (statusFilter.value !== 'all') params.is_active = Number(statusFilter.value);

    const res = await academicApi.getYears(params, activeAbortController.signal);
    if (res.data.success) {
      years.value = res.data.data;
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    toast.error('تعذر جلب قائمة السنوات الدراسية', err.response?.data?.message);
  } finally {
    if (!activeAbortController?.signal.aborted) {
      loading.value = false;
    }
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
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] shadow-xs">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <!-- Search with Action Trigger Button -->
        <div class="relative flex-1 min-w-[220px] max-w-md flex items-center gap-1.5">
          <div class="relative flex-1">
            <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted pointer-events-none" />
            <input
              v-model="search"
              @keyup.enter="fetchYears"
              type="text"
              placeholder="بحث باسم السنة الدراسية..."
              class="w-full pr-10 pl-4 h-[42px] bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold text-start"
            />
          </div>
          <button
            @click="fetchYears"
            :disabled="loading"
            class="h-[42px] px-3.5 rounded-2xl bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="بحث فوري (أو اضغط Enter)"
          >
            <Search class="w-4 h-4" />
          </button>
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
        class="bx-btn bx-btn-primary h-[42px] px-5 text-xs font-bold shrink-0 rounded-2xl cursor-pointer"
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
      class="flex flex-col items-center justify-center py-16 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] border-dashed rounded-2xl text-center p-6 space-y-4"
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
        class="bx-btn bx-btn-primary h-[40px] px-5 text-xs font-bold rounded-xl cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إنشاء سنة الآن</span>
      </button>
    </div>

    <!-- Years Table Card (Taqniya Unified Bordered Card) -->
    <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
              <th class="py-3.5 px-5 font-bold text-start w-16">#</th>
              <th class="py-3.5 px-5 font-bold text-start">
                <div class="flex items-center gap-2">
                  <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                  <span>السنة الدراسية</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-start">
                <div class="flex items-center gap-2">
                  <span>تاريخ البداية</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-start">
                <div class="flex items-center gap-2">
                  <span>تاريخ النهاية</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center">
                <div class="inline-flex items-center justify-center gap-1.5">
                  <Zap class="w-3.5 h-3.5 text-emerald-600" />
                  <span>الحالة التشغيلية</span>
                </div>
              </th>
              <th class="py-3.5 px-5 font-bold text-center w-32">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12] font-medium text-bx-text">
            <tr
              v-for="(yr, idx) in years"
              :key="yr.id"
              class="hover:bg-emerald-500/[0.05] dark:hover:bg-white/[0.03] transition-colors duration-150 group"
              :class="{ 'bg-emerald-500/[0.03]': yr.is_active === 1 }"
            >
              <td class="py-3.5 px-5">
                <span class="w-7 h-7 rounded-xl bg-emerald-500/10 border border-[#B4AED8]/60 dark:border-white/10 flex items-center justify-center font-mono font-black text-[11px] text-bx-muted group-hover:text-emerald-600 group-hover:border-emerald-500/30 transition-colors">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-black text-bx-title text-sm block leading-tight">{{ yr.name }}</span>
                    <span v-if="yr.is_active === 1" class="text-[10px] font-black border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      السنة النشطة
                    </span>
                  </div>
                  <span class="text-[10px] text-bx-muted font-mono">YR-{{ String(yr.id).padStart(3, '0') }}#</span>
                </div>
              </td>
              <td class="py-3.5 px-5 font-mono font-bold text-bx-text">
                <span class="px-2.5 py-1 rounded-lg bg-[var(--bx-surface-solid)] border border-[#B4AED8]/70 dark:border-white/10 text-[11px]">
                  {{ yr.start_date }}
                </span>
              </td>
              <td class="py-3.5 px-5 font-mono font-bold text-bx-text">
                <span class="px-2.5 py-1 rounded-lg bg-[var(--bx-surface-solid)] border border-[#B4AED8]/70 dark:border-white/10 text-[11px]">
                  {{ yr.end_date }}
                </span>
              </td>
              <td class="py-3.5 px-5 text-center">
                <span
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs"
                  :class="yr.is_active === 1
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'border-slate-500/25 text-slate-700 dark:text-slate-300 bg-slate-500/10'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="yr.is_active === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
                  <span>{{ yr.is_active === 1 ? 'نشطة (السنة الحالية)' : 'مؤرشفة' }}</span>
                </span>
              </td>
              <td class="py-3.5 px-5">
                <div class="flex items-center justify-center gap-2">
                  <!-- Activate Year -->
                  <button
                    v-if="yr.is_active !== 1"
                    @click="confirmActivate(yr)"
                    title="تفعيل هذه السنة (جعلها السنة النشطة)"
                    class="w-8 h-8 rounded-full border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <Zap class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="openEditDrawer(yr)"
                    title="تعديل السنة في القائمة الجانبية (Drawer)"
                    class="w-8 h-8 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="confirmDelete(yr)"
                    :disabled="yr.is_active === 1"
                    :title="yr.is_active === 1 ? 'لا يمكن حذف السنة النشطة' : 'حذف السنة'"
                    class="w-8 h-8 rounded-full border transition-all shadow-xs flex items-center justify-center"
                    :class="yr.is_active === 1
                      ? 'text-bx-muted/30 border-[#B4AED8]/30 dark:border-white/5 cursor-not-allowed bg-slate-500/5'
                      : 'border-red-300 dark:border-red-500/40 bg-red-100/70 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer'"
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
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>إجمالي السنوات الدراسية: <strong class="text-bx-title font-black">{{ years.length }}</strong></span>
        </div>
        <div class="text-[11px] text-bx-muted">
          التقويم الأكاديمي المعتمد (عرض كامل بدون تجزئة صفحات)
        </div>
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
            class="w-full h-[42px] px-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
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
              dir="ltr"
              lang="en-GB"
              required
              class="w-full h-[42px] px-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-bold"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-bx-title">
              تاريخ النهاية <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.end_date"
              type="date"
              dir="ltr"
              lang="en-GB"
              required
              class="w-full h-[42px] px-4 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-2xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-bold"
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
          class="bx-btn bx-btn-outline h-[42px] px-6 text-xs font-bold rounded-2xl cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="submit"
          form="yearDrawerForm"
          :disabled="isSubmitting"
          class="bx-btn bx-btn-primary h-[42px] px-6 text-xs font-bold rounded-2xl cursor-pointer disabled:opacity-50"
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
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-3 text-emerald-600">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Zap class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-bx-title">تأكيد تفعيل السنة الدراسية</h3>
            <p class="text-[11px] text-bx-muted">اعتماد السنة الدراسية الحالية للمدرسة</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل أنت متأكد من تفعيل السنة الدراسية <strong class="text-bx-title font-black">{{ yearToActivate.name }}</strong>؟
          سيتم اعتماد هذه السنة كسنة دراسية حالية وإلغاء تفعيل أي سنة سابقة.
        </p>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#B4AED8] dark:border-white/[0.12]">
          <button
            @click="showActivateModal = false"
            class="bx-btn bx-btn-outline h-[38px] px-5 text-xs font-bold rounded-xl cursor-pointer"
          >
            تراجع
          </button>
          <button
            @click="handleActivate"
            :disabled="isActivating"
            class="bx-btn bx-btn-success h-[38px] px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
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
      <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
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
