<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import {
  BookOpen,
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
  School,
  Sparkles,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  UserCheck,
} from 'lucide-vue-next';
import type { HomeworkDetailData, HomeworkAttachment } from '../../api/homework.api';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

const props = defineProps<{
  modelValue: boolean;
  homework: HomeworkDetailData | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', item: HomeworkDetailData): void;
}>();

const close = () => {
  emit('update:modelValue', false);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

const attachmentsList = computed<HomeworkAttachment[]>(() => {
  if (!props.homework) return [];
  const atts = props.homework.attachments;
  if (Array.isArray(atts)) return atts;
  return [];
});

// Format file size
const formatFileSize = (bytes?: number | string): string => {
  if (!bytes) return 'رابط سحابي';
  if (typeof bytes === 'string') return bytes;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to determine if an attachment is an image
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

// Lightbox / Image Preview State
const previewImage = ref<HomeworkAttachment | null>(null);
const zoomLevel = ref(1);
const rotation = ref(0);

const openPreview = (att: HomeworkAttachment) => {
  if (isImageAttachment(att)) {
    previewImage.value = att;
    zoomLevel.value = 1;
    rotation.value = 0;
  } else if (att.url || att.file_url) {
    window.open(att.url || att.file_url, '_blank', 'noopener,noreferrer');
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

// Keyboard shortcut (Escape to close preview)
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

// Download helper preserving the original file name
const downloadFile = (att: HomeworkAttachment) => {
  const url = att.url || att.file_url || '';
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = att.name || att.file_name || 'ملزمة-الواجب';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <TaqniyaDrawer
    :is-open="modelValue"
    :title="homework ? `تفاصيل الواجب: ${homework.title}` : 'تفاصيل الواجب المدرسي'"
    :subtitle="homework ? `المادة: ${homework.subject_name} • المعلم: ${homework.teacher_name}` : ''"
    :icon="BookOpen"
    max-width="max-w-[560px]"
    @close="close"
  >
    <!-- Loading State -->
    <div v-if="loading" class="py-16 text-center space-y-3">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-bx-primary" />
      <span class="text-xs font-bold text-bx-muted block">جاري تحميل بيانات وتفاصيل الواجب...</span>
    </div>

    <!-- Content State -->
    <div v-else-if="homework" class="space-y-5" dir="rtl">
      <!-- 1. Subject & Status Header Card -->
      <div class="p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-purple-500/[0.03] dark:bg-white/[0.02] space-y-3 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold border border-purple-500/20 shrink-0 shadow-2xs">
              <BookOpen class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-black text-sm text-bx-title font-display">
                {{ homework.subject_name }}
              </h4>
              <p class="text-xs text-bx-muted font-medium mt-0.5 flex items-center gap-1">
                <UserCheck class="w-3.5 h-3.5 text-bx-primary" />
                <span>المعلم المسؤول: {{ homework.teacher_name }}</span>
              </p>
            </div>
          </div>

          <!-- Status Badge -->
          <span
            class="text-[11px] font-bold px-3 py-1 rounded-full border shrink-0"
            :class="
              homework.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
            "
          >
            {{ homework.status === 'active' ? 'ساري للتسليم' : 'منتهي الصلاحية' }}
          </span>
        </div>

        <!-- Class / Section Details if available -->
        <div v-if="'section_name' in homework || 'class_name' in homework" class="flex items-center gap-2 pt-2 border-t border-[#B4AED8]/40 dark:border-white/[0.06]">
          <span class="text-[11px] font-bold text-bx-muted flex items-center gap-1">
            <School class="w-3.5 h-3.5 text-bx-primary" />
            <span>الصف والشعبة:</span>
          </span>
          <span class="text-xs font-bold text-bx-title">
            {{ ('class_name' in homework ? homework.class_name + ' - ' : '') + homework.section_name }}
          </span>
        </div>
      </div>

      <!-- 2. Assignment Title & Instructions Card -->
      <div class="p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-2.5 shadow-xs">
        <h5 class="text-xs font-bold text-bx-muted flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-bx-primary" />
          <span>عنوان التكليف</span>
        </h5>
        <h4 class="text-sm font-black text-bx-title leading-snug">
          {{ homework.title }}
        </h4>

        <div v-if="homework.description" class="pt-2 border-t border-[#B4AED8]/40 dark:border-white/[0.06]">
          <h5 class="text-xs font-bold text-bx-muted mb-1">التعليمات والإرشادات:</h5>
          <p class="text-xs text-bx-title leading-relaxed whitespace-pre-wrap bg-purple-500/[0.02] p-3 rounded-xl border border-[#B4AED8]/30 dark:border-white/[0.04]">
            {{ homework.description }}
          </p>
        </div>
      </div>

      <!-- 3. Dates Micro KPIs -->
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3.5 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] text-start space-y-1 shadow-xs">
          <div class="flex items-center gap-1.5 text-[11px] font-bold text-bx-muted">
            <Calendar class="w-3.5 h-3.5 text-bx-primary" />
            <span>تاريخ النشر</span>
          </div>
          <span class="text-xs font-mono font-black text-bx-title block">
            {{ formatDate(homework.assigned_date) }}
          </span>
        </div>

        <div class="p-3.5 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] text-start space-y-1 shadow-xs">
          <div class="flex items-center gap-1.5 text-[11px] font-bold text-rose-500">
            <Clock class="w-3.5 h-3.5" />
            <span>موعد الاستحقاق</span>
          </div>
          <span class="text-xs font-mono font-black text-rose-600 dark:text-rose-400 block">
            {{ formatDate(homework.due_date) }}
          </span>
        </div>
      </div>

      <!-- 4. Attachments List with Expressive Icons & Image Preview & Downloads -->
      <div class="p-4 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-3 shadow-xs">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <Paperclip class="w-3.5 h-3.5 text-bx-primary" />
            <span>المرفقات والملازم الدراسية</span>
          </h5>
          <span class="text-[11px] text-bx-muted font-bold">
            {{ attachmentsList.length }} مرفقات
          </span>
        </div>

        <div v-if="attachmentsList.length === 0" class="py-6 text-center text-xs text-bx-muted border border-dashed border-[#B4AED8]/60 dark:border-white/10 rounded-2xl">
          لا توجد ملازم أو ملفات مرفقة بهذا الواجب
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="(att, idx) in attachmentsList"
            :key="idx"
            class="flex items-center justify-between p-3 rounded-2xl border border-[#B4AED8]/70 dark:border-white/[0.1] bg-[var(--bx-surface-solid)] shadow-xs hover:shadow-md hover:border-bx-primary/60 transition-all group gap-3"
          >
            <!-- File Info & Expressive Type Icon / Thumbnail -->
            <div
              class="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
              @click="openPreview(att)"
              :title="isImageAttachment(att) ? 'انقر لمعاينة الصورة' : 'معاينة المرفق'"
            >
              <!-- Large Distinct Thumbnail / Icon (48x48) -->
              <div
                v-if="isImageAttachment(att) && (att.url || att.file_url)"
                class="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500/30 shrink-0 relative group/thumb shadow-xs"
              >
                <img
                  :src="att.url || att.file_url"
                  :alt="att.name || att.file_name"
                  class="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                  @error="(e: any) => { e.target.style.display = 'none'; }"
                />
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

            <!-- Action Buttons: Preview & Download (Circle Action Buttons) -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- Preview Button -->
              <button
                type="button"
                @click="openPreview(att)"
                class="w-9 h-9 rounded-full border border-purple-500/20 bg-purple-500/5 hover:bg-bx-primary text-bx-primary hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                :title="isImageAttachment(att) ? 'معاينة الصورة' : 'فتح المرفق'"
              >
                <Eye class="w-4 h-4" />
              </button>

              <!-- Download Button -->
              <button
                v-if="!isImageAttachment(att) || (att.url || att.file_url)"
                type="button"
                @click="downloadFile(att)"
                class="w-9 h-9 rounded-full border border-bx-primary/20 bg-bx-primary/5 hover:bg-bx-primary text-bx-primary hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                :title="`تحميل ملف: ${att.name || att.file_name}`"
              >
                <Download class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Audit Meta Info -->
      <div class="p-3 rounded-xl bg-purple-500/[0.03] border border-[#B4AED8]/40 dark:border-white/[0.04] text-[11px] text-bx-muted space-y-1">
        <div class="flex items-center justify-between">
          <span>المسؤول عن الإنشاء: {{ homework.creator_name }}</span>
          <span class="font-mono">معرف التكليف: #{{ homework.id }}</span>
        </div>
      </div>
    </div>

    <!-- Drawer Footer -->
    <template #footer>
      <div class="flex items-center justify-between w-full" dir="rtl">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
        >
          إغلاق
        </button>

        <button
          v-if="homework"
          type="button"
          @click="() => { emit('edit', homework!); close(); }"
          class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover transition-all cursor-pointer shadow-sm"
        >
          <Edit2 class="w-3.5 h-3.5" />
          <span>تعديل الواجب</span>
        </button>
      </div>
    </template>
  </TaqniyaDrawer>

  <!-- Image Preview Lightbox Modal (معاينة الصورة بدقة كاملة) -->
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
        <!-- Modal Container -->
        <div
          class="relative w-full max-w-4xl max-h-[92vh] bg-slate-950/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
          dir="rtl"
        >
          <!-- Modal Header -->
          <div class="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02] gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
                <ImageIcon class="w-5 h-5" />
              </div>
              <div class="truncate">
                <h4 class="font-bold text-sm text-white truncate">
                  {{ previewImage.name || previewImage.file_name }}
                </h4>
                <p class="text-[11px] text-slate-400">
                  معاينة الصورة • {{ previewImage.size || previewImage.file_size || 'حجم أصلي' }}
                </p>
              </div>
            </div>

            <!-- Toolbar Controls: Zoom In/Out, Rotate, Download, Close -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                @click="zoomIn"
                class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="تكبير الصورة (+)"
              >
                <ZoomIn class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="zoomOut"
                class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="تصغير الصورة (-)"
              >
                <ZoomOut class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="rotateImage"
                class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="تدوير الصورة 90°"
              >
                <RotateCw class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="resetZoom"
                class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                title="إعادة ضبط المقياس"
              >
                {{ Math.round(zoomLevel * 100) }}%
              </button>

              <div class="h-5 w-[1px] bg-white/10 mx-1"></div>

              <button
                type="button"
                @click="downloadFile(previewImage)"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                title="تحميل الصورة"
              >
                <Download class="w-3.5 h-3.5" />
                <span>تحميل</span>
              </button>

              <button
                type="button"
                @click="closePreview"
                class="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-slate-300 hover:text-white transition-all cursor-pointer ml-1"
                title="إغلاق المعاينة (Esc)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Image Canvas Zone -->
          <div
            class="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] max-h-[calc(90vh-120px)] bg-black/50 relative select-none"
            @dblclick="resetZoom"
          >
            <img
              :src="previewImage.url || previewImage.file_url"
              :alt="previewImage.name || previewImage.file_name"
              class="max-w-full max-h-full object-contain rounded-xl transition-transform duration-200 shadow-2xl cursor-zoom-in"
              :style="{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }"
            />
          </div>

          <!-- Modal Footer Tip -->
          <div class="px-5 py-2.5 bg-black/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>انقر مرتين لإعادة الحجم الطبيعي • استخدم أدوات التكبير للتدقيق</span>
            <span>اضغط Esc أو انقر بالخارج للإغلاق</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
