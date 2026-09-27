<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import {
  academicApi,
  type ClassAcademicTermsGroupItem,
  type ClassTermItem,
  type AcademicClassItem,
  type AcademicTermItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));
const TaqniyaModal = defineAsyncComponent(() => import('../ui/TaqniyaModal.vue'));
import {
  Plus,
  Zap,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  GraduationCap,
  CalendarDays,
  Info,
  ArrowRight,
  FileSpreadsheet,
  Users,
} from 'lucide-vue-next';

const router = useRouter();
const toast = useToast();
const loading = ref(false);
const rawGroups = ref<ClassAcademicTermsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const terms = ref<AcademicTermItem[]>([]);
const stages = ref<any[]>([]);

// Search & Status Pill Filter (matching design system: الكل / نشط / معلق / مكتمل)
const search = ref('');
const statusPill = ref<'all' | 'active' | 'inactive' | 'closed'>('all');

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawer state for Create / Edit / Details
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit' | 'details'>('create');
const activeTermToEdit = ref<ClassTermItem | null>(null);
const activeRowDetails = ref<any | null>(null);
const isSubmitting = ref(false);

// Delete / Unassign Modal
const showDeleteModal = ref(false);
const itemToDelete = ref<{ id: number; name: string } | null>(null);
const isDeleting = ref(false);

const form = ref({
  class_id: 0,
  academic_term_id: 0,
});

async function fetchPredecessors() {
  try {
    const [cRes, tRes, sRes] = await Promise.all([
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getTerms(),
      academicApi.getStages(),
    ]);
    classes.value = cRes.data?.data?.classes || cRes.data?.data || [];
    terms.value = tRes.data?.data || [];
    stages.value = sRes.data?.data || [];
  } catch (err: any) {
    console.error('Failed to load predecessor data', err);
  }
}

async function fetchClassTerms(silent = false) {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  if (!silent) {
    loading.value = true;
  }
  try {
    const res = await academicApi.getClassAcademicTerms({ per_page: 100 }, activeAbortController.signal);
    rawGroups.value = res.data?.data?.classes || [];
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    const msg = err.response?.data?.message || 'تعذر تحميل فترات وحالات الصفوف.';
    toast.error(msg);
  } finally {
    if (!silent && !activeAbortController?.signal.aborted) {
      loading.value = false;
    }
  }
}

// Map stage names by stage_id
const classStageMap = computed(() => {
  const map: Record<number, string> = {};
  for (const c of classes.value) {
    const st = stages.value.find((s) => s.id === (c as any).stage_id);
    map[c.id] = st ? st.name : 'التعليم العام';
  }
  return map;
});

// Stage badge style helper
function getStageBadgeClass(stageName: string) {
  if (stageName.includes('روضة') || stageName.includes('تمهيدي')) {
    return 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10';
  }
  if (stageName.includes('ابتدائي')) {
    return 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10';
  }
  if (stageName.includes('إعدادي')) {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
  }
  if (stageName.includes('ثانوي')) {
    return 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10';
  }
  return 'border-[#B4AED8]/60 dark:border-white/10 text-bx-muted bg-slate-500/10';
}

export interface UnifiedTermRow {
  id: number;
  code: string;
  class_id: number;
  class_name: string;
  stage_name: string;
  term_id: number;
  term_name: string;
  letter: string;
  letterColor: string;
  statusLabel: string;
  statusClass: string;
  is_active: number;
  is_closed: number;
  raw: ClassTermItem;
}

export interface ClassMatrixCell {
  term_id: number;
  term_name: string;
  isAssigned: boolean;
  row?: UnifiedTermRow;
}

export interface ClassMatrixRow {
  class_id: number;
  class_name: string;
  stage_name: string;
  stage_id: number;
  grade_level: number;
  cells: Record<number, ClassMatrixCell>;
  assignedTermsCount: number;
  activeTermsCount: number;
}

// Sorted official terms (e.g. Term 1, Term 2, Term 3)
const sortedTerms = computed<AcademicTermItem[]>(() => {
  return [...terms.value].sort((a, b) => {
    const numA = (a as any).term_number ?? Number(a.id);
    const numB = (b as any).term_number ?? Number(b.id);
    return numA - numB;
  });
});

// Matrix Rows computed for all classes
const matrixRows = computed<ClassMatrixRow[]>(() => {
  return classes.value.map((cls) => {
    const stageName = classStageMap.value[cls.id] || 'التعليم العام';
    const grp = (rawGroups.value || []).find((g) => g.class_id === cls.id);
    const assignedTermsList = grp?.terms || [];

    const cells: Record<number, ClassMatrixCell> = {};
    let assignedCount = 0;
    let activeCount = 0;

    for (const term of sortedTerms.value) {
      const assigned = assignedTermsList.find((t) => t.academic_term_id === term.id);
      if (assigned) {
        assignedCount++;
        if (assigned.is_active === 1) activeCount++;

        let statusLabel = 'معلق';
        let statusClass = 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10';

        if (assigned.is_closed === 1) {
          statusLabel = 'مكتمل';
          statusClass = 'border-slate-500/30 text-slate-500 dark:text-slate-400 bg-slate-500/10';
        } else if (assigned.is_active === 1) {
          statusLabel = 'نشط';
          statusClass = 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
        }

        const unifiedRow: UnifiedTermRow = {
          id: assigned.id,
          code: `TQ-${String(assigned.id).padStart(3, '0')}#`,
          class_id: cls.id,
          class_name: cls.name,
          stage_name: stageName,
          term_id: term.id,
          term_name: term.name,
          letter: (term as any).term_number ? `ف${(term as any).term_number}` : 'ف',
          letterColor: 'border-purple-500 text-purple-400 bg-purple-500/10',
          statusLabel,
          statusClass,
          is_active: assigned.is_active,
          is_closed: assigned.is_closed,
          raw: assigned,
        };

        cells[term.id] = {
          term_id: term.id,
          term_name: term.name,
          isAssigned: true,
          row: unifiedRow,
        };
      } else {
        cells[term.id] = {
          term_id: term.id,
          term_name: term.name,
          isAssigned: false,
        };
      }
    }

    return {
      class_id: cls.id,
      class_name: cls.name,
      stage_name: stageName,
      stage_id: (cls as any).stage_id || 0,
      grade_level: (cls as any).grade_level || 0,
      cells,
      assignedTermsCount: assignedCount,
      activeTermsCount: activeCount,
    };
  });
});

// Filtered matrix rows based on search and status pill filter
const filteredMatrixRows = computed(() => {
  return matrixRows.value.filter((row) => {
    // Status filter
    if (statusPill.value === 'active' && row.activeTermsCount === 0) return false;
    if (statusPill.value === 'inactive') {
      const hasInactive = Object.values(row.cells).some(
        (c) => c.isAssigned && c.row?.is_active === 0 && c.row?.is_closed === 0,
      );
      if (!hasInactive) return false;
    }
    if (statusPill.value === 'closed') {
      const hasClosed = Object.values(row.cells).some((c) => c.isAssigned && c.row?.is_closed === 1);
      if (!hasClosed) return false;
    }

    // Search query
    if (search.value.trim()) {
      const q = search.value.trim().toLowerCase();
      const matchClass = row.class_name.toLowerCase().includes(q);
      const matchStage = row.stage_name.toLowerCase().includes(q);
      return matchClass || matchStage;
    }

    return true;
  });
});

// Total assigned terms count
const totalAssignedTermsCount = computed(() => {
  return (filteredMatrixRows.value || []).reduce((acc, r) => acc + r.assignedTermsCount, 0);
});

// Drawer & Actions
function openDetails(row: UnifiedTermRow) {
  activeRowDetails.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openCreateDrawer(classId?: number, termId?: number) {
  drawerMode.value = 'create';
  activeTermToEdit.value = null;
  const targetClassId = classId || classes.value[0]?.id || 0;
  form.value = {
    class_id: targetClassId,
    academic_term_id: termId || 0,
  };

  if (termId) {
    selectedTermIds.value = [termId];
  } else {
    // Pre-select first available unassigned term
    const assigned = (rawGroups.value.find((g) => g.class_id === targetClassId)?.terms || []).map(
      (t) => t.academic_term_id,
    );
    const firstAvailable = terms.value.find((t) => !assigned.includes(t.id));
    selectedTermIds.value = firstAvailable ? [firstAvailable.id] : [];
  }
  showDrawer.value = true;
}

function openEditFromDetails(row: UnifiedTermRow) {
  drawerMode.value = 'edit';
  activeTermToEdit.value = row.raw;
  form.value = {
    class_id: row.class_id,
    academic_term_id: row.term_id,
  };
  selectedTermIds.value = [row.term_id];
  showDrawer.value = true;
}

// Checkbox Multi-Term Selection State (Taqniya Checks Matrix)
const selectedTermIds = ref<number[]>([]);

// Determine terms already assigned to the chosen class
const currentAssignedTermIds = computed<number[]>(() => {
  if (!form.value.class_id) return [];
  const grp = rawGroups.value.find((g) => g.class_id === form.value.class_id);
  if (!grp) return [];
  return (grp.terms || [])
    .filter((t) => (drawerMode.value === 'edit' ? t.id !== activeTermToEdit.value?.id : true))
    .map((t) => t.academic_term_id);
});

// Term options with assigned/disabled state for custom checks
const termOptionsWithState = computed(() => {
  return terms.value.map((t) => {
    const isAlreadyAssigned = currentAssignedTermIds.value.includes(t.id);
    return {
      id: t.id,
      name: t.name,
      term_number: (t as any).term_number || t.id,
      disabled: isAlreadyAssigned,
    };
  });
});

function toggleTerm(termId: number) {
  if (drawerMode.value === 'edit') {
    selectedTermIds.value = [termId];
    form.value.academic_term_id = termId;
    return;
  }

  if (selectedTermIds.value.includes(termId)) {
    selectedTermIds.value = selectedTermIds.value.filter((id) => id !== termId);
  } else {
    selectedTermIds.value.push(termId);
  }
}

// Reset selected terms when changing target class
watch(
  () => form.value.class_id,
  (newClassId) => {
    if (drawerMode.value === 'create' && newClassId) {
      const assigned = (rawGroups.value.find((g) => g.class_id === newClassId)?.terms || []).map(
        (t) => t.academic_term_id,
      );
      selectedTermIds.value = selectedTermIds.value.filter((id) => !assigned.includes(id));
      if (selectedTermIds.value.length === 0) {
        const firstAvailable = terms.value.find((t) => !assigned.includes(t.id));
        if (firstAvailable) selectedTermIds.value = [firstAvailable.id];
      }
    }
  },
);

function confirmDelete(row: UnifiedTermRow | ClassTermItem) {
  const isAct = 'is_active' in row ? row.is_active === 1 : false;
  const name = 'term_name' in row ? row.term_name : '';
  const id = row.id;

  if (isAct) {
    toast.warning('لا يمكن فك ارتباط الفترة النشطة حالياً للصف الدراسي.');
    return;
  }
  itemToDelete.value = { id, name };
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!itemToDelete.value) return;
  const deletedId = itemToDelete.value.id;
  isDeleting.value = true;
  try {
    await academicApi.deleteClassAcademicTerm(deletedId);
    for (const grp of rawGroups.value) {
      if (grp.terms) {
        grp.terms = grp.terms.filter((t: any) => t.id !== deletedId);
      }
    }
    showDeleteModal.value = false;
    showDrawer.value = false;
    toast.success('تم فك ارتباط الفترة بالصف الدراسي بنجاح.');
    await fetchClassTerms(true);
  } catch (err: any) {
    showDeleteModal.value = false;
    const msg = err.response?.data?.message || 'تعذر فك ارتباط الفترة لوجود مواد مسندة بها.';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
    itemToDelete.value = null;
  }
}

async function handleSave() {
  if (!form.value.class_id) {
    toast.warning('يرجى اختيار الصف الدراسي المستهدف.');
    return;
  }

  if (drawerMode.value === 'create') {
    if (selectedTermIds.value.length === 0) {
      toast.warning('يرجى تحديد فترة دراسية واحدة على الأقل بواسطة مربعات الاختيار.');
      return;
    }

    isSubmitting.value = true;
    try {
      let count = 0;
      for (const termId of selectedTermIds.value) {
        await academicApi.createClassAcademicTerm({
          class_id: form.value.class_id,
          academic_term_id: termId,
        });
        count++;
      }
      toast.success(count > 1 ? `تم تخصيص ${count} فترات دراسية للصف بنجاح.` : 'تم تخصيص الفترة للصف بنجاح.');
      showDrawer.value = false;
      await fetchClassTerms(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء تخصيص الفترات للصف.';
      toast.error(msg);
    } finally {
      isSubmitting.value = false;
    }
  } else if (activeTermToEdit.value) {
    const termId = selectedTermIds.value[0] || form.value.academic_term_id;
    if (!termId) {
      toast.warning('يرجى اختيار الفترة الدراسية.');
      return;
    }

    isSubmitting.value = true;
    try {
      const res = await academicApi.updateClassAcademicTerm(activeTermToEdit.value.id, {
        class_id: form.value.class_id,
        academic_term_id: termId,
      });
      toast.success(res.data?.message || 'تم تحديث فترة الصف بنجاح.');
      showDrawer.value = false;
      await fetchClassTerms(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ فترة الصف.';
      toast.error(msg);
    } finally {
      isSubmitting.value = false;
    }
  }
}

// Activation Modals & Guard States
const showActivationWarningModal = ref(false);
const showActivationConfirmModal = ref(false);
const isCheckingActivation = ref(false);
const isActivating = ref(false);
const activationCheckData = ref<any>(null);
const targetTermToActivate = ref<{ id: number; term_name?: string; class_name?: string } | null>(null);

async function requestActivate(termId: number, termName?: string, className?: string) {
  isCheckingActivation.value = true;
  targetTermToActivate.value = { id: termId, term_name: termName, class_name: className };
  try {
    const res = await academicApi.checkClassAcademicTermActivation(termId);
    if (res.data?.success) {
      activationCheckData.value = res.data;
      if (res.data.can_activate) {
        showActivationConfirmModal.value = true;
      } else {
        showActivationWarningModal.value = true;
      }
    } else {
      toast.error(res.data?.message || 'تعذر التحقق من حالة تفعيل الفصل.');
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر التحقق من متطلبات تفعيل الفصل.';
    toast.error(msg);
  } finally {
    isCheckingActivation.value = false;
  }
}

async function confirmActivation(force = false) {
  if (!targetTermToActivate.value) return;
  const activatedId = targetTermToActivate.value.id;
  isActivating.value = true;
  try {
    const res = await academicApi.activateClassAcademicTerm(activatedId, force);
    toast.success(res.data?.message || 'تم تفعيل الفصل الدراسي للصف بنجاح.');
    if (activeRowDetails.value && activeRowDetails.value.id === activatedId) {
      activeRowDetails.value.is_active = 1;
    }
    showActivationConfirmModal.value = false;
    showActivationWarningModal.value = false;
    showDrawer.value = false;
    await fetchClassTerms(true);
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تفعيل الفصل الدراسي.';
    toast.error(msg);
  } finally {
    isActivating.value = false;
  }
}

function goToGradeEntry() {
  const classId = activationCheckData.value?.data?.class_id;
  const termId = activationCheckData.value?.data?.previous_term_id;
  showActivationWarningModal.value = false;
  if (classId) {
    router.push({
      path: '/grade-entry',
      query: { class_id: classId, term_id: termId },
    });
  } else {
    router.push('/grade-entry');
  }
}

async function handleToggleClose(termId: number) {
  try {
    const res = await academicApi.closeClassAcademicTerm(termId);
    toast.success(res.data?.message || 'تم تغيير حالة إغلاق درجات الفترة للصف بنجاح.');
    fetchClassTerms();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تغيير حالة قفل الفترة.';
    toast.error(msg);
  }
}

const classFormOptions = computed(() =>
  classes.value.map((c) => ({
    value: c.id,
    label: c.name,
    code: (c as any).code || `CLS-${c.id}`,
  })),
);

onMounted(async () => {
  await fetchPredecessors();
  await fetchClassTerms();
});
</script>

<template>
  <div class="space-y-4 font-sans" dir="rtl">
    <!-- Unified Container Card (Matching the Reference Design System) -->
    <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
      <!-- Card Header: Title on Right, Controls & Filters on Left -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
        <!-- Title -->
        <div>
          <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
            مصفوفة فترات الصفوف الموحدة
          </h2>
          <p class="text-xs text-bx-muted font-medium mt-1">
            جدول المصفوفة الشبكية لعرض حالات تفعيل الفترات الدراسية وإغلاق الرصد لكافة الصفوف في نظرة واحدة
          </p>
        </div>

        <!-- Controls: Search Input + Status Pills + Add Button -->
        <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <!-- Add Button -->
          <button
            @click="openCreateDrawer()"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>تخصيص فترة</span>
          </button>

          <!-- Search Input (Pill Shaped) -->
          <div class="relative flex-1 sm:w-60">
            <input
              v-model="search"
              type="text"
              placeholder="بحث بالصف أو المرحلة..."
              class="w-full px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
            />
          </div>

          <!-- Status Pill Segmented Filters -->
          <div class="flex items-center gap-1.5 p-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent">
            <button
              @click="statusPill = 'all'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="
                statusPill === 'all'
                  ? 'bg-bx-primary text-white shadow-sm'
                  : 'text-bx-muted hover:text-bx-title'
              "
            >
              الكل
            </button>
            <button
              @click="statusPill = 'active'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="
                statusPill === 'active'
                  ? 'bg-bx-primary text-white shadow-sm'
                  : 'text-bx-muted hover:text-bx-title'
              "
            >
              نشط
            </button>
            <button
              @click="statusPill = 'inactive'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="
                statusPill === 'inactive'
                  ? 'bg-bx-primary text-white shadow-sm'
                  : 'text-bx-muted hover:text-bx-title'
              "
            >
              معلق
            </button>
            <button
              @click="statusPill = 'closed'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="
                statusPill === 'closed'
                  ? 'bg-bx-primary text-white shadow-sm'
                  : 'text-bx-muted hover:text-bx-title'
              "
            >
              مكتمل
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-24 text-center text-bx-muted">
        <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
        <span class="text-xs font-bold">جاري تحميل مصفوفة فترات الصفوف...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!filteredMatrixRows || filteredMatrixRows.length === 0"
        class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
      >
        <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
        <h3 class="text-sm font-bold text-bx-title">لا توجد صفوف تطابق محددات البحث والتصفية</h3>
        <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو تخصيص فترة لصف دراسي جديد.</p>
      </div>

      <!-- Matrix Table Content: Enclosed in a Bordered Card (Right, Left, Top, Bottom) -->
      <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-start border-collapse text-xs">
            <!-- Table Header -->
            <thead>
              <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
                <!-- Column 1: Sticky Class & Stage Column -->
                <th class="py-4 px-5 font-bold text-start whitespace-nowrap min-w-[240px] sticky start-0 bg-[var(--bx-table-header)] z-20 border-e border-[#B4AED8]/50 dark:border-white/[0.08]">
                  <div class="flex items-center gap-2">
                    <GraduationCap class="w-4 h-4 text-bx-primary" />
                    <span>الصف الدراسي والمرحلة</span>
                  </div>
                </th>

                <!-- Columns 2..N: Dynamic Official Academic Terms -->
                <th
                  v-for="term in sortedTerms"
                  :key="term.id"
                  class="py-4 px-5 font-bold text-center whitespace-nowrap min-w-[230px] border-e border-[#B4AED8]/50 dark:border-white/[0.08] last:border-e-0"
                >
                  <div class="flex flex-col items-center justify-center gap-0.5">
                    <div class="flex items-center gap-1.5 text-bx-title font-black text-sm">
                      <CalendarDays class="w-3.5 h-3.5 text-bx-primary" />
                      <span>{{ term.name }}</span>
                    </div>
                    <span class="text-[10px] font-mono text-bx-muted">TERM-{{ String(term.id).padStart(2, '0') }}#</span>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Table Body with Crisp Dividers -->
            <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/[0.08]">
              <tr
                v-for="row in filteredMatrixRows"
                :key="row.class_id"
                class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors"
              >
                <!-- Fixed First Column (Class Info) -->
                <td class="py-4 px-5 whitespace-nowrap sticky start-0 bg-[var(--bx-surface-solid)] z-10 border-e border-[#B4AED8]/50 dark:border-white/[0.08]">
                  <div class="space-y-1.5">
                    <span class="font-black text-sm text-bx-title block leading-tight">{{ row.class_name }}</span>
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border" :class="getStageBadgeClass(row.stage_name)">
                        {{ row.stage_name }}
                      </span>
                      <span class="text-[10px] font-semibold text-bx-muted">
                        {{ row.assignedTermsCount }} فصول مخصصة
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Term Matrix Cells -->
                <td
                  v-for="term in sortedTerms"
                  :key="term.id"
                  class="py-3 px-4 text-center align-middle border-e border-[#B4AED8]/50 dark:border-white/[0.08] last:border-e-0"
                >
                  <!-- CASE 1: Term Assigned to this Class -->
                  <div
                    v-if="row.cells[term.id]?.isAssigned && row.cells[term.id]?.row"
                    class="p-3.5 rounded-2xl border transition-all duration-200 text-start space-y-3 group hover:-translate-y-0.5 hover:shadow-md"
                    :class="[
                      row.cells[term.id]!.row!.is_active === 1
                        ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent dark:from-emerald-500/20 dark:via-emerald-500/5 dark:to-transparent ring-1 ring-emerald-500/30 shadow-xs'
                        : row.cells[term.id]!.row!.is_closed === 1
                        ? 'border-slate-300 dark:border-white/10 bg-slate-500/[0.04]'
                        : 'border-[#B4AED8]/70 dark:border-white/10 bg-[var(--bx-surface-solid)] hover:border-bx-primary/40'
                    ]"
                  >
                    <!-- Header: Reference Code & Status Badge -->
                    <div class="flex items-center justify-between gap-2">
                      <!-- Reference Code Tag -->
                      <span class="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black bg-purple-500/[0.06] dark:bg-white/[0.05] border border-[#B4AED8]/40 dark:border-white/10 text-bx-title/70">
                        {{ row.cells[term.id]!.row!.code }}
                      </span>

                      <!-- Status Badge -->
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 shadow-2xs"
                        :class="[
                          row.cells[term.id]!.row!.is_active === 1
                            ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/15'
                            : row.cells[term.id]!.row!.is_closed === 1
                            ? 'border-slate-400/40 text-slate-600 dark:text-slate-300 bg-slate-500/15'
                            : 'border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/15'
                        ]"
                      >
                        <!-- Beacon indicator for active -->
                        <span v-if="row.cells[term.id]!.row!.is_active === 1" class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <Lock v-else-if="row.cells[term.id]!.row!.is_closed === 1" class="w-3 h-3 text-slate-500" />
                        <span v-else class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>{{ row.cells[term.id]!.row!.statusLabel }}</span>
                      </span>
                    </div>

                    <!-- Bottom Bar: Status Context Label on right, Circular Action Buttons on left -->
                    <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#B4AED8]/30 dark:border-white/[0.06]">
                      <!-- Context Label -->
                      <div class="text-[10px] font-bold text-bx-muted truncate">
                        <span v-if="row.cells[term.id]!.row!.is_active === 1" class="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                          الفترة الحالية
                        </span>
                        <span v-else-if="row.cells[term.id]!.row!.is_closed === 1" class="text-slate-500 font-bold">
                          الرصد مغلق
                        </span>
                        <span v-else class="text-bx-muted font-medium">
                          غير نشط
                        </span>
                      </div>

                      <!-- Circular Action Buttons -->
                      <div class="flex items-center gap-1.5 shrink-0">
                        <!-- Details Button -->
                        <button
                          @click="openDetails(row.cells[term.id]!.row!)"
                          class="w-7 h-7 rounded-full border border-[#B4AED8]/60 dark:border-white/10 bg-white dark:bg-white/[0.05] text-bx-muted hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
                          title="عرض تفاصيل الفترة"
                        >
                          <Eye class="w-3.5 h-3.5" />
                        </button>

                        <!-- Quick Activate Button (when not already active) -->
                        <button
                          v-if="row.cells[term.id]!.row!.is_active !== 1"
                          @click="requestActivate(row.cells[term.id]!.row!.id, row.cells[term.id]!.row!.term_name, row.class_name)"
                          class="w-7 h-7 rounded-full border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-sm hover:shadow-emerald-500/30 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs hover:scale-110 active:scale-95 disabled:opacity-50"
                          :disabled="isCheckingActivation && targetTermToActivate?.id === row.cells[term.id]!.row!.id"
                          title="تفعيل هذا الفصل للصف"
                        >
                          <Loader2 v-if="isCheckingActivation && targetTermToActivate?.id === row.cells[term.id]!.row!.id" class="w-3.5 h-3.5 animate-spin" />
                          <Zap v-else class="w-3.5 h-3.5" />
                        </button>

                        <!-- Lock / Unlock Toggle -->
                        <button
                          @click="handleToggleClose(row.cells[term.id]!.row!.id)"
                          class="w-7 h-7 rounded-full border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-600 hover:shadow-sm hover:shadow-amber-500/30 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
                          :title="row.cells[term.id]!.row!.is_closed === 1 ? 'فتح رصد الدرجات' : 'إغلاق رصد الدرجات'"
                        >
                          <component :is="row.cells[term.id]!.row!.is_closed === 1 ? Lock : Unlock" class="w-3.5 h-3.5" />
                        </button>

                        <!-- Unassign / Delete Button (when not active) -->
                        <button
                          v-if="row.cells[term.id]!.row!.is_active !== 1"
                          @click="confirmDelete(row.cells[term.id]!.row!)"
                          class="w-7 h-7 rounded-full border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-sm hover:shadow-rose-500/30 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
                          title="فك الارتباط بهذا الفصل"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- CASE 2: Term Unassigned (e.g. 3rd Term in Kindergarten) -->
                  <div
                    v-else
                    class="h-full min-h-[92px] p-3.5 rounded-2xl border-2 border-dashed border-[#B4AED8]/40 dark:border-white/10 bg-slate-500/[0.02] dark:bg-white/[0.01] flex flex-col items-center justify-center gap-2 transition-all duration-200 group hover:border-bx-primary/50 hover:bg-purple-500/[0.03]"
                  >
                    <div class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                      <span class="text-xs font-black tracking-wider">—</span>
                      <span class="text-[11px] font-bold">غير مدرج بالخطة</span>
                    </div>
                    <button
                      @click="openCreateDrawer(row.class_id, term.id)"
                      class="opacity-80 group-hover:opacity-100 text-[10px] font-black text-bx-primary hover:text-white hover:bg-bx-primary cursor-pointer inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 hover:shadow-xs border border-purple-500/20 transition-all duration-150 active:scale-95"
                    >
                      <Plus class="w-3 h-3" />
                      <span>تخصيص الفصل</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table Footer: Records Count & Full Comprehensive View -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 text-xs font-bold text-bx-muted">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
          <span>إجمالي الصفوف في المصفوفة: <strong class="text-bx-title font-black">{{ filteredMatrixRows?.length || 0 }}</strong> صفوف (مجموع <strong class="text-bx-title font-black">{{ totalAssignedTermsCount }}</strong> فترات مخصصة)</span>
        </div>
        <div class="text-[11px] text-bx-muted">
          عرض شبكي شامل بدون تجزئة صفحات (Academic Matrix View)
        </div>
      </div>
    </div>

    <!-- Details / Actions Drawer -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      :title="
        drawerMode === 'details'
          ? 'تفاصيل تخصيص الفترة'
          : drawerMode === 'create'
          ? 'تخصيص فترة لصف دراسي'
          : 'تعديل تخصيص الفترة'
      "
      @close="showDrawer = false"
    >
      <!-- View Details Mode -->
      <div v-if="drawerMode === 'details' && activeRowDetails" class="space-y-6">
        <div class="p-5 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-3 shadow-xs">
          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">الرمز المرجعي</span>
            <span class="font-mono font-bold text-xs text-bx-primary">{{ activeRowDetails.code }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">الصف الدراسي</span>
            <span class="font-black text-xs text-bx-title">{{ activeRowDetails.class_name }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">المرحلة التعليمية</span>
            <span class="font-semibold text-xs text-bx-title">{{ activeRowDetails.stage_name }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">الفترة الرسمية</span>
            <span class="font-black text-xs text-bx-title">{{ activeRowDetails.term_name }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
            <span class="text-xs font-bold text-bx-muted">حالة التفعيل</span>
            <span
              class="px-3 py-0.5 rounded-full text-[11px] font-bold border"
              :class="activeRowDetails.is_active === 1 ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-slate-500/30 text-bx-muted bg-slate-500/10'"
            >
              {{ activeRowDetails.is_active === 1 ? 'فترة نشطة حالياً' : 'فترة غير نشطة' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-bx-muted">رصد الدرجات</span>
            <span
              class="px-3 py-0.5 rounded-full text-[11px] font-bold border"
              :class="activeRowDetails.is_closed === 1 ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-blue-500/30 text-blue-500 bg-blue-500/10'"
            >
              {{ activeRowDetails.is_closed === 1 ? 'مغلقة' : 'مفتوحة للرصد' }}
            </span>
          </div>
        </div>

        <!-- Management Actions -->
        <div class="space-y-2.5 pt-2">
          <button
            v-if="activeRowDetails.is_active !== 1"
            @click="requestActivate(activeRowDetails.id, activeRowDetails.term_name, activeRowDetails.class_name)"
            class="w-full py-2.5 px-4 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            :disabled="isCheckingActivation"
          >
            <Loader2 v-if="isCheckingActivation && targetTermToActivate?.id === activeRowDetails.id" class="w-4 h-4 animate-spin" />
            <Zap v-else class="w-4 h-4" />
            <span>تفعيل هذه الفترة للصف</span>
          </button>

          <button
            @click="handleToggleClose(activeRowDetails.id)"
            class="w-full py-2.5 px-4 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            <component :is="activeRowDetails.is_closed === 1 ? Unlock : Lock" class="w-4 h-4" />
            <span>{{ activeRowDetails.is_closed === 1 ? 'إعادة فتح رصد الدرجات' : 'إغلاق رصد الدرجات' }}</span>
          </button>

          <button
            @click="openEditFromDetails(activeRowDetails)"
            class="w-full py-2.5 px-4 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            <Edit2 class="w-4 h-4" />
            <span>تعديل ربط الفترة</span>
          </button>

          <button
            @click="confirmDelete(activeRowDetails)"
            :disabled="activeRowDetails.is_active === 1"
            class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 class="w-4 h-4" />
            <span>فك الارتباط بالصف الدراسي</span>
          </button>
        </div>
      </div>

      <!-- Create / Edit Mode with Enhanced Layout & Full-Width Fields -->
      <form v-else @submit.prevent="handleSave" class="space-y-5">
        <!-- Target Class Field -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <GraduationCap class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">الصف الدراسي المستهدف</label>
          </div>
          <TaqniyaSelect
            v-model="form.class_id"
            :options="classFormOptions"
            :full-width="true"
            placeholder="اختر الصف الدراسي..."
          />
          <p class="text-[11px] text-bx-muted">حدد الصف الذي ترغب في تخصيص الفصل الدراسي له</p>
        </div>

        <!-- Academic Terms Field (Checks Matrix - Taqniya Framework Specification) -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-bx-title">
            <div class="flex items-center gap-2">
              <CalendarDays class="w-4 h-4 text-bx-primary shrink-0" />
              <label class="text-xs font-bold">
                {{ drawerMode === 'create' ? 'الفترات الدراسية (مربعات الاختيار)' : 'الفترة الدراسية (الفصل)' }}
              </label>
            </div>
            <span v-if="drawerMode === 'create'" class="text-[11px] font-bold text-bx-primary">
              {{ selectedTermIds.length }} فترات محددة
            </span>
          </div>

          <!-- Checks Matrix -->
          <div class="space-y-2">
            <div
              v-for="t in termOptionsWithState"
              :key="t.id"
              @click="!t.disabled && toggleTerm(t.id)"
              class="p-3.5 rounded-2xl border transition-all flex items-center justify-between select-none"
              :class="[
                t.disabled
                  ? 'border-[#B4AED8]/30 dark:border-white/5 bg-slate-500/[0.04] opacity-55 cursor-not-allowed'
                  : selectedTermIds.includes(t.id)
                  ? 'border-bx-primary bg-purple-500/[0.06] dark:bg-purple-500/10 shadow-xs cursor-pointer'
                  : 'border-[#B4AED8]/60 dark:border-white/10 hover:border-bx-primary/50 bg-[var(--bx-surface-solid)] cursor-pointer'
              ]"
            >
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  :checked="selectedTermIds.includes(t.id)"
                  :disabled="t.disabled"
                  @click.stop="!t.disabled && toggleTerm(t.id)"
                  class="bx-custom-check shrink-0 !m-0"
                />
                <div>
                  <span class="text-xs font-bold text-bx-title block leading-tight">{{ t.name }}</span>
                  <span class="text-[10px] font-mono text-bx-muted">TERM-{{ String(t.id).padStart(2, '0') }}#</span>
                </div>
              </div>

              <!-- Status Badge -->
              <div>
                <span
                  v-if="t.disabled"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-500/20 text-bx-muted bg-slate-500/10"
                >
                  مخصص مسبقاً لهذا الصف
                </span>
                <span
                  v-else-if="selectedTermIds.includes(t.id)"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-purple-500/30 text-bx-primary bg-purple-500/10"
                >
                  محدد للتخصيص
                </span>
                <span
                  v-else
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[#B4AED8]/40 dark:border-white/10 text-bx-muted bg-transparent"
                >
                  متاح للتخصيص
                </span>
              </div>
            </div>
          </div>

          <p class="text-[11px] text-bx-muted">
            {{ drawerMode === 'create'
              ? 'يمكنك تحديد فترة واحدة أو أكثر لربطها وتخصيصها دفعة واحدة للصف الدراسي'
              : 'الفصل الأكاديمي المعتمد من التقويم السنوي للمدرسة'
            }}
          </p>
        </div>

        <!-- Tip Box -->
        <div class="p-4 rounded-2xl bg-purple-500/5 border border-[#B4AED8]/50 dark:border-white/10 text-xs text-bx-muted leading-relaxed flex items-start gap-2.5">
          <Info class="w-4 h-4 text-bx-primary shrink-0 mt-0.5" />
          <p class="text-[11px] leading-relaxed">
            سيتم إنشاء التخصيص كفترة غير نشطة افتراضياً، ويمكنك تفعيل الفصل الدراسي للصف في أي وقت من جدول السجلات.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="pt-5 flex items-center justify-end gap-3 border-t border-[#B4AED8] dark:border-white/[0.08]">
          <button
            type="button"
            @click="showDrawer = false"
            class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold shadow-md shadow-bx-primary/20 hover:bg-bx-primary-hover transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>
              {{
                drawerMode === 'create'
                  ? selectedTermIds.length > 1
                    ? `تخصيص الفترات المحددة (${selectedTermIds.length})`
                    : 'تخصيص الآن'
                  : 'حفظ التعديل'
              }}
            </span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (فك الارتباط) using Shared TaqniyaModal -->
    <TaqniyaModal
      :is-open="showDeleteModal"
      title="تأكيد فك ارتباط الفترة"
      subtitle="سيتم إزالة ربط هذه الفترة بالصف الدراسي المختار"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <template #icon>
        <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <Trash2 class="w-5 h-5" />
        </div>
      </template>

      <div class="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs text-bx-muted leading-relaxed space-y-1">
        <p>
          أنت على وشك فك ارتباط:
          <strong class="text-bx-title font-black">{{ itemToDelete?.name }}</strong>.
        </p>
        <p class="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
          * يشترط النظام ألا تكون الفترة نشطة حالياً وألا تحتوي على مواد مسندة بها.
        </p>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="showDeleteModal = false"
            :disabled="isDeleting"
            class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          >
            إلغاء التراجع
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-6 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:bg-rose-700 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>تأكيد فك الارتباط</span>
          </button>
        </div>
      </template>
    </TaqniyaModal>

    <!-- 1. Warning Modal: Incomplete Grades / Missing Students -->
    <TaqniyaModal
      :is-open="showActivationWarningModal"
      title="تنبيه: متطلبات رصد الدرجات غير مكتملة"
      subtitle="لا يمكن تفعيل الفصل الجديد لوجود طلاب غير مرصودين في الفصل السابق"
      max-width="lg"
      @close="showActivationWarningModal = false"
    >
      <template #icon>
        <div class="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
          <AlertTriangle class="w-6 h-6" />
        </div>
      </template>

      <div class="space-y-4" dir="rtl" v-if="activationCheckData?.data">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-3.5 rounded-2xl bg-purple-500/5 border border-[#B4AED8]/50 dark:border-white/10 space-y-1">
            <span class="text-[11px] font-bold text-bx-muted block">الصف الدراسي المستهدف:</span>
            <span class="text-xs font-black text-bx-title font-display flex items-center gap-1.5">
              <GraduationCap class="w-3.5 h-3.5 text-bx-primary" />
              <span>{{ activationCheckData.data.class_name }}</span>
            </span>
          </div>

          <div class="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
            <span class="text-[11px] font-bold text-bx-muted block">الفصل المراد تفعيله:</span>
            <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 font-display flex items-center gap-1.5">
              <Zap class="w-3.5 h-3.5" />
              <span>{{ activationCheckData.data.target_term_name }}</span>
            </span>
          </div>
        </div>

        <!-- Audit Progress Status Box -->
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>حالة رصد الفصل السابق ({{ activationCheckData.data.previous_term_name }}):</span>
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {{ activationCheckData.data.missing_count }} غير مرصود
            </span>
          </div>
          <p class="text-xs text-bx-title leading-relaxed">
            تم رصد درجات <strong>{{ activationCheckData.data.completed_students }}</strong> من أصل <strong>{{ activationCheckData.data.total_students }}</strong> طالب في الصف. لحماية سلامة النتائج ومنع تضارب الفصول، يلزم استكمال رصد جميع الطلاب أولاً قبل تفعيل الفصل الجديد.
          </p>
        </div>

        <!-- Missing Students List -->
        <div v-if="activationCheckData.data.missing_students?.length > 0" class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-bx-muted">
            <span class="flex items-center gap-1.5">
              <Users class="w-3.5 h-3.5 text-bx-primary" />
              <span>قائمة الطلاب غير المستكملين للرصد:</span>
            </span>
            <span class="text-[11px] font-mono text-bx-muted">
              ({{ activationCheckData.data.missing_students.length }} طالب)
            </span>
          </div>

          <div class="max-h-48 overflow-y-auto rounded-2xl border border-[#B4AED8] dark:border-white/10 divide-y divide-[#B4AED8]/40 dark:divide-white/[0.06] bg-[var(--bx-surface-solid)]">
            <div
              v-for="s in activationCheckData.data.missing_students"
              :key="s.student_id"
              class="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span class="font-bold text-bx-title">{{ s.student_name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-bx-primary border border-purple-500/20">
                  {{ s.section_name }}
                </span>
                <span class="font-mono text-[10px] text-bx-muted">{{ s.student_code }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 w-full" dir="rtl">
          <button
            type="button"
            @click="showActivationWarningModal = false"
            class="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          >
            إغلاق
          </button>

          <button
            type="button"
            @click="goToGradeEntry"
            class="w-full sm:w-auto px-6 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold shadow-md shadow-bx-primary/20 hover:bg-bx-primary-hover flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <FileSpreadsheet class="w-4 h-4" />
            <span>الانتقال لشيت رصد الدرجات لإكمال الرصد</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </TaqniyaModal>

    <!-- 2. Confirmation Modal: All Grades Complete & Ready to Activate -->
    <TaqniyaModal
      :is-open="showActivationConfirmModal"
      title="تأكيد تفعيل الفصل الدراسي الجديد"
      subtitle="تم التحقق من اكتمال كافة متطلبات ورصد الفصل السابق بنجاح"
      max-width="md"
      @close="showActivationConfirmModal = false"
    >
      <template #icon>
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
          <CheckCircle2 class="w-6 h-6" />
        </div>
      </template>

      <div class="space-y-4" dir="rtl" v-if="activationCheckData?.data">
        <!-- Success Banner -->
        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
          <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-xs font-display">
            <CheckCircle2 class="w-4 h-4" />
            <span>جاهز للتفعيل والانتقال الأكاديمي</span>
          </div>
          <p class="text-xs text-bx-title leading-relaxed">
            <span v-if="activationCheckData.data.previous_term_name">
              تم التحقق بنجاح من أن كافة درجات الطلاب (<strong>{{ activationCheckData.data.total_students }} طالب</strong>) في الفصل السابق (<strong>{{ activationCheckData.data.previous_term_name }}</strong>) لصف <strong>{{ activationCheckData.data.class_name }}</strong> مرصودة بالكامل ومكتملة 100%.
            </span>
            <span v-else>
              تم التحقق بنجاح من إمكانية تفعيل الفصل الدراسي لصف <strong>{{ activationCheckData.data.class_name }}</strong>.
            </span>
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-purple-500/5 border border-[#B4AED8]/50 dark:border-white/10 text-xs text-bx-muted leading-relaxed flex items-start gap-2.5">
          <Zap class="w-4 h-4 text-bx-primary shrink-0 mt-0.5" />
          <p class="text-[11px] leading-relaxed">
            عند الضغط على تأكيد، سيصبح <strong>{{ activationCheckData.data.target_term_name }}</strong> هو الفصل النشط للصف الدراسي لجميع المعلمين ورصد الدرجات والامتحانات.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2.5" dir="rtl">
          <button
            type="button"
            @click="showActivationConfirmModal = false"
            :disabled="isActivating"
            class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            @click="confirmActivation(false)"
            :disabled="isActivating"
            class="px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Loader2 v-if="isActivating" class="w-3.5 h-3.5 animate-spin" />
            <Zap v-else class="w-4 h-4" />
            <span>تأكيد التفعيل والانتقال</span>
          </button>
        </div>
      </template>
    </TaqniyaModal>
  </div>
</template>
