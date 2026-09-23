<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    title="كشف الدرجات والنتائج الأكاديمية الرسمي"
    :subtitle="transcript ? `${transcript.student_name} • ${transcript.class_name} (${transcript.section_name}) • ${transcript.academic_year_name}` : ''"
    :icon="GraduationCap"
    max-width="max-w-[860px]"
    @close="emit('close')"
  >
    <div v-if="transcript" class="space-y-6 text-bx-text font-sans" dir="rtl">
      <!-- Printable Sheet Wrapper -->
      <div
        id="official-transcript-document"
        class="bg-[var(--bx-surface-solid)] border border-[#B4AED8]/50 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm print:shadow-none print:border-none print:p-0 print:bg-white print:text-black"
      >
        <!-- Ministry & Official School Header -->
        <div class="flex items-center justify-between gap-4 border-b border-[#B4AED8]/40 dark:border-white/[0.08] pb-5">
          <div class="space-y-1">
            <h2 class="text-lg sm:text-xl font-black text-bx-title font-display tracking-tight print:text-black">
              منظومة تقنية لإدارة المدارس والتعليم الأساسي
            </h2>
            <p class="text-xs text-bx-muted font-medium print:text-gray-600">
              إدارة القياس والتقويم الأكاديمي وشؤون الطلاب
            </p>
          </div>

          <div class="flex flex-col items-end gap-1.5 shrink-0">
            <span class="px-3 py-1 rounded-xl bg-bx-primary/10 text-bx-primary border border-bx-primary/20 text-xs font-black print:border-black print:text-black">
              كشف درجات رسمي ومُعتمد
            </span>
            <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 print:text-gray-600">
              <Lock class="w-3 h-3" />
              <span>سجل مؤرشف ومُجمد</span>
            </span>
          </div>
        </div>

        <!-- Student Meta Information Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-[#B4AED8]/30 dark:border-white/[0.04] text-xs">
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">اسم الطالب الرباعي:</span>
            <span class="font-black text-bx-title print:text-black">{{ transcript.student_name }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">كود الطالب:</span>
            <span class="font-bold font-mono text-bx-title print:text-black">{{ transcript.student_code }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">الرقم الوطني / الهوية:</span>
            <span class="font-bold font-mono text-bx-title print:text-black">{{ transcript.national_id || '—' }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">الصف والشعبة:</span>
            <span class="font-bold text-bx-title print:text-black">{{ transcript.class_name }} - {{ transcript.section_name }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">العام الدراسي:</span>
            <span class="font-bold text-bx-title print:text-black">{{ transcript.academic_year_name }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">نوع الصحيفة:</span>
            <span class="font-bold text-bx-primary print:text-black">
              {{ transcript.transcript_type_ar || (transcript.transcript_type === 'annual' ? 'صحيفة سنوية مجمعة' : 'صحيفة فصلية') }}
            </span>
          </div>
        </div>

        <!-- Multi-Term Structured Grading Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black text-bx-title flex items-center gap-1.5 print:text-black">
              <BookOpen class="w-4 h-4 text-bx-primary" />
              <span>جدول رصد درجات المواد والفصول الدراسية:</span>
            </h4>
            <span v-if="isLoadingTranscripts" class="text-[10px] text-bx-muted flex items-center gap-1">
              <Loader2 class="w-3 h-3 animate-spin" />
              <span>جاري تحميل بيانات الفصول...</span>
            </span>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] print:border-black">
            <table class="w-full text-right text-xs border-collapse">
              <thead>
                <!-- Top Header Row -->
                <tr class="bg-black/[0.03] dark:bg-white/[0.03] text-bx-muted font-bold border-b border-[#B4AED8]/40 dark:border-white/[0.08] print:bg-gray-100 print:text-black">
                  <th rowspan="2" class="py-3 px-3 border-l border-[#B4AED8]/30 dark:border-white/[0.06] text-center w-10">#</th>
                  <th rowspan="2" class="py-3 px-4 border-l border-[#B4AED8]/30 dark:border-white/[0.06] min-w-[140px]">المادة الدراسية</th>

                  <!-- Dynamic Term Columns (colspan 2 each) -->
                  <th
                    v-for="term in renderedTerms"
                    :key="term.id"
                    colspan="2"
                    class="py-2.5 px-3 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06] font-black text-bx-title bg-bx-primary/5 print:bg-gray-100 print:text-black"
                  >
                    {{ term.name }}
                  </th>

                  <th rowspan="2" class="py-3 px-3 border-l border-[#B4AED8]/30 dark:border-white/[0.06] text-center">المجموع</th>
                  <th rowspan="2" class="py-3 px-3 border-l border-[#B4AED8]/30 dark:border-white/[0.06] text-center">النهاية الكبرى</th>
                  <th rowspan="2" class="py-3 px-3 text-center">الحالة</th>
                </tr>

                <!-- Sub-Headers Row (Coursework & Exam for each Term) -->
                <tr class="bg-black/[0.02] dark:bg-white/[0.02] text-bx-muted font-semibold text-[11px] border-b border-[#B4AED8]/40 dark:border-white/[0.08] print:bg-gray-50 print:text-black">
                  <template v-for="term in renderedTerms" :key="`sub-${term.id}`">
                    <th class="py-2 px-2 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06]">أعمال السنة</th>
                    <th class="py-2 px-2 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06]">الامتحان النهائي</th>
                  </template>
                </tr>
              </thead>

              <tbody class="divide-y divide-[#B4AED8]/30 dark:divide-white/[0.04]">
                <tr
                  v-for="(subj, sIdx) in processedSubjects"
                  :key="subj.subject_name"
                  class="hover:bg-bx-primary/5 transition-colors print:hover:bg-transparent"
                >
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted border-l border-[#B4AED8]/20 dark:border-white/[0.04]">{{ sIdx + 1 }}</td>
                  <td class="py-2.5 px-4 font-bold text-bx-title border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-black">
                    {{ subj.subject_name }}
                  </td>

                  <!-- Term Scores -->
                  <template v-for="term in renderedTerms" :key="`val-${term.id}`">
                    <td class="py-2 px-2 text-center font-mono border-l border-[#B4AED8]/20 dark:border-white/[0.04] text-bx-title print:text-black">
                      {{ subj.terms[term.id]?.coursework_score !== undefined ? subj.terms[term.id]?.coursework_score : '—' }}
                    </td>
                    <td class="py-2 px-2 text-center font-mono border-l border-[#B4AED8]/20 dark:border-white/[0.04] text-bx-title print:text-black">
                      {{ subj.terms[term.id]?.exam_score !== undefined ? subj.terms[term.id]?.exam_score : '—' }}
                    </td>
                  </template>

                  <!-- Final Totals for Subject -->
                  <td class="py-2.5 px-3 text-center font-bold font-mono text-bx-title border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-black">
                    {{ subj.total_score }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-gray-600">
                    {{ subj.max_score }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      :class="subj.is_passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'"
                    >
                      {{ subj.is_passed ? 'ناجح' : 'راسب' }}
                    </span>
                  </td>
                </tr>
              </tbody>

              <!-- Table Summary Footer -->
              <tfoot>
                <tr class="bg-black/[0.03] dark:bg-white/[0.03] font-bold text-xs border-t-2 border-[#B4AED8] dark:border-white/[0.12] print:bg-gray-100 print:text-black">
                  <td :colspan="2 + (renderedTerms.length * 2)" class="py-3 px-4 text-left font-black text-bx-title print:text-black">
                    المجموع الكلي والنسبة المئوية العامة:
                  </td>
                  <td class="py-3 px-3 text-center font-mono font-black text-bx-title text-sm print:text-black">
                    {{ transcript.total_score }}
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-bx-muted print:text-gray-600">
                    {{ transcript.max_possible_score || totalMaxAllSubjects }}
                  </td>
                  <td class="py-3 px-3 text-center">
                    <span class="font-black font-mono text-bx-primary text-sm print:text-black">
                      {{ transcript.percentage }}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Final Academic Decision Banner -->
        <div
          class="p-4 rounded-2xl border flex items-center justify-between gap-4"
          :class="decisionBannerClass"
        >
          <div class="space-y-0.5">
            <span class="text-[11px] font-bold opacity-80 block">القرار النهائي للجنة الامتحانات والتقويم:</span>
            <span class="text-sm sm:text-base font-black">{{ decisionArabicText }}</span>
          </div>

          <div v-if="transcript.calculated_rank || transcript.rank" class="text-left shrink-0">
            <span class="text-[10px] font-bold opacity-80 block">الترتيب العام:</span>
            <span class="text-sm sm:text-base font-black font-mono">المركز {{ transcript.calculated_rank || transcript.rank }}</span>
          </div>
        </div>

        <!-- Official Signatures & Seal Box -->
        <div class="grid grid-cols-3 gap-4 pt-4 border-t border-[#B4AED8]/30 dark:border-white/[0.06] text-center text-xs text-bx-muted">
          <div class="space-y-6">
            <span class="font-bold text-bx-title block print:text-black">مسؤول شؤون الطلاب</span>
            <span class="block text-bx-muted font-mono">................................</span>
          </div>

          <div class="flex flex-col items-center justify-center">
            <div class="w-20 h-20 rounded-full border-2 border-dashed border-[#B4AED8] dark:border-white/[0.2] flex items-center justify-center p-2 text-center text-[10px] text-bx-muted print:border-black print:text-black">
              <span>ختم المدرسة والاعتماد</span>
            </div>
          </div>

          <div class="space-y-6">
            <span class="font-bold text-bx-title block print:text-black">مدير المدرسة</span>
            <span class="block text-bx-muted font-mono">................................</span>
          </div>
        </div>

        <!-- Sheet Timestamp Footer -->
        <div class="flex items-center justify-between text-[10px] text-bx-muted pt-2 border-t border-[#B4AED8]/20 dark:border-white/[0.04]">
          <span>تاريخ التجميد والإصدار: {{ formatDate(transcript.created_at) }}</span>
          <span class="font-mono">TRN-{{ transcript.id }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-2">
        <button
          type="button"
          class="px-4 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
          @click="emit('close')"
        >
          إغلاق
        </button>

        <button
          type="button"
          class="px-5 py-2.5 rounded-full bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          @click="handlePrint"
        >
          <Printer class="w-4 h-4" />
          <span>طباعة الشهادة الرسمية</span>
        </button>
      </div>
    </div>
  </TaqniyaDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { GraduationCap, BookOpen, Lock, Printer, Loader2 } from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import { promotionApi, type StudentTranscript } from '../../api/promotion.api';

interface Props {
  isOpen: boolean;
  transcript: StudentTranscript | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const studentAllTranscripts = ref<StudentTranscript[]>([]);
const isLoadingTranscripts = ref(false);

interface TermColumn {
  id: string | number;
  name: string;
}

interface ProcessedSubjectItem {
  subject_name: string;
  terms: Record<string | number, { coursework_score?: number; exam_score?: number; total_score?: number }>;
  total_score: number;
  max_score: number;
  is_passed: boolean;
}

// Fetch all transcripts for this student when drawer opens to support multi-term display
watch(
  () => [props.isOpen, props.transcript?.student_id],
  async () => {
    if (!props.isOpen || !props.transcript?.student_id) {
      studentAllTranscripts.value = [];
      return;
    }

    isLoadingTranscripts.value = true;
    try {
      const res = await promotionApi.getStudentTranscripts(props.transcript.student_id);
      if (res.success && Array.isArray(res.data)) {
        // Filter by the same academic year
        studentAllTranscripts.value = res.data.filter(
          (t) => t.academic_year_name === props.transcript?.academic_year_name,
        );
      }
    } catch {
      studentAllTranscripts.value = [];
    } finally {
      isLoadingTranscripts.value = false;
    }
  },
  { immediate: true },
);

// Determine the terms to render as broad super-columns
const renderedTerms = computed<TermColumn[]>(() => {
  // If we have multiple term transcripts for this student in this academic year
  const termTranscripts = studentAllTranscripts.value.filter((t) => t.transcript_type === 'term');
  if (termTranscripts.length > 1) {
    return termTranscripts.map((t, idx) => ({
      id: t.academic_term_id || t.id || `term_${idx + 1}`,
      name: t.transcript_type_ar || t.transcript_data?.term_name || `الفصل الدراسي ${idx + 1}`,
    }));
  }

  // If transcript itself has terms array in transcript_data
  const rawData = props.transcript?.transcript_data;
  if (rawData?.terms && Array.isArray(rawData.terms) && rawData.terms.length > 0) {
    return rawData.terms.map((t: any, idx: number) => ({
      id: t.id || `term_${idx + 1}`,
      name: t.term_name || t.name || `الفصل الدراسي ${idx + 1}`,
    }));
  }

  // Single term fallback
  const termName =
    props.transcript?.transcript_type_ar ||
    rawData?.term_name ||
    (props.transcript?.transcript_type === 'annual' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي');

  return [
    {
      id: 'primary_term',
      name: termName,
    },
  ];
});

// Process all subjects across terms
const processedSubjects = computed<ProcessedSubjectItem[]>(() => {
  if (!props.transcript) return [];

  const rawData = props.transcript.transcript_data;
  const directSubjects: any[] = rawData?.subjects || rawData?.subject_scores || [];

  const termTranscripts = studentAllTranscripts.value.filter((t) => t.transcript_type === 'term');

  // If we have multiple term transcripts, merge subjects across terms
  if (termTranscripts.length > 1) {
    const subjectMap = new Map<string, ProcessedSubjectItem>();

    for (const tt of termTranscripts) {
      const termId = tt.academic_term_id || tt.id;
      const ttSubjects: any[] = tt.transcript_data?.subjects || tt.transcript_data?.subject_scores || [];

      for (const s of ttSubjects) {
        const name = s.subject_name;
        if (!subjectMap.has(name)) {
          subjectMap.set(name, {
            subject_name: name,
            terms: {},
            total_score: 0,
            max_score: Number(s.max_score) || 100,
            is_passed: true,
          });
        }

        const item = subjectMap.get(name)!;
        const cScore = Number(s.coursework_score) || 0;
        const eScore = Number(s.exam_score) || 0;
        const tScore = Number(s.total_score) || (cScore + eScore);

        item.terms[termId] = {
          coursework_score: cScore,
          exam_score: eScore,
          total_score: tScore,
        };
      }
    }

    // Calculate aggregated total score and passing status
    return Array.from(subjectMap.values()).map((item) => {
      let sum = 0;
      for (const tVal of Object.values(item.terms)) {
        sum += tVal.total_score || 0;
      }
      const finalScore = Number((sum / termTranscripts.length).toFixed(1));
      const passingScore = item.max_score * 0.5;

      return {
        ...item,
        total_score: finalScore,
        is_passed: finalScore >= passingScore,
      };
    });
  }

  // Single Term or direct subjects
  return directSubjects.map((s) => {
    const termId = renderedTerms.value[0]?.id || 'primary_term';
    const cScore = s.coursework_score !== undefined ? Number(s.coursework_score) : undefined;
    const eScore = s.exam_score !== undefined ? Number(s.exam_score) : undefined;
    const tScore = Number(s.total_score) || ((cScore || 0) + (eScore || 0));
    const maxScore = Number(s.max_score) || 100;
    const passingScore = Number(s.passing_score) || maxScore * 0.5;

    return {
      subject_name: s.subject_name,
      terms: {
        [termId]: {
          coursework_score: cScore,
          exam_score: eScore,
          total_score: tScore,
        },
      },
      total_score: tScore,
      max_score: maxScore,
      is_passed: tScore >= passingScore,
    };
  });
});

const totalMaxAllSubjects = computed(() => {
  return processedSubjects.value.reduce((sum, s) => sum + s.max_score, 0);
});

const decisionArabicText = computed(() => {
  const status = props.transcript?.final_status;
  switch (status) {
    case 'passed':
      return 'ناجح ومرحل إلى الصف التالي';
    case 'second_round':
      return 'له حق دخول امتحانات الدور الثاني';
    case 'failed':
      return 'باقٍ للإعادة في نفس الصف الدراسي';
    case 'graduated':
      return 'ناجح ومتخرج رسمياً من المرحلة';
    default:
      return status || '—';
  }
});

const decisionBannerClass = computed(() => {
  const status = props.transcript?.final_status;
  switch (status) {
    case 'passed':
    case 'graduated':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'second_round':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'failed':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
    default:
      return 'bg-bx-surface-2 text-bx-title border-bx-border';
  }
});

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const handlePrint = () => {
  window.print();
};
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden !important;
  }
  #official-transcript-document,
  #official-transcript-document * {
    visibility: visible !important;
  }
  #official-transcript-document {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    background: white !important;
    color: black !important;
  }
}
</style>
