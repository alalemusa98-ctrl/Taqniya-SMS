<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import HeaderUserDropdown from '../components/layout/HeaderUserDropdown.vue';
import ThemeToggle from '../components/layout/ThemeToggle.vue';
import { Users, ShieldCheck, Layers, GraduationCap } from 'lucide-vue-next';

const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-[var(--bx-canvas)] text-bx-text flex flex-col font-sans antialiased selection:bg-bx-primary selection:text-white" dir="rtl">
    <!-- Main Navigation Header Bar (Taqniya Framework Specification) -->
    <header class="sticky top-0 z-40 bg-[var(--bx-surface-solid)]/90 backdrop-blur-xl border-b border-bx-border">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-bx-primary to-purple-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-bx-primary/20">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <h1 class="font-display font-black text-base sm:text-lg text-bx-title leading-tight">تقنية SMS</h1>
              <p class="text-[11px] text-bx-muted font-bold">بوابة الإدارة المدرسية الموحدة</p>
            </div>
          </div>

          <!-- Nav Items -->
          <nav v-if="authStore.isAdmin" class="hidden md:flex items-center gap-2">
            <RouterLink
              to="/users"
              active-class="!bg-bx-primary !text-white shadow-md shadow-bx-primary/30 font-black"
              class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-pill)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Users class="w-4 h-4" />
              <span>إدارة المستخدمين</span>
            </RouterLink>

            <RouterLink
              to="/academic-structure"
              active-class="!bg-bx-primary !text-white shadow-md shadow-bx-primary/30 font-black"
              class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-pill)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <GraduationCap class="w-4 h-4" />
              <span>الهيكل الأكاديمي</span>
            </RouterLink>

            <RouterLink
              to="/audit-logs"
              active-class="!bg-bx-primary !text-white shadow-md shadow-bx-primary/30 font-black"
              class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-pill)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <ShieldCheck class="w-4 h-4" />
              <span>سجلات التدقيق الأمني</span>
            </RouterLink>
          </nav>
        </div>

        <!-- Controls: Theme Toggle + User Dropdown -->
        <div class="flex items-center gap-3">
          <ThemeToggle />
          <HeaderUserDropdown />
        </div>
      </div>
    </header>

    <!-- Main View Content -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <router-view />
    </main>

    <!-- Global Footer -->
    <footer class="border-t border-bx-border py-4 text-center text-xs text-bx-muted font-bold bg-[var(--bx-surface-solid)]">
      &copy; 2026 Taqniya-SMS — نظام إدارة المدارس المتكامل (Taqniya Framework Design System v3.0)
    </footer>
  </div>
</template>
