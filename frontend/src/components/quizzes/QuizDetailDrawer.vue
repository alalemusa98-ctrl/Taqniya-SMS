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
} from 'lucide-vue-next';
import type { QuizDetailData, QuizAttachment } from '../../api/quizzes.api';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

const props = defineProps<{
  modelValue: boolean;
  quiz: QuizDetailData | null;
  loading?: boolean;
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', item: QuizDetailData): void;
}>();

const close = () => {
  emit('update:modelValue', false);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

const attachmentsList = computed<QuizAttachment[]>(() => {
  if (!props.quiz) return [];
  const atts = props.quiz.attachments;
  if (Array.isArray(atts)) return atts;
  return [];
});

// Helper to determine if an attachment is an image
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

// Calculate Days until Quiz
const countdownInfo = computed(() => {
  if (!props.quiz?.quiz_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const qDate = new Date(props.quiz.quiz_date);
  qDate.setHours(0, 0, 0, 0);

  const diffTime = qDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `تم إجراؤه منذ ${Math.abs(diffDays)} يوم`, isUrgent: false, isPast: true };
  } else if (diffDays === 0) {
    return { label: 'موعد الاختبار اليوم!', isUrgent: true, isPast: false };
  } else if (diffDays === 1) {
    return { label: 'موعد الاختبار غداً', isUrgent: true, isPast: false };
  } else {
    return { label: `متبقي ${diffDays} أيام`, isUrgent: false, isPast: false };
  }
});

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

const openImageModal = (att: QuizAttachment) => {
  modalImageSrc.value = att.file_url || att.url || '';
  modalImageAlt.value = att.file_name || att.name || 'مرفق الاختبار';
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
      title="تفاصيل وبطاقة الاختبار الدوري"
      max-width="max-w-2xl"
      @close="close"
    >
      <!-- Loading State -->
      <div v-if="loading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
        <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
        <span class="text-xs font-bold">جاري جلب تفاصيل ومرفقات الاختبار...</span>
      </div>

      <div v-else-if="quiz" class="space-y-6 text-start" dir="rtl">
        <!-- 1. Header Card Banner -->
        <div class="p-5 rounded-2xl border border-[#B4AED8] dark:border-white/[0.1] bg-purple-500/[0.04] dark:bg-white/[0.02] space-y-3">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-2xs">
                {{ quiz.subject_name }}
              </span>
              <span class="text-xs text-bx-muted font-bold">
                {{ quiz.class_name }} • {{ quiz.section_name }}
              </span>
            </div>

            <!-- Status Badge -->
            <span
              v-if="countdownInfo"
              class="px-3 py-1 rounded-full text-xs font-bold border shadow-2xs"
              :class="
                countdownInfo.isPast
                  ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20'
                  : countdownInfo.isUrgent
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              "
            >
              {{ countdownInfo.label }}
            </span>
          </div>

          <h2 class="text-base sm:text-lg font-black text-bx-title font-display leading-tight">
            {{ quiz.title }}
          </h2>

          <div class="flex items-center gap-4 text-xs text-bx-muted pt-1">
            <div class="flex items-center gap-1.5">
              <span>المعلم المشرف:</span>
              <span class="font-bold text-bx-title">{{ quiz.teacher_name }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Timing and Academic Dates Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="p-3.5 rounded-xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-1">
            <div class="flex items-center gap-1.5 text-xs text-bx-muted font-bold">
              <Calendar class="w-4 h-4 text-bx-primary" />
              <span>تاريخ إجراء الاختبار</span>
            </div>
            <div class="text-sm font-bold text-bx-title font-mono ps-5">
              {{ formatDate(quiz.quiz_date) }}
            </div>
          </div>

          <div class="p-3.5 rounded-xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-1">
            <div class="flex items-center gap-1.5 text-xs text-bx-muted font-bold">
              <Clock class="w-4 h-4 text-bx-primary" />
              <span>تاريخ الإضافة والنشر</span>
            </div>
            <div class="text-sm font-bold text-bx-title font-mono ps-5">
              {{ formatDate(quiz.created_at) }}
            </div>
          </div>
        </div>

        <!-- 3. Description & Topics -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <FileText class="w-4 h-4 text-bx-primary" />
            <span>مواضيع الاختبار والتعليمات والملاحظات</span>
          </h4>
          <div
            v-if="quiz.description"
            class="p-4 rounded-xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] text-xs text-bx-title leading-relaxed whitespace-pre-line"
          >
            {{ quiz.description }}
          </div>
          <div
            v-else
            class="p-4 rounded-xl border border-[#B4AED8]/40 dark:border-white/[0.06] bg-purple-500/[0.02] text-xs text-bx-muted italic"
          >
            لا توجد تعليمات أو ملاحظات نصية إضافية لهذا الاختبار.
          </div>
        </div>

        <!-- 4. Attachments Section -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-bx-title flex items-center gap-1.5">
              <Paperclip class="w-4 h-4 text-bx-primary" />
              <span>مذكرات وملازم المراجعة المرفقة</span>
              <span class="text-[11px] font-normal text-bx-muted">({{ attachmentsList.length }})</span>
            </h4>
          </div>

          <div v-if="attachmentsList.length > 0" class="space-y-2.5">
            <div
              v-for="(att, idx) in attachmentsList"
              :key="idx"
              class="flex items-center justify-between p-3 rounded-xl border border-[#B4AED8]/60 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] group hover:border-bx-primary/50 transition-all"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <!-- Thumbnail / Icon -->
                <div
                  v-if="isImageAttachment(att)"
                  class="w-10 h-10 rounded-lg overflow-hidden border border-purple-500/20 shrink-0 cursor-pointer relative group/thumb"
                  @click="openImageModal(att)"
                >
                  <img :src="att.file_url || att.url" :alt="att.file_name || att.name" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Eye class="w-4 h-4" />
                  </div>
                </div>
                <div
                  v-else
                  class="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
                  :class="getAttachmentMeta(att).colorClass"
                >
                  <component :is="getAttachmentMeta(att).icon" class="w-5 h-5" />
                </div>

                <!-- Info -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
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

              <!-- Actions: Preview / Download / Open -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  v-if="isImageAttachment(att)"
                  type="button"
                  @click="openImageModal(att)"
                  class="p-2 rounded-lg text-bx-primary hover:bg-purple-500/10 transition-colors cursor-pointer"
                  title="تكبير الصورة"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <a
                  :href="att.file_url || att.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  :download="att.file_name || att.name"
                  class="p-2 rounded-lg text-bx-primary hover:bg-purple-500/10 transition-colors cursor-pointer"
                  title="فتح أو تحميل المرفق"
                >
                  <Download class="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div
            v-else
            class="p-5 text-center rounded-xl border border-dashed border-[#B4AED8]/50 dark:border-white/[0.08] text-xs text-bx-muted"
          >
            لا توجد مذكرات أو ملفات مرفقة بهذا الاختبار.
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-6 border-t border-[#B4AED8]/60 dark:border-white/10">
          <button
            type="button"
            @click="close"
            class="px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            إغلاق
          </button>

          <button
            v-if="canEdit"
            type="button"
            @click="emit('edit', quiz); close();"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
            <span>تعديل الاختبار والمرفقات</span>
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
