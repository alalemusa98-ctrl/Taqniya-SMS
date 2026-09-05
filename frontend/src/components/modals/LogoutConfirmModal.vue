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
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <!-- Backdrop click handler -->
      <div class="fixed inset-0" @click="emit('close')"></div>

      <!-- Centered Modal Dialog (Using Taqniya bx-modal-card) -->
      <div
        class="relative z-10 w-full max-w-md bx-modal-card p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200"
      >
        <div class="w-16 h-16 rounded-full bg-rose-500/10 text-bx-danger mx-auto flex items-center justify-center border-2 border-bx-danger/20 shadow-lg shadow-rose-500/10">
          <LogOut class="w-8 h-8" />
        </div>

        <div class="space-y-2">
          <h3 class="font-display font-black text-xl text-bx-title">تسجيل الخروج من المنظومة</h3>
          <p class="text-xs text-bx-muted leading-relaxed font-bold">
            هل أنت متأكد من رغبتك في تسجيل الخروج؟ سيتم إبطال جلستك الحالية والعودة لشاشة تسجيل الدخول.
          </p>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="bx-btn bx-btn-outline bx-btn-md flex-1 text-xs"
          >
            إلغاء
          </button>
          <button
            type="button"
            @click="handleLogout"
            :disabled="isLoading"
            class="bx-btn bx-btn-danger bx-btn-md flex-1 text-xs"
          >
            <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ isLoading ? 'جاري الخروج...' : 'تأكيد الخروج' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
