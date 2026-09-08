<script setup lang="ts">
import { ref, onMounted, watch, defineAsyncComponent } from 'vue';
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
} from 'lucide-vue-next';
import { studentsApi, type Student, type PaginationMeta } from '../api/students.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';

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

watch(currentPage, () => {
  fetchStudents();
});

function openCreateDrawer() {
  drawerMode.value = 'create';
  activeStudent.value = null;
  form.value = {
    full_name: '',
    gender: 'male',
    phone: '',
    birth_date: '',
    password: '',
    class_section_id: undefined,
    seating_number: '',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

function openEditDrawer(student: Student) {
  drawerMode.value = 'edit';
  activeStudent.value = student;
  form.value = {
    full_name: student.full_name,
    gender: student.gender,
    phone: student.phone || '',
    birth_date: student.birth_date || '',
    password: '',
    class_section_id: undefined,
    seating_number: '',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

function openDetailsDrawer(student: Student) {
  drawerMode.value = 'details';
  activeStudent.value = student;
  showDrawer.value = true;
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
  fetchStudents();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-6" dir="rtl">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[var(--bx-surface-glass)] p-6 rounded-3xl border border-bx-border backdrop-blur-md shadow-sm">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20">
              <GraduationCap class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-bx-title">سجل الطلاب وشؤون القيد</h2>
              <p class="text-xs sm:text-sm text-bx-muted font-medium">إدارة وتسكين الطلاب وتوليد الرموز الموحدة (STU-XXXX)</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="openCreateDrawer"
            class="flex items-center gap-2 bg-bx-primary hover:bg-bx-primary-hover text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-bx-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>تسجيل طالب جديد</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-bx-border">
        <!-- Search Box -->
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-bx-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="البحث بالاسم أو كود STU..."
            class="w-full pl-3 pr-9 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text"
          />
        </div>

        <!-- Gender Filter Tabs -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-xs font-bold text-bx-muted">الجنس:</span>
          <div class="flex bg-[var(--bx-canvas)] p-1 rounded-xl border border-bx-border">
            <button
              @click="genderFilter = 'all'"
              :class="genderFilter === 'all' ? 'bg-bx-primary text-white font-bold shadow-sm' : 'text-bx-muted font-medium'"
              class="px-3 py-1 rounded-lg text-xs transition-all cursor-pointer"
            >
              الكل
            </button>
            <button
              @click="genderFilter = 'male'"
              :class="genderFilter === 'male' ? 'bg-bx-primary text-white font-bold shadow-sm' : 'text-bx-muted font-medium'"
              class="px-3 py-1 rounded-lg text-xs transition-all cursor-pointer"
            >
              ذكور
            </button>
            <button
              @click="genderFilter = 'female'"
              :class="genderFilter === 'female' ? 'bg-bx-primary text-white font-bold shadow-sm' : 'text-bx-muted font-medium'"
              class="px-3 py-1 rounded-lg text-xs transition-all cursor-pointer"
            >
              إناث
            </button>
          </div>
        </div>
      </div>

      <!-- Students Table Card -->
      <div class="bg-[var(--bx-surface-solid)] rounded-3xl border border-bx-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead>
              <tr class="border-b border-bx-border bg-[var(--bx-canvas)]/50 text-bx-muted font-bold">
                <th class="py-3.5 px-4">#</th>
                <th class="py-3.5 px-4">كود الطالب</th>
                <th class="py-3.5 px-4">الاسم الرباعي</th>
                <th class="py-3.5 px-4">الصف والشعبة الحالية</th>
                <th class="py-3.5 px-4">الجنس</th>
                <th class="py-3.5 px-4">تاريخ الميلاد</th>
                <th class="py-3.5 px-4">الهاتف</th>
                <th class="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-bx-border">
              <!-- Loading Skeleton -->
              <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
                <td class="py-4 px-4"><div class="h-4 w-6 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-20 bg-bx-border rounded-full"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-36 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-28 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-12 bg-bx-border rounded-full"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-20 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-20 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4 text-center"><div class="h-4 w-16 bg-bx-border rounded mx-auto"></div></td>
              </tr>

              <!-- Empty State -->
              <tr v-else-if="students.length === 0">
                <td colspan="8" class="py-12 text-center text-bx-muted">
                  <div class="max-w-xs mx-auto space-y-3">
                    <Users class="w-10 h-10 mx-auto opacity-40 text-bx-muted" />
                    <p class="text-sm font-bold">لا يوجد طلاب مسجلون يطابقون محددات البحث</p>
                    <button
                      @click="openCreateDrawer"
                      class="inline-flex items-center gap-2 text-xs font-bold text-bx-primary hover:underline cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>تسجيل أول طالب الآن</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Students Data Rows -->
              <tr
                v-else
                v-for="student in students"
                :key="student.id"
                class="hover:bg-[var(--bx-pill)]/50 transition-colors"
              >
                <td class="py-3.5 px-4 font-mono text-bx-muted">{{ student.id }}</td>
                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {{ student.user_code }}
                  </span>
                </td>
                <td class="py-3.5 px-4 font-bold text-bx-title">
                  {{ student.full_name }}
                </td>
                <td class="py-3.5 px-4">
                  <span v-if="student.class_section" class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {{ student.class_section }}
                  </span>
                  <span v-else class="text-bx-muted font-medium text-[11px]">غير مسكن</span>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    :class="student.gender === 'male' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-pink-500/10 text-pink-500 border-pink-500/20'"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  >
                    {{ student.gender === 'male' ? 'ذكر' : 'أنثى' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 font-mono text-bx-muted">{{ student.birth_date || '—' }}</td>
                <td class="py-3.5 px-4 font-mono text-bx-muted">{{ student.phone || '—' }}</td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      @click="openDetailsDrawer(student)"
                      title="معاينة الملف"
                      class="p-1.5 rounded-lg text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="openEditDrawer(student)"
                      title="تعديل البيانات"
                      class="p-1.5 rounded-lg text-bx-muted hover:text-amber-500 hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      @click="promptDelete(student)"
                      title="حذف الطالب"
                      class="p-1.5 rounded-lg text-bx-muted hover:text-red-500 hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div v-if="meta.total > meta.per_page" class="flex items-center justify-between px-6 py-4 border-t border-bx-border bg-[var(--bx-canvas)]/30 text-xs">
          <div class="text-bx-muted font-medium">
            إجمالي الطلاب: <strong class="text-bx-title font-mono">{{ meta.total }}</strong>
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="currentPage <= 1"
              @click="currentPage--"
              class="p-1.5 rounded-lg border border-bx-border disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <span class="font-bold text-bx-title px-2 font-mono">
              {{ meta.current_page }} / {{ meta.last_page }}
            </span>
            <button
              :disabled="currentPage >= meta.last_page"
              @click="currentPage++"
              class="p-1.5 rounded-lg border border-bx-border disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Slide-over Drawer for Create / Edit / Details -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        :title="drawerMode === 'create' ? 'تسجيل طالب جديد' : drawerMode === 'edit' ? 'تعديل بيانات الطالب' : 'الملف الأكاديمي للطالب'"
        @close="showDrawer = false"
      >
        <!-- DETAILS VIEW -->
        <div v-if="drawerMode === 'details' && activeStudent" class="space-y-6 text-right">
          <!-- Profile Badge Card -->
          <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-5 rounded-2xl border border-indigo-500/20 text-center space-y-2">
            <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
              <User class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-black text-bx-title">{{ activeStudent.full_name }}</h3>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-black bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
              {{ activeStudent.user_code }}
            </span>
          </div>

          <!-- Student Information Details -->
          <div class="bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-bx-border space-y-3 text-xs">
            <div class="flex justify-between py-1.5 border-b border-bx-border/50">
              <span class="text-bx-muted">الصف والشعبة:</span>
              <span class="font-bold text-bx-title">{{ activeStudent.class_section || 'غير مسكن حالياً' }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-bx-border/50">
              <span class="text-bx-muted">الجنس:</span>
              <span class="font-bold text-bx-title">{{ activeStudent.gender === 'male' ? 'ذكر' : 'أنثى' }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-bx-border/50">
              <span class="text-bx-muted">تاريخ الميلاد:</span>
              <span class="font-mono font-bold text-bx-title">{{ activeStudent.birth_date || '—' }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-bx-border/50">
              <span class="text-bx-muted">رقم الهاتف:</span>
              <span class="font-mono font-bold text-bx-title">{{ activeStudent.phone || '—' }}</span>
            </div>
            <div class="flex justify-between py-1.5">
              <span class="text-bx-muted">تاريخ إنشاء القيد:</span>
              <span class="font-mono font-bold text-bx-title">{{ activeStudent.created_at.split('T')[0] }}</span>
            </div>
          </div>
        </div>

        <!-- CREATE / EDIT FORM -->
        <form v-else @submit.prevent="handleSaveStudent" class="space-y-4 text-right">
          <!-- Error Alert -->
          <div v-if="formErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Full Name -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">الاسم الرباعي واللقب *</label>
            <input
              v-model="form.full_name"
              type="text"
              placeholder="مثال: طارق زياد الورفلي"
              class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text"
            />
            <p v-if="fieldErrors.full_name" class="text-[11px] text-red-500 mt-1">{{ fieldErrors.full_name[0] }}</p>
          </div>

          <!-- Gender Radio -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">جنس الطالب *</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-xs font-medium text-bx-text cursor-pointer">
                <input v-model="form.gender" type="radio" value="male" class="text-bx-primary" />
                <span>ذكر</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-medium text-bx-text cursor-pointer">
                <input v-model="form.gender" type="radio" value="female" class="text-bx-primary" />
                <span>أنثى</span>
              </label>
            </div>
          </div>

          <!-- Birth Date -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">تاريخ الميلاد</label>
            <div class="relative">
              <Calendar class="w-4 h-4 text-bx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="form.birth_date"
                type="date"
                class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text font-mono"
              />
            </div>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">رقم هاتف الطالب / التواصل</label>
            <div class="relative">
              <Phone class="w-4 h-4 text-bx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="form.phone"
                type="text"
                placeholder="مثال: 0912222222"
                class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text font-mono"
              />
            </div>
          </div>

          <!-- Password (Required on Create, Optional on Edit) -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              {{ drawerMode === 'create' ? 'كلمة مرور الحساب الموحد *' : 'تغيير كلمة المرور (اختياري)' }}
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 text-bx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="form.password"
                type="password"
                placeholder="8 خانات على الأقل..."
                class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text font-mono"
              />
            </div>
            <p v-if="fieldErrors.password" class="text-[11px] text-red-500 mt-1">{{ fieldErrors.password[0] }}</p>
          </div>

          <!-- Optional Immediate Enrollment (Create mode only) -->
          <div v-if="drawerMode === 'create'" class="p-3.5 bg-[var(--bx-canvas)] rounded-2xl border border-bx-border space-y-3">
            <span class="text-xs font-bold text-bx-title flex items-center gap-1.5">
              <GraduationCap class="w-3.5 h-3.5 text-bx-primary" />
              <span>تسكين أكاديمي فوري (اختياري)</span>
            </span>

            <div>
              <label class="block text-[11px] font-medium text-bx-muted mb-1">معرف الشعبة الدراسية (class_section_id)</label>
              <input
                v-model.number="form.class_section_id"
                type="number"
                placeholder="معرف الشعبة..."
                class="w-full px-3 py-1.5 rounded-lg text-xs border border-bx-border bg-[var(--bx-surface-solid)] focus:outline-none focus:border-bx-primary text-bx-text font-mono"
              />
            </div>

            <div>
              <label class="block text-[11px] font-medium text-bx-muted mb-1">رقم الجلوس (seating_number)</label>
              <input
                v-model="form.seating_number"
                type="text"
                placeholder="مثال: 105"
                class="w-full px-3 py-1.5 rounded-lg text-xs border border-bx-border bg-[var(--bx-surface-solid)] focus:outline-none focus:border-bx-primary text-bx-text font-mono"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-4 flex items-center gap-3">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 flex items-center justify-center gap-2 bg-bx-primary hover:bg-bx-primary-hover text-white py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-bx-primary/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ drawerMode === 'create' ? 'إنشاء ملف الطالب' : 'حفظ التعديلات' }}</span>
            </button>
            <button
              type="button"
              @click="showDrawer = false"
              class="px-5 py-2.5 rounded-2xl border border-bx-border text-xs font-bold text-bx-muted hover:bg-[var(--bx-canvas)] transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
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
