<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { auditApi } from '../../api/users.api';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import AuditDiffDrawer from './AuditDiffDrawer.vue';

const logs = ref<any[]>([]);
const meta = ref<any>({ current_page: 1, per_page: 15, total: 0, total_pages: 1 });
const isLoading = ref(true);

const filterAction = ref('');
const filterEntity = ref('');
const fromDate = ref('');
const toDate = ref('');

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
      return { text: 'دخول', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'logout':
      return { text: 'خروج', class: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'password_change':
    case 'admin_reset_password':
      return { text: 'تغيير كلمة المرور', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'user_activated':
      return { text: 'تفعيل حساب', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'user_deactivated':
      return { text: 'تعطيل حساب', class: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { text: action, class: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
};
</script>

<template>
  <div class="space-y-6" dir="rtl">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">سجلات التدقيق الأمني</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تتبع العمليات الحساسة ومقارنة الفروقات لضمان الشفافية والأمان
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div class="relative">
          <select
            v-model="filterAction"
            @change="loadLogs(1)"
            class="appearance-none ps-3.5 pe-8 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 outline-none transition-all shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
          >
            <option value="">كافة العمليات</option>
            <option value="login">تسجيل دخول</option>
            <option value="logout">تسجيل خروج</option>
            <option value="user_activated">تفعيل حساب</option>
            <option value="user_deactivated">تعطيل حساب</option>
            <option value="password_change">تغيير كلمة مرور</option>
            <option value="admin_reset_password">إعادة تعيين من الإدارة</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        <div class="relative">
          <select
            v-model="filterEntity"
            @change="loadLogs(1)"
            class="appearance-none ps-3.5 pe-8 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 outline-none transition-all shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
          >
            <option value="">كافة الكيانات</option>
            <option value="User">المستخدمون (User)</option>
            <option value="PersonalAccessToken">الجلسات (Token)</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-start text-xs">
          <thead>
            <tr class="text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-800">
              <th class="py-3 px-4 font-semibold text-start">#</th>
              <th class="py-3 px-4 font-semibold text-start">المستخدم المنفذ</th>
              <th class="py-3 px-4 font-semibold text-start">نوع الحركة</th>
              <th class="py-3 px-4 font-semibold text-start">الكيان المتأثر</th>
              <th class="py-3 px-4 font-semibold text-start">عنوان IP</th>
              <th class="py-3 px-4 font-semibold text-start">تاريخ الحركة</th>
              <th class="py-3 px-4 font-semibold text-end">التفاصيل</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
            <tr v-if="isLoading">
              <td colspan="7" class="py-12 text-center text-slate-400">
                <div class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                جاري استدعاء سجلات التدقيق...
              </td>
            </tr>

            <tr v-else-if="logs.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-400">
                لا توجد سجلات تدقيق مسجلة حتى الآن.
              </td>
            </tr>

            <tr v-else v-for="log in logs" :key="log.id" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
              <td class="py-3.5 px-4 font-mono text-slate-400">{{ log.id }}</td>
              <td class="py-3.5 px-4 font-bold font-mono text-slate-800 dark:text-slate-200">
                {{ log.user_code || 'نظام آلي' }}
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border" :class="getActionBadge(log.action).class">
                  {{ getActionBadge(log.action).text }}
                </span>
              </td>
              <td class="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                {{ log.entity_type }} <span v-if="log.entity_id">#{{ log.entity_id }}</span>
              </td>
              <td class="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{{ log.ip_address || '—' }}</td>
              <td class="py-3.5 px-4 text-slate-500 text-[11px]">
                {{ new Date(log.created_at).toLocaleString('ar-EG') }}
              </td>
              <td class="py-3.5 px-4 text-end">
                <button
                  @click="openDiff(log)"
                  class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
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
      <div v-if="meta.total_pages > 1" class="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          صفحة <span class="font-bold">{{ meta.current_page }}</span> من <span class="font-bold">{{ meta.total_pages }}</span> (إجمالي {{ meta.total }} سجل)
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadLogs(meta.current_page - 1)"
            :disabled="meta.current_page <= 1"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
            @click="loadLogs(meta.current_page + 1)"
            :disabled="meta.current_page >= meta.total_pages"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100"
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
