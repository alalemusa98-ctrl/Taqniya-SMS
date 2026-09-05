<script setup lang="ts">
import { ref } from 'vue'

const systemTitle = ref('نظام إدارة المدارس الذكي — Taqniya-SMS')
const userCode = ref('')
const password = ref('')
</script>

<template>
  <main class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 sm:p-12 selection:bg-indigo-600 selection:text-white">
    <!-- Header -->
    <header class="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-200/80 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
          🎓
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900 dark:text-white font-sans">{{ systemTitle }}</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">المنصة الموحدة لإدارة العمليات الأكاديمية والتربوية</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 me-1.5 animate-pulse"></span>
          الأنظمة متصلة ومستقرة
        </span>
      </div>
    </header>

    <!-- Content / Hero Card (Spatial UI) -->
    <section class="max-w-md w-full mx-auto my-12">
      <div class="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-xl rounded-2xl p-8 space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">تسجيل الدخول الموحد</h2>
          <p class="text-sm text-slate-500">أدخل الرمز المؤسسي الموحد (ADM-, TCH-, STU-, PAR-)</p>
        </div>

        <form @submit.prevent class="space-y-4">
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">رمز المستخدم الموحد</label>
            <input
              v-model="userCode"
              type="text"
              placeholder="مثال: TCH-2005 أو STU-3042"
              class="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">كلمة المرور</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            class="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            دخول إلى المنظومة
          </button>
        </form>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p class="text-xs text-slate-400">
            مشروع مدعوم بمعايير إطار عمل تقنية (Taqniya Framework v1.0)
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="text-center text-xs text-slate-400 py-4">
      &copy; 2026 Taqniya-SMS — جميع الحقوق محفوظة
    </footer>
  </main>
</template>
