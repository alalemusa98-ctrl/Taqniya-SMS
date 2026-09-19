<script setup lang="ts">
import {
  BookOpen,
  Hash,
  Clock,
  Coffee,
  AlertCircle,
} from 'lucide-vue-next';

interface SlotFormData {
  name: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
}

interface Props {
  mode: 'create' | 'edit';
  formData: SlotFormData;
  formErrors: Record<string, string>;
  formErrorMessage: string | null;
  isSubmitting: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
  (e: 'update:formData', value: SlotFormData): void;
}>();

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const total1 = h1 * 60 + m1;
  const total2 = h2 * 60 + m2;
  const diff = total2 - total1;
  return diff > 0 ? `${diff} دقيقة` : '-';
}
</script>

<template>
  <form id="slotForm" @submit.prevent="emit('submit')" class="space-y-5" dir="rtl">
    <!-- Error Alert inside Drawer -->
    <div
      v-if="formErrorMessage"
      class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2"
    >
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ formErrorMessage }}</span>
    </div>

    <!-- Section 1: Basic Period Info Card -->
    <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
      <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
        <BookOpen class="w-4 h-4 text-bx-primary shrink-0" />
        <h4 class="text-xs font-black text-bx-title">البيانات الأساسية للحصة</h4>
      </div>

      <!-- Name -->
      <div class="space-y-1.5">
        <label for="slot_name" class="text-xs font-bold text-bx-title block">
          مسمى الحصة / الفترة <span class="text-red-500">*</span>
        </label>
        <input
          id="slot_name"
          v-model="formData.name"
          type="text"
          required
          maxlength="50"
          placeholder="مثال: الحصة الأولى، الفسحة الكبرى..."
          class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
          :class="[formErrors.name ? 'border-red-400 bg-red-50/20' : '']"
        />
        <p v-if="formErrors.name" class="text-[11px] text-red-500 font-medium">
          {{ formErrors.name }}
        </p>
      </div>

      <!-- Slot Number -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5 text-bx-title">
          <Hash class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <label for="slot_number" class="text-xs font-bold">الرقم التسلسلي في اليوم <span class="text-red-500">*</span></label>
        </div>
        <input
          id="slot_number"
          v-model.number="formData.slot_number"
          type="number"
          min="1"
          max="255"
          required
          placeholder="1, 2, 3..."
          class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono font-medium"
          :class="[formErrors.slot_number ? 'border-red-400 bg-red-50/20' : '']"
        />
        <p v-if="formErrors.slot_number" class="text-[11px] text-red-500 font-medium">
          {{ formErrors.slot_number }}
        </p>
      </div>
    </div>

    <!-- Section 2: Times & Duration Card -->
    <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
      <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
        <Clock class="w-4 h-4 text-amber-500 shrink-0" />
        <h4 class="text-xs font-black text-bx-title">توقيت البداية والنهاية</h4>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Start Time -->
        <div class="space-y-1.5">
          <label for="start_time" class="text-xs font-bold text-bx-title block">
            وقت البداية <span class="text-red-500">*</span>
          </label>
          <input
            id="start_time"
            v-model="formData.start_time"
            type="time"
            required
            class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono font-medium text-center"
            :class="[formErrors.start_time ? 'border-red-400 bg-red-50/20' : '']"
          />
          <p v-if="formErrors.start_time" class="text-[11px] text-red-500 font-medium">
            {{ formErrors.start_time }}
          </p>
        </div>

        <!-- End Time -->
        <div class="space-y-1.5">
          <label for="end_time" class="text-xs font-bold text-bx-title block">
            وقت النهاية <span class="text-red-500">*</span>
          </label>
          <input
            id="end_time"
            v-model="formData.end_time"
            type="time"
            required
            class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title focus:outline-none focus:border-bx-primary transition-all font-mono font-medium text-center"
            :class="[formErrors.end_time ? 'border-red-400 bg-red-50/20' : '']"
          />
          <p v-if="formErrors.end_time" class="text-[11px] text-red-500 font-medium">
            {{ formErrors.end_time }}
          </p>
        </div>
      </div>

      <!-- Duration Notice -->
      <div
        v-if="formData.start_time && formData.end_time && formData.start_time < formData.end_time"
        class="p-3 rounded-2xl bg-purple-500/[0.04] dark:bg-white/[0.02] border border-bx-border text-xs text-bx-title flex items-center justify-between"
      >
        <span class="text-bx-muted font-bold">المدة المحسوبة تلقائياً:</span>
        <span class="font-black font-mono text-bx-primary">{{ calculateDuration(formData.start_time, formData.end_time) }}</span>
      </div>
    </div>

    <!-- Section 3: Period Classification Card -->
    <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
      <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
        <Coffee class="w-4 h-4 text-purple-500 shrink-0" />
        <h4 class="text-xs font-black text-bx-title">تصنيف الفترة</h4>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-bx-title block">نوع الفترة التعليمية <span class="text-red-500">*</span></label>
        <div class="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            @click="formData.is_break = false"
            class="py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            :class="!formData.is_break ? 'border-bx-primary bg-bx-primary/10 text-bx-primary shadow-xs' : 'border-bx-border text-bx-muted hover:text-bx-title'"
          >
            <BookOpen class="w-3.5 h-3.5" />
            <span>حصة دراسية</span>
          </button>
          <button
            type="button"
            @click="formData.is_break = true"
            class="py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            :class="formData.is_break ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs' : 'border-bx-border text-bx-muted hover:text-bx-title'"
          >
            <Coffee class="w-3.5 h-3.5" />
            <span>فسحة / استراحة</span>
          </button>
        </div>
      </div>

      <p class="text-[11px] text-bx-muted leading-relaxed">
        💡 ملحوظة: فترات الاستراحة تُستثنى آلياً من إمكانية تسكين المواد والمناهج الدراسية عليها داخل الجدول الأسبوعي.
      </p>
    </div>
  </form>
</template>
