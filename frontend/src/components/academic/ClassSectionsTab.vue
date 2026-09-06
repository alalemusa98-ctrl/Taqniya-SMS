<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  academicApi,
  type ClassSectionsGroupItem,
  type AcademicClassItem,
  type AcademicSectionItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import {
  Users2,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  GraduationCap,
  Info,
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

// Pagination state (by class group)
const currentPage = ref(1);
const itemsPerPage = ref(4);

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
  loading.value = true;
  try {
    const res = await academicApi.getClassSections({ per_page: 100 });
    rawGroups.value = res.data?.data?.classes || [];
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تحميل شعب الصفوف الدراسية.';
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

export interface UnifiedClassSectionGroup {
  class_id: number;
  class_name: string;
  stage_name: string;
  sections_count: number;
  sections: UnifiedSectionRow[];
}

// Grouped by Class for the unified records table
const allGroups = computed<UnifiedClassSectionGroup[]>(() => {
  const result: UnifiedClassSectionGroup[] = [];
  const letters = ['A', 'B', 'C', 'D'];
  const letterColors = [
    'border-purple-500 text-purple-400 bg-purple-500/10',
    'border-blue-500 text-blue-400 bg-blue-500/10',
    'border-amber-500 text-amber-400 bg-amber-500/10',
    'border-emerald-500 text-emerald-400 bg-emerald-500/10',
  ];

  for (const grp of rawGroups.value) {
    const stageName = classStageMap.value[grp.class_id] || 'التعليم العام';
    const sectionRows: UnifiedSectionRow[] = [];

    (grp.sections || []).forEach((s, index) => {
      const letter = letters[index % letters.length];
      const letterColor = letterColors[index % letterColors.length];

      sectionRows.push({
        id: s.id,
        code: `TQ-CS-${String(s.id).padStart(3, '0')}#`,
        class_id: grp.class_id,
        class_name: grp.class_name,
        stage_name: stageName,
        section_id: s.section_id,
        section_name: s.name,
        letter,
        letterColor,
        statusLabel: 'مسكنة ونشطة',
        statusClass: 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10',
      });
    });

    result.push({
      class_id: grp.class_id,
      class_name: grp.class_name,
      stage_name: stageName,
      sections_count: sectionRows.length,
      sections: sectionRows,
    });
  }

  return result;
});

// Filtered groups based on status pill and search query
const filteredGroups = computed(() => {
  return allGroups.value
    .map((grp) => {
      // Status pill filter
      if (statusPill.value === 'assigned' && grp.sections.length === 0) return null;
      if (statusPill.value === 'empty' && grp.sections.length > 0) return null;

      // Filter child sections by search
      const matchingSections = grp.sections.filter((row) => {
        if (search.value.trim()) {
          const q = search.value.trim().toLowerCase();
          const matchClass = grp.class_name.toLowerCase().includes(q);
          const matchSec = row.section_name.toLowerCase().includes(q);
          const matchCode = row.code.toLowerCase().includes(q);
          const matchStage = grp.stage_name.toLowerCase().includes(q);
          return matchClass || matchSec || matchCode || matchStage;
        }
        return true;
      });

      // If search query matches class name, keep all sections
      if (search.value.trim() && grp.class_name.toLowerCase().includes(search.value.trim().toLowerCase())) {
        return grp;
      }

      // If filtering by search and no child sections matched, exclude group
      if (search.value.trim() && matchingSections.length === 0) {
        return null;
      }

      return {
        ...grp,
        sections: matchingSections,
      };
    })
    .filter((grp): grp is UnifiedClassSectionGroup => grp !== null);
});

// Pagination
const totalPages = computed(() => Math.ceil(filteredGroups.value.length / itemsPerPage.value) || 1);
const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredGroups.value.slice(start, start + itemsPerPage.value);
});
const totalSectionsCount = computed(() => {
  return filteredGroups.value.reduce((acc, g) => acc + g.sections.length, 0);
});

function openDetails(row: UnifiedSectionRow) {
  activeRowDetails.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openCreateDrawer(classId?: number) {
  drawerMode.value = 'create';
  form.value = {
    class_id: classId || classes.value[0]?.id || 0,
    section_id: sections.value[0]?.id || 0,
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
            سجلات تسكين الشُعب الموحدة
          </h2>
          <p class="text-xs text-bx-muted font-medium mt-1">
            إدارة وتسكين الشُعب الدراسية لكل صف، والتحكم في إسناد وفك ربط الشُعب
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
            <span>تسكين شعبة بصف</span>
          </button>

          <!-- Search Input (Pill Shaped) -->
          <div class="relative flex-1 sm:w-60">
            <input
              v-model="search"
              type="text"
              placeholder="بحث في الصفوف أو الشُعب..."
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
              شُعب مسكنة
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
              صفوف غير مسكنة
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-24 text-center text-bx-muted">
        <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
        <span class="text-xs font-bold">جاري تحميل سجلات تسكين الشُعب...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredGroups.length === 0"
        class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
      >
        <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
        <h3 class="text-sm font-bold text-bx-title">لا توجد شُعب مسندة تطابق محددات البحث</h3>
        <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو تسكين شعبة دراسية لصف جديد.</p>
      </div>

      <!-- Unified Table Content (Matching Screenshot Columns & Rows) -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <!-- Table Header with Distinct Background and Crisp Dividers -->
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-y border-[#B4AED8] dark:border-white/[0.08] text-bx-muted">
              <th class="py-3.5 px-4 font-bold text-start">الرمز</th>
              <th class="py-3.5 px-4 font-bold text-start">الشعبة الدراسية</th>
              <th class="py-3.5 px-4 font-bold text-center">إجراءات</th>
            </tr>
          </thead>

          <!-- Table Body with Crisp Dividers & Class Group Headers -->
          <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.08]">
            <template v-for="grp in paginatedGroups" :key="grp.class_id">
              <!-- Class Group Header Row -->
              <tr class="bg-purple-500/[0.05] dark:bg-white/[0.03]">
                <td colspan="3" class="py-2.5 px-4">
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
                        {{ grp.sections.length }} شُعب مفتوحة
                      </span>
                      <button
                        @click="openCreateDrawer(grp.class_id)"
                        class="w-8 h-8 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-bx-primary dark:text-purple-300 hover:bg-bx-primary hover:text-white hover:border-bx-primary flex items-center justify-center transition-all cursor-pointer shadow-xs"
                        title="تسكين شعبة إضافية لهذا الصف"
                      >
                        <Plus class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Empty sections for this class -->
              <tr v-if="grp.sections.length === 0" class="hover:bg-[var(--bx-row-hover)]/20 transition-colors">
                <td colspan="3" class="py-4 px-4 text-center text-bx-muted text-xs">
                  <span>لا توجد شُعب مسكنة لهذا الصف بعد.</span>
                  <button
                    @click="openCreateDrawer(grp.class_id)"
                    class="text-bx-primary font-bold hover:underline me-2 cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus class="w-3 h-3" />
                    <span>تسكين أول شعبة الآن</span>
                  </button>
                </td>
              </tr>

              <!-- Section Rows for this Class -->
              <tr
                v-for="row in grp.sections"
                :key="row.id"
                class="hover:bg-[var(--bx-row-hover)]/40 transition-colors"
              >
                <!-- Code (الرمز) -->
                <td class="py-3.5 px-4 font-mono font-bold text-bx-muted text-xs whitespace-nowrap">
                  {{ row.code }}
                </td>

                <!-- Item with Circular Letter Badge (العنصر: اسم الشعبة) -->
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
                        {{ row.section_name }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Action: عرض & فك الارتباط (إجراءات) -->
                <td class="py-3.5 px-4 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-2.5">
                    <!-- View Details Button with Text + Icon -->
                    <button
                      @click="openDetails(row)"
                      class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-primary dark:text-purple-300 bg-white dark:bg-white/[0.05] hover:bg-bx-primary hover:text-white hover:border-bx-primary transition-all cursor-pointer shadow-xs"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      <span>عرض</span>
                    </button>

                    <!-- Quick Delete / Unlink Button (Matching reference squircle icon button) -->
                    <button
                      @click="confirmDelete({ id: row.id, name: row.section_name })"
                      title="فك ربط الشعبة من الصف"
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

      <!-- Table Footer: Records Count on Right, Pagination on Left -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#B4AED8] dark:border-white/[0.08]">
        <!-- Records Info -->
        <span class="text-xs font-bold text-bx-muted order-2 sm:order-1">
          عرض {{ (currentPage - 1) * itemsPerPage + 1 }} إلى
          {{ Math.min(currentPage * itemsPerPage, filteredGroups.length) }} من
          {{ filteredGroups.length }} صفوف دراسية (مجموع {{ totalSectionsCount }} شُعب مسكنة)
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
