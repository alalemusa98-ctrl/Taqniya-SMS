<script setup lang="ts">
import { useTheme } from '../../composables/useTheme';
import { Sun, Moon } from 'lucide-vue-next';

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    @click="toggleTheme"
    title="تبديل الوضع (داكن / فاتح)"
    class="relative p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center"
  >
    <Sun v-if="isDark" class="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
    <Moon v-else class="w-4 h-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
  </button>
</template>
