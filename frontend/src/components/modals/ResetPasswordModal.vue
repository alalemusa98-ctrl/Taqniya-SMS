<script setup lang="ts">
import { ref } from 'vue';
import { usersApi } from '../../api/users.api';
import { useToast } from '../../composables/useToast';
import { KeyRound, Sparkles, Copy, Check } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';


const props = defineProps<{
  isOpen: boolean;
  user?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const toast = useToast();

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
      const msg = res.data.message || 'تم إعادة تعيين كلمة المرور بنجاح وإلغاء جلسات المستخدم السابقة.';
      successMessage.value = msg;
      toast.success(msg, 'إعادة تعيين كلمة المرور');
      emit('updated');
      setTimeout(() => {
        emit('close');
        newPassword.value = '';
        successMessage.value = '';
      }, 600);
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'فشل إعادة تعيين كلمة المرور.';
    errorMessage.value = errorMsg;
    toast.danger(errorMsg, 'خطأ في التعيين');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="إعادة تعيين كلمة المرور"
    :subtitle="user?.user_code ? `للمستخدم: ${user.user_code}` : ''"
    max-width="md"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
        <KeyRound class="w-5 h-5" />
      </div>
    </template>

    <!-- Alerts -->
    <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold">
      {{ successMessage }}
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-bx-title">كلمة المرور الجديدة</label>
          <button
            type="button"
            @click="generateRandomPassword"
            class="text-[11px] text-bx-primary hover:text-bx-primary-hover font-bold flex items-center gap-1 cursor-pointer"
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
            class="w-full ps-10 pe-4 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-xs font-mono outline-none focus:border-bx-primary text-bx-title"
          />
          <button
            type="button"
            @click="copyToClipboard"
            class="absolute start-3 top-2.5 text-bx-muted hover:text-bx-title cursor-pointer"
            title="نسخ إلى الحافظة"
          >
            <Check v-if="isCopied" class="w-4 h-4 text-emerald-500" />
            <Copy v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <p class="text-[11px] text-bx-muted leading-relaxed">
        * سيتم إبطال جميع جلسات المستخدم السابقة لإجباره على الدخول بكلمة المرور هذه.
      </p>

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
          <span>{{ isLoading ? 'جاري التعيين...' : 'تأكيد تعيين كلمة المرور' }}</span>
        </button>
      </div>
    </form>
  </TaqniyaModal>
</template>

