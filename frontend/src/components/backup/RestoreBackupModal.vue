<script setup lang="ts">
import { ref } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import { backupApi, type BackupItem } from '../../api/backup.api';
import { AlertTriangle, RotateCcw, Database, HardDrive, Clock, FileText, Loader2 } from 'lucide-vue-next';

const props = defineProps<{
  backup: BackupItem;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', message: string): void;
}>();

const acknowledged = ref(false);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const handleRestore = async () => {
  if (!acknowledged.value) return;

  loading.value = true;
  errorMessage.value = null;

  try {
    const res = await backupApi.restoreBackup(props.backup.filename);
    emit('success', `تمت استعادة قاعدة البيانات من النسخة (${res.filename}) بنجاح.`);
    emit('close');
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'فشلت استعادة قاعدة البيانات، يرجى التحقق من سلامة النسخة.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <TaqniyaModal
    :is-open="true"
    title="تأكيد استعادة قاعدة البيانات"
    subtitle="استرجاع البيانات من نسخة احتياطية سابقة"
    @close="emit('close')"
  >
    <div class="space-y-6 text-right dir-rtl">
      <!-- Critical Warning Banner -->
      <div class="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <div class="text-xs leading-relaxed space-y-1">
          <div class="font-extrabold text-sm text-amber-700 dark:text-amber-300">تحذير أمني واستعادة شاملة:</div>
          <div>
            عملية الاستعادة ستقوم <strong class="text-red-600 dark:text-red-400">بمسح واستبدال كافة الجداول والبيانات الحالية</strong> ببيانات النسخة المحددة. يُنصح دائماً بأخذ نسخة احتياطية من الحالة الراهنة أولاً.
          </div>
        </div>
      </div>

      <!-- Backup Details Card -->
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div class="flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
          <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Database class="w-4 h-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate dir-ltr text-right">
              {{ backup.filename }}
            </div>
            <div class="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
              <span class="flex items-center gap-1"><Clock class="w-3.5 h-3.5" /> {{ backup.created_at }}</span>
              <span class="flex items-center gap-1"><HardDrive class="w-3.5 h-3.5" /> {{ backup.size }}</span>
            </div>
          </div>
        </div>

        <div v-if="backup.note" class="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 pt-1">
          <FileText class="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div><strong class="text-slate-700 dark:text-slate-200">ملاحظة النسخة:</strong> {{ backup.note }}</div>
        </div>
      </div>

      <!-- Acknowledgment Checkbox -->
      <label class="flex items-center gap-3 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all select-none">
        <input
          type="checkbox"
          v-model="acknowledged"
          class="w-5 h-5 rounded-lg border-2 border-slate-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
        />
        <span class="text-xs font-bold text-slate-700 dark:text-slate-200">
          أقر بأنني على دراية تامة بأن هذه العملية ستستبدل البيانات الحالية ببيانات النسخة المحددة.
        </span>
      </label>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
        {{ errorMessage }}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          @click="handleRestore"
          :disabled="!acknowledged || loading"
          class="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <RotateCcw v-else class="w-5 h-5" />
          <span>{{ loading ? 'جارٍ فك الضغط واستعادة قاعدة البيانات...' : 'تأكيد واستعادة البيانات الآن' }}</span>
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
