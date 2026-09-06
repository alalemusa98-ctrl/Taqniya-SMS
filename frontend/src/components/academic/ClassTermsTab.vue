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
  CalendarDays,
  Plus,
  Search,
  Zap,
  Lock,
  Unlock,
  Edit2,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next';

const toast = useToast();
const loading = ref(false);
const groups = ref<ClassAcademicTermsGroupItem[]>([]);
const classes = ref<AcademicClassItem[]>([]);
const terms = ref<AcademicTermItem[]>([]);

const search = ref('');
const selectedClassFilter = ref<string | number>('all');
const pagination = ref({
  page: 1,
  per_page: 15,
  total: 0,
});

// Drawer state for Create / Edit
const showDrawer = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const activeTermToEdit = ref<ClassTermItem | null>(null);
const isSubmitting = ref(false);

const form = ref({
  class_id: 0,
  academic_term_id: 0,
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

const termFormOptions = computed(() =>
  terms.value.map((t) => ({
    value: t.id,
    label: t.name,
  })),
);

async function fetchPredecessors() {
  try {
    const [cRes, tRes] = await Promise.all([
      academicApi.getClasses({ per_page: 100 }),
      academicApi.getTerms(),
    ]);
    classes.value = cRes.data?.data?.classes || cRes.data?.data || [];
    terms.value = tRes.data?.data || [];
  } catch (err: any) {
    console.error('Failed to load predecessor data', err);
  }
}

async function fetchClassTerms() {
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

    const res = await academicApi.getClassAcademicTerms(params);
    groups.value = res.data?.data?.classes || [];
    if (res.data?.meta) {
      pagination.value.total = res.data.meta.total;
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'تعذر تحميل فترات وحالات الصفوف.';
    toast.error(msg);
  } finally {
    loading.value = false;
  }
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

function openEditDrawer(term: ClassTermItem, classId: number) {
  drawerMode.value = 'edit';
  activeTermToEdit.value = term;
  form.value = {
    class_id: classId,
    academic_term_id: term.academic_term_id,
  };
  showDrawer.value = true;
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

onMounted(async () => {
  await fetchPredecessors();
  await fetchClassTerms();
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
            @input="fetchClassTerms"
            type="text"
            placeholder="البحث باسم الصف أو الفترة..."
            class="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-[var(--bx-surface-solid)] border border-bx-border text-bx-title focus:outline-none focus:ring-2 focus:ring-bx-primary/30"
          />
        </div>
        <div class="w-48">
          <TaqniyaSelect
            v-model="selectedClassFilter"
            :options="classFilterOptions"
            @change="fetchClassTerms"
          />
        </div>
      </div>

      <button
        @click="openCreateDrawer"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bx-primary text-white text-xs font-bold shadow-md shadow-bx-primary/20 hover:bg-bx-primary-hover transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>تخصيص فترة لصف</span>
      </button>
    </div>

    <!-- Content: List of Classes and their Terms -->
    <div v-if="loading" class="flex justify-center items-center py-20 text-bx-muted">
      <Loader2 class="w-8 h-8 animate-spin" />
    </div>

    <div v-else-if="groups.length === 0" class="text-center py-16 bg-[var(--bx-surface-solid)] rounded-3xl border border-bx-border">
      <AlertCircle class="w-12 h-12 mx-auto text-bx-muted mb-3 opacity-60" />
      <h3 class="text-sm font-bold text-bx-title">لا توجد فترات مسجلة تطابق محددات البحث</h3>
      <p class="text-xs text-bx-muted mt-1">ابدأ بتخصيص أول فترة دراسية لصفوف المدرسة.</p>
      <button
        @click="openCreateDrawer"
        class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bx-primary text-white text-xs font-bold"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>تخصيص فترة الآن</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="grp in groups"
        :key="grp.class_id"
        class="bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl p-5 space-y-4 shadow-xs"
      >
        <div class="flex items-center justify-between border-b border-bx-border/60 pb-3">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-bx-primary/10 text-bx-primary">
              <CalendarDays class="w-4 h-4" />
            </span>
            <span class="font-bold text-sm text-bx-title">{{ grp.class_name }}</span>
          </div>
          <span class="text-xs text-bx-muted font-medium">
            {{ grp.terms.length }} فترات مخصصة
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="t in grp.terms"
            :key="t.id"
            class="flex items-center justify-between p-3 rounded-xl border transition-all"
            :class="
              t.is_active === 1
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-bx-border/80 bg-[var(--bx-surface-glass)]'
            "
          >
            <div class="flex items-center gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-bx-title">{{ t.term_name }}</span>
                  <span
                    v-if="t.is_active === 1"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                  >
                    <Zap class="w-2.5 h-2.5" />
                    <span>نشط حالياً</span>
                  </span>
                  <span
                    v-if="t.is_closed === 1"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 border border-rose-500/20"
                  >
                    <Lock class="w-2.5 h-2.5" />
                    <span>مغلقة للأرشفة</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <!-- Activate button -->
              <button
                v-if="t.is_active !== 1"
                @click="handleActivate(t.id)"
                title="تفعيل كفترة نشطة وحيدة لهذا الصف"
                class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
              >
                <Zap class="w-3.5 h-3.5" />
              </button>

              <!-- Close/Open lock toggle -->
              <button
                @click="handleToggleClose(t.id)"
                :title="t.is_closed === 1 ? 'فتح درجات الفترة' : 'إغلاق درجات الفترة للأرشفة'"
                class="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
              >
                <component :is="t.is_closed === 1 ? Unlock : Lock" class="w-3.5 h-3.5" />
              </button>

              <!-- Edit button (disabled if closed) -->
              <button
                v-if="t.is_closed !== 1"
                @click="openEditDrawer(t, grp.class_id)"
                title="تعديل الفترة"
                class="p-1.5 rounded-lg text-bx-muted hover:text-bx-title hover:bg-bx-row-hover transition-all cursor-pointer"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer for Create / Edit -->
    <TaqniyaDrawer
      :is-open="showDrawer"
      @close="showDrawer = false"
      :title="drawerMode === 'create' ? 'تخصيص فترة لصف دراسي' : 'تعديل فترة الصف الدراسي'"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">الصف الدراسي</label>
          <TaqniyaSelect v-model="form.class_id" :options="classFormOptions" />
        </div>

        <div>
          <label class="block text-xs font-bold text-bx-title mb-1.5">الفترة الرسمية (السمستر)</label>
          <TaqniyaSelect v-model="form.academic_term_id" :options="termFormOptions" />
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
            <span>{{ drawerMode === 'create' ? 'تخصيص الفترة' : 'حفظ التعديلات' }}</span>
          </button>
        </div>
      </div>
    </TaqniyaDrawer>
  </div>
</template>
