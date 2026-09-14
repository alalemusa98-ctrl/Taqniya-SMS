<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { auditApi } from '../../api/users.api';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  GraduationCap,
  ShieldAlert,
  TrendingUp,
  RotateCcw,
  Filter,
} from 'lucide-vue-next';
import AuditDiffDrawer from './AuditDiffDrawer.vue';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaKpiCard from '../ui/TaqniyaKpiCard.vue';
import { formatDateTime } from '../../utils/formatters';
import {
  getActionInfo,
  getEntityInfo,
  ACTION_FILTER_OPTIONS,
  ENTITY_FILTER_OPTIONS,
} from '../../utils/audit-dictionary';

const logs = ref<any[]>([]);
const meta = ref<any>({ current_page: 1, per_page: 15, total: 0, total_pages: 1 });
const isLoading = ref(true);

const filterAction = ref('');
const filterEntity = ref('');
const fromDate = ref('');
const toDate = ref('');

const selectedLog = ref<any>(null);
const isDiffDrawerOpen = ref(false);

// KPI counts computed from current data
const usersActivityCount = computed(() => {
  return logs.value.filter((l) =>
    ['login', 'logout', 'user_activated', 'user_deactivated', 'password_change', 'admin_reset_password'].includes(
      l.action,
    ),
  ).length;
});

const academicActivityCount = computed(() => {
  return logs.value.filter(
    (l) =>
      l.action.includes('enroll') ||
      l.action.includes('ASSIGNMENT') ||
      l.action.includes('teacher') ||
      l.action.includes('student') ||
      l.action.includes('academic') ||
      l.action.includes('slot'),
  ).length;
});

const securityAlertsCount = computed(() => {
  return logs.value.filter(
    (l) =>
      l.action.includes('blocked') ||
      l.action.includes('failed') ||
      l.action === 'user_deactivated' ||
      l.action === 'admin_reset_password',
  ).length;
});

const hasActiveFilters = computed(() => {
  return Boolean(filterAction.value || filterEntity.value || fromDate.value || toDate.value);
});

const resetFilters = async () => {
  filterAction.value = '';
  filterEntity.value = '';
  fromDate.value = '';
  toDate.value = '';
  await loadLogs(1);
};

const loadLogs = async (page = 1) => {
  isLoading.value = true;
  try {
    const res = await auditApi.getAuditLogs({
      page,
      action: filterAction.value || undefined,
      entity_type: filterEntity.value || undefined,
      from_date: fromDate.value || undefined,
      to_date: toDate.value || undefined,
    });

    if (res.data.success) {
      logs.value = res.data.data;
      meta.value = res.data.meta;
    }
  } catch (error) {
    console.error('Failed to load audit logs:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadLogs();
});

const openDiff = (log: any) => {
  selectedLog.value = log;
  isDiffDrawerOpen.value = true;
};
</script>

<template>
  <div class="space-y-6" dir="rtl">
    <!-- Header with Taqniya Brand Accent -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
        <div>
          <h2 class="font-display font-black text-2xl sm:text-3xl text-bx-title">سجلات التدقيق الأمني</h2>
          <p class="text-xs text-bx-muted font-bold mt-1">
            مراقبة العمليات الحساسة، تتبع تغييرات البيانات ومقارنة الفروقات لضمان النزاهة والموثوقية
          </p>
        </div>
      </div>
    </div>

    <!-- 8. KPI & Metrics Ribbon (Exact Framework Section 8 Standard) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Total Recorded Operations -->
      <TaqniyaKpiCard
        title="إجمالي العمليات المسجلة"
        :value="meta.total"
        :icon="Shield"
        variant="primary"
        badge-text="أمان النظام"
        :badge-icon="TrendingUp"
        :pulse-badge="true"
        :progress="100"
      />

      <!-- Card 2: User Account Activities -->
      <TaqniyaKpiCard
        title="حركات المستخدمين"
        :value="`${usersActivityCount} حركة`"
        :icon="Users"
        variant="blue"
        badge-text="جلسات وحسابات"
        :badge-icon="TrendingUp"
        :progress="100"
      />

      <!-- Card 3: Academic Operations -->
      <TaqniyaKpiCard
        title="تسكين وإسناد أكاديمي"
        :value="`${academicActivityCount} حركة`"
        :icon="GraduationCap"
        variant="emerald"
        badge-text="العمليات الأكاديمية"
        :badge-icon="TrendingUp"
        :progress="100"
      />

      <!-- Card 4: Security Alerts & Sensitive Operations -->
      <TaqniyaKpiCard
        title="تنبيهات وإجراءات حساسة"
        :value="`${securityAlertsCount} تنبيه`"
        :icon="ShieldAlert"
        :variant="securityAlertsCount > 0 ? 'amber' : 'emerald'"
        :badge-text="securityAlertsCount > 0 ? 'بحاجة لمتابعة' : 'الأمان مستقر'"
        :badge-icon="TrendingUp"
        :pulse-badge="securityAlertsCount > 0"
        :progress="securityAlertsCount > 0 ? 50 : 100"
      />
    </div>

    <!-- Filter Ribbon (Taqniya Filter Box) -->
    <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-bx-border space-y-3.5 shadow-2xs">
      <div class="flex items-center justify-between gap-2 border-b border-bx-divider pb-2.5">
        <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
          <Filter class="w-4 h-4 text-bx-primary shrink-0" />
          <span>تصفية سجلات التدقيق حسب نوع الحركة والجهة المتأثرة</span>
        </div>
        <div class="flex items-center gap-3">
          <div v-if="hasActiveFilters" class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
            <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
            <span>فلاتر البحث مفعلة</span>
          </div>
          <button
            @click="resetFilters"
            class="inline-flex items-center gap-1 text-[11px] text-bx-muted hover:text-bx-primary transition-colors cursor-pointer font-bold"
          >
            <RotateCcw class="w-3 h-3" />
            <span>إعادة ضبط</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Action Filter with Human Names -->
        <div>
          <label class="block text-[11px] font-bold text-bx-muted mb-1">نوع الحركة أو الإجراء</label>
          <TaqniyaSelect
            v-model="filterAction"
            :options="ACTION_FILTER_OPTIONS"
            placeholder="كافة العمليات..."
            full-width
            @update:model-value="loadLogs(1)"
          />
        </div>

        <!-- Entity Filter with Human Names -->
        <div>
          <label class="block text-[11px] font-bold text-bx-muted mb-1">الجهة أو الكيان المتأثر</label>
          <TaqniyaSelect
            v-model="filterEntity"
            :options="ENTITY_FILTER_OPTIONS"
            placeholder="كافة الكيانات..."
            full-width
            @update:model-value="loadLogs(1)"
          />
        </div>

        <!-- Date Range Filter -->
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <label class="block text-[11px] font-bold text-bx-muted mb-1">من تاريخ</label>
            <input
              v-model="fromDate"
              type="date"
              class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-bx-surface text-bx-title focus:outline-none focus:border-bx-primary transition"
              @change="loadLogs(1)"
            />
          </div>
          <div class="flex-1">
            <label class="block text-[11px] font-bold text-bx-muted mb-1">إلى تاريخ</label>
            <input
              v-model="toDate"
              type="date"
              class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-bx-surface text-bx-title focus:outline-none focus:border-bx-primary transition"
              @change="loadLogs(1)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Table Card with Full Design Token Styling -->
    <div class="bx-card bg-bx-surface border border-bx-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-start text-xs">
          <thead>
            <tr class="text-bx-muted bg-bx-table-header border-b border-bx-divider">
              <th class="py-3.5 px-4 font-black text-start">#</th>
              <th class="py-3.5 px-4 font-black text-start">المستخدم المنفذ</th>
              <th class="py-3.5 px-4 font-black text-start">نوع الحركة أو العملية</th>
              <th class="py-3.5 px-4 font-black text-start">الجهة المتأثرة</th>
              <th class="py-3.5 px-4 font-black text-start">عنوان IP</th>
              <th class="py-3.5 px-4 font-black text-start">تاريخ الحركة</th>
              <th class="py-3.5 px-4 font-black text-end">التفاصيل والفروقات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bx-divider">
            <tr v-if="isLoading">
              <td colspan="7" class="py-14 text-center text-bx-muted">
                <div class="w-7 h-7 border-2 border-bx-primary border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
                <span>جاري استدعاء سجلات التدقيق الأمني...</span>
              </td>
            </tr>

            <tr v-else-if="logs.length === 0">
              <td colspan="7" class="py-14 text-center text-bx-muted font-bold">
                <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-bx-primary flex items-center justify-center mx-auto mb-2 font-black">
                  <Shield class="w-5 h-5" />
                </div>
                <p class="text-bx-title">لا توجد سجلات تدقيق تطابق محددات البحث</p>
                <p class="text-[11px] text-bx-muted mt-1">جرب تغيير نوع الحركة أو إعادة ضبط الفلاتر.</p>
              </td>
            </tr>

            <tr
              v-else
              v-for="log in logs"
              :key="log.id"
              class="hover:bg-bx-row-hover transition-colors"
            >
              <td class="py-3.5 px-4 font-mono font-bold text-bx-muted">
                #{{ log.id }}
              </td>

              <!-- User Code -->
              <td class="py-3.5 px-4 font-black font-mono text-bx-title">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-bx-primary/60"></span>
                  <span>{{ log.user_code || 'النظام المركزي' }}</span>
                </div>
              </td>

              <!-- Human Action Badge -->
              <td class="py-3.5 px-4">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border transition-all"
                  :class="getActionInfo(log.action).badgeClass"
                >
                  {{ getActionInfo(log.action).text }}
                </span>
              </td>

              <!-- Human Entity Info -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-bx-title text-xs">
                    {{ getEntityInfo(log.entity_type).label }}
                  </span>
                  <span v-if="log.entity_id" class="text-bx-muted font-mono text-[10.5px]">
                    #{{ log.entity_id }}
                  </span>
                </div>
              </td>

              <!-- IP Address -->
              <td class="py-3.5 px-4 font-mono text-bx-muted text-[11px] font-bold">
                {{ log.ip_address || '—' }}
              </td>

              <!-- Timestamp -->
              <td class="py-3.5 px-4 text-bx-muted text-[11px] font-bold font-mono">
                {{ formatDateTime(log.created_at) }}
              </td>

              <!-- Actions Button -->
              <td class="py-3.5 px-4 text-end">
                <button
                  @click="openDiff(log)"
                  class="p-1.5 rounded-xl border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-all cursor-pointer shadow-2xs hover:bg-purple-500/10 active:scale-95"
                  title="مقارنة الفروقات والتغييرات"
                >
                  <Eye class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="meta.total_pages > 1"
        class="p-4 border-t border-bx-divider flex items-center justify-between text-xs text-bx-muted font-bold bg-purple-500/[0.01]"
      >
        <div>
          صفحة <span class="text-bx-title font-black">{{ meta.current_page }}</span> من
          <span class="text-bx-title font-black">{{ meta.total_pages }}</span> (إجمالي
          {{ meta.total }} سجل)
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadLogs(meta.current_page - 1)"
            :disabled="meta.current_page <= 1"
            class="p-1.5 rounded-xl border border-bx-border disabled:opacity-30 hover:border-bx-primary cursor-pointer transition text-bx-title"
            title="الصفحة السابقة"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
            @click="loadLogs(meta.current_page + 1)"
            :disabled="meta.current_page >= meta.total_pages"
            class="p-1.5 rounded-xl border border-bx-border disabled:opacity-30 hover:border-bx-primary cursor-pointer transition text-bx-title"
            title="الصفحة التالية"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Audit Diff Drawer -->
    <AuditDiffDrawer
      :is-open="isDiffDrawerOpen"
      :log="selectedLog"
      @close="isDiffDrawerOpen = false"
    />
  </div>
</template>
