<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usersApi } from '../../api/users.api';
import {
  Search,
  Eye,
  KeyRound,
  UserX,
  UserCheck,
  Shield,
  GraduationCap,
  School,
  Users as UsersIcon,
  HeartHandshake,
  Clock,
  TrendingUp,
  LayoutGrid,
  Calendar,
  Phone,
  User as UserIcon,
  ShieldPlus,
} from 'lucide-vue-next';
import TaqniyaErrorBoundary from '../ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../ui/TaqniyaKpiCard.vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaTable, { type TableColumn } from '../ui/TaqniyaTable.vue';
import TaqniyaPagination from '../ui/TaqniyaPagination.vue';
import UserStatusModal from './UserStatusModal.vue';
import ResetPasswordModal from '../modals/ResetPasswordModal.vue';
import CreateAdminUserDrawer from './CreateAdminUserDrawer.vue';
import { formatDateTime } from '../../utils/formatters';


type TabKey = 'all' | 'admin' | 'teacher' | 'student' | 'parent';

const userTableColumns: TableColumn[] = [
  { key: 'id', label: '# الرقم', width: '70px' },
  { key: 'user_code', label: 'الرمز المؤسسي' },
  { key: 'full_name', label: 'الاسم المرتبط' },
  { key: 'role_type', label: 'نوع الحساب / الدور' },
  { key: 'is_active', label: 'حالة الحساب' },
  { key: 'last_login_at', label: 'آخر تسجيل دخول' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '130px' },
];


const activeTab = ref<TabKey>('all');
const roleGroups = ref<any[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedStatus = ref('');
const currentPage = ref(1);
const perPage = ref(15);

const meta = ref({
  current_page: 1,
  per_page: 15,
  total: 0,
  total_pages: 1,
});

const summaryCounts = ref({
  total: 0,
  admin: 0,
  teacher: 0,
  student: 0,
  parent: 0,
});

// 4 Role Tabs + All Tab (Matching Taqniya Reference System)
const userTabs = [
  {
    key: 'all' as TabKey,
    label: 'كافة الحسابات',
    icon: LayoutGrid,
    roleKey: 'total',
  },
  {
    key: 'admin' as TabKey,
    label: 'مدراء النظام',
    icon: Shield,
    roleKey: 'admin',
  },
  {
    key: 'teacher' as TabKey,
    label: 'المعلمون',
    icon: School,
    roleKey: 'teacher',
  },
  {
    key: 'student' as TabKey,
    label: 'الطلاب',
    icon: GraduationCap,
    roleKey: 'student',
  },
  {
    key: 'parent' as TabKey,
    label: 'أولياء الأمور',
    icon: HeartHandshake,
    roleKey: 'parent',
  },
];

// Modals & Drawers state
const selectedUser = ref<any>(null);
const userDetails = ref<any>(null);
const isDrawerOpen = ref(false);
const isDetailsLoading = ref(false);
const isStatusModalOpen = ref(false);
const isResetPasswordModalOpen = ref(false);
const isCreateAdminDrawerOpen = ref(false);

const handleAdminCreated = () => {
  loadUsers(1);
};

const loadUsers = async (page = 1) => {
  isLoading.value = true;
  currentPage.value = page;
  try {
    const roleParam = activeTab.value === 'all' ? undefined : activeTab.value;
    const res = await usersApi.getUsersTree({
      role_type: roleParam,
      is_active: selectedStatus.value !== '' ? Number(selectedStatus.value) : undefined,
      search: searchQuery.value.trim() || undefined,
      page: currentPage.value,
      per_page: perPage.value,
    });
    if (res.data.success) {
      roleGroups.value = res.data.data.role_types || [];
      if (res.data.data.summary_counts) {
        summaryCounts.value = res.data.data.summary_counts;
      }
      if (res.data.meta) {
        meta.value = res.data.meta;
      }
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleTabChange = (key: TabKey) => {
  activeTab.value = key;
  currentPage.value = 1;
  loadUsers(1);
};

let searchTimeout: any = null;
const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadUsers(1);
  }, 300);
};

const handleStatusFilter = (status: string) => {
  selectedStatus.value = status;
  currentPage.value = 1;
  loadUsers(1);
};

onMounted(() => {
  loadUsers();
});

const openDetails = async (user: any) => {
  selectedUser.value = user;
  isDrawerOpen.value = true;
  isDetailsLoading.value = true;
  try {
    const res = await usersApi.getUserById(user.id);
    if (res.data.success) {
      userDetails.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load user details:', err);
    userDetails.value = user;
  } finally {
    isDetailsLoading.value = false;
  }
};

const openStatusToggle = (user: any) => {
  selectedUser.value = user;
  isStatusModalOpen.value = true;
};

const openResetPassword = (user: any) => {
  selectedUser.value = user;
  isResetPasswordModalOpen.value = true;
};

const handleUserUpdated = () => {
  loadUsers(currentPage.value);
  if (selectedUser.value && isDrawerOpen.value) {
    openDetails(selectedUser.value);
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return Shield;
    case 'teacher': return School;
    case 'student': return GraduationCap;
    case 'parent': return HeartHandshake;
    default: return UsersIcon;
  }
};

const getRoleTheme = (role: string) => {
  switch (role) {
    case 'admin': return 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'teacher': return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'student': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'parent': return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    default: return 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400';
  }
};

const getRoleTitle = (role: string) => {
  switch (role) {
    case 'admin': return 'مدير نظام';
    case 'teacher': return 'معلم';
    case 'student': return 'طالب';
    case 'parent': return 'ولي أمر';
    default: return role;
  }
};

// Flatten all users from current loaded groups
const flattenedUsers = computed(() => {
  const list: any[] = [];
  for (const group of roleGroups.value) {
    for (const u of group.users || []) {
      list.push(u);
    }
  }
  return list;
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card (Matching System SSoT Design System) -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm space-y-6">

        <!-- 1. Card Header: Title on Right, Controls & Filters on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2">
          <!-- Title with Brand Accent Bar -->
          <div>
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                إدارة حسابات المستخدمين
              </h2>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              التحكم في هويات الدخول المؤسسية، الصلاحيات، الحالات، وإعادة تعيين كلمات المرور
            </p>
          </div>

          <!-- Controls: Search Input (Pill Shaped) + Status Filter Pills -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-64">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="searchQuery"
                @input="onSearchInput"
                type="text"
                placeholder="بحث بالرمز المؤسسي أو الاسم..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>

            <!-- Status Filter Pills -->
            <div class="flex items-center gap-1 p-1 rounded-full border border-bx-border bg-transparent">
              <button
                type="button"
                @click="handleStatusFilter('')"
                class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                :class="selectedStatus === '' ? 'bg-bx-primary text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                كافة الحالات
              </button>
              <button
                type="button"
                @click="handleStatusFilter('1')"
                class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                :class="selectedStatus === '1' ? 'bg-emerald-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>نشطة</span>
              </button>
              <button
                type="button"
                @click="handleStatusFilter('0')"
                class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                :class="selectedStatus === '0' ? 'bg-rose-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-title'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>معطلة</span>
              </button>
            </div>

            <!-- Add Admin User Button -->
            <button
              type="button"
              @click="isCreateAdminDrawerOpen = true"
              class="bx-btn bx-btn-primary px-4 py-2 text-xs font-bold shrink-0 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShieldPlus class="w-4 h-4" />
              <span>إضافة مدير جديد</span>
            </button>
          </div>
        </div>

        <!-- 2. KPI & Metrics Ribbon (Exact Framework Section 8 Standard) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: Total Users -->
          <TaqniyaKpiCard
            title="إجمالي حسابات المنظومة"
            :value="`${summaryCounts.total || meta.total} حساب`"
            :icon="UsersIcon"
            variant="primary"
            badge-text="الأمان والوصول"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
            :progress="100"
          />

          <!-- Card 2: Admins -->
          <TaqniyaKpiCard
            title="مدراء النظام (Admins)"
            :value="`${summaryCounts.admin} مدير`"
            :icon="Shield"
            variant="amber"
            badge-text="صلاحيات عليا"
            :badge-icon="TrendingUp"
            :progress="summaryCounts.total > 0 ? Math.round((summaryCounts.admin / summaryCounts.total) * 100) : 100"
          />

          <!-- Card 3: Teachers -->
          <TaqniyaKpiCard
            title="حسابات المعلمين"
            :value="`${summaryCounts.teacher} معلم`"
            :icon="School"
            variant="blue"
            badge-text="الكادر التدريسي"
            :badge-icon="TrendingUp"
            :progress="summaryCounts.total > 0 ? Math.round((summaryCounts.teacher / summaryCounts.total) * 100) : 100"
          />

          <!-- Card 4: Students & Parents -->
          <TaqniyaKpiCard
            title="الطلاب وأولياء الأمور"
            :value="`${summaryCounts.student + summaryCounts.parent} مستخدم`"
            :icon="GraduationCap"
            variant="emerald"
            badge-text="الطلاب والأولياء"
            :badge-icon="TrendingUp"
            :progress="summaryCounts.total > 0 ? Math.round(((summaryCounts.student + summaryCounts.parent) / summaryCounts.total) * 100) : 100"
          />
        </div>

        <!-- 3. 4 Role Tabs Ribbon (حسب نوع المستخدم - Standard Full Pill Layout) -->
        <div class="flex flex-wrap items-center gap-1.5 p-1 rounded-full border border-bx-border bg-transparent">
          <button
            v-for="tab in userTabs"
            :key="tab.key"
            type="button"
            @click="handleTabChange(tab.key)"
            class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            :class="
              activeTab === tab.key
                ? 'bg-bx-primary text-white shadow-sm font-black'
                : 'text-bx-muted hover:text-bx-title'
            "
          >
            <component :is="tab.icon" class="w-3.5 h-3.5 shrink-0" />
            <span>{{ tab.label }}</span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black"
              :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-bx-primary/10 text-bx-primary'"
            >
              {{ (summaryCounts as any)[tab.roleKey] ?? 0 }}
            </span>
          </button>
        </div>

        <!-- 4. Taqniya Shared Table & Pagination -->
        <div class="space-y-0">
          <TaqniyaTable
            :columns="userTableColumns"
            :items="flattenedUsers"
            :is-loading="isLoading"
            empty-title="لا توجد حسابات مستخدمين تطابق محددات البحث"
            empty-subtitle="جرب تغيير التبويب المختار أو مسح حقل البحث."
            :empty-icon="UsersIcon"
            loading-text="جاري استدعاء حسابات المستخدمين..."
          >
            <template #cell-id="{ item }">
              <span class="font-mono font-bold text-bx-muted">{{ item.id }}</span>
            </template>

            <template #cell-user_code="{ item }">
              <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-bx-border text-bx-title/90">
                {{ item.user_code }}
              </span>
            </template>

            <template #cell-full_name="{ item }">
              <span v-if="item.full_name" class="font-black text-xs sm:text-sm text-bx-title block leading-tight">
                {{ item.full_name }}
              </span>
              <span v-else class="text-bx-muted italic text-[11px]">
                غير معين (حساب نظام)
              </span>
            </template>

            <template #cell-role_type="{ item }">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                :class="getRoleTheme(item.role_type)"
              >
                <component :is="getRoleIcon(item.role_type)" class="w-3.5 h-3.5" />
                <span>{{ item.role_type_ar || getRoleTitle(item.role_type) }}</span>
              </span>
            </template>

            <template #cell-is_active="{ item }">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border"
                :class="item.is_active === 1
                  ? 'bg-emerald-500/10 text-bx-success border-emerald-500/20'
                  : 'bg-rose-500/10 text-bx-danger border-rose-500/20'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="item.is_active === 1 ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                <span>{{ item.is_active === 1 ? 'نشط ومفعل' : 'معطل وموقوف' }}</span>
              </span>
            </template>

            <template #cell-last_login_at="{ item }">
              <span v-if="item.last_login_at" class="font-mono text-bx-muted text-xs font-bold">
                {{ formatDateTime(item.last_login_at) }}
              </span>
              <span v-else class="text-bx-muted italic text-xs font-normal">
                لم يسجل دخول بعد
              </span>
            </template>

            <template #cell-actions="{ item }">
              <div class="flex items-center justify-center gap-1.5">
                <!-- View Details Button -->
                <button
                  type="button"
                  @click="openDetails(item)"
                  class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  title="معاينة تفاصيل الحساب"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>

                <!-- Toggle Status Button -->
                <button
                  type="button"
                  @click="openStatusToggle(item)"
                  class="w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  :class="item.is_active === 1
                    ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white'"
                  :title="item.is_active === 1 ? 'إيقاف الحساب' : 'تفعيل الحساب'"
                >
                  <UserX v-if="item.is_active === 1" class="w-3.5 h-3.5" />
                  <UserCheck v-else class="w-3.5 h-3.5" />
                </button>

                <!-- Reset Password Button -->
                <button
                  type="button"
                  @click="openResetPassword(item)"
                  class="w-7 h-7 rounded-full border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white dark:border-amber-400 dark:bg-amber-950/80 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  title="إعادة تعيين كلمة المرور إدارياً"
                >
                  <KeyRound class="w-3.5 h-3.5" />
                </button>
              </div>
            </template>
          </TaqniyaTable>

          <TaqniyaPagination
            :current-page="meta.current_page"
            :total-pages="meta.total_pages"
            :total="meta.total"
            :is-loading="isLoading"
            item-name="حساب"
            @page-change="loadUsers"
          />
        </div>
      </div>

      <!-- Standard Drawer for User Details (TaqniyaDrawer) -->
      <TaqniyaDrawer
        :is-open="isDrawerOpen"
        title="تفاصيل حساب المستخدم"
        subtitle="سجل النشاط، التوقيتات، والبيانات المرتبطة"
        :icon="UserIcon"
        @close="isDrawerOpen = false"
      >
        <template #default>
          <div v-if="isDetailsLoading" class="space-y-4 py-8">
            <div class="h-12 bg-bx-table-header rounded-xl animate-pulse"></div>
            <div class="h-24 bg-bx-table-header rounded-xl animate-pulse"></div>
            <div class="h-24 bg-bx-table-header rounded-xl animate-pulse"></div>
          </div>

          <div v-else-if="userDetails" class="space-y-6">
            <!-- Header Identity Card -->
            <div class="p-5 rounded-2xl bg-bx-table-header border border-bx-border space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-bx-muted font-bold">الرمز المؤسسي الموحد</span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-black border"
                  :class="userDetails.is_active === 1
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/30'"
                >
                  {{ userDetails.is_active === 1 ? 'نشط' : 'معطل' }}
                </span>
              </div>

              <div>
                <h4 v-if="userDetails.full_name" class="text-base font-black text-bx-title mb-1">
                  {{ userDetails.full_name }}
                </h4>
                <p class="text-xl font-black font-mono text-bx-primary tracking-wider">
                  {{ userDetails.user_code }}
                </p>
              </div>

              <div class="pt-2 flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-bx-muted font-bold">الدور:</span>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-black border"
                    :class="getRoleTheme(userDetails.role_type)"
                  >
                    {{ getRoleTitle(userDetails.role_type) }}
                  </span>
                </div>
                <div v-if="userDetails.phone" class="flex items-center gap-1.5 text-xs text-bx-muted font-mono font-bold">
                  <Phone class="w-3.5 h-3.5" />
                  <span class="text-bx-title">{{ userDetails.phone }}</span>
                </div>
              </div>
            </div>

            <!-- Activity Logs -->
            <div class="space-y-3">
              <h4 class="text-xs font-black text-bx-muted uppercase tracking-wider">سجل التوقيتات</h4>
              <div class="p-4 rounded-2xl bg-bx-table-header border border-bx-border space-y-3 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-bx-muted font-bold flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5" /> تاريخ الإنشاء:
                  </span>
                  <span class="font-mono text-bx-title font-bold">
                    {{ formatDateTime(userDetails.created_at) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-bx-muted font-bold flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5" /> آخر تسجيل دخول:
                  </span>
                  <span class="font-mono text-bx-title font-bold">
                    {{ userDetails.last_login_at ? formatDateTime(userDetails.last_login_at) : 'لم يسجل دخول بعد' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="space-y-2 w-full">
            <button
              @click="openStatusToggle(userDetails)"
              class="bx-btn bx-btn-outline bx-btn-md w-full text-xs font-bold"
            >
              <UserX v-if="userDetails?.is_active === 1" class="w-4 h-4 text-bx-danger" />
              <UserCheck v-else class="w-4 h-4 text-bx-success" />
              <span>{{ userDetails?.is_active === 1 ? 'تعطيل الحساب وإلغاء الجلسات' : 'تفعيل الحساب' }}</span>
            </button>

            <button
              @click="openResetPassword(userDetails)"
              class="bx-btn bx-btn-primary bx-btn-md w-full text-xs font-bold"
            >
              <KeyRound class="w-4 h-4" />
              <span>إعادة تعيين كلمة المرور إدارياً</span>
            </button>
          </div>
        </template>
      </TaqniyaDrawer>

      <!-- Status Modal -->
      <UserStatusModal
        :is-open="isStatusModalOpen"
        :user="selectedUser"
        @close="isStatusModalOpen = false"
        @updated="handleUserUpdated"
      />

      <!-- Reset Password Modal -->
      <ResetPasswordModal
        :is-open="isResetPasswordModalOpen"
        :user="selectedUser"
        @close="isResetPasswordModalOpen = false"
        @updated="handleUserUpdated"
      />

      <!-- Create Admin User Drawer -->
      <CreateAdminUserDrawer
        :is-open="isCreateAdminDrawerOpen"
        @close="isCreateAdminDrawerOpen = false"
        @created="handleAdminCreated"
      />
    </div>
  </TaqniyaErrorBoundary>
</template>
