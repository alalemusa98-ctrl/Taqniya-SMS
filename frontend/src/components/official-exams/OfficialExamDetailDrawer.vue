<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import {
  Calendar,
  Clock,
  Paperclip,
  Download,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  Link2,
  Edit2,
  Loader2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-vue-next';
import type { OfficialExam, ExamAttachment } from '../../api/official-exams.api';
import AcademicDetailHeroCard from '../ui/AcademicDetailHeroCard.vue';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

const props = defineProps<{
  modelValue: boolean;
  exam: OfficialExam | null;
  loading?: boolean;
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', item: OfficialExam): void;
}>();

const close = () => {
  emit('update:modelValue', false);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

const attachmentsList = computed<ExamAttachment[]>(() => {
  if (!props.exam) return [];
  const atts = props.exam.attachments;
  if (Array.isArray(atts)) return atts;
  return [];
});

// Helper to determine if an attachment is an image
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

// Attachment type meta (Icon, Badge, Color)
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

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'رابط سحابي';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Image Previewer Modal States
const showImageModal = ref(false);
const modalImageSrc = ref('');
const modalImageAlt = ref('');
const zoomLevel = ref(1);
const rotationDeg = ref(0);

const openImageModal = (att: ExamAttachment) => {
  modalImageSrc.value = att.file_url || (att as any).url || '';
  modalImageAlt.value = att.file_name || (att as any).name || 'مرفق الامتحان';
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
</script>

<template>
  <div>
    <TaqniyaDrawer
      :is-open="modelValue"
      title="تفاصيل وبطاقة الامتحان الرسمي"
      :subtitle="exam ? `${exam.subject_name} • ${exam.class_name}` : ''"
      :icon="Calendar"
      max-width="max-w-2xl"
      @close="close"
    >
      <!-- Loading State -->
      <div v-if="loading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
        <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
        <span class="text-xs font-bold">جاري جلب تفاصيل ومرفقات الامتحان...</span>
      </div>

      <div v-else-if="exam" class="space-y-6 text-start" dir="rtl">
        <!-- 1. Hero Header Card Component -->
        <AcademicDetailHeroCard
          type="exam"
          :title="`${exam.exam_type_ar || 'امتحان رسمي'} — ${exam.subject_name}`"
          :subject-name="exam.subject_name"
          :class-name="exam.class_name"
          teacher-name="إدارة المدرسة والكنترول"
          :record-id="exam.id"
          :target-date="exam.exam_date"
        />

        <!-- 2. Timing and Academic Dates Section (With Section Divider) -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
            <div class="w-2 h-4 rounded-full bg-bx-primary"></div>
            <Calendar class="w-3.5 h-3.5 text-bx-primary" />
            <span>الجدول الزمني وموعد الامتحان</span>
            <div class="h-px flex-1 bg-gradient-to-l from-transparent to-[#B4AED8]/40 dark:to-white/10"></div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="p-4 rounded-2xl border border-[#B4AED8]/70 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-1.5 shadow-2xs hover:border-bx-primary/40 transition-colors">
              <div class="flex items-center gap-2 text-xs text-bx-muted font-bold">
                <div class="w-6 h-6 rounded-lg bg-purple-500/10 text-bx-primary flex items-center justify-center">
                  <Calendar class="w-3.5 h-3.5" />
                </div>
                <span>تاريخ إجراء الامتحان</span>
              </div>
              <div class="text-sm font-black text-bx-title font-mono ps-8">
                {{ formatDate(exam.exam_date) }}
              </div>
            </div>

            <div class="p-4 rounded-2xl border border-[#B4AED8]/70 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-1.5 shadow-2xs hover:border-bx-primary/40 transition-colors">
              <div class="flex items-center gap-2 text-xs text-bx-muted font-bold">
                <div class="w-6 h-6 rounded-lg bg-purple-500/10 text-bx-primary flex items-center justify-center">
                  <Clock class="w-3.5 h-3.5" />
                </div>
                <span>تاريخ الإضافة والنشر</span>
              </div>
              <div class="text-sm font-black text-bx-title font-mono ps-8">
                {{ formatDate(exam.created_at) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Description & Notes Section (With Section Divider) -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
            <div class="w-2 h-4 rounded-full bg-bx-primary"></div>
            <Sparkles class="w-3.5 h-3.5 text-bx-primary" />
            <span>القاعة المخصصة والتعليمات الإرشادية</span>
            <div class="h-px flex-1 bg-gradient-to-l from-transparent to-[#B4AED8]/40 dark:to-white/10"></div>
          </div>

          <div
            v-if="exam.notes"
            class="p-4 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-purple-500/[0.02] text-xs text-bx-title leading-relaxed whitespace-pre-wrap font-medium shadow-2xs"
          >
            {{ exam.notes }}
          </div>
          <div
            v-else
            class="p-4 rounded-2xl border border-dashed border-[#B4AED8]/60 dark:border-white/[0.08] text-xs text-bx-muted text-center"
          >
            لا توجد تعليمات أو ملاحظات إضافية مسجلة لهذا الامتحان
          </div>
        </div>

        <!-- 4. Attachments Section (With Section Divider) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
              <div class="w-2 h-4 rounded-full bg-bx-primary"></div>
              <Paperclip class="w-3.5 h-3.5 text-bx-primary" />
              <span>المرفقات وجداول المواصفات المعتمدة</span>
              <div class="h-px w-16 bg-gradient-to-l from-transparent to-[#B4AED8]/40 dark:to-white/10"></div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs">
              {{ attachmentsList.length }} مرفقات
            </span>
          </div>

          <div v-if="attachmentsList.length === 0" class="p-6 rounded-2xl border border-dashed border-[#B4AED8]/60 dark:border-white/[0.08] text-center text-xs text-bx-muted">
            لا توجد مرفقات أو ملازم مرفقة بهذا الامتحان
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="(att, idx) in attachmentsList"
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

              <!-- Action Buttons (Circle buttons) -->
              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Image Preview Modal trigger -->
                <button
                  v-if="isImageAttachment(att)"
                  type="button"
                  @click="openImageModal(att)"
                  class="w-9 h-9 rounded-full border border-purple-500/20 bg-purple-500/5 hover:bg-bx-primary text-bx-primary hover:text-white transition-all duration-150 flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  title="معاينة وتكبير الصورة"
                >
                  <Eye class="w-4 h-4" />
                </button>

                <!-- Download / External Link -->
                <a
                  :href="att.file_url || (att as any).url"
                  :download="att.file_name || (att as any).name"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-9 h-9 rounded-full border border-bx-primary/20 bg-bx-primary/5 hover:bg-bx-primary text-bx-primary hover:text-white transition-all duration-150 flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  :title="getAttachmentMeta(att).isImage ? 'تحميل الصورة الأصلية' : 'تحميل المرفق أو فتح الرابط'"
                >
                  <Download class="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between gap-3 pt-6 border-t border-[#B4AED8]/60 dark:border-white/10">
          <button
            type="button"
            @click="close"
            class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            إغلاق
          </button>

          <button
            v-if="canEdit"
            type="button"
            @click="emit('edit', exam)"
            class="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
            <span>تعديل بيانات الامتحان</span>
          </button>
        </div>
      </div>
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
