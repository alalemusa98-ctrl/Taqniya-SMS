<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Paperclip,
  Loader2,
  Calendar,
  FileText,
  UploadCloud,
} from 'lucide-vue-next';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import type { QuizAttachment, QuizDetailData } from '../../api/quizzes.api';
import type { AssignmentItem } from '../../api/teaching-assignments.api';

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  itemToEdit?: QuizDetailData | null;
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
  quiz_date: string;
  attachments: QuizAttachment[];
}>({
  academic_year_id: 0,
  academic_term_id: 1,
  class_section_id: 0,
  teaching_assignment_id: 0,
  title: '',
  description: '',
  quiz_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  attachments: [],
});

const errors = ref<Record<string, string>>({});
const generalError = ref<string | null>(null);

// Attachment Mode ('upload' | 'link')
const attachmentMode = ref<'upload' | 'link'>('upload');
const newAttachmentName = ref('');
const newAttachmentUrl = ref('');

// Convert teaching assignments into options
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
          class_section_id: it.class_section_id,
          teaching_assignment_id: it.teaching_assignment_id,
          title: it.title,
          description: it.description || '',
          quiz_date: it.quiz_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          attachments: Array.isArray(it.attachments) ? [...it.attachments] : [],
        };
      } else {
        // Create mode default
        const defaultAssignment = props.availableTeachingAssignments[0];
        form.value = {
          academic_year_id: props.academicYearId,
          academic_term_id: props.academicTermId || 1,
          class_section_id: defaultAssignment ? (defaultAssignment as any).class_section_id || 0 : 0,
          teaching_assignment_id: defaultAssignment ? defaultAssignment.id : 0,
          title: '',
          description: '',
          quiz_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          attachments: [],
        };
      }
    }
  },
  { immediate: true },
);

// When teaching assignment changes, sync class_section_id
watch(
  () => form.value.teaching_assignment_id,
  (newVal) => {
    const selected = props.availableTeachingAssignments.find((ta) => ta.id === Number(newVal));
    if (selected) {
      form.value.class_section_id = (selected as any).class_section_id || form.value.class_section_id;
    }
  },
);

const addLinkAttachment = () => {
  if (!newAttachmentName.value.trim() || !newAttachmentUrl.value.trim()) {
    generalError.value = 'يرجى إدخال اسم المرفق ورابط التحميل';
    return;
  }
  form.value.attachments.push({
    file_name: newAttachmentName.value.trim(),
    file_url: newAttachmentUrl.value.trim(),
    file_type: 'link',
  });
  newAttachmentName.value = '';
  newAttachmentUrl.value = '';
  generalError.value = null;
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const mockUrl = URL.createObjectURL(file);

  form.value.attachments.push({
    file_name: file.name,
    file_url: mockUrl,
    file_size: file.size,
    file_type: file.type || 'application/octet-stream',
  });

  target.value = '';
};

const removeAttachment = (index: number) => {
  form.value.attachments.splice(index, 1);
};

const validate = () => {
  errors.value = {};
  generalError.value = null;

  if (!form.value.teaching_assignment_id) {
    errors.value.teaching_assignment_id = 'يرجى اختيار الشعبة والمادة من القائمة.';
  }

  if (!form.value.title.trim()) {
    errors.value.title = 'عنوان الاختبار/التطبيق مطلوب.';
  } else if (form.value.title.length > 200) {
    errors.value.title = 'عنوان الاختبار لا يجب أن يتجاوز 200 حرف.';
  }

  if (!form.value.quiz_date) {
    errors.value.quiz_date = 'تاريخ إجراء الاختبار مطلوب.';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;

  const payload: any = {
    academic_year_id: form.value.academic_year_id || props.academicYearId,
    academic_term_id: form.value.academic_term_id || props.academicTermId || 1,
    class_section_id: form.value.class_section_id,
    teaching_assignment_id: Number(form.value.teaching_assignment_id),
    title: form.value.title.trim(),
    description: form.value.description.trim() || undefined,
    attachments: form.value.attachments.length > 0 ? form.value.attachments : undefined,
    quiz_date: form.value.quiz_date,
  };

  emit('submit', payload);
};
</script>

<template>
  <TaqniyaDrawer
    :is-open="modelValue"
    :title="mode === 'create' ? 'جدولة ونشر اختبار دوري جديد' : 'تعديل موعد وتفاصيل الاختبار'"
    max-width="max-w-[520px]"
    @close="emit('update:modelValue', false)"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5 pb-6 text-slate-800 dark:text-slate-200">
      <!-- General Error Notification Banner -->
      <div
        v-if="generalError"
        class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5"
      >
        <AlertCircle class="w-4 h-4 text-red-500 shrink-0" />
        <span>{{ generalError }}</span>
      </div>

      <!-- Teaching Assignment Selection -->
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
          المادة والشعبة الدراسية (إسناد التدريس) <span class="text-red-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="form.teaching_assignment_id"
          :options="teachingAssignmentOptions"
          placeholder="اختر المادة والشعبة المسندة..."
          searchable
          :disabled="mode === 'edit'"
        />
        <p v-if="errors.teaching_assignment_id" class="text-xs text-red-500 font-medium">
          {{ errors.teaching_assignment_id }}
        </p>
      </div>

      <!-- Quiz Title -->
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
          عنوان التطبيق / الاختبار <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          dir="rtl"
          placeholder="مثال: تطبيق شهري 1 - الجبر والمعادلات"
          class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          :class="{ 'border-red-500 ring-red-500/20': errors.title }"
        />
        <p v-if="errors.title" class="text-xs text-red-500 font-medium">
          {{ errors.title }}
        </p>
      </div>

      <!-- Quiz Date Picker -->
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Calendar class="w-4 h-4 text-indigo-500" />
          <span>تاريخ وموعد إجراء الاختبار <span class="text-red-500">*</span></span>
        </label>
        <input
          v-model="form.quiz_date"
          type="date"
          class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-mono"
          :class="{ 'border-red-500 ring-red-500/20': errors.quiz_date }"
        />
        <p v-if="errors.quiz_date" class="text-xs text-red-500 font-medium">
          {{ errors.quiz_date }}
        </p>
      </div>

      <!-- Description / Topics Section -->
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <FileText class="w-4 h-4 text-indigo-500" />
          <span>المواضيع المقررة والتعليمات الإرشادية</span>
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          dir="rtl"
          placeholder="أدخل الصفحات المقررة، مواضيع الاختبار، أو التعليمات والنصائح للطلاب..."
          class="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
        />
      </div>

      <!-- Attachments Section -->
      <div class="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Paperclip class="w-4 h-4 text-indigo-500" />
            <span>ملفات ونماذج المراجعة المرفقة</span>
          </label>
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition-all font-semibold"
              :class="attachmentMode === 'upload' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-300' : 'text-slate-500'"
              @click="attachmentMode = 'upload'"
            >
              رفع ملف
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition-all font-semibold"
              :class="attachmentMode === 'link' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-300' : 'text-slate-500'"
              @click="attachmentMode = 'link'"
            >
              رابط سحابي
            </button>
          </div>
        </div>

        <!-- File Upload Box -->
        <div
          v-if="attachmentMode === 'upload'"
          class="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500/50 transition-colors bg-slate-50/50 dark:bg-slate-800/30"
        >
          <input
            type="file"
            id="quiz-file-upload"
            class="hidden"
            @change="handleFileUpload"
          />
          <label
            for="quiz-file-upload"
            class="cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <UploadCloud class="w-7 h-7 text-indigo-500" />
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">
              انقر لاختيار ملف من جهازك (PDF، صور، مستندات)
            </span>
            <span class="text-[10px] text-slate-400">
              الحد الأقصى لحجم الملف 10 ميغابايت
            </span>
          </label>
        </div>

        <!-- Cloud Link Inputs -->
        <div v-else class="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <input
            v-model="newAttachmentName"
            type="text"
            dir="rtl"
            placeholder="اسم الملف أو الملخص (مثال: ملخص مراجعة الجبر.pdf)"
            class="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div class="flex items-center gap-2">
            <input
              v-model="newAttachmentUrl"
              type="url"
              dir="ltr"
              placeholder="https://storage.taqniya.ly/quizzes/rev_101.pdf"
              class="flex-1 px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <button
              type="button"
              class="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0 flex items-center gap-1"
              @click="addLinkAttachment"
            >
              <Plus class="w-4 h-4" />
              <span>إضافة</span>
            </button>
          </div>
        </div>

        <!-- Attached Files List -->
        <div v-if="form.attachments.length > 0" class="space-y-2 pt-1">
          <div
            v-for="(att, idx) in form.attachments"
            :key="idx"
            class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          >
            <div class="flex items-center gap-2.5 overflow-hidden">
              <Paperclip class="w-4 h-4 text-indigo-500 shrink-0" />
              <span class="truncate font-semibold text-slate-800 dark:text-slate-200">
                {{ att.file_name }}
              </span>
            </div>
            <button
              type="button"
              class="text-red-500 hover:text-red-600 p-1 rounded-md transition-colors"
              @click="removeAttachment(idx)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          class="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :disabled="isSubmitting"
          @click="emit('update:modelValue', false)"
        >
          إلغاء
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ mode === 'create' ? 'جدولة ونشر الاختبار' : 'حفظ التعديلات' }}</span>
        </button>
      </div>
    </form>
  </TaqniyaDrawer>
</template>
