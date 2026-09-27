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
} from 'lucide-vue-next';
import { formatDateTime } from '../../utils/formatters';

const props = defineProps<{
  isOpen: boolean;
  log?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

import { academicApi } from '../../api/academic.api';
import { teachersApi } from '../../api/teachers.api';
import { studentsApi } from '../../api/students.api';
import { guardiansApi } from '../../api/guardians.api';
import { periodSlotsApi } from '../../api/period-slots.api';
import {
  getActionInfo,
  getEntityInfo,
  getFieldMeta,
  formatFieldValue,
  parseIdArray,
} from '../../utils/audit-dictionary';

const showTechnicalJson = ref(false);

const refClassSections = ref<Map<number, string>>(new Map());
const refClasses = ref<Map<number, string>>(new Map());
const refYears = ref<Map<number, string>>(new Map());
const refTerms = ref<Map<number, string>>(new Map());
const refStages = ref<Map<number, string>>(new Map());
const refSubjects = ref<Map<number, string>>(new Map());
const refTeachers = ref<Map<number, string>>(new Map());
const refStudents = ref<Map<number, string>>(new Map());
const refGuardians = ref<Map<number, string>>(new Map());
const refPeriodSlots = ref<Map<number, string>>(new Map());
let referencesLoaded = false;

const loadReferences = async () => {
  if (referencesLoaded) return;
  try {
    const [
      yearsRes,
      termsRes,
      stagesRes,
      classesRes,
      sectionsRes,
      subjectsRes,
      teachersRes,
      studentsRes,
      guardiansRes,
      slotsRes,
    ] = await Promise.allSettled([
      academicApi.getYears({ per_page: 100 }),
      academicApi.getTerms(),
      academicApi.getStages(),
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getClassSections({ per_page: 100 }),
      academicApi.getSubjects({ per_page: 100 }),
      teachersApi.getTeachers({ per_page: 300 }),
      studentsApi.getStudents({ per_page: 500 }),
      guardiansApi.getGuardians({ per_page: 300 }),
      periodSlotsApi.getPeriodSlots({ per_page: 100 }),
    ]);

    if (yearsRes.status === 'fulfilled') {
      const items = yearsRes.value.data?.data || yearsRes.value.data || [];
      for (const y of items) {
        refYears.value.set(Number(y.id), y.name);
      }
    }

    if (termsRes.status === 'fulfilled') {
      const items = termsRes.value.data?.data || termsRes.value.data || [];
      for (const t of items) {
        refTerms.value.set(Number(t.id), t.name);
      }
    }

    if (stagesRes.status === 'fulfilled') {
      const items = stagesRes.value.data?.data || stagesRes.value.data || [];
      for (const s of items) {
        refStages.value.set(Number(s.id), s.name);
      }
    }

    if (classesRes.status === 'fulfilled') {
      const items = classesRes.value.data?.data || classesRes.value.data || [];
      for (const c of items) {
        refClasses.value.set(Number(c.id), c.name);
      }
    }

    if (sectionsRes.status === 'fulfilled') {
      const groupedClasses = sectionsRes.value.data?.data?.classes || sectionsRes.value.data?.classes || [];
      for (const cls of groupedClasses) {
        for (const sec of cls.sections || []) {
          refClassSections.value.set(Number(sec.id), `${cls.class_name} — شعبة (${sec.name})`);
        }
      }
    }

    if (subjectsRes.status === 'fulfilled') {
      const items = subjectsRes.value.data?.data || subjectsRes.value.data || [];
      for (const s of items) {
        refSubjects.value.set(Number(s.id), s.name);
      }
    }

    if (teachersRes.status === 'fulfilled') {
      const items = teachersRes.value.data?.data || teachersRes.value.data || [];
      for (const t of items) {
        refTeachers.value.set(Number(t.id), t.full_name);
      }
    }

    if (studentsRes.status === 'fulfilled') {
      const items = studentsRes.value.data?.data || studentsRes.value.data || [];
      for (const st of items) {
        refStudents.value.set(Number(st.id), st.full_name);
      }
    }

    if (guardiansRes.status === 'fulfilled') {
      const items = guardiansRes.value.data?.data || guardiansRes.value.data || [];
      for (const g of items) {
        refGuardians.value.set(Number(g.id), g.full_name);
      }
    }

    if (slotsRes.status === 'fulfilled') {
      const items = slotsRes.value.data?.data || slotsRes.value.data || [];
      for (const slot of items) {
        const timePart = slot.start_time ? ` (${slot.start_time} - ${slot.end_time})` : '';
        refPeriodSlots.value.set(Number(slot.id), `${slot.name || `الحصة ${slot.slot_number}`}${timePart}`);
      }
    }

    referencesLoaded = true;
  } catch (e) {
    console.error('Failed to load audit references:', e);
  }
};

const fetchMissingEntities = async (log: any) => {
  if (!log) return;
  const values = { ...(log.old_values || {}), ...(log.new_values || {}) };

  // 1. Missing Students
  const rawStudentIds = [
    ...(values.student_id ? [values.student_id] : []),
    ...(values.student_ids ? parseIdArray(values.student_ids) : []),
    ...(values.selected_student_ids ? parseIdArray(values.selected_student_ids) : []),
  ];
  const missingStudentIds = rawStudentIds
    .map((x) => Number(x))
    .filter((id) => !isNaN(id) && id > 0 && !refStudents.value.has(id));

  if (missingStudentIds.length > 0) {
    await Promise.allSettled(
      missingStudentIds.map(async (id) => {
        try {
          const res = await studentsApi.getStudentById(id);
          const student = res.data?.data || res.data;
          if (student?.full_name) {
            refStudents.value.set(id, student.full_name);
          }
        } catch {
          // ignore not found or network errors
        }
      }),
    );
  }

  // 2. Missing Teachers
  const rawTeacherIds = [
    ...(values.teacher_id ? [values.teacher_id] : []),
    ...(values.teacher_ids ? parseIdArray(values.teacher_ids) : []),
    ...(values.selected_teacher_ids ? parseIdArray(values.selected_teacher_ids) : []),
  ];
  const missingTeacherIds = rawTeacherIds
    .map((x) => Number(x))
    .filter((id) => !isNaN(id) && id > 0 && !refTeachers.value.has(id));

  if (missingTeacherIds.length > 0) {
    await Promise.allSettled(
      missingTeacherIds.map(async (id) => {
        try {
          const res = await teachersApi.getTeacherById(id);
          const teacher = res.data?.data || res.data;
          if (teacher?.full_name) {
            refTeachers.value.set(id, teacher.full_name);
          }
        } catch {
          // ignore
        }
      }),
    );
  }

  // 3. Missing Guardians
  const rawGuardianIds = [
    ...(values.guardian_id ? [values.guardian_id] : []),
    ...(values.guardian_ids ? parseIdArray(values.guardian_ids) : []),
  ];
  const missingGuardianIds = rawGuardianIds
    .map((x) => Number(x))
    .filter((id) => !isNaN(id) && id > 0 && !refGuardians.value.has(id));

  if (missingGuardianIds.length > 0) {
    await Promise.allSettled(
      missingGuardianIds.map(async (id) => {
        try {
          const res = await guardiansApi.getGuardianById(id);
          const guardian = res.data?.data || res.data;
          if (guardian?.full_name) {
            refGuardians.value.set(id, guardian.full_name);
          }
        } catch {
          // ignore
        }
      }),
    );
  }
};

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      showTechnicalJson.value = false;
      await loadReferences();
      if (props.log) {
        await fetchMissingEntities(props.log);
      }
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true },
);

watch(
  () => props.log,
  async (newLog) => {
    if (newLog && props.isOpen) {
      await fetchMissingEntities(newLog);
    }
  },
);

onUnmounted(() => {
  document.body.style.overflow = '';
});

const areValuesEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if ((a === null || a === undefined || a === '') && (b === null || b === undefined || b === '')) {
    return true;
  }
  if (typeof a === 'number' && typeof b === 'string' && !isNaN(Number(b))) {
    return a === Number(b);
  }
  if (typeof b === 'number' && typeof a === 'string' && !isNaN(Number(a))) {
    return Number(a) === b;
  }
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return String(a ?? '').trim() === String(b ?? '').trim();
};

const ignoredKeys = new Set(['created_at', 'updated_at', 'deleted_at']);

const changesList = computed(() => {
  if (!props.log) return [];
  const oldVals = props.log.old_values || {};
  const newVals = props.log.new_values || {};

  const allKeys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)]));

  // Only keep keys where values actually changed or were newly set/removed
  const changedKeys = allKeys.filter((key) => {
    if (ignoredKeys.has(key)) return false;

    const hasOld = key in oldVals && oldVals[key] !== null && oldVals[key] !== undefined;
    const hasNew = key in newVals && newVals[key] !== null && newVals[key] !== undefined;

    // Both exist: check for actual change
    if (hasOld && hasNew) {
      return !areValuesEqual(oldVals[key], newVals[key]);
    }

    // Only in old (cleared value)
    if (hasOld && !hasNew) {
      return oldVals[key] !== '' && oldVals[key] !== null;
    }

    // Only in new (newly assigned value)
    if (!hasOld && hasNew) {
      return newVals[key] !== '' && newVals[key] !== null;
    }

    return false;
  });

  const lookupRefs = {
    classSections: refClassSections.value,
    classes: refClasses.value,
    years: refYears.value,
    terms: refTerms.value,
    stages: refStages.value,
    subjects: refSubjects.value,
    teachers: refTeachers.value,
    students: refStudents.value,
    guardians: refGuardians.value,
    periodSlots: refPeriodSlots.value,
  };

  return changedKeys.map((key) => {
    const hasOld = key in oldVals;
    const hasNew = key in newVals;
    const meta = getFieldMeta(key);
    const oldFormatted = hasOld
      ? formatFieldValue(key, oldVals[key], oldVals, lookupRefs)
      : { text: 'لم تكن مسجلة مسبقاً', isMuted: true };
    const newFormatted = hasNew
      ? formatFieldValue(key, newVals[key], newVals, lookupRefs)
      : { text: 'تمت إزالتها', isMuted: true };

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

const isAuthLog = computed(() => {
  if (!props.log) return false;
  return ['login_failed', 'login_blocked', 'login', 'logout', 'password_change', 'admin_reset_password'].includes(
    props.log.action,
  );
});

const authEventDetails = computed(() => {
  if (!props.log || !isAuthLog.value) return null;
  const newVals = props.log.new_values || {};
  const userCode = newVals.user_code || props.log.user_code || 'غير محدد';
  const reason = newVals.reason || '';

  if (props.log.action === 'login_failed') {
    let reasonTitle = 'كلمة المرور غير صحيحة';
    let detailedDesc = `تمت محاولة تسجيل الدخول إلى الحساب بالرمز (${userCode})، ولكن تم رفض المحاولة لأن كلمة المرور المدخلة كانت خاطئة.`;
    let isWrongPassword = true;

    if (reason === 'user_not_found') {
      reasonTitle = 'الرمز المؤسسي غير مسجل';
      detailedDesc = `تمت محاولة تسجيل الدخول بالرمز (${userCode})، ولكن هذا الحساب غير موجود أو غير مسجل بالنظام.`;
      isWrongPassword = false;
    } else if (reason === 'account_inactive') {
      reasonTitle = 'الحساب معطل وموقوف';
      detailedDesc = `تمت محاولة تسجيل الدخول للحساب (${userCode})، ولكن الحساب معطل وموقوف إدارياً.`;
      isWrongPassword = false;
    }

    return {
      actionType: 'login_failed',
      title: 'محاولة تسجيل دخول فاشلة',
      badgeText: 'محاولة فاشلة',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
      reasonTitle,
      detailedDesc,
      userCode,
      isWrongPassword,
    };
  }

  if (props.log.action === 'login_blocked') {
    return {
      actionType: 'login_blocked',
      title: 'حظر محاولة تسجيل الدخول',
      badgeText: 'محاولة محظورة',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-black',
      reasonTitle: 'حظر الدخول - الحساب معطل',
      detailedDesc: `تم حظر محاولة الدخول للحساب (${userCode}) لأن الحساب موقوف إدارياً من قِبل إدارة المدرسة.`,
      userCode,
      isWrongPassword: false,
    };
  }

  if (props.log.action === 'login') {
    return {
      actionType: 'login',
      title: 'تسجيل دخول ناجح',
      badgeText: 'دخول ناجح',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold',
      reasonTitle: 'تمت المصادقة بنجاح',
      detailedDesc: `تم التحقق من بيانات الدخول بنجاح للمستخدم (${userCode}) وتوليد جلسة عمل معتمدة.`,
      userCode,
      isWrongPassword: false,
    };
  }

  if (props.log.action === 'logout') {
    return {
      actionType: 'logout',
      title: 'تسجيل خروج',
      badgeText: 'تسجيل خروج',
      badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30 font-bold',
      reasonTitle: 'إنهاء الجلسة',
      detailedDesc: `تم تسجيل الخروج وإنهاء جلسة العمل للمستخدم (${userCode}) بنجاح.`,
      userCode,
      isWrongPassword: false,
    };
  }

  return null;
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
            class="w-screen max-w-[640px] h-full bg-bx-surface border-s-2 border-bx-border shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <!-- Fixed Header (Compact) -->
            <div class="px-5 py-4 sm:px-6 border-b border-bx-border shrink-0 flex items-center justify-between bg-bx-surface">
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
              <div v-if="log" class="p-4 rounded-2xl border flex items-center justify-between gap-4" :class="getActionInfo(log.action).badgeClass">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-black/30 shadow-xs">
                    <CheckCircle2 class="w-5 h-5" />
                  </div>
                  <div>
                    <span class="text-[11px] font-bold block opacity-75">الإجراء الذي تم تنفيذه:</span>
                    <h4 class="text-sm font-black font-display">{{ getActionInfo(log.action).text }}</h4>
                  </div>
                </div>
                <span class="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-white/80 dark:bg-black/40 border border-current/20">
                  #{{ log.id }}
                </span>
              </div>

              <!-- Metadata Overview Grid -->
              <div v-if="log" class="p-5 rounded-2xl bg-bx-table-header border border-bx-border grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-bx-muted font-bold block mb-1">المستخدم المنفذ:</span>
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-black text-bx-primary text-sm">{{ log.user_code || 'النظام المركزي' }}</span>
                  </div>
                </div>

                <div>
                  <span class="text-bx-muted font-bold block mb-1">الجهة المتأثرة:</span>
                  <span class="font-bold text-bx-title">
                    {{ getEntityInfo(log.entity_type).label }} <span class="text-bx-muted font-mono">(رقم: #{{ log.entity_id || 'عام' }})</span>
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

              <!-- Case A: Authentication / Security Event Card (Login, Failed Login, Blocked, etc.) -->
              <div v-if="authEventDetails" class="space-y-4">
                <div class="p-5 rounded-2xl bg-rose-500/[0.05] dark:bg-rose-500/[0.08] border border-rose-500/25 space-y-4 shadow-sm">
                  <div class="flex items-center justify-between gap-2 border-b border-rose-500/15 pb-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-xs">
                        <ShieldAlert class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="text-sm font-black text-bx-title font-display">{{ authEventDetails.title }}</h4>
                        <span class="text-xs font-bold text-rose-600 dark:text-rose-400">{{ authEventDetails.reasonTitle }}</span>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black border" :class="authEventDetails.badgeClass">
                      {{ authEventDetails.badgeText }}
                    </span>
                  </div>

                  <!-- Narrative explanation of what happened -->
                  <div class="p-4 rounded-xl bg-bx-surface border border-rose-500/20 text-xs text-bx-title leading-relaxed space-y-3">
                    <div class="flex items-start gap-2.5">
                      <Info class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span class="font-bold text-bx-muted block text-[11px] mb-0.5">تفاصيل الواقعة:</span>
                        <p class="font-bold text-bx-title leading-normal">{{ authEventDetails.detailedDesc }}</p>
                      </div>
                    </div>

                    <!-- Target Account & Result Grid -->
                    <div class="pt-3 border-t border-bx-border/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div class="p-2.5 rounded-lg bg-bx-table-header border border-bx-border/60">
                        <span class="text-bx-muted font-bold block text-[10.5px] mb-1">الحساب المستهدف (الرمز المؤسسي):</span>
                        <span class="font-mono font-black text-bx-primary text-sm">{{ authEventDetails.userCode }}</span>
                      </div>
                      <div class="p-2.5 rounded-lg bg-bx-table-header border border-bx-border/60">
                        <span class="text-bx-muted font-bold block text-[10.5px] mb-1">النتيجة الأمنية:</span>
                        <span class="font-bold text-rose-600 dark:text-rose-400 text-xs">
                          {{ authEventDetails.actionType === 'login_failed' ? 'رفض تسجيل الدخول (كلمة مرور غير مطابقة)' : authEventDetails.actionType === 'login_blocked' ? 'حظر محاولة الدخول' : 'تمت المصادقة بنجاح' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Case B: Standard Data Field Modifications (What Changed?) -->
              <div v-else-if="log" class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black text-bx-title flex items-center gap-2">
                    <span>بيان التعديلات والتغييرات التي تمت</span>
                  </h4>
                  <span class="text-[11px] text-bx-muted font-bold">
                    {{ changesList.length > 0 ? `${changesList.length} حقول معدلة` : 'لا توجد حقول متغيرة' }}
                  </span>
                </div>

                <!-- Case B1: Changes exist -->
                <div v-if="changesList.length > 0" class="space-y-3">
                  <div
                    v-for="item in changesList"
                    :key="item.key"
                    class="p-4 rounded-2xl border border-bx-border bg-bx-surface shadow-xs space-y-3"
                  >
                    <!-- Field Header -->
                    <div class="flex items-center justify-between border-b border-bx-border/50 pb-2">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-bx-primary/10 text-bx-primary flex items-center justify-center">
                          <component :is="item.icon" class="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span class="font-bold text-xs text-bx-title">{{ item.label }}</span>
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

                <!-- Case B2: No modified fields (e.g. Activity records) -->
                <div v-else class="p-5 text-center rounded-2xl bg-bx-table-header border border-bx-border space-y-1 text-xs">
                  <Info class="w-6 h-6 text-bx-muted mx-auto mb-2 opacity-60" />
                  <p class="font-bold text-bx-title">لا توجد قيم محددة تم تعديلها في هذا السجل</p>
                  <p class="text-[11px] text-bx-muted">
                    هذا السجل يوثق حركة أمنية بدون تعديل على حقول البيانات.
                  </p>
                </div>
              </div>

              <!-- Collapsible Developer Raw JSON View -->
              <div v-if="log" class="pt-2">
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
