<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../composables/useToast';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const toast = useToast();

const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirmation = ref('');

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (newPassword.value !== newPasswordConfirmation.value) {
    const errorMsg = 'تأكيد كلمة المرور غير مطابق.';
    errorMessage.value = errorMsg;
    toast.warning(errorMsg, 'تنبيه إدخال');
    return;
  }

  isLoading.value = true;
  try {
    const res = await authApi.changePassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
      new_password_confirmation: newPasswordConfirmation.value,
    });

    if (res.data.success) {
      const msg = res.data.message || 'تم تحديث كلمة المرور بنجاح!';
      successMessage.value = msg;
      toast.success(msg, 'تغيير كلمة المرور');
      currentPassword.value = '';
      newPassword.value = '';
      newPasswordConfirmation.value = '';
      setTimeout(() => {
        emit('close');
        successMessage.value = '';
      }, 600);
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'فشل تحديث كلمة المرور.';
    errorMessage.value = errorMsg;
    toast.danger(errorMsg, 'خطأ في التحديث');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="تغيير كلمة المرور"
    subtitle="قم بإدخال كلمة المرور الحالية والجديدة لتأمين حسابك"
    max-width="md"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
        <Lock class="w-5 h-5" />
      </div>
    </template>

    <!-- Alerts -->
    <div v-if="errorMessage" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-bold">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="successMessage" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2 font-bold">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-bx-title">كلمة المرور الحالية</label>
        <input
          v-model="currentPassword"
          type="password"
          required
          placeholder="••••••••••••"
          class="w-full px-4 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-sm focus:border-bx-primary outline-none text-bx-title"
        />
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-bx-title">كلمة المرور الجديدة</label>
        <input
          v-model="newPassword"
          type="password"
          required
          placeholder="••••••••••••"
          class="w-full px-4 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-sm focus:border-bx-primary outline-none text-bx-title"
        />
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-bx-title">تأكيد كلمة المرور الجديدة</label>
        <input
          v-model="newPasswordConfirmation"
          type="password"
          required
          placeholder="••••••••••••"
          class="w-full px-4 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-sm focus:border-bx-primary outline-none text-bx-title"
        />
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-bx-border">
        <button
          type="button"
          @click="emit('close')"
          class="bx-btn bx-btn-outline bx-btn-md text-xs font-bold"
        >
          إلغاء
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="bx-btn bx-btn-primary bx-btn-md text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ isLoading ? 'جاري الحفظ...' : 'تحديث كلمة المرور' }}</span>
        </button>
      </div>
    </form>
  </TaqniyaModal>
</template>

