<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="رفع واستيراد نسخة احتياطية (Import Backup)"
    subtitle="استيراد ملف أرشيف ZIP خارجي وإضافته لقائمة النسخ المتاحة"
    max-width="xl"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20 shadow-xs">
        <Upload class="w-5 h-5" />
      </div>
    </template>

    <div class="space-y-4" dir="rtl">
      <!-- Drag & Drop Zone -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="[
          'relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer',
          isDragging
            ? 'border-bx-primary bg-purple-500/10 scale-[1.01]'
            : 'border-[#B4AED8] dark:border-white/20 bg-bx-surface-2 hover:border-bx-primary hover:bg-purple-500/[0.03]'
        ]"
        @click="($refs.fileInput as HTMLInputElement).click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".zip"
          class="hidden"
          @change="handleFileSelect"
        />

        <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 border border-bx-primary/20 text-bx-primary flex items-center justify-center mb-3 shadow-xs">
          <Upload class="w-7 h-7" />
        </div>

        <div class="text-sm font-black text-bx-title mb-1 font-display">
          اسحب وأفلت ملف الأرشيف المضغوط هنا
        </div>
        <div class="text-xs text-bx-muted font-medium">
          أو انقر لاختيار الملف من جهازك (ملفات <strong class="text-bx-title">.ZIP</strong> حتى 512MB)
        </div>
      </div>

      <!-- Selected File Card -->
      <div
        v-if="selectedFile"
        class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileArchive class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <span class="font-mono text-xs font-bold text-bx-title block truncate dir-ltr text-right">
              {{ selectedFile.name }}
            </span>
            <span class="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block mt-0.5">
              {{ formatFileSize(selectedFile.size) }}
            </span>
          </div>
        </div>

        <button
          type="button"
          @click.stop="clearFile"
          class="w-8 h-8 rounded-xl hover:bg-rose-500/10 text-bx-muted hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
          title="إلغاء اختيار الملف"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <!-- Footer Actions Slot -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button
          type="button"
          class="px-5 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
          :disabled="loading"
          @click="emit('close')"
        >
          إلغاء
        </button>

        <button
          type="button"
          class="px-6 py-2.5 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!selectedFile || loading"
          @click="handleUpload"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <Upload v-else class="w-4 h-4" />
          <span>{{ loading ? 'جاري فحص ورفع الملف...' : 'رفع واستيراد النسخة الآن' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import { backupApi } from '../../api/backup.api';
import { Upload, FileArchive, X, Loader2, AlertCircle } from 'lucide-vue-next';

interface Props {
  isOpen?: boolean;
}

withDefaults(defineProps<Props>(), {
  isOpen: true,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', message: string): void;
}>();

const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0]);
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    validateAndSetFile(e.dataTransfer.files[0]);
  }
};

const validateAndSetFile = (file: File) => {
  errorMessage.value = null;

  if (!file.name.toLowerCase().endsWith('.zip')) {
    errorMessage.value = 'يجب أن يكون الملف بصيغة ZIP (.zip) حصراً.';
    selectedFile.value = null;
    return;
  }

  const maxSize = 512 * 1024 * 1024; // 512MB
  if (file.size > maxSize) {
    errorMessage.value = 'حجم الملف يتجاوز الحد الأقصى المسموح به (512 ميجابايت).';
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
};

const clearFile = () => {
  selectedFile.value = null;
  errorMessage.value = null;
};

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return bytes + ' B';
};

const handleUpload = async () => {
  if (!selectedFile.value) return;

  loading.value = true;
  errorMessage.value = null;

  try {
    const res = await backupApi.uploadBackup(selectedFile.value);
    emit('success', `تم رفع واستيراد النسخة الاحتياطية (${res.filename}) بنجاح.`);
    emit('close');
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'تعذر رفع واستيراد الملف، يرجى التأكد من احتوائه على database.sql سليم.';
  } finally {
    loading.value = false;
  }
};
</script>
