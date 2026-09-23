<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="`رصد درجات الطالب: ${student?.student_name || ''}`"
    :subtitle="`كود الطالب: ${student?.student_code || '—'} • رقم الجلوس: ${student?.seating_number || 'غير محدد'} • ${sectionInfo?.class_name || ''} (${sectionInfo?.section_name || ''})`"
    :icon="GraduationCap"
    max-width="max-w-[750px]"
    @close="emit('close')"
  >
    <div v-if="student" class="space-y-6" dir="rtl">
      <!-- Validation Error Alert Banner -->
      <div
        v-if="validationErrors.length > 0"
        class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-xs animate-pulse"
      >
        <AlertTriangle class="w-4 h-4 shrink-0 text-rose-500" />
        <div class="flex-1">
          <span class="font-bold block">تنبيه: توجد درجات غير صالحة تتجاوز النهاية العظمى!</span>
          <span class="text-[11px] opacity-90">يرجى تصحيح الدرجات المظللة باللون الأحمر قبل اعتماد الصحيفة.</span>
        </div>
      </div>

      <!-- Live Calculation Summary Banner -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl p-4 shadow-xs">
        <div>
          <span class="text-[11px] font-bold text-bx-muted block">المجموع الكلي:</span>
          <span class="text-base font-black text-bx-title font-mono">{{ totalScore }} / {{ totalMaxScore }}</span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-bx-muted block">النسبة المئوية:</span>
          <span
            class="text-base font-black font-mono"
            :class="percentage > 100 ? 'text-rose-600' : 'text-bx-primary'"
          >
            {{ percentage }}%
          </span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-bx-muted block">مواد الرسوب:</span>
          <span class="text-base font-black font-mono" :class="failedSubjectsCount > 0 ? 'text-rose-600' : 'text-emerald-600'">
            {{ failedSubjectsCount }}
          </span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-bx-muted block">القرار الأكاديمي:</span>
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-0.5" :class="decisionBadgeClass">
            {{ decisionLabel }}
          </span>
        </div>
      </div>

      <!-- Subjects Grading Table -->
      <div class="space-y-2">
        <h4 class="text-xs font-black text-bx-title flex items-center gap-1.5">
          <BookOpen class="w-4 h-4 text-bx-primary" />
          <span>جدول رصد درجات المواد الدراسية:</span>
        </h4>
        <div class="overflow-x-auto rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.08] bg-[var(--bx-surface-solid)]">
          <table class="w-full text-right text-xs border-collapse">
            <thead>
              <tr class="bg-black/[0.02] dark:bg-white/[0.02] text-bx-muted font-bold border-b border-[#B4AED8]/30 dark:border-white/[0.06]">
                <th class="py-3 px-3">المادة الدراسية</th>
                <th class="py-3 px-3 text-center">أعمال السنة</th>
                <th class="py-3 px-3 text-center">الامتحان النهائي</th>
                <th class="py-3 px-3 text-center">المجموع</th>
                <th class="py-3 px-3 text-center">النهاية الكبرى</th>
                <th class="py-3 px-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#B4AED8]/30 dark:divide-white/[0.04]">
              <tr
                v-for="subj in gradeRows"
                :key="subj.subject_id"
                class="hover:bg-bx-primary/5 transition-colors"
                :class="isRowInvalid(subj) ? 'bg-rose-500/[0.03]' : ''"
              >
                <td class="py-2.5 px-3 font-bold text-bx-title">
                  {{ subj.subject_name }}
                  <span class="block text-[10px] text-bx-muted font-normal">درجة النجاح: {{ subj.passing_score }}</span>
                </td>

                <!-- Coursework input -->
                <td class="py-2 px-3 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <div class="inline-flex items-center gap-1">
                      <input
                        v-model.number="subj.coursework_score"
                        type="number"
                        min="0"
                        :max="subj.max_coursework_score"
                        step="0.5"
                        class="w-16 bg-[var(--bx-surface-solid)] border rounded-lg p-1.5 text-center font-mono font-bold text-xs outline-none transition-all"
                        :class="
                          isCourseworkInvalid(subj)
                            ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30'
                            : 'border-[#B4AED8] dark:border-white/[0.12] focus:border-bx-primary'
                        "
                      />
                      <span class="text-[10px] text-bx-muted">/ {{ subj.max_coursework_score }}</span>
                    </div>
                    <span v-if="isCourseworkInvalid(subj)" class="text-[9px] text-rose-600 font-bold">
                      تجاوزت {{ subj.max_coursework_score }}!
                    </span>
                  </div>
                </td>

                <!-- Exam input -->
                <td class="py-2 px-3 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <div class="inline-flex items-center gap-1">
                      <input
                        v-model.number="subj.exam_score"
                        type="number"
                        min="0"
                        :max="subj.max_exam_score"
                        step="0.5"
                        class="w-16 bg-[var(--bx-surface-solid)] border rounded-lg p-1.5 text-center font-mono font-bold text-xs outline-none transition-all"
                        :class="
                          isExamInvalid(subj)
                            ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30'
                            : 'border-[#B4AED8] dark:border-white/[0.12] focus:border-bx-primary'
                        "
                      />
                      <span class="text-[10px] text-bx-muted">/ {{ subj.max_exam_score }}</span>
                    </div>
                    <span v-if="isExamInvalid(subj)" class="text-[9px] text-rose-600 font-bold">
                      تجاوزت {{ subj.max_exam_score }}!
                    </span>
                  </div>
                </td>

                <!-- Calculated Total for Subject -->
                <td class="py-2 px-3 text-center font-mono font-bold text-xs" :class="isRowInvalid(subj) ? 'text-rose-600 font-black' : 'text-bx-title'">
                  {{ (Number(subj.coursework_score) || 0) + (Number(subj.exam_score) || 0) }}
                </td>

                <!-- Max Score -->
                <td class="py-2 px-3 text-center font-mono text-xs text-bx-muted">
                  {{ subj.max_score }}
                </td>

                <!-- Subject Status -->
                <td class="py-2 px-3 text-center">
                  <span
                    v-if="isRowInvalid(subj)"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300"
                  >
                    غير صالح ❌
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="isSubjectPassed(subj) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'"
                  >
                    {{ isSubjectPassed(subj) ? 'ناجح' : 'راسب' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          class="px-6 py-2.5 rounded-full bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="isSubmitting || validationErrors.length > 0"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ isSubmitting ? 'جاري حفظ الصحيفة...' : 'اعتماد وتجميد صحيفة الدرجات' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { GraduationCap, BookOpen, Save, Loader2, AlertTriangle } from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import type { StudentRosterItem, ClassSubjectRosterItem } from '../../api/grade-entry.api';
import type { FreezeTranscriptDto } from '../../api/promotion.api';

interface Props {
  isOpen: boolean;
  student: StudentRosterItem | null;
  subjects: ClassSubjectRosterItem[];
  sectionInfo: any;
  academicYearName: string;
  classAcademicTermId?: number;
  termName?: string;
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  student: null,
  subjects: () => [],
  sectionInfo: null,
  academicYearName: '2024/2025',
  isSubmitting: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: FreezeTranscriptDto): void;
}>();

interface GradeRow {
  subject_id: number;
  subject_name: string;
  passing_score: number;
  max_score: number;
  max_coursework_score: number;
  max_exam_score: number;
  coursework_score: number;
  exam_score: number;
}

const gradeRows = ref<GradeRow[]>([]);

watch(
  () => [props.student, props.subjects, props.isOpen],
  () => {
    if (!props.isOpen || !props.student) return;

    // Check if existing transcript data is present
    const existingData = props.student.transcript?.transcript_data;
    const existingSubjects: any[] = existingData?.subjects || existingData?.subject_scores || [];

    gradeRows.value = props.subjects.map((s) => {
      const existing = existingSubjects.find(
        (es) => es.subject_name === s.subject_name || Number(es.subject_id) === s.subject_id,
      );

      const maxScore = Number(s.max_score) || 100;
      const maxCoursework = s.max_coursework_score || Number((maxScore * 0.4).toFixed(0));
      const maxExam = s.max_exam_score || Number((maxScore * 0.6).toFixed(0));

      return {
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        passing_score: Number(s.passing_score) || 50,
        max_score: maxScore,
        max_coursework_score: maxCoursework,
        max_exam_score: maxExam,
        coursework_score: existing ? Number(existing.coursework_score) || 0 : 0,
        exam_score: existing ? Number(existing.exam_score) || 0 : 0,
      };
    });
  },
  { immediate: true },
);

const isCourseworkInvalid = (subj: GradeRow): boolean => {
  const score = Number(subj.coursework_score);
  return isNaN(score) || score < 0 || score > subj.max_coursework_score;
};

const isExamInvalid = (subj: GradeRow): boolean => {
  const score = Number(subj.exam_score);
  return isNaN(score) || score < 0 || score > subj.max_exam_score;
};

const isRowInvalid = (subj: GradeRow): boolean => {
  return isCourseworkInvalid(subj) || isExamInvalid(subj);
};

const validationErrors = computed(() => {
  return gradeRows.value.filter((r) => isRowInvalid(r));
});

const isSubjectPassed = (subj: GradeRow) => {
  const total = (Number(subj.coursework_score) || 0) + (Number(subj.exam_score) || 0);
  return total >= subj.passing_score;
};

const totalScore = computed(() => {
  return gradeRows.value.reduce(
    (sum, r) => sum + (Number(r.coursework_score) || 0) + (Number(r.exam_score) || 0),
    0,
  );
});

const totalMaxScore = computed(() => {
  return gradeRows.value.reduce((sum, r) => sum + (Number(r.max_score) || 100), 0);
});

const percentage = computed(() => {
  if (totalMaxScore.value === 0) return 0;
  return Number(((totalScore.value / totalMaxScore.value) * 100).toFixed(2));
});

const failedSubjectsCount = computed(() => {
  return gradeRows.value.filter((r) => !isSubjectPassed(r)).length;
});

const decisionStatus = computed<'passed' | 'second_round' | 'failed' | 'graduated'>(() => {
  if (failedSubjectsCount.value === 0 && percentage.value >= 50) {
    return props.sectionInfo?.grade_level >= 12 ? 'graduated' : 'passed';
  }
  if (failedSubjectsCount.value <= 2) {
    return 'second_round';
  }
  return 'failed';
});

const decisionLabel = computed(() => {
  switch (decisionStatus.value) {
    case 'passed':
      return 'ناجح ومرحل';
    case 'second_round':
      return 'دور ثان';
    case 'failed':
      return 'باقٍ للإعادة';
    case 'graduated':
      return 'متخرج';
  }
});

const decisionBadgeClass = computed(() => {
  switch (decisionStatus.value) {
    case 'passed':
    case 'graduated':
      return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    case 'second_round':
      return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    case 'failed':
      return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
  }
});

const handleSubmit = () => {
  if (!props.student) return;

  const subjectsPayload = gradeRows.value.map((r) => ({
    subject_id: r.subject_id,
    subject_name: r.subject_name,
    coursework_score: Number(r.coursework_score) || 0,
    max_coursework_score: r.max_coursework_score,
    exam_score: Number(r.exam_score) || 0,
    max_exam_score: r.max_exam_score,
    total_score: (Number(r.coursework_score) || 0) + (Number(r.exam_score) || 0),
    passing_score: r.passing_score,
    max_score: r.max_score,
    status: isSubjectPassed(r) ? 'passed' : 'failed',
    second_round_details: null,
  }));

  const transcriptData = {
    term_name: props.termName || 'الفصل الدراسي',
    student_id: props.student.student_id,
    student_name: props.student.student_name,
    student_code: props.student.student_code,
    class_name: props.sectionInfo?.class_name,
    section_name: props.sectionInfo?.section_name,
    academic_year_name: props.academicYearName,
    subjects: subjectsPayload,
    total_score: totalScore.value,
    max_possible_score: totalMaxScore.value,
    percentage: percentage.value,
    final_status: decisionStatus.value,
    frozen_at: new Date().toISOString(),
  };

  const payload: FreezeTranscriptDto = {
    student_id: Number(props.student.student_id),
    class_academic_term_id: props.classAcademicTermId ? Number(props.classAcademicTermId) : undefined,
    academic_year_name: props.academicYearName,
    class_name: props.sectionInfo?.class_name || '',
    section_name: props.sectionInfo?.section_name || '',
    grade_level: Number(props.sectionInfo?.grade_level) || 1,
    transcript_type: props.classAcademicTermId ? 'term' : 'annual',
    total_score: totalScore.value,
    percentage: percentage.value,
    final_status: decisionStatus.value,
    transcript_data: transcriptData,
  };

  emit('save', payload);
};
</script>
