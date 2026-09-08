<script setup lang="ts">
import { ref, onMounted, watch, defineAsyncComponent } from 'vue';
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
} from 'lucide-vue-next';
import {
  guardiansApi,
  type Guardian,
  type GuardianStudentChild,
  type PaginationMeta,
} from '../api/guardians.api';
import { useToast } from '../composables/useToast';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';

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

// Custody Modal State
const showCustodyModal = ref(false);
const selectedGuardianForCustody = ref<Guardian | null>(null);
const custodyChildren = ref<GuardianStudentChild[]>([]);
const loadingCustody = ref(false);
const isLinking = ref(false);
const linkForm = ref({
  student_id: '' as string | number,
  is_primary: 1,
});
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
async function openCustodyModal(guardian: Guardian) {
  selectedGuardianForCustody.value = guardian;
  custodyErrorMessage.value = null;
  linkForm.value = { student_id: '', is_primary: 1 };
  showCustodyModal.value = true;
  await fetchGuardianChildren(guardian.id);
}

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

async function handleLinkStudent() {
  if (!selectedGuardianForCustody.value) return;
  if (!linkForm.value.student_id) {
    custodyErrorMessage.value = 'يرجى إدخال معرف الطالب.';
    return;
  }

  isLinking.value = true;
  custodyErrorMessage.value = null;

  try {
    const res = await guardiansApi.createCustody({
      guardian_id: selectedGuardianForCustody.value.id,
      student_id: Number(linkForm.value.student_id),
      is_primary: linkForm.value.is_primary,
    });
    if (res.data.success) {
      toast.success(res.data.message || 'تم ربط وصاية الطالب بنجاح.');
      linkForm.value.student_id = '';
      await fetchGuardianChildren(selectedGuardianForCustody.value.id);
      fetchGuardians();
    }
  } catch (err: any) {
    const errorData = err.response?.data;
    custodyErrorMessage.value = errorData?.message || 'تعذر ربط الوصاية.';
  } finally {
    isLinking.value = false;
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

onMounted(() => {
  fetchGuardians();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-6" dir="rtl">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[var(--bx-surface-glass)] p-6 rounded-3xl border border-bx-border backdrop-blur-md shadow-sm">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center font-black shadow-md shadow-teal-500/20">
              <HeartHandshake class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-bx-title">سجل أولياء الأمور وشبكة الوصاية</h2>
              <p class="text-xs sm:text-sm text-bx-muted font-medium">إدارة ملفات الأولياء وربط الوصاية لتفعيل سياق الابن (PAR-XXXX)</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="openCreateDrawer"
            class="flex items-center gap-2 bg-bx-primary hover:bg-bx-primary-hover text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-bx-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>تسجيل ولي أمر جديد</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex items-center justify-between gap-4 bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-bx-border">
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-bx-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="البحث بالاسم أو الهاتف أو PAR..."
            class="w-full pl-3 pr-9 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text"
          />
        </div>
      </div>

      <!-- Guardians Table Card -->
      <div class="bg-[var(--bx-surface-solid)] rounded-3xl border border-bx-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead>
              <tr class="border-b border-bx-border bg-[var(--bx-canvas)]/50 text-bx-muted font-bold">
                <th class="py-3.5 px-4">#</th>
                <th class="py-3.5 px-4">كود ولي الأمر</th>
                <th class="py-3.5 px-4">الاسم الكامل</th>
                <th class="py-3.5 px-4">رقم الهاتف</th>
                <th class="py-3.5 px-4">صلة القرابة</th>
                <th class="py-3.5 px-4">عدد الأبناء المكفولين</th>
                <th class="py-3.5 px-4">تاريخ الإنشاء</th>
                <th class="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-bx-border">
              <!-- Loading Skeleton -->
              <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
                <td class="py-4 px-4"><div class="h-4 w-6 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-20 bg-bx-border rounded-full"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-36 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-24 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-16 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-12 bg-bx-border rounded-full"></div></td>
                <td class="py-4 px-4"><div class="h-4 w-20 bg-bx-border rounded"></div></td>
                <td class="py-4 px-4 text-center"><div class="h-4 w-20 bg-bx-border rounded mx-auto"></div></td>
              </tr>

              <!-- Empty State -->
              <tr v-else-if="guardians.length === 0">
                <td colspan="8" class="py-12 text-center text-bx-muted">
                  <div class="max-w-xs mx-auto space-y-3">
                    <HeartHandshake class="w-10 h-10 mx-auto opacity-40 text-bx-muted" />
                    <p class="text-sm font-bold">لا يوجد أولياء أمور مسجلون يطابقون محددات البحث</p>
                    <button
                      @click="openCreateDrawer"
                      class="inline-flex items-center gap-2 text-xs font-bold text-bx-primary hover:underline cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>تسجيل أول ولي أمر الآن</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Guardians Data Rows -->
              <tr
                v-else
                v-for="guardian in guardians"
                :key="guardian.id"
                class="hover:bg-[var(--bx-pill)]/50 transition-colors"
              >
                <td class="py-3.5 px-4 font-mono text-bx-muted">{{ guardian.id }}</td>
                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    {{ guardian.user_code }}
                  </span>
                </td>
                <td class="py-3.5 px-4 font-bold text-bx-title">
                  {{ guardian.full_name }}
                </td>
                <td class="py-3.5 px-4 font-mono text-bx-muted">{{ guardian.phone }}</td>
                <td class="py-3.5 px-4">
                  <span class="font-bold text-bx-title">
                    {{ relationshipLabels[guardian.relationship] || guardian.relationship }}
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    :class="guardian.students_count > 0 ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono"
                  >
                    {{ guardian.students_count }} طالب
                  </span>
                </td>
                <td class="py-3.5 px-4 font-mono text-bx-muted">{{ guardian.created_at.split('T')[0] }}</td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      @click="openCustodyModal(guardian)"
                      title="إدارة الأبناء والوصاية"
                      class="p-1.5 rounded-lg text-bx-muted hover:text-teal-600 hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
                    >
                      <Link class="w-4 h-4" />
                    </button>
                    <button
                      @click="openDetailsDrawer(guardian)"
                      title="معاينة الملف"
                      class="p-1.5 rounded-lg text-bx-muted hover:text-bx-primary hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="openEditDrawer(guardian)"
                      title="تعديل البيانات"
                      class="p-1.5 rounded-lg text-bx-muted hover:text-amber-500 hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      @click="promptDelete(guardian)"
                      title="حذف ولي الأمر"
                      class="p-1.5 rounded-lg text-bx-muted hover:text-red-500 hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div v-if="meta.total > meta.per_page" class="flex items-center justify-between px-6 py-4 border-t border-bx-border bg-[var(--bx-canvas)]/30 text-xs">
          <div class="text-bx-muted font-medium">
            إجمالي أولياء الأمور: <strong class="text-bx-title font-mono">{{ meta.total }}</strong>
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="currentPage <= 1"
              @click="currentPage--"
              class="p-1.5 rounded-lg border border-bx-border disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <span class="font-bold text-bx-title px-2 font-mono">
              {{ meta.current_page }} / {{ meta.last_page }}
            </span>
            <button
              :disabled="currentPage >= meta.last_page"
              @click="currentPage++"
              class="p-1.5 rounded-lg border border-bx-border disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bx-surface-solid)] transition-all cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Slide-over Drawer for Create / Edit / Details -->
      <TaqniyaDrawer
        :is-open="showDrawer"
        :title="drawerMode === 'create' ? 'تسجيل ولي أمر جديد' : drawerMode === 'edit' ? 'تعديل بيانات ولي الأمر' : 'ملف ولي الأمر'"
        @close="showDrawer = false"
      >
        <!-- DETAILS VIEW -->
        <div v-if="drawerMode === 'details' && activeGuardian" class="space-y-6 text-right">
          <div class="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 p-5 rounded-2xl border border-teal-500/20 text-center space-y-2">
            <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-teal-500/20">
              <HeartHandshake class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-black text-bx-title">{{ activeGuardian.full_name }}</h3>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-black bg-teal-500/15 text-teal-600 border border-teal-500/30">
              {{ activeGuardian.user_code }}
            </span>
          </div>

          <div class="bg-[var(--bx-surface-solid)] p-4 rounded-2xl border border-bx-border space-y-3 text-xs">
            <div class="flex justify-between py-1.5 border-b border-bx-border/50">
              <span class="text-bx-muted">رقم هاتف التواصل:</span>
              <span class="font-mono font-bold text-bx-title">{{ activeGuardian.phone }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-bx-border/50">
              <span class="text-bx-muted">صلة القرابة:</span>
              <span class="font-bold text-bx-title">{{ relationshipLabels[activeGuardian.relationship] }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-bx-border/50">
              <span class="text-bx-muted">عدد الأبناء المكفولين:</span>
              <span class="font-mono font-bold text-bx-title">{{ activeGuardian.students_count }}</span>
            </div>
            <div class="flex justify-between py-1.5">
              <span class="text-bx-muted">تاريخ إنشاء القيد:</span>
              <span class="font-mono font-bold text-bx-title">{{ activeGuardian.created_at.split('T')[0] }}</span>
            </div>
          </div>
        </div>

        <!-- CREATE / EDIT FORM -->
        <form v-else @submit.prevent="handleSaveGuardian" class="space-y-4 text-right">
          <div v-if="formErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ formErrorMessage }}</span>
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">الاسم الكامل لولي الأمر *</label>
            <input
              v-model="form.full_name"
              type="text"
              placeholder="مثال: خالد مسعود السويح"
              class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text"
            />
            <p v-if="fieldErrors.full_name" class="text-[11px] text-red-500 mt-1">{{ fieldErrors.full_name[0] }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">رقم هاتف التواصل (فريد) *</label>
            <div class="relative">
              <Phone class="w-4 h-4 text-bx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="form.phone"
                type="text"
                placeholder="مثال: 0913333333"
                class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text font-mono"
              />
            </div>
            <p v-if="fieldErrors.phone" class="text-[11px] text-red-500 mt-1">{{ fieldErrors.phone[0] }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">صلة القرابة</label>
            <select
              v-model="form.relationship"
              class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text"
            >
              <option value="father">أب</option>
              <option value="mother">أم</option>
              <option value="brother">أخ</option>
              <option value="uncle">عم / خال</option>
              <option value="other">صلة قرابة أخرى</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">
              {{ drawerMode === 'create' ? 'كلمة مرور الحساب الموحد *' : 'تغيير كلمة المرور (اختياري)' }}
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 text-bx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="form.password"
                type="password"
                placeholder="8 خانات على الأقل..."
                class="w-full px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-canvas)] focus:outline-none focus:border-bx-primary transition-colors text-bx-text font-mono"
              />
            </div>
            <p v-if="fieldErrors.password" class="text-[11px] text-red-500 mt-1">{{ fieldErrors.password[0] }}</p>
          </div>

          <div class="pt-4 flex items-center gap-3">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 flex items-center justify-center gap-2 bg-bx-primary hover:bg-bx-primary-hover text-white py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-bx-primary/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ drawerMode === 'create' ? 'إنشاء ملف ولي الأمر' : 'حفظ التعديلات' }}</span>
            </button>
            <button
              type="button"
              @click="showDrawer = false"
              class="px-5 py-2.5 rounded-2xl border border-bx-border text-xs font-bold text-bx-muted hover:bg-[var(--bx-canvas)] transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </TaqniyaDrawer>

      <!-- Custody Management Modal -->
      <div
        v-if="showCustodyModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-[var(--bx-surface-solid)] w-full max-w-lg rounded-3xl p-6 border border-bx-border shadow-2xl space-y-5 text-right">
          <div class="flex items-center justify-between border-b border-bx-border pb-3">
            <div>
              <h4 class="font-black text-base text-bx-title">إدارة وصاية الأبناء</h4>
              <p class="text-xs text-bx-muted">
                ولي الأمر: <strong class="text-bx-title">{{ selectedGuardianForCustody?.full_name }}</strong>
                ({{ selectedGuardianForCustody?.user_code }})
              </p>
            </div>
            <button
              @click="showCustodyModal = false"
              class="p-1 rounded-lg text-bx-muted hover:text-bx-title hover:bg-[var(--bx-canvas)] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Error Alert -->
          <div v-if="custodyErrorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ custodyErrorMessage }}</span>
          </div>

          <!-- Link New Student Form -->
          <form @submit.prevent="handleLinkStudent" class="p-4 bg-[var(--bx-canvas)] rounded-2xl border border-bx-border space-y-3">
            <span class="text-xs font-bold text-bx-title block">ربط طالب جديد تحت الوصاية</span>
            <div class="flex gap-2">
              <input
                v-model="linkForm.student_id"
                type="number"
                placeholder="معرف الطالب (ID)..."
                class="flex-1 px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-surface-solid)] focus:outline-none focus:border-bx-primary font-mono text-bx-text"
              />
              <select
                v-model.number="linkForm.is_primary"
                class="px-3 py-2 rounded-xl text-xs border border-bx-border bg-[var(--bx-surface-solid)] text-bx-text"
              >
                <option :value="1">وصي رئيسي</option>
                <option :value="0">وصي إضافي</option>
              </select>
              <button
                type="submit"
                :disabled="isLinking"
                class="bg-bx-primary hover:bg-bx-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Loader2 v-if="isLinking" class="w-3.5 h-3.5 animate-spin" />
                <Plus v-else class="w-3.5 h-3.5" />
                <span>ربط</span>
              </button>
            </div>
          </form>

          <!-- Current Linked Children -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-bx-title block">الأبناء المكفولون حالياً:</span>

            <div v-if="loadingCustody" class="py-6 text-center text-bx-muted">
              <Loader2 class="w-5 h-5 animate-spin mx-auto" />
            </div>

            <div v-else-if="custodyChildren.length === 0" class="py-6 text-center text-bx-muted text-xs">
              لا يوجد أبناء مرتبطون بهذا الوصي حالياً.
            </div>

            <div v-else class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="child in custodyChildren"
                :key="child.id"
                class="flex items-center justify-between p-3 rounded-xl border border-bx-border bg-[var(--bx-surface-solid)] hover:bg-[var(--bx-pill)]/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {{ child.student_code }}
                  </span>
                  <div>
                    <h5 class="text-xs font-bold text-bx-title">{{ child.student_name }}</h5>
                    <p class="text-[10px] text-bx-muted">{{ child.class_section || 'غير مسكن' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    :class="child.is_primary ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold border"
                  >
                    {{ child.is_primary ? 'رئيسي' : 'إضافي' }}
                  </span>
                  <button
                    @click="handleUnlinkStudent(child.id)"
                    title="فك رابط الوصاية"
                    class="p-1 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-2 text-left">
            <button
              @click="showCustodyModal = false"
              class="px-5 py-2 rounded-xl border border-bx-border text-xs font-bold text-bx-muted hover:bg-[var(--bx-canvas)] cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <!-- Confirmation Delete Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-[var(--bx-surface-solid)] w-full max-w-md rounded-3xl p-6 border border-bx-border shadow-2xl space-y-4 text-right">
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
              class="px-4 py-2 rounded-xl border border-bx-border text-xs font-bold text-bx-muted hover:bg-[var(--bx-canvas)] transition-all cursor-pointer"
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
