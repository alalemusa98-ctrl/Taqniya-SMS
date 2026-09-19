<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  User,
  Phone,
  Calendar,
  Lock,
  GraduationCap,
  School,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type { Student } from '../../api/students.api';
import type { ClassSectionsGroupItem } from '../../api/academic.api';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  student?: Student | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  fieldErrors?: Record<string, string[]>;
  classesWithSections?: ClassSectionsGroupItem[];
  loadingClasses?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  student: null,
  isSubmitting: false,
  errorMessage: null,
  fieldErrors: () => ({}),
  classesWithSections: () => [],
  loadingClasses: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: { data: any; mode: 'create' | 'edit'; id?: number }): void;
}>();

const form = ref({
  full_name: '',
  gender: 'male' as 'male' | 'female',
  phone: '',
  birth_date: '',
  password: '',
  class_id: undefined as number | undefined,
  class_section_id: undefined as number | undefined,
  seating_number: '',
});

const clientValidationErrors = ref<Record<string, string[]>>({});
const datePickerInput = ref<HTMLInputElement | null>(null);

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
    form.value.birth_date = target.value;
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      clientValidationErrors.value = {};
      if (props.mode === 'edit' && props.student) {
        form.value = {
          full_name: props.student.full_name || '',
          gender: props.student.gender || 'male',
          phone: props.student.phone || '',
          birth_date: props.student.birth_date || '',
          password: '',
          class_id: props.student.class_id || undefined,
          class_section_id: props.student.class_section_id || undefined,
          seating_number: props.student.seating_number || '',
        };
      } else {
        form.value = {
          full_name: '',
          gender: 'male',
          phone: '',
          birth_date: '',
          password: '',
          class_id: undefined,
          class_section_id: undefined,
          seating_number: '',
        };
      }
    }
  },
  { immediate: true },
);

// Academic options for placement
const classOptions = computed<TaqniyaSelectOption[]>(() => {
  return props.classesWithSections.map((c) => ({
    label: `${c.class_name} (${c.sections_count} شعب)`,
    value: c.class_id,
  }));
});

const availableSections = computed(() => {
  if (!form.value.class_id) return [];
  const found = props.classesWithSections.find((c) => c.class_id === form.value.class_id);
  return found?.sections || [];
});

const sectionOptions = computed<TaqniyaSelectOption[]>(() => {
  return availableSections.value.map((s) => ({
    label: s.name.includes('شعبة') ? s.name : `شعبة (${s.name})`,
    value: s.id,
  }));
});

function onClassSelected(val: string | number | null) {
  form.value.class_id = val ? Number(val) : undefined;
  form.value.class_section_id = undefined;
}

function onSectionSelected(val: string | number | null) {
  form.value.class_section_id = val ? Number(val) : undefined;
}

function handleSubmit() {
  clientValidationErrors.value = {};

  if (!form.value.full_name.trim()) {
    clientValidationErrors.value.full_name = ['اسم الطالب الرباعي مطلوب.'];
    return;
  }

  if (props.mode === 'create' && !form.value.password) {
    clientValidationErrors.value.password = ['كلمة المرور مطلوبة عند إنشاء حساب الطالب.'];
    return;
  }

  const payload: any = {
    full_name: form.value.full_name.trim(),
    gender: form.value.gender,
  };

  if (form.value.phone?.trim()) payload.phone = form.value.phone.trim();
  if (form.value.birth_date) payload.birth_date = form.value.birth_date;
  if (form.value.password?.trim()) payload.password = form.value.password.trim();
  if (form.value.class_section_id) payload.class_section_id = Number(form.value.class_section_id);
  if (form.value.seating_number?.trim()) payload.seating_number = form.value.seating_number.trim();

  emit('save', {
    data: payload,
    mode: props.mode,
    id: props.student?.id,
  });
}
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="mode === 'create' ? 'تسجيل طالب جديد وتوليد الحساب' : 'تعديل بيانات ملف الطالب'"
    :subtitle="
      mode === 'create'
        ? 'تسجيل طالب جديد وتوليد حساب الدخول STU-XXXX ذرياً مع التسكين المبدئي'
        : 'تحديث البيانات الشخصية وسجل الطالب'
    "
    :icon="User"
    max-width="max-w-[700px]"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6" novalidate>
      <!-- Form Global Error Alert -->
      <div
        v-if="errorMessage"
        class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-3"
      >
        <AlertCircle class="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
        <div class="space-y-1">
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- 1. Personal Details Section -->
      <div class="space-y-4">
        <h4 class="text-xs font-black text-bx-title border-b border-bx-border pb-2 flex items-center gap-2">
          <User class="w-4 h-4 text-bx-primary" />
          <span>البيانات الشخصية والتعريفية</span>
        </h4>

        <!-- Full Name -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">
            الاسم الرباعي واللقب للطالب <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              type="text"
              v-model="form.full_name"
              placeholder="مثال: محمد علي الفيتوري سالم"
              class="w-full px-4 py-2.5 rounded-xl border bg-bx-surface text-xs text-bx-title font-medium transition-colors focus:outline-none focus:border-bx-primary"
              :class="clientValidationErrors.full_name || fieldErrors?.full_name ? 'border-red-500' : 'border-bx-border'"
            />
          </div>
          <p v-if="clientValidationErrors.full_name" class="text-[11px] text-red-500 font-bold mt-1">
            {{ clientValidationErrors.full_name[0] }}
          </p>
          <p v-else-if="fieldErrors?.full_name" class="text-[11px] text-red-500 font-bold mt-1">
            {{ fieldErrors.full_name[0] }}
          </p>
        </div>

        <!-- Gender & Phone -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Gender -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              الجنس <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="form.gender = 'male'"
                class="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                :class="
                  form.gender === 'male'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black shadow-xs'
                    : 'border-bx-border text-bx-muted hover:border-blue-500/40'
                "
              >
                <span>ذكر</span>
              </button>

              <button
                type="button"
                @click="form.gender = 'female'"
                class="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                :class="
                  form.gender === 'female'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-black shadow-xs'
                    : 'border-bx-border text-bx-muted hover:border-pink-500/40'
                "
              >
                <span>أنثى</span>
              </button>
            </div>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              رقم هاتف الطالب (اختياري)
            </label>
            <div class="relative">
              <input
                type="tel"
                v-model="form.phone"
                placeholder="09XXXXXXXX"
                dir="ltr"
                class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-xs text-bx-title font-mono transition-colors focus:outline-none focus:border-bx-primary text-start"
              />
              <Phone class="w-4 h-4 text-bx-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <!-- Birth Date with Native Picker -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">
            تاريخ الميلاد
          </label>
          <div class="relative">
            <input
              ref="datePickerInput"
              type="date"
              :value="form.birth_date"
              @change="onNativeDatePicked"
              class="sr-only"
              tabindex="-1"
            />
            <div
              @click="openNativeDatePicker"
              class="w-full px-4 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-xs font-mono flex items-center justify-between cursor-pointer hover:border-bx-primary transition-colors"
            >
              <span :class="form.birth_date ? 'text-bx-title font-bold' : 'text-bx-muted'">
                {{ form.birth_date || 'YYYY-MM-DD (انقر للاختيار)' }}
              </span>
              <Calendar class="w-4 h-4 text-bx-muted" />
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Academic Placement Section (Optional) -->
      <div class="space-y-4 pt-2">
        <h4 class="text-xs font-black text-bx-title border-b border-bx-border pb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <School class="w-4 h-4 text-bx-primary" />
            <span>التسكين الأكاديمي المباشر بالشعبة (اختياري)</span>
          </div>
          <span class="text-[11px] font-normal text-bx-muted">يمكن التسكين لاحقاً</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Class Select -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">الصف الدراسي</label>
            <TaqniyaSelect
              :model-value="form.class_id"
              @update:model-value="onClassSelected"
              :options="classOptions"
              placeholder="اختر الصف الدراسي..."
              :icon="School"
              full-width
            />
          </div>

          <!-- Section Select -->
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">الشعبة الدراسية</label>
            <TaqniyaSelect
              :model-value="form.class_section_id"
              @update:model-value="onSectionSelected"
              :options="sectionOptions"
              :placeholder="!form.class_id ? 'اختر الصف أولاً...' : sectionOptions.length === 0 ? 'لا توجد شعب مسجلة' : 'اختر الشعبة...'"
              :disabled="!form.class_id || sectionOptions.length === 0"
              :icon="GraduationCap"
              full-width
            />
          </div>
        </div>

        <!-- Seating Number -->
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">رقم الجلوس (اختياري)</label>
          <input
            type="text"
            v-model="form.seating_number"
            placeholder="مثال: 104"
            class="w-full px-4 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-xs text-bx-title font-mono transition-colors focus:outline-none focus:border-bx-primary"
          />
        </div>
      </div>

      <!-- 3. Account Credentials Section -->
      <div class="space-y-4 pt-2">
        <h4 class="text-xs font-black text-bx-title border-b border-bx-border pb-2 flex items-center gap-2">
          <Lock class="w-4 h-4 text-bx-primary" />
          <span>بيانات الدخول والحساب الموحد</span>
        </h4>

        <div>
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
          <p class="text-[11px] text-bx-muted mt-1.5">
            يتم توليد الرمز التعريفي للمستخدم (<span class="font-mono font-bold text-bx-primary">STU-XXXX</span>) تلقائياً وذرياً بواسطة الخادم.
          </p>
        </div>
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
          <span>{{ isSubmitting ? 'جاري الحفظ...' : mode === 'create' ? 'حفظ وإنشاء ملف الطالب' : 'تحديث البيانات' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
