<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { KeyRound, LogOut, ChevronDown, Clock } from 'lucide-vue-next';
import ChangePasswordModal from '../modals/ChangePasswordModal.vue';
import LogoutConfirmModal from '../modals/LogoutConfirmModal.vue';
import { formatTime } from '../../utils/formatters';

const authStore = useAuthStore();

const isOpen = ref(false);
const showChangePasswordModal = ref(false);
const showLogoutModal = ref(false);

const getRoleBadge = (role?: string) => {
  switch (role) {
    case 'admin':
      return { text: 'مدير النظام', class: 'bg-purple-500/10 text-purple-600 border-purple-500/30' };
    case 'teacher':
      return { text: 'معلم', class: 'bg-blue-500/10 text-blue-600 border-blue-500/30' };
    case 'student':
      return { text: 'طالب', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
    case 'parent':
      return { text: 'ولي أمر', class: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
    default:
      return { text: 'مستخدم', class: 'bg-slate-500/10 text-slate-600 border-slate-500/30' };
  }
};
</script>

<template>
  <div class="relative" v-if="authStore.user">
    <!-- Trigger Button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-3 p-1.5 pe-3.5 rounded-full border border-bx-border bg-[var(--bx-surface-solid)] hover:border-bx-primary transition-all shadow-sm cursor-pointer"
    >
      <div class="w-8 h-8 rounded-full bg-bx-primary text-white flex items-center justify-center font-black text-xs shadow-md shadow-bx-primary/20">
        {{ authStore.user.user_code.substring(0, 3) }}
      </div>
      <div class="text-start hidden sm:block">
        <p class="text-xs font-black text-bx-title font-mono">{{ authStore.user.user_code }}</p>
        <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold inline-block" :class="getRoleBadge(authStore.user.role_type).class">
          {{ getRoleBadge(authStore.user.role_type).text }}
        </span>
      </div>
      <ChevronDown class="w-4 h-4 text-bx-muted transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Overlay backdrop -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40"
    ></div>

    <!-- Taqniya Dropdown Menu -->
    <div
      v-if="isOpen"
      class="bx-dropdown-menu end-0 start-auto mt-2 w-64 z-50 p-2 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- User Info Header -->
      <div class="p-3 border-b border-bx-border space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-xs font-black font-mono text-bx-primary">{{ authStore.user.user_code }}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold" :class="getRoleBadge(authStore.user.role_type).class">
            {{ getRoleBadge(authStore.user.role_type).text }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 text-[11px] text-bx-muted mt-2 font-bold font-mono">
          <Clock class="w-3.5 h-3.5" />
          <span>آخر دخول: {{ authStore.user.last_login_at ? formatTime(authStore.user.last_login_at) : 'الآن' }}</span>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="py-1 space-y-0.5">
        <div
          @click="showChangePasswordModal = true; isOpen = false"
          class="bx-dropdown-item flex items-center gap-2.5 text-xs font-bold text-bx-title rounded-xl"
        >
          <KeyRound class="w-4 h-4 text-bx-muted" />
          <span>تغيير كلمة المرور</span>
        </div>

        <div
          @click="showLogoutModal = true; isOpen = false"
          class="bx-dropdown-item flex items-center gap-2.5 text-xs font-bold text-bx-danger rounded-xl hover:bg-rose-500/10"
        >
          <LogOut class="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </div>
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
