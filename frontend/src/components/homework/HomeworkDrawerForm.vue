<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  X,
  Plus,
  Trash2,
  Save,
  BookOpen,
  AlertCircle,
  FileText,
  Paperclip,
} from 'lucide-vue-next';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type { HomeworkAttachment, HomeworkItem, HomeworkDetailData } from '../../api/homework.api';
import type { AssignmentItem } from '../../api/teaching-assignments.api';

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  itemToEdit?: HomeworkItem | HomeworkDetailData | null;
  academicYearId: number;
  academicTermId?: number | null;
  availableTeachingAssignments: AssignmentItem[];
  isSubmitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'submit', payload: any): void;
}>();

const form = ref<{
  academic_year_id: number;
  academic_term_id: number;
  class_section_id: number;
  teaching_assignment_id: number;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  attachments: HomeworkAttachment[];
}>({
  academic_year_id: 0,
  academic_term_id: 1,
  class_section_id: 0,
  teaching_assignment_id: 0,
  title: '',
  description: '',
  assigned_date: new Date().toISOString().slice(0, 10),
  due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  attachments: [],
});

const errors = ref<Record<string, string>>({});
const generalError = ref<string | null>(null);

// New attachment input state
const newAttachmentName = ref('');
const newAttachmentUrl = ref('');

// Convert teaching assignments into TaqniyaSelect options
const teachingAssignmentOptions = computed<TaqniyaSelectOption[]>(() => {
  return props.availableTeachingAssignments.map((ta: any) => ({
    value: ta.id,
    label: `${ta.subject_name} - ${ta.teacher_name} ${ta.section_name ? `(${ta.section_name})` : ''}`,
    description: `المادة: ${ta.subject_name} | المعلم: ${ta.teacher_name}`,
  }));
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      errors.value = {};
      generalError.value = null;
      newAttachmentName.value = '';
      newAttachmentUrl.value = '';

      if (props.mode === 'edit' && props.itemToEdit) {
        const it = props.itemToEdit as any;
        form.value = {
          academic_year_id: it.academic_year_id || props.academicYearId,
          academic_term_id: it.academic_term_id || props.academicTermId || 1,
          class_section_id: it.class_section_id || 0,
          teaching_assignment_id: it.teaching_assignment_id || 0,
          title: it.title || '',
          description: it.description || '',
          assigned_date: it.assigned_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          due_date: it.due_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          attachments: Array.isArray(it.attachments) ? JSON.parse(JSON.stringify(it.attachments)) : [],
        };
      } else {
        form.value = {
          academic_year_id: props.academicYearId || 0,
          academic_term_id: props.academicTermId || 1,
          class_section_id: 0,
          teaching_assignment_id: props.availableTeachingAssignments[0]?.id || 0,
          title: '',
          description: '',
          assigned_date: new Date().toISOString().slice(0, 10),
          due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
          attachments: [],
        };
      }
    }
  },
  { immediate: true },
);

// When teaching assignment changes, set class_section_id if available on assignment
watch(
  () => form.value.teaching_assignment_id,
  (newId) => {
    const found = props.availableTeachingAssignments.find((ta: any) => ta.id === newId) as any;
    if (found && found.class_section_id) {
      form.value.class_section_id = found.class_section_id;
    }
  },
);

const addAttachment = () => {
  if (!newAttachmentName.value.trim() || !newAttachmentUrl.value.trim()) return;
  form.value.attachments.push({
    name: newAttachmentName.value.trim(),
    url: newAttachmentUrl.value.trim(),
  });
  newAttachmentName.value = '';
  newAttachmentUrl.value = '';
};

const removeAttachment = (idx: number) => {
  form.value.attachments.splice(idx, 1);
};

const validate = (): boolean => {
  errors.value = {};
  generalError.value = null;

  if (!form.value.title.trim()) {
    errors.value.title = 'عنوان الواجب مطلوب';
  }
  if (!form.value.teaching_assignment_id) {
    errors.value.teaching_assignment_id = 'يرجى اختيار المادة وإسناد التدريس';
  }
  if (!form.value.assigned_date) {
    errors.value.assigned_date = 'تاريخ النشر مطلوب';
  }
  if (!form.value.due_date) {
    errors.value.due_date = 'تاريخ الاستحقاق مطلوب';
  } else if (new Date(form.value.due_date) < new Date(form.value.assigned_date)) {
    errors.value.due_date = 'تاريخ الاستحقاق لا يمكن أن يكون سابقاً لتاريخ التكليف';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;

  const payload: any = {
    academic_year_id: form.value.academic_year_id,
    academic_term_id: form.value.academic_term_id,
    class_section_id: form.value.class_section_id,
    teaching_assignment_id: form.value.teaching_assignment_id,
    title: form.value.title.trim(),
    description: form.value.description.trim() || null,
    assigned_date: form.value.assigned_date,
    due_date: form.value.due_date,
    attachments: form.value.attachments,
  };

  emit('submit', payload);
};

const close = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 overflow-hidden flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        @click="close"
      />

      <!-- Drawer Content -->
      <div class="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full overflow-hidden border-s border-slate-200 dark:border-slate-800 transition-transform duration-300">
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-black text-slate-800 dark:text-slate-100 font-display">
                {{ mode === 'create' ? 'إنشاء ونشر واجب جديد' : 'تعديل بيانات الواجب المدرسي' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ mode === 'create' ? 'تكليف الطلاب وإرفاق الملازم والمواعيد' : 'تحديث التفاصيل ومواعيد الاستحقاق' }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="close"
            class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto p-6 space-y-5">
          <!-- General Alert if any -->
          <div
            v-if="generalError"
            class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ generalError }}</span>
          </div>

          <!-- Teaching Assignment Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-700 dark:text-slate-300 block">
              المادة والشعبة المكلفة <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              v-model="form.teaching_assignment_id"
              :options="teachingAssignmentOptions"
              placeholder="اختر المادة والشعبة المسندة..."
              searchable
            />
            <span v-if="errors.teaching_assignment_id" class="text-[11px] text-rose-500 block font-medium">
              {{ errors.teaching_assignment_id }}
            </span>
          </div>

          <!-- Title Field -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-700 dark:text-slate-300 block">
              عنوان وموضوع الواجب <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              maxlength="200"
              placeholder="مثال: حل تمارين ص 45 - الجبر"
              class="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
              :class="errors.title ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700'"
            />
            <span v-if="errors.title" class="text-[11px] text-rose-500 block font-medium">
              {{ errors.title }}
            </span>
          </div>

          <!-- Dates Row -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Assigned Date -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-700 dark:text-slate-300 block">
                تاريخ النشر <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.assigned_date"
                type="date"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span v-if="errors.assigned_date" class="text-[11px] text-rose-500 block font-medium">
                {{ errors.assigned_date }}
              </span>
            </div>

            <!-- Due Date -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-700 dark:text-slate-300 block">
                تاريخ الاستحقاق <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.due_date"
                type="date"
                :min="form.assigned_date"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                :class="errors.due_date ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700'"
              />
              <span v-if="errors.due_date" class="text-[11px] text-rose-500 block font-medium">
                {{ errors.due_date }}
              </span>
            </div>
          </div>

          <!-- Description / Instructions -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-700 dark:text-slate-300 block">
              التعليمات والتفاصيل الإرشادية
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="اكتب أي ملاحظات أو إرشادات للطلاب..."
              class="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>

          <!-- Attachments Manager -->
          <div class="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Paperclip class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                المرفقات والملازم ({{ form.attachments.length }})
              </label>
            </div>

            <!-- Existing list -->
            <div v-if="form.attachments.length > 0" class="space-y-2">
              <div
                v-for="(att, idx) in form.attachments"
                :key="idx"
                class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <FileText class="w-4 h-4 text-indigo-600 shrink-0" />
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" :title="att.name">
                    {{ att.name }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="removeAttachment(idx)"
                  class="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Add new attachment inputs -->
            <div class="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/30 dark:bg-slate-800/20">
              <input
                v-model="newAttachmentName"
                type="text"
                placeholder="اسم الملف (مثال: ملزمة الواجب.pdf)"
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
              <div class="flex gap-2">
                <input
                  v-model="newAttachmentUrl"
                  type="url"
                  placeholder="رابط الملف (URL)"
                  class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  @click="addAttachment"
                  class="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  إضافة
                </button>
              </div>
            </div>
          </div>
        </form>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="px-5 py-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <div v-if="isSubmitting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            {{ mode === 'create' ? 'نشر الواجب' : 'حفظ التعديلات' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
