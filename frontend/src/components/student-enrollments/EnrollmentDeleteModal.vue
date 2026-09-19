<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import type { EnrolledStudent } from '../../api/student-enrollments.api';

defineProps<{
  isOpen: boolean;
  student: EnrolledStudent | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();
</script>

<template>
  <TaqniyaModal
    :is-open="isOpen"
    @close="emit('close')"
    max-width="md"
    :show-close-button="false"
  >
    <div class="text-center space-y-4 font-sans py-2" dir="rtl">
      <div class="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <Trash2 class="w-5 h-5" />
      </div>

      <div class="space-y-1.5">
        <h3 class="text-base font-black text-bx-title font-display">
          تأكيد إلغاء وتجريد تسكين الطالب
        </h3>
        <p class="text-xs text-bx-muted leading-relaxed">
          هل أنت متأكد من رغبتك في إلغاء تسكين الطالب
          <strong class="text-bx-title font-bold">{{ student?.student_name }}</strong>
          وتفريغ مقعده من الشعبة؟
        </p>
      </div>

      <div class="flex items-center justify-center gap-2 pt-3 border-t border-bx-divider">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-full text-xs font-bold text-bx-muted hover:text-bx-title cursor-pointer transition-colors"
        >
          تراجع
        </button>
        <button
          type="button"
          :disabled="submitting"
          @click="emit('confirm')"
          class="px-5 py-2 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer disabled:opacity-50"
        >
          <span v-if="submitting">جاري الإلغاء...</span>
          <span v-else>نعم، إلغاء التسكين</span>
        </button>
      </div>
    </div>
  </TaqniyaModal>
</template>
