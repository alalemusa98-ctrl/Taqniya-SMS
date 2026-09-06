<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { academicApi, type AcademicYearItem } from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const years = ref<AcademicYearItem[]>([]);
const search = ref('');
const statusFilter = ref<string>('all');
const pagination = ref({
  page: 1,
  per_page: 10,
  total: 0,
});

// Modal states
const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
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

const openCreateModal = () => {
  modalMode.value = 'create';
  activeYearToEdit.value = null;
  form.value = {
    name: '',
    start_date: '',
    end_date: '',
  };
  showModal.value = true;
};

const openEditModal = (year: AcademicYearItem) => {
  modalMode.value = 'edit';
  activeYearToEdit.value = year;
  form.value = {
    name: year.name,
    start_date: year.start_date,
    end_date: year.end_date,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.start_date || !form.value.end_date) {
    toast.warning('بيانات غير مكتملة', 'يرجى ملء جميع الحقول الإلزامية.');
    return;
  }

  if (new Date(form.value.end_date) <= new Date(form.value.start_date)) {
    toast.warning('خطأ في التواريخ', 'تاريخ نهاية السنة الدراسية يجب أن يكون بعد تاريخ البداية.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (modalMode.value === 'create') {
      const res = await academicApi.createYear(form.value);
      if (res.data.success) {
        toast.success('تمت الإضافة بنجاح', `تم إنشاء السنة الدراسية (${form.value.name})`);
        showModal.value = false;
        fetchYears();
      }
    } else if (activeYearToEdit.value) {
      const res = await academicApi.updateYear(activeYearToEdit.value.id, form.value);
      if (res.data.success) {
        toast.success('تم التحديث بنجاح', `تم تحديث بيانات السنة الدراسية بنجاح`);
        showModal.value = false;
        fetchYears();
      }
    }
  } catch (err: any) {
    toast.error('فشلت العملية', err.response?.data?.message || 'حدث خطأ غير متوقع');
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
      toast.success(
        'تم اعتماد السنة الدراسية',
        `تم تفعيل (${yearToActivate.value.name}) كسنة دراسية حالية ونشطة لجميع العمليات.`
      );
      showActivateModal.value = false;
      fetchYears();
    }
  } catch (err: any) {
    toast.error('فشل التفعيل', err.response?.data?.message || 'تعذر تفعيل السنة الدراسية');
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
    toast.error('تعذر الحذف', err.response?.data?.message || 'لا يمكن حذف السنة الدراسية لوجود سجلات مرتبطة بها.');
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
    <!-- Top Action & Filter Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bx-surface)] p-4 rounded-2xl border border-bx-border shadow-xs">
      <div class="flex flex-1 items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bx-muted" />
          <input
            v-model="search"
            @keyup.enter="fetchYears"
            type="text"
            placeholder="بحث باسم السنة الدراسية..."
            class="w-full pr-10 pl-4 py-2 bg-[var(--bx-surface-solid)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all"
          />
        </div>

        <!-- Filter Active -->
        <select
          v-model="statusFilter"
          @change="fetchYears"
          class="px-3 py-2 bg-[var(--bx-surface-solid)] border border-bx-border rounded-xl text-xs font-bold text-bx-text focus:outline-hidden focus:border-bx-primary transition-all"
        >
          <option value="all">كافة الحالات</option>
          <option value="1">السنوات النشطة (الحالية)</option>
          <option value="0">السنوات الأرشيفية</option>
        </select>
      </div>

      <!-- Add Year Button -->
      <button
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 px-5 py-2.5 bg-bx-primary text-white text-xs font-bold rounded-xl shadow-md shadow-bx-primary/20 hover:bg-opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center">
        <Calendar class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-bx-title">لا توجد سنوات دراسية مسجلة</h3>
        <p class="text-xs text-bx-muted mt-1">ابدأ بإنشاء السنة الدراسية الأولى لإطلاق الهيكل التعليمي للمدرسة.</p>
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2 bg-bx-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إنشاء سنة الآن</span>
      </button>
    </div>

    <!-- Table of Years -->
    <div v-else class="bg-[var(--bx-surface)] border border-bx-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-bx-border bg-[var(--bx-surface-solid)]/70 text-bx-muted font-bold">
              <th class="py-3.5 px-4">#</th>
              <th class="py-3.5 px-4">السنة الدراسية</th>
              <th class="py-3.5 px-4">تاريخ البداية</th>
              <th class="py-3.5 px-4">تاريخ النهاية</th>
              <th class="py-3.5 px-4 text-center">الحالة الإدارية</th>
              <th class="py-3.5 px-4 text-center">الإجراءات والعمليات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bx-border font-medium text-bx-text">
            <tr
              v-for="(year, idx) in years"
              :key="year.id"
              class="hover:bg-[var(--bx-surface-solid)]/40 transition-colors"
              :class="year.is_active === 1 ? 'bg-emerald-500/5' : ''"
            >
              <td class="py-3.5 px-4 text-bx-muted font-mono font-bold">{{ idx + 1 }}</td>
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2.5">
                  <span class="font-bold text-bx-title text-sm">{{ year.name }}</span>
                  <span
                    v-if="year.is_active === 1"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 animate-pulse"
                  >
                    <Sparkles class="w-2.5 h-2.5" />
                    السنة الحالية النشطة
                  </span>
                </div>
              </td>
              <td class="py-3.5 px-4 font-mono font-bold text-bx-muted">
                {{ year.start_date }}
              </td>
              <td class="py-3.5 px-4 font-mono font-bold text-bx-muted">
                {{ year.end_date }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span
                  v-if="year.is_active === 1"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  نشطة
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20"
                >
                  <Clock class="w-3.5 h-3.5" />
                  مؤرشفة / غير نشطة
                </span>
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center justify-center gap-2">
                  <!-- Activate Button -->
                  <button
                    v-if="year.is_active !== 1"
                    @click="confirmActivate(year)"
                    title="تفعيل واعتماد كسنة حالية"
                    class="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Zap class="w-3.5 h-3.5" />
                    <span>تفعيل</span>
                  </button>

                  <!-- Edit Button -->
                  <button
                    @click="openEditModal(year)"
                    title="تعديل"
                    class="p-1.5 text-bx-muted hover:text-bx-primary hover:bg-bx-primary/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <!-- Delete Button -->
                  <button
                    @click="confirmDelete(year)"
                    title="حذف"
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
              <Calendar class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-bold text-bx-title">
              {{ modalMode === 'create' ? 'إضافة سنة دراسية جديدة' : 'تعديل بيانات السنة الدراسية' }}
            </h3>
          </div>
          <button @click="showModal = false" class="text-bx-muted hover:text-bx-text text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-bx-text mb-1.5">اسم السنة الدراسية *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="مثال: 2025-2026"
              class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text placeholder:text-bx-muted focus:outline-hidden focus:border-bx-primary transition-all font-bold"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-bx-text mb-1.5">تاريخ البداية *</label>
              <input
                v-model="form.start_date"
                type="date"
                required
                class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-bold"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-bx-text mb-1.5">تاريخ النهاية *</label>
              <input
                v-model="form.end_date"
                type="date"
                required
                class="w-full px-3.5 py-2.5 bg-[var(--bx-surface)] border border-bx-border rounded-xl text-xs text-bx-text focus:outline-hidden focus:border-bx-primary transition-all font-bold"
              />
            </div>
          </div>

          <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <span>السنة الجديدة تنشأ كغير نشطة افتراضياً لحماية البيانات، ويمكنك تفعيلها بعد التحقق من الجداول.</span>
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
              <span>{{ modalMode === 'create' ? 'حفظ السنة' : 'تحديث البيانات' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Activation Confirmation Modal -->
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

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-bx-border">
          <button
            @click="showActivateModal = false"
            class="px-4 py-2 text-xs font-bold text-bx-muted hover:text-bx-text rounded-xl transition-colors cursor-pointer"
          >
            تراجع
          </button>
          <button
            @click="handleActivate"
            :disabled="isActivating"
            class="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isActivating" class="w-3.5 h-3.5 animate-spin" />
            <span>تأكيد التفعيل الآن</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
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
            <p class="text-[11px] text-bx-muted">الحماية الصارمة من الحذف الخاطئ (RESTRICT)</p>
          </div>
        </div>

        <p class="text-xs text-bx-text leading-relaxed">
          هل تريد حذف السنة الدراسية <strong class="text-bx-title font-black">{{ yearToDelete.name }}</strong>؟
          لن يكتمل الحذف إذا كانت هناك بيانات تسجيل طلاب أو فصول دراسية مرتبطة بها.
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
