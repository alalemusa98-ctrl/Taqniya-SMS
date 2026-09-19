<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import {
  academicApi,
  type ClassSubjectsGroupItem,
  type AcademicClassItem,
  type AcademicSubjectItem,
  type ClassAcademicTermsGroupItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaGroupedTable, { type GroupedTableColumn, type TableGroup } from '../ui/TaqniyaGroupedTable.vue';

// Component Lazy Loading (component_lazy_loading)
const TaqniyaDrawer = defineAsyncComponent(() => import('../ui/TaqniyaDrawer.vue'));
const TaqniyaModal = defineAsyncComponent(() => import('../ui/TaqniyaModal.vue'));
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Eye,
  GraduationCap,
  CalendarDays,
  Award,
  Info,
  CheckCircle2,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const groups = ref<ClassSubjectsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const subjects = ref<AcademicSubjectItem[]>([]);
const stages = ref<any[]>([]);
const rawClassTerms = ref<ClassAcademicTermsGroupItem[]>([]);
const globalTerms = ref<any[]>([]);

// Search & Filter
const search = ref('');
const selectedClassFilter = ref<string | number>('all');

// Request Cancellation Controller (request_cancellation)
let activeAbortController: AbortController | null = null;

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit' | 'details'>('create');
const activeRowDetails = ref<UnifiedSubjectMatrixRow | null>(null);
const isSubmitting = ref(false);

// Delete confirmation modal
const showDeleteModal = ref(false);
const itemToDelete = ref<UnifiedSubjectMatrixRow | null>(null);
const isDeleting = ref(false);

// Multi-term Form Config
export interface MultiTermConfig {
  class_academic_term_id: number;
  term_name: string;
  class_subject_id?: number;
  enabled: boolean;
  passing_score: number;
  max_score: number;
  is_closed?: number;
}

const multiTermForm = ref<{
  class_id: number;
  subject_id: number;
  terms: MultiTermConfig[];
}>({
  class_id: 0,
  subject_id: 0,
  terms: [],
});

async function fetchPredecessors() {
  try {
    const [cRes, sRes, tRes, stRes, gTermsRes] = await Promise.all([
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getSubjects({ per_page: 100 }),
      academicApi.getClassAcademicTerms({ per_page: 100 }),
      academicApi.getStages(),
      academicApi.getTerms(),
    ]);

    classes.value = cRes.data?.data?.classes || cRes.data?.data || [];
    subjects.value = sRes.data?.data?.subjects || sRes.data?.data || [];
    rawClassTerms.value = tRes.data?.data?.classes || [];
    stages.value = stRes.data?.data || [];
    globalTerms.value = gTermsRes.data?.data || [];
  } catch (err: any) {
    console.error('Failed to load predecessor data', err);
  }
}

async function fetchClassSubjects() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const res = await academicApi.getClassSubjects({ per_page: 100 }, activeAbortController.signal);
    groups.value = res.data?.data?.classes || [];
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
    const msg = err.response?.data?.message || 'تعذر تحميل مناهج ومقررات الصفوف.';
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

// Helper to get terms allocated to a specific class
function getTermsForClass(classId: number): ClassTermMeta[] {
  const c = rawClassTerms.value.find((item) => item.class_id === classId);
  if (c && c.terms && c.terms.length > 0) {
    return c.terms.map((t) => ({
      id: t.id,
      term_name: t.term_name,
      is_closed: t.is_closed,
    }));
  }
  const g = groups.value.find((grp) => grp.class_id === classId);
  if (g && g.terms) {
    return g.terms.map((t) => ({
      id: t.class_academic_term_id,
      term_name: t.term_name,
      is_closed: t.is_closed,
    }));
  }
  return [];
}

export interface ClassTermMeta {
  id: number;
  term_name: string;
  is_closed: number;
}

export interface TermSubjectAssignment {
  class_academic_term_id: number;
  class_subject_id: number;
  term_name: string;
  passing_score: number;
  max_score: number;
  is_closed: number;
}

export interface UnifiedSubjectMatrixRow {
  subject_id: number;
  name: string;
  code: string;
  class_id: number;
  class_name: string;
  stage_name: string;
  letter: string;
  letterColor: string;
  assignments: Record<string, TermSubjectAssignment>;
}

export interface UnifiedClassMatrixGroup {
  class_id: number;
  class_name: string;
  stage_name: string;
  terms: ClassTermMeta[];
  subjects: UnifiedSubjectMatrixRow[];
}

// Group by Class with pivoted single row per Subject across that class's semesters
const allClassSubjectGroups = computed<UnifiedClassMatrixGroup[]>(() => {
  const result: UnifiedClassMatrixGroup[] = [];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const letterColors = [
    'border-purple-500 text-purple-400 bg-purple-500/10',
    'border-blue-500 text-blue-400 bg-blue-500/10',
    'border-amber-500 text-amber-400 bg-amber-500/10',
    'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    'border-rose-500 text-rose-400 bg-rose-500/10',
  ];

  for (const grp of groups.value || []) {
    const stageName = classStageMap.value[grp.class_id] || 'التعليم العام';
    let classTerms = getTermsForClass(grp.class_id);
    if ((classTerms?.length || 0) === 0 && grp.terms) {
      classTerms = (grp.terms || []).map((t) => ({
        id: t.class_academic_term_id,
        term_name: t.term_name || '',
        is_closed: t.is_closed,
      }));
    }

    const subjectsMap = new Map<number, UnifiedSubjectMatrixRow>();

    for (const term of grp.terms || []) {
      for (const sub of term.subjects || []) {
        if (!subjectsMap.has(sub.subject_id)) {
          const idx = subjectsMap.size;
          subjectsMap.set(sub.subject_id, {
            subject_id: sub.subject_id,
            name: sub.name || '',
            code: sub.code || `SUB-${sub.subject_id}`,
            class_id: grp.class_id,
            class_name: grp.class_name,
            stage_name: stageName,
            letter: letters[idx % letters.length],
            letterColor: letterColors[idx % letterColors.length],
            assignments: {},
          });
        }

        const row = subjectsMap.get(sub.subject_id)!;
        row.assignments[term.term_name] = {
          class_academic_term_id: term.class_academic_term_id,
          class_subject_id: sub.id,
          term_name: term.term_name,
          passing_score: Number(sub.passing_score || 0),
          max_score: Number(sub.max_score || 0),
          is_closed: term.is_closed,
        };
      }
    }

    result.push({
      class_id: grp.class_id,
      class_name: grp.class_name,
      stage_name: stageName,
      terms: classTerms || [],
      subjects: Array.from(subjectsMap.values()),
    });
  }

  return result;
});

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase();

  return (allClassSubjectGroups.value || [])
    .filter((grp) => {
      if (selectedClassFilter.value !== 'all') {
        return grp.class_id === Number(selectedClassFilter.value);
      }
      return true;
    })
    .map((grp) => {
      if (!q) return grp;

      const matchingSubjects = (grp.subjects || []).filter((sub) => {
        const matchName = (sub.name || '').toLowerCase().includes(q);
        const matchCode = (sub.code || '').toLowerCase().includes(q);
        const matchClass = (grp.class_name || '').toLowerCase().includes(q);
        return matchName || matchCode || matchClass;
      });

      return {
        ...grp,
        subjects: matchingSubjects,
      };
    })
    .filter((grp) => {
      if (!q) return true;
      return (grp.subjects?.length || 0) > 0;
    });
});

const totalSubjectsCount = computed(() => {
  return (filteredGroups.value || []).reduce((acc, grp) => acc + (grp.subjects?.length || 0), 0);
});

// Helper function to extract term score info for a row
function getTermAssignment(row: any, columnKey: string, terms: any[]) {
  const term = (terms || []).find((t: any) => `term_${t.id}` === columnKey);
  return term && row.assignments ? row.assignments[term.term_name] : null;
}

// Adapter computed for TaqniyaGroupedTable
const groupedTableData = computed<TableGroup[]>(() =>
  filteredGroups.value.map((grp) => {
    const columns: GroupedTableColumn[] = [
      { key: 'code', label: 'الرمز', width: '6rem', align: 'start' },
      { key: 'name', label: 'المادة الدراسية', minWidth: '190px', align: 'start', icon: BookOpenCheck },
      ...(grp.terms || []).map((t) => ({
        key: `term_${t.id}`,
        label: t.term_name,
        minWidth: '140px',
        align: 'center' as const,
        icon: CalendarDays,
      })),
      { key: 'actions', label: 'إجراءات', width: '8rem', align: 'center' as const },
    ];

    return {
      id: grp.class_id,
      title: grp.class_name,
      badge: grp.stage_name,
      badgeClass: getStageBadgeClass(grp.stage_name),
      subtitle: `${grp.subjects?.length || 0} مواد مقررة (${grp.terms?.length || 0} فصول دراسية)`,
      icon: GraduationCap,
      columns,
      items: grp.subjects || [],
      terms: grp.terms || [],
    };
  }),
);

// Options for forms and filters
const classFilterOptions = computed(() => [
  { value: 'all', label: 'جميع الصفوف الدراسية', code: 'ALL' },
  ...classes.value.map((c) => ({
    value: c.id,
    label: c.name,
    code: (c as any).code || `CLS-${c.id}`,
  })),
]);

const classFormOptions = computed(() =>
  classes.value.map((c) => ({
    value: c.id,
    label: c.name,
    code: (c as any).code || `CLS-${c.id}`,
  })),
);

const subjectFormOptions = computed(() =>
  subjects.value.map((s) => ({
    value: s.id,
    label: s.name,
    code: s.code || `SUB-${s.id}`,
  })),
);

function onClassChange() {
  const terms = getTermsForClass(multiTermForm.value.class_id);
  multiTermForm.value.terms = terms.map((t) => ({
    class_academic_term_id: t.id,
    term_name: t.term_name,
    enabled: true,
    passing_score: 50.0,
    max_score: 100.0,
    is_closed: t.is_closed,
  }));
}

function openCreateDrawer(classId?: number) {
  drawerMode.value = 'create';
  activeRowDetails.value = null;
  const initialClassId = classId || classes.value[0]?.id || 0;
  multiTermForm.value.class_id = initialClassId;
  multiTermForm.value.subject_id = subjects.value[0]?.id || 0;
  onClassChange();
  showDrawer.value = true;
}

function openEditDrawer(row: UnifiedSubjectMatrixRow) {
  drawerMode.value = 'edit';
  activeRowDetails.value = row;
  multiTermForm.value.class_id = row.class_id;
  multiTermForm.value.subject_id = row.subject_id;

  const terms = getTermsForClass(row.class_id);
  multiTermForm.value.terms = terms.map((t) => {
    const existing = row.assignments[t.term_name];
    return {
      class_academic_term_id: t.id,
      term_name: t.term_name,
      class_subject_id: existing?.class_subject_id,
      enabled: !!existing,
      passing_score: existing ? existing.passing_score : 50.0,
      max_score: existing ? existing.max_score : 100.0,
      is_closed: t.is_closed,
    };
  });
  showDrawer.value = true;
}

function openDetails(row: UnifiedSubjectMatrixRow) {
  activeRowDetails.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openEditFromDetails(row: UnifiedSubjectMatrixRow) {
  openEditDrawer(row);
}

// Single submission handles ALL semesters for this subject at once
async function handleSaveMultiTerm() {
  if (!multiTermForm.value.class_id || !multiTermForm.value.subject_id) {
    toast.error('يرجى اختيار الصف والمادة الدراسية.');
    return;
  }

  const enabledTerms = multiTermForm.value.terms.filter((t) => t.enabled);
  if (enabledTerms.length === 0) {
    toast.error('يرجى تفعيل المادة في فصل دراسي واحد على الأقل.');
    return;
  }

  // Validate scores
  for (const t of enabledTerms) {
    if (t.passing_score < 0 || t.max_score <= 0) {
      toast.error(`درجات غير صحيحة في ${t.term_name}.`);
      return;
    }
    if (t.passing_score > t.max_score) {
      toast.error(`درجة النجاح تتجاوز الدرجة العظمى في ${t.term_name}.`);
      return;
    }
  }

  isSubmitting.value = true;
  try {
    const promises: Promise<any>[] = [];

    for (const t of multiTermForm.value.terms) {
      if (t.enabled) {
        if (t.class_subject_id) {
          // Update existing
          promises.push(
            academicApi.updateClassSubject(t.class_subject_id, {
              class_academic_term_id: t.class_academic_term_id,
              subject_id: multiTermForm.value.subject_id,
              passing_score: Number(t.passing_score),
              max_score: Number(t.max_score),
            }),
          );
        } else {
          // Create new assignment
          promises.push(
            academicApi.createClassSubject({
              class_academic_term_id: t.class_academic_term_id,
              subject_id: multiTermForm.value.subject_id,
              passing_score: Number(t.passing_score),
              max_score: Number(t.max_score),
            }),
          );
        }
      } else if (t.class_subject_id) {
        // Was assigned, now unselected -> delete
        promises.push(academicApi.deleteClassSubject(t.class_subject_id));
      }
    }

    await Promise.all(promises);
    toast.success('تم حفظ وتحديث مقرر المادة لكافة الفصول الدراسية بنجاح.');
    showDrawer.value = false;
    await fetchClassSubjects();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ التعديلات.';
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDelete(row: UnifiedSubjectMatrixRow) {
  itemToDelete.value = row;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    const ids = Object.values(itemToDelete.value.assignments).map(
      (a) => a.class_subject_id,
    );
    await Promise.all(ids.map((id) => academicApi.deleteClassSubject(id)));
    toast.success('تمت إزالة المادة من منهج هذا الصف بالكامل.');
    showDeleteModal.value = false;
    if (activeRowDetails.value?.subject_id === itemToDelete.value.subject_id) {
      showDrawer.value = false;
    }
    await fetchClassSubjects();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر إزالة المادة.';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

onMounted(async () => {
  await fetchPredecessors();
  await fetchClassSubjects();
});
</script>

<template>
  <div class="space-y-4 font-sans" dir="rtl">
    <!-- Unified Container Card (Matching the Reference Design System) -->
    <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] p-6 sm:p-7 shadow-sm">
      <!-- Card Header: Title on Right, Controls & Filters on Left -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
        <!-- Title & Subtitle -->
        <div>
          <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
            سجلات مناهج ومقررات الصفوف
          </h2>
          <p class="text-xs text-bx-muted font-medium mt-1">
            إدارة وتعيين المواد الدراسية عبر فصول العام الدراسي، وتعديل معايير الدرجات لكافة السمسترات في نموذج موحد
          </p>
        </div>

        <!-- Controls: Add Button + Search Input + Class Filter Select -->
        <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <!-- Add Button -->
          <button
            @click="openCreateDrawer()"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>إسناد مادة</span>
          </button>

          <!-- Search Input (Pill Shaped) -->
          <div class="relative flex-1 sm:w-60">
            <input
              v-model="search"
              type="text"
              placeholder="بحث في المناهج والمواد..."
              class="w-full px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
            />
          </div>

          <!-- Class Filter Select -->
          <div class="w-52">
            <TaqniyaSelect
              v-model="selectedClassFilter"
              :options="classFilterOptions"
              placeholder="جميع الصفوف"
            />
          </div>
        </div>
      </div>

      <!-- Grouped Curriculum Table Component (TaqniyaGroupedTable) -->
      <TaqniyaGroupedTable
        :groups="groupedTableData"
        :is-loading="loading"
        loading-text="جاري تحميل سجلات مناهج الصفوف..."
        empty-title="لا توجد مقررات تطابق محددات البحث"
        empty-subtitle="جرب تغيير محددات التصفية أو إسناد مادة دراسية جديدة لصفوف المدرسة."
        group-empty-text="لا توجد مواد مسندة لهذا الصف بعد."
        group-action-text="إسناد مادة"
        :group-action-icon="Plus"
        @group-action="openCreateDrawer(Number($event.id))"
      >
        <!-- Custom empty for group -->
        <template #group-empty="{ group }">
          <div class="flex flex-col items-center justify-center gap-2">
            <AlertCircle class="w-7 h-7 text-bx-muted opacity-40" />
            <span>لا توجد مواد مسندة لهذا الصف بعد.</span>
            <button
              @click="openCreateDrawer(Number(group.id))"
              class="text-bx-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1 text-[11px] mt-1"
            >
              <Plus class="w-3 h-3" />
              <span>إسناد أول مادة الآن</span>
            </button>
          </div>
        </template>

        <!-- Code cell -->
        <template #cell-code="{ row }">
          <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-[#B4AED8]/50 dark:border-white/10 text-bx-title/80">
            {{ row.code }}
          </span>
        </template>

        <!-- Name cell -->
        <template #cell-name="{ row }">
          <span class="font-black text-xs text-bx-title block leading-tight">
            {{ row.name }}
          </span>
        </template>

        <!-- Generic cell for semester columns -->
        <template #cell="{ row, column, group }">
          <template v-if="column.key.startsWith('term_')">
            <div
              v-if="getTermAssignment(row, column.key, group.terms)"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 dark:border-emerald-400/40 bg-emerald-500/[0.05] dark:bg-emerald-950/30 shadow-2xs"
            >
              <span class="text-[11px] font-black text-emerald-600 dark:text-emerald-400" title="درجة النجاح">
                {{ getTermAssignment(row, column.key, group.terms).passing_score }}
              </span>
              <span class="text-bx-muted opacity-40 text-[9px] font-bold">/</span>
              <span class="text-[11px] font-black text-bx-title" title="الدرجة العظمى">
                {{ getTermAssignment(row, column.key, group.terms).max_score }}
              </span>
              <span
                v-if="getTermAssignment(row, column.key, group.terms).is_closed === 1"
                class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                title="مغلقة للأرشفة"
              ></span>
            </div>
            <span v-else class="text-slate-400 dark:text-slate-500 font-bold text-xs">—</span>
          </template>
        </template>

        <!-- Actions cell -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-1.5">
            <!-- View Details Button -->
            <button
              @click="openDetails(row)"
              class="w-7 h-7 rounded-full border border-[#B4AED8] bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              title="عرض تفاصيل درجات المادة لكافة الفصول"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>

            <!-- Quick Edit Button -->
            <button
              @click="openEditDrawer(row)"
              title="تعديل درجات المادة لكافة الفصول"
              class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>

            <!-- Quick Delete Button -->
            <button
              @click="confirmDelete(row)"
              title="إزالة المادة من منهج هذا الصف"
              class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </TaqniyaGroupedTable>

      <!-- Table Footer: Records Info (Non-paginated full catalogue) -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 text-xs font-bold text-bx-muted">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
          <span>إجمالي الصفوف المعروضة: <strong class="text-bx-title font-black">{{ filteredGroups?.length || 0 }}</strong> صفوف (مجموع <strong class="text-bx-title font-black">{{ totalSubjectsCount }}</strong> مقرراً مسكناً)</span>
        </div>
        <div class="text-[11px] text-bx-muted">
          مناهج ومقررات الصفوف (عرض كامل بدون تجزئة صفحات)
        </div>
      </div>
    </div>

    <!-- Drawer: Create / Edit / Details (Multi-Term Unified Workflow) -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      @close="showDrawer = false"
      :title="
        drawerMode === 'details'
          ? 'تفاصيل المادة لكافة الفصول الدراسية'
          : drawerMode === 'create'
            ? 'إسناد مادة وتحديد درجات الفصول'
            : 'تعديل درجات المادة لكافة الفصول'
      "
    >
      <!-- Mode 1: Details View Mode (Shows all semesters for this subject at a glance) -->
      <div v-if="drawerMode === 'details' && activeRowDetails" class="space-y-6">
        <!-- Main Subject Header Card -->
        <div class="p-5 rounded-2xl border border-[#B4AED8]/70 dark:border-white/10 bg-purple-500/5 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-400/40 flex items-center justify-center text-bx-primary dark:text-purple-300 shrink-0 shadow-xs">
              <BookOpenCheck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-sm font-black text-bx-title">{{ activeRowDetails.name }}</h4>
              <span class="font-mono text-xs font-bold text-bx-muted">{{ activeRowDetails.code }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 text-xs pt-1 border-t border-[#B4AED8]/40 dark:border-white/10">
            <div class="flex items-center gap-1.5 text-bx-title">
              <GraduationCap class="w-3.5 h-3.5 text-bx-primary" />
              <span class="font-bold">{{ activeRowDetails.class_name }}</span>
            </div>
            <span class="text-bx-muted">|</span>
            <span class="text-bx-muted font-semibold">{{ activeRowDetails.stage_name }}</span>
          </div>
        </div>

        <!-- Semesters Overview Cards -->
        <div class="space-y-3">
          <h5 class="text-xs font-black text-bx-title flex items-center gap-2">
            <CalendarDays class="w-4 h-4 text-bx-primary" />
            <span>حالة المادة عبر فصول العام الدراسي</span>
          </h5>

          <div
            v-for="t in getTermsForClass(activeRowDetails.class_id)"
            :key="t.id"
            class="p-4 rounded-2xl border transition-all"
            :class="
              activeRowDetails.assignments[t.term_name]
                ? 'border-[#B4AED8]/70 dark:border-white/10 bg-[var(--bx-surface-glass)]'
                : 'border-dashed border-[#B4AED8]/40 dark:border-white/5 opacity-60'
            "
          >
            <div class="flex items-center justify-between pb-2 border-b border-[#B4AED8]/30 dark:border-white/10">
              <div class="flex items-center gap-2">
                <CheckCircle2
                  v-if="activeRowDetails.assignments[t.term_name]"
                  class="w-4 h-4 text-emerald-600"
                />
                <span class="font-bold text-xs text-bx-title">{{ t.term_name }}</span>
              </div>

              <span
                v-if="activeRowDetails.assignments[t.term_name]"
                class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
              >
                مسندة
              </span>
              <span
                v-else
                class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-slate-500/20 text-bx-muted bg-slate-500/5"
              >
                غير مسندة
              </span>
            </div>

            <!-- Scores Grid for this Term -->
            <div
              v-if="activeRowDetails.assignments[t.term_name]"
              class="grid grid-cols-2 gap-3 pt-3 text-xs"
            >
              <div>
                <span class="text-bx-muted text-[11px] block">درجة النجاح الصغرى</span>
                <span class="font-black text-emerald-600 dark:text-emerald-400 text-base">
                  {{ activeRowDetails.assignments[t.term_name].passing_score }}
                </span>
              </div>
              <div>
                <span class="text-bx-muted text-[11px] block">الدرجة الكلية العظمى</span>
                <span class="font-black text-bx-title text-base">
                  {{ activeRowDetails.assignments[t.term_name].max_score }}
                </span>
              </div>
            </div>
            <div v-else class="pt-2 text-[11px] text-bx-muted">
              المادة غير مقررة لطلاب الصف في هذا الفصل الدراسي.
            </div>
          </div>
        </div>

        <!-- Actions Inside Details -->
        <div class="space-y-2.5 pt-3 border-t border-[#B4AED8] dark:border-white/[0.08]">
          <button
            @click="openEditFromDetails(activeRowDetails)"
            class="w-full py-2.5 px-4 rounded-full bg-bx-primary text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-bx-primary-hover transition-all cursor-pointer shadow-sm"
          >
            <Edit2 class="w-4 h-4" />
            <span>تعديل درجات المادة لكافة الفصول</span>
          </button>

          <button
            @click="confirmDelete(activeRowDetails)"
            class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 class="w-4 h-4" />
            <span>فك إسناد المادة من الصف بالكامل</span>
          </button>
        </div>
      </div>

      <!-- Mode 2 & 3: Multi-Term Unified Edit / Create Form -->
      <form v-else @submit.prevent="handleSaveMultiTerm" class="space-y-5">
        <!-- Target Class (Disabled in Edit mode, Selectable in Create) -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <GraduationCap class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">الصف الدراسي المستهدف</label>
          </div>
          <TaqniyaSelect
            v-if="drawerMode === 'create'"
            v-model="multiTermForm.class_id"
            :options="classFormOptions"
            :full-width="true"
            placeholder="اختر الصف الدراسي..."
            @change="onClassChange"
          />
          <div
            v-else
            class="px-4 py-2.5 rounded-full border border-[#B4AED8]/60 bg-purple-500/5 text-xs font-bold text-bx-title"
          >
            {{ classes.find((c) => c.id === multiTermForm.class_id)?.name }}
          </div>
          <p class="text-[11px] text-bx-muted">الصف الذي ترغب في ضبط مقررات المادة له</p>
        </div>

        <!-- Target Subject (Disabled in Edit mode, Selectable in Create) -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <BookOpenCheck class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">المادة الدراسية (من بنك المواد)</label>
          </div>
          <TaqniyaSelect
            v-if="drawerMode === 'create'"
            v-model="multiTermForm.subject_id"
            :options="subjectFormOptions"
            :full-width="true"
            placeholder="اختر المادة الدراسية..."
          />
          <div
            v-else
            class="px-4 py-2.5 rounded-full border border-[#B4AED8]/60 bg-purple-500/5 text-xs font-bold text-bx-title"
          >
            {{ subjects.find((s) => s.id === multiTermForm.subject_id)?.name }}
          </div>
        </div>

        <!-- Unified Multi-Term Configuration Cards -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-black text-bx-title flex items-center gap-1.5">
              <CalendarDays class="w-3.5 h-3.5 text-bx-primary" />
              <span>فصول العام الدراسي والدرجات المخصصة:</span>
            </label>
            <span class="text-[11px] text-bx-muted">حدد الفصول واضبط الدرجات في نفس الشاشة</span>
          </div>

          <!-- Term Card for Each Semester -->
          <div
            v-for="term in multiTermForm.terms"
            :key="term.class_academic_term_id"
            class="p-4 rounded-2xl border transition-all space-y-3"
            :class="
              term.enabled
                ? 'border-[#B4AED8] dark:border-white/15 bg-white dark:bg-white/[0.04] shadow-xs'
                : 'border-[#B4AED8]/40 dark:border-white/5 bg-[var(--bx-surface-glass)] opacity-60'
            "
          >
            <!-- Checkbox Toggle Header -->
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="term.enabled"
                  class="w-4 h-4 rounded-md border-[#B4AED8] text-bx-primary focus:ring-0 cursor-pointer accent-purple-600"
                />
                <span class="text-xs font-black text-bx-title">{{ term.term_name }}</span>
              </label>

              <span
                v-if="term.enabled"
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              >
                مقررة في هذا السمستر
              </span>
              <span
                v-else
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-bx-muted"
              >
                معطلة
              </span>
            </div>

            <!-- Scores inputs if enabled -->
            <div v-if="term.enabled" class="grid grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <span class="text-[11px] font-bold text-bx-muted flex items-center gap-1">
                  <Award class="w-3 h-3 text-emerald-600" />
                  درجة النجاح الصغرى
                </span>
                <input
                  v-model.number="term.passing_score"
                  type="number"
                  step="0.5"
                  min="0"
                  class="w-full px-3.5 py-2 rounded-full text-xs bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] text-bx-title focus:outline-none focus:border-bx-primary transition-all font-bold"
                />
              </div>

              <div class="space-y-1">
                <span class="text-[11px] font-bold text-bx-muted flex items-center gap-1">
                  <Award class="w-3 h-3 text-bx-primary" />
                  الدرجة الكلية العظمى
                </span>
                <input
                  v-model.number="term.max_score"
                  type="number"
                  step="0.5"
                  min="1"
                  class="w-full px-3.5 py-2 rounded-full text-xs bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] text-bx-title focus:outline-none focus:border-bx-primary transition-all font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Helper Tip Box -->
        <div class="p-3.5 rounded-2xl bg-purple-500/5 border border-[#B4AED8]/50 dark:border-white/10 text-xs text-bx-muted leading-relaxed flex items-start gap-2.5">
          <Info class="w-4 h-4 text-bx-primary shrink-0 mt-0.5" />
          <p class="text-[11px] leading-relaxed">
            يمكنك تفعيل المادة في فصلين أو ثلاثة فصول دراسية وضبط درجات كل فصل بضغطة زر واحدة دون الحاجة للدخول لكل سمستر بشكل منفرد.
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
            <span>{{ drawerMode === 'create' ? 'إسناد المادة لكافة الفصول' : 'حفظ التعديلات لكافة الفصول' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal using Shared TaqniyaModal -->
    <TaqniyaModal
      :is-open="showDeleteModal"
      title="تأكيد إزالة المادة من منهج الصف"
      subtitle="فك إسناد المادة عن الصف الدراسي بكافة فصوله"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <template #icon>
        <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <Trash2 class="w-5 h-5" />
        </div>
      </template>

      <div class="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-xs text-bx-muted">
        <p class="font-semibold text-rose-600 dark:text-rose-400 mb-1">
          المادة المستهدفة: {{ itemToDelete?.name }} ({{ itemToDelete?.class_name }})
        </p>
        <p class="text-[11px] leading-relaxed">
          سيتم حذف ارتباط المادة بمنهج هذا الصف لكافة الفصول الدراسية المسندة. يُشترط عدم وجود درجات رصد أو جداول حصص معتمدة مرتبطة بها.
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
  </div>
</template>
