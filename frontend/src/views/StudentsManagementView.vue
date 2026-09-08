<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent, nextTick } from 'vue';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Phone,
  Calendar,
  Lock,
  User,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Save,
  Users,
  Hash,
  School,
  Filter,
  RotateCcw,
} from 'lucide-vue-next';
import { studentsApi, type Student, type PaginationMeta } from '../api/students.api';
import { academicApi, type ClassSectionsGroupItem } from '../api/academic.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';

const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));
const toast = useToast();

// State
const students = ref<Student[]>([]);
const meta = ref<PaginationMeta>({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const loading = ref(false);
const isSubmitting = ref(false);

// Academic Classes & Sections for Enrollment
const classesWithSections = ref<ClassSectionsGroupItem[]>([]);
const loadingClasses = ref(false);
const selectedClassId = ref<number | undefined>(undefined);

// Filters
const search = ref('');
const genderFilter = ref<string>('all');
const currentPage = ref(1);

let activeAbortController: AbortController | null = null;

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'details' | 'create' | 'edit'>('create');
const activeStudent = ref<Student | null>(null);

// Form State
const form = ref({
  full_name: '',
  gender: 'male' as 'male' | 'female',
  phone: '',
  birth_date: '',
  password: '',
  class_section_id: undefined as number | undefined,
  seating_number: '',
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
    form.value.birth_date = target.value;
  }
}

async function fetchClassesWithSections() {
  if (classesWithSections.value.length > 0) return;
  loadingClasses.value = true;
  try {
    const res = await academicApi.getClassSections();
    if (res.data && res.data.success && res.data.data?.classes) {
      classesWithSections.value = res.data.data.classes;
    }
  } catch (err) {
    console.error('Failed to load class sections:', err);
  } finally {
    loadingClasses.value = false;
  }
}

const availableSections = computed(() => {
  if (!selectedClassId.value) return [];
  const found = classesWithSections.value.find((c) => c.class_id === selectedClassId.value);
  return found ? found.sections : [];
});

const classOptions = computed<TaqniyaSelectOption[]>(() => {
  return classesWithSections.value.map((c) => ({
    value: c.class_id,
    label: c.class_name,
    subtext: `${c.sections_count} شعب متاحة`,
  }));
});

const sectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedClassId.value) return [];
  return availableSections.value.map((sec) => ({
    value: sec.id,
    label: sec.name.includes('شعبة') ? sec.name : `شعبة (${sec.name})`,
    subtext: sec.name.includes('شعبة') ? sec.name : `الشعبة (${sec.name})`,
  }));
});

let isDrawerInitializing = false;

watch(selectedClassId, () => {
  if (isDrawerInitializing) return;
  form.value.class_section_id = undefined;
});

// Academic Class & Section Filters in Table
const filterClassId = ref<string | number>('all');
const filterSectionId = ref<string | number>('all');
const appliedClassId = ref<string | number>('all');
const appliedSectionId = ref<string | number>('all');

const hasActiveAcademicFilters = computed(() => {
  return (
    (appliedClassId.value && appliedClassId.value !== 'all') ||
    (appliedSectionId.value && appliedSectionId.value !== 'all')
  );
});

const filterClassOptions = computed<TaqniyaSelectOption[]>(() => {
  return [
    { value: 'all', label: 'كافة الصفوف الدراسية' },
    ...classesWithSections.value.map((c) => ({
      value: c.class_id,
      label: c.class_name,
      subtext: `${c.sections_count} شعب متاحة`,
    })),
  ];
});

const filterAvailableSections = computed(() => {
  if (!filterClassId.value || filterClassId.value === 'all') return [];
  const found = classesWithSections.value.find((c) => String(c.class_id) === String(filterClassId.value));
  return found ? found.sections : [];
});

const filterSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!filterClassId.value || filterClassId.value === 'all') return [];
  return [
    { value: 'all', label: 'كافة شعب الصف' },
    ...filterAvailableSections.value.map((sec) => ({
      value: sec.id,
      label: sec.name.includes('شعبة') ? sec.name : `شعبة (${sec.name})`,
    })),
  ];
});

function applyAcademicFilters() {
  appliedClassId.value = filterClassId.value;
  appliedSectionId.value = filterSectionId.value;
  currentPage.value = 1;
  fetchStudents();
}

function resetAcademicFilters() {
  filterClassId.value = 'all';
  filterSectionId.value = 'all';
  appliedClassId.value = 'all';
  appliedSectionId.value = 'all';
  currentPage.value = 1;
  fetchStudents();
}

// Delete Modal State
const showDeleteModal = ref(false);
const studentToDelete = ref<Student | null>(null);
const isDeleting = ref(false);
const deleteErrorMessage = ref<string | null>(null);

async function fetchStudents() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      per_page: 15,
    };
    if (search.value.trim()) {
      params.search = search.value.trim();
    }
    if (genderFilter.value !== 'all') {
      params.gender = genderFilter.value;
    }
    if (appliedSectionId.value && appliedSectionId.value !== 'all') {
      params.class_section_id = Number(appliedSectionId.value);
    } else if (appliedClassId.value && appliedClassId.value !== 'all') {
      params.class_id = Number(appliedClassId.value);
    }

    const res = await studentsApi.getStudents(params, activeAbortController.signal);
    if (res.data && res.data.success) {
      students.value = res.data.data;
      meta.value = res.data.meta;
    }
  } catch (err: any) {
    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
      console.error('Error fetching students:', err);
      toast.error('تعذر جلب قائمة الطلاب، يرجى المحاولة لاحقاً.');
    }
  } finally {
    loading.value = false;
  }
}

interface EnrichedStudentRow extends Student {
  indexNumber: number;
  code: string;
}

const enrichedStudents = computed<EnrichedStudentRow[]>(() => {
  return students.value.map((student, index) => {
    const indexNumber = (meta.value.current_page - 1) * meta.value.per_page + index + 1;
    return {
      ...student,
      indexNumber,
      code: `${student.user_code}#`,
    };
  });
});

const stats = computed(() => {
  const total = meta.value.total;
  const maleCount = students.value.filter((s) => s.gender === 'male').length;
  const femaleCount = students.value.filter((s) => s.gender === 'female').length;
  const enrolledCount = students.value.filter((s) => !!s.class_section).length;
  return { total, maleCount, femaleCount, enrolledCount };
});

// Watchers for filtering with debounce
let debounceTimer: any = null;
watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchStudents();
  }, 350);
});

watch(genderFilter, () => {
  currentPage.value = 1;
  fetchStudents();
});

watch(filterClassId, () => {
  filterSectionId.value = 'all';
});

watch(currentPage, () => {
  fetchStudents();
});

async function openCreateDrawer() {
  drawerMode.value = 'create';
  activeStudent.value = null;
  isDrawerInitializing = true;
  form.value = {
    full_name: '',
    gender: 'male',
    phone: '',
    birth_date: '',
    password: '',
    class_section_id: undefined,
    seating_number: '',
  };
  selectedClassId.value = undefined;
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
  fetchClassesWithSections();
  await nextTick();
  isDrawerInitializing = false;
}

async function openEditDrawer(student: Student) {
  drawerMode.value = 'edit';
  activeStudent.value = student;
  isDrawerInitializing = true;
  await fetchClassesWithSections();

  selectedClassId.value = student.class_id ? Number(student.class_id) : undefined;
  form.value = {
    full_name: student.full_name,
    gender: student.gender,
    phone: student.phone || '',
    birth_date: student.birth_date || '',
    password: '',
    class_section_id: student.class_section_id ? Number(student.class_section_id) : undefined,
    seating_number: student.seating_number || '',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
  await nextTick();
  isDrawerInitializing = false;
}

function openDetailsDrawer(student: Student) {
  drawerMode.value = 'details';
  activeStudent.value = student;
  showDrawer.value = true;
}

function openEditFromDetails() {
  if (!activeStudent.value) return;
  openEditDrawer(activeStudent.value);
}

async function handleSaveStudent() {
  formErrorMessage.value = null;
  fieldErrors.value = {};

  if (!form.value.full_name.trim()) {
    fieldErrors.value.full_name = ['اسم الطالب الرباعي مطلوب.'];
    return;
  }

  if (drawerMode.value === 'create' && !form.value.password) {
    fieldErrors.value.password = ['كلمة المرور مطلوبة عند إنشاء حساب الطالب.'];
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const payload: any = {
        full_name: form.value.full_name.trim(),
        gender: form.value.gender,
        password: form.value.password,
      };
      if (form.value.phone?.trim()) payload.phone = form.value.phone.trim();
      if (form.value.birth_date) payload.birth_date = form.value.birth_date;
      if (form.value.class_section_id) payload.class_section_id = Number(form.value.class_section_id);
      if (form.value.seating_number?.trim()) payload.seating_number = form.value.seating_number.trim();

      const res = await studentsApi.createStudent(payload);
      if (res.data.success) {
        toast.success(res.data.message || 'تم إنشاء ملف الطالب وتوليد حسابه بنجاح.');
        showDrawer.value = false;
        fetchStudents();
      }
    } else if (drawerMode.value === 'edit' && activeStudent.value) {
      const payload: any = {
        full_name: form.value.full_name.trim(),
        gender: form.value.gender,
      };
      if (form.value.phone?.trim()) payload.phone = form.value.phone.trim();
      if (form.value.birth_date) payload.birth_date = form.value.birth_date;
      if (form.value.password?.trim()) payload.password = form.value.password.trim();
      if (form.value.class_section_id) payload.class_section_id = Number(form.value.class_section_id);
      if (form.value.seating_number?.trim()) payload.seating_number = form.value.seating_number.trim();

      const res = await studentsApi.updateStudent(activeStudent.value.id, payload);
      if (res.data.success) {
        toast.success(res.data.message || 'تم تحديث بيانات الطالب بنجاح.');
        showDrawer.value = false;
        fetchStudents();
      }
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    if (errorData?.errors) {
      fieldErrors.value = errorData.errors;
    }
    formErrorMessage.value = errorData?.message || 'حدث خطأ أثناء حفظ بيانات الطالب.';
  } finally {
    isSubmitting.value = false;
  }
}

function promptDelete(student: Student) {
  studentToDelete.value = student;
  deleteErrorMessage.value = null;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!studentToDelete.value) return;
  isDeleting.value = true;
  deleteErrorMessage.value = null;

  try {
    const res = await studentsApi.deleteStudent(studentToDelete.value.id);
    if (res.data.success) {
      toast.success(res.data.message || 'تم حذف ملف الطالب بنجاح.');
      showDeleteModal.value = false;
      studentToDelete.value = null;
      fetchStudents();
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    deleteErrorMessage.value =
      errorData?.message || 'تعذر حذف ملف الطالب. قد يكون مرتبطاً ببيانات أخرى.';
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  fetchClassesWithSections();
  fetchStudents();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card (Matching the Reference Design System) -->
      <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
        <!-- Card Header: Title on Right, Controls & Filters on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <!-- Title -->
          <div>
            <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
              سجلات الطلاب وشؤون القيد
            </h2>
            <p class="text-xs text-bx-muted font-medium mt-1">
              إدارة ملفات الطلاب، التسكين الأكاديمي، الحسابات الموحدة (STU-XXXX) وسجلات القيد
            </p>
          </div>

          <!-- Controls: Add Button + Search Input + Gender Pills -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Button -->
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>تسجيل طالب جديد</span>
            </button>

            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-60">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث في الطلاب..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Gender Filter Pills -->
            <div class="flex items-center gap-1.5 p-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent">
              <button
                @click="genderFilter = 'all'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="genderFilter === 'all' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                الكل
              </button>
              <button
                @click="genderFilter = 'male'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="genderFilter === 'male' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                ذكور
              </button>
              <button
                @click="genderFilter = 'female'"
                class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="genderFilter === 'female' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                إناث
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Metrics Banner (Stats Ribbon) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6">
          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-purple-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <GraduationCap class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">إجمالي الطلاب</span>
              <span class="text-base font-black font-display text-bx-title font-mono">{{ stats.total }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-blue-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <User class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">الطلاب (ذكور)</span>
              <span class="text-base font-black font-display text-blue-600 dark:text-blue-400 font-mono">{{ stats.maleCount }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-pink-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
              <User class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">الطالبات (إناث)</span>
              <span class="text-base font-black font-display text-pink-500 font-mono">{{ stats.femaleCount }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-emerald-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <School class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">المسكنون بالشعب</span>
              <span class="text-base font-black font-display text-emerald-600 dark:text-emerald-400 font-mono">{{ stats.enrolledCount }}</span>
            </div>
          </div>
        </div>

        <!-- Academic Class & Section Filters Bar -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.08] mb-6 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between gap-2 border-b border-[#B4AED8]/30 dark:border-white/[0.06] pb-2.5">
            <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
              <Filter class="w-4 h-4 text-bx-primary shrink-0" />
              <span>تصفية الطلاب حسب الصف والشعبة الدراسية</span>
            </div>
            <div v-if="hasActiveAcademicFilters" class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
              <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
              <span>الفلاتر الأكاديمية مفعلة</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الصف الدراسي</label>
              <TaqniyaSelect
                v-model="filterClassId"
                :options="filterClassOptions"
                placeholder="كافة الصفوف الدراسية..."
                :icon="School"
                full-width
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الشعبة الدراسية</label>
              <TaqniyaSelect
                v-model="filterSectionId"
                :options="filterSectionOptions"
                :placeholder="!filterClassId || filterClassId === 'all' ? 'يرجى اختيار الصف أولاً لتفعيل الشعب...' : filterSectionOptions.length <= 1 ? 'لا توجد شعب مسجلة لهذا الصف' : 'كافة شعب الصف...'"
                :disabled="!filterClassId || filterClassId === 'all' || filterAvailableSections.length === 0"
                :icon="GraduationCap"
                full-width
              />
            </div>
          </div>

          <!-- Filter Action Toolbar: Apply Button & Reset Button -->
          <div class="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <!-- Apply Filter Button (زر الفلترة) -->
              <button
                type="button"
                @click="applyAcademicFilters"
                :disabled="loading"
                class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                <Filter class="w-3.5 h-3.5" />
                <span>تطبيق الفلترة</span>
              </button>

              <!-- Reset Filter Button -->
              <button
                v-if="hasActiveAcademicFilters"
                type="button"
                @click="resetAcademicFilters"
                :disabled="loading"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/5 disabled:opacity-50 transition-all cursor-pointer"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>إلغاء التصفية</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="py-24 text-center text-bx-muted">
          <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
          <span class="text-xs font-bold">جاري تحميل سجلات الطلاب...</span>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="enrichedStudents.length === 0"
          class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
        >
          <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
          <h3 class="text-sm font-bold text-bx-title">لا توجد سجلات تطابق محددات البحث</h3>
          <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو تسجيل طالب جديد بالمنظومة.</p>
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>تسجيل أول طالب</span>
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
                      <span>الطالب والبيانات الشخصية</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[180px] border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center gap-1.5">
                      <School class="w-3.5 h-3.5 text-bx-primary" />
                      <span>التسكين الأكاديمي الحالي</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-center w-24 border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center justify-center gap-1.5">
                      <Users class="w-3.5 h-3.5 text-bx-primary" />
                      <span>الجنس</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[130px] border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div class="flex items-center gap-1.5">
                      <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                      <span>تاريخ الميلاد</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-center w-36 last:border-e-0">الإجراءات</th>
                </tr>
              </thead>

              <!-- Table Body with Crisp Dividers -->
              <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10">
                <tr
                  v-for="student in enrichedStudents"
                  :key="student.id"
                  class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                >
                  <!-- Sequence Index -->
                  <td class="py-3 px-4 font-bold text-bx-muted text-xs whitespace-nowrap font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">
                    {{ student.indexNumber }}
                  </td>

                  <!-- Code Pill -->
                  <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-[#B4AED8]/50 dark:border-white/10 text-bx-title/80">
                      {{ student.code }}
                    </span>
                  </td>

                  <!-- Student Info -->
                  <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <div>
                      <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight group-hover:text-bx-primary transition-colors">
                        {{ student.full_name }}
                      </span>
                      <span v-if="student.phone" class="font-mono text-[11px] text-bx-muted block mt-0.5" dir="ltr">
                        {{ student.phone }}
                      </span>
                    </div>
                  </td>

                  <!-- Academic Enrollment -->
                  <td class="py-3 px-4 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <span
                      v-if="student.class_section"
                      class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    >
                      <span>{{ student.class_section }}</span>
                    </span>
                    <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">— غير مسكن —</span>
                  </td>

                  <!-- Gender -->
                  <td class="py-3 px-4 text-center whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <span
                      class="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold border"
                      :class="
                        student.gender === 'male'
                          ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-950/30'
                          : 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10 dark:bg-pink-950/30'
                      "
                    >
                      {{ student.gender === 'male' ? 'ذكر' : 'أنثى' }}
                    </span>
                  </td>

                  <!-- Birth Date -->
                  <td class="py-3 px-4 font-['Alexandria',sans-serif] font-medium text-xs text-bx-muted whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                    <span v-if="student.birth_date" class="inline-block font-bold font-mono">
                      {{ student.birth_date }}
                    </span>
                    <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">—</span>
                  </td>

                  <!-- Actions: Uniform Circular Icon Buttons with High Contrast in Dark Mode -->
                  <td class="py-3 px-4 text-center whitespace-nowrap last:border-e-0">
                    <div class="flex items-center justify-center gap-1.5">
                      <!-- View Details Button -->
                      <button
                        @click="openDetailsDrawer(student)"
                        class="w-7 h-7 rounded-full border border-[#B4AED8] bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="معاينة الملف الشخصي والحساب"
                      >
                        <Eye class="w-3.5 h-3.5" />
                      </button>

                      <!-- Edit Button -->
                      <button
                        @click="openEditDrawer(student)"
                        class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="تعديل بيانات الطالب"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>

                      <!-- Delete Button -->
                      <button
                        @click="promptDelete(student)"
                        class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="حذف ملف الطالب"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer Matching Reference -->
          <div
            v-if="meta.last_page > 1"
            class="p-4 border-t border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-table-header)] flex items-center justify-between gap-4"
          >
            <div class="text-xs text-bx-muted">
              الصفحة <span class="font-bold text-bx-title">{{ meta.current_page }}</span> من <span class="font-bold text-bx-title">{{ meta.last_page }}</span> (إجمالي <span class="font-mono font-bold">{{ meta.total }}</span> طالباً)
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
            ? 'الملف الشخصي والأكاديمي للطالب'
            : drawerMode === 'create'
            ? 'تسجيل طالب جديد وتوليد الحساب'
            : 'تعديل بيانات ملف الطالب'
        "
        :subtitle="
          drawerMode === 'details'
            ? 'تفاصيل السجل الدراسي والبيانات الشخصية والحساب الموحد'
            : drawerMode === 'create'
            ? 'تسجيل طالب جديد وتوليد حساب الدخول STU-XXXX ذرياً مع التسكين المبدئي'
            : 'تحديث البيانات الشخصية وسجل الطالب'
        "
        :icon="drawerMode === 'details' ? GraduationCap : User"
        max-width="max-w-[700px]"
        @close="showDrawer = false"
      >
        <!-- DETAILS VIEW -->
        <div v-if="drawerMode === 'details' && activeStudent" class="space-y-6">
          <div class="p-5 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-3.5 shadow-xs">
            <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
              <span class="text-xs font-bold text-bx-muted">الرمز المؤسسي الموحد</span>
              <span class="font-mono font-bold text-xs text-bx-primary px-2.5 py-0.5 rounded-full bg-bx-primary/10 border border-bx-primary/20">
                {{ activeStudent.user_code }}
              </span>
            </div>

            <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
              <span class="text-xs font-bold text-bx-muted">الاسم الرباعي</span>
              <span class="font-black text-xs text-bx-title">{{ activeStudent.full_name }}</span>
            </div>

            <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
              <span class="text-xs font-bold text-bx-muted">الجنس</span>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                :class="activeStudent.gender === 'male' ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' : 'border-pink-500/30 text-pink-500 bg-pink-500/10'"
              >
                {{ activeStudent.gender === 'male' ? 'ذكر' : 'أنثى' }}
              </span>
            </div>

            <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
              <span class="text-xs font-bold text-bx-muted">الصف والشعبة المسكن بها</span>
              <span class="font-bold text-xs text-bx-primary">
                {{ activeStudent.class_section || 'غير مسكن حالياً' }}
              </span>
            </div>

            <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
              <span class="text-xs font-bold text-bx-muted">تاريخ الميلاد</span>
              <span class="font-['Alexandria',sans-serif] font-bold text-xs text-bx-title">
                {{ activeStudent.birth_date || 'غير مسجل' }}
              </span>
            </div>

            <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
              <span class="text-xs font-bold text-bx-muted">رقم الهاتف للتواصل</span>
              <span class="font-mono font-bold text-xs text-bx-title" dir="ltr">
                {{ activeStudent.phone || 'غير مسجل' }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-bx-muted">تاريخ إنشاء القيد</span>
              <span class="font-['Alexandria',sans-serif] font-bold text-xs text-bx-title">
                {{ activeStudent.created_at?.split('T')[0] }}
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
              <span>تعديل بيانات الطالب</span>
            </button>

            <button
              @click="promptDelete(activeStudent)"
              class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
              <span>حذف ملف الطالب</span>
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

        <!-- CREATE / EDIT FORM -->
        <form v-else @submit.prevent="handleSaveStudent" class="space-y-5">
          <!-- Error Alert -->
          <div
            v-if="formErrorMessage"
            class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Section 1: Personal & Basic Info Card -->
          <div class="p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-4 shadow-xs">
            <div class="flex items-center gap-2 border-b border-[#B4AED8]/50 dark:border-white/[0.08] pb-2.5">
              <User class="w-4 h-4 text-bx-primary shrink-0" />
              <h4 class="text-xs font-black text-bx-title">البيانات الشخصية والأساسية</h4>
            </div>

            <!-- Full Name -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-bx-title block">الاسم الرباعي واللقب للطالب <span class="text-red-500">*</span></label>
              <input
                v-model="form.full_name"
                type="text"
                required
                maxlength="150"
                placeholder="مثال: طارق زياد سالم الورفلي"
                class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
              />
              <p v-if="fieldErrors.full_name" class="text-[11px] text-red-500 font-medium">
                {{ fieldErrors.full_name[0] }}
              </p>
            </div>

            <!-- Gender & Birth Date in 2 Columns -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Gender Selection -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-bx-title block">جنس الطالب <span class="text-red-500">*</span></label>
                <div class="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    @click="form.gender = 'male'"
                    class="py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    :class="form.gender === 'male' ? 'border-bx-primary bg-bx-primary/10 text-bx-primary shadow-xs' : 'border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-title'"
                  >
                    <span>ذكر</span>
                  </button>
                  <button
                    type="button"
                    @click="form.gender = 'female'"
                    class="py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    :class="form.gender === 'female' ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 shadow-xs' : 'border-[#B4AED8] dark:border-white/[0.12] text-bx-muted hover:text-bx-title'"
                  >
                    <span>أنثى</span>
                  </button>
                </div>
              </div>

              <!-- Birth Date -->
              <div class="space-y-1.5">
                <div class="flex items-center gap-2 text-bx-title">
                  <Calendar class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <label class="text-xs font-bold">تاريخ الميلاد</label>
                </div>
                <div class="relative flex items-center">
                  <input
                    v-model="form.birth_date"
                    type="text"
                    placeholder="YYYY-MM-DD (مثال: 2012-05-15)"
                    dir="ltr"
                    class="w-full pl-5 pr-11 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-medium"
                  />
                  <input
                    ref="datePickerInput"
                    type="date"
                    tabindex="-1"
                    aria-hidden="true"
                    :value="form.birth_date"
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
                <p v-if="fieldErrors.birth_date" class="text-[11px] text-red-500 font-medium">
                  {{ fieldErrors.birth_date[0] }}
                </p>
              </div>
            </div>

            <!-- Phone -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-bx-title">
                <Phone class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <label class="text-xs font-bold">رقم هاتف الطالب / ولي الأمر للتواصل</label>
              </div>
              <input
                v-model="form.phone"
                type="text"
                maxlength="20"
                placeholder="مثال: 0912222222"
                class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-medium"
                dir="ltr"
              />
              <p v-if="fieldErrors.phone" class="text-[11px] text-red-500 font-medium">
                {{ fieldErrors.phone[0] }}
              </p>
            </div>
          </div>

          <!-- Section 2: Academic Placement / Enrollment (Create & Edit Modes) -->
          <div v-if="drawerMode === 'create' || drawerMode === 'edit'" class="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] space-y-4 shadow-xs">
            <div class="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <GraduationCap class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-xs font-black text-bx-title">
                    {{ drawerMode === 'create' ? 'التسكين الأكاديمي الفوري (اختياري)' : 'التسكين الأكاديمي وتعديل الشعبة' }}
                  </h4>
                  <p class="text-[10px] text-bx-muted">
                    {{ drawerMode === 'create' ? 'تحديد الصف الدراسي والشعبة لتسكين الطالب في الهيكل المدرسي مباشرة' : 'تعديل الصف الدراسي أو نقل الطالب إلى شعبة دراسية أخرى' }}
                  </p>
                </div>
              </div>
              <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                Phase 04-A
              </span>
            </div>

            <!-- 2-Column with Unified TaqniyaSelect Components -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Select Class via TaqniyaSelect -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-bx-title block">1. الصف الدراسي</label>
                <TaqniyaSelect
                  v-model="selectedClassId"
                  :options="classOptions"
                  placeholder="اختر الصف الدراسي..."
                  :icon="School"
                  full-width
                />
              </div>

              <!-- Select Available Section via TaqniyaSelect -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-bx-title block">2. الشعبة المتاحة لهذا الصف</label>
                <TaqniyaSelect
                  v-model="form.class_section_id"
                  :options="sectionOptions"
                  :placeholder="
                    !selectedClassId
                      ? 'يرجى اختيار الصف أولاً...'
                      : sectionOptions.length === 0
                      ? 'لا توجد شعب لهذا الصف'
                      : 'اختر الشعبة المتاحة...'
                  "
                  :disabled="!selectedClassId || sectionOptions.length === 0"
                  :icon="GraduationCap"
                  full-width
                />
              </div>
            </div>

            <!-- Seating Number (Optional) -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center gap-1.5 text-bx-title">
                <Hash class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <label class="text-[11px] font-bold">رقم الجلوس في الشعبة (اختياري)</label>
              </div>
              <input
                v-model="form.seating_number"
                type="text"
                maxlength="50"
                placeholder="مثال: 101، أو A-12"
                class="w-full px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
              />
            </div>
          </div>

          <!-- Section 3: Account & Security Card -->
          <div class="p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-3.5 shadow-xs">
            <div class="flex items-center gap-2 border-b border-[#B4AED8]/50 dark:border-white/[0.08] pb-2.5">
              <Lock class="w-4 h-4 text-blue-500 shrink-0" />
              <h4 class="text-xs font-black text-bx-title">حساب الدخول الموحد والأمان</h4>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-bx-title">
                <label class="text-xs font-bold">
                  كلمة مرور الحساب الموحد
                  <span v-if="drawerMode === 'create'" class="text-red-500">*</span>
                </label>
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

            <!-- Code Generation Info Note -->
            <div v-if="drawerMode === 'create'" class="p-3 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 text-[11px] text-bx-muted leading-relaxed">
              <p class="font-bold text-bx-title mb-0.5">💡 توليد الرمز الموحد:</p>
              <span>سيقوم النظام آلياً بتوليد كود الدخول بصيغة <span class="font-mono font-bold text-bx-primary">STU-XXXX</span> وتشفير كلمة المرور ذرياً داخل قاعدة البيانات.</span>
            </div>
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
            @click="handleSaveStudent"
            class="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'جاري الحفظ...' : drawerMode === 'create' ? 'حفظ وإنشاء ملف الطالب' : 'تحديث البيانات' }}</span>
          </button>
        </template>
      </TaqniyaDrawer>

      <!-- Confirmation Delete Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl p-6 border border-bx-border shadow-2xl space-y-4 text-right">
          <div class="flex items-center gap-3 text-red-500">
            <div class="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle class="w-6 h-6" />
            </div>
            <div>
              <h4 class="font-black text-base text-bx-title">تأكيد حذف ملف الطالب</h4>
              <p class="text-xs text-bx-muted">هذا الإجراء محمي بنظام النزاهة المرجعية (RESTRICT)</p>
            </div>
          </div>

          <p class="text-xs text-bx-text leading-relaxed">
            هل أنت متأكد من رغبتك في حذف ملف الطالب:
            <strong class="text-bx-title">{{ studentToDelete?.full_name }}</strong>
            ({{ studentToDelete?.user_code }})؟
          </p>

          <div v-if="deleteErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs leading-relaxed">
            {{ deleteErrorMessage }}
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 rounded-xl border border-bx-border text-xs font-bold text-bx-muted hover:bg-[var(--bx-canvas)] transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              @click="confirmDelete"
              class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
              <span>تأكيد الحذف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
