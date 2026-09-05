<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { LogOut } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(false);

const handleLogout = async () => {
  isLoading.value = true;
  await authStore.logout();
  isLoading.value = false;
  emit('close');
  router.push('/login');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 text-center" dir="rtl">
      <div class="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 mx-auto flex items-center justify-center">
        <LogOut class="w-7 h-7" />
      </div>

      <div class="space-y-2">
        <h3 class="text-base font-bold text-slate-900 dark:text-white">تسجيل الخروج من المنظومة</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          هل أنت متأكد من رغبتك في تسجيل الخروج؟ سيتم إبطال جلستك الحالية والعودة لشاشة الدخول.
        </p>
      </div>

      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          @click="emit('close')"
          class="w-full py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          إلغاء
        </button>
        <button
          type="button"
          @click="handleLogout"
          :disabled="isLoading"
          class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all"
        >
          {{ isLoading ? 'جاري الخروج...' : 'تأكيد الخروج' }}
        </button>
      </div>
    </div>
  </div>
</template>
