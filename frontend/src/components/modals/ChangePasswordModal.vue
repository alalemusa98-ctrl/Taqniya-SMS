<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '../../api/auth.api';
import { X, Lock, CheckCircle2, AlertCircle } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

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
    errorMessage.value = 'تأكيد كلمة المرور غير مطابق.';
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
      successMessage.value = 'تم تحديث كلمة المرور بنجاح!';
      currentPassword.value = '';
      newPassword.value = '';
      newPasswordConfirmation.value = '';
      setTimeout(() => {
        emit('close');
        successMessage.value = '';
      }, 1200);
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'فشل تحديث كلمة المرور.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div class="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">تغيير كلمة المرور</h3>
              <p class="text-xs text-slate-500">قم بإدخال كلمة المرور الحالية والجديدة</p>
            </div>
          </div>
          <button @click="emit('close')" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Alerts -->
        <div v-if="errorMessage" class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">كلمة المرور الحالية</label>
            <input
              v-model="currentPassword"
              type="password"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">كلمة المرور الجديدة</label>
            <input
              v-model="newPassword"
              type="password"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">تأكيد كلمة المرور الجديدة</label>
            <input
              v-model="newPasswordConfirmation"
              type="password"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {{ isLoading ? 'جاري الحفظ...' : 'تحديث كلمة المرور' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
