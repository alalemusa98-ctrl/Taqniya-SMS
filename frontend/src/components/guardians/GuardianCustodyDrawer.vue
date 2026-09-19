<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Link,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Loader2,
  HeartHandshake,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import { studentsApi, type Student } from '../../api/students.api';
import type { Guardian, GuardianStudentChild } from '../../api/guardians.api';

interface Props {
  isOpen: boolean;
  guardian?: Guardian | null;
  custodyChildren: GuardianStudentChild[];
  loadingCustody?: boolean;
  isLinkingCustody?: boolean;
  custodyErrorMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  guardian: null,
  custodyChildren: () => [],
  loadingCustody: false,
  isLinkingCustody: false,
  custodyErrorMessage: null,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'link-custody', payload: { guardian_id: number; student_id: number; is_primary: number }): void;
  (e: 'remove-custody', custodyId: number): void;
}>();

// On-demand student search state
const studentSearchQuery = ref('');
const isSearchingStudents = ref(false);
const searchedStudents = ref<Student[]>([]);
const hasSearchedStudents = ref(false);
const selectedStudentToLink = ref<Student | null>(null);
const linkCustodyType = ref<number>(1);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      studentSearchQuery.value = '';
      searchedStudents.value = [];
      hasSearchedStudents.value = false;
      selectedStudentToLink.value = null;
      linkCustodyType.value = 1;
    }
  },
);

async function searchStudentsOnDemand() {
  const q = studentSearchQuery.value.trim();
  if (!q) return;

  isSearchingStudents.value = true;
  hasSearchedStudents.value = true;
  selectedStudentToLink.value = null;

  try {
    const res = await studentsApi.getStudents({ search: q, per_page: 10 });
    if (res.data?.success && res.data.data) {
      searchedStudents.value = res.data.data;
    } else {
      searchedStudents.value = [];
    }
  } catch (err) {
    console.error('Failed to search students on demand:', err);
    searchedStudents.value = [];
  } finally {
    isSearchingStudents.value = false;
  }
}

function selectStudentForLink(student: Student) {
  selectedStudentToLink.value = student;
}

function handleLinkCustody() {
  if (!props.guardian || !selectedStudentToLink.value) return;

  emit('link-custody', {
    guardian_id: props.guardian.id,
    student_id: selectedStudentToLink.value.id,
    is_primary: linkCustodyType.value,
  });
}
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    title="إدارة روابط الوصاية الأسرية (Custody Matrix)"
    :subtitle="`كفالة الأبناء والربط الذري بالمنظومة لولي الأمر: ${guardian?.full_name || ''}`"
    :icon="Link"
    max-width="max-w-[700px]"
    @close="emit('close')"
  >
    <div class="space-y-6">
      <!-- Custody Error Message -->
      <div
        v-if="custodyErrorMessage"
        class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-3"
      >
        <AlertCircle class="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
        <p>{{ custodyErrorMessage }}</p>
      </div>

      <!-- 1. Add New Custody Link Section (On-Demand Search) -->
      <div class="p-5 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
        <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
          <HeartHandshake class="w-4 h-4 text-bx-primary" />
          <h4 class="text-xs font-black text-bx-title">ربط طالب جديد بولي الأمر</h4>
        </div>

        <p class="text-[11px] text-bx-muted">
          ابحث عن الطالب بالاسم أو بالرمز الموحد (STU-XXXX) ثم اختر نوع الوصاية للاعتماد:
        </p>

        <!-- Search Input with Explicit Search Button -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <input
              type="text"
              v-model="studentSearchQuery"
              @keydown.enter.prevent="searchStudentsOnDemand"
              placeholder="اكتب اسم الطالب أو رمزه (STU-XXXX)..."
              class="w-full pl-4 pr-9 py-2.5 rounded-xl border border-bx-border bg-bx-surface text-xs text-bx-title font-medium transition-colors focus:outline-none focus:border-bx-primary"
            />
            <Search class="w-4 h-4 text-bx-muted absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="button"
            @click="searchStudentsOnDemand"
            :disabled="isSearchingStudents || !studentSearchQuery.trim()"
            class="px-5 py-2.5 rounded-xl bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
          >
            <Loader2 v-if="isSearchingStudents" class="w-4 h-4 animate-spin" />
            <Search v-else class="w-4 h-4" />
            <span>بحث</span>
          </button>
        </div>

        <!-- Search Results Listing -->
        <div v-if="hasSearchedStudents" class="pt-2">
          <div v-if="isSearchingStudents" class="py-6 text-center text-bx-muted">
            <Loader2 class="w-6 h-6 mx-auto animate-spin mb-2 text-bx-primary" />
            <span class="text-xs font-bold">جاري البحث في قاعدة بيانات الطلاب...</span>
          </div>

          <div v-else-if="searchedStudents.length === 0" class="py-4 text-center text-bx-muted text-xs border border-dashed border-bx-border rounded-xl">
            لا يوجد طلاب يطابقون كلمة البحث: "{{ studentSearchQuery }}"
          </div>

          <div v-else class="space-y-2 max-h-48 overflow-y-auto bx-drawer-scroll">
            <div
              v-for="st in searchedStudents"
              :key="st.id"
              @click="selectStudentForLink(st)"
              class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
              :class="
                selectedStudentToLink?.id === st.id
                  ? 'border-bx-primary bg-bx-primary/10 dark:bg-bx-primary/20'
                  : 'border-bx-border bg-purple-500/[0.01] hover:border-bx-primary/40'
              "
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-bx-primary/10 text-bx-primary flex items-center justify-center font-black text-xs">
                  <GraduationCap class="w-4 h-4" />
                </div>
                <div>
                  <span class="font-black text-xs text-bx-title block leading-snug">{{ st.full_name }}</span>
                  <div class="flex items-center gap-2 text-[10px] text-bx-muted mt-0.5">
                    <span class="font-mono text-bx-primary font-bold">{{ st.user_code }}</span>
                    <span>•</span>
                    <span>{{ st.class_section || 'غير مسكن' }}</span>
                  </div>
                </div>
              </div>

              <div
                v-if="selectedStudentToLink?.id === st.id"
                class="w-6 h-6 rounded-full bg-bx-primary text-white flex items-center justify-center shrink-0 shadow-2xs"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        <!-- Confirm Linking Action Card -->
        <div
          v-if="selectedStudentToLink"
          class="p-4 rounded-xl border border-bx-primary/40 bg-bx-primary/[0.03] space-y-3.5 animate-in fade-in duration-200"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-bx-title">
              الطالب المختار: <span class="text-bx-primary font-bold">{{ selectedStudentToLink.full_name }}</span>
            </span>
            <span class="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-bx-primary/10 text-bx-primary">
              {{ selectedStudentToLink.user_code }}
            </span>
          </div>

          <div>
            <label class="block text-xs font-bold text-bx-title mb-1.5">صفة الوصاية المعتمدة:</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="linkCustodyType = 1"
                class="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                :class="
                  linkCustodyType === 1
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black'
                    : 'border-bx-border text-bx-muted hover:border-emerald-500/30'
                "
              >
                <span>وصي رئيسي معتمد</span>
              </button>
              <button
                type="button"
                @click="linkCustodyType = 0"
                class="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                :class="
                  linkCustodyType === 0
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black'
                    : 'border-bx-border text-bx-muted hover:border-blue-500/30'
                "
              >
                <span>وصي إضافي / ثانوي</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            :disabled="isLinkingCustody"
            @click="handleLinkCustody"
            class="w-full py-2.5 rounded-xl bg-bx-primary text-white text-xs font-bold hover:bg-bx-primary-hover transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Loader2 v-if="isLinkingCustody" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            <span>اعتماد وربط الوصاية الآن</span>
          </button>
        </div>
      </div>

      <!-- 2. Active Custody Children List -->
      <div class="p-5 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
        <div class="flex items-center justify-between border-b border-bx-divider pb-2.5">
          <div class="flex items-center gap-2">
            <GraduationCap class="w-4 h-4 text-bx-primary" />
            <h4 class="text-xs font-black text-bx-title">الأبناء المكفولين حالياً تحت رعاية ولي الأمر</h4>
          </div>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-bx-primary">
            {{ custodyChildren.length }}
          </span>
        </div>

        <div v-if="loadingCustody" class="py-12 text-center text-bx-muted">
          <Loader2 class="w-6 h-6 mx-auto animate-spin mb-2 text-bx-primary" />
          <span class="text-xs font-bold">جاري تحميل سجلات الأبناء المكفولين...</span>
        </div>

        <div v-else-if="custodyChildren.length === 0" class="py-8 text-center text-bx-muted space-y-1">
          <AlertCircle class="w-8 h-8 mx-auto opacity-40 text-bx-muted" />
          <p class="text-xs font-bold">لا يوجد أبناء مرتبطين بهذا الحساب حالياً</p>
          <p class="text-[11px]">يمكنك البحث عن الطلاب أعلاه لربطهم كأبناء لولي الأمر</p>
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="child in custodyChildren"
            :key="child.id"
            class="p-3.5 rounded-xl border border-bx-border bg-purple-500/[0.02] flex items-center justify-between gap-3 group hover:border-bx-primary/30 transition-all"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold">
                <GraduationCap class="w-4.5 h-4.5" />
              </div>
              <div>
                <span class="font-black text-xs text-bx-title block">{{ child.student_name }}</span>
                <div class="flex items-center gap-2 text-[11px] text-bx-muted mt-0.5">
                  <span class="font-mono text-bx-primary font-bold">{{ child.student_code }}</span>
                  <span>•</span>
                  <span>{{ child.class_section || 'غير مسكن بشعبة' }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                :class="
                  child.is_primary === 1
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                "
              >
                {{ child.is_primary === 1 ? 'وصي رئيسي' : 'وصي إضافي' }}
              </span>

              <button
                type="button"
                @click="emit('remove-custody', child.id)"
                class="w-7 h-7 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="فك رابط الوصاية"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <button
          type="button"
          @click="emit('close')"
          class="px-6 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
