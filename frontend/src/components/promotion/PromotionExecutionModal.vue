<template>
  <TaqniyaModal
    :is-open="isOpen"
    :title="'معاينة وتنفيذ الترحيل الأكاديمي الجماعي وتوزيع الفصول'"
    size="lg"
    @close="$emit('close')"
  >
    <div class="promotion-modal-content">
      <!-- Year Selection Grid -->
      <div class="years-selection-grid">
        <div class="form-group">
          <label class="form-label">العام الدراسي الحالي (المُرحّل منه):</label>
          <select v-model="fromYearId" class="spatial-select" :disabled="isPreviewLoading || isExecuting">
            <option v-for="y in academicYears" :key="y.id" :value="y.id">
              {{ y.name }} {{ y.is_active ? '(العام النشط الحالي)' : '' }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">العام الدراسي المستهدف (المُرحّل إليه):</label>
          <select v-model="toYearId" class="spatial-select" :disabled="isPreviewLoading || isExecuting">
            <option v-for="y in academicYears" :key="y.id" :value="y.id">
              {{ y.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Preview Simulation Trigger -->
      <div class="preview-trigger-wrap">
        <button
          type="button"
          class="btn-preview-sim"
          :disabled="!canPreview || isPreviewLoading || isExecuting"
          @click="runPreview"
        >
          <span v-if="isPreviewLoading">جاري تشغيل محاكاة الترحيل... ⏳</span>
          <span v-else>🔍 تشغيل محاكاة الترحيل ومعاينة النتائج (Simulate & Preview)</span>
        </button>
      </div>

      <!-- Simulation Results Container -->
      <div v-if="previewResult" class="simulation-results-section">
        <div class="section-badge-bar">
          <span class="badge-title">نتائج المحاكاة التقديرية</span>
          <span class="badge-sub">إجمالي الطلاب المسكنين: {{ previewResult.total_eligible_students }} طالب</span>
        </div>

        <!-- Metric KPI Cards -->
        <div class="sim-kpis-grid">
          <div class="sim-kpi promoted">
            <span class="kpi-label">الطلاب المنقولون (Promoted)</span>
            <span class="kpi-value">{{ previewResult.total_promoted }}</span>
            <span class="kpi-desc">ينقلون للمستوى التالي مع الاحتفاظ بالشعبة</span>
          </div>
          <div class="sim-kpi second-round">
            <span class="kpi-label">طلاب الدور الثاني</span>
            <span class="kpi-value">{{ previewResult.total_second_round }}</span>
            <span class="kpi-desc">معلقون حتى نتائج الدور الثاني</span>
          </div>
          <div class="sim-kpi retained">
            <span class="kpi-label">الباقون للإعادة (Retained)</span>
            <span class="kpi-value">{{ previewResult.total_retained }}</span>
            <span class="kpi-desc">يبقون في نفس المستوى والشعبة</span>
          </div>
          <div class="sim-kpi graduated">
            <span class="kpi-label">الخريجون (Graduated)</span>
            <span class="kpi-value">{{ previewResult.total_graduated }}</span>
            <span class="kpi-desc">أتموا المرحلة بنجاح</span>
          </div>
        </div>

        <!-- Low Enrollment Warnings (SSoT High Priority Requirement) -->
        <div
          v-if="previewResult.low_enrollment_warnings && previewResult.low_enrollment_warnings.length > 0"
          class="low-enrollment-alert-box"
        >
          <div class="alert-header">
            <span class="warn-emoji">⚠️</span>
            <strong class="alert-title">تنبيهات انخفاض الكثافة الطلابية (أقل من 10 طلاب):</strong>
          </div>
          <ul class="warnings-list">
            <li v-for="(warn, wIdx) in previewResult.low_enrollment_warnings" :key="wIdx">
              <strong>{{ warn.class_name }} - {{ warn.section_name }}:</strong>
              <span>العدد المتوقع بعد الترحيل هو {{ warn.projected_count }} طلاب فقط (الكثافة المقترحة: {{ warn.threshold_limit }}). يُوصى بمراجعة الشعبة أو دمجها لاحقاً.</span>
            </li>
          </ul>
        </div>

        <!-- Class Breakdown Table -->
        <div class="breakdown-wrap">
          <h4 class="breakdown-title">توزيع الفصول والنسب المتوقعة:</h4>
          <table class="sim-breakdown-table">
            <thead>
              <tr>
                <th>الصف الدراسي</th>
                <th>إجمالي الطلاب</th>
                <th>الناجحون</th>
                <th>الباقون للإعادة</th>
                <th>نسبة النجاح المتوقعة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cls, cIdx) in previewResult.class_breakdown" :key="cIdx">
                <td class="font-bold">{{ cls.class_name }}</td>
                <td>{{ cls.total }}</td>
                <td class="text-success font-semibold">{{ cls.promoted }}</td>
                <td class="text-danger font-semibold">{{ cls.retained }}</td>
                <td>
                  <span class="pass-tag">{{ cls.pass_rate }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Execution Notes -->
        <div class="form-group notes-group">
          <label class="form-label">ملاحظات وقرار لجنة الترحيل السنوي:</label>
          <textarea
            v-model="executionNotes"
            rows="2"
            class="spatial-textarea"
            placeholder="أدخل أي ملاحظات إدارية أو توثيقية خاصة بهذه الدفعة..."
          ></textarea>
        </div>

        <!-- Final Confirmation Checkbox -->
        <div class="confirmation-check-row">
          <input id="confirm-promotion" v-model="isConfirmed" type="checkbox" class="confirm-checkbox" />
          <label for="confirm-promotion" class="confirm-label">
            أقر بأنني قمت بمراجعة كافة النتائج أعلاه، وأوافق على اعتماد الترحيل النهائي وتسكين الطلاب في العام الدراسي الجديد.
          </label>
        </div>
      </div>

      <!-- Modal Actions -->
      <div class="modal-footer-actions">
        <button
          v-if="previewResult"
          type="button"
          class="btn-execute-final"
          :disabled="!isConfirmed || isExecuting"
          @click="handleExecute"
        >
          <span v-if="isExecuting">جاري تنفيذ وتسكين الترحيل... ⚙️</span>
          <span v-else>🚀 تنفيذ الترحيل الأكاديمي النهائي والاعتماد</span>
        </button>
        <button type="button" class="btn-cancel" @click="$emit('close')">
          إلغاء
        </button>
      </div>
    </div>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
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

<style scoped>
.promotion-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.years-selection-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.spatial-select,
.spatial-textarea {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
  transition: all 0.2s ease;
}

.spatial-select:focus,
.spatial-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.preview-trigger-wrap {
  display: flex;
  justify-content: center;
}

.btn-preview-sim {
  background: #eef2ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.btn-preview-sim:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #a5b4fc;
}

.btn-preview-sim:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.simulation-results-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}

.section-badge-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.badge-title {
  font-weight: 800;
  color: #0f172a;
}

.badge-sub {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.sim-kpis-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.sim-kpi {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sim-kpi.promoted {
  border-right: 4px solid #10b981;
}

.sim-kpi.second-round {
  border-right: 4px solid #f59e0b;
}

.sim-kpi.retained {
  border-right: 4px solid #ef4444;
}

.sim-kpi.graduated {
  border-right: 4px solid #6366f1;
}

.kpi-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.kpi-desc {
  font-size: 0.65rem;
  color: #94a3b8;
}

.low-enrollment-alert-box {
  background: #fff7ed;
  border: 1.5px solid #fdba74;
  border-radius: 8px;
  padding: 0.85rem 1rem;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.alert-title {
  color: #c2410c;
  font-size: 0.85rem;
}

.warnings-list {
  margin: 0;
  padding-right: 1.25rem;
  font-size: 0.8rem;
  color: #9a3412;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sim-breakdown-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  font-size: 0.85rem;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.sim-breakdown-table th {
  background: #f1f5f9;
  padding: 0.5rem 0.75rem;
  color: #475569;
  font-weight: 600;
}

.sim-breakdown-table td {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.pass-tag {
  background: #ecfdf5;
  color: #047857;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8rem;
}

.confirmation-check-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: #fefce8;
  border: 1px solid #fef08a;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.confirm-checkbox {
  margin-top: 0.2rem;
  cursor: pointer;
}

.confirm-label {
  font-size: 0.85rem;
  color: #854d0e;
  font-weight: 600;
  cursor: pointer;
  line-height: 1.4;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-execute-final {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.6rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-execute-final:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transform: translateY(-1px);
}

.btn-execute-final:disabled {
  opacity: 0.5;
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
