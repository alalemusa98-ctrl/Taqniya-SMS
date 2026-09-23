<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="'كشف الدرجات والنتائج الأكاديمية الرسمي'"
    maxWidth="max-w-[750px]"
    @close="$emit('close')"
  >
    <div v-if="transcript" class="transcript-drawer-body">
      <!-- Printable Document Wrapper -->
      <div id="official-transcript-document" class="official-transcript-sheet">
        <!-- Ministry / School Header -->
        <div class="sheet-header">
          <div class="school-brand">
            <h2 class="school-name">منظومة تقنية لإدارة المدارس والتعليم الأساسي</h2>
            <span class="sub-header">إدارة القياس والتقويم الأكاديمي وشؤون الطلاب</span>
          </div>
          <div class="header-badge">
            <span class="cert-title">كشف درجات رسمي ومُعتمد</span>
            <span class="freeze-tag">سجل مؤرشف ومُجمد 🔒</span>
          </div>
        </div>

        <div class="divider-line"></div>

        <!-- Student Meta Information Grid -->
        <div class="student-meta-grid">
          <div class="meta-item">
            <span class="meta-label">اسم الطالب الرباعي:</span>
            <span class="meta-val highlight">{{ transcript.student_name }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">كود الطالب:</span>
            <span class="meta-val font-mono">{{ transcript.student_code }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">الرقم الوطني:</span>
            <span class="meta-val font-mono">{{ transcript.national_id || '—' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">الصف الدراسي والشعبة:</span>
            <span class="meta-val">{{ transcript.class_name }} - {{ transcript.section_name }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">العام الدراسي:</span>
            <span class="meta-val">{{ transcript.academic_year_name }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">نوع الكشف / الفصل:</span>
            <span class="meta-val">{{ transcript.transcript_type_ar || transcript.academic_term_name || (transcript.transcript_type === 'annual' ? 'نهاية العام الدراسي' : 'فصلي') }}</span>
          </div>
        </div>

        <!-- Subject Scores Table -->
        <div class="scores-table-wrap">
          <table class="scores-table">
            <thead>
              <tr>
                <th class="th-num">#</th>
                <th>المادة الدراسية</th>
                <th class="th-center">أعمال السنة</th>
                <th class="th-center">الامتحان النهائي</th>
                <th class="th-center">المجموع الكلي</th>
                <th class="th-center">النهاية العظمى</th>
                <th class="th-center">التقدير العام</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(subj, sIdx) in subjectRows" :key="sIdx">
                <td class="td-num">{{ sIdx + 1 }}</td>
                <td class="td-subject-name font-semibold">{{ subj.subject_name }}</td>
                <td class="td-center">{{ subj.coursework_score ?? '—' }}</td>
                <td class="td-center">{{ subj.exam_score ?? '—' }}</td>
                <td class="td-center font-bold">{{ subj.total_score }}</td>
                <td class="td-center text-muted">{{ subj.max_score || 100 }}</td>
                <td class="td-center">
                  <span class="grade-pill" :class="getGradePillClass(subj.grade_label)">
                    {{ subj.grade_label || getAutoGrade(subj.total_score, subj.max_score || 100) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="tfoot-summary">
                <td colspan="4" class="tfoot-label">المجموع الكلي والمعدل العام:</td>
                <td class="td-center font-bold text-lg">{{ transcript.total_score }}</td>
                <td class="td-center text-muted">{{ transcript.max_possible_score }}</td>
                <td class="td-center">
                  <span class="final-percentage">{{ transcript.percentage }}%</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Final Decision Banner -->
        <div class="final-decision-banner" :class="getFinalDecisionClass(transcript.final_status)">
          <div class="decision-status">
            <span class="decision-label">القرار النهائي للجنة الامتحانات:</span>
            <span class="decision-val">{{ getFinalStatusArabic(transcript.final_status) }}</span>
          </div>
          <div class="rank-status" v-if="transcript.calculated_rank">
            <span class="decision-label">الترتيب العام على مستوى الصف:</span>
            <span class="rank-highlight">المركز {{ transcript.calculated_rank }}</span>
          </div>
        </div>

        <!-- Official Signatures & QR Block -->
        <div class="signatures-block">
          <div class="signature-col">
            <span class="sig-title">مسؤول شؤون الطلاب</span>
            <span class="sig-line">................................</span>
          </div>
          <div class="signature-col seal-col">
            <div class="official-seal-box">
              <span>ختم المدرسة والاعتماد الرسمي</span>
            </div>
          </div>
          <div class="signature-col">
            <span class="sig-title">مدير المدرسة</span>
            <span class="sig-line">................................</span>
          </div>
        </div>

        <div class="sheet-footer">
          <span>تاريخ إصدار وتجميد السجل: {{ formatDate(transcript.created_at) }}</span>
          <span>معرف السجل الإلكتروني: TRN-{{ transcript.id }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="drawer-actions">
        <button type="button" class="btn-primary" @click="handlePrint">
          🖨️ طباعة الشهادة الرسمية
        </button>
        <button type="button" class="btn-secondary" @click="$emit('close')">
          إغلاق
        </button>
      </div>
    </div>
  </TaqniyaDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import type { StudentTranscript } from '../../api/promotion.api';

interface Props {
  isOpen: boolean;
  transcript: StudentTranscript | null;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'close'): void;
}>();

interface SubjectRow {
  subject_name: string;
  coursework_score?: number;
  exam_score?: number;
  total_score: number;
  max_score?: number;
  grade_label?: string;
}

const subjectRows = computed<SubjectRow[]>(() => {
  if (!props.transcript) return [];
  const raw = props.transcript.transcript_data;
  if (!raw) return [];

  if (Array.isArray(raw.subjects)) {
    return raw.subjects;
  }
  if (Array.isArray(raw.subject_scores)) {
    return raw.subject_scores;
  }
  return [];
});

const getAutoGrade = (score: number, max: number) => {
  const p = (score / max) * 100;
  if (p >= 85) return 'ممتاز';
  if (p >= 75) return 'جيد جداً';
  if (p >= 65) return 'جيد';
  if (p >= 50) return 'مقبول';
  return 'راسب / دور ثان';
};

const getGradePillClass = (grade?: string) => {
  if (!grade) return '';
  if (grade.includes('ممتاز')) return 'pill-excellent';
  if (grade.includes('جيد')) return 'pill-good';
  if (grade.includes('مقبول')) return 'pill-pass';
  return 'pill-fail';
};

const getFinalDecisionClass = (status: string) => {
  if (status === 'passed') return 'decision-passed';
  if (status === 'second_round') return 'decision-second-round';
  if (status === 'graduated') return 'decision-passed';
  return 'decision-retained';
};

const getFinalStatusArabic = (status: string) => {
  if (status === 'passed') return 'ناجح وينقل إلى الصف التالي';
  if (status === 'second_round') return 'له حق دخول امتحانات الدور الثاني';
  if (status === 'retained' || status === 'failed') return 'باق للإعادة في نفس الصف الدراسي';
  if (status === 'graduated') return 'متخرج';
  return status;
};

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
.transcript-drawer-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.official-transcript-sheet {
  background: white;
  border: 2px solid #0f172a;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: #0f172a;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}

.sub-header {
  font-size: 0.85rem;
  color: #64748b;
}

.header-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.cert-title {
  background: #0f172a;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
}

.freeze-tag {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 600;
}

.divider-line {
  height: 2px;
  background: #e2e8f0;
}

.student-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1.5rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.meta-label {
  color: #64748b;
  font-weight: 600;
}

.meta-val {
  font-weight: 700;
  color: #1e293b;
}

.meta-val.highlight {
  color: #4f46e5;
  font-size: 0.95rem;
}

.scores-table-wrap {
  overflow-x: auto;
}

.scores-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  font-size: 0.85rem;
}

.scores-table th {
  background: #f1f5f9;
  color: #334155;
  font-weight: 700;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
}

.scores-table td {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
}

.th-num,
.td-num {
  text-align: center;
  width: 40px;
}

.th-center,
.td-center {
  text-align: center;
}

.grade-pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
}

.grade-pill.pill-excellent {
  background: #d1fae5;
  color: #065f46;
}

.grade-pill.pill-good {
  background: #dbeafe;
  color: #1e40af;
}

.grade-pill.pill-pass {
  background: #fef3c7;
  color: #92400e;
}

.grade-pill.pill-fail {
  background: #fee2e2;
  color: #991b1b;
}

.tfoot-summary td {
  background: #f8fafc;
  border-top: 2px solid #0f172a;
}

.tfoot-label {
  font-weight: 800;
  text-align: left;
}

.final-percentage {
  font-weight: 800;
  color: #4f46e5;
  font-size: 1rem;
}

.final-decision-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border: 1.5px solid;
}

.final-decision-banner.decision-passed {
  background: #ecfdf5;
  border-color: #10b981;
  color: #065f46;
}

.final-decision-banner.decision-second-round {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #92400e;
}

.final-decision-banner.decision-retained {
  background: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
}

.decision-val {
  font-size: 1rem;
  font-weight: 800;
  margin-right: 0.5rem;
}

.rank-highlight {
  font-size: 1rem;
  font-weight: 800;
  margin-right: 0.5rem;
  color: #4f46e5;
}

.signatures-block {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
  text-align: center;
}

.signature-col {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.sig-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
}

.sig-line {
  color: #94a3b8;
}

.official-seal-box {
  width: 110px;
  height: 110px;
  border: 2px dashed #94a3b8;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  font-size: 0.7rem;
  color: #94a3b8;
  text-align: center;
}

.sheet-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.5rem;
}

.drawer-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary {
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.6rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
}

@media print {
  body * {
    visibility: hidden;
  }
  #official-transcript-document,
  #official-transcript-document * {
    visibility: visible;
  }
  #official-transcript-document {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
