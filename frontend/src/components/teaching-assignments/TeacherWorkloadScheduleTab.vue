<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  UserCheck,
  Printer,
  BookOpen,
  Calendar,
  Phone,
  Clock,
  GraduationCap,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Search,
} from 'lucide-vue-next';
import {
  teachingAssignmentsApi,
  type TeacherWorkloadItem,
} from '../../api/teaching-assignments.api';
import type { Teacher } from '../../api/teachers.api';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import { useToast } from '../../composables/useToast';

const props = defineProps<{
  teachers: Teacher[];
  academicYearId: number;
  academicYearName: string;
}>();

const emit = defineEmits<{
  (e: 'edit', assignment: any, classId: number, sectionId: number): void;
  (e: 'delete', assignment: any): void;
}>();

const toast = useToast();

// Selected Teacher
const selectedTeacherId = ref<number | string>('');
const teacherSearch = ref('');
const loading = ref(false);
const assignments = ref<TeacherWorkloadItem[]>([]);

// Period Lookup Table for Standard Libyan Curriculum (Grades 1 to 8)
const subjectPeriodsMap: Record<string, Record<string, number>> = {
  'الصف الأول الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5 },
  'الصف الثاني الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5 },
  'الصف الثالث الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3 },
  'الصف الرابع الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
  'الصف الخامس الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
  'الصف السادس الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
  'الصف الأول الإعدادي': { 'التربية الإسلامية': 2, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 4, 'التاريخ': 2, 'الجغرافيا': 2 },
  'الصف الثاني الإعدادي': { 'التربية الإسلامية': 2, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 4, 'التاريخ': 2, 'الجغرافيا': 2 },
};

function getSubjectPeriods(className: string, subjectName: string): number {
  return subjectPeriodsMap[className]?.[subjectName] || 2;
}

// Current active teacher object
const currentTeacher = computed<Teacher | null>(() => {
  if (!selectedTeacherId.value) return null;
  return props.teachers.find((t) => Number(t.id) === Number(selectedTeacherId.value)) || null;
});

// Options for Teacher Select
const teacherOptions = computed<TaqniyaSelectOption[]>(() => {
  return props.teachers.map((t) => ({
    value: t.id,
    label: `${t.full_name} (${t.user_code})`,
    subtext: t.specialization || undefined,
  }));
});

// Filtered Teachers List for Quick Select Chips
const filteredTeachers = computed(() => {
  const q = teacherSearch.value.trim().toLowerCase();
  if (!q) return props.teachers;
  return props.teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(q) ||
      t.user_code?.toLowerCase().includes(q) ||
      t.specialization?.toLowerCase().includes(q),
  );
});

// Fetch Assignments for Selected Teacher
async function fetchTeacherAssignments() {
  if (!selectedTeacherId.value) {
    assignments.value = [];
    return;
  }

  loading.value = true;
  try {
    const res = await teachingAssignmentsApi.getTeacherAssignments(Number(selectedTeacherId.value), {
      academic_year_id: props.academicYearId || undefined,
    });
    assignments.value = res.data.data || [];
  } catch (err: any) {
    toast.error('تعذر جلب بيانات إسناد التدريس للمعلم.');
  } finally {
    loading.value = false;
  }
}

watch(
  () => [selectedTeacherId.value, props.academicYearId],
  () => {
    fetchTeacherAssignments();
  },
);

onMounted(() => {
  if (props.teachers.length > 0 && !selectedTeacherId.value) {
    selectedTeacherId.value = props.teachers[0].id;
  }
});

// Calculations & Stats
const tableRows = computed(() => {
  return assignments.value.map((item, index) => {
    const weeklyPeriods = getSubjectPeriods(item.class_name, item.subject_name);
    return {
      index: index + 1,
      id: item.id,
      class_id: item.class_id,
      class_name: item.class_name,
      class_section_id: item.class_section_id,
      section_name: item.section_name,
      subject_id: item.subject_id,
      subject_name: item.subject_name,
      subject_code: item.subject_code,
      weeklyPeriods,
      rawItem: item,
    };
  });
});

const totalWeeklyPeriods = computed(() => {
  return tableRows.value.reduce((sum, r) => sum + r.weeklyPeriods, 0);
});

const dailyAveragePeriods = computed(() => {
  if (totalWeeklyPeriods.value === 0) return '0.0';
  return (totalWeeklyPeriods.value / 5).toFixed(1);
});

const distinctClassesCount = computed(() => {
  return new Set(assignments.value.map((a) => a.class_id)).size;
});

const distinctSectionsCount = computed(() => {
  return new Set(assignments.value.map((a) => a.class_section_id)).size;
});

const distinctSubjectsCount = computed(() => {
  return new Set(assignments.value.map((a) => a.subject_id)).size;
});

// Print Handler
function handlePrint() {
  window.print();
}

const currentDateFormatted = computed(() => {
  return new Intl.DateTimeFormat('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
});
</script>

<template>
  <div class="space-y-6" dir="rtl">
    <!-- Top Control Bar (Screen Only) -->
    <div class="no-print p-5 rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] shadow-xs space-y-4">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <!-- Title & Teacher Select -->
        <div class="flex-1 w-full lg:max-w-xl">
          <label class="block text-xs font-bold text-bx-title mb-1.5 flex items-center gap-1.5">
            <UserCheck class="w-4 h-4 text-bx-primary" />
            <span>اختر المعلم لعرض كشف النصاب والجدول:</span>
          </label>
          <TaqniyaSelect
            v-model="selectedTeacherId"
            :options="teacherOptions"
            placeholder="اختر معلماً من القائمة..."
            full-width
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button
            type="button"
            @click="handlePrint"
            :disabled="loading || assignments.length === 0"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bx-primary text-white text-xs font-bold shadow-md hover:bg-bx-primary-hover hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <Printer class="w-4 h-4" />
            <span>طباعة كشف الإسناد الرسمي</span>
          </button>
        </div>
      </div>

      <!-- Quick Teacher Selector Chips -->
      <div class="pt-3 border-t border-[#B4AED8]/30 dark:border-white/[0.06]">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[11px] font-bold text-bx-muted">تصفح سريع للمعلمين ({{ filteredTeachers.length }} معلم):</span>
          <div class="relative w-48">
            <Search class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-bx-muted" />
            <input
              v-model="teacherSearch"
              type="text"
              placeholder="فلترة الأسماء..."
              class="w-full pr-8 pl-2 py-1 rounded-full border border-[#B4AED8]/60 dark:border-white/10 bg-transparent text-[11px] font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary text-start"
            />
          </div>
        </div>
        <div class="flex items-center gap-2 overflow-x-auto pb-1 max-h-24 flex-wrap scrollbar-thin">
          <button
            v-for="t in filteredTeachers"
            :key="t.id"
            type="button"
            @click="selectedTeacherId = t.id"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap"
            :class="[
              Number(selectedTeacherId) === Number(t.id)
                ? 'border-bx-primary bg-purple-500/15 text-bx-primary font-bold shadow-xs scale-105'
                : 'border-[#B4AED8]/60 dark:border-white/10 bg-[var(--bx-surface-solid)] text-bx-muted hover:text-bx-title hover:border-bx-primary/40'
            ]"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="Number(selectedTeacherId) === Number(t.id) ? 'bg-bx-primary' : 'bg-slate-400'"></span>
            <span>{{ t.full_name }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-16 text-center space-y-3">
      <Loader2 class="w-8 h-8 text-bx-primary animate-spin mx-auto" />
      <p class="text-xs font-bold text-bx-muted">جاري تحميل كشف إسناد المعلم...</p>
    </div>

    <!-- Main Content Area: Teacher Card + Table (Display on Screen & Optimized for Print) -->
    <div v-else-if="currentTeacher" id="official-teacher-workload-document" class="space-y-6">
      
      <!-- PRINT ONLY OFFICIAL HEADER -->
      <div class="only-print border-b-2 border-slate-900 pb-4 mb-6 text-center">
        <div class="flex items-center justify-between">
          <div class="text-right space-y-0.5">
            <h4 class="font-bold text-xs text-slate-800">دولة ليبيا</h4>
            <h4 class="font-bold text-xs text-slate-800">وزارة التربية والتعليم</h4>
            <p class="text-[11px] text-slate-600">مراقبة التربية والتعليم</p>
            <p class="text-[11px] font-bold text-slate-900">مدرسة الحرية للتعليم الأساسي</p>
          </div>
          <div class="text-center space-y-1">
            <div class="w-12 h-12 mx-auto rounded-full border border-slate-900 flex items-center justify-center font-bold text-sm">
              شعار
            </div>
            <h2 class="text-base font-black text-slate-900">كشف إسناد التدريس والنصاب الأكاديمي للمعلم</h2>
            <p class="text-xs font-bold text-slate-700">العام الدراسي: {{ academicYearName }}</p>
          </div>
          <div class="text-left space-y-0.5 text-xs text-slate-700">
            <p><span class="font-bold">التاريخ:</span> {{ currentDateFormatted }}</p>
            <p><span class="font-bold">رقم المعلم:</span> {{ currentTeacher.user_code }}</p>
            <p><span class="font-bold">حالة الكشف:</span> معتمد رسمياً</p>
          </div>
        </div>
      </div>

      <!-- Teacher Info Banner (Screen Design) -->
      <div class="p-6 rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-gradient-to-r from-purple-500/[0.06] via-transparent to-purple-500/[0.02] shadow-sm relative overflow-hidden">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <!-- Profile Info -->
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white/20 shrink-0">
              {{ currentTeacher.full_name?.charAt(0) || 'م' }}
            </div>
            <div>
              <div class="flex items-center gap-2.5 flex-wrap">
                <h3 class="text-lg font-black text-bx-title font-display">{{ currentTeacher.full_name }}</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/15 text-bx-primary border border-purple-500/30">
                  {{ currentTeacher.user_code }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 class="w-3 h-3" />
                  <span>معلم نشط</span>
                </span>
              </div>
              <div class="flex items-center gap-4 text-xs text-bx-muted font-medium mt-1.5 flex-wrap">
                <span class="flex items-center gap-1">
                  <BookOpen class="w-3.5 h-3.5 text-bx-primary" />
                  <span>التخصص: <strong class="text-bx-title">{{ currentTeacher.specialization || 'عام' }}</strong></span>
                </span>
                <span v-if="currentTeacher.phone" class="flex items-center gap-1">
                  <Phone class="w-3.5 h-3.5 text-bx-primary" />
                  <span dir="ltr">{{ currentTeacher.phone }}</span>
                </span>
                <span class="flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5 text-bx-primary" />
                  <span>العام الدراسي: <strong class="text-bx-title">{{ academicYearName }}</strong></span>
                </span>
              </div>
            </div>
          </div>

          <!-- Workload KPI Summary Badges -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <!-- Total Weekly Periods -->
            <div class="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-[#B4AED8]/70 dark:border-white/10 text-center shadow-2xs">
              <span class="text-[10px] font-bold text-bx-muted block">النصاب الأسبوعي</span>
              <span class="text-lg font-black text-bx-primary leading-tight block mt-0.5">
                {{ totalWeeklyPeriods }}
                <small class="text-[10px] font-bold text-bx-muted">حصة</small>
              </span>
            </div>

            <!-- Daily Average -->
            <div class="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-[#B4AED8]/70 dark:border-white/10 text-center shadow-2xs">
              <span class="text-[10px] font-bold text-bx-muted block">المعدل اليومي</span>
              <span class="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight block mt-0.5">
                {{ dailyAveragePeriods }}
                <small class="text-[10px] font-bold text-bx-muted">حصة/يوم</small>
              </span>
            </div>

            <!-- Total Classes -->
            <div class="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-[#B4AED8]/70 dark:border-white/10 text-center shadow-2xs">
              <span class="text-[10px] font-bold text-bx-muted block">الصفوف المسندة</span>
              <span class="text-lg font-black text-bx-title leading-tight block mt-0.5">
                {{ distinctClassesCount }}
                <small class="text-[10px] font-bold text-bx-muted">صفوف</small>
              </span>
            </div>

            <!-- Total Sections -->
            <div class="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-[#B4AED8]/70 dark:border-white/10 text-center shadow-2xs">
              <span class="text-[10px] font-bold text-bx-muted block">إجمالي الشُعب</span>
              <span class="text-lg font-black text-bx-title leading-tight block mt-0.5">
                {{ distinctSectionsCount }}
                <small class="text-[10px] font-bold text-bx-muted">شعب</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Unified Teaching Assignments Table -->
      <div class="rounded-3xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] overflow-hidden shadow-sm">
        <div class="p-4 sm:p-5 border-b border-[#B4AED8]/60 dark:border-white/[0.08] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileSpreadsheet class="w-4 h-4 text-bx-primary" />
            <h4 class="text-sm font-black text-bx-title">جدول الحصص والمواد المسندة للمعلم</h4>
          </div>
          <span class="text-xs font-bold text-bx-muted">
            إجمالي الإسنادات المسجلة: {{ tableRows.length }}
          </span>
        </div>

        <!-- Empty State -->
        <div v-if="tableRows.length === 0" class="p-12 text-center space-y-2">
          <AlertCircle class="w-8 h-8 text-amber-500 mx-auto opacity-70" />
          <p class="text-xs font-bold text-bx-title">لا توجد مواد أو شُعب دراسية مسندة لهذا المعلم في العام الدراسي الحالي.</p>
          <p class="text-[11px] text-bx-muted">يمكنك الانتقال إلى تبويب مصفوفة الإسناد لتكليف المعلم بالمواد والشُعب المطلوبة.</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-start text-xs border-collapse">
            <thead>
              <tr class="bg-purple-500/[0.05] dark:bg-white/[0.02] border-b border-[#B4AED8]/60 dark:border-white/[0.08] text-bx-muted font-bold text-[11px]">
                <th class="p-3.5 text-center w-12">#</th>
                <th class="p-3.5 text-start min-w-[160px]">الصف الدراسي</th>
                <th class="p-3.5 text-center min-w-[120px]">الشعبة الدراسية</th>
                <th class="p-3.5 text-start min-w-[180px]">المادة الدراسية المقررة</th>
                <th class="p-3.5 text-center min-w-[100px]">رمز المادة</th>
                <th class="p-3.5 text-center min-w-[140px]">النصاب الأسبوعي (الحصص)</th>
                <th class="p-3.5 text-center min-w-[120px] no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#B4AED8]/40 dark:divide-white/[0.05]">
              <tr
                v-for="row in tableRows"
                :key="row.id"
                class="hover:bg-purple-500/[0.02] transition-colors"
              >
                <!-- Index -->
                <td class="p-3.5 text-center font-bold text-bx-muted font-mono">{{ row.index }}</td>

                <!-- Class -->
                <td class="p-3.5 text-start">
                  <div class="flex items-center gap-2">
                    <GraduationCap class="w-3.5 h-3.5 text-bx-primary shrink-0" />
                    <span class="font-bold text-bx-title">{{ row.class_name }}</span>
                  </div>
                </td>

                <!-- Section -->
                <td class="p-3.5 text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20">
                    {{ row.section_name }}
                  </span>
                </td>

                <!-- Subject -->
                <td class="p-3.5 text-start">
                  <div class="flex items-center gap-2">
                    <BookOpen class="w-3.5 h-3.5 text-bx-primary shrink-0" />
                    <span class="font-black text-bx-title">{{ row.subject_name }}</span>
                  </div>
                </td>

                <!-- Subject Code -->
                <td class="p-3.5 text-center">
                  <span class="font-mono text-[10px] text-bx-muted px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                    {{ row.subject_code || '—' }}
                  </span>
                </td>

                <!-- Weekly Periods -->
                <td class="p-3.5 text-center">
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-black text-xs">
                    <Clock class="w-3 h-3" />
                    <span>{{ row.weeklyPeriods }} حصص</span>
                  </div>
                </td>

                <!-- Actions (Screen only) -->
                <td class="p-3.5 text-center no-print">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      @click="emit('edit', row.rawItem, row.class_id, row.class_section_id)"
                      class="px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#B4AED8] hover:border-bx-primary hover:text-bx-primary dark:border-white/20 transition-all cursor-pointer"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      @click="emit('delete', row.rawItem)"
                      class="px-2.5 py-1 rounded-full text-[11px] font-bold border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 transition-all cursor-pointer"
                    >
                      فك الإسناد
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>

            <!-- Table Footer Totals -->
            <tfoot>
              <tr class="bg-purple-500/[0.08] dark:bg-white/[0.04] border-t-2 border-[#B4AED8] dark:border-white/[0.12] font-black text-bx-title">
                <td colspan="3" class="p-4 text-start font-bold text-xs">
                  المجموع الكلي لنصاب الحصص الأسبوعية:
                </td>
                <td colspan="2" class="p-4 text-center font-bold text-xs text-bx-muted">
                  ({{ distinctClassesCount }} صفوف — {{ distinctSectionsCount }} شعب — {{ distinctSubjectsCount }} مواد)
                </td>
                <td class="p-4 text-center">
                  <div class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-bx-primary text-white text-xs font-black shadow-xs">
                    <span>{{ totalWeeklyPeriods }} حصة أسبوعياً</span>
                  </div>
                </td>
                <td class="p-4 text-center text-xs text-bx-muted font-bold no-print">
                  (معدل {{ dailyAveragePeriods }} حصة/يوم)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- PRINT ONLY OFFICIAL SIGNATURE FOOTER -->
      <div class="only-print pt-10 mt-12 border-t border-slate-400">
        <div class="grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-900">
          <div class="space-y-12">
            <p>المعلم صاحب الكشف</p>
            <p class="font-normal">التوقيع: ............................</p>
          </div>
          <div class="space-y-12">
            <p>الموجه التربوي / رئيس القسم</p>
            <p class="font-normal">التوقيع: ............................</p>
          </div>
          <div class="space-y-12">
            <p>مدير المدرسة والاعتماد الرسمي</p>
            <p class="font-normal">الختم والتوقيع: ............................</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Print Styles */
@media screen {
  .only-print {
    display: none !important;
  }
}

@media print {
  .no-print {
    display: none !important;
  }
  .only-print {
    display: block !important;
  }
  
  body * {
    visibility: hidden !important;
  }
  
  #official-teacher-workload-document,
  #official-teacher-workload-document * {
    visibility: visible !important;
  }
  
  #official-teacher-workload-document {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 24px;
    background: white !important;
    color: black !important;
  }

  table {
    border: 1px solid #000 !important;
    width: 100% !important;
  }

  th, td {
    border: 1px solid #cbd5e1 !important;
    color: #000 !important;
    padding: 8px !important;
  }

  thead tr {
    background-color: #f1f5f9 !important;
  }

  tfoot tr {
    background-color: #e2e8f0 !important;
  }
}
</style>
