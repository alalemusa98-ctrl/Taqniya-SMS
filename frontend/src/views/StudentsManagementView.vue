<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  GraduationCap,
  School,
  Filter,
  RotateCcw,
  Loader2,
} from 'lucide-vue-next';
import { studentsApi, type Student, type PaginationMeta } from '../api/students.api';
import { academicApi, type ClassSectionsGroupItem } from '../api/academic.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';
import TaqniyaModal from '../components/ui/TaqniyaModal.vue';
import StudentFormDrawer from '../components/students/StudentFormDrawer.vue';
import StudentDetailDrawer from '../components/students/StudentDetailDrawer.vue';

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

// Filters
const search = ref('');
const genderFilter = ref<string>('all');
const currentPage = ref(1);

let activeAbortController: AbortController | null = null;

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'details' | 'create' | 'edit'>('create');
const activeStudent = ref<Student | null>(null);

const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);

// Delete Modal State
const showDeleteModal = ref(false);
const studentToDelete = ref<Student | null>(null);
const isDeleting = ref(false);
const deleteErrorMessage = ref<string | null>(null);

async function fetchClassesWithSections() {
  if (classesWithSections.value.length > 0) return;
  loadingClasses.value = true;
  try {
    const res = await academicApi.getClassSections();
    if (res.data?.success && res.data.data?.classes) {
      classesWithSections.value = res.data.data.classes;
    }
  } catch (err) {
    console.error('Failed to load class sections:', err);
  } finally {
    loadingClasses.value = false;
  }
}

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
    { value: 'all', label: 'كافة شعب الصف...' },
    ...filterAvailableSections.value.map((s) => ({
      value: s.id,
      label: s.name.includes('شعبة') ? s.name : `شعبة (${s.name})`,
      subtext: s.name.includes('شعبة') ? s.name : `الشعبة (${s.name})`,
    })),
  ];
});

watch(filterClassId, (newVal) => {
  if (newVal === 'all') {
    filterSectionId.value = 'all';
  } else {
    filterSectionId.value = 'all';
  }
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

// Fetch Students
async function fetchStudents() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      per_page: meta.value.per_page,
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
    if (res.data?.success) {
      students.value = res.data.data || [];
      if (res.data.meta) {
        meta.value = res.data.meta;
      }
    }
  } catch (err: any) {
    if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
      console.error('Failed to fetch students:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات الطلاب');
    }
  } finally {
    loading.value = false;
  }
}

// Watchers
watch(currentPage, () => {
  fetchStudents();
});

watch([genderFilter], () => {
  currentPage.value = 1;
  fetchStudents();
});

let searchDebounceTimeout: any = null;
watch(search, () => {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchStudents();
  }, 350);
});

// Enriched students with calculated values
const enrichedStudents = computed(() => {
  return students.value.map((student, idx) => {
    const indexNumber = (meta.value.current_page - 1) * meta.value.per_page + idx + 1;
    const code = student.user_code || `STU-${student.id}`;
    return {
      ...student,
      indexNumber,
      code,
    };
  });
});

// Table Column Definitions
const tableColumns: TableColumn[] = [
  { key: 'indexNumber', label: '#', width: '50px', align: 'start' },
  { key: 'code', label: 'الرمز', width: '110px', align: 'start' },
  { key: 'full_name', label: 'الطالب والبيانات الشخصية', align: 'start' },
  { key: 'class_section', label: 'التسكين الأكاديمي الحالي', align: 'start' },
  { key: 'gender', label: 'الجنس', width: '90px', align: 'center' },
  { key: 'birth_date', label: 'تاريخ الميلاد', align: 'start' },
  { key: 'actions', label: 'الإجراءات', width: '130px', align: 'center' },
];

function openCreateDrawer() {
  activeStudent.value = null;
  drawerMode.value = 'create';
  formErrorMessage.value = null;
  fieldErrors.value = {};
  showDrawer.value = true;
}

function openEditDrawer(student: Student) {
  activeStudent.value = student;
  drawerMode.value = 'edit';
  formErrorMessage.value = null;
  fieldErrors.value = {};
  showDrawer.value = true;
}

async function openDetailsDrawer(student: Student) {
  activeStudent.value = student;
  drawerMode.value = 'details';
  showDrawer.value = true;

  try {
    const res = await studentsApi.getStudentById(student.id);
    if (res.data?.success && res.data.data) {
      activeStudent.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load full student details:', err);
  }
}

function openEditFromDetails() {
  if (!activeStudent.value) return;
  openEditDrawer(activeStudent.value);
}

async function handleSaveStudent(payload: { data: any; mode: 'create' | 'edit'; id?: number }) {
  formErrorMessage.value = null;
  fieldErrors.value = {};
  isSubmitting.value = true;

  try {
    if (payload.mode === 'create') {
      const res = await studentsApi.createStudent(payload.data);
      if (res.data?.success) {
        toast.success(res.data.message || 'تم إنشاء ملف الطالب وتوليد حسابه بنجاح.');
        showDrawer.value = false;
        fetchStudents();
      }
    } else if (payload.mode === 'edit' && payload.id) {
      const res = await studentsApi.updateStudent(payload.id, payload.data);
      if (res.data?.success) {
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
    if (res.data?.success) {
      toast.success(res.data.message || 'تم حذف ملف الطالب بنجاح.');
      showDeleteModal.value = false;
      studentToDelete.value = null;
      fetchStudents();
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    deleteErrorMessage.value =
      errorData?.message || 'تعذر حذف ملف الطالب. قد يكون مرتبطاً ببيانات أخرى (Foreign Key Restrict).';
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
      <!-- Unified Container Card -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        <!-- Card Header: Title on Right, Controls & Filters on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
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
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>تسجيل طالب جديد</span>
            </button>

            <!-- Search Input -->
            <div class="relative flex-1 sm:w-60">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث في الطلاب..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Gender Filter Pills -->
            <div class="flex items-center gap-1.5 p-1 rounded-full border border-bx-border bg-transparent">
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

        <!-- Academic Class & Section Filters Bar -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-bx-border mb-6 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between gap-2 border-b border-bx-divider pb-2.5">
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

          <div class="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="applyAcademicFilters"
                :disabled="loading"
                class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                <Filter class="w-3.5 h-3.5" />
                <span>تطبيق الفلترة</span>
              </button>

              <button
                v-if="hasActiveAcademicFilters"
                type="button"
                @click="resetAcademicFilters"
                :disabled="loading"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/5 disabled:opacity-50 transition-all cursor-pointer"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>إلغاء التصفية</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Shared TaqniyaTable Component -->
        <TaqniyaTable
          :columns="tableColumns"
          :items="enrichedStudents"
          :is-loading="loading"
          empty-title="لا توجد سجلات تطابق محددات البحث"
          empty-subtitle="جرب تغيير محددات التصفية أو تسجيل طالب جديد بالمنظومة."
          :empty-icon="AlertCircle"
        >
          <!-- Sequence Index -->
          <template #cell-indexNumber="{ item }">
            <span class="font-bold text-bx-muted text-xs font-['Alexandria',sans-serif]">
              {{ item.indexNumber }}
            </span>
          </template>

          <!-- Code Pill -->
          <template #cell-code="{ item }">
            <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] border border-bx-border text-bx-title/80">
              {{ item.code }}
            </span>
          </template>

          <!-- Student Info -->
          <template #cell-full_name="{ item }">
            <div>
              <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight hover:text-bx-primary transition-colors cursor-pointer" @click="openDetailsDrawer(item)">
                {{ item.full_name }}
              </span>
              <span v-if="item.phone" class="font-mono text-[11px] text-bx-muted block mt-0.5" dir="ltr">
                {{ item.phone }}
              </span>
            </div>
          </template>

          <!-- Academic Placement -->
          <template #cell-class_section="{ item }">
            <span
              v-if="item.class_section"
              class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              {{ item.class_section }}
            </span>
            <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">— غير مسكن —</span>
          </template>

          <!-- Gender -->
          <template #cell-gender="{ item }">
            <span
              class="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold border"
              :class="
                item.gender === 'male'
                  ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-950/30'
                  : 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10 dark:bg-pink-950/30'
              "
            >
              {{ item.gender === 'male' ? 'ذكر' : 'أنثى' }}
            </span>
          </template>

          <!-- Birth Date -->
          <template #cell-birth_date="{ item }">
            <span class="font-['Alexandria',sans-serif] font-medium text-xs text-bx-muted whitespace-nowrap">
              {{ item.birth_date || '—' }}
            </span>
          </template>

          <!-- Actions -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-center gap-1.5">
              <button
                type="button"
                @click="openDetailsDrawer(item)"
                class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white dark:border-purple-400 dark:bg-purple-950/80 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="عرض تفاصيل ملف الطالب"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="openEditDrawer(item)"
                class="w-7 h-7 rounded-full border border-sky-300 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:bg-sky-950/80 dark:text-sky-300 dark:hover:bg-sky-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="تعديل بيانات الطالب"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="promptDelete(item)"
                class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="حذف ملف الطالب"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
        </TaqniyaTable>

        <!-- Shared TaqniyaPagination Component -->
        <TaqniyaPagination
          :current-page="currentPage"
          :total-pages="meta.last_page"
          :total="meta.total"
          :is-loading="loading"
          item-name="طالباً"
          @page-change="(p) => currentPage = p"
        />
      </div>

      <!-- Feature Drawer: Student Form (Create / Edit) -->
      <StudentFormDrawer
        :is-open="showDrawer && (drawerMode === 'create' || drawerMode === 'edit')"
        :mode="drawerMode === 'create' ? 'create' : 'edit'"
        :student="activeStudent"
        :is-submitting="isSubmitting"
        :error-message="formErrorMessage"
        :field-errors="fieldErrors"
        :classes-with-sections="classesWithSections"
        :loading-classes="loadingClasses"
        @close="showDrawer = false"
        @save="handleSaveStudent"
      />

      <!-- Feature Drawer: Student Details Inspection -->
      <StudentDetailDrawer
        :is-open="showDrawer && drawerMode === 'details'"
        :student="activeStudent"
        @close="showDrawer = false"
        @edit="openEditFromDetails"
      />

      <!-- Shared TaqniyaModal for Confirmation Delete -->
      <TaqniyaModal
        :is-open="showDeleteModal"
        title="تأكيد حذف ملف الطالب"
        subtitle="هذا الإجراء محمي بنظام النزاهة المرجعية (RESTRICT)"
        max-width="md"
        @close="showDeleteModal = false"
      >
        <template #icon>
          <div class="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertCircle class="w-6 h-6" />
          </div>
        </template>

        <p class="text-xs text-bx-text leading-relaxed">
          هل أنت متأكد من رغبتك في حذف ملف الطالب:
          <strong class="text-bx-title">{{ studentToDelete?.full_name }}</strong>
          ({{ studentToDelete?.user_code }})؟
        </p>

        <div v-if="deleteErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs leading-relaxed">
          {{ deleteErrorMessage }}
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 rounded-xl border border-bx-border text-xs font-bold text-bx-muted hover:bg-bx-canvas transition-all cursor-pointer"
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
        </template>
      </TaqniyaModal>
    </div>
  </TaqniyaErrorBoundary>
</template>
