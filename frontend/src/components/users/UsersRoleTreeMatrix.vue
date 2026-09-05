<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usersApi } from '../../api/users.api';
import { Search, Eye, KeyRound, UserX, UserCheck, Shield, GraduationCap, School, Users as UsersIcon, Clock } from 'lucide-vue-next';
import UserDetailsDrawer from './UserDetailsDrawer.vue';
import UserStatusModal from './UserStatusModal.vue';
import ResetPasswordModal from '../modals/ResetPasswordModal.vue';

const roleGroups = ref<any[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedRole = ref('');
const selectedStatus = ref('');

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
    case 'admin': return 'border-purple-500/20 bg-purple-500/5 text-purple-600';
    case 'teacher': return 'border-blue-500/20 bg-blue-500/5 text-blue-600';
    case 'student': return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600';
    default: return 'border-amber-500/20 bg-amber-500/5 text-amber-600';
  }
};
</script>

<template>
  <div class="space-y-8" dir="rtl">
    <!-- Header & Action Bar -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">إدارة حسابات المستخدمين</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          مصفوفة الأدوار الشجرية والتحكم في الحالات وإعادة تعيين كلمات المرور
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div class="relative flex-1 md:w-64">
          <input
            v-model="searchQuery"
            @input="loadUsers"
            type="text"
            placeholder="بحث بالرمز المؤسسي..."
            class="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/40 outline-none"
          />
          <Search class="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
        </div>

        <select
          v-model="selectedRole"
          @change="loadUsers"
          class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">جميع الأدوار</option>
          <option value="admin">مديرو النظام</option>
          <option value="teacher">المعلمون</option>
          <option value="student">الطلاب</option>
          <option value="parent">أولياء الأمور</option>
        </select>

        <select
          v-model="selectedStatus"
          @change="loadUsers"
          class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">كافة الحالات</option>
          <option value="1">نشط</option>
          <option value="0">معطل</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="h-64 rounded-3xl bg-slate-200/50 dark:bg-slate-800/40 animate-pulse"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="roleGroups.length === 0 || roleGroups.every(g => g.users.length === 0)" class="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
      <UsersIcon class="w-12 h-12 text-slate-400 mx-auto opacity-40" />
      <h3 class="text-base font-bold text-slate-700 dark:text-slate-300">لا يوجد مستخدمون يطابقون محددات البحث</h3>
      <p class="text-xs text-slate-400">جرب تغيير محددات التصفية أو مسح حقل البحث</p>
    </div>

    <!-- Role-Tree Matrix Cards -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div
        v-for="group in roleGroups"
        :key="group.role_type"
        class="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm p-6 space-y-4"
      >
        <!-- Card Header -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center border" :class="getRoleTheme(group.role_type)">
              <component :is="getRoleIcon(group.role_type)" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ group.role_title_ar }}</h3>
              <p class="text-[11px] text-slate-400 font-mono">{{ group.role_type.toUpperCase() }}</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold border" :class="getRoleTheme(group.role_type)">
            {{ group.users_count }} حسابات
          </span>
        </div>

        <!-- Users Table in Role Card -->
        <div class="overflow-x-auto">
          <table class="w-full text-start text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-800/50">
                <th class="py-2.5 px-3 font-semibold text-start">#</th>
                <th class="py-2.5 px-3 font-semibold text-start">الرمز المؤسسي</th>
                <th class="py-2.5 px-3 font-semibold text-start">الحالة</th>
                <th class="py-2.5 px-3 font-semibold text-start">آخر دخول</th>
                <th class="py-2.5 px-3 font-semibold text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/40">
              <tr v-for="user in group.users" :key="user.id" class="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-3 text-slate-400 font-mono">{{ user.id }}</td>
                <td class="py-3 px-3 font-bold font-mono text-slate-800 dark:text-slate-200">{{ user.user_code }}</td>
                <td class="py-3 px-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                    :class="user.is_active === 1
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="user.is_active === 1 ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                    {{ user.is_active === 1 ? 'نشط' : 'معطل' }}
                  </span>
                </td>
                <td class="py-3 px-3 text-slate-500 text-[11px]">
                  <span v-if="user.last_login_at" class="flex items-center gap-1">
                    <Clock class="w-3 h-3 text-slate-400" />
                    {{ new Date(user.last_login_at).toLocaleDateString('ar-EG') }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="py-3 px-3 text-end">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click="openDetails(user)"
                      title="معاينة التفاصيل"
                      class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="openStatusToggle(user)"
                      :title="user.is_active === 1 ? 'إيقاف الحساب' : 'تفعيل الحساب'"
                      class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      :class="user.is_active === 1 ? 'text-slate-500 hover:text-rose-600' : 'text-slate-500 hover:text-emerald-600'"
                    >
                      <UserX v-if="user.is_active === 1" class="w-4 h-4" />
                      <UserCheck v-else class="w-4 h-4" />
                    </button>
                    <button
                      @click="openResetPassword(user)"
                      title="إعادة تعيين كلمة المرور"
                      class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors"
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
      @updated="loadUsers"
    />

    <ResetPasswordModal
      :is-open="isResetPasswordModalOpen"
      :user="selectedUser"
      @close="isResetPasswordModalOpen = false"
      @updated="loadUsers"
    />
  </div>
</template>
