<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="إنشاء نسخة احتياطية جديدة (Create Backup)"
    subtitle="اختر نوع النسخ الاحتياطي المناسب، وتوليد حزمة مضغوطة مؤمنة"
    max-width="2xl"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20 shadow-xs">
        <Database class="w-5 h-5" />
      </div>
    </template>

    <div class="space-y-4" dir="rtl">
      <!-- Backup Type Selection Cards -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-bx-title flex items-center gap-1.5">
          <Layers class="w-4 h-4 text-bx-primary" />
          <span>نوع النسخة الاحتياطية المطلوبة:</span>
        </label>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <!-- Database Only Card -->
          <button
            type="button"
            @click="selectedType = 'database'"
            :class="[
              'p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer',
              selectedType === 'database'
                ? 'border-bx-primary bg-purple-500/10 shadow-sm ring-1 ring-bx-primary'
                : 'border-bx-border bg-bx-surface-2 hover:bg-bx-surface-3'
            ]"
          >
            <div class="flex items-center justify-between w-full">
              <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Database class="w-4 h-4" />
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">موصى بها</span>
            </div>
            <div>
              <span class="text-xs font-black text-bx-title block">قاعدة البيانات فقط</span>
              <span class="text-[10px] text-bx-muted mt-0.5 block leading-tight">تفريغ فوري وسريع للجداول والبيانات (خفيف جداً)</span>
            </div>
          </button>

          <!-- Files Only Card -->
          <button
            type="button"
            @click="selectedType = 'files'"
            :class="[
              'p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer',
              selectedType === 'files'
                ? 'border-bx-primary bg-purple-500/10 shadow-sm ring-1 ring-bx-primary'
                : 'border-bx-border bg-bx-surface-2 hover:bg-bx-surface-3'
            ]"
          >
            <div class="flex items-center justify-between w-full">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <FolderArchive class="w-4 h-4" />
              </div>
            </div>
            <div>
              <span class="text-xs font-black text-bx-title block">الملفات فقط</span>
              <span class="text-[10px] text-bx-muted mt-0.5 block leading-tight">أرشفة مجلد المرفقات والواجبات المرفوعة على القرص</span>
            </div>
          </button>

          <!-- Full Backup Card -->
          <button
            type="button"
            @click="selectedType = 'full'"
            :class="[
              'p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer',
              selectedType === 'full'
                ? 'border-bx-primary bg-purple-500/10 shadow-sm ring-1 ring-bx-primary'
                : 'border-bx-border bg-bx-surface-2 hover:bg-bx-surface-3'
            ]"
          >
            <div class="flex items-center justify-between w-full">
              <div class="w-8 h-8 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center border border-purple-500/20">
                <Package class="w-4 h-4" />
              </div>
            </div>
            <div>
              <span class="text-xs font-black text-bx-title block">نسخة كاملة شاملة</span>
              <span class="text-[10px] text-bx-muted mt-0.5 block leading-tight">قاعدة البيانات + كافة ملفات ومرفقات النظام</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Info Alert Card -->
      <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 flex items-start gap-3">
        <div class="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
          <Info class="w-4 h-4" />
        </div>
        <div class="text-xs leading-relaxed">
          <span v-if="selectedType === 'database'">
            <strong>قاعدة البيانات:</strong> سيتم تفريغ جداول MySQL بنظام الـ Chunking (دفعات 500 سجل) لضمان الخفة والسرعة القصوى، وضغطها في ملف SQL وحفظها في <code class="font-mono text-[11px] bg-purple-500/20 px-1 rounded">storage/backups/database/</code>.
          </span>
          <span v-else-if="selectedType === 'files'">
            <strong>أرشفة الملفات:</strong> سيتم حزم مجلد المرفقات والواجبات <code class="font-mono text-[11px] bg-purple-500/20 px-1 rounded">storage/uploads/</code> بشجرته الكاملة وحفظه في <code class="font-mono text-[11px] bg-purple-500/20 px-1 rounded">storage/backups/files/</code>.
          </span>
          <span v-else>
            <strong>النسخة الشاملة:</strong> سيتم دمج تفريغ قاعدة البيانات الكامل مع مجلد المرفقات داخل حزمة ZIP موحدة وحفظها في <code class="font-mono text-[11px] bg-purple-500/20 px-1 rounded">storage/backups/full/</code>.
          </span>
        </div>
      </div>

      <!-- Note Input Card -->
      <div class="p-4 bg-bx-surface-2 rounded-2xl border border-bx-border space-y-2">
        <label class="block text-xs font-bold text-bx-title flex items-center gap-1.5">
          <FileText class="w-4 h-4 text-bx-primary" />
          <span>ملاحظة أو سبب إنشاء النسخة (اختياري للتوثيق):</span>
        </label>
        <textarea
          v-model="note"
          rows="2"
          maxlength="500"
          placeholder="مثال: نسخة احتياطية قبل تعديل الهيكل الأكاديمي، أو قبل اعتماد الترحيل السنوي..."
          class="w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl p-3 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all resize-none"
        ></textarea>
        <div class="flex justify-between items-center text-[10px] text-bx-muted font-medium">
          <span>يتم حفظ الملاحظة داخل ملف نصي في أرشيف الـ ZIP للاسترشاد بها عند الاستعادة.</span>
          <span class="font-mono">{{ note.length }}/500</span>
        </div>
      </div>

      <!-- Preset Quick Suggestions -->
      <div class="p-3 bg-bx-surface-2 rounded-2xl border border-bx-border space-y-1.5">
        <div class="text-[11px] font-bold text-bx-muted flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-amber-500" />
          <span>نماذج مقترحة للملاحظات:</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(preset, idx) in presetNotes"
            :key="idx"
            type="button"
            @click="note = preset"
            class="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-bx-surface hover:bg-purple-500/10 hover:text-bx-primary text-bx-text border border-bx-border transition-all cursor-pointer"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
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
          :disabled="loading"
          @click="handleSubmit"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <Database v-else class="w-4 h-4" />
          <span>{{ loading ? 'جاري إنشاء وضغط النسخة...' : 'تأكيد وبدء إنشاء النسخة الآن' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import { backupApi, type BackupType } from '../../api/backup.api';
import { Database, FileText, Sparkles, Loader2, AlertCircle, Layers, FolderArchive, Package, Info } from 'lucide-vue-next';

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

const selectedType = ref<BackupType>('database');
const note = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const presetNotes = [
  'نسخة دورية لقاعدة البيانات',
  'نسخة احتياطية قبل تعديل الهيكل الأكاديمي',
  'نسخة احتياطية قبل رصد الدرجات وإصدار الصحائف',
  'نسخة احتياطية قبل اعتماد الترحيل السنوي وتسكين الطلاب',
];

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await backupApi.createBackup({
      type: selectedType.value,
      note: note.value.trim() || undefined,
    });
    emit('success', `تم إنشاء النسخة الاحتياطية (${result.filename}) بنجاح.`);
    emit('close');
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'تعذر إنشاء النسخة الاحتياطية، يرجى المحاولة لاحقاً.';
  } finally {
    loading.value = false;
  }
};
</script>
