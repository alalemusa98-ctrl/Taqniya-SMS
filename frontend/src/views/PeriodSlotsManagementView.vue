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
  Save,
  Hash,
  Zap,
  TrendingUp,
  CheckCircle2,
  Star,
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

// 5. Async Data Fetching & Request Deduplication
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

// 6. Debouncing & Throttling
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
          <!-- Card 1: Zap Icon with Trending Badge (Section 8 Standard) -->
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

          <!-- Card 2: CheckCircle2 Icon with Emerald Border (Section 8 Standard) -->
          <TaqniyaKpiCard
            title="الحصص التعليمية"
            :value="`${stats.classCount} حصص`"
            :icon="CheckCircle2"
            variant="emerald"
            :badge-text="`${stats.classPercentage}%`"
            :progress="stats.classPercentage"
          />

          <!-- Card 3: Clock Icon with Amber Border (Section 8 Standard) -->
          <TaqniyaKpiCard
            title="فترات الاستراحة"
            :value="`${stats.breakCount} استراحة`"
            :icon="Clock"
            variant="amber"
            badge-text="فسحة 30 د"
            :progress="stats.breakPercentage"
          />

          <!-- Card 4: Star Icon with Quality/Duration (Section 8 Standard) -->
          <TaqniyaKpiCard
            title="إجمالي زمن اليوم المدرسي"
            :value="stats.durationText"
            :icon="Star"
            variant="primary"
            badge-text="توقيت معتمد"
            :progress="100"
          />
        </div>

        <!-- 3. Visual Daily Timeline (المخطط الزمني التفاعلي) -->
        <div v-if="sortedTimelineSlots.length > 0" class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-bx-border mb-6 space-y-3 shadow-2xs">
          <div class="flex items-center justify-between gap-2 border-b border-bx-divider pb-2.5">
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

                <div class="flex items-center justify-between text-[11px] text-bx-muted font-mono pt-2 border-t border-bx-divider">
                  <span>{{ slot.start_time.substring(0, 5) }}</span>
                  <span class="text-[10px] text-bx-muted/60">←</span>
                  <span>{{ slot.end_time.substring(0, 5) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Table & UI States (With Crisp Dividers Matching Students/Teachers Views) -->
        <div class="rounded-2xl border border-bx-border overflow-hidden bg-bx-surface shadow-xs">
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

          <!-- Success State: Table with Crisp Column Dividers and Standard Taqniya Tokens -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-start border-collapse">
              <thead>
                <tr class="bg-bx-table-header border-b border-bx-border text-bx-muted text-xs">
                  <th class="py-3 px-4 font-bold text-start w-16 font-['Alexandria',sans-serif] border-e border-bx-divider"># الرقم</th>
                  <th class="py-3 px-4 font-bold text-start border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                      <span>مسمى الحصة / الفترة</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[110px] border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <Clock class="w-3.5 h-3.5 text-bx-primary" />
                      <span>وقت البداية</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[110px] border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <Clock class="w-3.5 h-3.5 text-bx-primary" />
                      <span>وقت النهاية</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[110px] border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <Sparkles class="w-3.5 h-3.5 text-bx-primary" />
                      <span>المدة المحسوبة</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-center min-w-[130px] border-e border-bx-divider">
                    <div class="flex items-center justify-center gap-1.5">
                      <Coffee class="w-3.5 h-3.5 text-bx-primary" />
                      <span>نوع الفترة</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-center w-28 last:border-e-0">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-bx-divider text-xs font-medium text-bx-title">
                <tr
                  v-for="slot in slots"
                  :key="slot.id"
                  class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                >
                  <!-- Slot Number -->
                  <td class="py-3 px-4 font-mono font-bold whitespace-nowrap border-e border-bx-divider">
                    <span
                      class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono"
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
                  <td class="py-3 px-4 whitespace-nowrap border-e border-bx-divider">
                    <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight group-hover:text-bx-primary transition-colors">
                      {{ slot.name }}
                    </span>
                  </td>

                  <!-- Start Time -->
                  <td class="py-3 px-4 font-mono font-bold text-bx-muted whitespace-nowrap border-e border-bx-divider text-start">
                    {{ slot.start_time.substring(0, 5) }}
                  </td>

                  <!-- End Time -->
                  <td class="py-3 px-4 font-mono font-bold text-bx-muted whitespace-nowrap border-e border-bx-divider text-start">
                    {{ slot.end_time.substring(0, 5) }}
                  </td>

                  <!-- Duration -->
                  <td class="py-3 px-4 font-mono font-bold text-bx-title whitespace-nowrap border-e border-bx-divider">
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-500/[0.06] dark:bg-white/[0.05] border border-bx-border text-[11px]">
                      {{ calculateDuration(slot.start_time, slot.end_time) }}
                    </span>
                  </td>

                  <!-- Type -->
                  <td class="py-3 px-4 text-center whitespace-nowrap border-e border-bx-divider">
                    <span
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
                      :class="[
                        slot.is_break === 1
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:bg-amber-950/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/30',
                      ]"
                    >
                      <Coffee v-if="slot.is_break === 1" class="w-3 h-3" />
                      <BookOpen v-else class="w-3 h-3" />
                      <span>{{ slot.is_break === 1 ? 'فسحة / استراحة' : 'حصة دراسية' }}</span>
                    </span>
                  </td>

                  <!-- Actions: Uniform Circular Icon Buttons Matching Taqniya Standard -->
                  <td class="py-3 px-4 text-center whitespace-nowrap last:border-e-0">
                    <div class="flex items-center justify-center gap-1.5">
                      <!-- Edit Button -->
                      <button
                        @click="openEditDrawer(slot)"
                        class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="تعديل فترة الحصة"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>

                      <!-- Delete Button -->
                      <button
                        @click="confirmDelete(slot)"
                        class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="حذف فترة الحصة"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination Footer (Matching Students/Teachers Reference) -->
            <div
              v-if="meta.last_page > 1"
              class="p-4 border-t border-bx-border bg-bx-table-header flex items-center justify-between gap-4"
            >
              <div class="text-xs text-bx-muted">
                الصفحة <span class="font-bold text-bx-title">{{ meta.current_page }}</span> من <span class="font-bold text-bx-title">{{ meta.last_page }}</span> (إجمالي <span class="font-mono font-bold">{{ meta.total }}</span> فترة)
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  :disabled="currentPage <= 1"
                  @click="currentPage--; fetchSlots();"
                  class="p-1.5 rounded-lg border border-bx-border hover:bg-bx-pill disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
                <button
                  v-for="p in meta.last_page"
                  :key="p"
                  @click="currentPage = p; fetchSlots();"
                  class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  :class="p === currentPage ? 'bg-bx-primary text-white shadow-sm' : 'hover:bg-bx-pill text-bx-muted'"
                >
                  {{ p }}
                </button>
                <button
                  :disabled="currentPage >= meta.last_page"
                  @click="currentPage++; fetchSlots();"
                  class="p-1.5 rounded-lg border border-bx-border hover:bg-bx-pill disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Slide-Over Drawer (TaqniyaDrawer Standard with Header Icon, Subtitle, and Fixed Footer Slot) -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        :title="drawerMode === 'create' ? 'إضافة فترة حصة يومية' : 'تعديل فترة الحصة اليومية'"
        :subtitle="drawerMode === 'create' ? 'تسجيل فترة حصة أو استراحة جديدة مع ضبط التوقيت والتسلسل اليومي' : 'تحديث مسمى وتوقيتات الحصة ونوعها في جدول اليوم المدرسي'"
        :icon="Clock"
        max-width="max-w-[540px]"
        @close="showDrawer = false"
      >
        <form id="slotForm" @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Error Alert inside Drawer -->
          <div
            v-if="formErrorMessage"
            class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Section 1: Basic Period Info Card -->
          <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
            <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
              <BookOpen class="w-4 h-4 text-bx-primary shrink-0" />
              <h4 class="text-xs font-black text-bx-title">البيانات الأساسية للحصة</h4>
            </div>

            <!-- Name -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-bx-title block">
                مسمى الحصة / الفترة <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                required
                maxlength="50"
                placeholder="مثال: الحصة الأولى، الفسحة الكبرى..."
                class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
                :class="[formErrors.name ? 'border-red-400 bg-red-50/20' : '']"
              />
              <p v-if="formErrors.name" class="text-[11px] text-red-500 font-medium">
                {{ formErrors.name }}
              </p>
            </div>

            <!-- Slot Number -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-bx-title">
                <Hash class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <label class="text-xs font-bold">الرقم التسلسلي في اليوم <span class="text-red-500">*</span></label>
              </div>
              <input
                v-model.number="formData.slot_number"
                type="number"
                min="1"
                max="255"
                required
                placeholder="1, 2, 3..."
                class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono font-medium"
                :class="[formErrors.slot_number ? 'border-red-400 bg-red-50/20' : '']"
              />
              <p v-if="formErrors.slot_number" class="text-[11px] text-red-500 font-medium">
                {{ formErrors.slot_number }}
              </p>
            </div>
          </div>

          <!-- Section 2: Times & Duration Card -->
          <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
            <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
              <Clock class="w-4 h-4 text-amber-500 shrink-0" />
              <h4 class="text-xs font-black text-bx-title">توقيت البداية والنهاية</h4>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Start Time -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-bx-title block">
                  وقت البداية <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.start_time"
                  type="time"
                  required
                  class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono font-medium text-center"
                  :class="[formErrors.start_time ? 'border-red-400 bg-red-50/20' : '']"
                />
                <p v-if="formErrors.start_time" class="text-[11px] text-red-500 font-medium">
                  {{ formErrors.start_time }}
                </p>
              </div>

              <!-- End Time -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-bx-title block">
                  وقت النهاية <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.end_time"
                  type="time"
                  required
                  class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono font-medium text-center"
                  :class="[formErrors.end_time ? 'border-red-400 bg-red-50/20' : '']"
                />
                <p v-if="formErrors.end_time" class="text-[11px] text-red-500 font-medium">
                  {{ formErrors.end_time }}
                </p>
              </div>
            </div>

            <!-- Duration Notice -->
            <div
              v-if="formData.start_time && formData.end_time && formData.start_time < formData.end_time"
              class="p-3 rounded-2xl bg-purple-500/[0.04] dark:bg-white/[0.02] border border-bx-border text-xs text-bx-title flex items-center justify-between"
            >
              <span class="text-bx-muted font-bold">المدة المحسوبة تلقائياً:</span>
              <span class="font-black font-mono text-bx-primary">{{ calculateDuration(formData.start_time, formData.end_time) }}</span>
            </div>
          </div>

          <!-- Section 3: Period Classification Card -->
          <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
            <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
              <Coffee class="w-4 h-4 text-purple-500 shrink-0" />
              <h4 class="text-xs font-black text-bx-title">تصنيف الفترة</h4>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-bx-title block">نوع الفترة التعليمية <span class="text-red-500">*</span></label>
              <div class="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  @click="formData.is_break = false"
                  class="py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  :class="!formData.is_break ? 'border-bx-primary bg-bx-primary/10 text-bx-primary shadow-xs' : 'border-bx-border text-bx-muted hover:text-bx-title'"
                >
                  <BookOpen class="w-3.5 h-3.5" />
                  <span>حصة دراسية</span>
                </button>
                <button
                  type="button"
                  @click="formData.is_break = true"
                  class="py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  :class="formData.is_break ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs' : 'border-bx-border text-bx-muted hover:text-bx-title'"
                >
                  <Coffee class="w-3.5 h-3.5" />
                  <span>فسحة / استراحة</span>
                </button>
              </div>
            </div>

            <p class="text-[11px] text-bx-muted leading-relaxed">
              💡 ملحوظة: فترات الاستراحة تُستثنى آلياً من إمكانية تسكين المواد والمناهج الدراسية عليها داخل الجدول الأسبوعي.
            </p>
          </div>
        </form>

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

      <!-- 6. Confirmation Modal (حذف فترة حصة - Using Teleport) -->
      <Teleport to="body">
        <div
          v-if="showDeleteModal && slotToDelete"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          dir="rtl"
        >
          <!-- Backdrop with click to close -->
          <div
            @click="showDeleteModal = false"
            class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          ></div>

          <!-- Dialog Box -->
          <div class="relative bg-bx-surface rounded-3xl p-6 sm:p-7 border border-bx-border max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle class="w-6 h-6" />
            </div>

            <div class="text-center">
              <h3 class="text-base font-black font-display text-bx-title">تأكيد حذف فترة الحصة</h3>
              <p class="text-xs text-bx-muted mt-1.5 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف فترة:
                <span class="font-bold text-bx-title">"{{ slotToDelete.name }}"</span>؟
              </p>
              <p class="text-[11px] text-amber-700 dark:text-amber-300 mt-3 bg-amber-500/[0.08] p-3 rounded-2xl border border-amber-300/50 dark:border-amber-400/20 leading-normal">
                ⚠️ تنبيه أمان: سيتم حظر الحذف تلقائياً برمز 409 Conflict في حال ارتباط هذه الفترة بأي حصص مجدولة في الجداول الأسبوعية.
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
                class="flex-1 px-5 py-2.5 rounded-full border border-bx-border text-bx-muted hover:text-bx-title text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </TaqniyaErrorBoundary>
</template>
