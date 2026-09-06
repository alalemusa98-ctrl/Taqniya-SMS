<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usersApi } from '../../api/users.api';
import { Search, Eye, KeyRound, UserX, UserCheck, Shield, GraduationCap, School, Users as UsersIcon, Clock } from 'lucide-vue-next';
import UserDetailsDrawer from './UserDetailsDrawer.vue';
import UserStatusModal from './UserStatusModal.vue';
import ResetPasswordModal from '../modals/ResetPasswordModal.vue';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import { formatDate } from '../../utils/formatters';

const roleGroups = ref<any[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedRole = ref('');
const selectedStatus = ref('');

const roleOptions = [
  { value: '', label: 'جميع الأدوار' },
  { value: 'admin', label: 'مديرو النظام' },
  { value: 'teacher', label: 'المعلمون' },
  { value: 'student', label: 'الطلاب' },
  { value: 'parent', label: 'أولياء الأمور' },
];

const statusOptions = [
  { value: '', label: 'كافة الحالات' },
  { value: '1', label: 'حسابات نشطة' },
  { value: '0', label: 'حسابات معطلة' },
];

// Modals & Drawers state
const selectedUser = ref<any>(null);
const isDrawerOpen = ref(false);
const isStatusModalOpen = ref(false);
const isResetPasswordModalOpen = ref(false);

const loadUsers = async () => {
  isLoading.value = true;
  try {
    const res = await usersApi.getUsersTree({
      role_type: selectedRole.value || undefined,
      is_active: selectedStatus.value !== '' ? Number(selectedStatus.value) : undefined,
      search: searchQuery.value || undefined,
    });
    if (res.data.success) {
      roleGroups.value = res.data.data.role_types;
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});

const openDetails = (user: any) => {
  selectedUser.value = user;
  isDrawerOpen.value = true;
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
  loadUsers();
  isDrawerOpen.value = false;
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return Shield;
    case 'teacher': return School;
    case 'student': return GraduationCap;
    default: return UsersIcon;
  }
};

const getRoleTheme = (role: string) => {
  switch (role) {
    case 'admin': return 'border-purple-500/30 bg-purple-500/10 text-purple-600';
    case 'teacher': return 'border-blue-500/30 bg-blue-500/10 text-blue-600';
    case 'student': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600';
    default: return 'border-amber-500/30 bg-amber-500/10 text-amber-600';
  }
};
</script>

<template>
  <div class="space-y-8" dir="rtl">
    <!-- Header & Action Bar -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h2 class="font-display font-black text-2xl sm:text-3xl text-bx-title">إدارة حسابات المستخدمين</h2>
        <p class="text-xs text-bx-muted font-bold mt-1">
          مصفوفة الأدوار الشجرية والتحكم في الحالات وإعادة تعيين كلمات المرور
        </p>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div class="relative flex-1 md:w-64">
          <input
            v-model="searchQuery"
            @input="loadUsers"
            type="text"
            placeholder="بحث بالرمز المؤسسي..."
            class="w-full ps-9 pe-4 py-2.5 rounded-2xl border border-bx-border bg-[var(--bx-surface-solid)] text-xs font-bold text-bx-text placeholder-bx-muted focus:border-bx-primary outline-none transition-all shadow-sm"
          />
          <Search class="w-4 h-4 text-bx-muted absolute start-3 top-3" />
        </div>

        <!-- Taqniya Dropdown Component for Roles -->
        <TaqniyaSelect
          v-model="selectedRole"
          :options="roleOptions"
          @update:model-value="loadUsers"
        />

        <!-- Taqniya Dropdown Component for Status -->
        <TaqniyaSelect
          v-model="selectedStatus"
          :options="statusOptions"
          @update:model-value="loadUsers"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="h-64 rounded-3xl bg-[var(--bx-table-header)] animate-pulse border border-bx-border"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="roleGroups.length === 0 || roleGroups.every(g => g.users.length === 0)" class="p-12 text-center rounded-3xl bg-[var(--bx-surface-solid)] border-2 border-bx-border space-y-3">
      <UsersIcon class="w-12 h-12 text-bx-muted mx-auto opacity-40" />
      <h3 class="font-display font-bold text-base text-bx-title">لا يوجد مستخدمون يطابقون محددات البحث</h3>
      <p class="text-xs text-bx-muted font-bold">جرب تغيير محددات التصفية أو مسح حقل البحث</p>
    </div>

    <!-- Role-Tree Matrix Cards -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div
        v-for="group in roleGroups"
        :key="group.role_type"
        class="bx-card p-6 space-y-4 bg-[var(--bx-surface-solid)]"
      >
        <!-- Card Header -->
        <div class="flex items-center justify-between border-b border-bx-border pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center border-2" :class="getRoleTheme(group.role_type)">
              <component :is="getRoleIcon(group.role_type)" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-display font-black text-base text-bx-title">{{ group.role_title_ar }}</h3>
              <p class="text-[11px] text-bx-muted font-mono font-bold">{{ group.role_type.toUpperCase() }}</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-black border" :class="getRoleTheme(group.role_type)">
            {{ group.users_count }} حسابات
          </span>
        </div>

        <!-- Users Table in Role Card -->
        <div class="overflow-x-auto">
          <table class="w-full text-start text-xs">
            <thead>
              <tr class="text-bx-muted border-b border-bx-border bg-[var(--bx-table-header)] rounded-xl">
                <th class="py-2.5 px-3 font-black text-start">#</th>
                <th class="py-2.5 px-3 font-black text-start">الرمز المؤسسي</th>
                <th class="py-2.5 px-3 font-black text-start">الحالة</th>
                <th class="py-2.5 px-3 font-black text-start">آخر دخول</th>
                <th class="py-2.5 px-3 font-black text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-bx-divider">
              <tr v-for="user in group.users" :key="user.id" class="hover:bg-[var(--bx-row-hover)] transition-colors">
                <td class="py-3 px-3 text-bx-muted font-mono font-bold">{{ user.id }}</td>
                <td class="py-3 px-3 font-black font-mono text-bx-title">{{ user.user_code }}</td>
                <td class="py-3 px-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border"
                    :class="user.is_active === 1
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="user.is_active === 1 ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                    {{ user.is_active === 1 ? 'نشط' : 'معطل' }}
                  </span>
                </td>
                <td class="py-3 px-3 text-bx-muted text-[11px] font-bold font-mono">
                  <span v-if="user.last_login_at" class="flex items-center gap-1">
                    <Clock class="w-3 h-3 text-bx-muted" />
                    {{ formatDate(user.last_login_at) }}
                  </span>
                  <span v-else class="text-bx-muted/60">—</span>
                </td>
                <td class="py-3 px-3 text-end">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      @click="openDetails(user)"
                      title="معاينة التفاصيل"
                      class="bx-icon-btn p-1.5 rounded-xl border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-all cursor-pointer"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="openStatusToggle(user)"
                      :title="user.is_active === 1 ? 'إيقاف الحساب' : 'تفعيل الحساب'"
                      class="bx-icon-btn p-1.5 rounded-xl border border-bx-border transition-all cursor-pointer"
                      :class="user.is_active === 1 ? 'hover:border-bx-danger text-bx-muted hover:text-bx-danger' : 'hover:border-bx-success text-bx-muted hover:text-bx-success'"
                    >
                      <UserX v-if="user.is_active === 1" class="w-4 h-4" />
                      <UserCheck v-else class="w-4 h-4" />
                    </button>
                    <button
                      @click="openResetPassword(user)"
                      title="إعادة تعيين كلمة المرور"
                      class="bx-icon-btn p-1.5 rounded-xl border border-bx-border hover:border-bx-warning text-bx-muted hover:text-bx-warning transition-all cursor-pointer"
                    >
                      <KeyRound class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Drawers & Modals -->
    <UserDetailsDrawer
      :is-open="isDrawerOpen"
      :user-id="selectedUser?.id"
      @close="isDrawerOpen = false"
      @toggle-status="openStatusToggle(selectedUser)"
      @reset-password="openResetPassword(selectedUser)"
    />

    <UserStatusModal
      :is-open="isStatusModalOpen"
      :user="selectedUser"
      @close="isStatusModalOpen = false"
      @updated="handleUserUpdated"
    />

    <ResetPasswordModal
      :is-open="isResetPasswordModalOpen"
      :user="selectedUser"
      @close="isResetPasswordModalOpen = false"
      @updated="handleUserUpdated"
    />
  </div>
</template>
