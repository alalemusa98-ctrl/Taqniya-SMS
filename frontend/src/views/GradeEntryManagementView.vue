<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-8 p-6 sm:p-8 max-w-[1600px] mx-auto min-h-screen text-bx-text font-sans" dir="rtl">
      <!-- Page Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#B4AED8] dark:border-white/[0.08]">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20 shadow-xs">
            <GraduationCap class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-bx-title font-display tracking-tight">
              شيت رصد الدرجات وإصدار الصحائف المدرسية
            </h1>
            <p class="text-xs sm:text-sm text-bx-muted mt-1 font-medium">
              رصد وتوثيق درجات أعمال السنة والامتحانات لكل صف وشعبة، تدقيق النواقص، وتوليد الصحائف السنوية المجمعة
            </p>
          </div>
        </div>

        <!-- Top Actions -->
        <div class="flex items-center gap-3 flex-wrap shrink-0">
          <!-- Audit Vacancies / Missing Grades Button -->
          <button
            type="button"
            class="px-4 py-2.5 rounded-2xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            @click="isAuditModalOpen = true"
          >
            <AlertTriangle class="w-4 h-4 text-amber-500" />
            <span>تدقيق نواقص الرصد</span>
            <span v-if="totalMissingStudents > 0" class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono">
              {{ totalMissingStudents }}
            </span>
          </button>

          <!-- Generate Annual Transcripts for selected section -->
          <button
            v-if="selectedSection"
            type="button"
            class="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            @click="isAnnualModalOpen = true"
          >
            <Sparkles class="w-4 h-4" />
            <span>إصدار الصحيفة السنوية للشعبة</span>
          </button>
        </div>
      </header>

      <!-- KPI Overview Cards using TaqniyaKpiCard -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TaqniyaKpiCard
          :icon="Users"
          title="إجمالي الطلاب المسكنين"
          :value="totalEnrolledStudents"
          subtext="عبر كافة الصفوف والشعب"
          color="purple"
        />

        <TaqniyaKpiCard
          :icon="CheckCircle2"
          title="الدرجات المرصودة"
          :value="totalGradedStudents"
          :subtext="`متبقي ${totalMissingStudents} طالب`"
          color="emerald"
        />

        <TaqniyaKpiCard
          :icon="Layers"
          title="نسبة إنجاز الرصد"
          :value="`${overallCompletionRate}%`"
          subtext="على مستوى المدرسة"
          color="amber"
        />

        <TaqniyaKpiCard
          :icon="Sparkles"
          title="نسبة النجاح العامة"
          :value="`${overallPassRate}%`"
          subtext="للطلاب المرصودة نتائجهم"
          color="indigo"
        />
      </section>

      <!-- Filter Controls Panel -->
      <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-6 shadow-xs space-y-4">
        <div class="flex items-center gap-2 font-bold text-sm text-bx-title">
          <Filter class="w-4 h-4 text-bx-primary" />
          <span>محددات وسياق رصد الدرجات الأكاديمي</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- 1. Academic Year -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-muted">العام الدراسي:</label>
            <TaqniyaSelect
              v-model="selectedYearName"
              :options="yearFilterOptions"
              placeholder="اختر العام الدراسي"
              :full-width="true"
              @update:model-value="fetchAuditProgress"
            />
          </div>

          <!-- 2. Class Filter (Optional) -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-muted">الصف الدراسي:</label>
            <TaqniyaSelect
              v-model="selectedClassIdModel"
              :options="classFilterOptions"
              placeholder="كافة الصفوف الدراسية"
              :full-width="true"
              @update:model-value="onClassFilterChange"
            />
          </div>

          <!-- 3. Term Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-muted">الفصل الدراسي / الفترة:</label>
            <TaqniyaSelect
              v-model="selectedTermModel"
              :options="termFilterOptions"
              placeholder="اختر الفصل الدراسي للرصد"
              :full-width="true"
              @update:model-value="fetchAuditProgress"
            />
          </div>
        </div>
      </div>

      <!-- Class & Sections Grid Matrix -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-bx-title font-display flex items-center gap-2">
            <Layers class="w-5 h-5 text-bx-primary" />
            <span>مصفوفة الصفوف والشعب وحالة الرصد</span>
          </h2>
          <span class="text-xs text-bx-muted">اضغط على أي شعبة لعرض كشف طلابها ورصد الدرجات</span>
        </div>

        <div v-if="isLoadingProgress" class="flex flex-col items-center justify-center p-12 text-bx-muted gap-3">
          <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
          <span class="text-sm font-semibold">جاري تحميل مصفوفة الشعب...</span>
        </div>
        <GradeEntryClassGrid
          v-else
          :sections="filteredSections"
          :selected-section-id="selectedSection?.class_section_id"
          @select-section="handleSelectSection"
        />
      </section>

      <!-- Section Students Roster Table -->
      <section v-if="selectedSection" class="space-y-4 pt-4 border-t border-[#B4AED8] dark:border-white/[0.08]">
        <!-- Roster Header Banner -->
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold border border-bx-primary/20 shadow-xs">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-black text-bx-title font-display">
                كشف طلاب: {{ selectedSection.class_name }} ({{ selectedSection.section_name }})
              </h3>
              <p class="text-xs text-bx-muted mt-0.5 font-medium">
                إجمالي المسكنين: {{ rosterStudents.length }} طالب • المرصودون: {{ gradedStudentsCount }} طالب
              </p>
            </div>
          </div>

          <!-- Section Search Filter -->
          <div class="relative min-w-[240px]">
            <input
              v-model="rosterSearch"
              type="text"
              placeholder="بحث باسم الطالب أو رمزه..."
              class="w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl px-4 py-2 pr-9 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all"
            />
            <Search class="w-4 h-4 text-bx-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <!-- Roster Table using TaqniyaTable -->
        <TaqniyaTable
          :columns="rosterColumns"
          :items="filteredRosterStudents"
          :is-loading="isLoadingRoster"
          row-key="student_id"
          empty-title="لا يوجد طلاب مسكنين في هذه الشعبة"
          empty-subtitle="يمكنك تسكين الطلاب عبر شاشة تسكين وتسجيل الطلاب."
        >
          <!-- Student Code Column -->
          <template #cell-student_code="{ value }">
            <span class="font-mono text-xs font-bold text-bx-primary">{{ value || '—' }}</span>
          </template>

          <!-- Student Name Column -->
          <template #cell-student_name="{ item }">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-full bg-bx-primary/10 text-bx-primary flex items-center justify-center text-xs font-bold shrink-0">
                {{ (item.student_name || 'ط').charAt(0) }}
              </div>
              <span class="font-bold text-bx-title text-xs">{{ item.student_name }}</span>
            </div>
          </template>

          <!-- Seating Number Column -->
          <template #cell-seating_number="{ value }">
            <span class="font-mono text-xs text-bx-muted">{{ value || '—' }}</span>
          </template>

          <!-- Grading Status Column -->
          <template #cell-is_graded="{ value }">
            <span
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              :class="value ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'"
            >
              {{ value ? 'تم الرصد ✅' : 'قيد الرصد ⏳' }}
            </span>
          </template>

          <!-- Total Score Column -->
          <template #cell-total_score="{ item }">
            <span v-if="item.transcript" class="font-mono text-xs font-bold text-bx-title">
              {{ item.transcript.total_score }}
            </span>
            <span v-else class="text-bx-muted text-xs">—</span>
          </template>

          <!-- Percentage Column -->
          <template #cell-percentage="{ item }">
            <span v-if="item.transcript" class="font-mono text-xs font-black text-bx-primary">
              {{ item.transcript.percentage }}%
            </span>
            <span v-else class="text-bx-muted text-xs">—</span>
          </template>

          <!-- Final Status Column -->
          <template #cell-final_status="{ item }">
            <span
              v-if="item.transcript"
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              :class="getStatusBadgeClass(item.transcript.final_status)"
            >
              {{ item.transcript.final_status_ar || item.transcript.final_status }}
            </span>
            <span v-else class="text-bx-muted text-xs">—</span>
          </template>

          <!-- Actions Column -->
          <template #cell-actions="{ item }">
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-bold rounded-lg bg-bx-primary text-white hover:bg-bx-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              @click="handleOpenGradeEntry(item)"
            >
              <Pen class="w-3.5 h-3.5" />
              <span>{{ item.is_graded ? 'تعديل الدرجات' : 'رصد الدرجات' }}</span>
            </button>
          </template>
        </TaqniyaTable>
      </section>

      <!-- Drawers & Modals -->
      <!-- 1. Student Grade Entry Drawer -->
      <GradeEntryStudentDrawer
        :is-open="isStudentDrawerOpen"
        :student="selectedStudent"
        :subjects="rosterSubjects"
        :section-info="selectedSection"
        :academic-year-name="selectedYearName"
        :class-academic-term-id="selectedTermId"
        :term-name="currentTermName"
        :is-submitting="isFreezing"
        @close="isStudentDrawerOpen = false"
        @save="handleSaveStudentTranscript"
      />

      <!-- 2. Grade Entry Audit Modal -->
      <GradeEntryAuditModal
        :is-open="isAuditModalOpen"
        :sections="allSections"
        @close="isAuditModalOpen = false"
        @select-section="handleSelectSection"
      />

      <!-- 3. Annual Transcripts Confirm Modal -->
      <AnnualTranscriptsConfirmModal
        :is-open="isAnnualModalOpen"
        :section-info="selectedSection"
        :is-generating="isGeneratingAnnual"
        @close="isAnnualModalOpen = false"
        @confirm="handleConfirmAnnualGeneration"
      />
    </div>
  </TaqniyaErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle2,
  Users,
  Filter,
  Loader2,
  Search,
  Pen,
  AlertTriangle,
} from 'lucide-vue-next';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import GradeEntryClassGrid from '../components/grade-entry/GradeEntryClassGrid.vue';
import GradeEntryStudentDrawer from '../components/grade-entry/GradeEntryStudentDrawer.vue';
import GradeEntryAuditModal from '../components/grade-entry/GradeEntryAuditModal.vue';
import AnnualTranscriptsConfirmModal from '../components/grade-entry/AnnualTranscriptsConfirmModal.vue';

import {
  gradeEntryApi,
  type SectionAuditProgressItem,
  type StudentRosterItem,
  type ClassSubjectRosterItem,
} from '../api/grade-entry.api';
import {
  academicApi,
  type AcademicYearItem,
  type AcademicClassItem,
  type AcademicTermItem,
} from '../api/academic.api';
import type { FreezeTranscriptDto } from '../api/promotion.api';
import { useToast } from '../composables/useToast';

const toast = useToast();

// State
const allSections = ref<SectionAuditProgressItem[]>([]);
const academicYearsList = ref<AcademicYearItem[]>([]);
const classesList = ref<AcademicClassItem[]>([]);
const academicTermsList = ref<AcademicTermItem[]>([]);
const allClassAcademicTerms = ref<any[]>([]);

// Selection State
const selectedYearName = ref<string>('');
const selectedClassIdModel = ref<string | number>('all');
const selectedTermModel = ref<string | number>('all');
const selectedSection = ref<SectionAuditProgressItem | null>(null);

// Roster State
const rosterStudents = ref<StudentRosterItem[]>([]);
const rosterSubjects = ref<ClassSubjectRosterItem[]>([]);
const rosterSearch = ref('');

// Modals / Drawers State
const isStudentDrawerOpen = ref(false);
const selectedStudent = ref<StudentRosterItem | null>(null);
const isAuditModalOpen = ref(false);
const isAnnualModalOpen = ref(false);

// Loading Flags
const isLoadingProgress = ref(false);
const isLoadingRoster = ref(false);
const isFreezing = ref(false);
const isGeneratingAnnual = ref(false);

// Columns for Roster Table
const rosterColumns: TableColumn[] = [
  { key: 'student_code', label: 'كود الطالب', align: 'start', width: '110px' },
  { key: 'student_name', label: 'اسم الطالب الرباعي', align: 'start' },
  { key: 'seating_number', label: 'رقم الجلوس', align: 'center', width: '100px' },
  { key: 'is_graded', label: 'حالة الرصد', align: 'center', width: '120px' },
  { key: 'total_score', label: 'المجموع', align: 'center', width: '100px' },
  { key: 'percentage', label: 'النسبة', align: 'center', width: '100px' },
  { key: 'final_status', label: 'القرار النهائي', align: 'center', width: '130px' },
  { key: 'actions', label: 'الإجراءات', align: 'center', width: '120px' },
];

// Dropdown Options
const yearFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  ...academicYearsList.value.map((y) => ({
    label: `${y.name} ${y.is_active ? '(النشط)' : ''}`,
    value: y.name,
    subtext: y.is_active ? 'العام الأكاديمي النشط حالياً' : undefined,
  })),
]);

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'كافة الصفوف الدراسية', value: 'all' },
  ...classesList.value.map((c) => ({
    label: `${c.name} (المستوى ${c.grade_level})`,
    value: c.id,
    subtext: `المستوى الدراسي ${c.grade_level}`,
  })),
]);

const termFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  return [
    { label: 'جميع الفصول الدراسية', value: 'all' },
    ...academicTermsList.value.map((t: any) => {
      const isActive = Number(t.is_active) === 1 || t.is_active === true;
      return {
        value: t.id,
        label: isActive ? `${t.name} (الفصل النشط)` : t.name,
        subtext: isActive ? 'الفصل النشط حالياً' : `فصل رقم ${t.term_number || t.id}`,
      };
    }),
  ];
});

const selectedTermId = computed<number | undefined>(() => {
  if (selectedTermModel.value === 'all' || !selectedTermModel.value) return undefined;
  return Number(selectedTermModel.value);
});

const currentTermName = computed(() => {
  const term = academicTermsList.value.find((t) => t.id === selectedTermId.value);
  return term?.name || 'الفصل الدراسي';
});

// Filtered Sections by selected class
const filteredSections = computed(() => {
  if (selectedClassIdModel.value === 'all' || !selectedClassIdModel.value) {
    return allSections.value;
  }
  return allSections.value.filter((s) => s.class_id === Number(selectedClassIdModel.value));
});

// Filtered Roster by search
const filteredRosterStudents = computed(() => {
  if (!rosterSearch.value.trim()) return rosterStudents.value;
  const q = rosterSearch.value.trim().toLowerCase();
  return rosterStudents.value.filter(
    (s) =>
      s.student_name.toLowerCase().includes(q) ||
      s.student_code.toLowerCase().includes(q) ||
      (s.seating_number && s.seating_number.includes(q)),
  );
});

// KPI Computeds
const totalEnrolledStudents = computed(() => {
  return allSections.value.reduce((sum, s) => sum + s.total_enrolled, 0);
});

const totalGradedStudents = computed(() => {
  return allSections.value.reduce((sum, s) => sum + s.graded_count, 0);
});

const totalMissingStudents = computed(() => {
  return Math.max(0, totalEnrolledStudents.value - totalGradedStudents.value);
});

const overallCompletionRate = computed(() => {
  if (totalEnrolledStudents.value === 0) return 0;
  return Number(((totalGradedStudents.value / totalEnrolledStudents.value) * 100).toFixed(1));
});

const overallPassRate = computed(() => {
  const totalGraded = totalGradedStudents.value;
  if (totalGraded === 0) return 0;
  const passed = allSections.value.reduce((sum, s) => sum + s.passed_count, 0);
  return Number(((passed / totalGraded) * 100).toFixed(1));
});

const gradedStudentsCount = computed(() => {
  return rosterStudents.value.filter((s) => s.is_graded).length;
});

// Lifecycle
onMounted(async () => {
  await fetchAcademicLookups();
  await fetchAuditProgress();
});

const fetchAcademicLookups = async () => {
  try {
    const [yearsRes, classesRes, termsRes, classTermsRes] = await Promise.all([
      academicApi.getYears({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClasses({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getTerms({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClassAcademicTerms({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
    ]);

    if (yearsRes.data?.data) {
      academicYearsList.value = Array.isArray(yearsRes.data.data)
        ? yearsRes.data.data
        : yearsRes.data.data.years || [];
    } else if (Array.isArray(yearsRes.data)) {
      academicYearsList.value = yearsRes.data;
    }

    if (classesRes.data?.data) {
      classesList.value = Array.isArray(classesRes.data.data)
        ? classesRes.data.data
        : classesRes.data.data.classes || [];
    } else if (Array.isArray(classesRes.data)) {
      classesList.value = classesRes.data;
    }

    const rawTerms = termsRes.data?.data?.terms || termsRes.data?.data || termsRes.data || [];
    academicTermsList.value = Array.isArray(rawTerms) ? rawTerms : [];
    allClassAcademicTerms.value = classTermsRes.data?.data?.classes || classTermsRes.data?.data || [];

    const activeYear = academicYearsList.value.find((y) => Number(y.is_active) === 1) || academicYearsList.value[0];
    if (activeYear && !selectedYearName.value) {
      selectedYearName.value = activeYear.name;
    }

    const activeTerm = academicTermsList.value.find((t: any) => Number(t.is_active) === 1 || t.is_active === true);
    if (activeTerm && selectedTermModel.value === 'all') {
      selectedTermModel.value = activeTerm.id;
    }
  } catch (err: any) {
    console.error('Failed to load academic lookups:', err);
  }
};

const fetchAuditProgress = async () => {
  isLoadingProgress.value = true;
  try {
    const res = await gradeEntryApi.getSectionAuditProgress({
      academic_year_name: selectedYearName.value,
      class_academic_term_id: selectedTermId.value,
    });
    if (res.success) {
      allSections.value = res.data.sections;

      // If a section was already selected, update its reference
      if (selectedSection.value) {
        const updated = allSections.value.find(
          (s) => s.class_section_id === selectedSection.value?.class_section_id,
        );
        if (updated) {
          selectedSection.value = updated;
          await fetchSectionRoster(updated.class_section_id);
        }
      }
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل جلب مؤشرات رصد الدرجات.');
  } finally {
    isLoadingProgress.value = false;
  }
};

const onClassFilterChange = () => {
  // If current selected section doesn't match class, clear it
  if (
    selectedClassIdModel.value !== 'all' &&
    selectedSection.value &&
    selectedSection.value.class_id !== Number(selectedClassIdModel.value)
  ) {
    selectedSection.value = null;
    rosterStudents.value = [];
  }
};

const handleSelectSection = async (section: SectionAuditProgressItem) => {
  selectedSection.value = section;
  await fetchSectionRoster(section.class_section_id);
};

const fetchSectionRoster = async (classSectionId: number) => {
  isLoadingRoster.value = true;
  try {
    const res = await gradeEntryApi.getSectionRoster(classSectionId, {
      academic_year_name: selectedYearName.value,
      class_academic_term_id: selectedTermId.value,
    });
    if (res.success) {
      rosterStudents.value = res.data.students;
      rosterSubjects.value = res.data.subjects;
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل جلب كشف طلاب الشعبة.');
  } finally {
    isLoadingRoster.value = false;
  }
};

const handleOpenGradeEntry = (student: StudentRosterItem) => {
  selectedStudent.value = student;
  isStudentDrawerOpen.value = true;
};

const handleSaveStudentTranscript = async (payload: FreezeTranscriptDto) => {
  isFreezing.value = true;
  try {
    const res = await gradeEntryApi.freezeTranscript(payload);
    if (res.success) {
      toast.success(res.message || 'تم حفظ واعتماد كشف درجات الطالب بنجاح.');
      isStudentDrawerOpen.value = false;
      if (selectedSection.value) {
        await Promise.all([
          fetchSectionRoster(selectedSection.value.class_section_id),
          fetchAuditProgress(),
        ]);
      }
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل تجميد صحيفة الدرجات.');
  } finally {
    isFreezing.value = false;
  }
};

const handleConfirmAnnualGeneration = async () => {
  if (!selectedSection.value) return;
  isGeneratingAnnual.value = true;
  try {
    const res = await gradeEntryApi.generateAnnualForSection({
      class_section_id: selectedSection.value.class_section_id,
      academic_year_name: selectedYearName.value,
    });
    if (res.success) {
      toast.success(res.message || 'تم توليد الصحائف السنوية المجمعة بنجاح.');
      isAnnualModalOpen.value = false;
      await fetchAuditProgress();
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل توليد الصحائف السنوية.');
  } finally {
    isGeneratingAnnual.value = false;
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'passed':
    case 'graduated':
      return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    case 'second_round':
      return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    case 'retained':
    case 'failed':
      return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    default:
      return 'bg-bx-surface-2 text-bx-muted border border-bx-border';
  }
};
</script>
