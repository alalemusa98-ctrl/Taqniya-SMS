<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  User,
  Phone,
  HeartHandshake,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type { Guardian } from '../../api/guardians.api';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  guardian?: Guardian | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  fieldErrors?: Record<string, string[]>;
}

const props = withDefaults(defineProps<Props>(), {
  guardian: null,
  isSubmitting: false,
  errorMessage: null,
  fieldErrors: () => ({}),
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: { data: any; mode: 'create' | 'edit'; id?: number }): void;
}>();

const form = ref({
  full_name: '',
  phone: '',
  relationship: 'father' as 'father' | 'mother' | 'brother' | 'uncle' | 'other',
  password: '',
});

const clientValidationErrors = ref<Record<string, string[]>>({});

const relationshipOptions: TaqniyaSelectOption[] = [
  { label: 'أب (الأب هو الولي الشرعي)', value: 'father' },
  { label: 'أم (الأم)', value: 'mother' },
  { label: 'أخ (الأخ الأكبر)', value: 'brother' },
  { label: 'عم / خال (قرابة عائلية)', value: 'uncle' },
  { label: 'وصي قانوني آخر', value: 'other' },
];

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      clientValidationErrors.value = {};
      if (props.mode === 'edit' && props.guardian) {
        form.value = {
          full_name: props.guardian.full_name || '',
          phone: props.guardian.phone || '',
          relationship: props.guardian.relationship || 'father',
          password: '',
        };
      } else {
        form.value = {
          full_name: '',
          phone: '',
          relationship: 'father',
          password: '',
        };
      }
    }
  },
  { immediate: true },
);

function onRelationshipSelected(val: string | number | null) {
  if (val) {
    form.value.relationship = String(val) as any;
  }
}

function handleSubmit() {
  clientValidationErrors.value = {};

  if (!form.value.full_name.trim()) {
    clientValidationErrors.value.full_name = ['اسم ولي الأمر مطلوب.'];
    return;
  }

  if (!form.value.phone.trim()) {
    clientValidationErrors.value.phone = ['رقم هاتف ولي الأمر مطلوب.'];
    return;
  }

  if (props.mode === 'create' && !form.value.password) {
    clientValidationErrors.value.password = ['كلمة المرور مطلوبة عند إنشاء حساب ولي الأمر.'];
    return;
  }

  const payload: any = {
    full_name: form.value.full_name.trim(),
    phone: form.value.phone.trim(),
    relationship: form.value.relationship,
  };

  if (form.value.password?.trim()) {
    payload.password = form.value.password.trim();
  }

  emit('save', {
    data: payload,
    mode: props.mode,
    id: props.guardian?.id,
  });
}
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="mode === 'create' ? 'تسجيل ولي أمر جديد وتوليد الحساب' : 'تعديل بيانات ملف ولي الأمر'"
    :subtitle="
      mode === 'create'
        ? 'تسجيل ولي أمر جديد وتوليد حساب الدخول PAR-XXXX ذرياً'
        : 'تحديث بيانات التواصل وصلة القرابة'
    "
    :icon="User"
    max-width="max-w-[550px]"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
      <!-- Global Error Alert -->
      <div
        v-if="errorMessage"
        class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-3"
      >
        <AlertCircle class="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
        <div class="space-y-1">
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Full Name -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          الاسم الكامل لولي الأمر <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          v-model="form.full_name"
          placeholder="مثال: خالد مسعود السويح"
          class="w-full px-4 py-2.5 rounded-xl border bg-bx-surface text-xs text-bx-title font-medium transition-colors focus:outline-none focus:border-bx-primary"
          :class="clientValidationErrors.full_name || fieldErrors?.full_name ? 'border-red-500' : 'border-bx-border'"
        />
        <p v-if="clientValidationErrors.full_name" class="text-[11px] text-red-500 font-bold mt-1">
          {{ clientValidationErrors.full_name[0] }}
        </p>
        <p v-else-if="fieldErrors?.full_name" class="text-[11px] text-red-500 font-bold mt-1">
          {{ fieldErrors.full_name[0] }}
        </p>
      </div>

      <!-- Phone Number -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          رقم هاتف التواصل (فريد) <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            type="tel"
            v-model="form.phone"
            placeholder="091XXXXXXX"
            dir="ltr"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-bx-surface text-xs text-bx-title font-mono transition-colors focus:outline-none focus:border-bx-primary text-start"
            :class="clientValidationErrors.phone || fieldErrors?.phone ? 'border-red-500' : 'border-bx-border'"
          />
          <Phone class="w-4 h-4 text-bx-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <p v-if="clientValidationErrors.phone" class="text-[11px] text-red-500 font-bold mt-1">
          {{ clientValidationErrors.phone[0] }}
        </p>
        <p v-else-if="fieldErrors?.phone" class="text-[11px] text-red-500 font-bold mt-1">
          {{ fieldErrors.phone[0] }}
        </p>
        <p class="text-[11px] text-bx-muted mt-1">
          يُشترط تفرد رقم الهاتف في المنظومة (قيد uq_guardians_phone).
        </p>
      </div>

      <!-- Relationship Selection -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          صلة القرابة الافتراضية بالطالب <span class="text-red-500">*</span>
        </label>
        <TaqniyaSelect
          :model-value="form.relationship"
          @update:model-value="onRelationshipSelected"
          :options="relationshipOptions"
          placeholder="اختر صلة القرابة..."
          :icon="HeartHandshake"
          full-width
        />
      </div>

      <!-- Password Credentials -->
      <div class="pt-2 border-t border-bx-border">
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          {{ mode === 'create' ? 'كلمة المرور للحساب الموحد' : 'تعديل كلمة المرور (اختياري)' }}
          <span v-if="mode === 'create'" class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            type="password"
            v-model="form.password"
            :placeholder="mode === 'create' ? '••••••••' : 'اترك الحقل فارغاً للإبقاء على كلمة المرور الحالية'"
            class="w-full px-4 py-2.5 rounded-xl border bg-bx-surface text-xs text-bx-title font-mono transition-colors focus:outline-none focus:border-bx-primary"
            :class="clientValidationErrors.password || fieldErrors?.password ? 'border-red-500' : 'border-bx-border'"
          />
        </div>
        <p v-if="clientValidationErrors.password" class="text-[11px] text-red-500 font-bold mt-1">
          {{ clientValidationErrors.password[0] }}
        </p>
        <p v-else-if="fieldErrors?.password" class="text-[11px] text-red-500 font-bold mt-1">
          {{ fieldErrors.password[0] }}
        </p>
        <p class="text-[11px] text-bx-muted mt-1">
          يتم توليد الرمز التعريفي للمستخدم (<span class="font-mono font-bold text-bx-primary">PAR-XXXX</span>) تلقائياً وذرياً بواسطة الخادم.
        </p>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="isSubmitting"
          @click="handleSubmit"
          class="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ isSubmitting ? 'جاري الحفظ...' : mode === 'create' ? 'حفظ وإنشاء ملف ولي الأمر' : 'تحديث البيانات' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
