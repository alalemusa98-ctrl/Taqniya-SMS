<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import HeaderUserDropdown from '../components/layout/HeaderUserDropdown.vue';
import { Users, ShieldCheck } from 'lucide-vue-next';

const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-slate-50/80 dark:bg-slate-950 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" dir="rtl">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo & Navigation Links -->
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-600/20">
              🎓
            </div>
            <div>
              <h1 class="text-sm font-black text-slate-900 dark:text-white">تقنية SMS</h1>
              <p class="text-[10px] text-slate-400">بوابة الإدارة الموحدة</p>
            </div>
          </div>

          <!-- Nav Items -->
          <nav v-if="authStore.isAdmin" class="hidden md:flex items-center gap-1.5">
            <RouterLink
              to="/users"
              active-class="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
              class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Users class="w-4 h-4" />
              <span>إدارة المستخدمين</span>
            </RouterLink>

            <RouterLink
              to="/audit-logs"
              active-class="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
              class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ShieldCheck class="w-4 h-4" />
              <span>سجلات التدقيق</span>
            </RouterLink>
          </nav>
        </div>

        <!-- User Controls -->
        <div class="flex items-center gap-3">
          <HeaderUserDropdown />
        </div>
      </div>
    </header>

    <!-- Main View Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <!-- Global Footer -->
    <footer class="border-t border-slate-200/60 dark:border-slate-800/80 py-4 text-center text-xs text-slate-400 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
      &copy; 2026 Taqniya-SMS — نظام إدارة المدارس المتكامل (Taqniya AI Framework v1.0)
    </footer>
  </div>
</template>
