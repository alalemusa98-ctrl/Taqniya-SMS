<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
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
import {
  Plus,
  Zap,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  GraduationCap,
  CalendarDays,
  Info,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const rawGroups = ref<ClassAcademicTermsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const terms = ref<AcademicTermItem[]>([]);
const stages = ref<any[]>([]);

// Search & Status Pill Filter (matching screenshot: الكل / نشط / معلق)
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

async function fetchClassTerms() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const res = await academicApi.getClassAcademicTerms({ per_page: 100 }, activeAbortController.signal);
    rawGroups.value = res.data?.data?.classes || [];
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    const msg = err.response?.data?.message || 'تعذر تحميل فترات وحالات الصفوف.';
    toast.error(msg);
  } finally {
    if (!activeAbortController?.signal.aborted) {
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

export interface UnifiedClassGroup {
  class_id: number;
  class_name: string;
  stage_name: string;
  terms: UnifiedTermRow[];
}

// Grouped by Class for the unified records table
const allGroups = computed<UnifiedClassGroup[]>(() => {
  const result: UnifiedClassGroup[] = [];
  const letters = ['A', 'B', 'C', 'D'];
  const letterColors = [
    'border-purple-500 text-purple-400 bg-purple-500/10',
    'border-blue-500 text-blue-400 bg-blue-500/10',
    'border-amber-500 text-amber-400 bg-amber-500/10',
    'border-emerald-500 text-emerald-400 bg-emerald-500/10',
  ];

  for (const grp of rawGroups.value || []) {
    const stageName = classStageMap.value[grp.class_id] || 'التعليم العام';
    const termRows: UnifiedTermRow[] = [];

    (grp.terms || []).forEach((t, index) => {
      const letter = letters[index % letters.length];
      const letterColor = letterColors[index % letterColors.length];

      // Determine status
      let statusLabel = 'معلق';
      let statusClass = 'border-slate-500/30 text-bx-muted bg-slate-500/10';

      if (t.is_closed === 1) {
        statusLabel = 'مكتمل';
        statusClass = 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10';
      } else if (t.is_active === 1) {
        statusLabel = 'نشط';
        statusClass = 'border-purple-500/40 text-purple-500 bg-purple-500/10';
      } else {
        statusLabel = 'معلق';
        statusClass = 'border-amber-500/40 text-amber-500 bg-amber-500/10';
      }

      termRows.push({
        id: t.id,
        code: `TQ-${String(t.id).padStart(3, '0')}#`,
        class_id: grp.class_id,
        class_name: grp.class_name,
        stage_name: stageName,
        term_id: t.academic_term_id,
        term_name: t.term_name || '',
        letter,
        letterColor,
        statusLabel,
        statusClass,
        is_active: t.is_active,
        is_closed: t.is_closed,
        raw: t,
      });
    });

    result.push({
      class_id: grp.class_id,
      class_name: grp.class_name,
      stage_name: stageName,
      terms: termRows,
    });
  }

  return result;
});

// Filtered groups based on status pill and search query
const filteredGroups = computed(() => {
  return (allGroups.value || [])
    .map((grp) => {
      const matchingTerms = (grp.terms || []).filter((row) => {
        // Status filter pill
        if (statusPill.value === 'active' && row.is_active !== 1) return false;
        if (statusPill.value === 'inactive' && row.is_active !== 0) return false;
        if (statusPill.value === 'closed' && row.is_closed !== 1) return false;

        // Search query
        if (search.value.trim()) {
          const q = search.value.trim().toLowerCase();
          const matchClass = (grp.class_name || '').toLowerCase().includes(q);
          const matchTerm = (row.term_name || '').toLowerCase().includes(q);
          const matchCode = (row.code || '').toLowerCase().includes(q);
          const matchStage = (grp.stage_name || '').toLowerCase().includes(q);
          return matchClass || matchTerm || matchCode || matchStage;
        }

        return true;
      });

      return {
        ...grp,
        terms: matchingTerms,
      };
    })
    .filter((grp) => (grp.terms?.length || 0) > 0);
});

const totalTermsCount = computed(() => {
  return (filteredGroups.value || []).reduce((acc, g) => acc + (g.terms?.length || 0), 0);
});


// Drawer & Actions
function openDetails(row: UnifiedTermRow) {
  activeRowDetails.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openCreateDrawer(classId?: number) {
  drawerMode.value = 'create';
  activeTermToEdit.value = null;
  const targetClassId = classId || classes.value[0]?.id || 0;
  form.value = {
    class_id: targetClassId,
    academic_term_id: 0,
  };
  // Pre-select first available unassigned term
  const assigned = (rawGroups.value.find((g) => g.class_id === targetClassId)?.terms || []).map((t) => t.academic_term_id);
  const firstAvailable = terms.value.find((t) => !assigned.includes(t.id));
  selectedTermIds.value = firstAvailable ? [firstAvailable.id] : [];
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
      const assigned = (rawGroups.value.find((g) => g.class_id === newClassId)?.terms || []).map((t) => t.academic_term_id);
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
  isDeleting.value = true;
  try {
    await academicApi.deleteClassAcademicTerm(itemToDelete.value.id);
    toast.success('تم فك ارتباط الفترة بالصف الدراسي بنجاح.');
    showDeleteModal.value = false;
    itemToDelete.value = null;
    showDrawer.value = false;
    await fetchClassTerms();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر فك ارتباط الفترة لوجود مواد مسندة بها.';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
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
      await fetchClassTerms();
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
      await fetchClassTerms();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ فترة الصف.';
      toast.error(msg);
    } finally {
      isSubmitting.value = false;
    }
  }
}

async function handleActivate(termId: number) {
  try {
    const res = await academicApi.activateClassAcademicTerm(termId);
    toast.success(res.data?.message || 'تم تفعيل الفترة النشطة للصف بنجاح.');
    if (activeRowDetails.value && activeRowDetails.value.id === termId) {
      activeRowDetails.value.is_active = 1;
    }
    fetchClassTerms();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تفعيل الفترة النشطة.';
    toast.error(msg);
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
            سجلات فترات الصفوف الموحدة
          </h2>
          <p class="text-xs text-bx-muted font-medium mt-1">
            إدارة فترات الصفوف الدراسية، حالات التفعيل، والتحكم في إغلاق درجات التقييم
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
              placeholder="بحث في السجلات..."
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
        <span class="text-xs font-bold">جاري تحميل سجلات الفترات...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!filteredGroups || filteredGroups.length === 0"
        class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
      >
        <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
        <h3 class="text-sm font-bold text-bx-title">لا توجد سجلات تطابق محددات البحث</h3>
        <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو تخصيص فترة لصف دراسي جديد.</p>
      </div>

      <!-- Unified Table Content: Enclosed in a Bordered Card (Right, Left, Top, Bottom) -->
      <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)]">
        <div class="overflow-x-auto">
          <table class="w-full text-start border-collapse text-xs">
            <!-- Table Header with Distinct Background and Crisp Dividers -->
            <thead>
              <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
                <th class="py-3.5 px-4 font-bold text-start">الرمز</th>
                <th class="py-3.5 px-4 font-bold text-start">الفصل الدراسي</th>
                <th class="py-3.5 px-4 font-bold text-start">التصنيف</th>
                <th class="py-3.5 px-4 font-bold text-center">الحالة</th>
                <th class="py-3.5 px-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>

            <!-- Table Body with Crisp Dividers & Class Group Headers -->
            <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12]">
              <template v-for="grp in filteredGroups" :key="grp.class_id">
                <!-- Class Group Header Row -->
                <tr class="bg-purple-500/[0.05] dark:bg-white/[0.03]">
                  <td colspan="5" class="py-2.5 px-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-bx-primary"></span>
                        <span class="font-black text-sm text-bx-title">{{ grp.class_name }}</span>
                        <span class="text-[11px] font-semibold text-bx-muted px-2.5 py-0.5 rounded-full border border-[#B4AED8]/60 dark:border-white/10 bg-[var(--bx-surface-solid)]">
                          {{ grp.stage_name }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-bold text-bx-muted">
                          {{ grp.terms?.length || 0 }} فصول دراسية
                        </span>
                        <button
                          @click="openCreateDrawer(grp.class_id)"
                          class="w-8 h-8 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-bx-primary dark:text-purple-300 hover:bg-bx-primary hover:text-white hover:border-bx-primary flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          title="تخصيص فترة دراسية لهذا الصف"
                        >
                          <Plus class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Empty terms for this class -->
                <tr v-if="!grp.terms || grp.terms.length === 0" class="hover:bg-[var(--bx-row-hover)]/20 transition-colors">
                  <td colspan="5" class="py-4 px-4 text-center text-bx-muted text-xs">
                    <span>لا توجد فترات مخصصة لهذا الصف بعد.</span>
                    <button
                      @click="openCreateDrawer(grp.class_id)"
                      class="text-bx-primary font-bold hover:underline me-2 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus class="w-3 h-3" />
                      <span>تخصيص أول فترة الآن</span>
                    </button>
                  </td>
                </tr>

                <!-- Term Rows for this Class -->
                <tr
                  v-for="row in grp.terms"
                  :key="row.id"
                  class="hover:bg-purple-500/[0.08] dark:hover:bg-white/[0.06] transition-colors duration-150"
                >
                  <!-- Code (الرمز) -->
                  <td class="py-3.5 px-4 font-mono font-bold text-bx-muted text-xs whitespace-nowrap">
                    {{ row.code }}
                  </td>

                  <!-- Item with Circular Letter Badge (العنصر: الفصل الدراسي) -->
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-7 h-7 rounded-full border-2 font-black text-[11px] flex items-center justify-center shrink-0"
                        :class="row.letterColor"
                      >
                        {{ row.letter }}
                      </div>
                      <div>
                        <span class="font-bold text-xs text-bx-title block">
                          {{ row.term_name }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Category (المرحلة التعليمية) -->
                  <td class="py-3.5 px-4 text-xs font-semibold text-bx-muted whitespace-nowrap">
                    {{ row.stage_name }}
                  </td>

                  <!-- Status Pill (الحالة) -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      class="inline-block px-4 py-1 rounded-full text-xs font-bold border"
                      :class="row.statusClass"
                    >
                      {{ row.statusLabel }}
                    </span>
                  </td>

                  <!-- Action: عرض Button & Quick Actions (إجراءات) -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <div class="flex items-center justify-center gap-2">
                      <!-- View Details Button with Text + Icon -->
                      <button
                        @click="openDetails(row)"
                        class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-primary dark:text-purple-300 bg-white dark:bg-white/[0.05] hover:bg-bx-primary hover:text-white hover:border-bx-primary transition-all cursor-pointer shadow-xs"
                      >
                        <Eye class="w-3.5 h-3.5" />
                        <span>عرض</span>
                      </button>

                      <!-- Quick Action Icons Matching Reference Squircle -->
                      <button
                        v-if="row.is_active !== 1"
                        @click="handleActivate(row.id)"
                        title="تفعيل الفترة الحالية"
                        class="w-8 h-8 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      >
                        <Zap class="w-4 h-4" />
                      </button>

                      <button
                        @click="handleToggleClose(row.id)"
                        :title="row.is_closed === 1 ? 'فتح رصد الدرجات' : 'إغلاق رصد الدرجات'"
                        class="w-8 h-8 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      >
                        <component :is="row.is_closed === 1 ? Lock : Unlock" class="w-4 h-4" />
                      </button>

                      <button
                        v-if="row.is_active !== 1"
                        @click="confirmDelete(row)"
                        title="فك الارتباط بالفترة"
                        class="w-8 h-8 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-100/70 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table Footer: Records Count & Full Comprehensive View -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 text-xs font-bold text-bx-muted">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
          <span>إجمالي الصفوف المعروضة: <strong class="text-bx-title font-black">{{ filteredGroups?.length || 0 }}</strong> صفوف (مجموع <strong class="text-bx-title font-black">{{ totalTermsCount }}</strong> فترة دراسية)</span>
        </div>
        <div class="text-[11px] text-bx-muted">
          فترات وحالات الصفوف (عرض كامل بدون تجزئة صفحات)
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
            @click="handleActivate(activeRowDetails.id)"
            class="w-full py-2.5 px-4 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
          >
            <Zap class="w-4 h-4" />
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

    <!-- Delete Confirmation Modal (فك الارتباط) -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="w-full max-w-md bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-xl">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <Trash2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-bx-title">تأكيد فك ارتباط الفترة</h3>
            <p class="text-xs text-bx-muted">سيتم إزالة ربط هذه الفترة بالصف الدراسي المختار</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs text-bx-muted leading-relaxed space-y-1">
          <p>
            أنت على وشك فك ارتباط:
            <strong class="text-bx-title font-black">{{ itemToDelete?.name }}</strong>.
          </p>
          <p class="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
            * يشترط النظام ألا تكون الفترة نشطة حالياً وألا تحتوي على مواد مسندة بها.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            @click="showDeleteModal = false"
            :disabled="isDeleting"
            class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all"
          >
            إلغاء التراجع
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-6 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:bg-rose-700 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>تأكيد فك الارتباط</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
