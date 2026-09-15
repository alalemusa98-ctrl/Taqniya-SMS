<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import {
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Paperclip,
  Loader2,
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
import type { QuizAttachment, QuizDetailData } from '../../api/quizzes.api';
import type { AssignmentItem } from '../../api/teaching-assignments.api';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

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
  quiz_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
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
          quiz_date: it.quiz_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
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
          quiz_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
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
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'رابط سحابي';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Image check helper
const isImageAttachment = (att: QuizAttachment): boolean => {
  const name = (att.file_name || att.name || '').toLowerCase();
  const type = (att.file_type || att.type || '').toLowerCase();
  const url = (att.file_url || att.url || '').toLowerCase();

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
    url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) !== null
  );
};

// Attachment type meta (Icon, Badge, Color)
const getAttachmentMeta = (att: QuizAttachment) => {
  const name = (att.file_name || att.name || '').toLowerCase();
  const type = (att.file_type || att.type || '').toLowerCase();
  const url = (att.file_url || att.url || '').toLowerCase();

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

// Handle File Selection (Upload Mode)
const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  Array.from(target.files).forEach((file) => {
    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      generalError.value = `الملف ${file.name} يتجاوز الحد الأقصى المسموح به (15 ميجابايت).`;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      form.value.attachments.push({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || 'file',
        file_url: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  });

  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// Add Web URL Link
const addUrlAttachment = () => {
  if (!newAttachmentUrl.value.trim()) return;

  let url = newAttachmentUrl.value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const name = newAttachmentName.value.trim() || 'رابط مذكرة أو مرجع خارجي';

  form.value.attachments.push({
    file_name: name,
    file_url: url,
    file_type: 'link',
    file_size: 0,
  });

  newAttachmentName.value = '';
  newAttachmentUrl.value = '';
};

// Remove an attachment
const removeAttachment = (index: number) => {
  form.value.attachments.splice(index, 1);
};

// Image Previewer Modal States
const showImageModal = ref(false);
const modalImageSrc = ref('');
const modalImageAlt = ref('');
const zoomLevel = ref(1);
const rotationDeg = ref(0);

const openImageModal = (att: QuizAttachment) => {
  modalImageSrc.value = att.file_url || att.url || '';
  modalImageAlt.value = att.file_name || att.name || 'مرفق توضيحي';
  zoomLevel.value = 1;
  rotationDeg.value = 0;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  modalImageSrc.value = '';
};

const handleModalKeydown = (e: KeyboardEvent) => {
  if (showImageModal.value && e.key === 'Escape') {
    closeImageModal();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleModalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleModalKeydown);
});

// Validate and Submit
const handleSubmit = () => {
  errors.value = {};
  generalError.value = null;

  if (!form.value.teaching_assignment_id) {
    errors.value.teaching_assignment_id = 'يرجى اختيار إسناد المادة والمعلم';
  }
  if (!form.value.title.trim()) {
    errors.value.title = 'يرجى إدخال عنوان الاختبار أو التطبيق';
  } else if (form.value.title.length > 200) {
    errors.value.title = 'عنوان الاختبار يجب ألا يتجاوز 200 حرف';
  }
  if (!form.value.quiz_date) {
    errors.value.quiz_date = 'يرجى تحديد تاريخ إجراء الاختبار';
  }

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  emit('submit', {
    academic_year_id: Number(form.value.academic_year_id),
    academic_term_id: Number(form.value.academic_term_id),
    class_section_id: Number(form.value.class_section_id),
    teaching_assignment_id: Number(form.value.teaching_assignment_id),
    title: form.value.title.trim(),
    description: form.value.description.trim() || undefined,
    quiz_date: form.value.quiz_date,
    attachments: form.value.attachments,
  });
};
</script>

<template>
  <div>
    <TaqniyaDrawer
      :is-open="modelValue"
      :title="mode === 'create' ? 'جدولة ونشر اختبار/تطبيق دوري جديد' : 'تعديل بيانات الاختبار الدوري والمرفقات'"
      max-width="max-w-2xl"
      @close="emit('update:modelValue', false)"
    >
      <form @submit.prevent="handleSubmit" class="space-y-6 text-start" dir="rtl">
        <!-- General Server/Validation Error Banner -->
        <div
          v-if="generalError"
          class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ generalError }}</span>
        </div>

        <!-- 1. Teaching Assignment (Subject & Teacher) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            المادة التعليمية والمعلم المسند <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            v-model="form.teaching_assignment_id"
            :options="teachingAssignmentOptions"
            placeholder="اختر المادة والشعبة المستهدفة..."
            searchable
            full-width
          />
          <p v-if="errors.teaching_assignment_id" class="text-[11px] text-rose-500 font-bold">
            {{ errors.teaching_assignment_id }}
          </p>
        </div>

        <!-- 2. Quiz Title -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            عنوان الاختبار / التطبيق الدوري <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="مثال: تطبيق الرياضيات الأسبوعي - الوحدة الثانية"
            class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all"
          />
          <p v-if="errors.title" class="text-[11px] text-rose-500 font-bold">
            {{ errors.title }}
          </p>
        </div>

        <!-- 3. Quiz Date (Date picker) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            تاريخ إجراء الاختبار / التطبيق <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.quiz_date"
            type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
          />
          <p v-if="errors.quiz_date" class="text-[11px] text-rose-500 font-bold">
            {{ errors.quiz_date }}
          </p>
        </div>

        <!-- 4. Description & Topics Notes -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            مواضيع الاختبار وملاحظات المراجعة (اختياري)
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="اكتب تعليمات الاختبار، أرقام الصفحات، أو محاور الأسئلة والتطبيقات..."
            class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all leading-relaxed"
          ></textarea>
        </div>

        <!-- 5. Attachments Section (Matching Homework Standards) -->
        <div class="space-y-3 pt-3 border-t border-[#B4AED8]/50 dark:border-white/[0.08]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-bold text-bx-title">
              <Paperclip class="w-4 h-4 text-bx-primary" />
              <span>ملازم ومذكرات المراجعة المرفقة</span>
              <span class="text-[11px] font-normal text-bx-muted">({{ form.attachments.length }} مرفقات)</span>
            </div>

            <!-- Upload Mode Switcher -->
            <div class="flex items-center gap-1 p-0.5 rounded-lg bg-purple-500/[0.06] border border-[#B4AED8]/40 dark:border-white/[0.06]">
              <button
                type="button"
                @click="attachmentMode = 'upload'"
                class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                :class="
                  attachmentMode === 'upload'
                    ? 'bg-bx-primary text-white shadow-2xs'
                    : 'text-bx-muted hover:text-bx-title'
                "
              >
                رفع ملفات
              </button>
              <button
                type="button"
                @click="attachmentMode = 'link'"
                class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                :class="
                  attachmentMode === 'link'
                    ? 'bg-bx-primary text-white shadow-2xs'
                    : 'text-bx-muted hover:text-bx-title'
                "
              >
                رابط إلكتروني
              </button>
            </div>
          </div>

          <!-- Mode A: File Upload Dropzone -->
          <div v-if="attachmentMode === 'upload'" class="space-y-2">
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              class="hidden"
              @change="handleFileSelected"
            />
            <div
              @click="fileInputRef?.click()"
              class="p-6 rounded-2xl border-2 border-dashed border-[#B4AED8] dark:border-white/[0.15] hover:border-bx-primary hover:bg-purple-500/[0.03] text-center transition-all cursor-pointer group space-y-2"
            >
              <div class="w-10 h-10 rounded-full bg-purple-500/10 text-bx-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <UploadCloud class="w-5 h-5" />
              </div>
              <div class="text-xs font-bold text-bx-title">
                انقر لاختيار أوراق العمل والمذكرات من جهازك
              </div>
              <p class="text-[11px] text-bx-muted">
                يدعم الصور (PNG, JPG)، ملفات PDF، ومستندات Office (بحد أقصى 15 ميجابايت)
              </p>
            </div>
          </div>

          <!-- Mode B: URL Link Input -->
          <div v-else class="p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] bg-purple-500/[0.02] space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                v-model="newAttachmentName"
                type="text"
                placeholder="اسم المرجع (مثال: بنك أسئلة الوحدة)"
                class="px-3 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary"
              />
              <input
                v-model="newAttachmentUrl"
                type="url"
                placeholder="الرابط (مثال: drive.google.com/...)"
                class="px-3 py-2 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary font-mono text-start"
              />
            </div>
            <div class="flex justify-end">
              <button
                type="button"
                @click="addUrlAttachment"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover transition-all cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>إضافة الرابط</span>
              </button>
            </div>
          </div>

          <!-- Attachment Items List -->
          <div v-if="form.attachments.length > 0" class="space-y-2 pt-2">
            <div
              v-for="(att, idx) in form.attachments"
              :key="idx"
              class="flex items-center justify-between p-2.5 rounded-xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] group hover:border-bx-primary/50 transition-all"
            >
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <!-- Thumbnail / Icon -->
                <div
                  v-if="isImageAttachment(att)"
                  class="w-9 h-9 rounded-lg overflow-hidden border border-purple-500/20 shrink-0 cursor-pointer relative group/thumb"
                  @click="openImageModal(att)"
                >
                  <img :src="att.file_url || att.url" :alt="att.file_name || att.name" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Eye class="w-3.5 h-3.5" />
                  </div>
                </div>
                <div
                  v-else
                  class="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                  :class="getAttachmentMeta(att).colorClass"
                >
                  <component :is="getAttachmentMeta(att).icon" class="w-4 h-4" />
                </div>

                <!-- Info -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-bx-title truncate block">{{ att.file_name || att.name }}</span>
                    <span
                      class="px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0"
                      :class="getAttachmentMeta(att).tagColor"
                    >
                      {{ getAttachmentMeta(att).label }}
                    </span>
                  </div>
                  <div class="text-[10px] text-bx-muted font-mono mt-0.5">
                    {{ formatFileSize(att.file_size || att.size) }}
                  </div>
                </div>
              </div>

              <!-- Delete Attachment -->
              <button
                type="button"
                @click="removeAttachment(idx)"
                class="p-1.5 rounded-lg text-bx-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="حذف المرفق"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-[#B4AED8]/60 dark:border-white/10">
          <button
            type="button"
            @click="emit('update:modelValue', false)"
            class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ mode === 'create' ? 'حفظ ونشر الاختبار' : 'حفظ التعديلات' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Modal for Previewing Attached Images -->
    <Teleport to="body">
      <div
        v-if="showImageModal"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        @click="closeImageModal"
      >
        <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3" @click.stop>
          <!-- Controls Toolbar -->
          <div class="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs">
            <button
              @click="zoomLevel = Math.min(zoomLevel + 0.25, 3)"
              class="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="تكبير"
            >
              <ZoomIn class="w-4 h-4" />
            </button>
            <button
              @click="zoomLevel = Math.max(zoomLevel - 0.25, 0.5)"
              class="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="تصغير"
            >
              <ZoomOut class="w-4 h-4" />
            </button>
            <button
              @click="rotationDeg = (rotationDeg + 90) % 360"
              class="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="تدوير"
            >
              <RotateCw class="w-4 h-4" />
            </button>
            <div class="w-px h-4 bg-white/20 mx-1" />
            <span class="text-[11px] font-mono">{{ Math.round(zoomLevel * 100) }}%</span>
            <button
              @click="closeImageModal"
              class="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-colors ms-2"
              title="إغلاق"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Image Display -->
          <div class="overflow-auto max-h-[75vh] rounded-2xl flex items-center justify-center">
            <img
              :src="modalImageSrc"
              :alt="modalImageAlt"
              class="max-w-full max-h-[75vh] object-contain transition-transform duration-150"
              :style="{
                transform: `scale(${zoomLevel}) rotate(${rotationDeg}deg)`,
              }"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
