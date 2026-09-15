<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import {
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Paperclip,
  Loader2,
  Calendar,
  Clock,
  School,
  BookOpen,
  Layers,
  Sparkles,
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
import type { ExamAttachment, OfficialExam } from '../../api/official-exams.api';
import type { AcademicClassItem, AcademicSubjectItem, AcademicTermItem, AcademicYearItem } from '../../api/academic.api';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  itemToEdit?: OfficialExam | null;
  academicYears: AcademicYearItem[];
  academicTerms: AcademicTermItem[];
  classes: AcademicClassItem[];
  subjects: AcademicSubjectItem[];
  classSubjects?: any[];
  classAcademicTerms?: any[];
  activeYearId: number;
  activeTermId?: number | null;
  isSubmitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'submit', payload: any): void;
}>();

const form = ref<{
  academic_year_id: number;
  academic_term_id: number;
  class_id: number;
  subject_id: number;
  exam_type: 'midterm' | 'final' | 'second_round';
  exam_date: string;
  notes: string;
  attachments: ExamAttachment[];
}>({
  academic_year_id: 0,
  academic_term_id: 0,
  class_id: 0,
  subject_id: 0,
  exam_type: 'final',
  exam_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  notes: '',
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

// Active Academic Context (Year)
const activeYearObject = computed(() => {
  if (form.value.academic_year_id) {
    return props.academicYears.find((y) => y.id === form.value.academic_year_id);
  }
  return (
    props.academicYears.find((y) => y.id === props.activeYearId) ||
    props.academicYears.find((y) => y.is_active) ||
    props.academicYears[0]
  );
});

// Dynamic Active Term for the SELECTED CLASS (SSoT from Phase 02-C)
const selectedClassTermsInfo = computed(() => {
  if (!form.value.class_id) {
    return {
      activeTerm: null,
      availableTerms: [],
      hasActiveTerm: false,
    };
  }

  const classId = Number(form.value.class_id);

  // 1. Look in classAcademicTerms (SSoT)
  const termsList = Array.isArray(props.classAcademicTerms)
    ? props.classAcademicTerms
    : (props.classAcademicTerms as any)?.classes || [];

  if (termsList && termsList.length > 0) {
    const classTermsGroup = termsList.find((g: any) => Number(g.class_id) === classId);
    if (classTermsGroup && classTermsGroup.terms && classTermsGroup.terms.length > 0) {
      const activeTerm = classTermsGroup.terms.find((t: any) => Number(t.is_active) === 1 || t.is_active === true);
      return {
        activeTerm: activeTerm || null,
        availableTerms: classTermsGroup.terms,
        hasActiveTerm: !!activeTerm,
      };
    }
  }

  // 2. Look in classSubjects
  const subsList = Array.isArray(props.classSubjects)
    ? props.classSubjects
    : (props.classSubjects as any)?.classes || [];

  if (subsList && subsList.length > 0) {
    const classSubGroup = subsList.find((g: any) => Number(g.class_id) === classId);
    if (classSubGroup && classSubGroup.terms && classSubGroup.terms.length > 0) {
      const activeTerm = classSubGroup.terms.find((t: any) => Number(t.is_active) === 1 || t.is_active === true);
      return {
        activeTerm: activeTerm || null,
        availableTerms: classSubGroup.terms,
        hasActiveTerm: !!activeTerm,
      };
    }
  }

  // 3. Fallback to global active term
  const fallback = props.academicTerms.find((t) => t.id === props.activeTermId) || props.academicTerms[0];
  return {
    activeTerm: fallback ? { academic_term_id: fallback.id, term_name: fallback.name, is_active: 1 } : null,
    availableTerms: [],
    hasActiveTerm: !!fallback,
  };
});

// Term name to display in the UI
const displayTermName = computed(() => {
  if (!form.value.class_id) {
    return 'حدد الصف الدراسي أولاً لتحديد فترته النشطة';
  }
  const termInfo = selectedClassTermsInfo.value.activeTerm;
  if (termInfo) {
    return termInfo.term_name || `الفصل الدراسي ${termInfo.academic_term_id}`;
  }
  if (!selectedClassTermsInfo.value.hasActiveTerm) {
    return 'لا توجد فترة نشطة لهذا الصف';
  }
  const globalTerm = props.academicTerms.find((t) => t.id === form.value.academic_term_id);
  return globalTerm?.name || 'الفصل الدراسي الأول';
});

// 1. Class Options
const classOptions = computed<TaqniyaSelectOption[]>(() =>
  props.classes.map((c) => ({
    value: c.id,
    label: c.name,
    description: `المستوى الأكاديمي: ${c.grade_level}`,
  })),
);

// 2. Cascading Subject Options (Filtered strictly by selected class and its active term)
const classSubjectOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!form.value.class_id) {
    return [{ value: '', label: 'يرجى اختيار الصف أولاً...' }];
  }

  const classId = Number(form.value.class_id);
  const activeTermId = form.value.academic_term_id;

  const subsList = Array.isArray(props.classSubjects)
    ? props.classSubjects
    : (props.classSubjects as any)?.classes || [];

  if (subsList && subsList.length > 0) {
    const classObj = subsList.find((c: any) => Number(c.class_id) === classId);
    if (classObj && classObj.terms) {
      let targetTerm = classObj.terms.find(
        (t: any) => Number(t.is_active) === 1 || (t.academic_term_id && Number(t.academic_term_id) === Number(activeTermId)),
      );
      if (!targetTerm && classObj.terms.length > 0) {
        targetTerm = classObj.terms[0];
      }

      if (targetTerm && targetTerm.subjects && targetTerm.subjects.length > 0) {
        return targetTerm.subjects.map((s: any) => ({
          value: s.subject_id,
          label: s.name,
          description: s.code ? `كود المادة: ${s.code}` : undefined,
        }));
      }

      const subs: any[] = [];
      classObj.terms.forEach((t: any) => {
        t.subjects?.forEach((s: any) => {
          if (!subs.some((existing) => existing.subject_id === s.subject_id)) {
            subs.push(s);
          }
        });
      });
      if (subs.length > 0) {
        return subs.map((s: any) => ({
          value: s.subject_id,
          label: s.name,
          description: s.code ? `كود المادة: ${s.code}` : undefined,
        }));
      }
    }
  }

  return props.subjects.map((s) => ({
    value: s.id,
    label: s.name,
    description: s.code ? `كود: ${s.code}` : undefined,
  }));
});

// 3. Exam Type Options
const examTypeOptions: TaqniyaSelectOption[] = [
  { value: 'midterm', label: 'امتحان نصفي (Midterm)', description: 'امتحان منتصف الفصل الدراسي' },
  { value: 'final', label: 'امتحان نهائي (Final)', description: 'الامتحان النهائي المعتمد للفصل' },
  { value: 'second_round', label: 'امتحان دور ثانٍ (Second Round)', description: 'امتحان الإعادة والدور الثاني' },
];

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'رابط سحابي';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Image check helper
const isImageAttachment = (att: ExamAttachment): boolean => {
  const name = (att.file_name || (att as any).name || '').toLowerCase();
  const type = (att.file_type || (att as any).type || '').toLowerCase();
  const url = (att.file_url || (att as any).url || '').toLowerCase();

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

// Attachment type meta (Matching Quizzes & Homework)
const getAttachmentMeta = (att: ExamAttachment) => {
  const name = (att.file_name || (att as any).name || '').toLowerCase();
  const type = (att.file_type || (att as any).type || '').toLowerCase();
  const url = (att.file_url || (att as any).url || '').toLowerCase();

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
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  Array.from(target.files).forEach((file) => {
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
const addLinkAttachment = () => {
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

const openImageModal = (att: ExamAttachment) => {
  modalImageSrc.value = att.file_url || (att as any).url || '';
  modalImageAlt.value = att.file_name || (att as any).name || 'مرفق توضيحي';
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

// Watch when drawer opens or mode changes
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
        const item = props.itemToEdit as any;
        form.value = {
          academic_year_id: item.academic_year_id || props.activeYearId,
          academic_term_id: item.academic_term_id || 0,
          class_id: item.class_id || 0,
          subject_id: item.subject_id || 0,
          exam_type: item.exam_type || 'final',
          exam_date: item.exam_date ? item.exam_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          notes: item.notes || '',
          attachments: Array.isArray(item.attachments) ? JSON.parse(JSON.stringify(item.attachments)) : [],
        };
      } else {
        const resolvedYearId = props.activeYearId || props.academicYears.find((y) => y.is_active)?.id || props.academicYears[0]?.id || 0;

        form.value = {
          academic_year_id: resolvedYearId,
          academic_term_id: 0,
          class_id: 0,
          subject_id: 0,
          exam_type: 'final',
          exam_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          notes: '',
          attachments: [],
        };
      }
    }
  },
  { immediate: true },
);

// Auto-assign active term and reset subject when class changes in create mode
watch(
  () => form.value.class_id,
  (newClassId, oldClassId) => {
    if (newClassId) {
      const activeTerm = selectedClassTermsInfo.value.activeTerm;
      if (activeTerm && activeTerm.academic_term_id) {
        form.value.academic_term_id = Number(activeTerm.academic_term_id);
      }
      if (props.mode === 'create' && oldClassId && newClassId !== oldClassId) {
        form.value.subject_id = 0;
      }
    }
  },
);

function validate() {
  errors.value = {};
  generalError.value = null;

  if (!form.value.academic_year_id) {
    form.value.academic_year_id = activeYearObject.value?.id || 0;
  }
  if (!form.value.academic_term_id) {
    const classTerm = selectedClassTermsInfo.value.activeTerm;
    form.value.academic_term_id = Number(classTerm?.academic_term_id || props.activeTermId || props.academicTerms[0]?.id || 0);
  }

  if (!form.value.class_id) errors.value.class_id = 'يرجى اختيار الصف الدراسي المستهدف';
  if (!form.value.subject_id) errors.value.subject_id = 'يرجى اختيار المادة المقررة للامتحان';
  if (!form.value.exam_type) errors.value.exam_type = 'يرجى تحديد نوع الامتحان الرسمي';
  if (!form.value.exam_date) errors.value.exam_date = 'يرجى تحديد تاريخ يوم الامتحان';

  return Object.keys(errors.value).length === 0;
}

function handleSubmit() {
  if (!validate()) return;
  emit('submit', { ...form.value });
}
</script>

<template>
  <div>
    <TaqniyaDrawer
      :is-open="modelValue"
      :title="mode === 'create' ? 'جدولة ونشر موعد امتحان رسمي جديد' : 'تعديل بيانات الامتحان الرسمي والمرفقات'"
      :subtitle="mode === 'create' ? 'إضافة موعد امتحان رسمي معتمد لكافة طلاب الصف المستهدف' : 'تحديث القاعات والمذكرات المرفقة والمواعيد المعتمدة'"
      :icon="Calendar"
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

        <!-- 1. Auto Academic Context Badge (Non-Editable, Auto-Determined from Selected Class Active Period) -->
        <div class="flex items-center justify-between p-4 rounded-2xl bg-purple-500/[0.04] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.08] text-xs flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-bx-primary" />
            <span class="text-bx-muted font-bold">العام الدراسي:</span>
            <span class="font-black text-bx-title">{{ activeYearObject?.name || '2025/2026' }}</span>
          </div>

          <div class="h-4 w-px bg-[#B4AED8]/40 dark:bg-white/10 hidden sm:block"></div>

          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-bx-primary" />
            <span class="text-bx-muted font-bold">الفترة / الفصل الدراسي:</span>
            <span class="font-black" :class="form.class_id ? 'text-bx-primary' : 'text-bx-muted'">
              {{ displayTermName }}
            </span>
          </div>

          <span
            class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs"
            :class="form.class_id ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-purple-500/10 text-bx-primary border-purple-500/20'"
          >
            <Sparkles class="w-3 h-3" />
            <span>{{ form.class_id ? 'الفترة النشطة للصف' : 'معتمد تلقائياً' }}</span>
          </span>
        </div>

        <!-- 2. Cascading Academic Structure Grid (Class, Subject) -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] space-y-4">
          <div class="text-[11px] font-black text-bx-primary flex items-center gap-1.5 pb-2 border-b border-[#B4AED8]/30 dark:border-white/10">
            <Layers class="w-3.5 h-3.5" />
            <span>الصف الدراسي والمادة المقررة للامتحان</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- 2.1 Target Class Selection -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-bx-title flex items-center gap-1">
                <School class="w-3.5 h-3.5 text-bx-primary" />
                <span>1. الصف الدراسي المستهدف</span>
                <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="form.class_id"
                :options="classOptions"
                placeholder="اختر الصف الدراسي..."
                search-placeholder="ابحث في الصفوف..."
                searchable
                full-width
                :disabled="mode === 'edit'"
              />
              <p v-if="errors.class_id" class="text-[10px] text-rose-500 font-bold">
                {{ errors.class_id }}
              </p>
            </div>

            <!-- 2.2 Cascading Subject Selection -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-bx-title flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                  <span>2. المادة المقررة</span>
                  <span class="text-rose-500">*</span>
                </div>
                <span v-if="form.class_id" class="text-[10px] text-bx-muted font-normal">
                  ({{ classSubjectOptions.length }} مادة)
                </span>
              </label>
              <TaqniyaSelect
                v-model="form.subject_id"
                :options="classSubjectOptions"
                :disabled="!form.class_id"
                placeholder="اختر المادة المقررة للامتحان..."
                search-placeholder="ابحث في المواد المقررة..."
                searchable
                full-width
              />
              <p v-if="errors.subject_id" class="text-[10px] text-rose-500 font-bold">
                {{ errors.subject_id }}
              </p>
            </div>
          </div>
        </div>

        <!-- 3. Exam Type & Date Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- Exam Type -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-bx-title">
              نوع الامتحان الرسمي <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              v-model="form.exam_type"
              :options="examTypeOptions"
              placeholder="اختر نوع الامتحان..."
              full-width
            />
            <p v-if="errors.exam_type" class="text-[11px] text-rose-500 font-bold">
              {{ errors.exam_type }}
            </p>
          </div>

          <!-- Exam Date -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-bx-title flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-bx-primary" />
              <span>تاريخ إجراء الامتحان</span>
              <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.exam_date"
              type="date"
              class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
            <p v-if="errors.exam_date" class="text-[11px] text-rose-500 font-bold">
              {{ errors.exam_date }}
            </p>
          </div>
        </div>

        <!-- 4. Notes & Hall Guidelines -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            القاعة المخصصة والتعليمات الإرشادية (اختياري)
          </label>
          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="اكتب تعليمات الامتحان، القاعة، أو الملاحظات والتوجيهات للطلاب..."
            class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all leading-relaxed"
          ></textarea>
        </div>

        <!-- 5. Attachments Section (Upload & Link Modes) -->
        <div class="space-y-3 pt-3 border-t border-[#B4AED8]/50 dark:border-white/[0.08]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-bold text-bx-title">
              <Paperclip class="w-4 h-4 text-bx-primary" />
              <span>ملازم ومذكرات المراجعة وجداول المواصفات</span>
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
              @change="handleFileUpload"
            />
            <div
              @click="fileInputRef?.click()"
              class="p-6 rounded-2xl border-2 border-dashed border-[#B4AED8] dark:border-white/[0.15] hover:border-bx-primary hover:bg-purple-500/[0.03] text-center transition-all cursor-pointer group space-y-2"
            >
              <div class="w-10 h-10 rounded-full bg-purple-500/10 text-bx-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <UploadCloud class="w-5 h-5" />
              </div>
              <div class="text-xs font-bold text-bx-title">
                انقر لاختيار أوراق العمل والمذكرات وجدول المواصفات من جهازك
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
                placeholder="اسم المرجع (مثال: جدول مواصفات الامتحان)"
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
                @click="addLinkAttachment"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover transition-all cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>إضافة الرابط</span>
              </button>
            </div>
          </div>

          <!-- Attachment Items List -->
          <div v-if="form.attachments.length > 0" class="space-y-2.5 pt-2">
            <div
              v-for="(att, idx) in form.attachments"
              :key="idx"
              class="flex items-center justify-between p-3 rounded-2xl border border-[#B4AED8]/70 dark:border-white/[0.1] bg-[var(--bx-surface-solid)] shadow-xs hover:shadow-md hover:border-bx-primary/60 transition-all group gap-3"
            >
              <div class="flex items-center gap-3.5 min-w-0 flex-1">
                <!-- Thumbnail / Icon (48x48) -->
                <div
                  v-if="isImageAttachment(att)"
                  class="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500/30 shrink-0 cursor-pointer relative group/thumb shadow-xs"
                  @click="openImageModal(att)"
                  title="انقر للمعاينة والتكبير"
                >
                  <img :src="att.file_url || (att as any).url" :alt="att.file_name || (att as any).name" class="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-[1px]">
                    <Eye class="w-4 h-4" />
                  </div>
                </div>
                <div
                  v-else
                  class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
                  :class="getAttachmentMeta(att).colorClass"
                >
                  <component :is="getAttachmentMeta(att).icon" class="w-6 h-6 stroke-[1.8]" />
                </div>

                <!-- File Meta Details -->
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="text-xs font-black text-bx-title truncate block leading-snug" :title="att.file_name || (att as any).name">
                    {{ att.file_name || (att as any).name }}
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs"
                      :class="getAttachmentMeta(att).tagColor"
                    >
                      {{ getAttachmentMeta(att).label }}
                    </span>
                    <span class="text-[11px] text-bx-muted font-mono">
                      {{ formatFileSize(att.file_size || (att as any).size) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Delete Action Button -->
              <button
                type="button"
                @click="removeAttachment(idx)"
                class="w-9 h-9 rounded-full border border-rose-500/25 bg-rose-500/5 hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs hover:scale-105 active:scale-95"
                title="حذف هذا المرفق"
              >
                <Trash2 class="w-4 h-4" />
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
            <span>{{ mode === 'create' ? 'حفظ وجدولة الامتحان' : 'حفظ التعديلات' }}</span>
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
              class="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="تكبير"
            >
              <ZoomIn class="w-4 h-4" />
            </button>
            <button
              @click="zoomLevel = Math.max(zoomLevel - 0.25, 0.5)"
              class="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="تصغير"
            >
              <ZoomOut class="w-4 h-4" />
            </button>
            <button
              @click="rotationDeg = (rotationDeg + 90) % 360"
              class="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="تدوير"
            >
              <RotateCw class="w-4 h-4" />
            </button>
            <div class="w-px h-4 bg-white/20 mx-1" />
            <span class="text-[11px] font-mono">{{ Math.round(zoomLevel * 100) }}%</span>
            <button
              @click="closeImageModal"
              class="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-colors ms-2 cursor-pointer"
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
