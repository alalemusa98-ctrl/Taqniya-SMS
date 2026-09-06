<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  academicApi,
  type ClassSubjectsGroupItem,
  type ClassSubjectItem,
  type AcademicClassItem,
  type AcademicSubjectItem,
  type ClassAcademicTermsGroupItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Eye,
  GraduationCap,
  CalendarDays,
  Award,
  Info,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const groups = ref<ClassSubjectsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const subjects = ref<AcademicSubjectItem[]>([]);
const stages = ref<any[]>([]);
const availableTerms = ref<{ id: number; label: string; class_id: number }[]>([]);

// Search & Filter
const search = ref('');
const selectedClassFilter = ref<string | number>('all');
const currentPage = ref(1);
const itemsPerPage = ref(4);

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit' | 'details'>('create');
const activeSubjectToEdit = ref<ClassSubjectItem | null>(null);
const activeRowDetails = ref<UnifiedSubjectRow | null>(null);
const isSubmitting = ref(false);

// Delete confirmation modal
const showDeleteModal = ref(false);
const itemToDelete = ref<{ id: number; name: string } | null>(null);
const isDeleting = ref(false);

const form = ref({
  class_id: 0,
  class_academic_term_id: 0,
  subject_id: 0,
  passing_score: 50.0,
  max_score: 100.0,
});

async function fetchPredecessors() {
  try {
    const [cRes, sRes, tRes, stRes] = await Promise.all([
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getSubjects({ per_page: 100 }),
      academicApi.getClassAcademicTerms({ per_page: 100 }),
      academicApi.getStages(),
    ]);

    classes.value = cRes.data?.data?.classes || cRes.data?.data || [];
    subjects.value = sRes.data?.data?.subjects || sRes.data?.data || [];
    stages.value = stRes.data?.data || [];

    const rawClassTerms: ClassAcademicTermsGroupItem[] = tRes.data?.data?.classes || [];
    const flattened: { id: number; label: string; class_id: number }[] = [];
    rawClassTerms.forEach((c) => {
      c.terms.forEach((t) => {
        flattened.push({
          id: t.id,
          label: `${t.term_name} (${c.class_name})`,
          class_id: c.class_id,
        });
      });
    });
    availableTerms.value = flattened;
  } catch (err: any) {
    console.error('Failed to load predecessor data', err);
  }
}

async function fetchClassSubjects() {
  loading.value = true;
  try {
    const res = await academicApi.getClassSubjects({ per_page: 100 });
    groups.value = res.data?.data?.classes || [];
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تحميل مناهج ومقررات الصفوف.';
    toast.error(msg);
  } finally {
    loading.value = false;
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

export interface UnifiedSubjectRow {
  id: number;
  subject_id: number;
  name: string;
  code: string;
  class_id: number;
  class_name: string;
  stage_name: string;
  term_id: number;
  term_name: string;
  passing_score: number;
  max_score: number;
  is_closed: number;
  letter: string;
  letterColor: string;
  rawSubject: ClassSubjectItem;
}

export interface UnifiedClassSubjectGroup {
  class_id: number;
  class_name: string;
  stage_name: string;
  subjects: UnifiedSubjectRow[];
}

const allClassSubjectGroups = computed<UnifiedClassSubjectGroup[]>(() => {
  const result: UnifiedClassSubjectGroup[] = [];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const letterColors = [
    'border-purple-500 text-purple-400 bg-purple-500/10',
    'border-blue-500 text-blue-400 bg-blue-500/10',
    'border-amber-500 text-amber-400 bg-amber-500/10',
    'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    'border-rose-500 text-rose-400 bg-rose-500/10',
  ];

  for (const grp of groups.value) {
    const stageName = classStageMap.value[grp.class_id] || 'التعليم العام';
    const subjectRows: UnifiedSubjectRow[] = [];
    let idx = 0;

    for (const term of grp.terms || []) {
      for (const sub of term.subjects || []) {
        subjectRows.push({
          id: sub.id,
          subject_id: sub.subject_id,
          name: sub.name,
          code: sub.code || `SUB-${sub.subject_id}`,
          class_id: grp.class_id,
          class_name: grp.class_name,
          stage_name: stageName,
          term_id: term.class_academic_term_id,
          term_name: term.term_name,
          passing_score: Number(sub.passing_score),
          max_score: Number(sub.max_score),
          is_closed: term.is_closed,
          letter: letters[idx % letters.length],
          letterColor: letterColors[idx % letterColors.length],
          rawSubject: sub,
        });
        idx++;
      }
    }

    result.push({
      class_id: grp.class_id,
      class_name: grp.class_name,
      stage_name: stageName,
      subjects: subjectRows,
    });
  }

  return result;
});

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase();

  return allClassSubjectGroups.value
    .filter((grp) => {
      if (selectedClassFilter.value !== 'all') {
        return grp.class_id === Number(selectedClassFilter.value);
      }
      return true;
    })
    .map((grp) => {
      if (!q) return grp;

      const matchingSubjects = grp.subjects.filter((sub) => {
        const matchName = sub.name.toLowerCase().includes(q);
        const matchCode = sub.code.toLowerCase().includes(q);
        const matchTerm = sub.term_name.toLowerCase().includes(q);
        const matchClass = grp.class_name.toLowerCase().includes(q);
        return matchName || matchCode || matchTerm || matchClass;
      });

      return {
        ...grp,
        subjects: matchingSubjects,
      };
    })
    .filter((grp) => {
      if (!q) return true;
      return grp.subjects.length > 0;
    });
});

const totalPages = computed(() => Math.ceil(filteredGroups.value.length / itemsPerPage.value) || 1);
const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredGroups.value.slice(start, start + itemsPerPage.value);
});
const totalSubjectsCount = computed(() => {
  return filteredGroups.value.reduce((acc, g) => acc + g.subjects.length, 0);
});

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

const termFormOptions = computed(() => {
  const filtered = availableTerms.value.filter((t) => t.class_id === form.value.class_id);
  return filtered.map((t) => ({
    value: t.id,
    label: t.label,
    code: `TRM-${t.id}`,
  }));
});

const subjectFormOptions = computed(() =>
  subjects.value.map((s) => ({
    value: s.id,
    label: s.name,
    code: s.code || `SUB-${s.id}`,
  })),
);

function onClassChange() {
  const matchingTerms = availableTerms.value.filter((t) => t.class_id === form.value.class_id);
  form.value.class_academic_term_id = matchingTerms[0]?.id || 0;
}

function openCreateDrawer(classId?: number) {
  drawerMode.value = 'create';
  activeSubjectToEdit.value = null;
  const initialClassId = classId || classes.value[0]?.id || 0;
  form.value = {
    class_id: initialClassId,
    class_academic_term_id: 0,
    subject_id: subjects.value[0]?.id || 0,
    passing_score: 50.0,
    max_score: 100.0,
  };
  onClassChange();
  showDrawer.value = true;
}

function openEditDrawer(row: UnifiedSubjectRow) {
  drawerMode.value = 'edit';
  activeSubjectToEdit.value = row.rawSubject;
  form.value = {
    class_id: row.class_id,
    class_academic_term_id: row.term_id,
    subject_id: row.subject_id,
    passing_score: row.passing_score,
    max_score: row.max_score,
  };
  showDrawer.value = true;
}

function openDetails(row: UnifiedSubjectRow) {
  activeRowDetails.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openEditFromDetails(row: UnifiedSubjectRow) {
  openEditDrawer(row);
}

async function handleSave() {
  if (!form.value.class_academic_term_id || !form.value.subject_id) {
    toast.error('يرجى اختيار الصف، الفترة الدراسية، والمادة.');
    return;
  }
  if (form.value.passing_score < 0 || form.value.max_score <= 0) {
    toast.error('يرجى إدخال درجات تقييم صحيحة.');
    return;
  }
  if (form.value.passing_score > form.value.max_score) {
    toast.error('درجة النجاح لا يمكن أن تتجاوز الدرجة العظمى.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createClassSubject({
        class_academic_term_id: form.value.class_academic_term_id,
        subject_id: form.value.subject_id,
        passing_score: Number(form.value.passing_score),
        max_score: Number(form.value.max_score),
      });
      toast.success(res.data?.message || 'تم إسناد المادة وتحديد درجات التقييم بنجاح.');
    } else if (activeSubjectToEdit.value) {
      const res = await academicApi.updateClassSubject(activeSubjectToEdit.value.id, {
        class_academic_term_id: form.value.class_academic_term_id,
        subject_id: form.value.subject_id,
        passing_score: Number(form.value.passing_score),
        max_score: Number(form.value.max_score),
      });
      toast.success(res.data?.message || 'تم تحديث درجات المادة بالفترة بنجاح.');
    }
    showDrawer.value = false;
    await fetchClassSubjects();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ مقرر المادة.';
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDelete(sub: { id: number; name: string }) {
  itemToDelete.value = sub;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await academicApi.deleteClassSubject(itemToDelete.value.id);
    toast.success(res.data?.message || 'تمت إزالة المادة من منهج الفترة بنجاح.');
    showDeleteModal.value = false;
    if (activeRowDetails.value?.id === itemToDelete.value.id) {
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
            إدارة وتعيين المواد الدراسية، ربطها بالفصول، وتحديد معايير درجات النجاح والدرجات العظمى
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

      <!-- Loading State -->
      <div v-if="loading" class="py-24 text-center text-bx-muted">
        <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
        <span class="text-xs font-bold">جاري تحميل سجلات مناهج الصفوف...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredGroups.length === 0"
        class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
      >
        <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
        <h3 class="text-sm font-bold text-bx-title">لا توجد مقررات تطابق محددات البحث</h3>
        <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو إسناد مادة دراسية جديدة لصف وفترة أكاديمية.</p>
      </div>

      <!-- Unified Table Content: Enclosed in a Bordered Card (Right, Left, Top, Bottom) -->
      <div v-else class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)]">
        <div class="overflow-x-auto">
          <table class="w-full text-start border-collapse text-xs">
            <!-- Table Header with Distinct Background and Crisp Dividers -->
            <thead>
              <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/[0.12] text-bx-muted">
                <th class="py-3.5 px-4 font-bold text-start">الرمز</th>
                <th class="py-3.5 px-4 font-bold text-start">المادة الدراسية</th>
                <th class="py-3.5 px-4 font-bold text-start">الفترة الدراسية</th>
                <th class="py-3.5 px-4 font-bold text-center">درجات التقييم (صغرى / عظمى)</th>
                <th class="py-3.5 px-4 font-bold text-center">الحالة</th>
                <th class="py-3.5 px-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>

            <!-- Table Body with Crisp Dividers & Class Group Headers -->
            <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.12]">
              <template v-for="grp in paginatedGroups" :key="grp.class_id">
                <!-- Class Group Header Row -->
                <tr class="bg-purple-500/[0.05] dark:bg-white/[0.03]">
                  <td colspan="6" class="py-2.5 px-4">
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
                          {{ grp.subjects.length }} مواد مسندة
                        </span>
                        <button
                          @click="openCreateDrawer(grp.class_id)"
                          class="w-8 h-8 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-bx-primary dark:text-purple-300 hover:bg-bx-primary hover:text-white hover:border-bx-primary flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          title="إسناد مادة لهذا الصف الدراسي"
                        >
                          <Plus class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Empty subjects for this class -->
                <tr v-if="grp.subjects.length === 0" class="hover:bg-[var(--bx-row-hover)]/20 transition-colors">
                  <td colspan="6" class="py-4 px-4 text-center text-bx-muted text-xs">
                    <span>لا توجد مواد مسندة لهذا الصف بعد.</span>
                    <button
                      @click="openCreateDrawer(grp.class_id)"
                      class="text-bx-primary font-bold hover:underline me-2 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus class="w-3 h-3" />
                      <span>إسناد أول مادة الآن</span>
                    </button>
                  </td>
                </tr>

                <!-- Subject Rows for this Class -->
                <tr
                  v-for="row in grp.subjects"
                  :key="row.id"
                  class="hover:bg-[var(--bx-row-hover)]/40 transition-colors"
                >
                  <!-- Code (الرمز) -->
                  <td class="py-3.5 px-4 font-mono font-bold text-bx-muted text-xs whitespace-nowrap">
                    {{ row.code }}
                  </td>

                  <!-- Subject with Circular Letter Badge -->
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
                          {{ row.name }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Academic Term -->
                  <td class="py-3.5 px-4 text-xs font-semibold text-bx-muted whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <CalendarDays class="w-3.5 h-3.5 text-bx-primary opacity-70" />
                      <span>{{ row.term_name }}</span>
                    </div>
                  </td>

                  <!-- Scores (نجاح صغرى / عظمى) -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B4AED8]/50 dark:border-white/10 bg-purple-500/[0.04]">
                      <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        الصغرى: {{ row.passing_score }}
                      </span>
                      <span class="text-bx-muted opacity-40">|</span>
                      <span class="text-[11px] font-bold text-bx-title">
                        العظمى: {{ row.max_score }}
                      </span>
                    </div>
                  </td>

                  <!-- Status Pill (الحالة) -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      v-if="row.is_closed === 1"
                      class="inline-block px-3.5 py-1 rounded-full text-xs font-bold border border-rose-500/40 text-rose-600 bg-rose-500/10"
                    >
                      مغلقة للأرشفة
                    </span>
                    <span
                      v-else
                      class="inline-block px-3.5 py-1 rounded-full text-xs font-bold border border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                    >
                      نشطة
                    </span>
                  </td>

                  <!-- Actions (عرض + تعديل + حذف) -->
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

                      <!-- Quick Edit Button -->
                      <button
                        v-if="row.is_closed !== 1"
                        @click="openEditDrawer(row)"
                        title="تعديل درجات المادة"
                        class="w-8 h-8 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-bx-primary dark:text-purple-300 hover:bg-bx-primary hover:text-white hover:border-bx-primary flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>

                      <!-- Quick Delete Button -->
                      <button
                        @click="confirmDelete({ id: row.id, name: row.name })"
                        title="إزالة المادة من منهج الفترة"
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

      <!-- Table Footer: Records Count on Right, Pagination on Left (Without double border) -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5">
        <!-- Records Info -->
        <span class="text-xs font-bold text-bx-muted order-2 sm:order-1">
          عرض {{ (currentPage - 1) * itemsPerPage + 1 }} إلى
          {{ Math.min(currentPage * itemsPerPage, filteredGroups.length) }} من
          {{ filteredGroups.length }} صفوف دراسية (مجموع {{ totalSubjectsCount }} مواد مسندة)
        </span>

        <!-- Pagination Controls -->
        <div class="flex items-center gap-1.5 order-1 sm:order-2">
          <!-- Prev Button -->
          <button
            @click="currentPage > 1 && (currentPage--)"
            :disabled="currentPage === 1"
            class="px-4 py-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            :class="currentPage > 1 ? 'text-bx-title hover:border-bx-primary' : 'text-bx-muted'"
          >
            السابق
          </button>

          <!-- Numbered Page Pills -->
          <div class="flex items-center gap-1">
            <button
              v-for="p in totalPages"
              :key="p"
              @click="currentPage = p"
              class="w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all cursor-pointer"
              :class="
                currentPage === p
                  ? 'bg-bx-primary text-white shadow-sm'
                  : 'text-bx-muted hover:text-bx-title border border-transparent'
              "
            >
              {{ p }}
            </button>
          </div>

          <!-- Next Button -->
          <button
            @click="currentPage < totalPages && (currentPage++)"
            :disabled="currentPage === totalPages"
            class="px-4 py-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            :class="currentPage < totalPages ? 'text-bx-title hover:border-bx-primary' : 'text-bx-muted'"
          >
            التالي
          </button>
        </div>
      </div>
    </div>

    <!-- Drawer for Create / Edit / Details -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      @close="showDrawer = false"
      :title="
        drawerMode === 'details'
          ? 'تفاصيل المادة والدرجات المحددة'
          : drawerMode === 'create'
            ? 'إسناد مادة وتحديد درجات التقييم'
            : 'تعديل درجات المادة بالفترة'
      "
    >
      <!-- Details View Mode -->
      <div v-if="drawerMode === 'details' && activeRowDetails" class="space-y-6">
        <!-- Main Subject Card -->
        <div class="p-5 rounded-2xl border border-[#B4AED8]/70 dark:border-white/10 bg-purple-500/5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full border-2 font-black text-sm flex items-center justify-center shrink-0 shadow-xs"
                :class="activeRowDetails.letterColor"
              >
                {{ activeRowDetails.letter }}
              </div>
              <div>
                <h4 class="text-sm font-black text-bx-title">{{ activeRowDetails.name }}</h4>
                <span class="font-mono text-xs font-bold text-bx-muted">{{ activeRowDetails.code }}</span>
              </div>
            </div>

            <span
              v-if="activeRowDetails.is_closed === 1"
              class="px-3 py-1 rounded-full text-xs font-bold border border-rose-500/40 text-rose-600 bg-rose-500/10"
            >
              مغلقة للأرشفة
            </span>
            <span
              v-else
              class="px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
            >
              نشطة
            </span>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-4 rounded-xl border border-[#B4AED8]/50 dark:border-white/10 bg-[var(--bx-surface-glass)] space-y-1">
            <span class="text-bx-muted font-medium text-[11px] block">الصف الدراسي</span>
            <span class="font-bold text-bx-title block text-sm">{{ activeRowDetails.class_name }}</span>
            <span class="text-[10px] text-bx-muted font-semibold">{{ activeRowDetails.stage_name }}</span>
          </div>

          <div class="p-4 rounded-xl border border-[#B4AED8]/50 dark:border-white/10 bg-[var(--bx-surface-glass)] space-y-1">
            <span class="text-bx-muted font-medium text-[11px] block">الفترة الدراسية (السمستر)</span>
            <span class="font-bold text-bx-title block text-sm">{{ activeRowDetails.term_name }}</span>
          </div>

          <div class="p-4 rounded-xl border border-[#B4AED8]/50 dark:border-white/10 bg-[var(--bx-surface-glass)] space-y-1">
            <span class="text-bx-muted font-medium text-[11px] block">درجة النجاح الصغرى</span>
            <span class="font-black text-emerald-600 dark:text-emerald-400 block text-base">{{ activeRowDetails.passing_score }}</span>
          </div>

          <div class="p-4 rounded-xl border border-[#B4AED8]/50 dark:border-white/10 bg-[var(--bx-surface-glass)] space-y-1">
            <span class="text-bx-muted font-medium text-[11px] block">الدرجة الكلية العظمى</span>
            <span class="font-black text-bx-title block text-base">{{ activeRowDetails.max_score }}</span>
          </div>
        </div>

        <!-- Actions Inside Details -->
        <div class="space-y-2 pt-2 border-t border-[#B4AED8] dark:border-white/[0.08]">
          <button
            v-if="activeRowDetails.is_closed !== 1"
            @click="openEditFromDetails(activeRowDetails)"
            class="w-full py-2.5 px-4 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            <Edit2 class="w-4 h-4" />
            <span>تعديل درجات المادة</span>
          </button>

          <button
            @click="confirmDelete({ id: activeRowDetails.id, name: activeRowDetails.name })"
            class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 class="w-4 h-4" />
            <span>فك إسناد المادة من منهج الفترة</span>
          </button>
        </div>
      </div>

      <!-- Create / Edit Form Mode -->
      <form v-else @submit.prevent="handleSave" class="space-y-5">
        <!-- Target Class -->
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
            @change="onClassChange"
          />
          <p class="text-[11px] text-bx-muted">حدد الصف الذي ترغب في إسناد المادة لمنهجه الدراسي</p>
        </div>

        <!-- Target Term -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <CalendarDays class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">فترة الصف الدراسي (السمستر)</label>
          </div>
          <TaqniyaSelect
            v-model="form.class_academic_term_id"
            :options="termFormOptions"
            :full-width="true"
            placeholder="اختر الفترة الدراسية للصف..."
          />
          <p class="text-[11px] text-bx-muted">الفصل الأكاديمي المخصص لهذا الصف</p>
        </div>

        <!-- Subject from bank -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-bx-title">
            <BookOpenCheck class="w-4 h-4 text-bx-primary shrink-0" />
            <label class="text-xs font-bold">المادة الدراسية (من بنك المواد)</label>
          </div>
          <TaqniyaSelect
            v-model="form.subject_id"
            :options="subjectFormOptions"
            :full-width="true"
            placeholder="اختر المادة الدراسية..."
          />
        </div>

        <!-- Scores Grid -->
        <div class="grid grid-cols-2 gap-3 pt-1">
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5 text-bx-title">
              <Award class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <label class="text-xs font-bold">درجة النجاح الصغرى</label>
            </div>
            <input
              v-model.number="form.passing_score"
              type="number"
              step="0.5"
              min="0"
              class="w-full px-4 py-2.5 rounded-full text-xs bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] text-bx-title focus:outline-none focus:border-bx-primary transition-all font-bold"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5 text-bx-title">
              <Award class="w-3.5 h-3.5 text-bx-primary shrink-0" />
              <label class="text-xs font-bold">الدرجة الكلية العظمى</label>
            </div>
            <input
              v-model.number="form.max_score"
              type="number"
              step="0.5"
              min="1"
              class="w-full px-4 py-2.5 rounded-full text-xs bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] text-bx-title focus:outline-none focus:border-bx-primary transition-all font-bold"
            />
          </div>
        </div>

        <!-- Tip Box -->
        <div class="p-4 rounded-2xl bg-purple-500/5 border border-[#B4AED8]/50 dark:border-white/10 text-xs text-bx-muted leading-relaxed flex items-start gap-2.5">
          <Info class="w-4 h-4 text-bx-primary shrink-0 mt-0.5" />
          <p class="text-[11px] leading-relaxed">
            يجب أن تكون درجة النجاح الصغرى أقل من أو تساوي الدرجة العظمى، وتعتمد عليها حسابات النجاح والرسوب في تقارير الطلاب.
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
            <span>{{ drawerMode === 'create' ? 'إسناد المادة الآن' : 'تحديث درجات المادة' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (Taqniya Squircle Design) -->
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
            <h3 class="font-bold text-sm text-bx-title">تأكيد إزالة المادة من المنهج</h3>
            <p class="text-xs text-bx-muted">هل أنت متأكد من فك إسناد هذه المادة؟</p>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-xs text-bx-muted">
          <p class="font-semibold text-rose-600 dark:text-rose-400 mb-1">المادة المستهدفة: {{ itemToDelete?.name }}</p>
          <p class="text-[11px] leading-relaxed">
            سيتم حذف ارتباط المادة بمنهج هذا الفصل الدراسي. يُشترط عدم وجود درجات رصد أو جداول حصص معتمدة مرتبطة بها.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2">
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
      </div>
    </div>
  </div>
</template>
