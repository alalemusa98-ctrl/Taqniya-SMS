<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { KeyRound, LogOut, ChevronDown, Clock } from 'lucide-vue-next';
import ChangePasswordModal from '../modals/ChangePasswordModal.vue';
import LogoutConfirmModal from '../modals/LogoutConfirmModal.vue';

const authStore = useAuthStore();

const isOpen = ref(false);
const showChangePasswordModal = ref(false);
const showLogoutModal = ref(false);

const getRoleBadge = (role?: string) => {
  switch (role) {
    case 'admin':
      return { text: 'مدير النظام', class: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200' };
    case 'teacher':
      return { text: 'معلم', class: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200' };
    case 'student':
      return { text: 'طالب', class: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200' };
    case 'parent':
      return { text: 'ولي أمر', class: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200' };
    default:
      return { text: 'مستخدم', class: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
};
</script>

<template>
  <div class="relative" v-if="authStore.user">
    <!-- Trigger Button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-3 p-1.5 pe-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
    >
      <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
        {{ authStore.user.user_code.substring(0, 3) }}
      </div>
      <div class="text-start hidden sm:block">
        <p class="text-xs font-bold text-slate-900 dark:text-white font-mono">{{ authStore.user.user_code }}</p>
        <span class="text-[10px] px-1.5 py-0.5 rounded border inline-block" :class="getRoleBadge(authStore.user.role_type).class">
          {{ getRoleBadge(authStore.user.role_type).text }}
        </span>
      </div>
      <ChevronDown class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40"
    ></div>

    <div
      v-if="isOpen"
      class="absolute end-0 mt-2 w-64 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- User Info Header -->
      <div class="p-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{{ authStore.user.user_code }}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full border" :class="getRoleBadge(authStore.user.role_type).class">
            {{ getRoleBadge(authStore.user.role_type).text }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
          <Clock class="w-3.5 h-3.5" />
          <span>آخر دخول: {{ authStore.user.last_login_at ? new Date(authStore.user.last_login_at).toLocaleTimeString('ar-EG') : 'الآن' }}</span>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="py-1 space-y-0.5">
        <button
          @click="showChangePasswordModal = true; isOpen = false"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-start"
        >
          <KeyRound class="w-4 h-4 text-slate-400" />
          <span>تغيير كلمة المرور</span>
        </button>

        <button
          @click="showLogoutModal = true; isOpen = false"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-start"
        >
          <LogOut class="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <ChangePasswordModal
      :is-open="showChangePasswordModal"
      @close="showChangePasswordModal = false"
    />

    <LogoutConfirmModal
      :is-open="showLogoutModal"
      @close="showLogoutModal = false"
    />
  </div>
</template>
