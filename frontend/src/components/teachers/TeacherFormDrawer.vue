<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, UserPlus, Save, AlertCircle, Lock, Phone, BookOpen, Calendar, User } from 'lucide-vue-next';
import { teachersApi, type Teacher } from '../../api/teachers.api';

const props = defineProps<{
  isOpen: boolean;
  teacher: Teacher | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const fieldErrors = ref<Record<string, string[]>>({});

const form = ref({
  full_name: '',
  phone: '',
  specialization: '',
  hire_date: '',
  password: '',
});

watch(
  () => props.teacher,
  (val) => {
    errorMessage.value = null;
    fieldErrors.value = {};
    if (val) {
      form.value = {
        full_name: val.full_name,
        phone: val.phone || '',
        specialization: val.specialization || '',
        hire_date: val.hire_date || '',
        password: '',
      };
    } else {
      form.value = {
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
  isSubmitting.value = true;
  errorMessage.value = null;
  fieldErrors.value = {};

  try {
    if (props.teacher) {
      // Edit PUT
      const payload: any = {
        full_name: form.value.full_name,
        phone: form.value.phone || undefined,
        specialization: form.value.specialization || undefined,
        hire_date: form.value.hire_date || undefined,
      };
      if (form.value.password) {
        payload.password = form.value.password;
      }
      await teachersApi.updateTeacher(props.teacher.id, payload);
    } else {
      // Create POST
      await teachersApi.createTeacher({
        full_name: form.value.full_name,
        phone: form.value.phone || undefined,
        specialization: form.value.specialization || undefined,
        hire_date: form.value.hire_date || undefined,
        password: form.value.password,
      });
    }

    emit('saved');
    emit('close');
  } catch (err: any) {
    if (err.response?.data?.errors) {
      fieldErrors.value = err.response.data.errors;
    }
    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = 'حدث خطأ أثناء حفظ بيانات ملف المعلم.';
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" dir="rtl">
    <!-- Backdrop Blur -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
    ></div>

    <div class="fixed inset-y-0 left-0 pl-10 max-w-full flex">
      <div class="w-screen max-w-md bg-[var(--bx-surface-solid)] border-r border-bx-border shadow-2xl flex flex-col">
        <!-- Header -->
        <div class="p-6 border-b border-bx-border flex items-center justify-between bg-[var(--bx-canvas)]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
              <UserPlus class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-bx-title">
                {{ teacher ? 'تعديل ملف المعلم' : 'إضافة معلم جديد' }}
              </h3>
              <p class="text-xs text-bx-muted">
                {{ teacher ? 'تحديث البيانات المهنية والحساب الموحد' : 'إنشاء السجل وتوليد كود الدخول TCH-XXXX ذرياً' }}
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="p-2 text-bx-muted hover:text-bx-title rounded-xl hover:bg-[var(--bx-pill)] transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Content -->
        <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto p-6 space-y-4">
          <!-- Global Error Notification -->
          <div
            v-if="errorMessage"
            class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Full Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-blue-500" />
              الاسم الرباعي واللقب للمعلم <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.full_name"
              type="text"
              required
              maxlength="150"
              placeholder="مثال: أحمد محمود سالم الورفلي"
              class="w-full px-3.5 py-2.5 rounded-xl border border-bx-border bg-[var(--bx-canvas)] text-xs text-bx-title placeholder:text-bx-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <p v-if="fieldErrors.full_name" class="text-[11px] text-red-500 font-medium">
              {{ fieldErrors.full_name[0] }}
            </p>
          </div>

          <!-- Specialization -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
              <BookOpen class="w-3.5 h-3.5 text-indigo-500" />
              التخصص العلمي
            </label>
            <input
              v-model="form.specialization"
              type="text"
              maxlength="100"
              placeholder="مثال: الرياضيات، العلوم العامة، اللغة العربية"
              class="w-full px-3.5 py-2.5 rounded-xl border border-bx-border bg-[var(--bx-canvas)] text-xs text-bx-title placeholder:text-bx-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <p v-if="fieldErrors.specialization" class="text-[11px] text-red-500 font-medium">
              {{ fieldErrors.specialization[0] }}
            </p>
          </div>

          <!-- Phone Number -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
              <Phone class="w-3.5 h-3.5 text-emerald-500" />
              رقم الهاتف للتواصل المباشر
            </label>
            <input
              v-model="form.phone"
              type="text"
              maxlength="20"
              placeholder="مثال: 0912345678"
              class="w-full px-3.5 py-2.5 rounded-xl border border-bx-border bg-[var(--bx-canvas)] text-xs text-bx-title placeholder:text-bx-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              dir="ltr"
            />
            <p v-if="fieldErrors.phone" class="text-[11px] text-red-500 font-medium">
              {{ fieldErrors.phone[0] }}
            </p>
          </div>

          <!-- Hire Date -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-purple-500" />
              تاريخ التعيين والمباشرة بالمدرسة
            </label>
            <input
              v-model="form.hire_date"
              type="date"
              dir="ltr"
              lang="en-GB"
              class="w-full px-3.5 py-2.5 rounded-xl border border-bx-border bg-[var(--bx-canvas)] text-xs text-bx-title focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-['Alexandria',sans-serif] font-medium"
            />
            <p v-if="fieldErrors.hire_date" class="text-[11px] text-red-500 font-medium">
              {{ fieldErrors.hire_date[0] }}
            </p>
          </div>

          <!-- Password -->
          <div class="space-y-1.5 pt-2 border-t border-bx-border">
            <label class="text-xs font-bold text-bx-title flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <Lock class="w-3.5 h-3.5 text-amber-500" />
                كلمة مرور الحساب الموحد
                <span v-if="!teacher" class="text-red-500">*</span>
              </span>
              <span v-if="teacher" class="text-[10px] text-bx-muted font-normal">
                (اتركها فارغة إذا كنت لا تريد التغيير)
              </span>
            </label>
            <input
              v-model="form.password"
              type="password"
              :required="!teacher"
              minlength="8"
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 rounded-xl border border-bx-border bg-[var(--bx-canvas)] text-xs text-bx-title placeholder:text-bx-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
            <p v-if="fieldErrors.password" class="text-[11px] text-red-500 font-medium">
              {{ fieldErrors.password[0] }}
            </p>
          </div>

          <div v-if="!teacher" class="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 space-y-1">
            <p class="font-bold">ملاحظة حوكمية حول الهوية الموحدة:</p>
            <p class="text-blue-600/80 dark:text-blue-400/80">
              سيقوم النظام آلياً بإنشاء حساب المستخدم بالبادئة المعيارية <span class="font-mono font-bold">TCH-XXXX</span> ومنح المعلم صلاحية تسجيل الدخول فور الحفظ.
            </p>
          </div>
        </form>

        <!-- Footer -->
        <div class="p-5 border-t border-bx-border bg-[var(--bx-canvas)] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl border border-bx-border hover:bg-[var(--bx-pill)] text-bx-title font-bold text-xs transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            :disabled="isSubmitting"
            @click="handleSubmit"
            class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save class="w-4 h-4" />
            <span>{{ isSubmitting ? 'جاري الحفظ...' : teacher ? 'تحديث البيانات' : 'حفظ وإنشاء الحساب' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
