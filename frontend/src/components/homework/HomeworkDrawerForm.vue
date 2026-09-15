<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
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
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  UploadCloud,
  Link2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
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

// Attachment Mode ('upload' | 'link')
const attachmentMode = ref<'upload' | 'link'>('upload');
const fileInputRef = ref<HTMLInputElement | null>(null);

// New URL Link input state
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
      attachmentMode.value = 'upload';

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

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Image check helper
const isImageAttachment = (att: HomeworkAttachment): boolean => {
  const name = (att.name || '').toLowerCase();
  const type = (att.type || '').toLowerCase();
  const url = (att.url || '').toLowerCase();

  return (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif') ||
    name.endsWith('.svg') ||
    name.endsWith('.bmp') ||
    type.includes('image') ||
    url.startsWith('data:image/') ||
    url.startsWith('blob:') ||
    url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) !== null
  );
};

// Handle Direct File Upload from Device
const triggerFilePicker = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  Array.from(target.files).forEach((file) => {
    const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    let previewUrl = `/uploads/assignments/${encodeURIComponent(file.name)}`;
    if (isImg && typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (e) {
        // fallback
      }
    }

    form.value.attachments.push({
      name: file.name,
      url: previewUrl,
      size: formatFileSize(file.size),
      type: file.type || file.name.split('.').pop() || 'file',
    });
  });

  // Reset input so user can pick the same file again if desired
  target.value = '';
};

// Handle External URL Link Addition
const addUrlAttachment = () => {
  if (!newAttachmentName.value.trim() && !newAttachmentUrl.value.trim()) return;

  let url = newAttachmentUrl.value.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = `https://${url}`;
  }

  const name = newAttachmentName.value.trim() || url || 'رابط مرفق';

  form.value.attachments.push({
    name,
    url: url || '#',
    type: 'link',
  });

  newAttachmentName.value = '';
  newAttachmentUrl.value = '';
};

const removeAttachment = (idx: number) => {
  form.value.attachments.splice(idx, 1);
};

// Lightbox Preview State for Form
const previewImage = ref<HomeworkAttachment | null>(null);
const zoomLevel = ref(1);
const rotation = ref(0);

const openPreview = (att: HomeworkAttachment) => {
  if (isImageAttachment(att) && att.url) {
    previewImage.value = att;
    zoomLevel.value = 1;
    rotation.value = 0;
  } else if (att.url && (att.url.startsWith('http') || att.url.startsWith('/'))) {
    window.open(att.url, '_blank', 'noopener,noreferrer');
  }
};

const closePreview = () => {
  previewImage.value = null;
  zoomLevel.value = 1;
  rotation.value = 0;
};

const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, +(zoomLevel.value + 0.25).toFixed(2));
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, +(zoomLevel.value - 0.25).toFixed(2));
  }
};

const resetZoom = () => {
  zoomLevel.value = 1;
  rotation.value = 0;
};

const rotateImage = () => {
  rotation.value = (rotation.value + 90) % 360;
};

// Keyboard listener for ESC
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && previewImage.value) {
    closePreview();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// Attachment type meta (Icon, Badge, Color)
const getAttachmentMeta = (att: HomeworkAttachment) => {
  const name = (att.name || '').toLowerCase();
  const type = (att.type || '').toLowerCase();
  const url = (att.url || '').toLowerCase();

  if (isImageAttachment(att)) {
    return {
      icon: ImageIcon,
      label: 'صورة توضيحية',
      colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
      tagColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      isImage: true,
    };
  }
  if (type === 'link' || (!name.includes('.') && url.startsWith('http'))) {
    return {
      icon: Link2,
      label: 'رابط خارجي',
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      tagColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      isImage: false,
    };
  }
  if (name.endsWith('.pdf') || type.includes('pdf')) {
    return {
      icon: FileText,
      label: 'مستند PDF',
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      tagColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      isImage: false,
    };
  }
  if (
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.csv') ||
    type.includes('sheet') ||
    type.includes('excel')
  ) {
    return {
      icon: FileSpreadsheet,
      label: 'جدول Excel',
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      tagColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      isImage: false,
    };
  }
  if (
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    type.includes('word') ||
    type.includes('document')
  ) {
    return {
      icon: FileText,
      label: 'مستند Word',
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      tagColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      isImage: false,
    };
  }
  if (
    name.endsWith('.ppt') ||
    name.endsWith('.pptx') ||
    type.includes('presentation') ||
    type.includes('powerpoint')
  ) {
    return {
      icon: Presentation,
      label: 'عرض تقديمي PPT',
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      tagColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
      isImage: false,
    };
  }

  return {
    icon: FileText,
    label: 'ملف مرفق',
    colorClass: 'text-bx-primary bg-purple-500/10 border-purple-500/20',
    tagColor: 'bg-purple-500/10 text-bx-primary border-purple-500/30',
    isImage: false,
  };
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

      <!-- Attachments Section (Dual Mode: Direct File Upload & External Link) -->
      <div class="pt-2 border-t border-[#B4AED8]/50 dark:border-white/[0.06] space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <Paperclip class="w-3.5 h-3.5 text-bx-primary" />
            <span>المرفقات والملازم الدراسية</span>
          </label>
          <span class="text-[11px] text-bx-muted font-bold">
            {{ form.attachments.length }} مرفقات مضافة
          </span>
        </div>

        <!-- Mode Switcher Tabs (File Upload vs External Link) -->
        <div class="flex items-center gap-1 p-1 rounded-xl bg-purple-500/[0.05] dark:bg-white/[0.03] border border-[#B4AED8]/40 dark:border-white/[0.06]">
          <button
            type="button"
            @click="attachmentMode = 'upload'"
            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            :class="attachmentMode === 'upload' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title'"
          >
            <UploadCloud class="w-3.5 h-3.5" />
            <span>رفع ملف من الجهاز</span>
          </button>

          <button
            type="button"
            @click="attachmentMode = 'link'"
            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            :class="attachmentMode === 'link' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title'"
          >
            <Link2 class="w-3.5 h-3.5" />
            <span>إرفاق رابط خارجي</span>
          </button>
        </div>

        <!-- Hidden Native File Input -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- 1. Upload from Device Zone -->
        <div
          v-if="attachmentMode === 'upload'"
          @click="triggerFilePicker"
          class="p-5 rounded-2xl border-2 border-dashed border-[#B4AED8] dark:border-white/[0.14] hover:border-bx-primary bg-purple-500/[0.02] hover:bg-purple-500/[0.05] transition-all cursor-pointer text-center space-y-2 group"
        >
          <div class="w-10 h-10 rounded-full bg-purple-500/10 text-bx-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <UploadCloud class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs font-bold text-bx-title block group-hover:text-bx-primary transition-colors">
              انقر لاختيار ملفات وملازم من جهازك
            </span>
            <span class="text-[11px] text-bx-muted block mt-0.5">
              يدعم ملفات PDF، Word، Excel، والصور التوضيحية
            </span>
          </div>
        </div>

        <!-- 2. External Link Input Box -->
        <div
          v-else
          class="p-3.5 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] space-y-2.5"
        >
          <div class="space-y-2">
            <input
              v-model="newAttachmentName"
              type="text"
              placeholder="اسم المرفق أو المستند (مثال: ملزمة الفصل الأول)"
              class="w-full px-3.5 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary text-start"
            />
            <input
              v-model="newAttachmentUrl"
              type="text"
              @keydown.enter.prevent="addUrlAttachment"
              placeholder="الرابط الخارجي (مثال: drive.google.com/file/...)"
              class="w-full px-3.5 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary text-start"
            />
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              @click="addUrlAttachment"
              :disabled="!newAttachmentUrl.trim() && !newAttachmentName.trim()"
              class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>إدراج الرابط</span>
            </button>
          </div>
        </div>

        <!-- Attachments List Preview -->
        <div v-if="form.attachments.length > 0" class="space-y-2 pt-1">
          <div
            v-for="(att, idx) in form.attachments"
            :key="idx"
            class="flex items-center justify-between p-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-2xs group"
          >
            <div
              class="flex items-center gap-2.5 overflow-hidden cursor-pointer"
              @click="openPreview(att)"
              :title="isImageAttachment(att) ? 'معاينة الصورة' : 'معاينة المرفق'"
            >
              <!-- Thumbnail for images or Type Icon -->
              <div
                v-if="isImageAttachment(att) && att.url"
                class="w-8 h-8 rounded-lg overflow-hidden border border-purple-500/30 bg-purple-500/10 shrink-0 relative group-hover:scale-105 transition-transform flex items-center justify-center"
              >
                <img
                  :src="att.url"
                  :alt="att.name"
                  class="w-full h-full object-cover"
                  @error="(e: any) => { e.target.style.display = 'none'; }"
                />
              </div>

              <div
                v-else
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                :class="getAttachmentMeta(att).colorClass"
              >
                <component :is="getAttachmentMeta(att).icon" class="w-4 h-4" />
              </div>

              <div class="truncate">
                <span class="text-xs font-bold text-bx-title block truncate group-hover:text-bx-primary transition-colors">{{ att.name }}</span>
                <div class="flex items-center gap-2 text-[10px] text-bx-muted">
                  <span
                    class="px-1.5 py-0.2 rounded border font-semibold text-[9px]"
                    :class="getAttachmentMeta(att).tagColor"
                  >
                    {{ getAttachmentMeta(att).label }}
                  </span>
                  <span v-if="att.size" class="font-mono">{{ att.size }}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons: Preview & Delete -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                @click="openPreview(att)"
                class="p-1.5 text-bx-primary hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                :title="isImageAttachment(att) ? 'معاينة الصورة' : 'معاينة الرابط'"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="removeAttachment(idx)"
                class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="إزالة المرفق"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
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

  <!-- Image Preview Lightbox Modal for Form -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="previewImage"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
        @click.self="closePreview"
      >
        <div
          class="relative w-full max-w-4xl max-h-[92vh] bg-slate-950/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
          dir="rtl"
        >
          <!-- Header -->
          <div class="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02] gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
                <ImageIcon class="w-5 h-5" />
              </div>
              <div class="truncate">
                <h4 class="font-bold text-sm text-white truncate">
                  {{ previewImage.name }}
                </h4>
                <p class="text-[11px] text-slate-400">
                  معاينة الصورة • {{ previewImage.size || 'حجم أصلي' }}
                </p>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                @click="zoomIn"
                class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="تكبير"
              >
                <ZoomIn class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="zoomOut"
                class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="تصغير"
              >
                <ZoomOut class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="rotateImage"
                class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="تدوير"
              >
                <RotateCw class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="resetZoom"
                class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                title="إعادة ضبط"
              >
                {{ Math.round(zoomLevel * 100) }}%
              </button>
              <button
                type="button"
                @click="closePreview"
                class="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-slate-300 hover:text-white transition-all cursor-pointer ml-1"
                title="إغلاق (Esc)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Image Canvas -->
          <div
            class="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] max-h-[calc(90vh-120px)] bg-black/50 relative select-none"
            @dblclick="resetZoom"
          >
            <img
              :src="previewImage.url"
              :alt="previewImage.name"
              class="max-w-full max-h-full object-contain rounded-xl transition-transform duration-200 shadow-2xl cursor-zoom-in"
              :style="{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }"
            />
          </div>

          <!-- Footer tip -->
          <div class="px-5 py-2.5 bg-black/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>انقر مرتين لإعادة الحجم الأصلي</span>
            <span>اضغط Esc أو انقر بالخارج للإغلاق</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
