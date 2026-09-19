<script setup lang="ts">
import { ref, watch } from 'vue';
import { Calendar, AlertCircle, Loader2, Save, Trash2 } from 'lucide-vue-next';
import type { DayOfWeek, TimetableSlotItem } from '../../api/timetables.api';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';

const props = defineProps<{
  isOpen: boolean;
  drawerMode: 'create' | 'edit';
  subtitle?: string;
  initialData: {
    academic_year_id: number;
    class_section_id: number;
    day_of_week: DayOfWeek;
    period_slot_id: number;
    teaching_assignment_id: number;
  };
  dayOptions: TaqniyaSelectOption[];
  periodOptions: TaqniyaSelectOption[];
  assignmentOptions: TaqniyaSelectOption[];
  isSubmitting: boolean;
  formErrors: Record<string, string>;
  formErrorMessage: string | null;
  slotToEdit: TimetableSlotItem | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: typeof props.initialData): void;
  (e: 'unassign'): void;
}>();

const localForm = ref({ ...props.initialData });

watch(
  () => props.initialData,
  (newVal) => {
    localForm.value = { ...newVal };
  },
  { deep: true, immediate: true },
);

function handleSubmit() {
  emit('submit', { ...localForm.value });
}
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    @close="emit('close')"
    :title="drawerMode === 'create' ? 'تسكين حصة جديدة بالجدول الأسبوعي' : 'تعديل وتحديث موعد الحصة'"
    :subtitle="subtitle"
    :icon="Calendar"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 p-1">
      <!-- General Form Error Banner -->
      <div
        v-if="formErrorMessage"
        class="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-xs flex items-start gap-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
        <span>{{ formErrorMessage }}</span>
      </div>

      <!-- Day of Week -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          يوم الحصة في الأسبوع <span class="text-red-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="localForm.day_of_week"
          :options="dayOptions"
          placeholder="اختر اليوم..."
          full-width
        />
      </div>

      <!-- Period Slot -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          الحصة اليومية والتوقيت <span class="text-red-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="localForm.period_slot_id"
          :options="periodOptions"
          placeholder="اختر توقيت الحصة..."
          full-width
        />
        <p v-if="formErrors.period_slot_id" class="text-xs text-red-500 mt-1">
          {{ formErrors.period_slot_id }}
        </p>
      </div>

      <!-- Teaching Assignment -->
      <div>
        <label class="block text-xs font-bold text-bx-title mb-1.5">
          المادة والمعلم المكلف <span class="text-red-500">*</span>
        </label>
        <TaqniyaSelect
          v-model="localForm.teaching_assignment_id"
          :options="assignmentOptions"
          placeholder="اختر المادة والمعلم..."
          full-width
        />
        <p v-if="formErrors.teaching_assignment_id" class="text-xs text-red-500 mt-1">
          {{ formErrors.teaching_assignment_id }}
        </p>
        <p class="text-[11px] text-bx-muted mt-1.5 leading-relaxed">
          💡 <strong>الربط التلقائي:</strong> يتم جلب المعلم المكلف بتدريس المادة في هذه الشعبة مباشرة من سجلات التكليفات دون حاجة لاختيار المعلم يدوياً.
        </p>
      </div>

      <!-- Actions -->
      <div class="pt-4 border-t border-bx-divider flex items-center justify-between gap-2.5">
        <!-- Unassign Slot Button (Edit Mode Only) -->
        <button
          v-if="drawerMode === 'edit' && slotToEdit"
          type="button"
          @click="emit('unassign')"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-red-300 dark:border-red-500/40 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          title="فك هذه الحصة وإفراغ الموعد بالجدول"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>فك الحصة</span>
        </button>
        <div v-else></div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-title hover:bg-purple-500/[0.04] transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary hover:bg-bx-primary-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            <span>{{ drawerMode === 'create' ? 'تسكين الحصة الآن' : 'تحديث الحصة' }}</span>
          </button>
        </div>
      </div>
    </form>
  </TaqniyaDrawer>
</template>
