<script setup lang="ts">
import { ref } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import { backupApi } from '../../api/backup.api';
import { Upload, FileArchive, X, Loader2, AlertCircle } from 'lucide-vue-next';

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

<template>
  <TaqniyaModal
    :is-open="true"
    title="رفع واستيراد نسخة احتياطية"
    subtitle="استيراد ملف أرشيف ZIP خارجي وإضافته لقائمة النسخ المتاحة"
    @close="emit('close')"
  >
    <div class="space-y-6 text-right dir-rtl">
      <!-- Drag & Drop Zone -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="[
          'relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/60'
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

        <div class="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4 shadow-sm">
          <Upload class="w-8 h-8" />
        </div>

        <div class="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-1">
          اسحب وأفلت ملف النسخة الاحتياطية هنا
        </div>
        <div class="text-xs text-slate-400 font-medium">
          أو انقر لاختيار الملف من جهازك (ملفات <strong class="text-slate-600 dark:text-slate-300">.ZIP</strong> حتى 512MB)
        </div>
      </div>

      <!-- Selected File Card -->
      <div
        v-if="selectedFile"
        class="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileArchive class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 truncate dir-ltr text-right">
              {{ selectedFile.name }}
            </div>
            <div class="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
              {{ formatFileSize(selectedFile.size) }}
            </div>
          </div>
        </div>

        <button
          type="button"
          @click.stop="clearFile"
          class="w-8 h-8 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          @click="handleUpload"
          :disabled="!selectedFile || loading"
          class="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <Upload v-else class="w-5 h-5" />
          <span>{{ loading ? 'جارٍ فحص ورفع الملف...' : 'رفع واستيراد النسخة' }}</span>
        </button>

        <button
          type="button"
          @click="emit('close')"
          :disabled="loading"
          class="h-12 px-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm transition-all cursor-pointer"
        >
          إلغاء
        </button>
      </div>
    </div>
  </TaqniyaModal>
</template>
