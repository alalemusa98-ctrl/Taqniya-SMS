<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  X,
  ShieldAlert,
  Laptop,
  Globe,
  Clock,
  ArrowLeft,
  Code2,
  CheckCircle2,
  Info,
  FileText,
  UserCheck,
  KeyRound,
  Shield,
  Layers,
} from 'lucide-vue-next';
import { formatDateTime } from '../../utils/formatters';

const props = defineProps<{
  isOpen: boolean;
  log?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const showTechnicalJson = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      showTechnicalJson.value = false;
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = '';
});

// Translation & Human Formatting
const formatActionText = (action: string) => {
  switch (action) {
    case 'login':
      return { text: 'تسجيل دخول ناجح', class: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50' };
    case 'logout':
      return { text: 'تسجيل خروج من النظام', class: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    case 'user_activated':
      return { text: 'تفعيل حساب المستخدم', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50' };
    case 'user_deactivated':
      return { text: 'إيقاف حساب المستخدم وإلغاء الجلسات', class: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50' };
    case 'password_change':
      return { text: 'تغيير كلمة المرور ذاتياً', class: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50' };
    case 'admin_reset_password':
      return { text: 'إعادة تعيين كلمة المرور من الإدارة', class: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50' };
    default:
      return { text: action, class: 'text-slate-700 bg-slate-100 dark:bg-slate-800 border-slate-200' };
  }
};

const formatEntityText = (entity: string) => {
  switch (entity) {
    case 'User':
      return 'حساب مستخدم';
    case 'PersonalAccessToken':
      return 'جلسة مصادقة (Token)';
    default:
      return entity;
  }
};

const getFieldMeta = (key: string) => {
  switch (key) {
    case 'is_active':
      return { label: 'حالة الحساب', icon: UserCheck, desc: 'تغيير حالة تفعيل الحساب' };
    case 'reason':
      return { label: 'سبب الإجراء', icon: FileText, desc: 'السبب المدون للتعديل' };
    case 'role_type':
      return { label: 'نوع الدور والصلاحية', icon: Shield, desc: 'الدور المؤسسي للحساب' };
    case 'password':
    case 'new_password':
    case 'password_hash':
      return { label: 'كلمة المرور', icon: KeyRound, desc: 'تحديث بيانات الحماية' };
    case 'user_code':
      return { label: 'الرمز المؤسسي', icon: Layers, desc: 'معرف تسجيل الدخول' };
    case 'last_login_at':
      return { label: 'توقيت آخر دخول', icon: Clock, desc: 'سجل نشاط المستخدم' };
    default:
      return { label: key, icon: Info, desc: 'تعديل حقل بالنظام' };
  }
};

const formatFieldValue = (key: string, val: any): { text: string; badgeClass?: string; isMuted?: boolean } => {
  if (val === null || val === undefined || val === '') {
    return { text: 'لا يوجد / غير محدد', isMuted: true };
  }

  if (key === 'is_active') {
    if (val === 1 || val === true || val === '1') {
      return {
        text: 'نشط (متاح للدخول)',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-black',
      };
    }
    return {
      text: 'معطل وموقوف (ممنوع من الدخول)',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-black',
    };
  }

  if (key === 'role_type') {
    const roles: Record<string, string> = {
      admin: 'مدير نظام',
      teacher: 'معلم',
      student: 'طالب',
      parent: 'ولي أمر',
    };
    return {
      text: roles[val] || val,
      badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 font-black',
    };
  }

  if (key.includes('password')) {
    return {
      text: '•••••••• (تم التشفير بأمان)',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-black',
    };
  }

  if (typeof val === 'boolean') {
    return { text: val ? 'نعم' : 'لا' };
  }

  if (typeof val === 'object') {
    return { text: JSON.stringify(val) };
  }

  return { text: String(val) };
};

const changesList = computed(() => {
  if (!props.log) return [];
  const oldVals = props.log.old_values || {};
  const newVals = props.log.new_values || {};

  const keys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)]));

  return keys.map((key) => {
    const hasOld = key in oldVals;
    const hasNew = key in newVals;
    const meta = getFieldMeta(key);
    const oldFormatted = hasOld ? formatFieldValue(key, oldVals[key]) : { text: 'لم تكن مسجلة مسبقاً', isMuted: true };
    const newFormatted = hasNew ? formatFieldValue(key, newVals[key]) : { text: 'تمت إزالتها', isMuted: true };

    return {
      key,
      label: meta.label,
      desc: meta.desc,
      icon: meta.icon,
      hasOld,
      hasNew,
      oldFormatted,
      newFormatted,
    };
  });
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-right">
      <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden" dir="rtl">
        <!-- Backdrop with click-to-close -->
        <div
          @click="emit('close')"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
        ></div>

        <!-- Drawer Panel docked on the RIGHT (640px) -->
        <div
          class="fixed inset-y-0 right-0 max-w-full flex drawer-right-panel"
          style="right: 0 !important; left: auto !important;"
        >
          <div
            class="w-screen max-w-[640px] h-full bg-[var(--bx-surface-solid)] border-s-2 border-bx-border shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <!-- Fixed Header (Compact) -->
            <div class="px-5 py-4 sm:px-6 border-b border-bx-border shrink-0 flex items-center justify-between bg-[var(--bx-surface-solid)]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-black border border-bx-primary/20 shadow-sm">
                  <ShieldAlert class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-display font-black text-base text-bx-title leading-snug">تفاصيل حركة التدقيق الأمني</h3>
                  <p class="text-xs text-bx-muted font-bold">مراجعة التعديلات الميدانية بدقة ووضوح</p>
                </div>
              </div>
              <button
                @click="emit('close')"
                class="bx-icon-btn p-2 rounded-xl border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-all cursor-pointer"
                title="إغلاق"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Scrollable Content Body -->
            <div class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bx-drawer-scroll">
              <!-- Action Summary Banner -->
              <div v-if="log" class="p-4 rounded-2xl border flex items-center justify-between gap-4" :class="formatActionText(log.action).class">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-black/30 shadow-xs">
                    <CheckCircle2 class="w-5 h-5" />
                  </div>
                  <div>
                    <span class="text-[11px] font-bold block opacity-75">الإجراء الذي تم تنفيذه:</span>
                    <h4 class="text-sm font-black font-display">{{ formatActionText(log.action).text }}</h4>
                  </div>
                </div>
                <span class="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-white/80 dark:bg-black/40 border border-current/20">
                  #{{ log.id }}
                </span>
              </div>

              <!-- Metadata Overview Grid -->
              <div v-if="log" class="p-5 rounded-2xl bg-[var(--bx-table-header)] border border-bx-border grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-bx-muted font-bold block mb-1">المستخدم المنفذ:</span>
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-black text-bx-primary text-sm">{{ log.user_code || 'النظام المركزي' }}</span>
                  </div>
                </div>

                <div>
                  <span class="text-bx-muted font-bold block mb-1">الجهة المتأثرة:</span>
                  <span class="font-bold text-bx-title">
                    {{ formatEntityText(log.entity_type) }} <span class="text-bx-muted font-mono">(رقم: #{{ log.entity_id || 'عام' }})</span>
                  </span>
                </div>

                <div class="col-span-2 pt-3 border-t border-bx-border/70 space-y-2 text-[11px] text-bx-muted">
                  <p class="flex items-center gap-2">
                    <Clock class="w-4 h-4 text-bx-muted shrink-0" />
                    <span class="font-bold">توقيت الحركة:</span>
                    <span class="font-mono font-bold text-bx-title">{{ formatDateTime(log.created_at) }}</span>
                  </p>
                  <p class="flex items-center gap-2">
                    <Globe class="w-4 h-4 text-bx-muted shrink-0" />
                    <span class="font-bold">عنوان الـ IP:</span>
                    <span class="font-mono font-bold text-bx-title">{{ log.ip_address || 'شبكة محلية' }}</span>
                  </p>
                  <p class="flex items-center gap-2">
                    <Laptop class="w-4 h-4 text-bx-muted shrink-0" />
                    <span class="font-bold">المتصفح / الجهاز:</span>
                    <span class="truncate font-bold text-bx-title">{{ log.user_agent || 'غير معروف' }}</span>
                  </p>
                </div>
              </div>

              <!-- Human Friendly Diff Cards (What Changed?) -->
              <div v-if="log" class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black text-bx-title flex items-center gap-2">
                    <span>بيان التعديلات والتغييرات التي تمت</span>
                  </h4>
                  <span class="text-[11px] text-bx-muted font-bold">
                    {{ changesList.length > 0 ? `${changesList.length} حقول معدلة` : 'لا توجد حقول متغيرة' }}
                  </span>
                </div>

                <!-- Case 1: Changes exist -->
                <div v-if="changesList.length > 0" class="space-y-3">
                  <div
                    v-for="item in changesList"
                    :key="item.key"
                    class="p-4 rounded-2xl border border-bx-border bg-[var(--bx-surface-solid)] shadow-xs space-y-3"
                  >
                    <!-- Field Header -->
                    <div class="flex items-center justify-between border-b border-bx-border/50 pb-2">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-bx-primary/10 text-bx-primary flex items-center justify-center">
                          <component :is="item.icon" class="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span class="font-bold text-xs text-bx-title">{{ item.label }}</span>
                          <span class="text-[10px] text-bx-muted font-mono block">{{ item.key }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Visual Before vs After -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                      <!-- Before (Old Value) -->
                      <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                        <span class="text-[10px] font-black text-rose-600 dark:text-rose-400 block">
                          القيمة السابقة قبل التعديل:
                        </span>
                        <div>
                          <span
                            v-if="item.oldFormatted.badgeClass"
                            class="inline-block px-2.5 py-1 rounded-lg text-xs"
                            :class="item.oldFormatted.badgeClass"
                          >
                            {{ item.oldFormatted.text }}
                          </span>
                          <span
                            v-else
                            class="text-xs font-bold"
                            :class="item.oldFormatted.isMuted ? 'text-bx-muted italic' : 'text-bx-text'"
                          >
                            {{ item.oldFormatted.text }}
                          </span>
                        </div>
                      </div>

                      <!-- After (New Value) -->
                      <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ArrowLeft class="w-3 h-3 rotate-180 sm:rotate-0" />
                          <span>القيمة الجديدة بعد التعديل:</span>
                        </span>
                        <div>
                          <span
                            v-if="item.newFormatted.badgeClass"
                            class="inline-block px-2.5 py-1 rounded-lg text-xs"
                            :class="item.newFormatted.badgeClass"
                          >
                            {{ item.newFormatted.text }}
                          </span>
                          <span
                            v-else
                            class="text-xs font-bold"
                            :class="item.newFormatted.isMuted ? 'text-bx-muted italic' : 'text-bx-title font-black'"
                          >
                            {{ item.newFormatted.text }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Case 2: No modified fields (e.g. Login / Logout activity) -->
                <div v-else class="p-5 text-center rounded-2xl bg-[var(--bx-table-header)] border border-bx-border space-y-1 text-xs">
                  <Info class="w-6 h-6 text-bx-muted mx-auto mb-2 opacity-60" />
                  <p class="font-bold text-bx-title">لا توجد قيم محددة تم تعديلها في هذا السجل</p>
                  <p class="text-[11px] text-bx-muted">
                    هذا السجل يوثق حركة أمنية (مثل تسجيل الدخول أو الخروج أو تدقيق الوصول) بدون تعديل على حقول البيانات.
                  </p>
                </div>

                <!-- Collapsible Developer Raw JSON View -->
                <div class="pt-2">
                  <button
                    type="button"
                    @click="showTechnicalJson = !showTechnicalJson"
                    class="flex items-center gap-2 text-xs font-bold text-bx-muted hover:text-bx-primary transition-colors cursor-pointer py-1"
                  >
                    <Code2 class="w-4 h-4" />
                    <span>{{ showTechnicalJson ? 'إخفاء البيانات البرمجية الخام (JSON)' : 'عرض البيانات البرمجية الخام (JSON للمطورين)' }}</span>
                  </button>

                  <div v-if="showTechnicalJson" class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                    <div class="p-3 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto space-y-1">
                      <span class="text-rose-400 font-bold block text-[10px]">Old Values (JSON):</span>
                      <pre class="whitespace-pre-wrap">{{ JSON.stringify(log.old_values, null, 2) || 'null' }}</pre>
                    </div>
                    <div class="p-3 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto space-y-1">
                      <span class="text-emerald-400 font-bold block text-[10px]">New Values (JSON):</span>
                      <pre class="whitespace-pre-wrap">{{ JSON.stringify(log.new_values, null, 2) || 'null' }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fixed Footer -->
            <div class="p-5 sm:p-6 border-t border-bx-border bg-[var(--bx-surface-solid)] shrink-0">
              <button
                @click="emit('close')"
                class="bx-btn bx-btn-outline bx-btn-md w-full text-xs font-bold"
              >
                إغلاق لوحة التدقيق
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
