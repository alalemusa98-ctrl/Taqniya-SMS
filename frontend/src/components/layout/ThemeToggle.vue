<script setup lang="ts">
import { useTheme } from '../../composables/useTheme';
import { Sun, Moon } from 'lucide-vue-next';

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    @click="toggleTheme"
    class="bx-tag text-xs font-bold hover:border-bx-primary cursor-pointer flex items-center gap-2 py-2 px-3.5 transition-all"
    title="تبديل السمة (فاتح / داكن)"
  >
    <Sun v-if="isDark" class="w-4 h-4 text-amber-400 animate-spin-slow" />
    <Moon v-else class="w-4 h-4 text-bx-primary" />
    <span class="hidden sm:inline">{{ isDark ? 'الوضع الفاتح' : 'الوضع الداكن' }}</span>
  </button>
</template>
