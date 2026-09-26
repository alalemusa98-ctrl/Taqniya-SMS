<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="توليد واعتماد الصحائف السنوية النهائية (Annual Transcripts)"
    subtitle="حساب المتوسطات التجميعية وضبط سياسات الدور الثاني والترحيل"
    max-width="lg"
    @close="emit('close')"
  >
    <div class="space-y-4" dir="rtl">
      <!-- Target Summary Box -->
      <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 space-y-2">
        <div class="flex items-center gap-2 font-bold text-sm text-purple-700 dark:text-purple-300">
          <Sparkles class="w-5 h-5 text-purple-600" />
          <span v-if="targetClass">توليد الصحيفة السنوية لـ: {{ targetClass.class_name }} (كافة الشعب)</span>
          <span v-else-if="sectionInfo">توليد الصحيفة السنوية لـ: {{ sectionInfo.class_name }} ({{ sectionInfo.section_name }})</span>
        </div>
        <p class="text-xs leading-relaxed">
          سيقوم النظام بتجميع درجات كافة الفصول المقررة لهذا العام الدراسي تلقائياً، واحتساب المجموع العام ومتوسطات المواد، وإصدار صحائف سنوية معتمدة ومجمدة لكافة طلاب
          <strong>{{ targetClass ? targetClass.class_name : (sectionInfo ? `${sectionInfo.class_name} - ${sectionInfo.section_name}` : '') }}</strong>
          (<strong>{{ totalStudentsCount }} طالب</strong>).
        </p>
      </div>

      <!-- Second Round Evaluation Mode Selection -->
      <div class="p-4 bg-bx-surface-2 rounded-2xl border border-bx-border space-y-3">
        <div class="flex items-center gap-2">
          <Award class="w-4 h-4 text-amber-500 shrink-0" />
          <span class="text-xs font-black text-bx-title">
            سياسة احتساب درجات امتحانات الدور الثاني (Second Round Policy)
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <!-- Option 1: replace_exam -->
          <label
            class="relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all select-none"
            :class="
              secondRoundMode === 'replace_exam'
                ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
                : 'border-bx-border bg-bx-surface hover:bg-purple-500/[0.03]'
            "
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-xs font-bold text-bx-title">استبدال درجة الامتحان فقط</span>
              <input
                type="radio"
                name="second_round_mode"
                value="replace_exam"
                v-model="secondRoundMode"
                class="w-3.5 h-3.5 text-purple-600 accent-purple-600 cursor-pointer"
              />
            </div>
            <p class="text-[11px] text-bx-muted leading-relaxed">
              أعمال السنة السابقة تظل محفوظة وثابتة، وتحل درجة الدور الثاني محل درجة الامتحان النهائي فقط.
            </p>
          </label>

          <!-- Option 2: full_score -->
          <label
            class="relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all select-none"
            :class="
              secondRoundMode === 'full_score'
                ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
                : 'border-bx-border bg-bx-surface hover:bg-purple-500/[0.03]'
            "
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-xs font-bold text-bx-title">المادة كاملة من الدور الثاني</span>
              <input
                type="radio"
                name="second_round_mode"
                value="full_score"
                v-model="secondRoundMode"
                class="w-3.5 h-3.5 text-purple-600 accent-purple-600 cursor-pointer"
              />
            </div>
            <p class="text-[11px] text-bx-muted leading-relaxed">
              امتحان الدور الثاني يكون شاملاً لكل المنهج وتلغى أعمال السنة السابقة وتُحسب المادة من 100%.
            </p>
          </label>
        </div>

        <!-- 50% Passing Score Capping Toggle -->
        <label class="flex items-start gap-2.5 pt-2 border-t border-bx-border/60 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="capPassingScore"
            class="w-4 h-4 mt-0.5 rounded-md border-[#B4AED8] text-bx-primary focus:ring-0 cursor-pointer accent-purple-600 shrink-0"
          />
          <div class="space-y-0.5">
            <span class="text-xs font-bold text-bx-title block">
              تحديد سقف درجة النجاح بالدور الثاني عند نسبة النجاح المقررة فقط (50% Passing Score Capping)
            </span>
            <span class="text-[11px] text-bx-muted leading-relaxed block">
              في حال تحقيق درجة أعلى من الدرجة الصغرى، تُقفل الدرجة عند درجة النجاح المقررة للمادة ضماناً لتكافؤ الفرص مع طلاب الدور الأول.
            </span>
          </div>
        </label>
      </div>

      <!-- Annual Cumulative Exam Compensation Feature Toggle -->
      <div class="p-3.5 bg-bx-surface-2 rounded-2xl border border-bx-border space-y-1">
        <label class="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="enableAnnualExamCompensation"
            class="w-4 h-4 mt-0.5 rounded-md border-[#B4AED8] text-bx-primary focus:ring-0 cursor-pointer accent-purple-600 shrink-0"
          />
          <div class="space-y-0.5">
            <span class="text-xs font-bold text-bx-title block">
              تفعيل ميزة جبر مجموع الامتحانات السنوية (Cumulative Exam Compensation)
            </span>
            <span class="text-[11px] text-bx-muted leading-relaxed block">
              عند التفعيل، يُحتسب شرط صغرى الامتحان على مجموع درجات امتحانات الفصول مجتمعة بدلاً من اشتراط اجتياز كل سمستر على حدة.
            </span>
          </div>
        </label>
      </div>

      <div class="p-3 bg-bx-surface-2 rounded-xl text-xs text-bx-muted space-y-1">
        <span class="font-bold text-bx-title block">ملاحظات هامة:</span>
        <ul class="list-disc pr-4 space-y-0.5 text-[11px]">
          <li>الطلاب الراسبون في مواد أقل من أو تساوي حد الدور الثاني للصف سيُسجلون بحالة <strong>دور ثانٍ</strong>.</li>
          <li>يمكنك رصد درجات الدور الثاني لكل طالب لاحقاً ومراجعة ترقيته أو بقائه للإعادة بنقرة واحدة.</li>
          <li>الصحائف السنوية المولدة ستظهر مباشرة في شاشة <strong>الترحيل الأكاديمي والنتائج</strong>.</li>
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
          class="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          :disabled="isGenerating"
          @click="handleConfirm"
        >
          <Loader2 v-if="isGenerating" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" />
          <span>{{ isGenerating ? 'جاري التوليد والاعتماد...' : 'تأكيد التوليد والاعتماد' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sparkles, Loader2, Award } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';

interface Props {
  isOpen: boolean;
  targetClass?: any;
  sectionInfo?: any;
  isGenerating?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  targetClass: null,
  sectionInfo: null,
  isGenerating: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (
    e: 'confirm',
    options: {
      enableCompensation: boolean;
      secondRoundMode: 'replace_exam' | 'full_score';
      capPassingScore: boolean;
    },
  ): void;
}>();

const enableAnnualExamCompensation = ref(false);
const secondRoundMode = ref<'replace_exam' | 'full_score'>('replace_exam');
const capPassingScore = ref(true);

const totalStudentsCount = computed(() => {
  if (props.targetClass) {
    return props.targetClass.totalEnrolled || 0;
  }
  if (props.sectionInfo) {
    return props.sectionInfo.total_enrolled || 0;
  }
  return 0;
});

const handleConfirm = () => {
  emit('confirm', {
    enableCompensation: enableAnnualExamCompensation.value,
    secondRoundMode: secondRoundMode.value,
    capPassingScore: capPassingScore.value,
  });
};
</script>
