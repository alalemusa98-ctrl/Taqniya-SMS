<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import {
  Save,
  AlertCircle,
  Trash2,
  Paperclip,
  Loader2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  UploadCloud,
  School,
  Calendar,
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

// Options
const yearOptions = computed<TaqniyaSelectOption[]>(() =>
  props.academicYears.map((y) => ({
    value: y.id,
    label: y.name,
    subtext: y.is_active ? 'العام الأكاديمي النشط' : undefined,
  })),
);

const termOptions = computed<TaqniyaSelectOption[]>(() =>
  props.academicTerms.map((t) => ({
    value: t.id,
    label: t.name,
    subtext: `فصل رقم ${t.term_number}`,
  })),
);

const classOptions = computed<TaqniyaSelectOption[]>(() =>
  props.classes.map((c) => ({
    value: c.id,
    label: c.name,
    subtext: `المستوى: ${c.grade_level}`,
  })),
);

const subjectOptions = computed<TaqniyaSelectOption[]>(() =>
  props.subjects.map((s) => ({
    value: s.id,
    label: s.name,
    code: s.code || undefined,
  })),
);

const examTypeOptions: TaqniyaSelectOption[] = [
  { value: 'midterm', label: 'امتحان نصفي (Midterm)', subtext: 'امتحان منتصف الفصل الدراسي' },
  { value: 'final', label: 'امتحان نهائي (Final)', subtext: 'الامتحان النهائي المعتمد للفصل' },
  { value: 'second_round', label: 'امتحان دور ثانٍ (Second Round)', subtext: 'امتحان الإعادة والدور الثاني' },
];

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      errors.value = {};
      generalError.value = null;
      newAttachmentName.value = '';
      newAttachmentUrl.value = '';

      if (props.mode === 'edit' && props.itemToEdit) {
        const item = props.itemToEdit;
        form.value = {
          academic_year_id: item.academic_year_id,
          academic_term_id: item.academic_term_id,
          class_id: item.class_id,
          subject_id: item.subject_id,
          exam_type: item.exam_type,
          exam_date: item.exam_date,
          notes: item.notes || '',
          attachments: item.attachments ? JSON.parse(JSON.stringify(item.attachments)) : [],
        };
      } else {
        form.value = {
          academic_year_id: props.activeYearId || (props.academicYears[0]?.id ?? 0),
          academic_term_id: props.activeTermId || (props.academicTerms[0]?.id ?? 0),
          class_id: props.classes[0]?.id ?? 0,
          subject_id: props.subjects[0]?.id ?? 0,
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

function addLinkAttachment() {
  if (!newAttachmentName.value.trim() || !newAttachmentUrl.value.trim()) {
    generalError.value = 'يرجى إدخال اسم المرفق ورابطه بشكل صحيح.';
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
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i];
    const fakeUrl = URL.createObjectURL(file);
    form.value.attachments.push({
      file_name: file.name,
      file_url: fakeUrl,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size,
    });
  }
  target.value = '';
}

function removeAttachment(index: number) {
  form.value.attachments.splice(index, 1);
}

function getFileIcon(type?: string) {
  if (!type) return FileText;
  if (type.includes('pdf')) return FileText;
  if (type.includes('image')) return ImageIcon;
  if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('presentation') || type.includes('powerpoint')) return Presentation;
  return FileText;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function validate() {
  errors.value = {};
  generalError.value = null;

  if (!form.value.academic_year_id) errors.value.academic_year_id = 'يرجى اختيار العام الدراسي.';
  if (!form.value.academic_term_id) errors.value.academic_term_id = 'يرجى اختيار الفصل الدراسي.';
  if (!form.value.class_id) errors.value.class_id = 'يرجى اختيار الصف الدراسي.';
  if (!form.value.subject_id) errors.value.subject_id = 'يرجى اختيار المادة الدراسية.';
  if (!form.value.exam_type) errors.value.exam_type = 'يرجى اختيار نوع الامتحان.';
  if (!form.value.exam_date) errors.value.exam_date = 'يرجى تحديد تاريخ الامتحان.';

  return Object.keys(errors.value).length === 0;
}

function handleSubmit() {
  if (!validate()) return;
  emit('submit', { ...form.value });
}
</script>

<template>
  <TaqniyaDrawer
    :is-open="modelValue"
    :title="mode === 'create' ? 'جدولة موعد امتحان رسمي جديد' : 'تعديل موعد وبيانات الامتحان الرسمي'"
    :subtitle="mode === 'create' ? 'إضافة موعد امتحان نصف/نهائي/دور ثانٍ مع المرفقات والتعليمات' : 'تحديث القاعة والتاريخ والمرفقات المعتمدة'"
    max-width="max-w-[580px]"
    @close="emit('update:modelValue', false)"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- General Error Alert -->
      <div
        v-if="generalError"
        class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3 text-sm font-medium animate-shake"
      >
        <AlertCircle class="w-5 h-5 shrink-0" />
        <span>{{ generalError }}</span>
      </div>

      <!-- Section 1: Context & Classification -->
      <div class="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div class="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 font-semibold text-sm">
          <School class="w-4 h-4 text-brand-500" />
          <span>السياق الأكاديمي والصف</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Academic Year -->
          <TaqniyaSelect
            v-model="form.academic_year_id"
            :options="yearOptions"
            placeholder="اختر العام الدراسي"
          />

          <!-- Academic Term -->
          <TaqniyaSelect
            v-model="form.academic_term_id"
            :options="termOptions"
            placeholder="اختر الفصل الدراسي"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Class -->
          <TaqniyaSelect
            v-model="form.class_id"
            :options="classOptions"
            placeholder="اختر الصف الدراسي"
          />

          <!-- Subject -->
          <TaqniyaSelect
            v-model="form.subject_id"
            :options="subjectOptions"
            placeholder="اختر المادة الدراسية"
          />
        </div>
      </div>

      <!-- Section 2: Exam Timing & Type -->
      <div class="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div class="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 font-semibold text-sm">
          <Calendar class="w-4 h-4 text-brand-500" />
          <span>نوع وموعد الامتحان الرسمي</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Exam Type -->
          <TaqniyaSelect
            v-model="form.exam_type"
            :options="examTypeOptions"
            placeholder="اختر نوع الامتحان"
          />

          <!-- Exam Date -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              تاريخ يوم الامتحان <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.exam_date"
              type="date"
              class="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition"
              :class="{ 'border-red-500': errors.exam_date }"
            />
            <p v-if="errors.exam_date" class="mt-1 text-xs text-red-500">{{ errors.exam_date }}</p>
          </div>
        </div>

        <!-- Notes & Guidelines -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            التعليمات والإرشادات والقاعات المخصصة
          </label>
          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="مثال: القاعة الكبرى - الحضور قبل الموعد بـ 15 دقيقة - يمنع استخدام الآلة الحاسبة"
            class="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Section 3: Attachments -->
      <div class="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
            <Paperclip class="w-4 h-4 text-brand-500" />
            <span>المرفقات وجداول المواصفات</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-normal">
              {{ form.attachments.length }} مرفق
            </span>
          </div>

          <!-- Attachment Mode Toggle -->
          <div class="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition font-medium"
              :class="attachmentMode === 'upload' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'"
              @click="attachmentMode = 'upload'"
            >
              رفع ملف
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition font-medium"
              :class="attachmentMode === 'link' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'"
              @click="attachmentMode = 'link'"
            >
              رابط سحابي
            </button>
          </div>
        </div>

        <!-- File Upload Box -->
        <div v-if="attachmentMode === 'upload'">
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            @change="handleFileUpload"
          />
          <div
            @click="fileInputRef?.click()"
            class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition bg-white/50 dark:bg-slate-800/50 hover:bg-brand-50/20"
          >
            <UploadCloud class="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              انقر لرفع ملفات الامتحانات (PDF، صور، جداول مواصفات)
            </p>
            <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              يدعم ملفات PDF، Word، Excel، والصور
            </p>
          </div>
        </div>

        <!-- Link URL Input -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="newAttachmentName"
              type="text"
              placeholder="اسم الملف (مثال: دليل مراجعة الجبر)"
              class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
            />
            <div class="flex gap-2">
              <input
                v-model="newAttachmentUrl"
                type="url"
                placeholder="https://drive.google.com/..."
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
              />
              <button
                type="button"
                @click="addLinkAttachment"
                class="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-medium shrink-0 transition"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        <!-- Attachment List -->
        <div v-if="form.attachments.length > 0" class="space-y-2 pt-2">
          <div
            v-for="(att, idx) in form.attachments"
            :key="idx"
            class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <component :is="getFileIcon(att.file_type)" class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {{ att.file_name }}
                </p>
                <p class="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <span v-if="att.file_size">{{ formatBytes(att.file_size) }}</span>
                  <span v-else>رابط سحابي</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="removeAttachment(idx)"
              class="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <button
          type="button"
          @click="emit('update:modelValue', false)"
          class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
        >
          إلغاء
        </button>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ mode === 'create' ? 'حفظ وجدولة الامتحان' : 'تحديث الموعد' }}</span>
        </button>
      </div>
    </form>
  </TaqniyaDrawer>
</template>
