<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { auditApi } from '../../api/users.api';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import AuditDiffDrawer from './AuditDiffDrawer.vue';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import { formatDateTime } from '../../utils/formatters';

const logs = ref<any[]>([]);
const meta = ref<any>({ current_page: 1, per_page: 15, total: 0, total_pages: 1 });
const isLoading = ref(true);

const filterAction = ref('');
const filterEntity = ref('');
const fromDate = ref('');
const toDate = ref('');

const actionOptions = [
  { value: '', label: 'كافة العمليات' },
  { value: 'login', label: 'تسجيل دخول' },
  { value: 'logout', label: 'تسجيل خروج' },
  { value: 'user_activated', label: 'تفعيل حساب' },
  { value: 'user_deactivated', label: 'تعطيل حساب' },
  { value: 'password_change', label: 'تغيير كلمة مرور' },
  { value: 'admin_reset_password', label: 'إعادة تعيين من الإدارة' },
];

const entityOptions = [
  { value: '', label: 'كافة الكيانات' },
  { value: 'User', label: 'المستخدمون (User)' },
  { value: 'PersonalAccessToken', label: 'الجلسات (Token)' },
];

const selectedLog = ref<any>(null);
const isDiffDrawerOpen = ref(false);

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

const getActionBadge = (action: string) => {
  switch (action) {
    case 'login':
      return { text: 'دخول', class: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' };
    case 'logout':
      return { text: 'خروج', class: 'bg-slate-500/10 text-slate-600 border-slate-500/30' };
    case 'password_change':
    case 'admin_reset_password':
      return { text: 'تغيير كلمة المرور', class: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
    case 'user_activated':
      return { text: 'تفعيل حساب', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
    case 'user_deactivated':
      return { text: 'تعطيل حساب', class: 'bg-rose-500/10 text-rose-600 border-rose-500/30' };
    default:
      return { text: action, class: 'bg-slate-500/10 text-slate-600 border-slate-500/30' };
  }
};
</script>

<template>
  <div class="space-y-6" dir="rtl">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h2 class="font-display font-black text-2xl sm:text-3xl text-bx-title">سجلات التدقيق الأمني</h2>
        <p class="text-xs text-bx-muted font-bold mt-1">
          تتبع العمليات الحساسة ومقارنة الفروقات لضمان الشفافية والأمان
        </p>
      </div>

      <!-- Filters with TaqniyaSelect -->
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <TaqniyaSelect
          v-model="filterAction"
          :options="actionOptions"
          @update:model-value="loadLogs(1)"
        />

        <TaqniyaSelect
          v-model="filterEntity"
          :options="entityOptions"
          @update:model-value="loadLogs(1)"
        />
      </div>
    </div>

    <!-- Table Card -->
    <div class="bx-card bg-[var(--bx-surface-solid)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-start text-xs">
          <thead>
            <tr class="text-bx-muted bg-[var(--bx-table-header)] border-b border-bx-border">
              <th class="py-3 px-4 font-black text-start">#</th>
              <th class="py-3 px-4 font-black text-start">المستخدم المنفذ</th>
              <th class="py-3 px-4 font-black text-start">نوع الحركة</th>
              <th class="py-3 px-4 font-black text-start">الكيان المتأثر</th>
              <th class="py-3 px-4 font-black text-start">عنوان IP</th>
              <th class="py-3 px-4 font-black text-start">تاريخ الحركة</th>
              <th class="py-3 px-4 font-black text-end">التفاصيل</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bx-divider">
            <tr v-if="isLoading">
              <td colspan="7" class="py-12 text-center text-bx-muted">
                <div class="w-6 h-6 border-2 border-bx-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                جاري استدعاء سجلات التدقيق...
              </td>
            </tr>

            <tr v-else-if="logs.length === 0">
              <td colspan="7" class="py-12 text-center text-bx-muted font-bold">
                لا توجد سجلات تدقيق مسجلة حتى الآن.
              </td>
            </tr>

            <tr v-else v-for="log in logs" :key="log.id" class="hover:bg-[var(--bx-row-hover)] transition-colors">
              <td class="py-3.5 px-4 font-mono font-bold text-bx-muted">{{ log.id }}</td>
              <td class="py-3.5 px-4 font-black font-mono text-bx-title">
                {{ log.user_code || 'نظام آلي' }}
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border" :class="getActionBadge(log.action).class">
                  {{ getActionBadge(log.action).text }}
                </span>
              </td>
              <td class="py-3.5 px-4 font-mono font-bold text-bx-text">
                {{ log.entity_type }} <span v-if="log.entity_id" class="text-bx-muted">#{{ log.entity_id }}</span>
              </td>
              <td class="py-3.5 px-4 font-mono text-bx-muted text-[11px] font-bold">{{ log.ip_address || '—' }}</td>
              <td class="py-3.5 px-4 text-bx-muted text-[11px] font-bold font-mono">
                {{ formatDateTime(log.created_at) }}
              </td>
              <td class="py-3.5 px-4 text-end">
                <button
                  @click="openDiff(log)"
                  class="bx-icon-btn p-1.5 rounded-xl border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-all cursor-pointer"
                  title="مقارنة الفروقات"
                >
                  <Eye class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="meta.total_pages > 1" class="p-4 border-t border-bx-border flex items-center justify-between text-xs text-bx-muted font-bold">
        <div>
          صفحة <span class="text-bx-title font-black">{{ meta.current_page }}</span> من <span class="text-bx-title font-black">{{ meta.total_pages }}</span> (إجمالي {{ meta.total }} سجل)
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadLogs(meta.current_page - 1)"
            :disabled="meta.current_page <= 1"
            class="bx-icon-btn p-1.5 rounded-xl border border-bx-border disabled:opacity-30 hover:border-bx-primary cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
            @click="loadLogs(meta.current_page + 1)"
            :disabled="meta.current_page >= meta.total_pages"
            class="bx-icon-btn p-1.5 rounded-xl border border-bx-border disabled:opacity-30 hover:border-bx-primary cursor-pointer"
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
