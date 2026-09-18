<script setup lang="ts">
import { ref, watch } from 'vue';
import { usersApi } from '../../api/users.api';
import { useToast } from '../../composables/useToast';
import { AlertTriangle, UserX, UserCheck } from 'lucide-vue-next';
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
  <TaqniyaModal
    :is-open="isOpen"
    :title="newStatus === 0 ? 'إيقاف وتعطيل الحساب' : 'إعادة تفعيل الحساب'"
    :subtitle="user?.user_code ? `للمستخدم: ${user.user_code}` : ''"
    max-width="md"
    @close="emit('close')"
  >
    <template #icon>
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
        :class="newStatus === 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'"
      >
        <UserX v-if="newStatus === 0" class="w-5 h-5" />
        <UserCheck v-else class="w-5 h-5" />
      </div>
    </template>

    <!-- Warning if Disabling -->
    <div v-if="newStatus === 0" class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
      <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
      <p>تنبيه أمني: تعطيل الحساب سيقوم بشطب كافة التوكنات والجلسات النشطة للمستخدم فورياً وإخراجه من النظام.</p>
    </div>

    <!-- Alerts -->
    <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold">
      {{ successMessage }}
    </div>

    <!-- Form -->
    <form @submit.prevent="handleToggle" class="space-y-4">
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-bx-title">سبب الإجراء (للتوثيق بسجل التدقيق)</label>
        <textarea
          v-model="reason"
          rows="3"
          placeholder="اكتب سبب تغيير حالة الحساب..."
          class="w-full p-3 rounded-xl border border-bx-border bg-bx-surface text-xs outline-none focus:border-bx-primary text-bx-title"
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
  </TaqniyaModal>
</template>

