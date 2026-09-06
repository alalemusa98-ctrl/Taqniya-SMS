<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  academicApi,
  type ClassAcademicTermsGroupItem,
  type ClassTermItem,
  type AcademicClassItem,
  type AcademicTermItem,
} from '../../api/academic.api';
import { useToast } from '../../composables/useToast';
import TaqniyaSelect from '../ui/TaqniyaSelect.vue';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
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

// Pagination state (matching screenshot: 10 items per page)
const currentPage = ref(1);
const itemsPerPage = ref(8);

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
  loading.value = true;
  try {
    const res = await academicApi.getClassAcademicTerms({ per_page: 100 });
    rawGroups.value = res.data?.data?.classes || [];
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تحميل فترات وحالات الصفوف.';
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

// Flat list of rows for the unified records table
const allRows = computed<UnifiedTermRow[]>(() => {
  const rows: UnifiedTermRow[] = [];
  const letters = ['A', 'B', 'C', 'D'];
  const letterColors = [
    'border-purple-500 text-purple-400 bg-purple-500/10',
    'border-blue-500 text-blue-400 bg-blue-500/10',
    'border-amber-500 text-amber-400 bg-amber-500/10',
    'border-emerald-500 text-emerald-400 bg-emerald-500/10',
  ];

  let counter = 0;
  for (const grp of rawGroups.value) {
    const stageName = classStageMap.value[grp.class_id] || 'التعليم العام';
    for (const t of grp.terms) {
      counter++;
      const letterIndex = (counter - 1) % letters.length;
      const letter = letters[letterIndex];
      const letterColor = letterColors[letterIndex];

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

      rows.push({
        id: t.id,
        code: `TQ-${String(t.id).padStart(3, '0')}#`,
        class_id: grp.class_id,
        class_name: grp.class_name,
        stage_name: stageName,
        term_id: t.academic_term_id,
        term_name: t.term_name,
        letter,
        letterColor,
        statusLabel,
        statusClass,
        is_active: t.is_active,
        is_closed: t.is_closed,
        raw: t,
      });
    }
  }
  return rows;
});

// Filtered rows based on status pill and search query
const filteredRows = computed(() => {
  return allRows.value.filter((row) => {
    // Status filter pill
    if (statusPill.value === 'active' && row.is_active !== 1) return false;
    if (statusPill.value === 'inactive' && row.is_active !== 0) return false;
    if (statusPill.value === 'closed' && row.is_closed !== 1) return false;

    // Search query
    if (search.value.trim()) {
      const q = search.value.trim().toLowerCase();
      const matchName = row.class_name.toLowerCase().includes(q);
      const matchTerm = row.term_name.toLowerCase().includes(q);
      const matchCode = row.code.toLowerCase().includes(q);
      const matchStage = row.stage_name.toLowerCase().includes(q);
      return matchName || matchTerm || matchCode || matchStage;
    }

    return true;
  });
});

// Pagination computed
const totalPages = computed(() => Math.ceil(filteredRows.value.length / itemsPerPage.value) || 1);
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredRows.value.slice(start, start + itemsPerPage.value);
});

// Drawer & Actions
function openDetails(row: UnifiedTermRow) {
  activeRowDetails.value = row;
  drawerMode.value = 'details';
  showDrawer.value = true;
}

function openCreateDrawer() {
  drawerMode.value = 'create';
  activeTermToEdit.value = null;
  form.value = {
    class_id: classes.value[0]?.id || 0,
    academic_term_id: terms.value[0]?.id || 0,
  };
  showDrawer.value = true;
}

function openEditFromDetails(row: UnifiedTermRow) {
  drawerMode.value = 'edit';
  activeTermToEdit.value = row.raw;
  form.value = {
    class_id: row.class_id,
    academic_term_id: row.term_id,
  };
}

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
  if (!form.value.class_id || !form.value.academic_term_id) {
    toast.warning('يرجى اختيار الصف الدراسي والفترة المرجعية.');
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const res = await academicApi.createClassAcademicTerm({
        class_id: form.value.class_id,
        academic_term_id: form.value.academic_term_id,
      });
      toast.success(res.data?.message || 'تم تخصيص الفترة للصف بنجاح.');
    } else if (activeTermToEdit.value) {
      const res = await academicApi.updateClassAcademicTerm(activeTermToEdit.value.id, {
        class_id: form.value.class_id,
        academic_term_id: form.value.academic_term_id,
      });
      toast.success(res.data?.message || 'تم تحديث فترة الصف بنجاح.');
    }
    showDrawer.value = false;
    fetchClassTerms();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ فترة الصف.';
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
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
  })),
);

const termFormOptions = computed(() =>
  terms.value.map((t) => ({
    value: t.id,
    label: t.name,
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
            @click="openCreateDrawer"
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
        v-else-if="filteredRows.length === 0"
        class="py-20 text-center border-t border-[#B4AED8] dark:border-white/[0.08] space-y-3"
      >
        <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
        <h3 class="text-sm font-bold text-bx-title">لا توجد سجلات تطابق محددات البحث</h3>
        <p class="text-xs text-bx-muted">جرب تغيير محددات التصفية أو تخصيص فترة لصف دراسي جديد.</p>
      </div>

      <!-- Unified Table Content (Matching Screenshot Columns & Rows) -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-start border-collapse text-xs">
          <!-- Table Header with Distinct Background and Crisp Dividers -->
          <thead>
            <tr class="bg-[var(--bx-table-header)] border-y border-[#B4AED8] dark:border-white/[0.08] text-bx-muted">
              <th class="py-3.5 px-4 font-bold text-start">الرمز</th>
              <th class="py-3.5 px-4 font-bold text-start">العنصر</th>
              <th class="py-3.5 px-4 font-bold text-start">التصنيف</th>
              <th class="py-3.5 px-4 font-bold text-center">الحالة</th>
              <th class="py-3.5 px-4 font-bold text-center">إجراءات</th>
            </tr>
          </thead>

          <!-- Table Body with Crisp Dividers -->
          <tbody class="divide-y divide-[#B4AED8] dark:divide-white/[0.08]">
            <tr
              v-for="row in paginatedRows"
              :key="row.id"
              class="hover:bg-[var(--bx-row-hover)]/40 transition-colors"
            >
              <!-- Code (الرمز) -->
              <td class="py-4 px-4 font-mono font-bold text-bx-muted text-xs whitespace-nowrap">
                {{ row.code }}
              </td>

              <!-- Item with Circular Letter Badge (العنصر) -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div
                    class="w-7 h-7 rounded-full border-2 font-black text-[11px] flex items-center justify-center shrink-0"
                    :class="row.letterColor"
                  >
                    {{ row.letter }}
                  </div>
                  <div>
                    <span class="font-black text-sm text-bx-title block">
                      {{ row.class_name }}
                    </span>
                    <span class="text-[11px] text-bx-muted font-medium">
                      {{ row.term_name }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Category (التصنيف) -->
              <td class="py-4 px-4 text-xs font-semibold text-bx-muted whitespace-nowrap">
                {{ row.stage_name }}
              </td>

              <!-- Status Pill (الحالة) -->
              <td class="py-4 px-4 text-center whitespace-nowrap">
                <span
                  class="inline-block px-4 py-1 rounded-full text-xs font-bold border"
                  :class="row.statusClass"
                >
                  {{ row.statusLabel }}
                </span>
              </td>

              <!-- Action: عرض Button (إجراءات) -->
              <td class="py-4 px-4 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    @click="openDetails(row)"
                    class="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-title hover:border-bx-primary hover:text-bx-primary transition-all cursor-pointer bg-transparent"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    <span>عرض</span>
                  </button>

                  <!-- Quick Action Icons -->
                  <button
                    v-if="row.is_active !== 1"
                    @click="handleActivate(row.id)"
                    title="تفعيل الفترة الحالية"
                    class="p-1 rounded-full text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer"
                  >
                    <Zap class="w-3.5 h-3.5" />
                  </button>

                  <button
                    @click="handleToggleClose(row.id)"
                    :title="row.is_closed === 1 ? 'فتح رصد الدرجات' : 'إغلاق رصد الدرجات'"
                    class="p-1 rounded-full text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
                  >
                    <component :is="row.is_closed === 1 ? Lock : Unlock" class="w-3.5 h-3.5" />
                  </button>

                  <button
                    v-if="row.is_active !== 1"
                    @click="confirmDelete(row)"
                    title="فك الارتباط بالفترة"
                    class="p-1 rounded-full text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer: Records Count on Right, Pagination on Left -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#B4AED8] dark:border-white/[0.08]">
        <!-- Records Info -->
        <span class="text-xs font-bold text-bx-muted order-2 sm:order-1">
          عرض {{ (currentPage - 1) * itemsPerPage + 1 }} إلى
          {{ Math.min(currentPage * itemsPerPage, filteredRows.length) }} من
          {{ filteredRows.length }} عناصر
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
        <div class="p-4 rounded-2xl border border-bx-border bg-[var(--bx-surface-solid)] space-y-3">
          <div class="flex items-center justify-between border-b border-bx-border pb-3">
            <span class="text-xs font-bold text-bx-muted">الرمز المرجعي</span>
            <span class="font-mono font-bold text-xs text-bx-primary">{{ activeRowDetails.code }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-bx-border pb-3">
            <span class="text-xs font-bold text-bx-muted">الصف الدراسي</span>
            <span class="font-black text-xs text-bx-title">{{ activeRowDetails.class_name }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-bx-border pb-3">
            <span class="text-xs font-bold text-bx-muted">المرحلة التعليمية</span>
            <span class="font-semibold text-xs text-bx-title">{{ activeRowDetails.stage_name }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-bx-border pb-3">
            <span class="text-xs font-bold text-bx-muted">الفترة الرسمية</span>
            <span class="font-black text-xs text-bx-title">{{ activeRowDetails.term_name }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-bx-border pb-3">
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
        <div class="space-y-2 pt-2">
          <button
            v-if="activeRowDetails.is_active !== 1"
            @click="handleActivate(activeRowDetails.id)"
            class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <Zap class="w-4 h-4" />
            <span>تفعيل هذه الفترة للصف</span>
          </button>

          <button
            @click="handleToggleClose(activeRowDetails.id)"
            class="w-full py-2.5 px-4 rounded-xl border border-bx-border text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            <component :is="activeRowDetails.is_closed === 1 ? Unlock : Lock" class="w-4 h-4" />
            <span>{{ activeRowDetails.is_closed === 1 ? 'إعادة فتح رصد الدرجات' : 'إغلاق رصد الدرجات' }}</span>
          </button>

          <button
            @click="openEditFromDetails(activeRowDetails)"
            class="w-full py-2.5 px-4 rounded-xl border border-bx-border text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
          >
            <Edit2 class="w-4 h-4" />
            <span>تعديل ربط الفترة</span>
          </button>

          <button
            @click="confirmDelete(activeRowDetails)"
            :disabled="activeRowDetails.is_active === 1"
            class="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 class="w-4 h-4" />
            <span>فك الارتباط بالصف الدراسي</span>
          </button>
        </div>
      </div>

      <!-- Create / Edit Mode -->
      <form v-else @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">الصف الدراسي</label>
          <TaqniyaSelect
            v-model="form.class_id"
            :options="classFormOptions"
            placeholder="اختر الصف الدراسي..."
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">الفترة المرجعية</label>
          <TaqniyaSelect
            v-model="form.academic_term_id"
            :options="termFormOptions"
            placeholder="اختر الفترة الدراسية..."
          />
        </div>

        <div class="pt-4 flex items-center justify-end gap-2 border-t border-bx-border">
          <button
            type="button"
            @click="showDrawer = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-bx-muted hover:text-bx-title transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2 rounded-xl bg-bx-primary text-white text-xs font-bold shadow-md shadow-bx-primary/20 hover:bg-bx-primary-hover transition-all cursor-pointer flex items-center gap-2"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ drawerMode === 'create' ? 'تخصيص الآن' : 'حفظ التعديل' }}</span>
          </button>
        </div>
      </form>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal (فك الارتباط) -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="w-full max-w-md bg-[var(--bx-surface-solid)] border border-bx-border rounded-3xl p-6 space-y-4 shadow-xl">
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

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="showDeleteModal = false"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-xl border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title"
          >
            إلغاء التراجع
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:bg-rose-700 flex items-center gap-2 cursor-pointer"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>تأكيد فك الارتباط</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
