<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Phone,
  BookOpen,
  Calendar,
  Lock,
  User,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Save,
  UserCheck,
  UserX,
} from 'lucide-vue-next';
import { teachersApi, type Teacher, type PaginationMeta } from '../api/teachers.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));

const toast = useToast();

// State
const teachers = ref<Teacher[]>([]);
const meta = ref<PaginationMeta>({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const loading = ref(false);
const isSubmitting = ref(false);

// Filters
const search = ref('');
const statusPill = ref<'all' | 'active' | 'inactive'>('all');
const activeSpecialization = ref<string>('all');
const currentPage = ref(1);

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'details' | 'create' | 'edit'>('create');
const activeTeacher = ref<Teacher | null>(null);

// Form State
const form = ref({
  full_name: '',
  phone: '',
  specialization: '',
  hire_date: '',
  password: '',
});
const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);
const datePickerInput = ref<HTMLInputElement | null>(null);

function openNativeDatePicker() {
  if (datePickerInput.value) {
    try {
      datePickerInput.value.showPicker();
    } catch {
      datePickerInput.value.focus();
    }
  }
}

function onNativeDatePicked(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target && target.value) {
    form.value.hire_date = target.value;
  }
}

// Delete Modal State
const showDeleteModal = ref(false);
const teacherToDelete = ref<Teacher | null>(null);
const isDeleting = ref(false);
const deleteErrorMessage = ref<string | null>(null);

// Fetch teachers from backend with Request Cancellation & Deduplication
async function fetchTeachers() {
  // Cancel any prior in-flight request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const res = await teachersApi.getTeachers(
      {
        search: search.value.trim() || undefined,
        specialization: activeSpecialization.value !== 'all' ? activeSpecialization.value : undefined,
        is_active: statusPill.value === 'active' ? 1 : statusPill.value === 'inactive' ? 0 : undefined,
        page: currentPage.value,
        per_page: 15,
        sort_by: 'id',
        sort_order: 'desc',
      },
      activeAbortController.signal,
    );
    teachers.value = res.data.data;
    meta.value = res.data.meta;
  } catch (err: any) {
    // If request was canceled by new search/filter, ignore error
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
      return;
    }
    const msg = err.response?.data?.message || 'تعذر تحميل سجلات الكادر التعليمي.';
    toast.error(msg);
  } finally {
    if (!activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
}


// Available specializations extracted dynamically from data
const availableSpecializations = computed(() => {
  const set = new Set<string>();
  teachers.value.forEach((t) => {
    if (t.specialization) set.add(t.specialization.trim());
  });
  return Array.from(set);
});

// Stats Counters
const stats = computed(() => {
  const total = meta.value.total;
  const activeCount = teachers.value.filter((t) => t.is_active === 1).length;
  const inactiveCount = teachers.value.filter((t) => t.is_active === 0).length;
  const specCount = availableSpecializations.value.length;
  return { total, activeCount, inactiveCount, specCount };
});

// Row enrichment with item sequence order and styling
interface EnrichedTeacherRow extends Teacher {
  indexNumber: number;
  code: string;
  statusLabel: string;
  statusClass: string;
}

const enrichedTeachers = computed<EnrichedTeacherRow[]>(() => {
  return teachers.value.map((t, index) => {
    const isActive = t.is_active === 1;
    const indexNumber = (meta.value.current_page - 1) * meta.value.per_page + index + 1;

    return {
      ...t,
      indexNumber,
      code: `${t.user_code}#`,
      statusLabel: isActive ? 'نشط' : 'معطل',
      statusClass: isActive
        ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
        : 'border-red-500/40 text-red-500 bg-red-500/10',
    };
  });
});

// Debounced watchers for filters
let debounceTimer: any = null;
watch([search, statusPill, activeSpecialization], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchTeachers();
  }, 300);
});

watch(currentPage, () => {
  fetchTeachers();
});

// Drawer Openers
function openDetails(row: Teacher) {
  activeTeacher.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openCreateDrawer() {
  activeTeacher.value = null;
  drawerMode.value = 'create';
  form.value = {
    full_name: '',
    phone: '',
    specialization: '',
    hire_date: new Date().toISOString().split('T')[0],
    password: '',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

function openEditDrawer(t: Teacher) {
  activeTeacher.value = t;
  drawerMode.value = 'edit';
  form.value = {
    full_name: t.full_name,
    phone: t.phone || '',
    specialization: t.specialization || '',
    hire_date: t.hire_date || '',
    password: '',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

function openEditFromDetails() {
  if (!activeTeacher.value) return;
  openEditDrawer(activeTeacher.value);
}

// Status Toggle Handler
const isUpdatingStatus = ref(false);

async function handleToggleStatus(teacher: Teacher | null) {
  if (!teacher || !teacher.user_id) return;
  const nextStatus = teacher.is_active === 1 ? 0 : 1;
  const actionText = nextStatus === 0 ? 'تعطيل' : 'تفعيل';

  isUpdatingStatus.value = true;
  try {
    await teachersApi.updateStatus(
      teacher.user_id,
      nextStatus,
      nextStatus === 0 ? 'تعطيل يدوي من شاشة إدارة المعلمين' : 'إعادة تفعيل من شاشة إدارة المعلمين'
    );

    teacher.is_active = nextStatus;
    if (activeTeacher.value && activeTeacher.value.id === teacher.id) {
      activeTeacher.value.is_active = nextStatus;
    }

    toast.success(
      nextStatus === 0
        ? `تم تعطيل حساب المعلم (${teacher.full_name}) وإلغاء جلسات الدخول بنجاح.`
        : `تم إعادة تفعيل حساب المعلم (${teacher.full_name}) بنجاح.`
    );

    await fetchTeachers();
  } catch (err: any) {
    const msg = err.response?.data?.message || `تعذر ${actionText} حساب المعلم.`;
    toast.error(msg);
  } finally {
    isUpdatingStatus.value = false;
  }
}

// Delete Handlers
function confirmDelete(teacher: Teacher) {
  teacherToDelete.value = teacher;
  deleteErrorMessage.value = null;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!teacherToDelete.value) return;
  isDeleting.value = true;
  deleteErrorMessage.value = null;

  try {
    await teachersApi.deleteTeacher(teacherToDelete.value.id);
    toast.success('تم حذف ملف المعلم وحسابه بنجاح.');
    showDeleteModal.value = false;
    teacherToDelete.value = null;
    showDrawer.value = false;
    await fetchTeachers();
  } catch (err: any) {
    const msg =
      err.response?.data?.message ||
      'تعذر حذف ملف المعلم لوجود إسنادات تدريس أو جداول حصص مرتبطة به (RESTRICT).';
    deleteErrorMessage.value = msg;
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

// Save Handler
async function handleSave() {
  if (!form.value.full_name.trim()) {
    toast.warning('يرجى إدخال اسم المعلم الرباعي.');
    return;
  }

  isSubmitting.value = true;
  fieldErrors.value = {};
  formErrorMessage.value = null;

  try {
    if (drawerMode.value === 'create') {
      if (!form.value.password || form.value.password.length < 8) {
        toast.warning('كلمة المرور يجب ألا تقل عن 8 خانات.');
        isSubmitting.value = false;
        return;
      }

      await teachersApi.createTeacher({
        full_name: form.value.full_name,
        phone: form.value.phone || undefined,
        specialization: form.value.specialization || undefined,
        hire_date: form.value.hire_date || undefined,
        password: form.value.password,
      });

      toast.success('تم إنشاء ملف المعلم وتوليد حساب الدخول بنجاح.');
    } else if (activeTeacher.value) {
      const payload: any = {
        full_name: form.value.full_name,
        phone: form.value.phone || undefined,
        specialization: form.value.specialization || undefined,
        hire_date: form.value.hire_date || undefined,
      };
      if (form.value.password) {
        payload.password = form.value.password;
      }

      await teachersApi.updateTeacher(activeTeacher.value.id, payload);
      toast.success('تم تحديث بيانات ملف المعلم بنجاح.');
    }

    showDrawer.value = false;
    await fetchTeachers();
  } catch (err: any) {
    if (err.response?.data?.errors) {
      fieldErrors.value = err.response.data.errors;
    }
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات المعلم.';
    formErrorMessage.value = msg;
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  fetchTeachers();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
    <!-- Unified Container Card (Matching the Academic Structure Reference Design System) -->
    <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
      <!-- Card Header: Title on Right, Controls & Filters on Left -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
        <!-- Title -->
        <div>
          <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
            سجلات الكادر التعليمي الموحدة
          </h2>
          <p class="text-xs text-bx-muted font-medium mt-1">
            إدارة ملفات المعلمين، التخصصات العلمية، الحسابات الموحدة (TCH-XXXX) وحالات التفعيل
          </p>
        </div>

        <!-- Controls: Add Button + Search Input + Status Pills -->
        <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <!-- Add Button -->
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>إضافة معلم جديد</span>
          </button>

          <!-- Search Input (Pill Shaped) -->
          <div class="relative flex-1 sm:w-60">
            <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
            <input
              v-model="search"
              type="text"
              placeholder="بحث في المعلمين..."
              class="w-full pr-10 pl-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
            />
          </div>

          <!-- Status Pill Segmented Filters -->
          <div class="flex items-center gap-1.5 p-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent">
            <button
              @click="statusPill = 'all'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="statusPill === 'all' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
            >
              الكل
            </button>
            <button
              @click="statusPill = 'active'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="statusPill === 'active' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
            >
              نشط
            </button>
            <button
              @click="statusPill = 'inactive'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="statusPill === 'inactive' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
            >
              معطل
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Banner (Stats Ribbon) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6">
        <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-purple-500/[0.03] flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Users class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted font-bold block">إجمالي المعلمين</span>
            <span class="text-base font-black font-display text-bx-title font-mono">{{ stats.total }}</span>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-emerald-500/[0.03] flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted font-bold block">حسابات نشطة</span>
            <span class="text-base font-black font-display text-emerald-600 dark:text-emerald-400 font-mono">{{ stats.activeCount }}</span>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-red-500/[0.03] flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <XCircle class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted font-bold block">حسابات معطلة</span>
            <span class="text-base font-black font-display text-red-500 font-mono">{{ stats.inactiveCount }}</span>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-blue-500/[0.03] flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BookOpen class="w-4 h-4" />
          </div>
          <div>
            <span class="text-[11px] text-bx-muted font-bold block">تخصصات علمية</span>
            <span class="text-base font-black font-display text-blue-600 dark:text-blue-400 font-mono">{{ stats.specCount }}</span>
          </div>
        </div>
      </div>

      <!-- Specialization Chips Bar -->
      <div v-if="availableSpecializations.length > 0" class="flex flex-wrap items-center gap-2 pb-5 border-b border-[#B4AED8]/40 dark:border-white/[0.06] mb-5">
        <span class="text-xs font-bold text-bx-muted ms-1">التخصص:</span>
        <button
          @click="activeSpecialization = 'all'"
          class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="activeSpecialization === 'all' ? 'bg-bx-primary/15 text-bx-primary border border-bx-primary/30' : 'text-bx-muted hover:text-bx-title border border-transparent hover:border-[#B4AED8] dark:hover:border-white/10'"
        >
          كافة التخصصات
        </button>
        <button
          v-for="spec in availableSpecializations"
          :key="spec"
          @click="activeSpecialization = spec"
          class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="activeSpecialization === spec ? 'bg-bx-primary/15 text-bx-primary border border-bx-primary/30' : 'text-bx-muted hover:text-bx-title border border-transparent hover:border-[#B4AED8] dark:hover:border-white/10'"
        >
          {{ spec }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-24 text-center text-bx-muted">
        <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
        <span class="text-xs font-bold">جاري تحميل سجلات المعلمين...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="enrichedTeachers.length === 0"
        class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
      >
        <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
        <h3 class="text-sm font-bold text-bx-title">لا توجد سجلات تطابق محددات البحث</h3>
        <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو إضافة معلم جديد بالمنظومة.</p>
        <button
          @click="openCreateDrawer"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>إضافة أول معلم</span>
        </button>
      </div>

      <!-- Unified Table Content: Enclosed in a Bordered Card -->
      <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-start border-collapse text-xs">
            <!-- Table Header with Distinct Background and Crisp Dividers -->
            <thead>
              <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8]/60 dark:border-white/15 text-bx-muted">
                <th class="py-3 px-4 font-bold text-start w-12 font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">#</th>
                <th class="py-3 px-4 font-bold text-start border-e border-[#B4AED8]/50 dark:border-white/10">الرمز</th>
                <th class="py-3 px-4 font-bold text-start min-w-[220px] border-e border-[#B4AED8]/50 dark:border-white/10">
                  <div class="flex items-center gap-1.5">
                    <User class="w-3.5 h-3.5 text-bx-primary" />
                    <span>المعلم والبيانات المهنية</span>
                  </div>
                </th>
                <th class="py-3 px-4 font-bold text-start min-w-[140px] border-e border-[#B4AED8]/50 dark:border-white/10">
                  <div class="flex items-center gap-1.5">
                    <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                    <span>التخصص العلمي</span>
                  </div>
                </th>
                <th class="py-3 px-4 font-bold text-start min-w-[130px] border-e border-[#B4AED8]/50 dark:border-white/10">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                    <span>تاريخ المباشرة</span>
                  </div>
                </th>
                <th class="py-3 px-4 font-bold text-center w-28 border-e border-[#B4AED8]/50 dark:border-white/10">الحالة</th>
                <th class="py-3 px-4 font-bold text-center w-40 last:border-e-0">إجراءات</th>
              </tr>
            </thead>

            <!-- Table Body with Crisp Dividers -->
            <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10">
              <tr
                v-for="row in enrichedTeachers"
                :key="row.id"
                class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150 group"
              >
                <!-- Order / Sequence Index Number -->
                <td class="py-3 px-4 font-bold text-bx-muted text-xs whitespace-nowrap font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">
                  {{ row.indexNumber }}
                </td>

                <!-- Code (الرمز) -->
                <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                  <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-[#B4AED8]/50 dark:border-white/10 text-bx-title/80">
                    {{ row.code }}
                  </span>
                </td>

                <!-- Teacher with Professional Info (Clean without icon) -->
                <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                  <div>
                    <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight group-hover:text-bx-primary transition-colors">
                      {{ row.full_name }}
                    </span>
                    <span v-if="row.phone" class="font-mono text-[11px] text-bx-muted block mt-0.5" dir="ltr">
                      {{ row.phone }}
                    </span>
                  </div>
                </td>

                <!-- Specialization Badge -->
                <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                  <span
                    v-if="row.specialization"
                    class="inline-block px-3 py-1 rounded-full text-[11px] font-bold border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-950/30"
                  >
                    {{ row.specialization }}
                  </span>
                  <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">—</span>
                </td>

                <!-- Hire Date -->
                <td class="py-3 px-4 font-['Alexandria',sans-serif] font-medium text-xs text-bx-muted whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                  <span v-if="row.hire_date" class="inline-flex items-center gap-1.5 font-bold">
                    <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                    <span>{{ row.hire_date }}</span>
                  </span>
                  <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">—</span>
                </td>

                <!-- Status Pill (Interactive Toggle) -->
                <td class="py-3 px-4 text-center whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                  <button
                    @click="handleToggleStatus(row)"
                    :disabled="isUpdatingStatus"
                    class="inline-block px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer hover:opacity-85 disabled:opacity-50 shadow-2xs"
                    :class="
                      row.is_active === 1
                        ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 dark:border-emerald-400/50'
                        : 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/40 dark:border-rose-400/50'
                    "
                    :title="row.is_active === 1 ? 'انقر لتعطيل الحساب' : 'انقر لتفعيل الحساب'"
                  >
                    <span class="inline-flex items-center gap-1.5">
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        :class="row.is_active === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"
                      ></span>
                      <span>{{ row.statusLabel }}</span>
                    </span>
                  </button>
                </td>

                <!-- Actions: 4 Uniform Circular Icon Buttons with High Contrast in Dark Mode -->
                <td class="py-3 px-4 text-center whitespace-nowrap last:border-e-0">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- View Details Button -->
                    <button
                      @click="openDetails(row)"
                      class="w-7 h-7 rounded-full border border-[#B4AED8] bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                      title="معاينة الملف المهني والحساب"
                    >
                      <Eye class="w-3.5 h-3.5" />
                    </button>

                    <!-- Toggle Status Button (Activate / Deactivate) -->
                    <button
                      @click="handleToggleStatus(row)"
                      :disabled="isUpdatingStatus"
                      class="w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50"
                      :class="
                        row.is_active === 1
                          ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white dark:border-amber-400/70 dark:bg-amber-950/80 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-400/70 dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white'
                      "
                      :title="row.is_active === 1 ? 'تعطيل حساب المعلم' : 'تفعيل حساب المعلم'"
                    >
                      <UserX v-if="row.is_active === 1" class="w-3.5 h-3.5" />
                      <UserCheck v-else class="w-3.5 h-3.5" />
                    </button>

                    <!-- Edit Button -->
                    <button
                      @click="openEditDrawer(row)"
                      class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                      title="تعديل بيانات المعلم"
                    >
                      <Edit2 class="w-3.5 h-3.5" />
                    </button>

                    <!-- Delete Button -->
                    <button
                      @click="confirmDelete(row)"
                      class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                      title="حذف ملف المعلم"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div
          v-if="meta.last_page > 1"
          class="p-4 border-t border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-table-header)] flex items-center justify-between gap-4"
        >
          <div class="text-xs text-bx-muted">
            الصفحة <span class="font-bold text-bx-title">{{ meta.current_page }}</span> من <span class="font-bold text-bx-title">{{ meta.last_page }}</span> (إجمالي <span class="font-mono font-bold">{{ meta.total }}</span> معلماً)
          </div>

          <div class="flex items-center gap-1.5">
            <button
              :disabled="currentPage <= 1"
              @click="currentPage--"
              class="p-1.5 rounded-lg border border-[#B4AED8] dark:border-white/[0.12] hover:bg-[var(--bx-pill)] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <button
              v-for="p in meta.last_page"
              :key="p"
              @click="currentPage = p"
              class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer"
              :class="p === currentPage ? 'bg-bx-primary text-white shadow-sm' : 'hover:bg-[var(--bx-pill)] text-bx-muted'"
            >
              {{ p }}
            </button>
            <button
              :disabled="currentPage >= meta.last_page"
              @click="currentPage++"
              class="p-1.5 rounded-lg border border-[#B4AED8] dark:border-white/[0.12] hover:bg-[var(--bx-pill)] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Taqniya Modern Drawer (View Details / Add / Edit) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="
        drawerMode === 'details'
          ? 'الملف الشخصي للمعلم'
          : drawerMode === 'create'
          ? 'إضافة معلم جديد وتوليد الحساب'
          : 'تعديل بيانات ملف المعلم'
      "
      :subtitle="
        drawerMode === 'details'
          ? 'تفاصيل السجل المهني والحساب الموحد'
          : drawerMode === 'create'
          ? 'تسجيل معلم جديد وتوليد حساب الدخول الموحد ذرياً'
          : 'تحديث البيانات الشخصية والمهنية للمعلم'
      "
      :icon="drawerMode === 'details' ? GraduationCap : Users"
      @close="showDrawer = false"
    >
      <!-- View Details Mode -->
      <div v-if="drawerMode === 'details' && activeTeacher" class="space-y-6">
        <div class="p-5 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-3.5 shadow-xs">
          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">الرمز المؤسسي الموحد</span>
            <span class="font-mono font-bold text-xs text-bx-primary px-2.5 py-0.5 rounded-full bg-bx-primary/10 border border-bx-primary/20">
              {{ activeTeacher.user_code }}
            </span>
          </div>

          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">الاسم الرباعي</span>
            <span class="font-black text-xs text-bx-title">{{ activeTeacher.full_name }}</span>
          </div>

          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">التخصص العلمي</span>
            <span class="font-bold text-xs text-purple-600 dark:text-purple-400">
              {{ activeTeacher.specialization || 'غير محدد' }}
            </span>
          </div>

          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">رقم الهاتف</span>
            <span class="font-mono font-bold text-xs text-bx-title" dir="ltr">
              {{ activeTeacher.phone || 'غير مسجل' }}
            </span>
          </div>

          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">تاريخ التعيين والمباشرة</span>
            <span class="font-['Alexandria',sans-serif] font-bold text-xs text-bx-title">
              {{ activeTeacher.hire_date || 'غير محدد' }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-bx-muted">حالة الحساب الموحد</span>
            <span
              class="px-3 py-0.5 rounded-full text-[11px] font-bold border"
              :class="
                activeTeacher.is_active === 1
                  ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                  : 'border-red-500/30 text-red-500 bg-red-500/10'
              "
            >
              {{ activeTeacher.is_active === 1 ? 'حساب نشط' : 'حساب معطل' }}
            </span>
          </div>
        </div>

        <!-- Management Actions Inside Drawer -->
        <div class="space-y-2.5 pt-2">
          <button
            @click="openEditFromDetails"
            class="w-full py-2.5 px-4 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            <Edit2 class="w-4 h-4" />
            <span>تعديل بيانات المعلم</span>
          </button>

          <!-- Toggle Status Button (Activate / Deactivate) -->
          <button
            :disabled="isUpdatingStatus"
            @click="handleToggleStatus(activeTeacher)"
            class="w-full py-2.5 px-4 rounded-full border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            :class="
              activeTeacher.is_active === 1
                ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            "
          >
            <Loader2 v-if="isUpdatingStatus" class="w-4 h-4 animate-spin" />
            <template v-else>
              <UserX v-if="activeTeacher.is_active === 1" class="w-4 h-4" />
              <UserCheck v-else class="w-4 h-4" />
              <span>{{ activeTeacher.is_active === 1 ? 'تعطيل حساب المعلم' : 'تفعيل حساب المعلم' }}</span>
            </template>
          </button>

          <button
            @click="confirmDelete(activeTeacher)"
            class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 class="w-4 h-4" />
            <span>حذف ملف المعلم</span>
          </button>

          <button
            type="button"
            @click="showDrawer = false"
            class="w-full py-2.5 px-4 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            <span>إلغاء</span>
          </button>
        </div>
      </div>

      <!-- Create / Edit Form Mode -->
      <form v-else @submit.prevent="handleSave" class="space-y-5">
        <!-- Error Alert -->
        <div
          v-if="formErrorMessage"
          class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ formErrorMessage }}</span>
        </div>

        <!-- Full Name -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <User class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">الاسم الرباعي واللقب للمعلم <span class="text-red-500">*</span></label>
          </div>
          <input
            v-model="form.full_name"
            type="text"
            required
            maxlength="150"
            placeholder="مثال: أحمد محمود سالم الورفلي"
            class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
          />
          <p v-if="fieldErrors.full_name" class="text-[11px] text-red-500 font-medium">
            {{ fieldErrors.full_name[0] }}
          </p>
        </div>

        <!-- Specialization -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <BookOpen class="w-4 h-4 text-purple-500 shrink-0" />
            <label class="text-xs font-bold">التخصص العلمي</label>
          </div>
          <input
            v-model="form.specialization"
            type="text"
            maxlength="100"
            placeholder="مثال: الرياضيات، العلوم العامة، اللغة العربية"
            class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
          />
          <p v-if="fieldErrors.specialization" class="text-[11px] text-red-500 font-medium">
            {{ fieldErrors.specialization[0] }}
          </p>
        </div>

        <!-- Phone -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <Phone class="w-4 h-4 text-emerald-500 shrink-0" />
            <label class="text-xs font-bold">رقم الهاتف للتواصل المباشر</label>
          </div>
          <input
            v-model="form.phone"
            type="text"
            maxlength="20"
            placeholder="مثال: 0912345678"
            class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-medium"
            dir="ltr"
          />
          <p v-if="fieldErrors.phone" class="text-[11px] text-red-500 font-medium">
            {{ fieldErrors.phone[0] }}
          </p>
        </div>

        <!-- Hire Date -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <Calendar class="w-4 h-4 text-amber-500 shrink-0" />
            <label class="text-xs font-bold">تاريخ التعيين والمباشرة بالمدرسة</label>
          </div>
          <div class="relative flex items-center">
            <input
              v-model="form.hire_date"
              type="text"
              placeholder="YYYY-MM-DD (مثال: 2024-09-01)"
              dir="ltr"
              class="w-full pl-5 pr-11 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-medium"
            />
            <input
              ref="datePickerInput"
              type="date"
              tabindex="-1"
              aria-hidden="true"
              :value="form.hire_date"
              @input="onNativeDatePicked"
              class="sr-only absolute pointer-events-none"
            />
            <button
              type="button"
              @click="openNativeDatePicker"
              class="absolute right-2.5 p-1.5 rounded-full text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
              title="اختيار التاريخ من التقويم"
            >
              <Calendar class="w-4 h-4" />
            </button>
          </div>
          <p v-if="fieldErrors.hire_date" class="text-[11px] text-red-500 font-medium">
            {{ fieldErrors.hire_date[0] }}
          </p>
        </div>

        <!-- Password -->
        <div class="space-y-1.5 pt-2 border-t border-[#B4AED8]/40 dark:border-white/[0.08]">
          <div class="flex items-center justify-between text-bx-title">
            <div class="flex items-center gap-2">
              <Lock class="w-4 h-4 text-blue-500 shrink-0" />
              <label class="text-xs font-bold">
                كلمة مرور الحساب الموحد
                <span v-if="drawerMode === 'create'" class="text-red-500">*</span>
              </label>
            </div>
            <span v-if="drawerMode === 'edit'" class="text-[10px] text-bx-muted">
              (اتركها فارغة إذا كنت لا تريد التغيير)
            </span>
          </div>
          <input
            v-model="form.password"
            type="password"
            :required="drawerMode === 'create'"
            minlength="8"
            placeholder="••••••••"
            class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
          />
          <p v-if="fieldErrors.password" class="text-[11px] text-red-500 font-medium">
            {{ fieldErrors.password[0] }}
          </p>
        </div>

        <div v-if="drawerMode === 'create'" class="p-3.5 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20 text-[11px] text-bx-muted leading-relaxed">
          <p class="font-bold text-bx-title mb-0.5">💡 توليد الرمز الموحد:</p>
          <span>سيقوم النظام آلياً بتوليد كود الدخول بصيغة <span class="font-mono font-bold text-bx-primary">TCH-XXXX</span> وتشفير كلمة المرور ذرياً داخل قاعدة البيانات.</span>
        </div>
      </form>

      <!-- Fixed Footer Template for Form Modes -->
      <template v-if="drawerMode !== 'details'" #footer>
        <button
          type="button"
          @click="showDrawer = false"
          class="px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="isSubmitting"
          @click="handleSave"
          class="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
        >
          <Save class="w-4 h-4" />
          <span>{{ isSubmitting ? 'جاري الحفظ...' : drawerMode === 'create' ? 'حفظ وإنشاء الحساب' : 'تحديث البيانات' }}</span>
        </button>
      </template>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Matching ClassTermsTab) -->
    <Teleport to="body">
      <div v-if="showDeleteModal && teacherToDelete" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" dir="rtl">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" @click="showDeleteModal = false"></div>

        <!-- Modal Card -->
        <div class="relative w-full max-w-md rounded-3xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold border border-rose-500/20 shrink-0">
              <Trash2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-display font-black text-sm text-bx-title leading-snug">
                تأكيد حذف ملف المعلم
              </h3>
              <p class="text-[11px] text-bx-muted font-medium mt-0.5">
                حذف منطقي محمي بقيود النزاهة الأكاديمية (RESTRICT)
              </p>
            </div>
          </div>

          <!-- Error Alert inside modal if 409 Conflict occurred -->
          <div
            v-if="deleteErrorMessage"
            class="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1"
          >
            <p class="font-bold">تعذر إتمام الحذف:</p>
            <p class="leading-relaxed text-[11px]">{{ deleteErrorMessage }}</p>
          </div>

          <p class="text-xs text-bx-muted leading-relaxed">
            هل أنت متأكد من رغبتك في حذف ملف المعلم
            <span class="font-bold text-bx-title">"{{ teacherToDelete.full_name }}"</span>
            (كود: <span class="font-mono font-bold text-bx-primary">{{ teacherToDelete.user_code }}</span>)؟
          </p>

          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
            <p class="font-bold">🔒 حماية النزاهة المرجعية (RESTRICT):</p>
            <p class="leading-relaxed">
              يحظر النظام حذف أي معلم إذا كان مرتبطاً بجدول إسناد تدريس لمادة أو شعبة بالعام الدراسي لحماية سجلات الدرجات وجداول الحصص.
            </p>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-[#B4AED8] dark:border-white/[0.08]">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              @click="handleDelete"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>{{ isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    </div>
  </TaqniyaErrorBoundary>
</template>
