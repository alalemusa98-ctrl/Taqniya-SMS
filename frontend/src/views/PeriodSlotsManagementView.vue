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

// Component Lazy Loading
const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));

const toast = useToast();

// State
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

// Filters
const search = ref('');
const filterType = ref<'all' | 'class' | 'break'>('all');
const sortBy = ref<'slot_number' | 'start_time'>('slot_number');
const sortOrder = ref<'asc' | 'desc'>('asc');
const currentPage = ref(1);

// Abort Controller for Request Cancellation
let activeAbortController: AbortController | null = null;

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeSlot = ref<PeriodSlot | null>(null);

// Form State
const formData = ref({
  name: '',
  slot_number: 1,
  start_time: '08:00',
  end_time: '08:45',
  is_break: false,
});
const formErrors = ref<Record<string, string>>({});

// Delete Modal State
const showDeleteModal = ref(false);
const slotToDelete = ref<PeriodSlot | null>(null);
const isDeleting = ref(false);

// Calculate Duration in Minutes
function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const total1 = h1 * 60 + m1;
  const total2 = h2 * 60 + m2;
  const diff = total2 - total1;
  return diff > 0 ? `${diff} دقيقة` : '-';
}

// Fetch Slots
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

    slots.value = res.data.data;
    meta.value = res.data.meta;
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

// Search debounce
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

  // Auto-calculate next slot number
  const nextSlotNumber =
    slots.value.length > 0 ? Math.max(...slots.value.map((s) => s.slot_number)) + 1 : 1;

  formData.value = {
    name: `الحصة ${nextSlotNumber}`,
    slot_number: nextSlotNumber,
    start_time: '08:00',
    end_time: '08:45',
    is_break: false,
  };
  formErrors.value = {};
  showDrawer.value = true;
}

function openEditDrawer(slot: PeriodSlot) {
  drawerMode.value = 'edit';
  activeSlot.value = slot;

  formData.value = {
    name: slot.name,
    slot_number: slot.slot_number,
    start_time: slot.start_time.substring(0, 5),
    end_time: slot.end_time.substring(0, 5),
    is_break: slot.is_break === 1,
  };
  formErrors.value = {};
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
    errors.slot_number = 'الرقم التسلسلي للحصة يجب أن يكون رقماً موجباً.';
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
    toast.error(apiError?.message || 'حدث خطأ أثناء حفظ فترة الحصة.');
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

// Sorted list for Timeline View
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
      <!-- 1. Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-sm backdrop-blur-md">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Clock class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">فترات وتوقيتات الحصص اليومية</h1>
              <p class="text-sm text-slate-500 mt-0.5">ضبط المخطط الزمني ومواعيد الحصص والفسح لليوم المدرسي</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            <Plus class="w-4 h-4" />
            <span>إضافة فترة جديدة</span>
          </button>
        </div>
      </div>

      <!-- 2. Visual Daily Timeline (المخطط الزمني التفاعلي لليوم المدرسي) -->
      <div v-if="sortedTimelineSlots.length > 0" class="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-indigo-600" />
            <h2 class="text-base font-bold text-slate-900">المخطط الزمني لليوم المدرسي</h2>
          </div>
          <span class="text-xs text-slate-500 font-medium">إجمالي الفترات: {{ sortedTimelineSlots.length }}</span>
        </div>

        <div class="relative overflow-x-auto pb-2">
          <div class="flex items-stretch gap-3 min-w-max">
            <div
              v-for="slot in sortedTimelineSlots"
              :key="slot.id"
              class="relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 min-w-[170px]"
              :class="[
                slot.is_break === 1
                  ? 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                  : 'bg-indigo-50/40 border-indigo-100 text-slate-900',
              ]"
            >
              <div class="flex items-center justify-between gap-2 mb-2">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                  :class="[
                    slot.is_break === 1 ? 'bg-amber-200/80 text-amber-800' : 'bg-indigo-600 text-white',
                  ]"
                >
                  {{ slot.slot_number }}
                </span>
                <span
                  class="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                  :class="[
                    slot.is_break === 1
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100/70 text-indigo-700',
                  ]"
                >
                  {{ slot.is_break === 1 ? 'فسحة / استراحة' : 'حصة دراسية' }}
                </span>
              </div>

              <div class="font-bold text-sm mb-2 truncate" :title="slot.name">{{ slot.name }}</div>

              <div class="flex items-center justify-between text-xs text-slate-500 font-mono mt-auto pt-2 border-t border-slate-200/60">
                <span>{{ slot.start_time.substring(0, 5) }}</span>
                <span class="text-[10px] text-slate-400">←</span>
                <span>{{ slot.end_time.substring(0, 5) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Filters & Search Section -->
      <div class="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="search"
            @input="onSearchInput"
            type="text"
            placeholder="بحث بمسمى الحصة..."
            class="w-full ps-10 pe-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center gap-2">
          <button
            @click="filterType = 'all'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            :class="[
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ]"
          >
            الكل
          </button>
          <button
            @click="filterType = 'class'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            :class="[
              filterType === 'class'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ]"
          >
            <BookOpen class="w-3.5 h-3.5" />
            <span>حصص دراسية</span>
          </button>
          <button
            @click="filterType = 'break'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            :class="[
              filterType === 'break'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ]"
          >
            <Coffee class="w-3.5 h-3.5" />
            <span>فترات الاستراحة</span>
          </button>
        </div>
      </div>

      <!-- 4. Table & UI States -->
      <div class="bg-surface rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <!-- Error State -->
        <div v-if="errorMsg" class="p-8 text-center">
          <AlertCircle class="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p class="text-sm text-slate-700 font-medium mb-4">{{ errorMsg }}</p>
          <button
            @click="fetchSlots"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="p-12 text-center">
          <Loader2 class="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p class="text-sm text-slate-500 font-medium">جاري تحميل فترات الحصص...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="slots.length === 0" class="p-12 text-center">
          <Clock class="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 class="text-base font-bold text-slate-800 mb-1">لا توجد فترات حصص</h3>
          <p class="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            لم يتم تعريف فترات وتوقيتات الحصص اليومية بعد، ابدأ بإضافة فترات اليوم المدرسي.
          </p>
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>+ إضافة أول فترة حصة</span>
          </button>
        </div>

        <!-- Success State: Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-start border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-bold tracking-wider">
                <th class="py-3.5 px-4 text-start">الرقم</th>
                <th class="py-3.5 px-4 text-start">مسمى الحصة / الفترة</th>
                <th class="py-3.5 px-4 text-start">وقت البداية</th>
                <th class="py-3.5 px-4 text-start">وقت النهاية</th>
                <th class="py-3.5 px-4 text-start">المدة الزمنية</th>
                <th class="py-3.5 px-4 text-start">النوع</th>
                <th class="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm text-slate-700">
              <tr
                v-for="slot in slots"
                :key="slot.id"
                class="hover:bg-slate-50/80 transition-colors duration-150"
              >
                <!-- Slot Number -->
                <td class="py-3.5 px-4 font-mono font-bold">
                  <span
                    class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs"
                    :class="[
                      slot.is_break === 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-700',
                    ]"
                  >
                    {{ slot.slot_number }}
                  </span>
                </td>

                <!-- Name -->
                <td class="py-3.5 px-4 font-semibold text-slate-900">
                  {{ slot.name }}
                </td>

                <!-- Start Time -->
                <td class="py-3.5 px-4 font-mono text-slate-600">
                  {{ slot.start_time.substring(0, 5) }}
                </td>

                <!-- End Time -->
                <td class="py-3.5 px-4 font-mono text-slate-600">
                  {{ slot.end_time.substring(0, 5) }}
                </td>

                <!-- Duration -->
                <td class="py-3.5 px-4 text-slate-500 font-medium">
                  {{ calculateDuration(slot.start_time, slot.end_time) }}
                </td>

                <!-- Type -->
                <td class="py-3.5 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    :class="[
                      slot.is_break === 1
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
                    ]"
                  >
                    <Coffee v-if="slot.is_break === 1" class="w-3 h-3" />
                    <BookOpen v-else class="w-3 h-3" />
                    <span>{{ slot.is_break === 1 ? 'فسحة / استراحة' : 'حصة دراسية' }}</span>
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-center">
                  <div class="inline-flex items-center gap-1">
                    <button
                      @click="openEditDrawer(slot)"
                      title="تعديل"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      @click="confirmDelete(slot)"
                      title="حذف"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Footer -->
          <div
            v-if="meta.last_page > 1"
            class="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 bg-slate-50/50"
          >
            <span class="text-xs text-slate-500">
              عرض {{ slots.length }} من إجمالي {{ meta.total }} فترة
            </span>
            <div class="flex items-center gap-2">
              <button
                :disabled="currentPage <= 1"
                @click="currentPage--; fetchSlots();"
                class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
              <span class="text-xs font-bold text-slate-700 font-mono px-2">
                {{ meta.current_page }} / {{ meta.last_page }}
              </span>
              <button
                :disabled="currentPage >= meta.last_page"
                @click="currentPage++; fetchSlots();"
                class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Slide-Over Drawer (إضافة / تعديل فترة حصة) -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        :title="drawerMode === 'create' ? 'إضافة فترة حصة يومية' : 'تعديل فترة الحصة'"
        @close="showDrawer = false"
      >
        <form @submit.prevent="handleSubmit" class="space-y-5 p-6" dir="rtl">
          <!-- Name -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">مسمى الحصة / الفترة <span class="text-red-500">*</span></label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="مثال: الحصة الأولى، الفسحة..."
              class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              :class="[formErrors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-indigo-500']"
            />
            <p v-if="formErrors.name" class="text-xs text-red-600 mt-1 font-medium">{{ formErrors.name }}</p>
          </div>

          <!-- Slot Number -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">الرقم التسلسلي للحصة <span class="text-red-500">*</span></label>
            <input
              v-model.number="formData.slot_number"
              type="number"
              min="1"
              max="255"
              class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              :class="[formErrors.slot_number ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-indigo-500']"
            />
            <p v-if="formErrors.slot_number" class="text-xs text-red-600 mt-1 font-medium">{{ formErrors.slot_number }}</p>
          </div>

          <!-- Times Grid -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Start Time -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">وقت البداية <span class="text-red-500">*</span></label>
              <input
                v-model="formData.start_time"
                type="time"
                class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                :class="[formErrors.start_time ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-indigo-500']"
              />
              <p v-if="formErrors.start_time" class="text-xs text-red-600 mt-1 font-medium">{{ formErrors.start_time }}</p>
            </div>

            <!-- End Time -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">وقت النهاية <span class="text-red-500">*</span></label>
              <input
                v-model="formData.end_time"
                type="time"
                class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                :class="[formErrors.end_time ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-indigo-500']"
              />
              <p v-if="formErrors.end_time" class="text-xs text-red-600 mt-1 font-medium">{{ formErrors.end_time }}</p>
            </div>
          </div>

          <!-- Duration Notice -->
          <div v-if="formData.start_time && formData.end_time && formData.start_time < formData.end_time" class="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-800 flex items-center justify-between">
            <span>المدة المحسوبة للحصة:</span>
            <span class="font-bold font-mono">{{ calculateDuration(formData.start_time, formData.end_time) }}</span>
          </div>

          <!-- Is Break Toggle -->
          <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <div class="text-sm font-bold text-slate-800">فترة استراحة / فسحة</div>
              <p class="text-xs text-slate-500 mt-0.5">تمييز هذه الفترة كاستراحة لا تدرج فيها حصص تعليمية</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="formData.is_break" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <!-- Submit Buttons -->
          <div class="pt-4 flex items-center gap-3">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ drawerMode === 'create' ? 'حفظ الفترة' : 'تحديث الفترة' }}</span>
            </button>
            <button
              type="button"
              @click="showDrawer = false"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </TaqniyaDrawer>

      <!-- 6. Confirmation Modal (حذف فترة حصة) -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        dir="rtl"
      >
        <div class="bg-surface rounded-2xl p-6 border border-slate-200 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div class="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
            <AlertTriangle class="w-6 h-6" />
          </div>

          <div class="text-center">
            <h3 class="text-lg font-bold text-slate-900">تأكيد حذف فترة الحصة</h3>
            <p class="text-sm text-slate-500 mt-1">
              هل أنت متأكد من حذف فترة:
              <span class="font-bold text-slate-800">"{{ slotToDelete?.name }}"</span>؟
            </p>
            <p class="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200/50">
              ⚠️ تنبيه: سيتم رفض الحذف في حال كانت الفترة مستخدمة في أي جدول أسبوعي للشعب.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              :disabled="isDeleting"
              @click="handleDelete"
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
              <span>نعم، حذف</span>
            </button>
            <button
              :disabled="isDeleting"
              @click="showDeleteModal = false"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
