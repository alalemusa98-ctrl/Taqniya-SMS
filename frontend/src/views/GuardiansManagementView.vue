<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Link,
  HeartHandshake,
  GraduationCap,
  Users,
} from 'lucide-vue-next';
import {
  guardiansApi,
  type Guardian,
  type GuardianStudentChild,
  type PaginationMeta,
} from '../api/guardians.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';
import TaqniyaModal from '../components/ui/TaqniyaModal.vue';
import GuardianFormDrawer from '../components/guardians/GuardianFormDrawer.vue';
import GuardianDetailDrawer from '../components/guardians/GuardianDetailDrawer.vue';
import GuardianCustodyDrawer from '../components/guardians/GuardianCustodyDrawer.vue';

const toast = useToast();

const relationshipLabels: Record<string, string> = {
  father: 'أب',
  mother: 'أم',
  brother: 'أخ',
  uncle: 'عم / خال',
  other: 'صلة قرابة أخرى',
};

// State
const guardians = ref<Guardian[]>([]);
const meta = ref<PaginationMeta>({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const loading = ref(false);
const isSubmitting = ref(false);

// Filters
const search = ref('');
const currentPage = ref(1);

let activeAbortController: AbortController | null = null;

// Drawer State
const showDrawer = ref(false);
const drawerMode = ref<'details' | 'create' | 'edit'>('create');
const activeGuardian = ref<Guardian | null>(null);

const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);

// Custody Drawer State
const showCustodyDrawer = ref(false);
const selectedGuardianForCustody = ref<Guardian | null>(null);
const custodyChildren = ref<GuardianStudentChild[]>([]);
const loadingCustody = ref(false);
const isLinkingCustody = ref(false);
const custodyErrorMessage = ref<string | null>(null);

// Delete Modal State
const showDeleteModal = ref(false);
const guardianToDelete = ref<Guardian | null>(null);
const isDeleting = ref(false);
const deleteErrorMessage = ref<string | null>(null);

async function fetchGuardians() {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      per_page: meta.value.per_page,
    };
    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    const res = await guardiansApi.getGuardians(params, activeAbortController.signal);
    if (res.data?.success) {
      guardians.value = res.data.data || [];
      if (res.data.meta) {
        meta.value = res.data.meta;
      }
    }
  } catch (err: any) {
    if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
      console.error('Failed to fetch guardians:', err);
      toast.error('حدث خطأ أثناء جلب قائمة أولياء الأمور');
    }
  } finally {
    loading.value = false;
  }
}

// Watchers
watch(currentPage, () => {
  fetchGuardians();
});

let searchDebounceTimeout: any = null;
watch(search, () => {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchGuardians();
  }, 350);
});

// Enriched Guardians with calculated properties
const enrichedGuardians = computed(() => {
  return guardians.value.map((guardian, idx) => {
    const indexNumber = (meta.value.current_page - 1) * meta.value.per_page + idx + 1;
    const code = guardian.user_code || `PAR-${guardian.id}`;
    return {
      ...guardian,
      indexNumber,
      code,
    };
  });
});

// Quick Metrics Ribbon Stats
const stats = computed(() => {
  const total = meta.value.total;
  const withStudents = guardians.value.filter((g) => g.students_count > 0).length;
  const fatherCount = guardians.value.filter((g) => g.relationship === 'father').length;
  const otherCount = guardians.value.filter((g) => g.relationship !== 'father').length;
  return {
    total,
    withStudents,
    fatherCount,
    otherCount,
  };
});

// Table Column Definitions
const tableColumns: TableColumn[] = [
  { key: 'indexNumber', label: '#', width: '50px', align: 'start' },
  { key: 'code', label: 'الرمز', width: '110px', align: 'start' },
  { key: 'full_name', label: 'ولي الأمر والبيانات الشخصية', align: 'start' },
  { key: 'phone', label: 'رقم الهاتف', align: 'start' },
  { key: 'relationship', label: 'صلة القرابة', align: 'start' },
  { key: 'students_count', label: 'الأبناء المكفولين', width: '130px', align: 'center' },
  { key: 'created_at', label: 'تاريخ التسجيل', align: 'start' },
  { key: 'actions', label: 'الإجراءات', width: '150px', align: 'center' },
];

function openCreateDrawer() {
  activeGuardian.value = null;
  drawerMode.value = 'create';
  formErrorMessage.value = null;
  fieldErrors.value = {};
  showDrawer.value = true;
}

function openEditDrawer(guardian: Guardian) {
  activeGuardian.value = guardian;
  drawerMode.value = 'edit';
  formErrorMessage.value = null;
  fieldErrors.value = {};
  showDrawer.value = true;
}

async function openDetailsDrawer(guardian: Guardian) {
  activeGuardian.value = guardian;
  drawerMode.value = 'details';
  showDrawer.value = true;

  try {
    const res = await guardiansApi.getGuardianById(guardian.id);
    if (res.data?.success && res.data.data) {
      activeGuardian.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load full guardian details:', err);
  }
}

function openEditFromDetails() {
  if (!activeGuardian.value) return;
  openEditDrawer(activeGuardian.value);
}

// Custody Management
async function openCustodyDrawer(guardian: Guardian) {
  selectedGuardianForCustody.value = guardian;
  custodyChildren.value = [];
  custodyErrorMessage.value = null;
  showCustodyDrawer.value = true;

  await fetchCustody(guardian.id);
}

async function fetchCustody(guardianId: number) {
  loadingCustody.value = true;
  try {
    const res = await guardiansApi.getGuardianStudents(guardianId);
    if (res.data?.success && res.data.data) {
      custodyChildren.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch custody students:', err);
  } finally {
    loadingCustody.value = false;
  }
}

async function handleLinkCustody(payload: { guardian_id: number; student_id: number; is_primary: number }) {
  isLinkingCustody.value = true;
  custodyErrorMessage.value = null;

  try {
    const res = await guardiansApi.createCustody(payload);
    if (res.data?.success) {
      toast.success(res.data.message || 'تم ربط الطالب بولي الأمر بنجاح.');
      await fetchCustody(payload.guardian_id);
      fetchGuardians();
    }
  } catch (err: any) {
    custodyErrorMessage.value =
      err.response?.data?.message || 'تعذر ربط الطالب بولي الأمر. قد يكون مرتبطاً مسبقاً.';
  } finally {
    isLinkingCustody.value = false;
  }
}

async function handleRemoveCustody(custodyId: number) {
  if (!selectedGuardianForCustody.value) return;

  try {
    const res = await guardiansApi.deleteCustody(custodyId);
    if (res.data?.success) {
      toast.success(res.data.message || 'تم فك وإلغاء رابط الوصاية بنجاح.');
      await fetchCustody(selectedGuardianForCustody.value.id);
      fetchGuardians();
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'تعذر فك رابط الوصاية.');
  }
}

// Save Guardian
async function handleSaveGuardian(payload: { data: any; mode: 'create' | 'edit'; id?: number }) {
  formErrorMessage.value = null;
  fieldErrors.value = {};
  isSubmitting.value = true;

  try {
    if (payload.mode === 'create') {
      const res = await guardiansApi.createGuardian(payload.data);
      if (res.data?.success) {
        toast.success(res.data.message || 'تم إنشاء ملف ولي الأمر وتوليد حسابه بنجاح.');
        showDrawer.value = false;
        fetchGuardians();
      }
    } else if (payload.mode === 'edit' && payload.id) {
      const res = await guardiansApi.updateGuardian(payload.id, payload.data);
      if (res.data?.success) {
        toast.success(res.data.message || 'تم تحديث بيانات ولي الأمر بنجاح.');
        showDrawer.value = false;
        fetchGuardians();
      }
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    if (errorData?.errors) {
      fieldErrors.value = errorData.errors;
    }
    formErrorMessage.value =
      errorData?.message || 'حدث خطأ أثناء حفظ بيانات ولي الأمر.';
  } finally {
    isSubmitting.value = false;
  }
}

// Delete Guardian
function promptDelete(guardian: Guardian) {
  guardianToDelete.value = guardian;
  deleteErrorMessage.value = null;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!guardianToDelete.value) return;
  isDeleting.value = true;
  deleteErrorMessage.value = null;

  try {
    const res = await guardiansApi.deleteGuardian(guardianToDelete.value.id);
    if (res.data?.success) {
      toast.success(res.data.message || 'تم حذف ملف ولي الأمر بنجاح.');
      showDeleteModal.value = false;
      guardianToDelete.value = null;
      fetchGuardians();
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    deleteErrorMessage.value =
      errorData?.message || 'تعذر حذف ملف ولي الأمر. قد يكون مرتبطاً بروابط وصاية بأبناء في المنظومة (Foreign Key Restrict).';
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  fetchGuardians();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Unified Container Card -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        <!-- Card Header: Title on Right, Controls & Filters on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
              سجلات أولياء الأمور والوصاية
            </h2>
            <p class="text-xs text-bx-muted font-medium mt-1">
              إدارة ملفات أولياء الأمور، شبكة الوصاية الأسرية، الحسابات الموحدة (PAR-XXXX) والأبناء
            </p>
          </div>

          <!-- Controls: Add Button + Search Input -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>تسجيل ولي أمر جديد</span>
            </button>

            <!-- Search Input -->
            <div class="relative flex-1 sm:w-64">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث بالاسم أو الهاتف أو الرمز..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>
          </div>
        </div>

        <!-- Quick Metrics Banner -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6">
          <div class="p-3.5 rounded-2xl border border-bx-border bg-purple-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Users class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">إجمالي أولياء الأمور</span>
              <span class="text-base font-black font-display text-bx-title font-mono">{{ stats.total }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-bx-border bg-emerald-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <GraduationCap class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">مرتبطون بأبناء</span>
              <span class="text-base font-black font-display text-emerald-600 dark:text-emerald-400 font-mono">{{ stats.withStudents }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-bx-border bg-blue-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <HeartHandshake class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">صفة (أب)</span>
              <span class="text-base font-black font-display text-blue-600 dark:text-blue-400 font-mono">{{ stats.fatherCount }}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border border-bx-border bg-amber-500/[0.03] flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Users class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] text-bx-muted font-bold block">أوصياء وقرابات أخرى</span>
              <span class="text-base font-black font-display text-amber-600 dark:text-amber-400 font-mono">{{ stats.otherCount }}</span>
            </div>
          </div>
        </div>

        <!-- Shared TaqniyaTable Component -->
        <TaqniyaTable
          :columns="tableColumns"
          :items="enrichedGuardians"
          :is-loading="loading"
          empty-title="لا توجد سجلات تطابق محددات البحث"
          empty-subtitle="جرب تغيير محددات البحث أو تسجيل ولي أمر جديد بالمنظومة."
          :empty-icon="AlertCircle"
        >
          <!-- Sequence Index -->
          <template #cell-indexNumber="{ item }">
            <span class="font-bold text-bx-muted text-xs font-['Alexandria',sans-serif]">
              {{ item.indexNumber }}
            </span>
          </template>

          <!-- Code Pill -->
          <template #cell-code="{ item }">
            <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] border border-bx-border text-bx-title/80">
              {{ item.code }}
            </span>
          </template>

          <!-- Guardian Info -->
          <template #cell-full_name="{ item }">
            <div>
              <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight hover:text-bx-primary transition-colors cursor-pointer" @click="openDetailsDrawer(item)">
                {{ item.full_name }}
              </span>
            </div>
          </template>

          <!-- Phone -->
          <template #cell-phone="{ item }">
            <span class="font-mono text-xs text-bx-muted whitespace-nowrap" dir="ltr">
              {{ item.phone }}
            </span>
          </template>

          <!-- Relationship -->
          <template #cell-relationship="{ item }">
            <span class="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
              {{ relationshipLabels[item.relationship] || item.relationship }}
            </span>
          </template>

          <!-- Students Count -->
          <template #cell-students_count="{ item }">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
              :class="
                item.students_count > 0
                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'border-bx-border text-bx-muted bg-purple-500/[0.02]'
              "
            >
              <GraduationCap class="w-3.5 h-3.5" />
              <span>{{ item.students_count }} طلاب</span>
            </span>
          </template>

          <!-- Created Date -->
          <template #cell-created_at="{ item }">
            <span class="font-['Alexandria',sans-serif] font-medium text-xs text-bx-muted whitespace-nowrap">
              {{ item.created_at ? new Date(item.created_at).toLocaleDateString('ar-LY') : '—' }}
            </span>
          </template>

          <!-- Actions -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-center gap-1.5">
              <button
                type="button"
                @click="openCustodyDrawer(item)"
                class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white dark:border-purple-400 dark:bg-purple-950/80 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="إدارة روابط الوصاية الأسرية"
              >
                <Link class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="openDetailsDrawer(item)"
                class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white dark:border-purple-400 dark:bg-purple-950/80 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="عرض تفاصيل ملف ولي الأمر"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="openEditDrawer(item)"
                class="w-7 h-7 rounded-full border border-sky-300 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:bg-sky-950/80 dark:text-sky-300 dark:hover:bg-sky-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="تعديل بيانات ولي الأمر"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="promptDelete(item)"
                class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="حذف ملف ولي الأمر"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
        </TaqniyaTable>

        <!-- Shared TaqniyaPagination Component -->
        <TaqniyaPagination
          :current-page="currentPage"
          :total-pages="meta.last_page"
          :total="meta.total"
          :is-loading="loading"
          item-name="ولي أمر"
          @page-change="(p) => currentPage = p"
        />
      </div>

      <!-- Feature Drawer: Guardian Form (Create / Edit) -->
      <GuardianFormDrawer
        :is-open="showDrawer && (drawerMode === 'create' || drawerMode === 'edit')"
        :mode="drawerMode === 'create' ? 'create' : 'edit'"
        :guardian="activeGuardian"
        :is-submitting="isSubmitting"
        :error-message="formErrorMessage"
        :field-errors="fieldErrors"
        @close="showDrawer = false"
        @save="handleSaveGuardian"
      />

      <!-- Feature Drawer: Guardian Details Inspection -->
      <GuardianDetailDrawer
        :is-open="showDrawer && drawerMode === 'details'"
        :guardian="activeGuardian"
        @close="showDrawer = false"
        @edit="openEditFromDetails"
        @manage-custody="(g) => { showDrawer = false; openCustodyDrawer(g); }"
      />

      <!-- Feature Drawer: Guardian Custody Relations Management -->
      <GuardianCustodyDrawer
        :is-open="showCustodyDrawer"
        :guardian="selectedGuardianForCustody"
        :custody-children="custodyChildren"
        :loading-custody="loadingCustody"
        :is-linking-custody="isLinkingCustody"
        :custody-error-message="custodyErrorMessage"
        @close="showCustodyDrawer = false"
        @link-custody="handleLinkCustody"
        @remove-custody="handleRemoveCustody"
      />

      <!-- Shared TaqniyaModal for Confirmation Delete -->
      <TaqniyaModal
        :is-open="showDeleteModal"
        title="تأكيد حذف ملف ولي الأمر"
        subtitle="هذا الإجراء محمي بنظام النزاهة المرجعية (RESTRICT)"
        max-width="md"
        @close="showDeleteModal = false"
      >
        <template #icon>
          <div class="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertCircle class="w-6 h-6" />
          </div>
        </template>

        <p class="text-xs text-bx-text leading-relaxed">
          هل أنت متأكد من رغبتك في حذف ملف ولي الأمر:
          <strong class="text-bx-title">{{ guardianToDelete?.full_name }}</strong>
          ({{ guardianToDelete?.user_code }})؟
        </p>

        <div v-if="deleteErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs leading-relaxed">
          {{ deleteErrorMessage }}
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 rounded-xl border border-bx-border text-xs font-bold text-bx-muted hover:bg-bx-canvas transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              @click="confirmDelete"
              class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
              <span>تأكيد الحذف</span>
            </button>
          </div>
        </template>
      </TaqniyaModal>
    </div>
  </TaqniyaErrorBoundary>
</template>
