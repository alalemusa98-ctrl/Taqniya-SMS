<template>
  <div class="executive-class-card" :class="{ 'is-selected': isSelected }" @click="$emit('select', classSummary)">
    <div class="card-header">
      <div class="class-info">
        <span class="class-badge">{{ classSummary.class_name }}</span>
        <span class="grade-level">المستوى {{ classSummary.grade_level }}</span>
      </div>
      <div class="pass-rate-pill" :class="passRateClass">
        <span class="rate-value">{{ classSummary.passing_rate }}%</span>
        <span class="rate-label">نسبة النجاح</span>
      </div>
    </div>

    <!-- Pass Rate Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          :class="progressFillClass"
          :style="{ width: `${Math.min(100, Math.max(0, classSummary.passing_rate))}%` }"
        ></div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-item total">
        <span class="metric-label">إجمالي الطلاب</span>
        <span class="metric-value">{{ classSummary.total_students }}</span>
      </div>
      <div class="metric-item passed">
        <span class="metric-label">ناجح</span>
        <span class="metric-value">{{ classSummary.passed_count }}</span>
      </div>
      <div class="metric-item second-round" v-if="classSummary.second_round_count > 0">
        <span class="metric-label">دور ثان</span>
        <span class="metric-value">{{ classSummary.second_round_count }}</span>
      </div>
      <div class="metric-item retained">
        <span class="metric-label">باق للإعادة</span>
        <span class="metric-value">{{ classSummary.retained_count }}</span>
      </div>
    </div>

    <div v-if="classSummary.passing_rate < 50" class="low-pass-alert">
      <span class="alert-icon">⚠️</span>
      <span class="alert-text">تنبيه: نسبة النجاح منخفضة تتطلب مراجعة الأداء الأكاديمي</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ExecutiveClassSummary } from '../../api/promotion.api';

interface Props {
  classSummary: ExecutiveClassSummary;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

defineEmits<{
  (e: 'select', summary: ExecutiveClassSummary): void;
}>();

const passRateClass = computed(() => {
  const rate = props.classSummary.passing_rate;
  if (rate >= 80) return 'rate-high';
  if (rate >= 60) return 'rate-medium';
  return 'rate-low';
});

const progressFillClass = computed(() => {
  const rate = props.classSummary.passing_rate;
  if (rate >= 80) return 'fill-high';
  if (rate >= 60) return 'fill-medium';
  return 'fill-low';
});
</script>

<style scoped>
.executive-class-card {
  background: var(--spatial-bg-surface, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--spatial-border-color, rgba(226, 232, 240, 0.8));
  border-radius: var(--spatial-radius-lg, 16px);
  padding: 1.25rem;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.executive-class-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-400, #818cf8);
  box-shadow: 0 8px 30px -4px rgba(79, 70, 229, 0.12);
}

.executive-class-card.is-selected {
  border-color: var(--color-primary-600, #4f46e5);
  background: var(--spatial-bg-active, rgba(238, 242, 255, 0.9));
  box-shadow: 0 0 0 2px var(--color-primary-500, #6366f1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.class-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.class-badge {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-gray-900, #0f172a);
}

.grade-level {
  font-size: 0.8rem;
  color: var(--color-gray-500, #64748b);
}

.pass-rate-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
}

.pass-rate-pill.rate-high {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.pass-rate-pill.rate-medium {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.pass-rate-pill.rate-low {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.rate-value {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
}

.rate-label {
  font-size: 0.65rem;
  font-weight: 500;
}

.progress-container {
  width: 100%;
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: var(--color-gray-200, #e2e8f0);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-bar-fill.fill-high {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.progress-bar-fill.fill-medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-bar-fill.fill-low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.5rem;
  background: var(--color-gray-50, rgba(248, 250, 252, 0.6));
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-gray-100, #f1f5f9);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.metric-label {
  font-size: 0.7rem;
  color: var(--color-gray-500, #64748b);
}

.metric-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-gray-800, #1e293b);
}

.metric-item.passed .metric-value {
  color: #059669;
}

.metric-item.second-round .metric-value {
  color: #d97706;
}

.metric-item.retained .metric-value {
  color: #dc2626;
}

.low-pass-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 6px;
  font-size: 0.75rem;
  color: #b91c1c;
}
</style>
