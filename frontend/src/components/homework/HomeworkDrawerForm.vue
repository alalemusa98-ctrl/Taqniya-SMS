<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import {
  Save,
  BookOpen,
  AlertCircle,
  Plus,
  Trash2,
  Paperclip,
  Loader2,
  Calendar,
  FileText,
} from 'lucide-vue-next';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type { HomeworkAttachment, HomeworkItem, HomeworkDetailData } from '../../api/homework.api';
import type { AssignmentItem } from '../../api/teaching-assignments.api';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

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
  <TaqniyaDrawer
    :is-open="modelValue"
    :title="mode === 'create' ? 'إنشاء وتكليف واجب جديد' : 'تعديل بيانات الواجب المدرسي'"
    :subtitle="mode === 'create' ? 'تكليف الطلاب وإرفاق الملازم والمواعيد' : 'تحديث التفاصيل ومواعيد الاستحقاق'"
    :icon="BookOpen"
    max-width="max-w-[540px]"
    @close="close"
  >
    <form id="homeworkForm" @submit.prevent="handleSubmit" class="space-y-5">
      <!-- General Alert if any -->
      <div
        v-if="generalError"
        class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-bold"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ generalError }}</span>
      </div>

      <!-- Teaching Assignment Selector -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          المادة والشعبة المسندة <span class="text-rose-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="form.teaching_assignment_id"
          :options="teachingAssignmentOptions"
          placeholder="اختر المادة والشعبة المسندة..."
          searchable
          full-width
        />
        <span v-if="errors.teaching_assignment_id" class="text-[11px] text-rose-500 mt-1 block font-bold">
          {{ errors.teaching_assignment_id }}
        </span>
      </div>

      <!-- Title Field -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          عنوان الواجب / النشاط <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          placeholder="مثال: حل تمارين الوحدة الثالثة صفحة 45"
          class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
        />
        <span v-if="errors.title" class="text-[11px] text-rose-500 mt-1 block font-bold">
          {{ errors.title }}
        </span>
      </div>

      <!-- Description Textarea -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          التفاصيل والتعليمات الإرشادية (اختياري)
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="اكتب التوجيهات أو الملاحظات التي تود توجيهها للطلاب..."
          class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all resize-none text-start"
        />
      </div>

      <!-- Dates Grid: Assigned Date & Due Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5 flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5 text-bx-primary" />
            <span>تاريخ النشر والتكليف</span>
            <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.assigned_date"
            type="date"
            class="w-full px-4 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title focus:outline-none focus:border-bx-primary transition-all"
          />
          <span v-if="errors.assigned_date" class="text-[11px] text-rose-500 mt-1 block font-bold">
            {{ errors.assigned_date }}
          </span>
        </div>

        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5 flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5 text-rose-500" />
            <span>آخر موعد للتسليم (الاستحقاق)</span>
            <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.due_date"
            type="date"
            class="w-full px-4 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title focus:outline-none focus:border-bx-primary transition-all"
          />
          <span v-if="errors.due_date" class="text-[11px] text-rose-500 mt-1 block font-bold">
            {{ errors.due_date }}
          </span>
        </div>
      </div>

      <!-- Attachments Section -->
      <div class="pt-2 border-t border-[#B4AED8]/50 dark:border-white/[0.06] space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <Paperclip class="w-3.5 h-3.5 text-bx-primary" />
            <span>المرفقات والملازم الدراسية</span>
          </label>
          <span class="text-[11px] text-bx-muted font-bold">
            {{ form.attachments.length }} مرفق
          </span>
        </div>

        <!-- Add Attachment Sub-form -->
        <div class="p-3.5 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] space-y-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              v-model="newAttachmentName"
              type="text"
              placeholder="اسم الملف (مثال: ملزمة الدرس.pdf)"
              class="px-3.5 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary text-start"
            />
            <input
              v-model="newAttachmentUrl"
              type="url"
              placeholder="رابط التحميل (URL)"
              class="px-3.5 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary text-start"
            />
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              @click="addAttachment"
              :disabled="!newAttachmentName.trim() || !newAttachmentUrl.trim()"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-500/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-purple-500/20 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>إدراج المرفق</span>
            </button>
          </div>
        </div>

        <!-- Attachments List -->
        <div v-if="form.attachments.length > 0" class="space-y-2">
          <div
            v-for="(att, idx) in form.attachments"
            :key="idx"
            class="flex items-center justify-between p-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)]"
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <FileText class="w-4 h-4 text-bx-primary shrink-0" />
              <div class="truncate">
                <span class="text-xs font-bold text-bx-title block truncate">{{ att.name }}</span>
                <span class="text-[10px] text-bx-muted font-mono block truncate">{{ att.url }}</span>
              </div>
            </div>

            <button
              type="button"
              @click="removeAttachment(idx)"
              class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
              title="حذف المرفق"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- Drawer Footer -->
    <template #footer>
      <div class="flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting"
          class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-sm"
        >
          <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <Save v-else class="w-3.5 h-3.5" />
          <span>{{ mode === 'create' ? 'نشر الواجب الآن' : 'حفظ التعديلات' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
