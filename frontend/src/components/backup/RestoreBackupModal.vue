<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="تأكيد استعادة قاعدة البيانات (Database Restore)"
    subtitle="استرجاع البيانات من نسخة احتياطية سابقة"
    max-width="xl"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs">
        <RotateCcw class="w-5 h-5" />
      </div>
    </template>

    <div class="space-y-4" dir="rtl">
      <!-- Critical Warning Banner -->
      <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <div class="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle class="w-4 h-4" />
        </div>
        <div class="text-xs leading-relaxed space-y-1">
          <div class="font-extrabold text-sm text-amber-700 dark:text-amber-300">تحذير أمني واستعادة شاملة:</div>
          <div>
            عملية الاستعادة ستقوم <strong class="text-rose-600 dark:text-rose-400">بمسح واستبدال كافة الجداول والبيانات الحالية</strong> ببيانات النسخة المحددة. يُنصح دائماً بإنشاء نسخة احتياطية من الحالة الراهنة أولاً قبل المتابعة.
          </div>
        </div>
      </div>

      <!-- Backup Details Card -->
      <div class="p-4 rounded-2xl bg-bx-surface-2 border border-bx-border space-y-3">
        <div class="flex items-center gap-3 border-b border-bx-border/60 pb-2.5">
          <div class="w-9 h-9 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center shrink-0">
            <Database class="w-4 h-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-mono text-xs font-bold text-bx-title truncate dir-ltr text-right">
              {{ backup.filename }}
            </div>
            <div class="text-[11px] text-bx-muted flex items-center gap-3 mt-0.5 font-medium">
              <span class="flex items-center gap-1"><Clock class="w-3.5 h-3.5 text-bx-primary" /> {{ backup.created_at }}</span>
              <span class="flex items-center gap-1"><HardDrive class="w-3.5 h-3.5 text-bx-primary" /> {{ backup.size }}</span>
            </div>
          </div>
        </div>

        <div v-if="backup.note" class="text-xs text-bx-text flex items-start gap-2 pt-1">
          <FileText class="w-4 h-4 text-bx-primary shrink-0 mt-0.5" />
          <div><strong class="text-bx-title">الملاحظة المرفقة:</strong> {{ backup.note }}</div>
        </div>
      </div>

      <!-- Acknowledgment Checkbox -->
      <label class="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 cursor-pointer hover:border-rose-500/40 transition-all select-none">
        <input
          type="checkbox"
          v-model="acknowledged"
          class="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
        />
        <span class="text-xs font-bold text-rose-800 dark:text-rose-200 leading-relaxed">
          أقر بأنني على دراية تامة بأن هذه العملية ستستبدل البيانات الحالية ببيانات النسخة المحددة في معاملة ذرية ولا يمكن التراجع عنها بعد البدء.
        </span>
      </label>

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
          class="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!acknowledged || loading"
          @click="handleRestore"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <RotateCcw v-else class="w-4 h-4" />
          <span>{{ loading ? 'جاري فك الضغط واستعادة البيانات...' : 'تأكيد وبدء استعادة البيانات الآن' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import { backupApi, type BackupItem } from '../../api/backup.api';
import { AlertTriangle, RotateCcw, Database, HardDrive, Clock, FileText, Loader2, AlertCircle } from 'lucide-vue-next';

interface Props {
  backup: BackupItem;
  isOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: true,
});

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
