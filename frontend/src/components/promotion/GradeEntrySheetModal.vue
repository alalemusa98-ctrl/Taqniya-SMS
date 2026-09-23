<template>
  <TaqniyaModal
    :is-open="isOpen"
    :title="'إدخال وتعديل درجات وتجميد الكشف رسمياً'"
    maxWidth="2xl"
    @close="$emit('close')"
  >
    <div class="grade-entry-modal-content">
      <!-- Student Banner -->
      <div v-if="studentData" class="student-info-strip">
        <div class="info-block">
          <span class="label">الطالب:</span>
          <span class="val font-bold">{{ studentData.student_name }}</span>
        </div>
        <div class="info-block">
          <span class="label">كود الطالب:</span>
          <span class="val font-mono">{{ studentData.student_code }}</span>
        </div>
        <div class="info-block">
          <span class="label">الصف / الشعبة:</span>
          <span class="val">{{ studentData.class_name }} - {{ studentData.section_name }}</span>
        </div>
      </div>

      <!-- Live Calculation Bar -->
      <div class="live-calc-bar">
        <div class="calc-card">
          <span class="calc-label">المجموع الكلي</span>
          <span class="calc-value font-mono">{{ calculatedTotal }} / {{ calculatedMaxTotal }}</span>
        </div>
        <div class="calc-card">
          <span class="calc-label">النسبة المئوية</span>
          <span class="calc-value font-mono" :class="percentageColorClass">{{ calculatedPercentage }}%</span>
        </div>
        <div class="calc-card">
          <span class="calc-label">الحالة المحسوبة</span>
          <span class="calc-status-badge" :class="statusBadgeClass">
            {{ calculatedStatusText }}
          </span>
        </div>
      </div>

      <!-- Subject Score Inputs Grid -->
      <div class="scores-entry-table-wrap">
        <table class="scores-entry-table">
          <thead>
            <tr>
              <th>المادة الدراسية</th>
              <th>أعمال السنة (Coursework)</th>
              <th>الامتحان النهائي (Exam)</th>
              <th>مجموع المادة</th>
              <th>النهاية العظمى</th>
              <th>التقدير</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(subject, idx) in subjectsList" :key="idx">
              <td class="font-semibold">{{ subject.subject_name }}</td>
              <td>
                <input
                  v-model.number="subject.coursework_score"
                  type="number"
                  min="0"
                  max="50"
                  class="score-input"
                  @input="recalculate"
                />
              </td>
              <td>
                <input
                  v-model.number="subject.exam_score"
                  type="number"
                  min="0"
                  max="50"
                  class="score-input"
                  @input="recalculate"
                />
              </td>
              <td class="font-bold text-center">
                {{ (subject.coursework_score || 0) + (subject.exam_score || 0) }}
              </td>
              <td class="text-center text-muted">{{ subject.max_score || 100 }}</td>
              <td class="text-center font-semibold">
                {{ getSubjectGrade((subject.coursework_score || 0) + (subject.exam_score || 0), subject.max_score || 100) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Warning & Freeze Confirmation -->
      <div class="freeze-warning-box">
        <span class="warn-icon">🔒</span>
        <div class="warn-text">
          <strong>تنبيه تجميد الكشف الأكاديمي (Transcript Freezing):</strong>
          <p>
            تجميد الكشف يؤدي إلى حفظ لقطة غير قابلة للتعديل (Immutable Snapshot). لن تتمكن من تعديل هذه الدرجات لاحقاً إلا بطلب إعادة فتح استثنائي من مدير النظام.
          </p>
        </div>
      </div>

      <!-- Modal Footer Actions -->
      <div class="modal-footer-actions">
        <button
          type="button"
          class="btn-freeze-submit"
          :disabled="isSubmitting"
          @click="handleFreezeSubmit"
        >
          <span v-if="isSubmitting">جاري التجميد والحفظ...</span>
          <span v-else>🔒 تجميد الكشف الأكاديمي رسمياً</span>
        </button>
        <button type="button" class="btn-cancel" @click="$emit('close')">
          إلغاء
        </button>
      </div>
    </div>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import type { StudentTranscript, FreezeTranscriptDto } from '../../api/promotion.api';

interface SubjectEntry {
  subject_name: string;
  coursework_score: number;
  exam_score: number;
  max_score: number;
}

interface Props {
  isOpen: boolean;
  studentData: StudentTranscript | null;
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit-freeze', payload: FreezeTranscriptDto): void;
}>();

const defaultSubjects: SubjectEntry[] = [
  { subject_name: 'القرآن الكريم والتربية الإسلامية', coursework_score: 38, exam_score: 45, max_score: 100 },
  { subject_name: 'اللغة العربية وفروعها', coursework_score: 35, exam_score: 42, max_score: 100 },
  { subject_name: 'الرياضيات', coursework_score: 32, exam_score: 40, max_score: 100 },
  { subject_name: 'العلوم العامة', coursework_score: 36, exam_score: 44, max_score: 100 },
  { subject_name: 'اللغة الإنجليزية', coursework_score: 34, exam_score: 41, max_score: 100 },
  { subject_name: 'التربية الوطنية والدراسات الاجتماعية', coursework_score: 39, exam_score: 46, max_score: 100 },
];

const subjectsList = ref<SubjectEntry[]>([]);

watch(
  () => props.studentData,
  (val) => {
    if (val && val.transcript_data) {
      const raw = val.transcript_data.subjects || val.transcript_data.subject_scores;
      if (Array.isArray(raw) && raw.length > 0) {
        subjectsList.value = raw.map((s: any) => ({
          subject_name: s.subject_name || s.name,
          coursework_score: s.coursework_score || 35,
          exam_score: s.exam_score || 40,
          max_score: s.max_score || 100,
        }));
        return;
      }
    }
    subjectsList.value = JSON.parse(JSON.stringify(defaultSubjects));
  },
  { immediate: true }
);

const calculatedTotal = computed(() => {
  return subjectsList.value.reduce(
    (sum, s) => sum + (Number(s.coursework_score) || 0) + (Number(s.exam_score) || 0),
    0
  );
});

const calculatedMaxTotal = computed(() => {
  return subjectsList.value.reduce((sum, s) => sum + (Number(s.max_score) || 100), 0);
});

const calculatedPercentage = computed(() => {
  if (calculatedMaxTotal.value === 0) return 0;
  return Number(((calculatedTotal.value / calculatedMaxTotal.value) * 100).toFixed(2));
});

const calculatedFinalStatus = computed<'passed' | 'second_round' | 'retained'>(() => {
  const p = calculatedPercentage.value;
  // Check if any subject is failed below 50%
  const failedSubjects = subjectsList.value.filter(
    (s) => ((Number(s.coursework_score) || 0) + (Number(s.exam_score) || 0)) < (s.max_score * 0.5)
  );

  if (failedSubjects.length === 0 && p >= 50) return 'passed';
  if (failedSubjects.length <= 2) return 'second_round';
  return 'retained';
});

const calculatedStatusText = computed(() => {
  switch (calculatedFinalStatus.value) {
    case 'passed':
      return 'ناجح ومنقول';
    case 'second_round':
      return 'دور ثان';
    case 'retained':
      return 'راسب / باق للإعادة';
  }
});

const statusBadgeClass = computed(() => {
  switch (calculatedFinalStatus.value) {
    case 'passed':
      return 'badge-passed';
    case 'second_round':
      return 'badge-second-round';
    case 'retained':
      return 'badge-retained';
  }
});

const percentageColorClass = computed(() => {
  const p = calculatedPercentage.value;
  if (p >= 80) return 'text-success';
  if (p >= 60) return 'text-warning';
  return 'text-danger';
});

const getSubjectGrade = (score: number, max: number) => {
  const p = (score / max) * 100;
  if (p >= 85) return 'ممتاز';
  if (p >= 75) return 'جيد جداً';
  if (p >= 65) return 'جيد';
  if (p >= 50) return 'مقبول';
  return 'راسب';
};

const recalculate = () => {
  // Triggers reactivity
};

const handleFreezeSubmit = () => {
  if (!props.studentData) return;

  const payload: FreezeTranscriptDto = {
    student_id: props.studentData.student_id,
    academic_term_id: props.studentData.academic_term_id || undefined,
    academic_year_name: props.studentData.academic_year_name || '2024-2025',
    transcript_type: props.studentData.transcript_type || 'final_year',
    total_score: calculatedTotal.value,
    max_possible_score: calculatedMaxTotal.value,
    percentage: calculatedPercentage.value,
    final_status: calculatedFinalStatus.value,
    transcript_data: {
      student_id: props.studentData.student_id,
      student_name: props.studentData.student_name,
      student_code: props.studentData.student_code,
      class_name: props.studentData.class_name,
      section_name: props.studentData.section_name,
      academic_year_name: props.studentData.academic_year_name,
      subjects: subjectsList.value.map((s) => ({
        subject_name: s.subject_name,
        coursework_score: Number(s.coursework_score) || 0,
        exam_score: Number(s.exam_score) || 0,
        total_score: (Number(s.coursework_score) || 0) + (Number(s.exam_score) || 0),
        max_score: s.max_score || 100,
        grade_label: getSubjectGrade(
          (Number(s.coursework_score) || 0) + (Number(s.exam_score) || 0),
          s.max_score || 100
        ),
      })),
      total_score: calculatedTotal.value,
      max_possible_score: calculatedMaxTotal.value,
      percentage: calculatedPercentage.value,
      final_status: calculatedFinalStatus.value,
      frozen_at: new Date().toISOString(),
    },
  };

  emit('submit-freeze', payload);
};
</script>

<style scoped>
.grade-entry-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.student-info-strip {
  display: flex;
  justify-content: space-between;
  background: var(--color-gray-50, #f8fafc);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-gray-200, #e2e8f0);
}

.info-block {
  display: flex;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.info-block .label {
  color: #64748b;
}

.live-calc-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.calc-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.calc-label {
  font-size: 0.75rem;
  color: #64748b;
}

.calc-value {
  font-size: 1.15rem;
  font-weight: 800;
}

.calc-status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge-passed {
  background: #d1fae5;
  color: #065f46;
}

.badge-second-round {
  background: #fef3c7;
  color: #92400e;
}

.badge-retained {
  background: #fee2e2;
  color: #991b1b;
}

.text-success {
  color: #059669;
}

.text-warning {
  color: #d97706;
}

.text-danger {
  color: #dc2626;
}

.scores-entry-table-wrap {
  overflow-x: auto;
}

.scores-entry-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  font-size: 0.85rem;
}

.scores-entry-table th {
  background: #f1f5f9;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-weight: 600;
}

.scores-entry-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
}

.score-input {
  width: 70px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  text-align: center;
  font-weight: 700;
  outline: none;
  font-size: 0.9rem;
}

.score-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.freeze-warning-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 0.85rem 1rem;
}

.warn-icon {
  font-size: 1.25rem;
}

.warn-text strong {
  color: #92400e;
  font-size: 0.85rem;
}

.warn-text p {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.4;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-freeze-submit {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1.4rem;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-freeze-submit:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transform: translateY(-1px);
}

.btn-freeze-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  padding: 0.65rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
