<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  GraduationCap,
  UserCheck,
  UserX,
  TrendingUp,
} from 'lucide-vue-next';
import { teachersApi, type Teacher, type PaginationMeta } from '../api/teachers.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';

// Feature Components (Lazy-loaded per frontend_capabilities.yaml)
const TeacherFormDrawer = defineAsyncComponent(
  () => import('../components/teachers/TeacherFormDrawer.vue'),
);
const TeacherProfileDrawer = defineAsyncComponent(
  () => import('../components/teachers/TeacherProfileDrawer.vue'),
);
const TeacherDeleteModal = defineAsyncComponent(
  () => import('../components/teachers/TeacherDeleteModal.vue'),
);

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

// Filters
const search = ref('');
const statusPill = ref<'all' | 'active' | 'inactive'>('all');
const activeSpecialization = ref<string>('all');
const currentPage = ref(1);

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawers & Modals State
const showProfileDrawer = ref(false);
const showFormDrawer = ref(false);
const showDeleteModal = ref(false);

const activeTeacher = ref<Teacher | null>(null);
const formTeacher = ref<Teacher | null>(null);
const teacherToDelete = ref<Teacher | null>(null);

// Status Toggle Handler State
const isUpdatingStatus = ref(false);

// Table Columns Specification (SSoT compliant)
const columns: TableColumn[] = [
  { key: 'index', label: '#', align: 'center', width: '60px' },
  { key: 'user_code', label: 'الرمز', align: 'start', width: '120px' },
  { key: 'full_name', label: 'المعلم والبيانات المهنية', align: 'start' },
  { key: 'specialization', label: 'التخصص العلمي', align: 'start', width: '160px' },
  { key: 'hire_date', label: 'تاريخ المباشرة', align: 'start', width: '140px' },
  { key: 'is_active', label: 'الحالة', align: 'center', width: '120px' },
  { key: 'actions', label: 'إجراءات', align: 'center', width: '160px' },
];

// Fetch teachers from backend with SWR + Request Cancellation & Deduplication
async function fetchTeachers() {
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
      {
        onRevalidate: (fresh) => {
          teachers.value = fresh.data.data;
          meta.value = fresh.data.meta;
        },
      },
    );
    teachers.value = res.data.data;
    meta.value = res.data.meta;
  } catch (err: any) {
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

// Available specializations extracted dynamically
const availableSpecializations = computed(() => {
  const set = new Set<string>();
  teachers.value.forEach((t) => {
    if (t.specialization) set.add(t.specialization.trim());
  });
  return Array.from(set);
});

// Stats Counters for KPIs
const stats = computed(() => {
  const total = meta.value.total;
  const currentTotal = teachers.value.length;
  const activeCount = teachers.value.filter((t) => t.is_active === 1).length;
  const inactiveCount = teachers.value.filter((t) => t.is_active === 0).length;
  const activePercentage = currentTotal > 0 ? Math.round((activeCount / currentTotal) * 100) : 0;
  const inactivePercentage = currentTotal > 0 ? Math.round((inactiveCount / currentTotal) * 100) : 0;
  const specCount = availableSpecializations.value.length;
  return { total, activeCount, inactiveCount, activePercentage, inactivePercentage, specCount };
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

function onPageChange(newPage: number) {
  currentPage.value = newPage;
  fetchTeachers();
}

// Action Handlers
function openDetails(teacher: Teacher) {
  activeTeacher.value = teacher;
  showProfileDrawer.value = true;
}

function openCreateDrawer() {
  formTeacher.value = null;
  showFormDrawer.value = true;
}

function openEditDrawer(teacher: Teacher) {
  formTeacher.value = teacher;
  showFormDrawer.value = true;
}

function openEditFromDetails(teacher: Teacher) {
  showProfileDrawer.value = false;
  openEditDrawer(teacher);
}

function confirmDelete(teacher: Teacher) {
  teacherToDelete.value = teacher;
  showDeleteModal.value = true;
}

function onTeacherSaved() {
  fetchTeachers();
}

async function handleToggleStatus(teacher: Teacher) {
  if (!teacher || !teacher.user_id) return;
  const nextStatus = teacher.is_active === 1 ? 0 : 1;
  const actionText = nextStatus === 0 ? 'تعطيل' : 'تفعيل';

  isUpdatingStatus.value = true;
  try {
    await teachersApi.updateStatus(
      teacher.user_id,
      nextStatus,
      nextStatus === 0 ? 'تعطيل يدوي من شاشة إدارة المعلمين' : 'إعادة تفعيل من شاشة إدارة المعلمين',
    );

    teacher.is_active = nextStatus;
    if (activeTeacher.value && activeTeacher.value.id === teacher.id) {
      activeTeacher.value.is_active = nextStatus;
    }

    toast.success(
      nextStatus === 0
        ? `تم تعطيل حساب المعلم (${teacher.full_name}) وإلغاء جلسات الدخول بنجاح.`
        : `تم إعادة تفعيل حساب المعلم (${teacher.full_name}) بنجاح.`,
    );

    await fetchTeachers();
  } catch (err: any) {
    const msg = err.response?.data?.message || `تعذر ${actionText} حساب المعلم.`;
    toast.error(msg);
  } finally {
    isUpdatingStatus.value = false;
  }
}

onMounted(() => {
  fetchTeachers();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Container Card (Unified Spatial UI Design System) -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        <!-- Card Header: Title on Right, Controls on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                سجلات الكادر التعليمي الموحدة
              </h2>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              إدارة ملفات المعلمين، التخصصات العلمية، الحسابات الموحدة (TCH-XXXX) وحالات التفعيل
            </p>
          </div>

          <!-- Controls: Add Button + Search Input + Status Pills -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Teacher Button -->
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>إضافة معلم جديد</span>
            </button>

            <!-- Search Input -->
            <div class="relative flex-1 sm:w-60">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث في المعلمين..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Status Pills -->
            <div class="flex items-center gap-1.5 p-1 rounded-full border border-bx-border bg-transparent">
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

        <!-- 2. مؤشرات الأداء والبطاقات (KPI Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
          <TaqniyaKpiCard
            title="إجمالي الكادر التعليمي"
            :value="stats.total"
            :icon="Users"
            variant="primary"
            badge-text="فريق التدريس"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
            :progress="100"
          />

          <TaqniyaKpiCard
            title="حسابات نشطة ومفعلة"
            :value="`${stats.activeCount} معلم`"
            :icon="CheckCircle2"
            variant="emerald"
            :badge-text="`${stats.activePercentage}%`"
            :badge-icon="UserCheck"
            :progress="stats.activePercentage"
          />

          <TaqniyaKpiCard
            title="حسابات موقوفة / معطلة"
            :value="`${stats.inactiveCount} حساب`"
            :icon="UserX"
            variant="rose"
            :badge-text="stats.inactiveCount > 0 ? 'موقوف' : 'لا يوجد'"
            :badge-icon="XCircle"
            :progress="stats.inactivePercentage"
          />

          <TaqniyaKpiCard
            title="التخصصات العلمية"
            :value="`${stats.specCount} تخصص`"
            :icon="GraduationCap"
            variant="blue"
            badge-text="تغطية المناهج"
            :badge-icon="BookOpen"
            :progress="100"
          />
        </div>

        <!-- Specialization Filter Chips -->
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

        <!-- Reusable Shared Table Component (TaqniyaTable) -->
        <TaqniyaTable
          :columns="columns"
          :items="teachers"
          :is-loading="loading"
          row-key="id"
          empty-title="لا يوجد معلمون مسجلون يطابقون محددات البحث"
          empty-subtitle="جرب تعديل محددات البحث أو إضافة معلم جديد بالمنظومة."
          :empty-icon="Users"
          loading-text="جاري تحميل واستدعاء سجلات المعلمين..."
        >
          <!-- Custom Empty State Action -->
          <template #empty>
            <div class="py-14 text-center text-bx-muted font-bold space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-bx-primary flex items-center justify-center mx-auto mb-2.5 font-black">
                <Users class="w-6 h-6" />
              </div>
              <p class="text-bx-title font-bold text-sm">لا توجد سجلات تطابق محددات البحث</p>
              <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو إضافة معلم جديد بالمنظومة.</p>
              <button
                @click="openCreateDrawer"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>إضافة أول معلم</span>
              </button>
            </div>
          </template>

          <!-- Index Cell -->
          <template #cell-index="{ index }">
            <span class="font-bold text-bx-muted text-xs font-['Alexandria',sans-serif]">
              {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
            </span>
          </template>

          <!-- Code Cell -->
          <template #cell-user_code="{ item }">
            <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-[#B4AED8]/50 dark:border-white/10 text-bx-title/80">
              {{ item.user_code }}#
            </span>
          </template>

          <!-- Teacher Profile Info Cell -->
          <template #cell-full_name="{ item }">
            <div>
              <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight hover:text-bx-primary transition-colors">
                {{ item.full_name }}
              </span>
              <span v-if="item.phone" class="font-mono text-[11px] text-bx-muted block mt-0.5" dir="ltr">
                {{ item.phone }}
              </span>
            </div>
          </template>

          <!-- Specialization Cell -->
          <template #cell-specialization="{ item }">
            <span
              v-if="item.specialization"
              class="inline-block px-3 py-1 rounded-full text-[11px] font-bold border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-950/30"
            >
              {{ item.specialization }}
            </span>
            <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">—</span>
          </template>

          <!-- Hire Date Cell -->
          <template #cell-hire_date="{ item }">
            <span v-if="item.hire_date" class="inline-flex items-center gap-1.5 font-bold font-['Alexandria',sans-serif] text-xs text-bx-muted">
              <Calendar class="w-3.5 h-3.5 text-bx-primary" />
              <span>{{ item.hire_date }}</span>
            </span>
            <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">—</span>
          </template>

          <!-- Status Cell (Interactive Toggle) -->
          <template #cell-is_active="{ item }">
            <button
              @click="handleToggleStatus(item)"
              :disabled="isUpdatingStatus"
              class="inline-block px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer hover:opacity-85 disabled:opacity-50 shadow-2xs"
              :class="
                item.is_active === 1
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 dark:border-emerald-400/50'
                  : 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/40 dark:border-rose-400/50'
              "
              :title="item.is_active === 1 ? 'انقر لتعطيل الحساب' : 'انقر لتفعيل الحساب'"
            >
              <span class="inline-flex items-center gap-1.5">
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="item.is_active === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"
                ></span>
                <span>{{ item.is_active === 1 ? 'نشط' : 'معطل' }}</span>
              </span>
            </button>
          </template>

          <!-- Actions Cell -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-center gap-1.5">
              <!-- View Details Button -->
              <button
                @click="openDetails(item)"
                class="w-7 h-7 rounded-full border border-[#B4AED8] bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="معاينة الملف المهني والحساب"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>

              <!-- Toggle Status Button -->
              <button
                @click="handleToggleStatus(item)"
                :disabled="isUpdatingStatus"
                class="w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50"
                :class="
                  item.is_active === 1
                    ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white dark:border-amber-400/70 dark:bg-amber-950/80 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-400/70 dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white'
                "
                :title="item.is_active === 1 ? 'تعطيل حساب المعلم' : 'تفعيل حساب المعلم'"
              >
                <UserX v-if="item.is_active === 1" class="w-3.5 h-3.5" />
                <UserCheck v-else class="w-3.5 h-3.5" />
              </button>

              <!-- Edit Button -->
              <button
                @click="openEditDrawer(item)"
                class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="تعديل بيانات المعلم"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>

              <!-- Delete Button -->
              <button
                @click="confirmDelete(item)"
                class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="حذف ملف المعلم"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
        </TaqniyaTable>

        <!-- Reusable Shared Pagination Component (TaqniyaPagination) -->
        <TaqniyaPagination
          :current-page="meta.current_page"
          :total-pages="meta.last_page"
          :total="meta.total"
          :is-loading="loading"
          item-name="معلماً"
          @page-change="onPageChange"
        />
      </div>

      <!-- Feature Drawer: Teacher Profile Details -->
      <TeacherProfileDrawer
        :is-open="showProfileDrawer"
        :teacher="activeTeacher"
        :is-updating-status="isUpdatingStatus"
        @close="showProfileDrawer = false"
        @edit="openEditFromDetails"
        @delete="confirmDelete"
        @toggle-status="handleToggleStatus"
      />

      <!-- Feature Drawer: Create & Edit Form -->
      <TeacherFormDrawer
        :is-open="showFormDrawer"
        :teacher="formTeacher"
        @close="showFormDrawer = false"
        @saved="onTeacherSaved"
      />

      <!-- Feature Modal: Delete Confirmation (with RESTRICT protection notice) -->
      <TeacherDeleteModal
        :is-open="showDeleteModal"
        :teacher="teacherToDelete"
        @close="showDeleteModal = false"
        @deleted="fetchTeachers"
      />
    </div>
  </TaqniyaErrorBoundary>
</template>
