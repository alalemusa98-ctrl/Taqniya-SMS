<script setup lang="ts">
import { ref, watch } from 'vue';
import { usersApi } from '../../api/users.api';
import { useToast } from '../../composables/useToast';
import { X, AlertTriangle, UserX, UserCheck } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  user?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const toast = useToast();

const newStatus = ref(1);
const reason = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

watch(
  () => props.user,
  (val) => {
    if (val) {
      newStatus.value = val.is_active === 1 ? 0 : 1;
      reason.value = '';
      errorMessage.value = '';
      successMessage.value = '';
    }
  },
);

const handleToggle = async () => {
  if (!props.user) return;
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await usersApi.updateStatus(props.user.id, {
      is_active: newStatus.value,
      reason: reason.value || undefined,
    });

    if (res.data.success) {
      const msg = res.data.message || (newStatus.value === 1 ? 'تم تفعيل حساب المستخدم بنجاح.' : 'تم إيقاف حساب المستخدم وإلغاء كافة جلساته بنجاح.');
      successMessage.value = msg;
      toast.success(msg, newStatus.value === 1 ? 'تفعيل الحساب' : 'إيقاف الحساب');
      emit('updated');
      setTimeout(() => {
        emit('close');
        successMessage.value = '';
      }, 500);
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'فشل تحديث حالة الحساب.';
    errorMessage.value = errorMsg;
    toast.danger(errorMsg, 'خطأ في التحديث');
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
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
              :class="newStatus === 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'"
            >
              <UserX v-if="newStatus === 0" class="w-5 h-5" />
              <UserCheck v-else class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                {{ newStatus === 0 ? 'إيقاف وتعطيل الحساب' : 'إعادة تفعيل الحساب' }}
              </h3>
              <p class="text-xs text-slate-400">للمستخدم: <span class="font-mono font-bold">{{ user?.user_code }}</span></p>
            </div>
          </div>
          <button @click="emit('close')" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Warning if Disabling -->
        <div v-if="newStatus === 0" class="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
          <p>تنبيه أمني: تعطيل الحساب سيقوم بشطب كافة التوكنات والجلسات النشطة للمستخدم فورياً وإخراجه من النظام.</p>
        </div>

        <!-- Alerts -->
        <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs">
          {{ successMessage }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleToggle" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">سبب الإجراء (للتوثيق بسجل التدقيق)</label>
            <textarea
              v-model="reason"
              rows="3"
              placeholder="اكتب سبب تغيير حالة الحساب..."
              class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white"
            ></textarea>
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
              class="bx-btn bx-btn-md text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              :class="newStatus === 0 ? 'bx-btn-danger' : 'bx-btn-success'"
            >
              <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>{{ isLoading ? 'جاري المعالجة...' : (newStatus === 0 ? 'تأكيد الإيقاف' : 'تأكيد التفعيل') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
