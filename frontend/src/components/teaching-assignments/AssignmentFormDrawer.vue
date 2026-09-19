<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { GraduationCap, AlertCircle, Loader2, Save, Calendar, CheckCircle2 } from 'lucide-vue-next';
import { teachingAssignmentsApi } from '../../api/teaching-assignments.api';
import type { Teacher } from '../../api/teachers.api';
import { useToast } from '../../composables/useToast';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';

interface FormData {
  academic_year_id: number;
  class_id: number;
  class_section_id: number;
  subject_id: number;
  teacher_id: number;
}

const props = defineProps<{
  isOpen: boolean;
  mode: 'create' | 'edit';
  assignmentId: number | null;
  initialData: FormData;
  academicYears: any[];
  allClasses: any[];
  allClassSections: any[];
  allSubjects: any[];
  allTeachers: Teacher[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const toast = useToast();

const form = ref<FormData>({
  academic_year_id: 0,
  class_id: 0,
  class_section_id: 0,
  subject_id: 0,
  teacher_id: 0,
});

const isSubmitting = ref(false);
const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);

// Automatically resolve active academic year (or fallback to latest)
const activeAcademicYear = computed(() => {
  return props.academicYears.find((y) => y.is_active === 1) || props.academicYears[0];
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.value = { ...props.initialData };
      if ((!form.value.academic_year_id || form.value.academic_year_id === 0) && activeAcademicYear.value) {
        form.value.academic_year_id = activeAcademicYear.value.id;
      }
      fieldErrors.value = {};
      formErrorMessage.value = null;
    }
  },
  { immediate: true },
);

const classOptions = computed<TaqniyaSelectOption[]>(() =>
  props.allClasses.map((c) => ({
    value: c.id,
    label: c.name,
  })),
);

// Sections available for the chosen class in form
const availableClassSections = computed<TaqniyaSelectOption[]>(() => {
  if (!form.value.class_id) return [];
  const matches = props.allClassSections.filter(
    (cs) => Number(cs.class_id) === Number(form.value.class_id),
  );
  return matches.map((cs) => ({
    value: cs.id,
    label: cs.name || `شعبة #${cs.id}`,
  }));
});

// Watch class_id change in form: auto-select first available section or reset
watch(
  () => form.value.class_id,
  (newClassId) => {
    if (!props.isOpen) return;
    if (!newClassId) {
      form.value.class_section_id = 0;
      return;
    }
    const available = props.allClassSections.filter(
      (cs) => Number(cs.class_id) === Number(newClassId),
    );
    if (available.length > 0) {
      const stillValid = available.some((a) => a.id === form.value.class_section_id);
      if (!stillValid) {
        form.value.class_section_id = available[0].id;
      }
    } else {
      form.value.class_section_id = 0;
    }
  },
);

const subjectOptions = computed<TaqniyaSelectOption[]>(() =>
  props.allSubjects.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code || 'كود: ' + s.id})`,
  })),
);

const teacherOptions = computed<TaqniyaSelectOption[]>(() =>
  props.allTeachers.map((t) => ({
    value: t.id,
    label: `${t.full_name} (${t.user_code})`,
    subtext: t.specialization || undefined,
  })),
);

async function handleSubmit() {
  fieldErrors.value = {};
  formErrorMessage.value = null;

  if (!form.value.class_section_id) {
    toast.warning('يرجى اختيار الشعبة الدراسية.');
    return;
  }
  if (!form.value.subject_id) {
    toast.warning('يرجى اختيار المادة التعليمية.');
    return;
  }
  if (!form.value.teacher_id) {
    toast.warning('يرجى اختيار المعلم المكلف.');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      academic_year_id: form.value.academic_year_id,
      class_section_id: form.value.class_section_id,
      subject_id: form.value.subject_id,
      teacher_id: form.value.teacher_id,
    };

    if (props.mode === 'create') {
      const res = await teachingAssignmentsApi.create(payload);
      toast.success(res.data.message || 'تم إسناد تدريس المادة للمعلم بنجاح.');
    } else if (props.assignmentId) {
      const res = await teachingAssignmentsApi.update(props.assignmentId, payload);
      toast.success(res.data.message || 'تم تحديث وتعديل إسناد التدريس بنجاح.');
    }

    emit('saved');
    emit('close');
  } catch (err: any) {
    const statusCode = err.response?.status;
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ الإسناد.';

    if (statusCode === 409) {
      formErrorMessage.value = msg;
      toast.error(msg);
    } else if (statusCode === 422 && err.response?.data?.errors) {
      fieldErrors.value = err.response.data.errors;
      toast.error('بيانات الإسناد غير مكتملة.');
    } else {
      formErrorMessage.value = msg;
      toast.error(msg);
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="mode === 'create' ? 'إسناد تدريس مادة لمعلم' : 'تعديل إسناد التدريس الأكاديمي'"
    :subtitle="mode === 'create' ? 'تكليف معلم مسؤول عن تدريس مادة بشعبة دراسية' : 'تغيير المعلم المكلف أو تعديل بيانات التكليف'"
    :icon="GraduationCap"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Conflict or Form Error Alert -->
      <div
        v-if="formErrorMessage"
        class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
        <span>{{ formErrorMessage }}</span>
      </div>

      <!-- Active Academic Year Context (System Resolved) -->
      <div class="p-3 rounded-xl bg-bx-surface-2/80 border border-bx-border flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar class="w-4 h-4" />
          </div>
          <div>
            <div class="text-[11px] font-bold text-bx-subtitle">العام الدراسي المستهدف</div>
            <div class="text-xs font-black text-bx-title">
              {{ activeAcademicYear ? activeAcademicYear.name : 'العام الأكاديمي النشط' }}
            </div>
          </div>
        </div>
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 class="w-3.5 h-3.5" />
          محدد تلقائياً
        </span>
      </div>

      <!-- Class Selection -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1">
          الصف الدراسي <span class="text-rose-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="form.class_id"
          :options="classOptions"
          placeholder="اختر الصف..."
          full-width
          :disabled="mode === 'edit'"
        />
      </div>

      <!-- Section Selection -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1">
          الشعبة الدراسية <span class="text-rose-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="form.class_section_id"
          :options="availableClassSections"
          placeholder="اختر الشعبة..."
          full-width
          :disabled="mode === 'edit'"
        />
        <p v-if="fieldErrors.class_section_id" class="text-[11px] text-rose-500 mt-1 font-bold">
          {{ fieldErrors.class_section_id[0] }}
        </p>
      </div>

      <!-- Subject Selection -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1">
          المادة التعليمية <span class="text-rose-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="form.subject_id"
          :options="subjectOptions"
          placeholder="اختر المادة..."
          full-width
          :disabled="mode === 'edit'"
        />
        <p v-if="fieldErrors.subject_id" class="text-[11px] text-rose-500 mt-1 font-bold">
          {{ fieldErrors.subject_id[0] }}
        </p>
      </div>

      <!-- Teacher Selection -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1">
          المعلم المسؤول المكلف <span class="text-rose-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="form.teacher_id"
          :options="teacherOptions"
          placeholder="اختر المعلم المكلف..."
          full-width
        />
        <p v-if="fieldErrors.teacher_id" class="text-[11px] text-rose-500 mt-1 font-bold">
          {{ fieldErrors.teacher_id[0] }}
        </p>
      </div>

      <!-- Actions -->
      <div class="pt-4 border-t border-[#B4AED8] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-sm"
        >
          <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <Save v-else class="w-3.5 h-3.5" />
          <span>{{ mode === 'create' ? 'إسناد المادة الآن' : 'حفظ التعديلات' }}</span>
        </button>
      </div>
    </form>
  </TaqniyaDrawer>
</template>
