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
  Search,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const groups = ref<ClassSubjectsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const subjects = ref<AcademicSubjectItem[]>([]);
const availableTerms = ref<{ id: number; label: string; class_id: number }[]>([]);

const search = ref('');
const selectedClassFilter = ref<string | number>('all');
const pagination = ref({
  page: 1,
  per_page: 15,
  total: 0,
});

// Drawer state
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeSubjectToEdit = ref<ClassSubjectItem | null>(null);
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

const termFormOptions = computed(() => {
  const filtered = availableTerms.value.filter((t) => t.class_id === form.value.class_id);
  return filtered.map((t) => ({
    value: t.id,
    label: t.label,
  }));
});

const subjectFormOptions = computed(() =>
  subjects.value.map((s) => ({
    value: s.id,
    label: s.code ? `${s.name} (${s.code})` : s.name,
  })),
);

async function fetchPredecessors() {
  try {
    const [cRes, sRes, tRes] = await Promise.all([
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getSubjects({ per_page: 100 }),
      academicApi.getClassAcademicTerms({ per_page: 100 }),
    ]);

    classes.value = cRes.data?.data?.classes || cRes.data?.data || [];
    subjects.value = sRes.data?.data?.subjects || sRes.data?.data || [];

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

    const res = await academicApi.getClassSubjects(params);
    groups.value = res.data?.data?.classes || [];
    if (res.data?.meta) {
      pagination.value.total = res.data.meta.total;
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تحميل مناهج ومقررات الصفوف.';
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}

function onClassChange() {
  const matchingTerms = availableTerms.value.filter((t) => t.class_id === form.value.class_id);
  form.value.class_academic_term_id = matchingTerms[0]?.id || 0;
}

function openCreateDrawer() {
  drawerMode.value = 'create';
  activeSubjectToEdit.value = null;
  const initialClassId = classes.value[0]?.id || 0;
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

function openEditDrawer(sub: ClassSubjectItem, termId: number, classId: number) {
  drawerMode.value = 'edit';
  activeSubjectToEdit.value = sub;
  form.value = {
    class_id: classId,
    class_academic_term_id: termId,
    subject_id: sub.subject_id,
    passing_score: Number(sub.passing_score),
    max_score: Number(sub.max_score),
  };
  showDrawer.value = true;
}

async function handleSave() {
  if (!form.value.class_academic_term_id || !form.value.subject_id) {
    toast.warning('يرجى اختيار الفترة المخصصة والمادة الدراسية.');
    return;
  }

  if (Number(form.value.passing_score) > Number(form.value.max_score)) {
    toast.warning('درجة النجاح يجب ألا تتجاوز الدرجة الكلية العظمى.');
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
      toast.success(res.data?.message || 'تم إسناد المادة وتحديد الدرجات بنجاح.');
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
    fetchClassSubjects();
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
    fetchClassSubjects();
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
  <div class="space-y-6">
    <!-- Header & Controls -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex flex-1 flex-wrap gap-3 items-center w-full sm:w-auto">
        <div class="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-bx-muted" />
          <input
            v-model="search"
            @input="fetchClassSubjects"
            type="text"
            placeholder="البحث باسم الصف أو المادة..."
            class="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-[var(--bx-surface-solid)] border border-bx-border text-bx-title focus:outline-none focus:ring-2 focus:ring-bx-primary/30"
          />
        </div>
        <div class="w-48">
          <TaqniyaSelect
            v-model="selectedClassFilter"
            :options="classFilterOptions"
            @change="fetchClassSubjects"
          />
        </div>
      </div>

      <button
        @click="openCreateDrawer"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bx-primary text-white text-xs font-bold shadow-md shadow-bx-primary/20 hover:bg-bx-primary-hover transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>إسناد مادة وتحديد درجات</span>
      </button>
    </div>

    <!-- Content: Classes -> Terms -> Subjects -->
    <div v-if="loading" class="flex justify-center items-center py-20 text-bx-muted">
      <Loader2 class="w-8 h-8 animate-spin" />
    </div>

    <div v-else-if="groups.length === 0" class="text-center py-16 bg-[var(--bx-surface-solid)] rounded-3xl border border-bx-border">
      <AlertCircle class="w-12 h-12 mx-auto text-bx-muted mb-3 opacity-60" />
      <h3 class="text-sm font-bold text-bx-title">لا توجد مواد مقررة تطابق محددات البحث</h3>
      <p class="text-xs text-bx-muted mt-1">ابدأ بإسناد وتعيين درجات المواد في فترات صفوف المدرسة.</p>
      <button
        @click="openCreateDrawer"
        class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bx-primary text-white text-xs font-bold"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>إسناد مادة الآن</span>
      </button>
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="grp in groups"
        :key="grp.class_id"
        class="bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl p-5 space-y-4 shadow-xs"
      >
        <div class="flex items-center justify-between border-b border-bx-border/60 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-bx-primary/10 text-bx-primary">
              <BookOpenCheck class="w-4 h-4" />
            </span>
            <span class="font-bold text-sm text-bx-title">{{ grp.class_name }}</span>
          </div>
          <span class="text-xs text-bx-muted font-medium">
            {{ grp.terms.length }} فصول دراسية
          </span>
        </div>

        <!-- Terms in this class -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="term in grp.terms"
            :key="term.class_academic_term_id"
            class="rounded-xl border border-bx-border/80 bg-[var(--bx-surface-glass)] p-4 space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-bx-title">{{ term.term_name }}</span>
                <span
                  v-if="term.is_closed === 1"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 border border-rose-500/20"
                >
                  <Lock class="w-2.5 h-2.5" />
                  <span>مغلقة للأرشفة</span>
                </span>
              </div>
              <span class="text-[11px] text-bx-muted font-medium">
                {{ term.subjects.length }} مواد
              </span>
            </div>

            <!-- Subjects table / list -->
            <div class="space-y-2">
              <div
                v-for="sub in term.subjects"
                :key="sub.id"
                class="flex items-center justify-between p-2.5 rounded-lg border border-bx-border/50 bg-[var(--bx-surface-solid)] text-xs"
              >
                <div>
                  <span class="font-bold text-bx-title">{{ sub.name }}</span>
                  <span v-if="sub.code" class="text-bx-muted text-[10px] ms-1">({{ sub.code }})</span>
                </div>

                <div class="flex items-center gap-3">
                  <div class="inline-flex items-center gap-1.5 text-[11px] text-bx-muted">
                    <span>نجاح: <strong class="text-emerald-600">{{ sub.passing_score }}</strong></span>
                    <span>/</span>
                    <span>عظمى: <strong class="text-bx-title">{{ sub.max_score }}</strong></span>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      v-if="term.is_closed !== 1"
                      @click="openEditDrawer(sub, term.class_academic_term_id, grp.class_id)"
                      title="تعديل درجات المادة"
                      class="p-1 rounded text-bx-muted hover:text-bx-title hover:bg-bx-row-hover transition-colors cursor-pointer"
                    >
                      <Edit2 class="w-3.5 h-3.5" />
                    </button>
                    <button
                      @click="confirmDelete(sub)"
                      title="إزالة المادة من منهج الفترة"
                      class="p-1 rounded text-bx-muted hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer for Assigning / Editing Subject -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      @close="showDrawer = false"
      :title="drawerMode === 'create' ? 'إسناد مادة وتحديد درجات الفترة' : 'تعديل درجات المادة بالفترة'"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">الصف الدراسي</label>
          <TaqniyaSelect
            v-model="form.class_id"
            :options="classFormOptions"
            @change="onClassChange"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">فترة الصف الدراسي (السمستر)</label>
          <TaqniyaSelect v-model="form.class_academic_term_id" :options="termFormOptions" />
        </div>

        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">المادة الدراسية (من بنك المواد)</label>
          <TaqniyaSelect v-model="form.subject_id" :options="subjectFormOptions" />
        </div>

        <div class="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">درجة النجاح الصغرى</label>
            <input
              v-model.number="form.passing_score"
              type="number"
              step="0.5"
              min="0"
              class="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bx-surface-solid)] border border-bx-border text-bx-title focus:outline-none focus:ring-2 focus:ring-bx-primary/30"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">الدرجة الكلية العظمى</label>
            <input
              v-model.number="form.max_score"
              type="number"
              step="0.5"
              min="1"
              class="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bx-surface-solid)] border border-bx-border text-bx-title focus:outline-none focus:ring-2 focus:ring-bx-primary/30"
            />
          </div>
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
            <span>{{ drawerMode === 'create' ? 'إسناد المادة' : 'تحديث الدرجات' }}</span>
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
          <span>تأكيد إزالة المادة من المنهج</span>
        </h3>
        <p class="text-xs text-bx-muted leading-relaxed">
          هل أنت متأكد من رغبتك في إزالة المادة "{{ itemToDelete?.name }}" من منهج هذه الفترة؟
          يُشترط عدم وجود أي درجات مسجلة أو جداول حصص مرتبطة بها.
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
            <span>تأكيد الإزالة</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
