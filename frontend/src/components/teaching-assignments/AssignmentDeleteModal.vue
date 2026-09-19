<script setup lang="ts">
import { ref } from 'vue';
import { Trash2, AlertCircle, Loader2 } from 'lucide-vue-next';
import { teachingAssignmentsApi, type AssignmentItem } from '../../api/teaching-assignments.api';
import { useToast } from '../../composables/useToast';
import TaqniyaModal from '../ui/TaqniyaModal.vue';

const props = defineProps<{
  isOpen: boolean;
  assignment: AssignmentItem | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'deleted'): void;
}>();

const toast = useToast();
const isDeleting = ref(false);
const errorMessage = ref<string | null>(null);

async function handleDelete() {
  if (!props.assignment) return;
  isDeleting.value = true;
  errorMessage.value = null;

  try {
    const res = await teachingAssignmentsApi.delete(props.assignment.id);
    toast.success(res.data.message || 'تم فك وإلغاء إسناد التدريس بنجاح.');
    emit('deleted');
    emit('close');
  } catch (err: any) {
    const msg =
      err.response?.data?.message ||
      'لا يمكن فك إسناد التدريس لوجود حصص دراسية أو درجات أو واجبات مرتبطة به في المنظومة (Foreign Key Restrict).';
    errorMessage.value = msg;
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <TaqniyaModal
    :is-open="isOpen && !!assignment"
    title="تأكيد فك وإلغاء إسناد التدريس"
    subtitle="فك ارتباط المادة بالمعلم محمي بقيود النزاهة الأكاديمية (RESTRICT)"
    max-width="md"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold border border-rose-500/20 shrink-0">
        <Trash2 class="w-5 h-5" />
      </div>
    </template>

    <div v-if="assignment" class="space-y-4">
      <!-- Error Alert if 409 Conflict occurred -->
      <div
        v-if="errorMessage"
        class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1"
      >
        <div class="flex items-center gap-1.5 font-bold">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>تعذر فك الإسناد:</span>
        </div>
        <p class="leading-relaxed text-[11px]">{{ errorMessage }}</p>
      </div>

      <p class="text-xs text-bx-muted leading-relaxed">
        هل أنت متأكد من رغبتك في إلغاء إسناد مادة
        <strong class="text-bx-title font-bold">({{ assignment.subject_name }})</strong>
        للمعلم
        <strong class="text-bx-title font-bold">({{ assignment.teacher_name }})</strong>؟
      </p>

      <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
        <p class="font-bold">🔒 حماية النزاهة المرجعية (Foreign Key Restrict):</p>
        <p class="leading-relaxed">
          يحظر النظام فك أي إسناد تدريس إذا كانت هناك حصص دراسية مسكنة في جدول الحصص الأسبوعي أو واجبات أو درجات مرتبطة به.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="isDeleting"
          @click="handleDelete"
          class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
          <Trash2 v-else class="w-3.5 h-3.5" />
          <span>{{ isDeleting ? 'جاري الفك...' : 'تأكيد فك الإسناد' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>
