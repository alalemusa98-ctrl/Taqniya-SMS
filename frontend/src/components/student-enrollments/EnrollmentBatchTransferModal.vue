<script setup lang="ts">
import { ArrowLeftRight, School, GraduationCap, AlertCircle, Loader2 } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';

defineProps<{
  isOpen: boolean;
  selectedEnrollmentIds: number[];
  selectedStudentsInfo: Array<{ enrollment_id: number; student_name: string; student_code: string }>;
  classOptions: TaqniyaSelectOption[];
  sectionOptions: TaqniyaSelectOption[];
  selectedClassId: number | '';
  selectedSectionId: number | '';
  errorMessage: string | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit'): void;
  (e: 'toggle-student', enrollmentId: number): void;
  (e: 'update:selectedClassId', val: number | ''): void;
  (e: 'update:selectedSectionId', val: number | ''): void;
}>();
</script>

<template>
  <TaqniyaModal
    :is-open="isOpen"
    @close="emit('close')"
    max-width="lg"
    title="نقل الطلاب المحددين إلى صف أو شعبة أخرى"
    :subtitle="`تم تحديد ${selectedEnrollmentIds.length} طالب للنقل الجماعي`"
  >
    <template #icon>
      <div class="w-9 h-9 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold">
        <ArrowLeftRight class="w-5 h-5" />
      </div>
    </template>

    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-500/[0.08] dark:bg-rose-950/50 border border-rose-400/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 font-bold"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- List of Selected Students -->
      <div class="space-y-1.5">
        <label class="block text-[11px] font-bold text-bx-title">
          الطلاب المحددين للنقل ({{ selectedStudentsInfo.length }}):
        </label>
        <div class="max-h-32 overflow-y-auto p-2.5 rounded-2xl bg-purple-500/[0.02] border border-bx-border flex flex-wrap gap-1.5">
          <span
            v-for="st in selectedStudentsInfo"
            :key="st.enrollment_id"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20"
          >
            <span>{{ st.student_name }}</span>
            <span class="text-[10px] text-bx-muted font-mono">({{ st.student_code }})</span>
            <button
              type="button"
              @click="emit('toggle-student', st.enrollment_id)"
              class="text-bx-muted hover:text-rose-500 cursor-pointer text-xs ml-0.5 leading-none"
              title="إلغاء تحديد هذا الطالب"
            >
              ×
            </button>
          </span>
        </div>
      </div>

      <!-- Target Class & Target Section Selectors -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block text-[11px] font-bold text-bx-title mb-1.5">
            1. الصف الدراسي المستهدف <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            :model-value="selectedClassId"
            @update:model-value="(val) => emit('update:selectedClassId', val as number | '')"
            :options="classOptions"
            placeholder="اختر الصف..."
            :icon="School"
            full-width
          />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-bx-title mb-1.5">
            2. الشعبة الدراسية المستهدفة <span class="text-rose-500">*</span>
          </label>
          <TaqniyaSelect
            :model-value="selectedSectionId"
            @update:model-value="(val) => emit('update:selectedSectionId', val as number | '')"
            :options="sectionOptions"
            :placeholder="!selectedClassId ? 'اختر الصف أولاً...' : sectionOptions.length === 0 ? 'لا توجد شعب' : 'اختر الشعبة...'"
            :disabled="!selectedClassId || sectionOptions.length === 0"
            :icon="GraduationCap"
            full-width
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3" dir="rtl">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-full text-xs font-bold border border-bx-border text-bx-muted hover:text-bx-title hover:bg-bx-row-hover cursor-pointer transition"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="submitting || selectedEnrollmentIds.length === 0 || !selectedSectionId"
          @click="emit('submit')"
          class="px-6 py-2 rounded-full text-xs font-bold bg-bx-primary hover:bg-bx-primary-hover text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          <span>تأكيد نقل {{ selectedEnrollmentIds.length }} طلاب</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>
