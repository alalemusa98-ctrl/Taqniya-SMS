<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-vue-next';
import { teachersApi, type Teacher, type PaginationMeta } from '../api/teachers.api';
import TeacherProfileDrawer from '../components/teachers/TeacherProfileDrawer.vue';
import TeacherFormDrawer from '../components/teachers/TeacherFormDrawer.vue';
import TeacherDeleteModal from '../components/teachers/TeacherDeleteModal.vue';

// State
const teachers = ref<Teacher[]>([]);
const meta = ref<PaginationMeta>({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const isLoading = ref(false);
const error = ref<string | null>(null);
const successToast = ref<string | null>(null);

// Filters
const search = ref('');
const specialization = ref('');
const isActiveFilter = ref<string>('');
const currentPage = ref(1);

// Drawers & Modals
const isProfileDrawerOpen = ref(false);
const isFormDrawerOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedTeacher = ref<Teacher | null>(null);

function showToast(msg: string) {
  successToast.value = msg;
  setTimeout(() => {
    successToast.value = null;
  }, 4000);
}

async function fetchTeachers() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await teachersApi.getTeachers({
      search: search.value || undefined,
      specialization: specialization.value || undefined,
      is_active: isActiveFilter.value !== '' ? Number(isActiveFilter.value) : undefined,
      page: currentPage.value,
      per_page: 15,
      sort_by: 'id',
      sort_order: 'desc',
    });
    teachers.value = res.data.data;
    meta.value = res.data.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'تعذر جلب قائمة المعلمين من الخادم.';
  } finally {
    isLoading.value = false;
  }
}

// Watch filters with debounce
let debounceTimer: any = null;
watch([search, specialization, isActiveFilter], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchTeachers();
  }, 350);
});

watch(currentPage, () => {
  fetchTeachers();
});

// Action Handlers
function openCreateDrawer() {
  selectedTeacher.value = null;
  isFormDrawerOpen.value = true;
}

function openEditDrawer(t: Teacher) {
  selectedTeacher.value = t;
  isFormDrawerOpen.value = true;
}

function openProfileDrawer(t: Teacher) {
  selectedTeacher.value = t;
  isProfileDrawerOpen.value = true;
}

function openDeleteModal(t: Teacher) {
  selectedTeacher.value = t;
  isDeleteModalOpen.value = true;
}

function onSaved() {
  showToast(selectedTeacher.value ? 'تم تحديث بيانات المعلم بنجاح.' : 'تم إضافة المعلم وتوليد حسابه بنجاح.');
  fetchTeachers();
}

function onDeleted() {
  showToast('تم حذف ملف المعلم وحسابه بنجاح.');
  fetchTeachers();
}

onMounted(() => {
  fetchTeachers();
});
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-300" dir="rtl">
    <!-- Success Floating Toast -->
    <div
      v-if="successToast"
      class="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200"
    >
      <CheckCircle2 class="w-5 h-5 shrink-0" />
      <span>{{ successToast }}</span>
    </div>

    <!-- Page Header Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-7 text-white shadow-lg shadow-blue-600/10">
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-2 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold">
            <Users class="w-3.5 h-3.5" />
            <span>المرحلة 03-A: سجل الكادر التعليمي</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black font-display tracking-tight">
            إدارة ملفات الكادر التعليمي
          </h2>
          <p class="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
            حصر وتوثيق بيانات المعلمين، التخصصات العلمية، توليد الرموز المؤسسية الموحدة (TCH-XXXX)، والتحكم بحالات الحسابات.
          </p>
        </div>

        <button
          @click="openCreateDrawer"
          class="px-5 py-3 rounded-2xl bg-white text-blue-600 hover:bg-white/90 font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 self-start md:self-auto hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>إضافة معلم جديد</span>
        </button>
      </div>

      <!-- Decorative Circles -->
      <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="p-4 rounded-2xl bg-[var(--bx-surface-solid)] border border-bx-border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <!-- Search -->
        <div class="relative flex-1 sm:w-64">
          <Search class="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-bx-muted" />
          <input
            v-model="search"
            type="text"
            placeholder="بحث بالاسم أو الكود (TCH-...)"
            class="w-full pl-3 pr-9 py-2 rounded-xl bg-[var(--bx-canvas)] border border-bx-border text-xs text-bx-title placeholder:text-bx-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
        </div>

        <!-- Specialization -->
        <div class="relative flex-1 sm:w-48">
          <BookOpen class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-bx-muted" />
          <input
            v-model="specialization"
            type="text"
            placeholder="فلترة بالتخصص..."
            class="w-full pl-3 pr-9 py-2 rounded-xl bg-[var(--bx-canvas)] border border-bx-border text-xs text-bx-title placeholder:text-bx-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
        </div>

        <!-- Status Filter -->
        <div class="relative">
          <select
            v-model="isActiveFilter"
            class="px-3.5 py-2 rounded-xl bg-[var(--bx-canvas)] border border-bx-border text-xs text-bx-title font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">كافة الحسابات</option>
            <option value="1">حسابات نشطة فقط</option>
            <option value="0">حسابات معطلة</option>
          </select>
        </div>

        <button
          v-if="search || specialization || isActiveFilter"
          @click="search = ''; specialization = ''; isActiveFilter = '';"
          class="px-3 py-2 rounded-xl text-xs text-bx-muted hover:text-bx-title hover:bg-[var(--bx-pill)] font-medium transition-colors"
        >
          مسح التصفية
        </button>
      </div>

      <div class="text-xs text-bx-muted font-medium self-end lg:self-auto">
        إجمالي المعلمين: <span class="font-bold text-bx-title font-mono">{{ meta.total }}</span>
      </div>
    </div>

    <!-- Error State Banner -->
    <div
      v-if="error"
      class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ error }}</span>
      </div>
      <button
        @click="fetchTeachers"
        class="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>إعادة المحاولة</span>
      </button>
    </div>

    <!-- Table Container -->
    <div class="rounded-3xl bg-[var(--bx-surface-solid)] border border-bx-border shadow-sm overflow-hidden">
      <!-- Loading Skeleton State -->
      <div v-if="isLoading" class="p-6 space-y-4">
        <div v-for="i in 5" :key="i" class="h-12 bg-gray-200/60 dark:bg-gray-800/40 rounded-2xl animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="teachers.length === 0"
        class="p-12 text-center space-y-4"
      >
        <div class="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
          <Users class="w-8 h-8" />
        </div>
        <div class="space-y-1">
          <h4 class="text-base font-bold text-bx-title">لا يوجد معلمون مسجلون</h4>
          <p class="text-xs text-bx-muted max-w-sm mx-auto">
            لا توجد سجلات تطابق محددات البحث الحالية أو لم يتم تسجيل معلمين بعد.
          </p>
        </div>
        <button
          @click="openCreateDrawer"
          class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>إضافة أول معلم</span>
        </button>
      </div>

      <!-- Success Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead class="bg-[var(--bx-canvas)] text-bx-muted font-bold border-b border-bx-border">
            <tr>
              <th class="p-4 w-14 text-center">#</th>
              <th class="p-4">الرمز الموحد</th>
              <th class="p-4">اسم المعلم الرباعي</th>
              <th class="p-4">التخصص العلمي</th>
              <th class="p-4">رقم الهاتف</th>
              <th class="p-4">تاريخ التعيين</th>
              <th class="p-4 text-center">حالة الحساب</th>
              <th class="p-4 text-center w-32">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bx-border">
            <tr
              v-for="t in teachers"
              :key="t.id"
              class="hover:bg-[var(--bx-canvas)]/60 transition-colors group"
            >
              <td class="p-4 text-center font-mono text-bx-muted">{{ t.id }}</td>
              <td class="p-4">
                <span class="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono font-bold text-[11px]">
                  {{ t.user_code }}
                </span>
              </td>
              <td class="p-4 font-bold text-bx-title">{{ t.full_name }}</td>
              <td class="p-4">
                <span v-if="t.specialization" class="px-2.5 py-0.5 rounded-lg bg-[var(--bx-pill)] text-bx-title font-medium">
                  {{ t.specialization }}
                </span>
                <span v-else class="text-bx-muted/60">—</span>
              </td>
              <td class="p-4 font-mono" dir="ltr">{{ t.phone || '—' }}</td>
              <td class="p-4 font-mono text-bx-muted">{{ t.hire_date || '—' }}</td>
              <td class="p-4 text-center">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  :class="t.is_active === 1 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'"
                >
                  {{ t.is_active === 1 ? 'نشط' : 'معطل' }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-1">
                  <!-- View Profile -->
                  <button
                    @click="openProfileDrawer(t)"
                    title="معاينة الملف"
                    class="p-1.5 rounded-lg text-bx-muted hover:text-blue-600 hover:bg-blue-500/10 transition-colors cursor-pointer"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <!-- Edit -->
                  <button
                    @click="openEditDrawer(t)"
                    title="تعديل البيانات"
                    class="p-1.5 rounded-lg text-bx-muted hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <!-- Delete -->
                  <button
                    @click="openDeleteModal(t)"
                    title="حذف المعلم"
                    class="p-1.5 rounded-lg text-bx-muted hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 class="w-4 h-4" />
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
        class="p-4 border-t border-bx-border bg-[var(--bx-canvas)] flex items-center justify-between gap-4"
      >
        <div class="text-xs text-bx-muted">
          الصفحة <span class="font-bold text-bx-title">{{ meta.current_page }}</span> من <span class="font-bold text-bx-title">{{ meta.last_page }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            :disabled="currentPage <= 1"
            @click="currentPage--"
            class="p-1.5 rounded-lg border border-bx-border hover:bg-[var(--bx-pill)] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
            v-for="p in meta.last_page"
            :key="p"
            @click="currentPage = p"
            class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer"
            :class="p === currentPage ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-[var(--bx-pill)] text-bx-muted'"
          >
            {{ p }}
          </button>
          <button
            :disabled="currentPage >= meta.last_page"
            @click="currentPage++"
            class="p-1.5 rounded-lg border border-bx-border hover:bg-[var(--bx-pill)] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Subcomponents -->
    <TeacherProfileDrawer
      :is-open="isProfileDrawerOpen"
      :teacher="selectedTeacher"
      @close="isProfileDrawerOpen = false"
    />

    <TeacherFormDrawer
      :is-open="isFormDrawerOpen"
      :teacher="selectedTeacher"
      @close="isFormDrawerOpen = false"
      @saved="onSaved"
    />

    <TeacherDeleteModal
      :is-open="isDeleteModalOpen"
      :teacher="selectedTeacher"
      @close="isDeleteModalOpen = false"
      @deleted="onDeleted"
    />
  </div>
</template>
