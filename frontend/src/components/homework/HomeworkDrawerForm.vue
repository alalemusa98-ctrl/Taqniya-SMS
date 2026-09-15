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
  UserCheck,
  School,
  Layers,
} from 'lucide-vue-next';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type { HomeworkAttachment, HomeworkDetailData } from '../../api/homework.api';
import { teachingAssignmentsApi, type TeacherWorkloadItem } from '../../api/teaching-assignments.api';
import { teachersApi, type Teacher } from '../../api/teachers.api';
import { useAuthStore } from '../../stores/auth.store';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  itemToEdit?: HomeworkDetailData | null;
  academicYearId: number;
  academicTermId?: number | null;
  teachers?: Teacher[];
  isSubmitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'submit', payload: any): void;
}>();

const authStore = useAuthStore();
const isTeacherRole = computed(() => authStore.user?.role_type === 'teacher');

// Teacher Cascading Selection States
const localTeachers = ref<Teacher[]>([]);
const selectedTeacherId = ref<number | null>(null);
const selectedClassId = ref<number | null>(null);
const selectedClassSectionId = ref<number | null>(null);
const selectedAssignmentId = ref<number | null>(null);

const teacherAssignments = ref<TeacherWorkloadItem[]>([]);
const loadingAssignments = ref(false);

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

// 1. Teacher Options
const teacherOptions = computed<TaqniyaSelectOption[]>(() => {
  const list = props.teachers && props.teachers.length > 0 ? props.teachers : localTeachers.value;
  return list.map((t) => ({
    value: t.id,
    label: t.full_name,
    description: t.specialization ? `تخصص: ${t.specialization}` : (t.user_code ? `كود: ${t.user_code}` : undefined),
  }));
});

// 2. Class Options (Derived from Teacher's Assignments)
const teacherClassOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedTeacherId.value) {
    return [{ value: '', label: 'يرجى اختيار المعلم أولاً...' }];
  }
  if (loadingAssignments.value) {
    return [{ value: '', label: 'جاري جلب الفصول والصفوف...' }];
  }
  if (teacherAssignments.value.length === 0) {
    return [{ value: '', label: 'لا توجد فصول مسندة لهذا المعلم' }];
  }

  const uniqueClasses = new Map<number, string>();
  teacherAssignments.value.forEach((a) => {
    if (!uniqueClasses.has(a.class_id)) {
      uniqueClasses.set(a.class_id, a.class_name);
    }
  });

  return Array.from(uniqueClasses.entries()).map(([id, name]) => ({
    value: id,
    label: name,
  }));
});

// 3. Section Options (Derived from Teacher's Assignments for Selected Class)
const teacherSectionOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedClassId.value) {
    return [{ value: '', label: 'يرجى اختيار الصف أولاً...' }];
  }

  const sectionsForClass = teacherAssignments.value.filter(
    (a) => a.class_id === Number(selectedClassId.value),
  );

  const uniqueSections = new Map<number, string>();
  sectionsForClass.forEach((a) => {
    if (!uniqueSections.has(a.class_section_id)) {
      uniqueSections.set(a.class_section_id, a.section_name);
    }
  });

  return Array.from(uniqueSections.entries()).map(([id, name]) => ({
    value: id,
    label: name,
  }));
});

// 4. Subject / Assignment Options (Derived from Teacher's Assignments for Selected Class & Section)
const teacherSubjectOptions = computed<TaqniyaSelectOption[]>(() => {
  if (!selectedClassSectionId.value) {
    return [{ value: '', label: 'يرجى اختيار الشعبة أولاً...' }];
  }

  const assignmentsForSection = teacherAssignments.value.filter(
    (a) => a.class_section_id === Number(selectedClassSectionId.value),
  );

  return assignmentsForSection.map((a) => ({
    value: a.id,
    label: a.subject_name,
    description: a.subject_code ? `كود المادة: ${a.subject_code}` : undefined,
  }));
});

// Fetch teacher assignments whenever selectedTeacherId changes
const fetchTeacherAssignments = async (teacherId: number, isInitialEdit = false) => {
  loadingAssignments.value = true;
  try {
    const res = await teachingAssignmentsApi.getTeacherAssignments(teacherId, {
      academic_year_id: props.academicYearId || undefined,
    });
    const data = (res.data as any)?.data || (res as any)?.data || [];
    teacherAssignments.value = Array.isArray(data) ? data : [];

    if (!isInitialEdit) {
      selectedClassId.value = null;
      selectedClassSectionId.value = null;
      selectedAssignmentId.value = null;
      form.value.teaching_assignment_id = 0;
      form.value.class_section_id = 0;

      // Auto select if only 1 class
      if (teacherClassOptions.value.length === 1 && teacherClassOptions.value[0].value) {
        selectedClassId.value = Number(teacherClassOptions.value[0].value);
      }
    }
  } catch (err) {
    console.error('Failed to fetch assignments for teacher', err);
    teacherAssignments.value = [];
  } finally {
    loadingAssignments.value = false;
  }
};

// Handle Teacher Selection Change
watch(selectedTeacherId, (newTeacherId) => {
  if (newTeacherId && props.modelValue) {
    fetchTeacherAssignments(Number(newTeacherId));
  } else {
    teacherAssignments.value = [];
    selectedClassId.value = null;
    selectedClassSectionId.value = null;
    selectedAssignmentId.value = null;
    form.value.teaching_assignment_id = 0;
    form.value.class_section_id = 0;
  }
});

// Handle Class Selection Change
watch(selectedClassId, (newClassId) => {
  if (newClassId) {
    if (props.mode === 'create') {
      selectedClassSectionId.value = null;
      selectedAssignmentId.value = null;
      form.value.teaching_assignment_id = 0;
      form.value.class_section_id = 0;

      // Auto select if only 1 section in this class
      const availableSections = teacherAssignments.value.filter(
        (a) => a.class_id === Number(newClassId),
      );
      const uniqueSectionIds = [...new Set(availableSections.map((a) => a.class_section_id))];
      if (uniqueSectionIds.length === 1) {
        selectedClassSectionId.value = uniqueSectionIds[0];
      }
    }
  }
});

// Handle Section Selection Change
watch(selectedClassSectionId, (newSectionId) => {
  if (newSectionId) {
    form.value.class_section_id = Number(newSectionId);
    if (props.mode === 'create') {
      selectedAssignmentId.value = null;
      form.value.teaching_assignment_id = 0;

      // Auto select if only 1 subject assignment in this section
      const availableSubjects = teacherAssignments.value.filter(
        (a) => a.class_section_id === Number(newSectionId),
      );
      if (availableSubjects.length === 1) {
        selectedAssignmentId.value = availableSubjects[0].id;
        form.value.teaching_assignment_id = availableSubjects[0].id;
      }
    }
  }
});

// Handle Subject Assignment Selection Change
watch(selectedAssignmentId, (newAssignmentId) => {
  if (newAssignmentId) {
    form.value.teaching_assignment_id = Number(newAssignmentId);
    const found = teacherAssignments.value.find((a) => a.id === Number(newAssignmentId));
    if (found) {
      form.value.class_section_id = found.class_section_id;
    }
  }
});

// Drawer Open / Reset handler
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      errors.value = {};
      generalError.value = null;
      newAttachmentName.value = '';
      newAttachmentUrl.value = '';
      attachmentMode.value = 'upload';

      // Load teachers if not passed
      if ((!props.teachers || props.teachers.length === 0) && localTeachers.value.length === 0) {
        try {
          const res = await teachersApi.getTeachers({ per_page: 200, is_active: 1 });
          const tList = res.data?.data || (res as any).data || [];
          if (Array.isArray(tList)) {
            localTeachers.value = tList;
          }
        } catch (err) {
          console.error('Failed to load teachers list', err);
        }
      }

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

        if (it.teacher_id) {
          selectedTeacherId.value = it.teacher_id;
          await fetchTeacherAssignments(it.teacher_id, true);
          selectedClassId.value = it.class_id || null;
          selectedClassSectionId.value = it.class_section_id || null;
          selectedAssignmentId.value = it.teaching_assignment_id || null;
        }
      } else {
        form.value = {
          academic_year_id: props.academicYearId || 0,
          academic_term_id: props.academicTermId || 1,
          class_section_id: 0,
          teaching_assignment_id: 0,
          title: '',
          description: '',
          assigned_date: new Date().toISOString().slice(0, 10),
          due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
          attachments: [],
        };

        selectedTeacherId.value = null;
        selectedClassId.value = null;
        selectedClassSectionId.value = null;
        selectedAssignmentId.value = null;
        teacherAssignments.value = [];

        // If user is a teacher, pre-select their teacher profile
        if (isTeacherRole.value && authStore.user) {
          const list = props.teachers && props.teachers.length > 0 ? props.teachers : localTeachers.value;
          const myTeacherProfile = list.find((t) => Number(t.user_id) === Number(authStore.user?.id));
          if (myTeacherProfile) {
            selectedTeacherId.value = myTeacherProfile.id;
          }
        }
      }
    }
  },
  { immediate: true },
);

// Format file size
const formatFileSize = (bytes?: number | string): string => {
  if (!bytes) return 'رابط سحابي';
  if (typeof bytes === 'string') return bytes;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Image check helper
const isImageAttachment = (att: HomeworkAttachment): boolean => {
  const name = (att.name || att.file_name || '').toLowerCase();
  const type = (att.type || att.file_type || '').toLowerCase();
  const url = (att.url || att.file_url || '').toLowerCase();

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

// Attachment type meta (Icon, Badge, Color)
const getAttachmentMeta = (att: HomeworkAttachment) => {
  const name = (att.name || att.file_name || '').toLowerCase();
  const type = (att.type || att.file_type || '').toLowerCase();
  const url = (att.url || att.file_url || '').toLowerCase();

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
    if (file.size > 15 * 1024 * 1024) {
      generalError.value = `الملف ${file.name} يتجاوز الحد الأقصى المسموح به (15 ميجابايت).`;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      form.value.attachments.push({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'file',
        url: dataUrl,
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
    name,
    url,
    type: 'link',
    size: 'رابط سحابي',
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

const openImageModal = (att: HomeworkAttachment) => {
  modalImageSrc.value = att.url || att.file_url || '';
  modalImageAlt.value = att.name || att.file_name || 'مرفق توضيحي';
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

  if (!selectedTeacherId.value) {
    errors.value.teacher_id = 'يرجى اختيار المعلم / الأستاذ';
  }
  if (!selectedClassId.value) {
    errors.value.class_id = 'يرجى اختيار الصف الدراسي';
  }
  if (!selectedClassSectionId.value) {
    errors.value.class_section_id = 'يرجى اختيار الشعبة الدراسية';
  }
  if (!form.value.teaching_assignment_id) {
    errors.value.teaching_assignment_id = 'يرجى اختيار المادة التعليمية المسندة';
  }
  if (!form.value.title.trim()) {
    errors.value.title = 'يرجى إدخال عنوان الواجب / النشاط المنزلي';
  } else if (form.value.title.length > 200) {
    errors.value.title = 'عنوان الواجب يجب ألا يتجاوز 200 حرف';
  }
  if (!form.value.assigned_date) {
    errors.value.assigned_date = 'تاريخ النشر والتكليف مطلوب';
  }
  if (!form.value.due_date) {
    errors.value.due_date = 'تاريخ الاستحقاق مطلوب';
  } else if (new Date(form.value.due_date) < new Date(form.value.assigned_date)) {
    errors.value.due_date = 'تاريخ الاستحقاق لا يمكن أن يكون سابقاً لتاريخ التكليف';
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
    assigned_date: form.value.assigned_date,
    due_date: form.value.due_date,
    attachments: form.value.attachments,
  });
};
</script>

<template>
  <div>
    <TaqniyaDrawer
      :is-open="modelValue"
      :title="mode === 'create' ? 'إنشاء وتكليف واجب مدرسي جديد' : 'تعديل بيانات الواجب المدرسي والمرفقات'"
      :subtitle="mode === 'create' ? 'تكليف الطلاب وإرفاق الملازم ومواعيد الاستحقاق' : 'تحديث التفاصيل ومواعيد التسليم والمرفقات'"
      :icon="BookOpen"
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

        <!-- 1. Teacher Selector (Step 1: On-Select triggers GET /teachers/:id/assignments) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <UserCheck class="w-3.5 h-3.5 text-bx-primary" />
              <span>1. المعلم / الأستاذ المشرف</span>
              <span class="text-rose-500">*</span>
            </div>
            <span v-if="loadingAssignments" class="text-[11px] text-bx-primary font-bold flex items-center gap-1">
              <Loader2 class="w-3 h-3 animate-spin" />
              <span>جاري استعلام الفصول والشعب المسندة...</span>
            </span>
          </label>
          <TaqniyaSelect
            v-model="selectedTeacherId"
            :options="teacherOptions"
            placeholder="اختر اسم المعلم لجلب الفصول والشعب المسندة إليه فوراً..."
            search-placeholder="ابحث باسم المعلم أو التخصص أو الكود..."
            searchable
            full-width
            :disabled="mode === 'edit'"
          />
          <p v-if="errors.teacher_id" class="text-[11px] text-rose-500 font-bold">
            {{ errors.teacher_id }}
          </p>
        </div>

        <!-- 2. Cascading Academic Structure Grid (Class, Section, Subject) -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] space-y-4">
          <div class="text-[11px] font-black text-bx-primary flex items-center gap-1.5 pb-2 border-b border-[#B4AED8]/30 dark:border-white/10">
            <Layers class="w-3.5 h-3.5" />
            <span>نصاب وتكليف التدريس المسند للمعلم المختار</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- 2.1 Class Selection (Derived from Teacher's Assignments) -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-bx-title flex items-center gap-1">
                <School class="w-3.5 h-3.5 text-bx-primary" />
                <span>2. الصف الدراسي</span>
                <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="selectedClassId"
                :options="teacherClassOptions"
                :disabled="!selectedTeacherId || loadingAssignments || teacherAssignments.length === 0"
                placeholder="اختر الصف..."
                search-placeholder="ابحث في الصفوف..."
                searchable
                full-width
              />
              <p v-if="errors.class_id" class="text-[10px] text-rose-500 font-bold">
                {{ errors.class_id }}
              </p>
            </div>

            <!-- 2.2 Section Selection (Derived from Teacher's Assignments in selected class) -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-bx-title flex items-center gap-1">
                <Layers class="w-3.5 h-3.5 text-bx-primary" />
                <span>3. الشعبة الدراسية</span>
                <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="selectedClassSectionId"
                :options="teacherSectionOptions"
                :disabled="!selectedClassId || loadingAssignments"
                placeholder="اختر الشعبة..."
                search-placeholder="ابحث في الشُعب..."
                searchable
                full-width
              />
              <p v-if="errors.class_section_id" class="text-[10px] text-rose-500 font-bold">
                {{ errors.class_section_id }}
              </p>
            </div>

            <!-- 2.3 Subject Selection (Derived from Teacher's Assignments in selected section) -->
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-bx-title flex items-center gap-1">
                <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                <span>4. المادة التعليمية</span>
                <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="selectedAssignmentId"
                :options="teacherSubjectOptions"
                :disabled="!selectedClassSectionId || loadingAssignments"
                placeholder="اختر المادة..."
                search-placeholder="ابحث في المواد..."
                searchable
                full-width
              />
              <p v-if="errors.teaching_assignment_id" class="text-[10px] text-rose-500 font-bold">
                {{ errors.teaching_assignment_id }}
              </p>
            </div>
          </div>
        </div>

        <!-- 3. Homework Title -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            عنوان الواجب / النشاط المنزلي <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="مثال: حل تمارين وتطبيقات الوحدة الثالثة - صفحة 45"
            class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
          />
          <p v-if="errors.title" class="text-[11px] text-rose-500 font-bold">
            {{ errors.title }}
          </p>
        </div>

        <!-- 4. Dates Grid: Assigned Date & Due Date -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-bx-title flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-bx-primary" />
              <span>تاريخ النشر والتكليف</span>
              <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.assigned_date"
              type="date"
              class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
            <p v-if="errors.assigned_date" class="text-[11px] text-rose-500 font-bold">
              {{ errors.assigned_date }}
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-bx-title flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-rose-500" />
              <span>آخر موعد للتسليم (الاستحقاق)</span>
              <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.due_date"
              type="date"
              class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
            <p v-if="errors.due_date" class="text-[11px] text-rose-500 font-bold">
              {{ errors.due_date }}
            </p>
          </div>
        </div>

        <!-- 5. Description & Instructions Notes -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-bx-title">
            التفاصيل والتعليمات الإرشادية للطلاب (اختياري)
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="اكتب تعليمات الواجب، الملاحظات الإرشادية، أو الصفحات والتمارين المطلوبة..."
            class="w-full px-4 py-2.5 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all leading-relaxed text-start"
          ></textarea>
        </div>

        <!-- 6. Attachments Section (Upload & Link Modes) -->
        <div class="space-y-3 pt-3 border-t border-[#B4AED8]/50 dark:border-white/[0.08]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-bold text-bx-title">
              <Paperclip class="w-4 h-4 text-bx-primary" />
              <span>المرفقات والملازم الدراسية</span>
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
                انقر لاختيار أوراق العمل والملازم من جهازك
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
                placeholder="اسم المرجع (مثال: ملزمة الفصل الأول)"
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
          <div v-if="form.attachments.length > 0" class="space-y-2.5 pt-2">
            <div
              v-for="(att, idx) in form.attachments"
              :key="idx"
              class="flex items-center justify-between p-3 rounded-2xl border border-[#B4AED8]/70 dark:border-white/[0.1] bg-[var(--bx-surface-solid)] shadow-xs hover:shadow-md hover:border-bx-primary/60 transition-all group gap-3"
            >
              <div class="flex items-center gap-3.5 min-w-0 flex-1">
                <!-- Large Distinct Thumbnail / Icon (48x48) -->
                <div
                  v-if="isImageAttachment(att)"
                  class="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500/30 shrink-0 cursor-pointer relative group/thumb shadow-xs"
                  @click="openImageModal(att)"
                  title="انقر للمعاينة والتكبير"
                >
                  <img :src="att.url || att.file_url" :alt="att.name || att.file_name" class="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
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
                  <div class="text-xs font-black text-bx-title truncate block leading-snug" :title="att.name || att.file_name">
                    {{ att.name || att.file_name }}
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs"
                      :class="getAttachmentMeta(att).tagColor"
                    >
                      {{ getAttachmentMeta(att).label }}
                    </span>
                    <span class="text-[11px] text-bx-muted font-mono">
                      {{ formatFileSize(att.size || att.file_size) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Delete Action Button (Premium styled circle button) -->
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
            <span>{{ mode === 'create' ? 'نشر وتكليف الواجب' : 'حفظ التعديلات' }}</span>
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
