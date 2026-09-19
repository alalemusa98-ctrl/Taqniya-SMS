<script setup lang="ts">
import { ref, watch } from 'vue';
import { UserPlus, Users, Save, AlertCircle, Lock, Phone, BookOpen, Calendar, User, Hash } from 'lucide-vue-next';
import { teachersApi, type Teacher } from '../../api/teachers.api';
import { useToast } from '../../composables/useToast';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';

const props = defineProps<{
  isOpen: boolean;
  teacher: Teacher | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const toast = useToast();
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const fieldErrors = ref<Record<string, string[]>>({});
const datePickerInput = ref<HTMLInputElement | null>(null);

const form = ref({
  user_code: '',
  full_name: '',
  phone: '',
  specialization: '',
  hire_date: '',
  password: '',
});

function openNativeDatePicker() {
  if (datePickerInput.value) {
    try {
      datePickerInput.value.showPicker();
    } catch {
      datePickerInput.value.focus();
    }
  }
}

function onNativeDatePicked(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target && target.value) {
    form.value.hire_date = target.value;
  }
}

watch(
  () => props.teacher,
  (val) => {
    errorMessage.value = null;
    fieldErrors.value = {};
    if (val) {
      form.value = {
        user_code: val.user_code || '',
        full_name: val.full_name,
        phone: val.phone || '',
        specialization: val.specialization || '',
        hire_date: val.hire_date || '',
        password: '',
      };
    } else {
      form.value = {
        user_code: '',
        full_name: '',
        phone: '',
        specialization: '',
        hire_date: new Date().toISOString().split('T')[0],
        password: '',
      };
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.value.full_name.trim()) {
    toast.warning('يرجى إدخال اسم المعلم الرباعي.');
    return;
  }

  if (!props.teacher && (!form.value.password || form.value.password.length < 8)) {
    toast.warning('كلمة المرور يجب ألا تقل عن 8 خانات.');
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;
  fieldErrors.value = {};

  try {
    if (props.teacher) {
      // Edit PUT
      const payload: any = {
        user_code: form.value.user_code?.trim() || undefined,
        full_name: form.value.full_name,
        phone: form.value.phone || undefined,
        specialization: form.value.specialization || undefined,
        hire_date: form.value.hire_date || undefined,
      };
      if (form.value.password) {
        payload.password = form.value.password;
      }
      await teachersApi.updateTeacher(props.teacher.id, payload);
      toast.success('تم تحديث بيانات ملف المعلم بنجاح.');
    } else {
      // Create POST
      await teachersApi.createTeacher({
        user_code: form.value.user_code?.trim() || undefined,
        full_name: form.value.full_name,
        phone: form.value.phone || undefined,
        specialization: form.value.specialization || undefined,
        hire_date: form.value.hire_date || undefined,
        password: form.value.password,
      });
      toast.success('تم إنشاء ملف المعلم وتوليد حساب الدخول الموحد بنجاح.');
    }

    emit('saved');
    emit('close');
  } catch (err: any) {
    if (err.response?.data?.errors) {
      fieldErrors.value = err.response.data.errors;
    }
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات ملف المعلم.';
    errorMessage.value = msg;
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="teacher ? 'تعديل بيانات ملف المعلم' : 'إضافة معلم جديد وتوليد الحساب'"
    :subtitle="
      teacher
        ? 'تحديث البيانات الشخصية والمهنية للمعلم'
        : 'تسجيل معلم جديد وتوليد حساب الدخول الموحد ذرياً'
    "
    :icon="teacher ? Users : UserPlus"
    @close="emit('close')"
  >
    <!-- Form Body -->
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Error Notification -->
      <div
        v-if="errorMessage"
        class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- User Code / Teacher Number -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-bx-title">
          <div class="flex items-center gap-2">
            <Hash class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">الرمز المؤسسي / رقم المعلم (TCH-XXXX)</label>
          </div>
          <span class="text-[10px] text-bx-muted font-medium">
            (اختياري - سيولد تسلسلياً تلقائياً إذا تُرك فارغاً)
          </span>
        </div>
        <input
          v-model="form.user_code"
          type="text"
          dir="ltr"
          maxlength="30"
          placeholder="مثال: TCH-2002 أو 2002"
          class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono font-bold text-start"
        />
        <p v-if="fieldErrors.user_code" class="text-[11px] text-red-500 font-medium">
          {{ fieldErrors.user_code[0] }}
        </p>
      </div>

      <!-- Full Name -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 text-bx-title">
          <User class="w-4 h-4 text-bx-primary shrink-0" />
          <label class="text-xs font-bold">الاسم الرباعي واللقب للمعلم <span class="text-red-500">*</span></label>
        </div>
        <input
          v-model="form.full_name"
          type="text"
          required
          maxlength="150"
          placeholder="مثال: أحمد محمود سالم الورفلي"
          class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
        />
        <p v-if="fieldErrors.full_name" class="text-[11px] text-red-500 font-medium">
          {{ fieldErrors.full_name[0] }}
        </p>
      </div>

      <!-- Specialization -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 text-bx-title">
          <BookOpen class="w-4 h-4 text-purple-500 shrink-0" />
          <label class="text-xs font-bold">التخصص العلمي</label>
        </div>
        <input
          v-model="form.specialization"
          type="text"
          maxlength="100"
          placeholder="مثال: الرياضيات، العلوم العامة، اللغة العربية"
          class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
        />
        <p v-if="fieldErrors.specialization" class="text-[11px] text-red-500 font-medium">
          {{ fieldErrors.specialization[0] }}
        </p>
      </div>

      <!-- Phone Number -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 text-bx-title">
          <Phone class="w-4 h-4 text-emerald-500 shrink-0" />
          <label class="text-xs font-bold">رقم الهاتف للتواصل المباشر</label>
        </div>
        <input
          v-model="form.phone"
          type="text"
          maxlength="20"
          placeholder="مثال: 0912345678"
          class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-medium"
          dir="ltr"
        />
        <p v-if="fieldErrors.phone" class="text-[11px] text-red-500 font-medium">
          {{ fieldErrors.phone[0] }}
        </p>
      </div>

      <!-- Hire Date -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 text-bx-title">
          <Calendar class="w-4 h-4 text-amber-500 shrink-0" />
          <label class="text-xs font-bold">تاريخ التعيين والمباشرة بالمدرسة</label>
        </div>
        <div class="relative flex items-center">
          <input
            v-model="form.hire_date"
            type="text"
            placeholder="YYYY-MM-DD (مثال: 2024-09-01)"
            dir="ltr"
            class="w-full pl-5 pr-11 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-medium"
          />
          <input
            ref="datePickerInput"
            type="date"
            tabindex="-1"
            aria-hidden="true"
            :value="form.hire_date"
            @input="onNativeDatePicked"
            class="sr-only absolute pointer-events-none"
          />
          <button
            type="button"
            @click="openNativeDatePicker"
            class="absolute right-2.5 p-1.5 rounded-full text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
            title="اختيار التاريخ من التقويم"
          >
            <Calendar class="w-4 h-4" />
          </button>
        </div>
        <p v-if="fieldErrors.hire_date" class="text-[11px] text-red-500 font-medium">
          {{ fieldErrors.hire_date[0] }}
        </p>
      </div>

      <!-- Password -->
      <div class="space-y-1.5 pt-2 border-t border-[#B4AED8]/40 dark:border-white/[0.08]">
        <div class="flex items-center justify-between text-bx-title">
          <div class="flex items-center gap-2">
            <Lock class="w-4 h-4 text-blue-500 shrink-0" />
            <label class="text-xs font-bold">
              كلمة مرور الحساب الموحد
              <span v-if="!teacher" class="text-red-500">*</span>
            </label>
          </div>
          <span v-if="teacher" class="text-[10px] text-bx-muted">
            (اتركها فارغة إذا كنت لا تريد التغيير)
          </span>
        </div>
        <input
          v-model="form.password"
          type="password"
          :required="!teacher"
          minlength="8"
          placeholder="••••••••"
          class="w-full px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
        />
        <p v-if="fieldErrors.password" class="text-[11px] text-red-500 font-medium">
          {{ fieldErrors.password[0] }}
        </p>
      </div>

      <div v-if="!teacher" class="p-3.5 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20 text-[11px] text-bx-muted leading-relaxed">
        <p class="font-bold text-bx-title mb-0.5">💡 الرمز المؤسسي الموحد:</p>
        <span>يمكنك إدخال رقم/كود مخصص للمعلم أعلاه، أو تركه فارغاً ليقوم النظام آلياً بتوليد الكود التسلسلي التالي بصيغة <span class="font-mono font-bold text-bx-primary">TCH-XXXX</span> وتشفير كلمة المرور ذرياً.</span>
      </div>
    </form>

    <!-- Footer Template -->
    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="isSubmitting"
          @click="handleSubmit"
          class="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
        >
          <Save class="w-4 h-4" />
          <span>{{ isSubmitting ? 'جاري الحفظ...' : teacher ? 'تحديث البيانات' : 'حفظ وإنشاء الحساب' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
