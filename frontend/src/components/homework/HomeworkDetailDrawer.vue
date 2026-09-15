<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
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
} from 'lucide-vue-next';
import type { HomeworkDetailData, HomeworkItem, HomeworkAttachment } from '../../api/homework.api';

const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));

const props = defineProps<{
  modelValue: boolean;
  homework: HomeworkDetailData | HomeworkItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'edit', item: HomeworkDetailData | HomeworkItem): void;
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

// Attachment type meta (Icon, Badge, Color)
const getAttachmentMeta = (att: HomeworkAttachment) => {
  const name = (att.name || '').toLowerCase();
  const type = (att.type || '').toLowerCase();
  const url = (att.url || '').toLowerCase();

  if (type === 'link' || (!name.includes('.') && url.startsWith('http'))) {
    return {
      icon: Link2,
      label: 'رابط خارجي',
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      tagColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    };
  }
  if (name.endsWith('.pdf') || type.includes('pdf')) {
    return {
      icon: FileText,
      label: 'مستند PDF',
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      tagColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
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
    };
  }
  if (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif') ||
    name.endsWith('.svg') ||
    type.includes('image')
  ) {
    return {
      icon: ImageIcon,
      label: 'صورة توضيحية',
      colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
      tagColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    };
  }

  return {
    icon: FileText,
    label: 'ملف مرفق',
    colorClass: 'text-bx-primary bg-purple-500/10 border-purple-500/20',
    tagColor: 'bg-purple-500/10 text-bx-primary border-purple-500/30',
  };
};

// Download helper preserving the original file name
const downloadFile = (att: HomeworkAttachment) => {
  const link = document.createElement('a');
  link.href = att.url;
  link.download = att.name || 'ملزمة-الواجب';
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
    max-width="max-w-[540px]"
    @close="close"
  >
    <!-- Loading State -->
    <div v-if="loading" class="py-16 text-center space-y-3">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-bx-primary" />
      <span class="text-xs font-bold text-bx-muted block">جاري تحميل بيانات وتفاصيل الواجب...</span>
    </div>

    <!-- Content State -->
    <div v-else-if="homework" class="space-y-5">
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
              <p class="text-xs text-bx-muted font-medium mt-0.5">
                المعلم المسؤول: {{ homework.teacher_name }}
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
        <div v-if="'section_name' in homework" class="flex items-center gap-2 pt-2 border-t border-[#B4AED8]/40 dark:border-white/[0.06]">
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

      <!-- 4. Attachments List with Expressive Icons & Name-Preserved Downloads -->
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

        <div v-if="attachmentsList.length === 0" class="py-4 text-center text-xs text-bx-muted border border-dashed border-[#B4AED8]/60 dark:border-white/10 rounded-xl">
          لا توجد ملازم أو ملفات مرفقة بهذا الواجب
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="(att, idx) in attachmentsList"
            :key="idx"
            class="flex items-center justify-between p-3 rounded-2xl border border-[#B4AED8]/60 dark:border-white/[0.08] hover:border-bx-primary bg-purple-500/[0.02] hover:bg-purple-500/[0.05] transition-all group shadow-2xs"
          >
            <!-- File Info & Expressive Type Icon -->
            <div class="flex items-center gap-3 overflow-hidden">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center font-bold border shrink-0 transition-transform group-hover:scale-105"
                :class="getAttachmentMeta(att).colorClass"
              >
                <component :is="getAttachmentMeta(att).icon" class="w-5 h-5" />
              </div>

              <div class="truncate">
                <span class="text-xs font-black text-bx-title group-hover:text-bx-primary transition-colors block truncate">
                  {{ att.name }}
                </span>
                <div class="flex items-center gap-2 mt-0.5 text-[10px] text-bx-muted">
                  <span
                    class="px-2 py-0.2 rounded-md border font-semibold"
                    :class="getAttachmentMeta(att).tagColor"
                  >
                    {{ getAttachmentMeta(att).label }}
                  </span>
                  <span v-if="att.size" class="font-mono font-bold">{{ att.size }}</span>
                </div>
              </div>
            </div>

            <!-- Download Button (Preserves Original Name) -->
            <button
              type="button"
              @click="downloadFile(att)"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white border border-bx-primary/20 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
              :title="`تنزيل باسم: ${att.name}`"
            >
              <span>تحميل</span>
              <Download class="w-3.5 h-3.5" />
            </button>
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
      <div class="flex items-center justify-between w-full">
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
</template>
