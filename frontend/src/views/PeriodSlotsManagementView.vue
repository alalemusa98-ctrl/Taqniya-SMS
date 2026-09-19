<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import {
  Plus,
  Search,
  Clock,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Coffee,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  Zap,
  TrendingUp,
  CheckCircle2,
  Star,
  Save,
} from 'lucide-vue-next';
import {
  periodSlotsApi,
  type PeriodSlot,
  type PaginationMeta,
  type CreatePeriodSlotPayload,
  type UpdatePeriodSlotPayload,
} from '../api/period-slots.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';
import TaqniyaModal from '../components/ui/TaqniyaModal.vue';
import PeriodSlotsTimeline from '../components/period-slots/PeriodSlotsTimeline.vue';
import PeriodSlotDrawerForm from '../components/period-slots/PeriodSlotDrawerForm.vue';

// 1. Component Lazy Loading (frontend_capabilities.yaml)
const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));

const toast = useToast();

// 2. Reactive State Management (reactive_state)
const slots = ref<PeriodSlot[]>([]);
const meta = ref<PaginationMeta>({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const loading = ref(false);
const isSubmitting = ref(false);
const errorMsg = ref<string | null>(null);

// Filters & Controls
const search = ref('');
const filterType = ref<'all' | 'class' | 'break'>('all');
const sortBy = ref<'slot_number' | 'start_time'>('slot_number');
const sortOrder = ref<'asc' | 'desc'>('asc');
const currentPage = ref(1);

// 3. Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeSlot = ref<PeriodSlot | null>(null);

// 4. Form State Optimization (form_state_optimization)
const formData = ref({
  name: '',
  slot_number: 1,
  start_time: '08:00',
  end_time: '08:45',
  is_break: false,
});
const formErrors = ref<Record<string, string>>({});
const formErrorMessage = ref<string | null>(null);

// Delete Modal State
const showDeleteModal = ref(false);
const slotToDelete = ref<PeriodSlot | null>(null);
const isDeleting = ref(false);

// Columns Configuration for TaqniyaTable
const columns: TableColumn[] = [
  {
    key: 'slot_number',
    label: '# الرقم',
    align: 'start',
    width: '75px',
    headerClass: "font-['Alexandria',sans-serif] border-e border-bx-divider",
    cellClass: 'border-e border-bx-divider',
  },
  {
    key: 'name',
    label: 'مسمى الحصة / الفترة',
    align: 'start',
    headerClass: 'border-e border-bx-divider',
    cellClass: 'border-e border-bx-divider',
  },
  {
    key: 'start_time',
    label: 'وقت البداية',
    align: 'start',
    width: '110px',
    headerClass: 'border-e border-bx-divider',
    cellClass: 'border-e border-bx-divider text-start',
  },
  {
    key: 'end_time',
    label: 'وقت النهاية',
    align: 'start',
    width: '110px',
    headerClass: 'border-e border-bx-divider',
    cellClass: 'border-e border-bx-divider text-start',
  },
  {
    key: 'duration',
    label: 'المدة المحسوبة',
    align: 'start',
    width: '110px',
    headerClass: 'border-e border-bx-divider',
    cellClass: 'border-e border-bx-divider',
  },
  {
    key: 'is_break',
    label: 'نوع الفترة',
    align: 'center',
    width: '130px',
    headerClass: 'border-e border-bx-divider',
    cellClass: 'border-e border-bx-divider',
  },
  {
    key: 'actions',
    label: 'الإجراءات',
    align: 'center',
    width: '110px',
  },
];

// Helper: Calculate Duration in Minutes
function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const total1 = h1 * 60 + m1;
  const total2 = h2 * 60 + m2;
  const diff = total2 - total1;
  return diff > 0 ? `${diff} دقيقة` : '-';
}

// 5. Async Data Fetching & SWR Client Caching
async function fetchSlots() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  const isBreakParam =
    filterType.value === 'break' ? 1 : filterType.value === 'class' ? 0 : undefined;

  const queryParams = {
    search: search.value.trim() || undefined,
    is_break: isBreakParam,
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
    page: currentPage.value,
    per_page: meta.value.per_page,
  };

  // Check client SWR cache first
  const cached = periodSlotsApi.getCachedPeriodSlots(queryParams);
  if (cached) {
    slots.value = cached.data;
    meta.value = cached.meta;
  } else {
    loading.value = true;
  }

  errorMsg.value = null;

  try {
    const res = await periodSlotsApi.getPeriodSlots(queryParams, activeAbortController.signal);
    if (res.data && res.data.success) {
      slots.value = res.data.data;
      meta.value = res.data.meta;
    }
  } catch (err: any) {
    if (err.name !== 'CanceledError' && err.message !== 'canceled') {
      const msg = err?.response?.data?.message || 'تعذر تحميل فترات الحصص اليومية.';
      errorMsg.value = msg;
      toast.error(msg);
    }
  } finally {
    loading.value = false;
  }
}

// 6. Debouncing & Throttling
let debounceTimer: any = null;
function onSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchSlots();
  }, 350);
}

function onPageChange(page: number) {
  currentPage.value = page;
  fetchSlots();
}

// Drawer Open Handlers
function openCreateDrawer() {
  drawerMode.value = 'create';
  activeSlot.value = null;
  formErrorMessage.value = null;
  formErrors.value = {};

  const nextSlotNumber =
    slots.value.length > 0 ? Math.max(...slots.value.map((s) => s.slot_number)) + 1 : 1;

  formData.value = {
    name: `الحصة ${nextSlotNumber}`,
    slot_number: nextSlotNumber,
    start_time: '08:00',
    end_time: '08:45',
    is_break: false,
  };
  showDrawer.value = true;
}

function openEditDrawer(slot: PeriodSlot) {
  drawerMode.value = 'edit';
  activeSlot.value = slot;
  formErrorMessage.value = null;
  formErrors.value = {};

  formData.value = {
    name: slot.name,
    slot_number: slot.slot_number,
    start_time: slot.start_time.substring(0, 5),
    end_time: slot.end_time.substring(0, 5),
    is_break: slot.is_break === 1,
  };
  showDrawer.value = true;
}

// Form Validation
function validateForm(): boolean {
  const errors: Record<string, string> = {};

  if (!formData.value.name.trim()) {
    errors.name = 'مسمى الحصة مطلوب.';
  } else if (formData.value.name.trim().length > 50) {
    errors.name = 'مسمى الحصة يجب ألا يتجاوز 50 حرفاً.';
  }

  if (!formData.value.slot_number || formData.value.slot_number < 1) {
    errors.slot_number = 'الرقم التسلسلي للحصة يجب أن يكون رقماً صحيحاً موجباً.';
  }

  if (!formData.value.start_time) {
    errors.start_time = 'وقت البداية مطلوب.';
  }

  if (!formData.value.end_time) {
    errors.end_time = 'وقت النهاية مطلوب.';
  } else if (formData.value.start_time && formData.value.start_time >= formData.value.end_time) {
    errors.end_time = 'وقت النهاية يجب أن يكون لاحقاً لوقت البداية.';
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
}

// Submit Form
async function handleSubmit() {
  formErrorMessage.value = null;
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    const formattedStartTime =
      formData.value.start_time.length === 5
        ? `${formData.value.start_time}:00`
        : formData.value.start_time;
    const formattedEndTime =
      formData.value.end_time.length === 5
        ? `${formData.value.end_time}:00`
        : formData.value.end_time;

    if (drawerMode.value === 'create') {
      const payload: CreatePeriodSlotPayload = {
        name: formData.value.name.trim(),
        slot_number: Number(formData.value.slot_number),
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        is_break: formData.value.is_break ? 1 : 0,
      };

      const res = await periodSlotsApi.createPeriodSlot(payload);
      toast.success(res.data.message || 'تم إنشاء فترة الحصة اليومية بنجاح.');
    } else if (activeSlot.value) {
      const payload: UpdatePeriodSlotPayload = {
        name: formData.value.name.trim(),
        slot_number: Number(formData.value.slot_number),
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        is_break: formData.value.is_break ? 1 : 0,
      };

      const res = await periodSlotsApi.updatePeriodSlot(activeSlot.value.id, payload);
      toast.success(res.data.message || 'تم تحديث فترة الحصة اليومية بنجاح.');
    }

    showDrawer.value = false;
    await fetchSlots();
  } catch (err: any) {
    const apiError = err?.response?.data;
    if (apiError?.errors) {
      formErrors.value = {
        ...formErrors.value,
        ...Object.fromEntries(
          Object.entries(apiError.errors).map(([k, v]: any) => [k, Array.isArray(v) ? v[0] : v]),
        ),
      };
    }
    const msg = apiError?.message || 'حدث خطأ أثناء حفظ فترة الحصة.';
    formErrorMessage.value = msg;
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
}

// Delete Handlers
function confirmDelete(slot: PeriodSlot) {
  slotToDelete.value = slot;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!slotToDelete.value) return;

  isDeleting.value = true;
  try {
    const res = await periodSlotsApi.deletePeriodSlot(slotToDelete.value.id);
    toast.success(res.data.message || 'تم حذف فترة الحصة بنجاح.');
    showDeleteModal.value = false;
    slotToDelete.value = null;
    await fetchSlots();
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      'لا يمكن حذف فترة الحصة لارتباطها بحصص مجدولة في الجداول الأسبوعية (Foreign Key Restrict).';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

// Quick Metrics / Stats (8. KPI & Metrics - Taqniya Design System)
const stats = computed(() => {
  const total = slots.value.length;
  const classCount = slots.value.filter((s) => s.is_break === 0).length;
  const breakCount = slots.value.filter((s) => s.is_break === 1).length;
  const classPercentage = total > 0 ? Math.round((classCount / total) * 100) : 0;
  const breakPercentage = total > 0 ? Math.round((breakCount / total) * 100) : 0;

  let totalMinutes = 0;
  slots.value.forEach((s) => {
    if (s.start_time && s.end_time) {
      const [h1, m1] = s.start_time.split(':').map(Number);
      const [h2, m2] = s.end_time.split(':').map(Number);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      if (diff > 0) totalMinutes += diff;
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const durationText = hours > 0 ? `${hours} س و ${mins} د` : `${mins} دقيقة`;

  return { total, classCount, breakCount, classPercentage, breakPercentage, durationText };
});

onMounted(() => {
  fetchSlots();
});

watch([filterType, sortBy, sortOrder], () => {
  currentPage.value = 1;
  fetchSlots();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card (Matching the Taqniya Reference Design System) -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        
        <!-- 1. Card Header: Title on Right, Controls & Actions on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <!-- Title & Subtitle with Taqniya Brand Accent -->
          <div>
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                فترات وتوقيتات الحصص اليومية
              </h2>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              إدارة فترات اليوم المدرسي، مواعيد الحصص والفسح، والمخطط الزمني التفاعلي
            </p>
          </div>

          <!-- Controls: Add Button + Search Input + Filter Pills -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Period Button -->
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>إضافة فترة جديدة</span>
            </button>

            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-60">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                @input="onSearchInput"
                type="text"
                placeholder="بحث في فترات الحصص..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Filter Pills -->
            <div class="flex items-center gap-1.5 p-1 rounded-full border border-bx-border bg-transparent">
              <button
                @click="filterType = 'all'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="filterType === 'all' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                الكل
              </button>
              <button
                @click="filterType = 'class'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                :class="filterType === 'class' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <BookOpen class="w-3.5 h-3.5" />
                <span>حصص</span>
              </button>
              <button
                @click="filterType = 'break'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                :class="filterType === 'break' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <Coffee class="w-3.5 h-3.5" />
                <span>فترات استراحة</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. مؤشرات الأداء والبطاقات (8. KPI & Metrics - Exact Framework Section 8 Standard) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
          <TaqniyaKpiCard
            title="إجمالي فترات اليوم"
            :value="stats.total"
            :icon="Zap"
            variant="primary"
            badge-text="اليوم المدرسي"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
            :progress="100"
          />

          <TaqniyaKpiCard
            title="الحصص التعليمية"
            :value="`${stats.classCount} حصص`"
            :icon="CheckCircle2"
            variant="emerald"
            :badge-text="`${stats.classPercentage}%`"
            :progress="stats.classPercentage"
          />

          <TaqniyaKpiCard
            title="فترات الاستراحة"
            :value="`${stats.breakCount} استراحة`"
            :icon="Clock"
            variant="amber"
            badge-text="فسحة 30 د"
            :progress="stats.breakPercentage"
          />

          <TaqniyaKpiCard
            title="إجمالي زمن اليوم المدرسي"
            :value="stats.durationText"
            :icon="Star"
            variant="primary"
            badge-text="توقيت معتمد"
            :progress="100"
          />
        </div>

        <!-- 3. Visual Daily Timeline (Feature Component: PeriodSlotsTimeline) -->
        <PeriodSlotsTimeline :slots="slots" />

        <!-- 4. Shared Table Component: TaqniyaTable -->
        <div class="space-y-3">
          <!-- Error State Display when server fetch fails -->
          <div v-if="errorMsg" class="py-14 text-center space-y-3 p-8 rounded-2xl border border-bx-border bg-bx-surface">
            <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle class="w-6 h-6" />
            </div>
            <h3 class="text-sm font-bold text-bx-title">حدث خطأ أثناء تحميل البيانات</h3>
            <p class="text-xs text-bx-muted max-w-sm mx-auto">{{ errorMsg }}</p>
            <button
              @click="fetchSlots"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>

          <!-- TaqniyaTable Instance -->
          <TaqniyaTable
            v-else
            :columns="columns"
            :items="slots"
            :is-loading="loading"
            empty-title="لا توجد فترات حصص مسجلة"
            empty-subtitle="لم يتم تعريف فترات وتوقيتات الحصص اليومية بعد، ابدأ بضبط فترات اليوم المدرسي."
            :empty-icon="Clock"
            loading-text="جاري تحميل فترات الحصص اليومية..."
          >
            <!-- Slot Number Cell -->
            <template #cell-slot_number="{ item }">
              <span
                class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono"
                :class="[
                  item.is_break === 1
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-purple-100 text-bx-primary dark:bg-purple-900/40 dark:text-purple-300',
                ]"
              >
                {{ item.slot_number }}
              </span>
            </template>

            <!-- Name Cell -->
            <template #cell-name="{ item }">
              <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight group-hover:text-bx-primary transition-colors">
                {{ item.name }}
              </span>
            </template>

            <!-- Start Time Cell -->
            <template #cell-start_time="{ item }">
              <span class="font-mono font-bold text-bx-muted whitespace-nowrap">
                {{ item.start_time.substring(0, 5) }}
              </span>
            </template>

            <!-- End Time Cell -->
            <template #cell-end_time="{ item }">
              <span class="font-mono font-bold text-bx-muted whitespace-nowrap">
                {{ item.end_time.substring(0, 5) }}
              </span>
            </template>

            <!-- Duration Cell -->
            <template #cell-duration="{ item }">
              <span class="px-2.5 py-0.5 rounded-full bg-purple-500/[0.06] dark:bg-white/[0.05] border border-bx-border text-[11px] font-mono font-bold whitespace-nowrap">
                {{ calculateDuration(item.start_time, item.end_time) }}
              </span>
            </template>

            <!-- Type / Break Cell -->
            <template #cell-is_break="{ item }">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap"
                :class="[
                  item.is_break === 1
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:bg-amber-950/30'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/30',
                ]"
              >
                <Coffee v-if="item.is_break === 1" class="w-3 h-3" />
                <BookOpen v-else class="w-3 h-3" />
                <span>{{ item.is_break === 1 ? 'فسحة / استراحة' : 'حصة دراسية' }}</span>
              </span>
            </template>

            <!-- Action Buttons Cell -->
            <template #cell-actions="{ item }">
              <div class="flex items-center justify-center gap-1.5">
                <!-- Edit Button -->
                <button
                  @click="openEditDrawer(item)"
                  class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  title="تعديل فترة الحصة"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>

                <!-- Delete Button -->
                <button
                  @click="confirmDelete(item)"
                  class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  title="حذف فترة الحصة"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </template>
          </TaqniyaTable>

          <!-- 5. Shared Pagination Component: TaqniyaPagination -->
          <TaqniyaPagination
            :current-page="currentPage"
            :total-pages="meta.last_page"
            :total="meta.total"
            :is-loading="loading"
            item-name="فترة"
            @page-change="onPageChange"
          />
        </div>
      </div>

      <!-- 6. Slide-Over Drawer with Feature Component Form -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        :title="drawerMode === 'create' ? 'إضافة فترة حصة يومية' : 'تعديل فترة الحصة اليومية'"
        :subtitle="drawerMode === 'create' ? 'تسجيل فترة حصة أو استراحة جديدة مع ضبط التوقيت والتسلسل اليومي' : 'تحديث مسمى وتوقيتات الحصة ونوعها في جدول اليوم المدرسي'"
        :icon="Clock"
        max-width="max-w-[540px]"
        @close="showDrawer = false"
      >
        <PeriodSlotDrawerForm
          :mode="drawerMode"
          :form-data="formData"
          :form-errors="formErrors"
          :form-error-message="formErrorMessage"
          :is-submitting="isSubmitting"
          @submit="handleSubmit"
          @cancel="showDrawer = false"
        />

        <!-- Fixed Footer Template for TaqniyaDrawer -->
        <template #footer>
          <button
            type="button"
            @click="showDrawer = false"
            class="px-5 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="slotForm"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'جاري الحفظ...' : drawerMode === 'create' ? 'حفظ فترة الحصة' : 'تحديث البيانات' }}</span>
          </button>
        </template>
      </TaqniyaDrawer>

      <!-- 7. Shared Confirmation Modal: TaqniyaModal -->
      <TaqniyaModal
        :is-open="showDeleteModal && !!slotToDelete"
        title="تأكيد حذف فترة الحصة"
        max-width="md"
        @close="showDeleteModal = false"
      >
        <template #icon>
          <div class="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600">
            <AlertTriangle class="w-5 h-5" />
          </div>
        </template>

        <div class="space-y-3 text-center sm:text-start" dir="rtl">
          <p class="text-xs text-bx-muted leading-relaxed">
            هل أنت متأكد من رغبتك في حذف فترة:
            <span class="font-bold text-bx-title">"{{ slotToDelete?.name }}"</span>؟
          </p>
          <p class="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/[0.08] p-3 rounded-2xl border border-amber-300/50 dark:border-amber-400/20 leading-normal">
            ⚠️ تنبيه أمان: سيتم حظر الحذف تلقائياً برمز 409 Conflict في حال ارتباط هذه الفترة بأي حصص مجدولة في الجداول الأسبوعية.
          </p>
        </div>

        <template #footer>
          <div class="flex items-center gap-3" dir="rtl">
            <button
              :disabled="isDeleting"
              @click="handleDelete"
              class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
              <span>نعم، حذف الفترة</span>
            </button>
            <button
              :disabled="isDeleting"
              @click="showDeleteModal = false"
              class="flex-1 px-5 py-2.5 rounded-full border border-bx-border text-bx-muted hover:text-bx-title text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </template>
      </TaqniyaModal>
    </div>
  </TaqniyaErrorBoundary>
</template>
