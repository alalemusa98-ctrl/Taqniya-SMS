<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="معاينة وتنفيذ الترحيل الأكاديمي الجماعي وتوزيع الفصول"
    subtitle="محاكاة ذكية للترحيل السنوي، احتساب الشواغر، ورصد تنبيهات انخفاض الكثافة"
    maxWidth="2xl"
    @close="$emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold border border-bx-primary/20 shadow-xs">
        <Sparkles class="w-5 h-5" />
      </div>
    </template>

    <div class="space-y-6 text-bx-text font-sans">
      <!-- Year Selection Grid using TaqniyaSelect -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-muted">العام الدراسي الحالي (المُرحّل منه):</label>
          <TaqniyaSelect
            v-model="fromYearId"
            :options="yearOptions"
            placeholder="اختر العام الدراسي الحالي..."
            :full-width="true"
            :disabled="isPreviewLoading || isExecuting"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-muted">العام الدراسي المستهدف (المُرحّل إليه):</label>
          <TaqniyaSelect
            v-model="toYearId"
            :options="yearOptions"
            placeholder="اختر العام الدراسي المستهدف..."
            :full-width="true"
            :disabled="isPreviewLoading || isExecuting"
          />
        </div>
      </div>

      <!-- Preview Simulation Trigger -->
      <div class="flex justify-center">
        <button
          type="button"
          class="w-full py-3 px-6 rounded-2xl bg-bx-primary/10 hover:bg-bx-primary/20 text-bx-primary border border-bx-primary/30 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canPreview || isPreviewLoading || isExecuting"
          @click="runPreview"
        >
          <Loader2 v-if="isPreviewLoading" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" />
          <span>{{ isPreviewLoading ? 'جاري تشغيل محاكاة الترحيل الأكاديمي...' : 'تشغيل محاكاة الترحيل ومعاينة النتائج (Simulate & Preview)' }}</span>
        </button>
      </div>

      <!-- Simulation Results Container -->
      <div v-if="previewResult" class="bg-black/[0.02] dark:bg-white/[0.02] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
          <span class="font-bold text-sm text-bx-title font-display">نتائج المحاكاة التقديرية</span>
          <span class="text-xs text-bx-muted font-semibold">إجمالي الطلاب المسكنين: {{ previewResult.total_eligible_students }} طالب</span>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-[var(--bx-surface-solid)] border-s-4 border-s-emerald-500 border border-[#B4AED8]/50 dark:border-white/[0.06] rounded-2xl p-3.5 space-y-1">
            <span class="text-[11px] font-bold text-bx-muted block">المنقولون (Promoted)</span>
            <span class="text-xl font-black text-emerald-600 font-mono">{{ previewResult.total_promoted }}</span>
            <span class="text-[10px] text-bx-muted block leading-tight">للمستوى التالي مع الشعبة</span>
          </div>

          <div class="bg-[var(--bx-surface-solid)] border-s-4 border-s-amber-500 border border-[#B4AED8]/50 dark:border-white/[0.06] rounded-2xl p-3.5 space-y-1">
            <span class="text-[11px] font-bold text-bx-muted block">الدور الثاني</span>
            <span class="text-xl font-black text-amber-600 font-mono">{{ previewResult.total_second_round }}</span>
            <span class="text-[10px] text-bx-muted block leading-tight">معلقون حتى الامتحان</span>
          </div>

          <div class="bg-[var(--bx-surface-solid)] border-s-4 border-s-rose-500 border border-[#B4AED8]/50 dark:border-white/[0.06] rounded-2xl p-3.5 space-y-1">
            <span class="text-[11px] font-bold text-bx-muted block">الباقون للإعادة</span>
            <span class="text-xl font-black text-rose-600 font-mono">{{ previewResult.total_retained }}</span>
            <span class="text-[10px] text-bx-muted block leading-tight">في نفس المستوى والشعبة</span>
          </div>

          <div class="bg-[var(--bx-surface-solid)] border-s-4 border-s-bx-primary border border-[#B4AED8]/50 dark:border-white/[0.06] rounded-2xl p-3.5 space-y-1">
            <span class="text-[11px] font-bold text-bx-muted block">الخريجون</span>
            <span class="text-xl font-black text-bx-primary font-mono">{{ previewResult.total_graduated }}</span>
            <span class="text-[10px] text-bx-muted block leading-tight">أتموا المرحلة بنجاح</span>
          </div>
        </div>

        <!-- Low Enrollment Warnings (SSoT High Priority Requirement) -->
        <div
          v-if="previewResult.low_enrollment_warnings && previewResult.low_enrollment_warnings.length > 0"
          class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2 text-amber-800 dark:text-amber-200"
        >
          <div class="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0" />
            <span>تنبيهات انخفاض الكثافة الطلابية (أقل من 10 طلاب بالشعبة):</span>
          </div>
          <ul class="space-y-1 text-xs pr-5 list-disc">
            <li v-for="(warn, wIdx) in previewResult.low_enrollment_warnings" :key="wIdx">
              <strong>{{ warn.class_name }} - {{ warn.section_name }}:</strong>
              <span> العدد المتوقع هو {{ warn.projected_count }} طلاب فقط (الكثافة المقترحة: {{ warn.threshold_limit }}). يُوصى بمراجعة الشعبة لاحقاً.</span>
            </li>
          </ul>
        </div>

        <!-- Class Breakdown Table -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-bx-muted">توزيع الفصول والنسب المتوقعة:</h4>
          <div class="overflow-x-auto rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.06] bg-[var(--bx-surface-solid)]">
            <table class="w-full text-right text-xs border-collapse">
              <thead>
                <tr class="bg-black/[0.02] dark:bg-white/[0.02] text-bx-muted font-bold border-b border-[#B4AED8]/40 dark:border-white/[0.06]">
                  <th class="py-2.5 px-3">الصف الدراسي</th>
                  <th class="py-2.5 px-3">إجمالي الطلاب</th>
                  <th class="py-2.5 px-3">الناجحون</th>
                  <th class="py-2.5 px-3">الباقون للإعادة</th>
                  <th class="py-2.5 px-3">نسبة النجاح المتوقعة</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#B4AED8]/30 dark:divide-white/[0.04]">
                <tr v-for="(cls, cIdx) in previewResult.class_breakdown" :key="cIdx">
                  <td class="py-2 px-3 font-bold text-bx-title">{{ cls.class_name }}</td>
                  <td class="py-2 px-3 font-mono">{{ cls.total }}</td>
                  <td class="py-2 px-3 font-bold text-emerald-600 font-mono">{{ cls.promoted }}</td>
                  <td class="py-2 px-3 font-bold text-rose-600 font-mono">{{ cls.retained }}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600">
                      {{ cls.pass_rate }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Execution Notes -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-bx-muted">ملاحظات وقرار لجنة الترحيل السنوي:</label>
          <textarea
            v-model="executionNotes"
            rows="2"
            class="w-full p-3 rounded-2xl bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] text-xs text-bx-title outline-none focus:border-bx-primary transition-all resize-none"
            placeholder="أدخل أي ملاحظات إدارية أو توثيقية خاصة بهذه الدفعة..."
          ></textarea>
        </div>

        <!-- Final Confirmation Checkbox -->
        <div class="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-2xl">
          <input id="confirm-promotion" v-model="isConfirmed" type="checkbox" class="mt-0.5 w-4 h-4 text-bx-primary rounded border-bx-border cursor-pointer" />
          <label for="confirm-promotion" class="text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer leading-relaxed">
            أقر بأنني قمت بمراجعة كافة النتائج أعلاه، وأوافق على اعتماد الترحيل النهائي وتسكين الطلاب في العام الدراسي الجديد.
          </label>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          @click="$emit('close')"
        >
          إلغاء
        </button>
        <button
          v-if="previewResult"
          type="button"
          class="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!isConfirmed || isExecuting"
          @click="handleExecute"
        >
          <Loader2 v-if="isExecuting" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" />
          <span>{{ isExecuting ? 'جاري تنفيذ وتسكين الترحيل...' : 'تنفيذ الترحيل الأكاديمي النهائي والاعتماد' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sparkles, AlertTriangle, Loader2 } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type { PromotionSimulationResult, ExecutePromotionDto } from '../../api/promotion.api';

interface AcademicYearOption {
  id: number;
  name: string;
  is_active?: number | boolean;
}

interface Props {
  isOpen: boolean;
  academicYears: AcademicYearOption[];
  previewResult: PromotionSimulationResult | null;
  isPreviewLoading?: boolean;
  isExecuting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isPreviewLoading: false,
  isExecuting: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'preview', payload: { from_year_id: number; to_year_id: number }): void;
  (e: 'execute', payload: ExecutePromotionDto): void;
}>();

const fromYearId = ref<number | ''>('');
const toYearId = ref<number | ''>('');
const executionNotes = ref('');
const isConfirmed = ref(false);

const yearOptions = computed<TaqniyaSelectOption[]>(() => {
  return props.academicYears.map((y) => ({
    value: y.id,
    label: `${y.name} ${Number(y.is_active) === 1 || y.is_active === true ? '(العام النشط)' : ''}`,
    subtext: Number(y.is_active) === 1 || y.is_active === true ? 'العام الأكاديمي النشط حالياً' : undefined,
  }));
});

const canPreview = computed(() => {
  return fromYearId.value !== '' && toYearId.value !== '' && fromYearId.value !== toYearId.value;
});

const runPreview = () => {
  if (!canPreview.value) return;
  emit('preview', {
    from_year_id: Number(fromYearId.value),
    to_year_id: Number(toYearId.value),
  });
};

const handleExecute = () => {
  if (!canPreview.value || !isConfirmed.value) return;
  emit('execute', {
    from_academic_year_id: Number(fromYearId.value),
    to_academic_year_id: Number(toYearId.value),
    execution_notes: executionNotes.value || 'تم تنفيذ الترحيل الأكاديمي السنوي بنجاح.',
  });
};
</script>
