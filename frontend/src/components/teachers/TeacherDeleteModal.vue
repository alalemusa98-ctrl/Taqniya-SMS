<script setup lang="ts">
import { ref } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import { teachersApi, type Teacher } from '../../api/teachers.api';
import { useToast } from '../../composables/useToast';
import TaqniyaModal from '../ui/TaqniyaModal.vue';

const props = defineProps<{
  isOpen: boolean;
  teacher: Teacher | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'deleted'): void;
}>();

const toast = useToast();
const isDeleting = ref(false);
const errorMessage = ref<string | null>(null);

async function handleDelete() {
  if (!props.teacher) return;
  isDeleting.value = true;
  errorMessage.value = null;

  try {
    await teachersApi.deleteTeacher(props.teacher.id);
    toast.success('تم حذف ملف المعلم وحسابه بنجاح.');
    emit('deleted');
    emit('close');
  } catch (err: any) {
    const msg =
      err.response?.data?.message ||
      'تعذر حذف ملف المعلم لوجود إسنادات تدريس أو جداول حصص مرتبطة به (RESTRICT).';
    errorMessage.value = msg;
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <TaqniyaModal
    :is-open="isOpen && !!teacher"
    title="تأكيد حذف ملف المعلم"
    subtitle="حذف منطقي محمي بقيود النزاهة الأكاديمية (RESTRICT)"
    max-width="md"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold border border-rose-500/20 shrink-0">
        <Trash2 class="w-5 h-5" />
      </div>
    </template>

    <div v-if="teacher" class="space-y-4">
      <!-- Error Alert if 409 Conflict occurred -->
      <div
        v-if="errorMessage"
        class="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1"
      >
        <p class="font-bold">تعذر إتمام الحذف:</p>
        <p class="leading-relaxed text-[11px]">{{ errorMessage }}</p>
      </div>

      <p class="text-xs text-bx-muted leading-relaxed">
        هل أنت متأكد من رغبتك في حذف ملف المعلم
        <span class="font-bold text-bx-title">"{{ teacher.full_name }}"</span>
        (كود: <span class="font-mono font-bold text-bx-primary">{{ teacher.user_code }}</span>)؟
      </p>

      <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
        <p class="font-bold">🔒 حماية النزاهة المرجعية (RESTRICT):</p>
        <p class="leading-relaxed">
          يحظر النظام حذف أي معلم إذا كان مرتبطاً بجدول إسناد تدريس لمادة أو شعبة بالعام الدراسي لحماية سجلات الدرجات وجداول الحصص.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="isDeleting"
          @click="handleDelete"
          class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>{{ isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>
