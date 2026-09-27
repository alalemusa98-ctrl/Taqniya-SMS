<script setup lang="ts">
import { ref, watch } from 'vue';
import { usersApi } from '../../api/users.api';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', user: any): void;
}>();

const userCode = ref('');
const password = ref('');
const confirmPassword = ref('');
const isActive = ref(1);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const resetForm = () => {
  userCode.value = '';
  password.value = '';
  confirmPassword.value = '';
  isActive.value = 1;
  showPassword.value = false;
  showConfirmPassword.value = false;
  errorMessage.value = '';
  successMessage.value = '';
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      resetForm();
    }
  },
);

const handleCreate = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validation
  const trimmedCode = userCode.value.trim();
  if (trimmedCode && !/^ADM-[A-Za-z0-9_-]{3,20}$/.test(trimmedCode)) {
    errorMessage.value = 'الرمز المؤسسي يجب أن يبدأ بـ ADM- متبوعاً بأرقام أو أحرف صالحة (مثال: ADM-1002).';
    return;
  }

  if (!password.value) {
    errorMessage.value = 'يرجى إدخال كلمة المرور.';
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = 'كلمة المرور يجب ألا تقل عن 8 خانات.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة المحاولة.';
    return;
  }

  isLoading.value = true;
  try {
    const res = await usersApi.createAdminUser({
      user_code: trimmedCode || undefined,
      password: password.value,
      is_active: isActive.value,
    });

    if (res.data.success) {
      successMessage.value = res.data.message || 'تم إنشاء حساب مدير النظام بنجاح.';
      emit('created', res.data.data);
      setTimeout(() => {
        emit('close');
      }, 1000);
    } else {
      errorMessage.value = res.data.message || 'تعذر إنشاء الحساب، يرجى التحقق من البيانات.';
    }
  } catch (err: any) {
    console.error('Failed to create admin user:', err);
    errorMessage.value = err.response?.data?.message || 'حدث خطأ أثناء محاولة إنشاء حساب مدير النظام.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    title="إضافة مدير نظام جديد"
    subtitle="إنشاء حساب إداري ذو صلاحيات عليا للتحكم بالمنظومة"
    :icon="ShieldCheck"
    max-width="max-w-[520px]"
    @close="emit('close')"
  >
    <div class="space-y-5" dir="rtl">
      <!-- 1. Security Directive Notice (Strict SSoT Framework Requirement) -->
      <div class="p-4 rounded-2xl bg-purple-500/[0.08] dark:bg-purple-900/25 border border-purple-400/30 text-xs space-y-2">
        <div class="flex items-center gap-2 font-black text-bx-primary">
          <Info class="w-4 h-4 shrink-0 text-bx-primary" />
          <span>تنبيه أمني وإداري خاص بالصلاحيات:</span>
        </div>
        <p class="text-bx-title font-medium leading-relaxed">
          هذا القسم مخصص حصرياً لإنشاء وتعيين <strong>مدراء النظام (Admins)</strong>. أما حسابات المعلمين والطلاب وأولياء الأمور فيتم توليدها تلقائياً عند إضافتهم من شاشاتهم المخصصة.
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in"
      >
        <ShieldAlert class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Success Alert -->
      <div
        v-if="successMessage"
        class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in"
      >
        <CheckCircle2 class="w-4 h-4 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleCreate" class="space-y-4">
        <!-- Field 1: User Code -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-bx-title">
              الرمز المؤسسي لمدير النظام <span class="text-bx-muted font-normal">(اختياري)</span>
            </label>
            <span class="text-[10.5px] text-bx-primary font-bold flex items-center gap-1">
              <Sparkles class="w-3 h-3" />
              <span>توليد تلقائي إن ترك فارغاً</span>
            </span>
          </div>
          <div class="relative">
            <input
              v-model="userCode"
              type="text"
              placeholder="مثال: ADM-1002"
              class="w-full px-4 py-2.5 rounded-2xl border border-bx-border bg-bx-surface text-xs font-bold text-bx-title placeholder:text-bx-muted placeholder:font-normal focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
          </div>
          <p class="text-[10.5px] text-bx-muted font-medium">
            يجب أن يبدأ بـ <code>ADM-</code>. في حال تركه فارغاً سيقوم النظام بتوليد رمز تسلسلي متاح تلقائياً.
          </p>
        </div>

        <!-- Field 2: Password -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            كلمة المرور الابتدائية <span class="text-rose-500">*</span>
          </label>
          <div class="relative flex items-center">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="8 خانات على الأقل..."
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-bx-border bg-bx-surface text-xs font-bold text-bx-title placeholder:text-bx-muted placeholder:font-normal focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute left-3 text-bx-muted hover:text-bx-title cursor-pointer transition-colors"
              title="عرض/إخفاء كلمة المرور"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
          <div class="flex items-center gap-2 pt-0.5">
            <span
              class="h-1 flex-1 rounded-full transition-all duration-300"
              :class="password.length >= 8 ? 'bg-emerald-500' : password.length > 0 ? 'bg-amber-500' : 'bg-bx-border'"
            ></span>
            <span class="text-[10px] text-bx-muted font-mono font-bold">
              {{ password.length >= 8 ? 'قوية ومطابقة' : 'الحد الأدنى 8 خانات' }}
            </span>
          </div>
        </div>

        <!-- Field 3: Confirm Password -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            تأكيد كلمة المرور <span class="text-rose-500">*</span>
          </label>
          <div class="relative flex items-center">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="إعادة إدخال كلمة المرور..."
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-bx-border bg-bx-surface text-xs font-bold text-bx-title placeholder:text-bx-muted placeholder:font-normal focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute left-3 text-bx-muted hover:text-bx-title cursor-pointer transition-colors"
              title="عرض/إخفاء كلمة المرور"
            >
              <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
          <p
            v-if="confirmPassword && password !== confirmPassword"
            class="text-[10.5px] text-rose-500 font-bold"
          >
            كلمتا المرور غير متطابقتين.
          </p>
        </div>

        <!-- Field 4: Initial Account Status -->
        <div class="space-y-2 pt-2 border-t border-bx-divider">
          <label class="block text-xs font-bold text-bx-title">حالة الحساب المبدئية</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="isActive = 1"
              class="p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              :class="isActive === 1
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'border-bx-border text-bx-muted hover:border-bx-primary'"
            >
              <UserCheck class="w-4 h-4" />
              <span>نشط ومفعل</span>
            </button>

            <button
              type="button"
              @click="isActive = 0"
              class="p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              :class="isActive === 0
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40 shadow-xs'
                : 'border-bx-border text-bx-muted hover:border-bx-primary'"
            >
              <ShieldAlert class="w-4 h-4" />
              <span>معطل مؤقتاً</span>
            </button>
          </div>
        </div>

        <!-- Drawer Action Buttons -->
        <div class="pt-4 flex items-center gap-3 border-t border-bx-divider">
          <button
            type="submit"
            :disabled="isLoading"
            class="bx-btn bx-btn-primary flex-1 py-2.5 text-xs font-bold"
          >
            <ShieldCheck v-if="!isLoading" class="w-4 h-4" />
            <span v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب مدير النظام' }}</span>
          </button>

          <button
            type="button"
            @click="emit('close')"
            :disabled="isLoading"
            class="bx-btn bx-btn-outline py-2.5 px-5 text-xs font-bold"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  </TaqniyaDrawer>
</template>
