<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="توليد واعتماد الصحائف السنوية التجميعية (Annual Transcripts)"
    subtitle="حساب المتوسطات وتوليد الصحيفة السنوية الرسمية المعتمدة لكافة طلاب الشعبة"
    max-width="md"
    @close="emit('close')"
  >
    <div class="space-y-4" dir="rtl">
      <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 space-y-2">
        <div class="flex items-center gap-2 font-bold text-sm text-purple-700 dark:text-purple-300">
          <Sparkles class="w-5 h-5 text-purple-600" />
          <span>توليد الصحيفة السنوية لـ: {{ sectionInfo?.class_name }} ({{ sectionInfo?.section_name }})</span>
        </div>
        <p class="text-xs leading-relaxed">
          سيقوم النظام بتجميع درجات الفصول السابقة لهذا العام الدراسي تلقائياً، واحتساب المجموع السنوي العام ومتوسطات المواد، وإصدار صحائف سنوية مجمدة ومؤرشفة لكافة طلاب هذه الشعبة (<strong>{{ sectionInfo?.total_enrolled || 0 }} طالب</strong>).
        </p>
      </div>

      <div class="p-3 bg-bx-surface-2 rounded-xl text-xs text-bx-muted space-y-1">
        <span class="font-bold text-bx-title block">ملاحظات هامة:</span>
        <ul class="list-disc pr-4 space-y-0.5">
          <li>الصحائف السنوية المولدة ستظهر مباشرة في شاشة <strong>الترحيل الأكاديمي والنتائج</strong>.</li>
          <li>يمكنك إعادة التوليد لاحقاً في حال تم تعديل درجات أي فصل من الفصول.</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button
          type="button"
          class="px-4 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
          @click="emit('close')"
        >
          إلغاء
        </button>

        <button
          type="button"
          class="px-5 py-2 text-xs font-bold rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          :disabled="isGenerating"
          @click="emit('confirm')"
        >
          <Loader2 v-if="isGenerating" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" />
          <span>{{ isGenerating ? 'جاري التوليد...' : 'تأكيد التوليد والاعتماد' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { Sparkles, Loader2 } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';

interface Props {
  isOpen: boolean;
  sectionInfo: any;
  isGenerating?: boolean;
}

withDefaults(defineProps<Props>(), {
  isOpen: false,
  sectionInfo: null,
  isGenerating: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();
</script>
