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
  Search,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const groups = ref<ClassSectionsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const sections = ref<AcademicSectionItem[]>([]);

const search = ref('');
const selectedClassFilter = ref<string | number>('all');
const pagination = ref({
  page: 1,
  per_page: 15,
  total: 0,
});

// Drawer state for assigning section
const showDrawer = ref(false);
const isSubmitting = ref(false);

// Unassign modal
const showDeleteModal = ref(false);
const itemToDelete = ref<{ id: number; name: string } | null>(null);
const isDeleting = ref(false);

const form = ref({
  class_id: 0,
  section_id: 0,
});

const classFilterOptions = computed(() => [
  { value: 'all', label: 'جميع الصفوف الدراسية' },
  ...classes.value.map((c) => ({
    value: c.id,
    label: c.name,
  })),
]);

const classFormOptions = computed(() =>
  classes.value.map((c) => ({
    value: c.id,
    label: c.name,
  })),
);

const sectionFormOptions = computed(() =>
  sections.value.map((s) => ({
    value: s.id,
    label: s.name,
  })),
);

async function fetchPredecessors() {
  try {
    const [cRes, sRes] = await Promise.all([
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getSections({ per_page: 100 }),
    ]);
    classes.value = cRes.data?.data?.classes || cRes.data?.data || [];
    sections.value = sRes.data?.data?.sections || sRes.data?.data || [];
  } catch (err: any) {
    console.error('Failed to load predecessor data', err);
  }
}

async function fetchClassSections() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      per_page: pagination.value.per_page,
    };
    if (selectedClassFilter.value !== 'all') {
      params.class_id = selectedClassFilter.value;
    }
    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    const res = await academicApi.getClassSections(params);
    groups.value = res.data?.data?.classes || [];
    if (res.data?.meta) {
      pagination.value.total = res.data.meta.total;
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تحميل شعب الصفوف الدراسية.';
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}

function changePage(newPage: number) {
  pagination.value.page = newPage;
  fetchClassSections();
}

function openCreateDrawer() {
  form.value = {
    class_id: classes.value[0]?.id || 0,
    section_id: sections.value[0]?.id || 0,
  };
  showDrawer.value = true;
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
    fetchClassSections();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر فك ربط الشعبة.';
    toast.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

onMounted(async () => {
  await fetchPredecessors();
  await fetchClassSections();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Controls -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex flex-1 flex-wrap gap-3 items-center w-full sm:w-auto">
        <div class="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-bx-muted" />
          <input
            v-model="search"
            @input="fetchClassSections"
            type="text"
            placeholder="البحث باسم الصف أو الشعبة..."
            class="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-[var(--bx-surface-solid)] border border-bx-border text-bx-title focus:outline-none focus:ring-2 focus:ring-bx-primary/30"
          />
        </div>
        <div class="w-48">
          <TaqniyaSelect
            v-model="selectedClassFilter"
            :options="classFilterOptions"
            @change="fetchClassSections"
          />
        </div>
      </div>

      <button
        @click="openCreateDrawer"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bx-primary text-white text-xs font-bold shadow-md shadow-bx-primary/20 hover:bg-bx-primary-hover transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>تسكين شعبة بصف</span>
      </button>
    </div>

    <!-- Content: Cards of Classes and Sections -->
    <div v-if="loading" class="flex justify-center items-center py-20 text-bx-muted">
      <Loader2 class="w-8 h-8 animate-spin" />
    </div>

    <div v-else-if="groups.length === 0" class="text-center py-16 bg-[var(--bx-surface-solid)] rounded-3xl border border-bx-border">
      <AlertCircle class="w-12 h-12 mx-auto text-bx-muted mb-3 opacity-60" />
      <h3 class="text-sm font-bold text-bx-title">لا توجد شعب مسندة لصفوف تطابق محددات البحث</h3>
      <p class="text-xs text-bx-muted mt-1">ابدأ بفتح وتسكين أول شعبة دراسية لصفوف المدرسة.</p>
      <button
        @click="openCreateDrawer"
        class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bx-primary text-white text-xs font-bold"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>تسكين شعبة الآن</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="grp in groups"
        :key="grp.class_id"
        class="bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl p-5 space-y-4 shadow-xs"
      >
        <div class="flex items-center justify-between border-b border-bx-border/60 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-bx-primary/10 text-bx-primary">
              <Users2 class="w-4 h-4" />
            </span>
            <span class="font-bold text-sm text-bx-title">{{ grp.class_name }}</span>
          </div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-bx-primary/10 text-bx-primary">
            {{ grp.sections_count }} شُعب مفتوحة
          </span>
        </div>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="s in grp.sections"
            :key="s.id"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-bx-border/80 bg-[var(--bx-surface-glass)] hover:border-bx-primary/40 transition-all text-xs font-bold text-bx-title group"
          >
            <span>{{ s.name }}</span>
            <button
              @click="confirmDelete(s)"
              title="فك ربط الشعبة من الصف"
              class="text-bx-muted hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Bar -->
    <div
      v-if="groups.length > 0 && pagination.total > pagination.per_page"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl text-xs font-bold text-bx-muted"
    >
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-bx-primary"></span>
        <span>إجمالي الصفوف والشُعب: <strong class="text-bx-title font-black">{{ pagination.total }}</strong></span>
      </div>
      <div class="flex items-center gap-2">
        <button
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
          class="px-2.5 py-1 rounded-lg border border-bx-border bg-[var(--bx-surface-solid)] hover:bg-bx-row-hover text-bx-title disabled:opacity-40 cursor-pointer"
        >
          السابق
        </button>
        <span class="text-[11px] px-1">صفحة {{ pagination.page }} من {{ Math.ceil(pagination.total / pagination.per_page) || 1 }}</span>
        <button
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.per_page)"
          @click="changePage(pagination.page + 1)"
          class="px-2.5 py-1 rounded-lg border border-bx-border bg-[var(--bx-surface-solid)] hover:bg-bx-row-hover text-bx-title disabled:opacity-40 cursor-pointer"
        >
          التالي
        </button>
      </div>
    </div>

    <!-- Drawer for Assigning Section -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      @close="showDrawer = false"
      title="فتح وتسكين شعبة لصف دراسي"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">الصف الدراسي</label>
          <TaqniyaSelect v-model="form.class_id" :options="classFormOptions" />
        </div>

        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">الشعبة العامة (من بنك الشُعب)</label>
          <TaqniyaSelect v-model="form.section_id" :options="sectionFormOptions" />
        </div>

        <div class="pt-4 flex justify-end gap-2">
          <button
            @click="showDrawer = false"
            class="px-4 py-2 rounded-xl text-xs font-bold border border-bx-border text-bx-muted hover:bg-bx-row-hover"
          >
            إلغاء
          </button>
          <button
            @click="handleSave"
            :disabled="isSubmitting"
            class="px-5 py-2 rounded-xl text-xs font-bold bg-bx-primary text-white hover:bg-bx-primary-hover flex items-center gap-1.5"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>تسكين الشعبة</span>
          </button>
        </div>
      </div>
    </TaqniyaDrawer>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div class="bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <h3 class="text-sm font-bold text-bx-title flex items-center gap-2 text-rose-600">
          <AlertCircle class="w-4 h-4" />
          <span>تأكيد فك ربط الشعبة</span>
        </h3>
        <p class="text-xs text-bx-muted leading-relaxed">
          هل أنت متأكد من رغبتك في فك ربط الشعبة "{{ itemToDelete?.name }}" من هذا الصف؟
          يُشترط عدم وجود أي طلاب مسكنين بها.
        </p>
        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-xl text-xs font-bold border border-bx-border text-bx-muted hover:bg-bx-row-hover"
          >
            إلغاء
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>تأكيد فك الربط</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
