<script setup lang="ts">
import { ref } from 'vue';
import { usersApi } from '../../api/users.api';
import { X, KeyRound, Sparkles, Copy, Check } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  user?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const newPassword = ref('');
const isLoading = ref(false);
const isCopied = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&*';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  newPassword.value = pass;
};

const copyToClipboard = async () => {
  if (!newPassword.value) return;
  await navigator.clipboard.writeText(newPassword.value);
  isCopied.value = true;
  setTimeout(() => (isCopied.value = false), 2000);
};

const handleSubmit = async () => {
  if (!props.user) return;
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await usersApi.resetPassword(props.user.id, {
      new_password: newPassword.value,
    });

    if (res.data.success) {
      successMessage.value = res.data.message;
      emit('updated');
      setTimeout(() => {
        emit('close');
        newPassword.value = '';
        successMessage.value = '';
      }, 1200);
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'فشل إعادة تعيين كلمة المرور.';
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
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <KeyRound class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">إعادة تعيين كلمة المرور</h3>
              <p class="text-xs text-slate-400">للمستخدم: <span class="font-mono font-bold">{{ user?.user_code }}</span></p>
            </div>
          </div>
          <button @click="emit('close')" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Alerts -->
        <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs">
          {{ successMessage }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">كلمة المرور الجديدة</label>
              <button
                type="button"
                @click="generateRandomPassword"
                class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <Sparkles class="w-3.5 h-3.5" />
                <span>توليد كلمة عشوائية قوية</span>
              </button>
            </div>
            <div class="relative">
              <input
                v-model="newPassword"
                type="text"
                required
                placeholder="اكتب كلمة المرور أو ولّدها..."
                class="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                @click="copyToClipboard"
                class="absolute start-3 top-2.5 text-slate-400 hover:text-slate-600"
                title="نسخ إلى الحافظة"
              >
                <Check v-if="isCopied" class="w-4 h-4 text-emerald-500" />
                <Copy v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <p class="text-[11px] text-slate-400 leading-relaxed">
            * سيتم إبطال جميع جلسات المستخدم السابقة لإجباره على الدخول بكلمة المرور هذه.
          </p>

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
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {{ isLoading ? 'جاري التعيين...' : 'تأكيد تعيين كلمة المرور' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
