<script setup lang="ts">
import { ref } from 'vue';
import { AlertTriangle, Trash2, X } from 'lucide-vue-next';
import { teachersApi, type Teacher } from '../../api/teachers.api';

const props = defineProps<{
  isOpen: boolean;
  teacher: Teacher | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'deleted'): void;
}>();

const isDeleting = ref(false);
const errorMessage = ref<string | null>(null);

async function handleDelete() {
  if (!props.teacher) return;
  isDeleting.value = true;
  errorMessage.value = null;

  try {
    await teachersApi.deleteTeacher(props.teacher.id);
    emit('deleted');
    emit('close');
  } catch (err: any) {
    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = 'حدث خطأ غير متوقع أثناء محاولة حذف ملف المعلم.';
    }
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen && teacher" class="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-md rounded-3xl bg-[var(--bx-surface-solid)] border border-bx-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <!-- Modal Header -->
      <div class="p-6 border-b border-bx-border flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-bx-title">تأكيد حذف ملف المعلم</h3>
            <p class="text-xs text-bx-muted">حذف منطقي محمي بقيود النزاهة الأكاديمية</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 text-bx-muted hover:text-bx-title rounded-xl hover:bg-[var(--bx-pill)] transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4">
        <!-- Error Alert if 409 Conflict or Other -->
        <div
          v-if="errorMessage"
          class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 leading-relaxed"
        >
          <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p class="font-bold">تعذر إتمام عملية الحذف:</p>
            <p>{{ errorMessage }}</p>
          </div>
        </div>

        <p class="text-xs text-bx-muted leading-relaxed">
          هل أنت متأكد من رغبتك في حذف ملف المعلم <span class="font-bold text-bx-title">"{{ teacher.full_name }}"</span> (كود: <span class="font-mono font-bold">{{ teacher.user_code }}</span>)؟
        </p>

        <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
          <p class="font-bold">قيد الحماية المرجعية (RESTRICT):</p>
          <p>
            يحظر النظام حذف أي معلم إذا كان مرتبطاً بجدول إسناد تدريس لمادة أو شعبة بالعام الدراسي حفاظاً على ترابط سجلات الطلاب والدرجات.
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-[var(--bx-canvas)] border-t border-bx-border flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl border border-bx-border hover:bg-[var(--bx-pill)] text-bx-title font-bold text-xs transition-colors cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="isDeleting"
          @click="handleDelete"
          class="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Trash2 class="w-4 h-4" />
          <span>{{ isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
