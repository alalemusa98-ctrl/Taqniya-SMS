<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import {
  academicApi,
  type ClassSectionsGroupItem,
  type AcademicClassItem,
  type AcademicSectionItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));
import {
  Users2,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  GraduationCap,
  Info,
  Check,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const rawGroups = ref<ClassSectionsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const sections = ref<AcademicSectionItem[]>([]);
const stages = ref<any[]>([]);

// Search & Status Pill Filter (الكل / مسكنة / صفوف فارغة)
const search = ref('');
const statusPill = ref<'all' | 'assigned' | 'empty'>('all');

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawer state for assigning section
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'details'>('create');
const activeRowDetails = ref<any | null>(null);
const isSubmitting = ref(false);

// Unassign modal
const showDeleteModal = ref(false);
const itemToDelete = ref<{ id: number; name: string } | null>(null);
const isDeleting = ref(false);

const form = ref({
  class_id: 0,
  section_id: 0,
});

async function fetchPredecessors() {
  try {
    const [cRes, sRes, stRes] = await Promise.all([
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getSections({ per_page: 100 }),
      academicApi.getStages(),
    ]);
    classes.value = cRes.data?.data?.classes || cRes.data?.data || [];
    sections.value = sRes.data?.data?.sections || sRes.data?.data || [];
    stages.value = stRes.data?.data || [];
  } catch (err: any) {
    console.error('Failed to load predecessor data', err);
  }
}

async function fetchClassSections() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const res = await academicApi.getClassSections({ per_page: 100 }, activeAbortController.signal);
    rawGroups.value = res.data?.data?.classes || [];
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    const msg = err.response?.data?.message || 'تعذر تحميل شعب الصفوف الدراسية.';
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

export interface UnifiedSectionRow {
  id: number;
  code: string;
  class_id: number;
  class_name: string;
  stage_name: string;
  section_id: number;
  section_name: string;
  letter: string;
  letterColor: string;
  statusLabel: string;
  statusClass: string;
}

export interface ClassSectionMatrixCell {
  section_id: number;
  section_name: string;
  isAssigned: boolean;
  row?: UnifiedSectionRow;
}

export interface ClassSectionMatrixRow {
  class_id: number;
  class_name: string;
  stage_name: string;
  stage_id: number;
  cells: Record<number, ClassSectionMatrixCell>;
  assignedCount: number;
}

// Master sections sorted by ID
const sortedSections = computed<AcademicSectionItem[]>(() => {
  return [...sections.value].sort((a, b) => Number(a.id) - Number(b.id));
});

// Matrix Rows computed for all classes
const matrixRows = computed<ClassSectionMatrixRow[]>(() => {
  return classes.value.map((cls) => {
    const stageName = classStageMap.value[cls.id] || 'التعليم العام';
    const grp = (rawGroups.value || []).find((g) => g.class_id === cls.id);
    const assignedList = grp?.sections || [];

    const cells: Record<number, ClassSectionMatrixCell> = {};
    let count = 0;

    for (const sec of sortedSections.value) {
      const assigned = assignedList.find((s) => s.section_id === sec.id);
      if (assigned) {
        count++;
        const unifiedRow: UnifiedSectionRow = {
          id: assigned.id,
          code: `TQ-CS-${String(assigned.id).padStart(3, '0')}#`,
          class_id: cls.id,
          class_name: cls.name,
          stage_name: stageName,
          section_id: sec.id,
          section_name: sec.name,
          letter: sec.name.replace(/[^أ-يA-Za-z]/g, '') || 'ش',
          letterColor: 'border-purple-500 text-purple-400 bg-purple-500/10',
          statusLabel: 'شعبة نشطة',
          statusClass: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
        };

        cells[sec.id] = {
          section_id: sec.id,
          section_name: sec.name,
          isAssigned: true,
          row: unifiedRow,
        };
      } else {
        cells[sec.id] = {
          section_id: sec.id,
          section_name: sec.name,
          isAssigned: false,
        };
      }
    }

    return {
      class_id: cls.id,
      class_name: cls.name,
      stage_name: stageName,
      stage_id: (cls as any).stage_id || 0,
      cells,
      assignedCount: count,
    };
  });
});

// Filtered matrix rows based on search and status filter
const filteredMatrixRows = computed(() => {
  return matrixRows.value.filter((row) => {
    if (statusPill.value === 'assigned' && row.assignedCount === 0) return false;
    if (statusPill.value === 'empty' && row.assignedCount > 0) return false;

    if (search.value.trim()) {
      const q = search.value.trim().toLowerCase();
      const matchClass = row.class_name.toLowerCase().includes(q);
      const matchStage = row.stage_name.toLowerCase().includes(q);
      return matchClass || matchStage;
    }
    return true;
  });
});

const totalSectionsCount = computed(() => {
  return (filteredMatrixRows.value || []).reduce((acc, r) => acc + r.assignedCount, 0);
});

function openDetails(row: UnifiedSectionRow) {
  activeRowDetails.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openCreateDrawer(classId?: number, sectionId?: number) {
  drawerMode.value = 'create';
  const targetClassId = classId || classes.value[0]?.id || 0;

  // Find unassigned section if sectionId not provided
  let targetSectionId = sectionId || 0;
  if (!targetSectionId) {
    const grp = rawGroups.value.find((g) => g.class_id === targetClassId);
    const assignedIds = (grp?.sections || []).map((s) => s.section_id);
    const available = sortedSections.value.find((s) => !assignedIds.includes(s.id));
    targetSectionId = available ? available.id : (sections.value[0]?.id || 0);
  }

  form.value = {
    class_id: targetClassId,
    section_id: targetSectionId,
  };
  showDrawer.value = true;
}

function confirmDelete(sec: { id: number; name: string }) {
  itemToDelete.value = sec;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteClassSection(itemToDelete.value.id);
    toast.success(res.data?.message || 'تم فك ربط الشعبة من الصف بنجاح.');
    showDeleteModal.value = false;
    itemToDelete.value = null;
    showDrawer.value = false;
    await fetchClassSections();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر فك ربط الشعبة.';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

async function handleSave() {
  if (!form.value.class_id || !form.value.section_id) {
    toast.warning('يرجى اختيار الصف الدراسي والشعبة العامة.');
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await academicApi.createClassSection({
      class_id: form.value.class_id,
      section_id: form.value.section_id,
    });
    toast.success(res.data?.message || 'تم فتح وتسكين الشعبة للصف بنجاح.');
    showDrawer.value = false;
    fetchClassSections();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء تسكين الشعبة.';
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
}

const classFormOptions = computed(() =>
  classes.value.map((c) => ({
    value: c.id,
    label: c.name,
    code: (c as any).code || `CLS-${c.id}`,
  })),
);

const sectionFormOptions = computed(() =>
  sections.value.map((s) => ({
    value: s.id,
    label: s.name,
    code: (s as any).code || `SEC-${s.id}`,
  })),
);

onMounted(async () => {
  await fetchPredecessors();
  await fetchClassSections();
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
            مصفوفة تسكين الشُعب الموحدة
          </h2>
          <p class="text-xs text-bx-muted font-medium mt-1">
            جدول المصفوفة الشبكية لعرض وتسكين الشُعب الدراسية لكافة الصفوف في نظرة واحدة
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
            <span>تسكين شعبة</span>
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
              @click="statusPill = 'assigned'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="
                statusPill === 'assigned'
                  ? 'bg-bx-primary text-white shadow-sm'
                  : 'text-bx-muted hover:text-bx-title'
              "
            >
              مسكنة
            </button>
            <button
              @click="statusPill = 'empty'"
              class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="
                statusPill === 'empty'
                  ? 'bg-bx-primary text-white shadow-sm'
                  : 'text-bx-muted hover:text-bx-title'
              "
            >
              غير مسكنة
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-24 text-center text-bx-muted">
        <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
        <span class="text-xs font-bold">جاري تحميل مصفوفة تسكين الشُعب...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!filteredMatrixRows || filteredMatrixRows.length === 0"
        class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
      >
        <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
        <h3 class="text-sm font-bold text-bx-title">لا توجد صفوف تطابق محددات البحث والتصفية</h3>
        <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو فتح شعبة جديدة لصف دراسي.</p>
      </div>

      <!-- Matrix Table Content: Enclosed in a Bordered Card -->
      <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-start border-collapse text-xs">
            <!-- Table Header -->
            <thead>
              <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/15 text-bx-muted">
                <!-- Column 1: Sticky Class & Stage Column (Constrained Width to Prevent Empty Gaps) -->
                <th class="py-3.5 px-5 font-bold text-start whitespace-nowrap w-72 min-w-[240px] max-w-[280px] sticky start-0 bg-[var(--bx-table-header)] z-20 border-e border-[#B4AED8]/60 dark:border-white/15">
                  <div class="flex items-center gap-2">
                    <GraduationCap class="w-4 h-4 text-bx-primary" />
                    <span>الصف الدراسي والمرحلة</span>
                  </div>
                </th>

                <!-- Dynamic Master Section Columns (Evenly Distributed) -->
                <th
                  v-for="sec in sortedSections"
                  :key="sec.id"
                  class="py-3 px-3 font-bold text-center whitespace-nowrap border-e border-[#B4AED8]/60 dark:border-white/15 last:border-e-0"
                >
                  <div class="flex flex-col items-center justify-center gap-1">
                    <div class="flex items-center gap-1.5 text-bx-title font-black text-xs sm:text-sm">
                      <Users2 class="w-3.5 h-3.5 text-bx-primary" />
                      <span>{{ sec.name }}</span>
                    </div>
                    <span class="text-[10px] font-mono text-bx-muted">SEC-{{ String(sec.id).padStart(2, '0') }}#</span>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Table Body with Crisp Dividers -->
            <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/15">
              <tr
                v-for="row in filteredMatrixRows"
                :key="row.class_id"
                class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors"
              >
                <!-- Fixed First Column (Class Info) -->
                <td class="py-3 px-5 whitespace-nowrap sticky start-0 bg-[var(--bx-surface-solid)] z-10 border-e border-[#B4AED8]/60 dark:border-white/15">
                  <div class="space-y-1">
                    <span class="font-black text-sm text-bx-title block leading-tight">{{ row.class_name }}</span>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="getStageBadgeClass(row.stage_name)">
                        {{ row.stage_name }}
                      </span>
                      <span class="text-[10px] font-semibold text-bx-muted">
                        {{ row.assignedCount }} شُعب مسكنة
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Section Matrix Cells (Centered & Compact Element with High Contrast) -->
                <td
                  v-for="sec in sortedSections"
                  :key="sec.id"
                  class="py-2.5 px-3 text-center align-middle border-e border-[#B4AED8]/60 dark:border-white/15 last:border-e-0"
                >
                  <!-- CASE 1: Section Assigned to this Class (Tight Width, Clear High Contrast Dark Mode Borders) -->
                  <div
                    v-if="row.cells[sec.id]?.isAssigned && row.cells[sec.id]?.row"
                    class="inline-flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/[0.06] dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:ring-1 dark:ring-emerald-400/30 shadow-2xs transition-all duration-200 group hover:shadow-xs"
                  >
                    <!-- Active Assignment Check Badge -->
                    <span class="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:bg-emerald-500/30 dark:border-emerald-400 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <Check class="w-4 h-4 stroke-[2.5]" />
                    </span>

                    <!-- Subtle Vertical Divider -->
                    <span class="w-[1px] h-4 bg-emerald-500/25 dark:bg-emerald-400/35"></span>

                    <!-- Circular Action Buttons (High Contrast & Clear in Dark Mode) -->
                    <div class="flex items-center gap-1.5 shrink-0">
                      <!-- Details Button -->
                      <button
                        @click="openDetails(row.cells[sec.id].row)"
                        class="w-7 h-7 rounded-full border border-[#B4AED8] bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="عرض تفاصيل تسكين الشعبة"
                      >
                        <Eye class="w-3.5 h-3.5" />
                      </button>

                      <!-- Unassign / Delete Button -->
                      <button
                        @click="confirmDelete({ id: row.cells[sec.id].row.id, name: row.cells[sec.id].row.section_name })"
                        class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="فك ربط الشعبة من هذا الصف"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- CASE 2: Section Unassigned to this Class (Centered Compact Pill) -->
                  <div
                    v-else
                    class="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-[#B4AED8]/70 dark:border-slate-600 bg-slate-500/[0.03] dark:bg-slate-800/30 transition-all duration-200 group hover:border-bx-primary/50 hover:bg-purple-500/[0.04]"
                  >
                    <span class="text-xs font-bold text-slate-400 dark:text-slate-300">—</span>
                    <button
                      @click="openCreateDrawer(row.class_id, sec.id)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white cursor-pointer transition-all duration-150 active:scale-95 shadow-2xs"
                    >
                      <Plus class="w-3 h-3" />
                      <span>تسكين</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table Footer: Records Info (Non-paginated full catalogue) -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 text-xs font-bold text-bx-muted">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>إجمالي الصفوف في المصفوفة: <strong class="text-bx-title font-black">{{ filteredMatrixRows?.length || 0 }}</strong> صفوف (مجموع <strong class="text-bx-title font-black">{{ totalSectionsCount }}</strong> شُعب مسكنة)</span>
        </div>
        <div class="text-[11px] text-bx-muted">
          عرض شبكي شامل بدون تجزئة صفحات (Academic Matrix View)
        </div>
      </div>
    </div>

    <!-- Drawer for Assigning Section / Viewing Details -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      @close="showDrawer = false"
      :title="drawerMode === 'details' ? 'تفاصيل تسكين الشعبة' : 'فتح وتسكين شعبة لصف دراسي'"
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
            <span class="text-xs font-bold text-bx-muted">اسم الشعبة المسكنة</span>
            <span class="font-black text-xs text-bx-title">{{ activeRowDetails.section_name }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-bx-muted">حالة الشعبة</span>
            <span
              class="px-3 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
            >
              مسكنة ومتاحة للطلاب
            </span>
          </div>
        </div>

        <!-- Management Actions -->
        <div class="pt-2">
          <button
            @click="confirmDelete({ id: activeRowDetails.id, name: activeRowDetails.section_name })"
            class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 class="w-4 h-4" />
            <span>فك ربط الشعبة من هذا الصف</span>
          </button>
        </div>
      </div>

      <!-- Create Mode with Full-Width Fields & Enhanced Styling -->
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
          <p class="text-[11px] text-bx-muted">حدد الصف الذي ترغب في فتح وتسكين شعبة جديدة له</p>
        </div>

        <!-- Section Field -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <Users2 class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">الشعبة العامة (من بنك الشُعب)</label>
          </div>
          <TaqniyaSelect
            v-model="form.section_id"
            :options="sectionFormOptions"
            :full-width="true"
            placeholder="اختر الشعبة العامة..."
          />
          <p class="text-[11px] text-bx-muted">اختر الرمز أو الاسم العام للشعبة من الكتالوج</p>
        </div>

        <!-- Tip Box -->
        <div class="p-4 rounded-2xl bg-purple-500/5 border border-[#B4AED8]/50 dark:border-white/10 text-xs text-bx-muted leading-relaxed flex items-start gap-2.5">
          <Info class="w-4 h-4 text-bx-primary shrink-0 mt-0.5" />
          <p class="text-[11px] leading-relaxed">
            سيتم فتح هذه الشعبة لهذا الصف الدراسي فوراً لتكون جاهزة لتوزيع الطلاب والقيد الأكاديمي.
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
            <span>تسكين الشعبة الآن</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal -->
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
            <h3 class="font-bold text-sm text-bx-title">تأكيد فك ربط الشعبة</h3>
            <p class="text-xs text-bx-muted">سيتم إزالة فتح الشعبة من هذا الصف الدراسي</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs text-bx-muted leading-relaxed space-y-1">
          <p>
            هل أنت متأكد من فك ربط:
            <strong class="text-bx-title font-black">{{ itemToDelete?.name }}</strong>؟
          </p>
          <p class="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
            * يشترط النظام عدم وجود أي طلاب مقيدين بهذه الشعبة لإتمام العملية.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            @click="showDeleteModal = false"
            :disabled="isDeleting"
            class="px-5 py-2.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all"
          >
            إلغاء
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-6 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:bg-rose-700 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>تأكيد فك الربط</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
