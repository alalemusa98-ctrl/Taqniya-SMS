<script setup lang="ts">
import { ref } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import { backupApi } from '../../api/backup.api';
import { Database, FileText, Sparkles, Loader2 } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', message: string): void;
}>();

const note = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const presetNotes = [
  'نسخة احتياطية دورية للنظام',
  'نسخة احتياطية قبل تعديل الهيكل الأكاديمي',
  'نسخة احتياطية قبل رصد الدرجات وإصدار الصحائف',
  'نسخة احتياطية قبل تنفيذ الترحيل السنوي وتسكين الطلاب',
];

const setPresetNote = (preset: string) => {
  note.value = preset;
};

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await backupApi.createBackup({ note: note.value.trim() || undefined });
    emit('success', `تم إنشاء النسخة الاحتياطية (${result.filename}) بنجاح.`);
    emit('close');
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'تعذر إنشاء النسخة الاحتياطية، يرجى المحاولة لاحقاً.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <TaqniyaModal
    :is-open="true"
    title="إنشاء نسخة احتياطية جديدة"
    subtitle="توليد وتفريغ كامل لقاعدة البيانات وضغطها في حزمة ZIP مؤمنة"
    @close="emit('close')"
  >
    <div class="space-y-6 text-right dir-rtl">
      <!-- Info Card -->
      <div class="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Database class="w-5 h-5" />
        </div>
        <div class="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
          <span class="font-bold block text-sm mb-0.5">تفريغ فوري وتجزئة دفعية:</span>
          سيقوم النظام بتصدير الجداول والبيانات بنمط الـ Chunking وحفظها بملف SQL مضغوط داخل مسار التخزين مع الملاحظة الوصفية المدخلة أدناه.
        </div>
      </div>

      <!-- Note Input -->
      <div>
        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
          <FileText class="w-4 h-4 text-primary" />
          <span>ملاحظة أو وصف النسخة (اختياري)</span>
        </label>
        <textarea
          v-model="note"
          rows="3"
          maxlength="500"
          placeholder="اكتب وصفاً أو سبباً لإنشاء النسخة، مثلاً: نسخة احتياطية قبل ترحيل الطلاب..."
          class="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 focus:border-primary dark:focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 text-slate-800 dark:text-slate-100 font-medium transition-all text-sm resize-none"
        ></textarea>
        <div class="flex justify-between items-center mt-1 text-xs text-slate-400 font-medium">
          <span>يمكن الاسترشاد بالملاحظة لاحقاً عند استعادة البيانات.</span>
          <span>{{ note.length }}/500</span>
        </div>
      </div>

      <!-- Quick Preset Suggestions -->
      <div>
        <div class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-amber-500" />
          <span>نماذج سريعة للملاحظات:</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(preset, idx) in presetNotes"
            :key="idx"
            type="button"
            @click="setPresetNote(preset)"
            class="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
        {{ errorMessage }}
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          @click="handleSubmit"
          :disabled="loading"
          class="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-60 cursor-pointer"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <Database v-else class="w-5 h-5" />
          <span>{{ loading ? 'جارٍ إنشاء وضغط النسخة...' : 'بدء إنشاء النسخة الآن' }}</span>
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
