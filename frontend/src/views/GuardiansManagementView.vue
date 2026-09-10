<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Phone,
  Lock,
  ChevronRight,
  ChevronLeft,
  Save,
  Link,
  HeartHandshake,
  User,
  Calendar,
  GraduationCap,
  Users,
  CheckCircle2,
  TrendingUp,
} from 'lucide-vue-next';
import {
  guardiansApi,
  type Guardian,
  type GuardianStudentChild,
  type PaginationMeta,
} from '../api/guardians.api';
import { studentsApi, type Student } from '../api/students.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';

const TaqniyaDrawer = defineAsyncComponent(() => import('../components/ui/TaqniyaDrawer.vue'));
const toast = useToast();

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

// Form State
const form = ref({
  full_name: '',
  phone: '',
  relationship: 'father' as 'father' | 'mother' | 'brother' | 'uncle' | 'other',
  password: '',
});
const fieldErrors = ref<Record<string, string[]>>({});
const formErrorMessage = ref<string | null>(null);

// Custody Drawer & On-Demand Search State
const showCustodyDrawer = ref(false);
const selectedGuardianForCustody = ref<Guardian | null>(null);
const custodyChildren = ref<GuardianStudentChild[]>([]);
const loadingCustody = ref(false);
const isLinkingCustody = ref(false);
const custodyErrorMessage = ref<string | null>(null);

// On-demand student search (لا يتم جلب الأسماء مسبقاً، بل يكتب المستخدم ويوجد زر لعرض النتائج)
const studentSearchQuery = ref('');
const isSearchingStudents = ref(false);
const searchedStudents = ref<Student[]>([]);
const hasSearchedStudents = ref(false);
const selectedStudentToLink = ref<Student | null>(null);
const linkCustodyType = ref<number>(1);

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
      per_page: 15,
    };
    if (search.value.trim()) {
      params.search = search.value.trim();
    }

    const res = await guardiansApi.getGuardians(params, activeAbortController.signal);
    if (res.data && res.data.success) {
      guardians.value = res.data.data;
      meta.value = res.data.meta;
    }
  } catch (err: any) {
    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
      console.error('Error fetching guardians:', err);
      toast.error('تعذر جلب قائمة أولياء الأمور.');
    }
  } finally {
    loading.value = false;
  }
}

interface EnrichedGuardianRow extends Guardian {
  indexNumber: number;
  code: string;
}

const enrichedGuardians = computed<EnrichedGuardianRow[]>(() => {
  return guardians.value.map((g, index) => {
    const indexNumber = (meta.value.current_page - 1) * meta.value.per_page + index + 1;
    return {
      ...g,
      indexNumber,
      code: `${g.user_code}#`,
    };
  });
});

const stats = computed(() => {
  const total = meta.value.total;
  const parentsCount = guardians.value.filter(
    (g) => g.relationship === 'father' || g.relationship === 'mother'
  ).length;
  const othersCount = guardians.value.filter(
    (g) => g.relationship !== 'father' && g.relationship !== 'mother'
  ).length;
  const totalCustodyCount = guardians.value.reduce(
    (acc, g) => acc + (Number(g.students_count) || 0),
    0
  );
  const sampleCount = guardians.value.length || 1;
  const parentsPercentage = Math.round((parentsCount / sampleCount) * 100);
  const othersPercentage = Math.round((othersCount / sampleCount) * 100);

  return {
    total,
    parentsCount,
    othersCount,
    totalCustodyCount,
    parentsPercentage,
    othersPercentage,
  };
});

// Watchers
let debounceTimer: any = null;
watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchGuardians();
  }, 350);
});

watch(currentPage, () => {
  fetchGuardians();
});

function openCreateDrawer() {
  drawerMode.value = 'create';
  activeGuardian.value = null;
  form.value = {
    full_name: '',
    phone: '',
    relationship: 'father',
    password: '',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

function openEditDrawer(guardian: Guardian) {
  drawerMode.value = 'edit';
  activeGuardian.value = guardian;
  form.value = {
    full_name: guardian.full_name,
    phone: guardian.phone,
    relationship: guardian.relationship,
    password: '',
  };
  fieldErrors.value = {};
  formErrorMessage.value = null;
  showDrawer.value = true;
}

function openDetailsDrawer(guardian: Guardian) {
  drawerMode.value = 'details';
  activeGuardian.value = guardian;
  showDrawer.value = true;
}

function openEditFromDetails() {
  if (!activeGuardian.value) return;
  openEditDrawer(activeGuardian.value);
}

async function handleSaveGuardian() {
  formErrorMessage.value = null;
  fieldErrors.value = {};

  if (!form.value.full_name.trim()) {
    fieldErrors.value.full_name = ['الاسم الكامل لولي الأمر مطلوب.'];
    return;
  }

  if (!form.value.phone.trim()) {
    fieldErrors.value.phone = ['رقم هاتف التواصل مطلوب.'];
    return;
  }

  if (drawerMode.value === 'create' && !form.value.password) {
    fieldErrors.value.password = ['كلمة المرور مطلوبة عند إنشاء حساب ولي الأمر.'];
    return;
  }

  isSubmitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      const payload: any = {
        full_name: form.value.full_name.trim(),
        phone: form.value.phone.trim(),
        relationship: form.value.relationship,
        password: form.value.password,
      };

      const res = await guardiansApi.createGuardian(payload);
      if (res.data.success) {
        toast.success(res.data.message || 'تم إنشاء ملف ولي الأمر وتوليد حسابه بنجاح.');
        showDrawer.value = false;
        fetchGuardians();
      }
    } else if (drawerMode.value === 'edit' && activeGuardian.value) {
      const payload: any = {
        full_name: form.value.full_name.trim(),
        phone: form.value.phone.trim(),
        relationship: form.value.relationship,
      };
      if (form.value.password?.trim()) payload.password = form.value.password.trim();

      const res = await guardiansApi.updateGuardian(activeGuardian.value.id, payload);
      if (res.data.success) {
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
    formErrorMessage.value = errorData?.message || 'حدث خطأ أثناء حفظ ملف ولي الأمر.';
  } finally {
    isSubmitting.value = false;
  }
}

// Custody Management
async function openCustodyDrawer(guardian: Guardian) {
  showDrawer.value = false;
  selectedGuardianForCustody.value = guardian;
  custodyErrorMessage.value = null;
  studentSearchQuery.value = '';
  searchedStudents.value = [];
  hasSearchedStudents.value = false;
  selectedStudentToLink.value = null;
  linkCustodyType.value = 1;
  showCustodyDrawer.value = true;
  await fetchGuardianChildren(guardian.id);
}

// Alias for backwards compatibility
const openCustodyModal = openCustodyDrawer;

async function fetchGuardianChildren(guardianId: number) {
  loadingCustody.value = true;
  try {
    const res = await guardiansApi.getGuardianStudents(guardianId);
    if (res.data && res.data.success) {
      custodyChildren.value = res.data.data;
    }
  } catch (err: any) {
    console.error('Error fetching custody:', err);
    toast.error('تعذر جلب قائمة الأبناء المكفولين.');
  } finally {
    loadingCustody.value = false;
  }
}

async function searchStudentsOnDemand() {
  if (!studentSearchQuery.value.trim()) {
    toast.warning('يرجى كتابة اسم الطالب أو رمزه للبحث.');
    return;
  }
  isSearchingStudents.value = true;
  custodyErrorMessage.value = null;
  selectedStudentToLink.value = null;
  try {
    const res = await studentsApi.getStudents({
      search: studentSearchQuery.value.trim(),
      per_page: 10,
    });
    if (res.data && res.data.success) {
      searchedStudents.value = res.data.data;
      hasSearchedStudents.value = true;
    }
  } catch (err: any) {
    console.error('Error searching students:', err);
    toast.error('حدث خطأ أثناء البحث عن الطلاب.');
  } finally {
    isSearchingStudents.value = false;
  }
}

function selectStudentToLink(student: Student) {
  const alreadyLinked = custodyChildren.value.some((c) => c.student_id === student.id);
  if (alreadyLinked) {
    toast.warning('هذا الطالب مرتبط بالفعل بهذا الوصي.');
    return;
  }
  selectedStudentToLink.value = student;
}

function cancelSelectedStudent() {
  selectedStudentToLink.value = null;
}

async function handleLinkStudent() {
  if (!selectedGuardianForCustody.value || !selectedStudentToLink.value) return;

  isLinkingCustody.value = true;
  custodyErrorMessage.value = null;

  try {
    const res = await guardiansApi.createCustody({
      guardian_id: selectedGuardianForCustody.value.id,
      student_id: selectedStudentToLink.value.id,
      is_primary: linkCustodyType.value,
    });
    if (res.data.success) {
      toast.success(res.data.message || 'تم ربط وصاية الطالب بنجاح.');
      selectedStudentToLink.value = null;
      studentSearchQuery.value = '';
      searchedStudents.value = [];
      hasSearchedStudents.value = false;
      await fetchGuardianChildren(selectedGuardianForCustody.value.id);
      fetchGuardians();
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    custodyErrorMessage.value = errorData?.message || 'تعذر ربط الوصاية.';
  } finally {
    isLinkingCustody.value = false;
  }
}

async function handleUnlinkStudent(custodyId: number) {
  if (!confirm('هل أنت متأكد من فك رابط الوصاية مع هذا الطالب؟')) return;
  try {
    const res = await guardiansApi.deleteCustody(custodyId);
    if (res.data.success) {
      toast.success(res.data.message || 'تم فك رابط الوصاية بنجاح.');
      if (selectedGuardianForCustody.value) {
        await fetchGuardianChildren(selectedGuardianForCustody.value.id);
        fetchGuardians();
      }
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    toast.error(errorData?.message || 'تعذر فك رابط الوصاية.');
  }
}

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
    if (res.data.success) {
      toast.success(res.data.message || 'تم حذف ملف ولي الأمر بنجاح.');
      showDeleteModal.value = false;
      guardianToDelete.value = null;
      fetchGuardians();
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    deleteErrorMessage.value =
      errorData?.message || 'تعذر حذف ملف ولي الأمر لارتباطه بسجلات أخرى في المنظومة.';
  } finally {
    isDeleting.value = false;
  }
}

const relationshipLabels: Record<string, string> = {
  father: 'أب',
  mother: 'أم',
  brother: 'أخ',
  uncle: 'عم / خال',
  other: 'صلة قرابة أخرى',
};

const relationshipOptions: TaqniyaSelectOption[] = [
  { value: 'father', label: 'أب', subtext: 'الوصي الطبيعي' },
  { value: 'mother', label: 'أم', subtext: 'الوصية الطبيعية' },
  { value: 'brother', label: 'أخ', subtext: 'قرابة درجة أولى' },
  { value: 'uncle', label: 'عم / خال', subtext: 'قرابة درجة ثانية' },
  { value: 'other', label: 'صلة قرابة أخرى', subtext: 'كفيل / وصي قانوني' },
];

const custodyTypeOptions: TaqniyaSelectOption[] = [
  { value: 1, label: 'وصي رئيسي', subtext: 'المسؤول الأول عن الطالب' },
  { value: 0, label: 'وصي إضافي', subtext: 'وصاية ثانوية للمتابعة' },
];

onMounted(() => {
  fetchGuardians();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-6" dir="rtl">
      <!-- Unified Container Card (Matching the Reference Design System) -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        <!-- Card Header: Title on Right, Controls & Filters on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
          <!-- Title with Brand Accent Bar -->
          <div>
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h2 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                سجلات أولياء الأمور وشبكة الوصاية
              </h2>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              إدارة ملفات الأولياء، بيانات التواصل، شبكة الكفالة وربط سياق الأبناء (PAR-XXXX)
            </p>
          </div>

          <!-- Controls: Add Button + Search Input -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Add Button -->
            <button
              @click="openCreateDrawer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>تسجيل ولي أمر جديد</span>
            </button>

            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-64">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="search"
                type="text"
                placeholder="بحث بالاسم، الهاتف أو PAR..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-center sm:text-start"
              />
            </div>
          </div>
        </div>

        <!-- 2. مؤشرات الأداء والبطاقات (8. KPI & Metrics - Exact Framework Section 8 Standard) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
          <!-- Card 1: Total Guardians -->
          <TaqniyaKpiCard
            title="إجمالي أولياء الأمور"
            :value="stats.total"
            :icon="Users"
            variant="primary"
            badge-text="سجلات الأولياء"
            :badge-icon="TrendingUp"
            :pulse-badge="true"
            :progress="100"
          />

          <!-- Card 2: Parents (Father/Mother) -->
          <TaqniyaKpiCard
            title="الآباء والأمهات"
            :value="`${stats.parentsCount} ولي أمر`"
            :icon="HeartHandshake"
            variant="emerald"
            :badge-text="`${stats.parentsPercentage}%`"
            :badge-icon="TrendingUp"
            :progress="stats.parentsPercentage"
          />

          <!-- Card 3: Other Guardians -->
          <TaqniyaKpiCard
            title="أوصياء وأقارب آخرون"
            :value="`${stats.othersCount} وصي`"
            :icon="User"
            variant="blue"
            :badge-text="`${stats.othersPercentage}%`"
            :badge-icon="TrendingUp"
            :progress="stats.othersPercentage"
          />

          <!-- Card 4: Custody Students -->
          <TaqniyaKpiCard
            title="إجمالي الطلاب المكفولين"
            :value="`${stats.totalCustodyCount} طالب`"
            :icon="GraduationCap"
            variant="amber"
            badge-text="شبكة الوصاية"
            :badge-icon="TrendingUp"
            :progress="100"
          />
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="py-24 text-center text-bx-muted">
          <Loader2 class="w-8 h-8 mx-auto animate-spin mb-2 text-bx-primary" />
          <span class="text-xs font-bold">جاري تحميل سجلات أولياء الأمور...</span>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="enrichedGuardians.length === 0"
          class="py-20 text-center border-t border-bx-border space-y-3"
        >
          <AlertCircle class="w-12 h-12 mx-auto text-bx-muted opacity-40" />
          <h3 class="text-sm font-bold text-bx-title">لا توجد سجلات تطابق محددات البحث</h3>
          <p class="text-xs text-bx-muted">جرب تغيير محددات البحث أو تسجيل ولي أمر جديد بالمنظومة.</p>
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>تسجيل أول ولي أمر</span>
          </button>
        </div>

        <!-- Unified Table Content: Enclosed in a Bordered Card -->
        <div v-else class="rounded-2xl border border-bx-border overflow-hidden bg-bx-surface shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-start border-collapse text-xs">
              <!-- Table Header with Distinct Background and Crisp Dividers -->
              <thead>
                <tr class="bg-bx-table-header border-b border-bx-border text-bx-muted">
                  <th class="py-3 px-4 font-bold text-start w-12 font-['Alexandria',sans-serif] border-e border-bx-divider">#</th>
                  <th class="py-3 px-4 font-bold text-start border-e border-bx-divider">الرمز</th>
                  <th class="py-3 px-4 font-bold text-start min-w-[220px] border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <User class="w-3.5 h-3.5 text-bx-primary" />
                      <span>ولي الأمر والبيانات الشخصية</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[140px] border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <Phone class="w-3.5 h-3.5 text-bx-primary" />
                      <span>رقم الهاتف</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[130px] border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <HeartHandshake class="w-3.5 h-3.5 text-bx-primary" />
                      <span>صلة القرابة</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-center w-36 border-e border-bx-divider">
                    <div class="flex items-center justify-center gap-1.5">
                      <GraduationCap class="w-3.5 h-3.5 text-bx-primary" />
                      <span>الأبناء المكفولين</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-start min-w-[130px] border-e border-bx-divider">
                    <div class="flex items-center gap-1.5">
                      <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                      <span>تاريخ التسجيل</span>
                    </div>
                  </th>
                  <th class="py-3 px-4 font-bold text-center w-40 last:border-e-0">الإجراءات</th>
                </tr>
              </thead>

              <!-- Table Body with Crisp Dividers -->
              <tbody class="divide-y divide-bx-divider">
                <tr
                  v-for="guardian in enrichedGuardians"
                  :key="guardian.id"
                  class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                >
                  <!-- Sequence Index -->
                  <td class="py-3 px-4 font-bold text-bx-muted text-xs whitespace-nowrap font-['Alexandria',sans-serif] border-e border-bx-divider">
                    {{ guardian.indexNumber }}
                  </td>

                  <!-- Code Pill -->
                  <td class="py-3 px-4 whitespace-nowrap border-e border-bx-divider">
                    <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-500/[0.06] dark:bg-white/[0.05] border border-bx-border text-bx-title/80">
                      {{ guardian.code }}
                    </span>
                  </td>

                  <!-- Guardian Info -->
                  <td class="py-3 px-4 whitespace-nowrap border-e border-bx-divider">
                    <div>
                      <span class="font-black text-xs sm:text-sm text-bx-title block leading-tight group-hover:text-bx-primary transition-colors">
                        {{ guardian.full_name }}
                      </span>
                    </div>
                  </td>

                  <!-- Phone -->
                  <td class="py-3 px-4 font-mono text-xs text-bx-muted whitespace-nowrap border-e border-bx-divider" dir="ltr">
                    {{ guardian.phone }}
                  </td>

                  <!-- Relationship Badge -->
                  <td class="py-3 px-4 whitespace-nowrap border-e border-bx-divider">
                    <span
                      class="inline-block px-3 py-1 rounded-full text-[11px] font-bold border"
                      :class="
                        guardian.relationship === 'father' || guardian.relationship === 'mother'
                          ? 'border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-950/30'
                          : 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-950/30'
                      "
                    >
                      {{ relationshipLabels[guardian.relationship] || guardian.relationship }}
                    </span>
                  </td>

                  <!-- Custody Children Count -->
                  <td class="py-3 px-4 text-center whitespace-nowrap border-e border-bx-divider">
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border font-mono"
                      :class="
                        guardian.students_count > 0
                          ? 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-950/30'
                          : 'border-slate-500/20 text-slate-500 bg-slate-500/5'
                      "
                    >
                      <GraduationCap class="w-3 h-3" />
                      <span>{{ guardian.students_count }} طالب</span>
                    </span>
                  </td>

                  <!-- Created Date -->
                  <td class="py-3 px-4 font-['Alexandria',sans-serif] font-medium text-xs text-bx-muted whitespace-nowrap border-e border-bx-divider">
                    <span class="inline-flex items-center gap-1.5 font-bold font-mono">
                      <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                      <span>{{ guardian.created_at.split('T')[0] }}</span>
                    </span>
                  </td>

                  <!-- Actions: Uniform Circular Icon Buttons with High Contrast in Dark Mode -->
                  <td class="py-3 px-4 text-center whitespace-nowrap last:border-e-0">
                    <div class="flex items-center justify-center gap-1.5">
                      <!-- Manage Custody Button -->
                      <button
                        @click="openCustodyModal(guardian)"
                        class="w-7 h-7 rounded-full border border-teal-300 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white dark:border-teal-400/60 dark:bg-teal-950/70 dark:text-teal-300 dark:hover:bg-teal-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="إدارة الأبناء والوصاية الأكاديمية"
                      >
                        <Link class="w-3.5 h-3.5" />
                      </button>

                      <!-- View Details Button -->
                      <button
                        @click="openDetailsDrawer(guardian)"
                        class="w-7 h-7 rounded-full border border-bx-border bg-white text-slate-700 hover:text-bx-primary hover:border-bx-primary hover:bg-bx-primary/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="معاينة الملف الشخصي والحساب"
                      >
                        <Eye class="w-3.5 h-3.5" />
                      </button>

                      <!-- Edit Button -->
                      <button
                        @click="openEditDrawer(guardian)"
                        class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/70 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="تعديل بيانات ولي الأمر"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>

                      <!-- Delete Button -->
                      <button
                        @click="promptDelete(guardian)"
                        class="w-7 h-7 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="حذف ملف ولي الأمر"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer Matching Reference -->
          <div
            v-if="meta.last_page > 1"
            class="p-4 border-t border-bx-border bg-bx-table-header flex items-center justify-between gap-4"
          >
            <div class="text-xs text-bx-muted">
              الصفحة <span class="font-bold text-bx-title">{{ meta.current_page }}</span> من <span class="font-bold text-bx-title">{{ meta.last_page }}</span> (إجمالي <span class="font-mono font-bold">{{ meta.total }}</span> أولياء أمور)
            </div>

            <div class="flex items-center gap-1.5">
              <button
                :disabled="currentPage <= 1"
                @click="currentPage--"
                class="p-1.5 rounded-lg border border-bx-border hover:bg-bx-pill disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
              <button
                v-for="p in meta.last_page"
                :key="p"
                @click="currentPage = p"
                class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer"
                :class="p === currentPage ? 'bg-bx-primary text-white shadow-sm' : 'hover:bg-bx-pill text-bx-muted'"
              >
                {{ p }}
              </button>
              <button
                :disabled="currentPage >= meta.last_page"
                @click="currentPage++"
                class="p-1.5 rounded-lg border border-bx-border hover:bg-bx-pill disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Taqniya Modern Drawer (View Details / Add / Edit) -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        :title="
          drawerMode === 'details'
            ? 'ملف ولي الأمر'
            : drawerMode === 'create'
            ? 'تسجيل ولي أمر جديد وتوليد الحساب'
            : 'تعديل بيانات ولي الأمر'
        "
        :subtitle="
          drawerMode === 'details'
            ? 'تفاصيل السجل الشخصي، بيانات التواصل، وروابط الوصاية'
            : drawerMode === 'create'
            ? 'تسجيل ولي أمر جديد وتوليد حساب الدخول PAR-XXXX ذرياً'
            : 'تحديث بيانات التواصل والسجل الشخصي لولي الأمر'
        "
        :icon="drawerMode === 'details' ? HeartHandshake : User"
        max-width="max-w-[650px]"
        @close="showDrawer = false"
      >
        <!-- DETAILS VIEW -->
        <div v-if="drawerMode === 'details' && activeGuardian" class="space-y-6">
          <div class="p-5 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
            <div class="flex items-center justify-between border-b border-bx-divider pb-3">
              <span class="text-xs font-bold text-bx-muted">الرمز المؤسسي الموحد</span>
              <span class="font-mono font-bold text-xs text-teal-600 dark:text-teal-400 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                {{ activeGuardian.user_code }}
              </span>
            </div>

            <div class="flex items-center justify-between border-b border-bx-divider pb-3">
              <span class="text-xs font-bold text-bx-muted">الاسم الكامل</span>
              <span class="font-black text-xs text-bx-title">{{ activeGuardian.full_name }}</span>
            </div>

            <div class="flex items-center justify-between border-b border-bx-divider pb-3">
              <span class="text-xs font-bold text-bx-muted">رقم هاتف التواصل</span>
              <span class="font-mono font-bold text-xs text-bx-title" dir="ltr">
                {{ activeGuardian.phone }}
              </span>
            </div>

            <div class="flex items-center justify-between border-b border-bx-divider pb-3">
              <span class="text-xs font-bold text-bx-muted">صلة القرابة</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {{ relationshipLabels[activeGuardian.relationship] }}
              </span>
            </div>

            <div class="flex items-center justify-between border-b border-bx-divider pb-3">
              <span class="text-xs font-bold text-bx-muted">عدد الأبناء المكفولين</span>
              <span class="font-mono font-bold text-xs text-bx-primary">
                {{ activeGuardian.students_count }} طالب
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-bx-muted">تاريخ إنشاء القيد</span>
              <span class="font-['Alexandria',sans-serif] font-bold text-xs text-bx-title">
                {{ activeGuardian.created_at?.split('T')[0] }}
              </span>
            </div>
          </div>

          <!-- Management Actions Inside Drawer -->
          <div class="space-y-2.5 pt-2">
            <button
              @click="openCustodyModal(activeGuardian)"
              class="w-full py-2.5 px-4 rounded-full border border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 font-bold text-xs flex items-center justify-center gap-2 hover:bg-teal-500/20 transition-all cursor-pointer"
            >
              <Link class="w-4 h-4" />
              <span>إدارة روابط الوصاية والأبناء المكفولين ({{ activeGuardian.students_count }})</span>
            </button>

            <button
              @click="openEditFromDetails"
              class="w-full py-2.5 px-4 rounded-full border border-bx-border text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-bx-row-hover transition-all cursor-pointer"
            >
              <Edit2 class="w-4 h-4" />
              <span>تعديل بيانات ولي الأمر</span>
            </button>

            <button
              @click="promptDelete(activeGuardian)"
              class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
              <span>حذف ملف ولي الأمر</span>
            </button>

            <button
              type="button"
              @click="showDrawer = false"
              class="w-full py-2.5 px-4 rounded-full border border-bx-border text-bx-muted hover:text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-bx-row-hover transition-all cursor-pointer"
            >
              <span>إلغاء</span>
            </button>
          </div>
        </div>

        <!-- CREATE / EDIT FORM -->
        <form v-else @submit.prevent="handleSaveGuardian" class="space-y-5">
          <div
            v-if="formErrorMessage"
            class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <!-- Full Name -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-bx-title">
              <User class="w-4 h-4 text-bx-primary shrink-0" />
              <label class="text-xs font-bold">الاسم الكامل لولي الأمر <span class="text-red-500">*</span></label>
            </div>
            <input
              v-model="form.full_name"
              type="text"
              required
              maxlength="150"
              placeholder="مثال: خالد مسعود السويح"
              class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-medium"
            />
            <p v-if="fieldErrors.full_name" class="text-[11px] text-red-500 font-medium">
              {{ fieldErrors.full_name[0] }}
            </p>
          </div>

          <!-- Phone & Relationship in 2 Columns -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Phone -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-bx-title">
                <Phone class="w-4 h-4 text-emerald-500 shrink-0" />
                <label class="text-xs font-bold">رقم هاتف التواصل (فريد) <span class="text-red-500">*</span></label>
              </div>
              <input
                v-model="form.phone"
                type="text"
                required
                maxlength="20"
                placeholder="مثال: 0913333333"
                class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif] font-medium"
                dir="ltr"
              />
              <p v-if="fieldErrors.phone" class="text-[11px] text-red-500 font-medium">
                {{ fieldErrors.phone[0] }}
              </p>
            </div>

            <!-- Relationship -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-bx-title block">صلة القرابة</label>
              <TaqniyaSelect
                v-model="form.relationship"
                :options="relationshipOptions"
                placeholder="اختر صلة القرابة..."
                full-width
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5 pt-2 border-t border-bx-divider">
            <div class="flex items-center justify-between text-bx-title">
              <div class="flex items-center gap-2">
                <Lock class="w-4 h-4 text-blue-500 shrink-0" />
                <label class="text-xs font-bold">
                  كلمة مرور الحساب الموحد
                  <span v-if="drawerMode === 'create'" class="text-red-500">*</span>
                </label>
              </div>
              <span v-if="drawerMode === 'edit'" class="text-[10px] text-bx-muted">
                (اتركها فارغة إذا كنت لا تريد التغيير)
              </span>
            </div>
            <input
              v-model="form.password"
              type="password"
              :required="drawerMode === 'create'"
              minlength="8"
              placeholder="••••••••"
              class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
            <p v-if="fieldErrors.password" class="text-[11px] text-red-500 font-medium">
              {{ fieldErrors.password[0] }}
            </p>
          </div>

          <!-- Code Generation Info Note -->
          <div v-if="drawerMode === 'create'" class="p-3.5 rounded-2xl bg-teal-500/[0.06] border border-teal-500/20 text-[11px] text-bx-muted leading-relaxed">
            <p class="font-bold text-bx-title mb-0.5">💡 توليد الرمز الموحد:</p>
            <span>سيقوم النظام آلياً بتوليد كود الدخول بصيغة <span class="font-mono font-bold text-teal-600 dark:text-teal-400">PAR-XXXX</span> وتشفير كلمة المرور ذرياً داخل قاعدة البيانات.</span>
          </div>
        </form>

        <!-- Fixed Footer Template for Form Modes -->
        <template v-if="drawerMode !== 'details'" #footer>
          <button
            type="button"
            @click="showDrawer = false"
            class="px-5 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            :disabled="isSubmitting"
            @click="handleSaveGuardian"
            class="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'جاري الحفظ...' : drawerMode === 'create' ? 'حفظ وإنشاء ملف ولي الأمر' : 'تحديث البيانات' }}</span>
          </button>
        </template>
      </TaqniyaDrawer>

      <!-- Custody Management Drawer (Spatial UI Design System) -->
      <TaqniyaDrawer
        :is-open="showCustodyDrawer"
        title="إدارة وصاية الأبناء"
        :subtitle="selectedGuardianForCustody ? `ولي الأمر: ${selectedGuardianForCustody.full_name} (${selectedGuardianForCustody.user_code})` : ''"
        :icon="HeartHandshake"
        max-width="max-w-[650px]"
        @close="showCustodyDrawer = false"
      >
        <div class="space-y-6">
          <!-- Guardian Profile Summary Banner -->
          <div v-if="selectedGuardianForCustody" class="p-4 rounded-2xl border border-teal-500/20 bg-teal-500/[0.03] flex items-center justify-between gap-4 shadow-2xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <HeartHandshake class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-xs font-black text-bx-title">{{ selectedGuardianForCustody.full_name }}</h4>
                <div class="flex items-center gap-2 mt-0.5 text-[11px] text-bx-muted">
                  <span class="font-mono text-bx-primary font-bold">{{ selectedGuardianForCustody.user_code }}#</span>
                  <span>•</span>
                  <span>صلة القرابة: {{ relationshipLabels[selectedGuardianForCustody.relationship] || selectedGuardianForCustody.relationship }}</span>
                </div>
              </div>
            </div>
            <span class="text-xs font-bold text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
              {{ custodyChildren.length }} أبناء مكفولين
            </span>
          </div>

          <!-- Error Alert -->
          <div v-if="custodyErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ custodyErrorMessage }}</span>
          </div>

          <!-- Section 1: Search & Link Student On-Demand (لا يتم جلب الأسماء مسبقاً) -->
          <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
            <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
              <User class="w-4 h-4 text-bx-primary shrink-0" />
              <div>
                <h4 class="text-xs font-black text-bx-title">البحث عن طالب لربطه تحت الوصاية</h4>
                <p class="text-[10px] text-bx-muted">اكتب اسم الطالب واضغط على زر عرض النتائج لتحديد الطالب المطلوب</p>
              </div>
            </div>

            <!-- Search Input with Explicit Search Button -->
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
                <input
                  v-model="studentSearchQuery"
                  @keydown.enter.prevent="searchStudentsOnDemand"
                  type="text"
                  placeholder="اكتب اسم الطالب الرباعي أو الرمز STU-XXXX..."
                  class="w-full pr-10 pl-4 py-2.5 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-['Alexandria',sans-serif]"
                />
              </div>
              <button
                type="button"
                :disabled="isSearchingStudents"
                @click="searchStudentsOnDemand"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Loader2 v-if="isSearchingStudents" class="w-3.5 h-3.5 animate-spin" />
                <Search v-else class="w-3.5 h-3.5" />
                <span>عرض النتائج</span>
              </button>
            </div>

            <!-- Search Results Display (Shown only when searched) -->
            <div v-if="hasSearchedStudents && !selectedStudentToLink" class="space-y-2 pt-2">
              <div v-if="searchedStudents.length === 0" class="py-6 text-center text-bx-muted text-xs border border-dashed border-bx-border rounded-2xl bg-purple-500/[0.02]">
                <AlertCircle class="w-6 h-6 mx-auto mb-1.5 opacity-40 text-bx-muted" />
                <span class="font-bold block">لم يتم العثور على أي طالب يطابق هذا الاسم</span>
                <span class="text-[10px]">تأكد من صحة الاسم المدخل أو ابحث برمز الطالب STU-...</span>
              </div>

              <div v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
                <div class="text-[11px] font-bold text-bx-muted flex items-center justify-between pb-1">
                  <span>الطلاب المطابقون ({{ searchedStudents.length }}):</span>
                  <span>اضغط على الطالب لاختياره للربط</span>
                </div>

                <div
                  v-for="student in searchedStudents"
                  :key="student.id"
                  @click="selectStudentToLink(student)"
                  class="p-3 rounded-2xl border border-bx-border bg-bx-canvas hover:border-bx-primary hover:bg-purple-500/[0.04] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  :class="custodyChildren.some(c => c.student_id === student.id) ? 'opacity-50 cursor-not-allowed bg-gray-500/5' : ''"
                >
                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-purple-500/[0.06] text-bx-primary border border-purple-500/20">
                      {{ student.user_code }}#
                    </span>
                    <div>
                      <h5 class="text-xs font-bold text-bx-title group-hover:text-bx-primary transition-colors">
                        {{ student.full_name }}
                      </h5>
                      <p class="text-[10px] text-bx-muted mt-0.5">
                        {{ student.class_section || 'غير مسكن بشعبة' }}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span
                      v-if="custodyChildren.some(c => c.student_id === student.id)"
                      class="text-[10px] font-bold text-bx-muted px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20"
                    >
                      مرتبط بالوصي مسبقاً
                    </span>
                    <button
                      v-else
                      type="button"
                      class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-bx-primary/10 text-bx-primary border border-bx-primary/20 group-hover:bg-bx-primary group-hover:text-white transition-all pointer-events-none"
                    >
                      اختيار الطالب
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Student Confirmation & Custody Type Selector -->
            <div v-if="selectedStudentToLink" class="p-4 rounded-2xl border-2 border-bx-primary/40 bg-purple-500/[0.04] space-y-4 shadow-xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs font-black text-bx-primary">
                  <CheckCircle2 class="w-4 h-4 text-bx-primary" />
                  <span>الطالب المحدد للربط:</span>
                </div>
                <button
                  type="button"
                  @click="cancelSelectedStudent"
                  class="text-[11px] font-bold text-bx-muted hover:text-red-500 transition-colors cursor-pointer"
                >
                  تغيير الطالب
                </button>
              </div>

              <div class="flex items-center justify-between p-3.5 rounded-xl bg-bx-surface border border-bx-border">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs font-bold text-bx-primary px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                    {{ selectedStudentToLink.user_code }}#
                  </span>
                  <div>
                    <h5 class="text-xs font-black text-bx-title">{{ selectedStudentToLink.full_name }}</h5>
                    <p class="text-[10px] text-bx-muted mt-0.5">{{ selectedStudentToLink.class_section || 'غير مسكن بشعبة' }}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-bx-title">نوع الوصاية الأكاديمية</label>
                <TaqniyaSelect
                  v-model="linkCustodyType"
                  :options="custodyTypeOptions"
                  placeholder="اختر نوع الوصاية..."
                  full-width
                />
              </div>

              <div class="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  @click="cancelSelectedStudent"
                  class="px-4 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  :disabled="isLinkingCustody"
                  @click="handleLinkStudent"
                  class="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  <Loader2 v-if="isLinkingCustody" class="w-3.5 h-3.5 animate-spin" />
                  <Link v-else class="w-3.5 h-3.5" />
                  <span>تأكيد ربط الطالب تحت الوصاية</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Section 2: Current Linked Children -->
          <div class="space-y-3">
            <div class="flex items-center justify-between pb-1 border-b border-bx-divider">
              <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
                <GraduationCap class="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>الأبناء المكفولون حالياً</span>
              </div>
              <span class="text-[11px] font-bold text-bx-muted">
                (المجموع: {{ custodyChildren.length }})
              </span>
            </div>

            <div v-if="loadingCustody" class="py-8 text-center text-bx-muted">
              <Loader2 class="w-6 h-6 animate-spin mx-auto text-bx-primary mb-1.5" />
              <span class="text-xs font-bold">جاري تحديث بيانات الأبناء المكفولين...</span>
            </div>

            <div v-else-if="custodyChildren.length === 0" class="py-8 text-center text-bx-muted text-xs border border-dashed border-bx-border rounded-2xl bg-bx-canvas">
              <Users class="w-8 h-8 mx-auto mb-2 opacity-30 text-bx-muted" />
              <span class="font-bold block text-bx-title">لا يوجد أبناء مرتبطون بهذا الوصي حالياً</span>
              <p class="text-[10px] text-bx-muted mt-0.5">استخدم محرك البحث أعلاه لكتابة اسم الطالب وربطه بولي الأمر فورياً.</p>
            </div>

            <div v-else class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              <div
                v-for="child in custodyChildren"
                :key="child.id"
                class="flex items-center justify-between p-3.5 rounded-2xl border border-bx-border bg-bx-surface hover:border-teal-500/30 transition-all shadow-2xs group"
              >
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {{ child.student_code }}#
                  </span>
                  <div>
                    <h5 class="text-xs font-black text-bx-title group-hover:text-bx-primary transition-colors">
                      {{ child.student_name }}
                    </h5>
                    <p class="text-[10px] text-bx-muted mt-0.5">
                      {{ child.class_section || 'غير مسكن بشعبة' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2.5">
                  <span
                    :class="child.is_primary ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'"
                    class="px-3 py-1 rounded-full text-[10px] font-bold border"
                  >
                    {{ child.is_primary ? 'وصي رئيسي' : 'وصي إضافي' }}
                  </span>
                  <button
                    @click="handleUnlinkStudent(child.id)"
                    title="فك رابط الوصاية"
                    class="w-7 h-7 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <button
            type="button"
            @click="showCustodyDrawer = false"
            class="px-6 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </template>
      </TaqniyaDrawer>

      <!-- Confirmation Delete Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-bx-surface w-full max-w-md rounded-3xl p-6 border border-bx-border shadow-2xl space-y-4 text-right">
          <div class="flex items-center gap-3 text-red-500">
            <div class="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle class="w-6 h-6" />
            </div>
            <div>
              <h4 class="font-black text-base text-bx-title">تأكيد حذف ملف ولي الأمر</h4>
              <p class="text-xs text-bx-muted">هذا الإجراء محمي بنظام النزاهة المرجعية (RESTRICT)</p>
            </div>
          </div>

          <p class="text-xs text-bx-text leading-relaxed">
            هل أنت متأكد من رغبتك في حذف ملف ولي الأمر:
            <strong class="text-bx-title">{{ guardianToDelete?.full_name }}</strong>
            ({{ guardianToDelete?.user_code }})؟
          </p>

          <div v-if="deleteErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs leading-relaxed">
            {{ deleteErrorMessage }}
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
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
        </div>
      </div>
    </div>
  </TaqniyaErrorBoundary>
</template>
