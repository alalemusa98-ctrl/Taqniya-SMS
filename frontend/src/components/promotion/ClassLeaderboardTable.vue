<template>
  <div class="class-leaderboard-container">
    <div class="leaderboard-header">
      <div class="title-wrap">
        <h3 class="section-title">لوحة شرف وترتيب الطلاب (Class Leaderboard)</h3>
        <span class="subtitle">ترتيب الطلاب تنازلياً حسب النسبة والمعدل العام</span>
      </div>
      <div class="filter-wrap">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="بحث بالاسم أو الرقم الوطني..."
          class="spatial-search-input"
        />
      </div>
    </div>

    <div class="table-responsive">
      <table class="spatial-leaderboard-table">
        <thead>
          <tr>
            <th class="th-rank">الترتيب</th>
            <th>كود الطالب</th>
            <th>اسم الطالب الرباعي</th>
            <th>الشعبة</th>
            <th>المجموع الكلي</th>
            <th>النسبة المئوية</th>
            <th>الحالة النهائية</th>
            <th class="th-actions">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredTranscripts.length === 0">
            <td colspan="8" class="empty-row">لا توجد بيانات كشوفات مطابقة للبحث أو الشعبة المحددة.</td>
          </tr>
          <tr
            v-for="(t, idx) in filteredTranscripts"
            :key="t.id"
            class="leaderboard-row"
            :class="getRankRowClass(t.calculated_rank || (idx + 1))"
          >
            <!-- Rank Column -->
            <td class="td-rank">
              <div class="rank-badge" :class="getRankBadgeClass(t.calculated_rank || (idx + 1))">
                <span v-if="(t.calculated_rank || (idx + 1)) === 1">🥇 1</span>
                <span v-else-if="(t.calculated_rank || (idx + 1)) === 2">🥈 2</span>
                <span v-else-if="(t.calculated_rank || (idx + 1)) === 3">🥉 3</span>
                <span v-else>{{ t.calculated_rank || (idx + 1) }}</span>
              </div>
            </td>

            <!-- Student Code -->
            <td class="td-code">
              <code>{{ t.student_code }}</code>
            </td>

            <!-- Student Name -->
            <td class="td-name font-semibold">
              <div class="student-profile-cell">
                <div class="student-avatar">{{ t.student_name.slice(0, 1) }}</div>
                <span>{{ t.student_name }}</span>
              </div>
            </td>

            <!-- Section -->
            <td>
              <span class="section-tag">{{ t.section_name }}</span>
            </td>

            <!-- Total Score -->
            <td class="td-score">
              <span class="score-val">{{ t.total_score }}</span>
              <span class="score-max">/ {{ t.max_possible_score }}</span>
            </td>

            <!-- Percentage Meter -->
            <td class="td-percentage">
              <div class="percentage-meter-wrap">
                <div class="meter-bar">
                  <div
                    class="meter-fill"
                    :class="getPercentageFillClass(t.percentage)"
                    :style="{ width: `${Math.min(100, Math.max(0, t.percentage))}%` }"
                  ></div>
                </div>
                <span class="percentage-text">{{ t.percentage }}%</span>
              </div>
            </td>

            <!-- Final Status -->
            <td>
              <span class="status-pill" :class="getStatusPillClass(t.final_status)">
                {{ getStatusText(t.final_status) }}
              </span>
            </td>

            <!-- Actions -->
            <td class="td-actions">
              <div class="action-buttons">
                <button
                  type="button"
                  class="btn-icon"
                  title="عرض كشف الدرجات التفصيلي"
                  @click="$emit('view-detail', t)"
                >
                  📄
                </button>
                <button
                  type="button"
                  class="btn-icon btn-freeze"
                  title="تجميد وتثبيت السجل"
                  @click="$emit('freeze', t)"
                >
                  🔒
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StudentTranscript } from '../../api/promotion.api';

interface Props {
  transcripts: StudentTranscript[];
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'view-detail', transcript: StudentTranscript): void;
  (e: 'freeze', transcript: StudentTranscript): void;
}>();

const searchTerm = ref('');

const filteredTranscripts = computed(() => {
  if (!searchTerm.value.trim()) {
    return props.transcripts;
  }
  const q = searchTerm.value.trim().toLowerCase();
  return props.transcripts.filter(
    (t) =>
      t.student_name.toLowerCase().includes(q) ||
      t.student_code.toLowerCase().includes(q) ||
      (t.national_id && t.national_id.includes(q))
  );
});

const getRankRowClass = (rank: number) => {
  if (rank === 1) return 'row-gold';
  if (rank === 2) return 'row-silver';
  if (rank === 3) return 'row-bronze';
  return '';
};

const getRankBadgeClass = (rank: number) => {
  if (rank === 1) return 'badge-gold';
  if (rank === 2) return 'badge-silver';
  if (rank === 3) return 'badge-bronze';
  return 'badge-standard';
};

const getPercentageFillClass = (percentage: number) => {
  if (percentage >= 85) return 'fill-excellent';
  if (percentage >= 65) return 'fill-good';
  if (percentage >= 50) return 'fill-pass';
  return 'fill-fail';
};

const getStatusPillClass = (status: string) => {
  switch (status) {
    case 'passed':
      return 'pill-passed';
    case 'second_round':
      return 'pill-second-round';
    case 'retained':
      return 'pill-retained';
    default:
      return 'pill-default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'passed':
      return 'ناجح ومنقول';
    case 'second_round':
      return 'دور ثان';
    case 'retained':
      return 'باق للإعادة';
    default:
      return status;
  }
};
</script>

<style scoped>
.class-leaderboard-container {
  background: var(--spatial-bg-surface, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--spatial-border-color, rgba(226, 232, 240, 0.8));
  border-radius: var(--spatial-radius-lg, 16px);
  padding: 1.5rem;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-wrap .section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-gray-900, #0f172a);
  margin: 0;
}

.title-wrap .subtitle {
  font-size: 0.8rem;
  color: var(--color-gray-500, #64748b);
}

.spatial-search-input {
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid var(--color-gray-300, #cbd5e1);
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
  min-width: 260px;
  outline: none;
  transition: all 0.2s ease;
}

.spatial-search-input:focus {
  border-color: var(--color-primary-500, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.table-responsive {
  overflow-x: auto;
}

.spatial-leaderboard-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.4rem;
  text-align: right;
}

.spatial-leaderboard-table th {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-gray-500, #64748b);
  border-bottom: 1px solid var(--color-gray-200, #e2e8f0);
}

.spatial-leaderboard-table td {
  padding: 0.85rem 1rem;
  font-size: 0.85rem;
  color: var(--color-gray-800, #1e293b);
  background: rgba(255, 255, 255, 0.7);
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
}

.spatial-leaderboard-table tr td:first-child {
  border-right: 1px solid rgba(226, 232, 240, 0.5);
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.spatial-leaderboard-table tr td:last-child {
  border-left: 1px solid rgba(226, 232, 240, 0.5);
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.leaderboard-row:hover td {
  background: var(--spatial-bg-hover, rgba(241, 245, 249, 0.9));
}

.row-gold td {
  background: rgba(254, 243, 199, 0.35);
}

.row-silver td {
  background: rgba(241, 245, 249, 0.5);
}

.row-bronze td {
  background: rgba(255, 237, 213, 0.35);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  min-width: 36px;
}

.badge-gold {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border: 1px solid #f59e0b;
}

.badge-silver {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #475569;
  border: 1px solid #94a3b8;
}

.badge-bronze {
  background: linear-gradient(135deg, #ffedd5, #fed7aa);
  color: #9a3412;
  border: 1px solid #f97316;
}

.badge-standard {
  background: rgba(241, 245, 249, 0.8);
  color: #64748b;
}

.student-profile-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.student-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.section-tag {
  background: rgba(241, 245, 249, 0.9);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
}

.score-val {
  font-weight: 700;
  color: #0f172a;
}

.score-max {
  font-size: 0.75rem;
  color: #94a3b8;
}

.percentage-meter-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meter-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  min-width: 60px;
}

.meter-fill {
  height: 100%;
  border-radius: 999px;
}

.fill-excellent {
  background: linear-gradient(90deg, #10b981, #059669);
}

.fill-good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.fill-pass {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.fill-fail {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.percentage-text {
  font-size: 0.8rem;
  font-weight: 700;
  min-width: 45px;
}

.status-pill {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.pill-passed {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.pill-second-round {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.pill-retained {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.action-buttons {
  display: flex;
  gap: 0.35rem;
}

.btn-icon {
  background: none;
  border: 1px solid var(--color-gray-200, #e2e8f0);
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-icon:hover {
  background: white;
  border-color: var(--color-primary-500, #6366f1);
  transform: translateY(-1px);
}

.btn-freeze:hover {
  border-color: #f59e0b;
  background: #fffbeb;
}

.empty-row {
  text-align: center;
  padding: 2rem !important;
  color: #94a3b8;
}
</style>
