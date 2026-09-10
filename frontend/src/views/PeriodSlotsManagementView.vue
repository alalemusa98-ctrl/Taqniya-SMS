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
  Calendar,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
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

// 5. Async Data Fetching & Request Deduplication (async_data_fetching & request_deduplication)
async function fetchSlots() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  errorMsg.value = null;

  try {
    const isBreakParam =
      filterType.value === 'break' ? 1 : filterType.value === 'class' ? 0 : undefined;

    const res = await periodSlotsApi.getPeriodSlots(
      {
        search: search.value.trim() || undefined,
        is_break: isBreakParam,
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        page: currentPage.value,
        per_page: meta.value.per_page,
      },
      activeAbortController.signal,
    );

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

// 6. Debouncing & Throttling (debouncing_throttling)
let debounceTimer: any = null;
function onSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchSlots();
  }, 350);
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
      'لا يمكن حذف فترة الحصة لارتباطها بحصص مجدولة في الجداول الأسبوعية.';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

// Quick Metrics / Stats Ribbon
const stats = computed(() => {
  const total = slots.value.length;
  const classCount = slots.value.filter((s) => s.is_break === 0).length;
  const breakCount = slots.value.filter((s) => s.is_break === 1).length;

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

  return { total, classCount, breakCount, durationText };
});

// Chronological timeline slots
const sortedTimelineSlots = computed(() => {
  return [...slots.value].sort((a, b) => a.slot_number - b.slot_number);
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
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- Unified Container Card (Matching the Taqniya Reference Design System) -->
      <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
        
        <!-- 1. Card Header: Title on Right, Controls & Actions on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <!-- Title & Subtitle -->
          <div>
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-400/40 flex items-center justify-center text-bx-primary dark:text-purple-300 font-bold">
                <Clock class="w-5 h-5" />
              </div>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                فترات وتوقيتات الحصص اليومية
              </h2>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1.5 ms-11">
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
                class="w-full pr-10 pl-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Filter Pills -->
            <div class="flex items-center gap-1 p-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent">
              <button
                @click="filterType = 'all'"
                class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="filterType === 'all' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                الكل
              </button>
              <button
                @click="filterType = 'class'"
                class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                :class="filterType === 'class' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <BookOpen class="w-3 h-3" />
                <span>حصص دراسية</span>
              </button>
              <button
                @click="filterType = 'break'"
                class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                :class="filterType === 'break' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <Coffee class="w-3 h-3" />
                <span>فترات الاستراحة</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Quick Metrics Banner (Stats Ribbon - Matching Taqniya Standard) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6">
          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-purple-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Clock class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">إجمالي الفترات</span>
              <span class="text-base font-black font-display text-bx-title font-mono">{{ stats.total }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-blue-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">الحصص التعليمية</span>
              <span class="text-base font-black font-display text-blue-600 dark:text-blue-400 font-mono">{{ stats.classCount }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-amber-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Coffee class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">فترات الاستراحة</span>
              <span class="text-base font-black font-display text-amber-600 dark:text-amber-400 font-mono">{{ stats.breakCount }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-emerald-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">إجمالي زمن اليوم المدرسي</span>
              <span class="text-base font-black font-display text-emerald-600 dark:text-emerald-400 font-mono">{{ stats.durationText }}</span>
            </div>
          </div>
        </div>

        <!-- 3. Visual Daily Timeline (المخطط الزمني التفاعلي المتسق مع هوية Taqniya) -->
        <div v-if="sortedTimelineSlots.length > 0" class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.08] mb-6 space-y-3 shadow-2xs">
          <div class="flex items-center justify-between gap-2 border-b border-[#B4AED8]/30 dark:border-white/[0.06] pb-2.5">
            <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
              <Calendar class="w-4 h-4 text-bx-primary shrink-0" />
              <span>المخطط الزمني لليوم المدرسي</span>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
              <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
              <span>{{ sortedTimelineSlots.length }} فترات مجدولة بتسلسل اليوم</span>
            </div>
          </div>

          <div class="relative overflow-x-auto pb-1">
            <div class="flex items-stretch gap-3 min-w-max py-1">
              <div
                v-for="slot in sortedTimelineSlots"
                :key="slot.id"
                class="flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 min-w-[170px]"
                :class="[
                  slot.is_break === 1
                    ? 'bg-amber-500/[0.06] dark:bg-amber-500/[0.08] border-amber-300/80 dark:border-amber-400/40 text-amber-900 dark:text-amber-200'
                    : 'bg-purple-500/[0.04] dark:bg-purple-500/[0.08] border-purple-300/70 dark:border-purple-400/30 text-bx-title',
                ]"
              >
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono"
                    :class="[
                      slot.is_break === 1
                        ? 'bg-amber-500 text-white'
                        : 'bg-bx-primary text-white',
                    ]"
                  >
                    {{ slot.slot_number }}
                  </span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    :class="[
                      slot.is_break === 1
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
                        : 'bg-purple-100 dark:bg-purple-900/50 text-bx-primary dark:text-purple-300',
                    ]"
                  >
                    {{ slot.is_break === 1 ? 'فسحة / استراحة' : 'حصة دراسية' }}
                  </span>
                </div>

                <div class="font-black text-xs text-bx-title font-display mb-2 truncate" :title="slot.name">
                  {{ slot.name }}
                </div>

                <div class="flex items-center justify-between text-[11px] text-bx-muted font-mono pt-2 border-t border-[#B4AED8]/30 dark:border-white/[0.06]">
                  <span>{{ slot.start_time.substring(0, 5) }}</span>
                  <span class="text-[10px] text-bx-muted/60">←</span>
                  <span>{{ slot.end_time.substring(0, 5) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Table & UI States -->
        <div class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
          <!-- Loading State -->
          <div v-if="loading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
            <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
            <span class="text-xs font-bold">جاري تحميل فترات الحصص اليومية...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="errorMsg" class="py-14 text-center space-y-3 p-8">
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

          <!-- Empty State -->
          <div v-else-if="slots.length === 0" class="py-14 text-center space-y-3 p-8">
            <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-bx-primary flex items-center justify-center mx-auto">
              <Clock class="w-6 h-6" />
            </div>
            <h3 class="text-sm font-bold text-bx-title">لا توجد فترات حصص مسجلة</h3>
            <p class="text-xs text-bx-muted max-w-sm mx-auto">
              لم يتم تعريف فترات وتوقيتات الحصص اليومية بعد، ابدأ بضبط فترات اليوم المدرسي.
            </p>
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ إضافة أول فترة حصة</span>
            </button>
          </div>

          <!-- Success State: Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-start border-collapse">
              <thead>
                <tr class="bg-purple-500/[0.04] dark:bg-white/[0.03] text-bx-title text-xs font-bold border-b border-[#B4AED8]/60 dark:border-white/10">
                  <th class="py-3.5 px-4 text-start font-display"># الرقم</th>
                  <th class="py-3.5 px-4 text-start font-display">مسمى الحصة / الفترة</th>
                  <th class="py-3.5 px-4 text-start font-display">وقت البداية</th>
                  <th class="py-3.5 px-4 text-start font-display">وقت النهاية</th>
                  <th class="py-3.5 px-4 text-start font-display">المدة الزمنية</th>
                  <th class="py-3.5 px-4 text-start font-display">نوع الفترة</th>
                  <th class="py-3.5 px-4 text-center font-display">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#B4AED8]/20 dark:divide-white/[0.04] text-xs font-medium text-bx-title">
                <tr
                  v-for="slot in slots"
                  :key="slot.id"
                  class="hover:bg-[var(--bx-row-hover)] transition-colors duration-150"
                >
                  <!-- Slot Number -->
                  <td class="py-3.5 px-4 font-mono font-bold">
                    <span
                      class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs"
                      :class="[
                        slot.is_break === 1
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-purple-100 text-bx-primary dark:bg-purple-900/40 dark:text-purple-300',
                      ]"
                    >
                      {{ slot.slot_number }}
                    </span>
                  </td>

                  <!-- Name -->
                  <td class="py-3.5 px-4 font-bold text-bx-title">
                    {{ slot.name }}
                  </td>

                  <!-- Start Time -->
                  <td class="py-3.5 px-4 font-mono text-bx-muted">
                    {{ slot.start_time.substring(0, 5) }}
                  </td>

                  <!-- End Time -->
                  <td class="py-3.5 px-4 font-mono text-bx-muted">
                    {{ slot.end_time.substring(0, 5) }}
                  </td>

                  <!-- Duration -->
                  <td class="py-3.5 px-4 text-bx-muted font-mono font-semibold">
                    {{ calculateDuration(slot.start_time, slot.end_time) }}
                  </td>

                  <!-- Type -->
                  <td class="py-3.5 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      :class="[
                        slot.is_break === 1
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20',
                      ]"
                    >
                      <Coffee v-if="slot.is_break === 1" class="w-3 h-3" />
                      <BookOpen v-else class="w-3 h-3" />
                      <span>{{ slot.is_break === 1 ? 'فسحة / استراحة' : 'حصة دراسية' }}</span>
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        @click="openEditDrawer(slot)"
                        title="تعديل"
                        class="p-1.5 rounded-lg text-bx-muted hover:text-bx-primary hover:bg-purple-500/10 transition-colors cursor-pointer"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click="confirmDelete(slot)"
                        title="حذف"
                        class="p-1.5 rounded-lg text-bx-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination Footer (Matching Taqniya Reference) -->
            <div
              v-if="meta.last_page > 1"
              class="flex items-center justify-between px-6 py-4 border-t border-[#B4AED8]/40 dark:border-white/[0.06] bg-purple-500/[0.02]"
            >
              <span class="text-xs text-bx-muted font-medium">
                عرض {{ slots.length }} من إجمالي {{ meta.total }} فترة
              </span>
              <div class="flex items-center gap-2">
                <button
                  :disabled="currentPage <= 1"
                  @click="currentPage--; fetchSlots();"
                  class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title hover:bg-[var(--bx-row-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight class="w-3.5 h-3.5" />
                </button>
                <span class="text-xs font-bold text-bx-title font-mono px-2">
                  {{ meta.current_page }} / {{ meta.last_page }}
                </span>
                <button
                  :disabled="currentPage >= meta.last_page"
                  @click="currentPage++; fetchSlots();"
                  class="p-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title hover:bg-[var(--bx-row-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Slide-Over Drawer (TaqniyaDrawer Standard) -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        :title="drawerMode === 'create' ? 'إضافة فترة حصة يومية' : 'تعديل فترة الحصة'"
        @close="showDrawer = false"
      >
        <form @submit.prevent="handleSubmit" class="space-y-5 p-6" dir="rtl">
          <!-- Error Alert inside Drawer -->
          <div
            v-if="formErrorMessage"
            class="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Name -->
          <div>
            <label class="block text-[11px] font-bold text-bx-title mb-1.5">
              مسمى الحصة / الفترة <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="مثال: الحصة الأولى، الفسحة..."
              class="w-full px-4 py-2.5 text-xs rounded-2xl border bg-transparent text-bx-title focus:outline-none focus:border-bx-primary transition-all"
              :class="[formErrors.name ? 'border-red-400 bg-red-50/20' : 'border-[#B4AED8] dark:border-white/[0.12]']"
            />
            <p v-if="formErrors.name" class="text-[11px] text-red-500 mt-1 font-bold">{{ formErrors.name }}</p>
          </div>

          <!-- Slot Number -->
          <div>
            <label class="block text-[11px] font-bold text-bx-title mb-1.5">
              الرقم التسلسلي للحصة <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="formData.slot_number"
              type="number"
              min="1"
              max="255"
              class="w-full px-4 py-2.5 text-xs rounded-2xl border bg-transparent text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
              :class="[formErrors.slot_number ? 'border-red-400 bg-red-50/20' : 'border-[#B4AED8] dark:border-white/[0.12]']"
            />
            <p v-if="formErrors.slot_number" class="text-[11px] text-red-500 mt-1 font-bold">{{ formErrors.slot_number }}</p>
          </div>

          <!-- Times Grid -->
          <div class="grid grid-cols-2 gap-3.5">
            <!-- Start Time -->
            <div>
              <label class="block text-[11px] font-bold text-bx-title mb-1.5">
                وقت البداية <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.start_time"
                type="time"
                class="w-full px-4 py-2.5 text-xs rounded-2xl border bg-transparent text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
                :class="[formErrors.start_time ? 'border-red-400 bg-red-50/20' : 'border-[#B4AED8] dark:border-white/[0.12]']"
              />
              <p v-if="formErrors.start_time" class="text-[11px] text-red-500 mt-1 font-bold">{{ formErrors.start_time }}</p>
            </div>

            <!-- End Time -->
            <div>
              <label class="block text-[11px] font-bold text-bx-title mb-1.5">
                وقت النهاية <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.end_time"
                type="time"
                class="w-full px-4 py-2.5 text-xs rounded-2xl border bg-transparent text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
                :class="[formErrors.end_time ? 'border-red-400 bg-red-50/20' : 'border-[#B4AED8] dark:border-white/[0.12]']"
              />
              <p v-if="formErrors.end_time" class="text-[11px] text-red-500 mt-1 font-bold">{{ formErrors.end_time }}</p>
            </div>
          </div>

          <!-- Duration Notice -->
          <div
            v-if="formData.start_time && formData.end_time && formData.start_time < formData.end_time"
            class="p-3 rounded-2xl bg-purple-500/[0.04] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.08] text-xs text-bx-title flex items-center justify-between"
          >
            <span class="text-bx-muted font-bold">المدة المحسوبة للفترة:</span>
            <span class="font-black font-mono text-bx-primary">{{ calculateDuration(formData.start_time, formData.end_time) }}</span>
          </div>

          <!-- Is Break Toggle -->
          <div class="flex items-center justify-between p-4 rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.08] bg-purple-500/[0.02]">
            <div>
              <div class="text-xs font-bold text-bx-title">فترة استراحة / فسحة</div>
              <p class="text-[11px] text-bx-muted mt-0.5">تمييز هذه الفترة كاستراحة لا تدرج فيها حصص دراسية</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="formData.is_break" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <!-- Submit Buttons -->
          <div class="pt-4 flex items-center gap-3 border-t border-[#B4AED8]/30 dark:border-white/[0.06]">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ drawerMode === 'create' ? 'حفظ الفترة' : 'تحديث الفترة' }}</span>
            </button>
            <button
              type="button"
              @click="showDrawer = false"
              class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-title text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </TaqniyaDrawer>

      <!-- 6. Confirmation Modal (حذف فترة حصة) -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        dir="rtl"
      >
        <div class="bg-[var(--bx-surface-solid)] rounded-3xl p-6 sm:p-7 border border-[#B4AED8] dark:border-white/[0.12] max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 mx-auto">
            <AlertTriangle class="w-6 h-6" />
          </div>

          <div class="text-center">
            <h3 class="text-base font-black font-display text-bx-title">تأكيد حذف فترة الحصة</h3>
            <p class="text-xs text-bx-muted mt-1.5 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف فترة:
              <span class="font-bold text-bx-title">"{{ slotToDelete?.name }}"</span>؟
            </p>
            <p class="text-[11px] text-amber-700 dark:text-amber-300 mt-3 bg-amber-500/[0.08] p-3 rounded-2xl border border-amber-300/50 dark:border-amber-400/20 leading-normal">
              ⚠️ تنبيه أمان: سيتم حظر الحذف تلقائياً برمز 409 Conflict في حال ارتباط هذه الفترة بأي جدول أسبوعي للشعب.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2">
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
              class="flex-1 px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-title text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
