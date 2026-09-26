<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-4 font-sans text-bx-text" dir="rtl">
      <!-- Unified Container Card (Matching Timetables Reference Design) -->
      <div class="rounded-3xl border border-bx-border bg-bx-surface p-6 sm:p-7 shadow-sm">
        
        <!-- 1. Card Header: Title on Right, Controls & Actions on Left -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-bx-divider">
          <!-- Title & Subtitle with Taqniya Brand Accent -->
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="w-2.5 h-7 rounded-full bg-bx-primary shrink-0"></span>
              <h1 class="text-xl sm:text-2xl font-black font-display text-bx-title">
                شيت رصد الدرجات وإصدار الصحائف المدرسية
              </h1>
              <span
                v-if="selectedYearName"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20 shadow-xs"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>العام الدراسي: {{ selectedYearName }}</span>
              </span>
            </div>
            <p class="text-xs text-bx-muted font-medium mt-1 ms-5">
              رصد وتوثيق درجات أعمال السنة والامتحانات لكل صف وشعبة، تدقيق النواقص، وتوليد الصحائف السنوية المجمعة
            </p>
          </div>

          <!-- Controls: Audit Toggle + Report Modal + Annual Button + Search -->
          <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <!-- Generate / Exported Annual Transcripts for selected section -->
            <div v-if="selectedSection" class="flex items-center gap-2">
              <!-- If already exported for this section -->
              <span
                v-if="selectedSection.has_annual_generated"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs"
              >
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>تم تصدير الصحيفة لهذا الفصل</span>
              </span>

              <!-- Action button: Re-export if generated, or Issue if ALL terms completed -->
              <button
                v-if="selectedSection.has_annual_generated || selectedSection.is_all_terms_completed"
                type="button"
                class="bx-btn bx-btn-primary h-9 px-4 text-xs font-bold transition-all cursor-pointer shadow-md"
                @click="openAnnualModalForCurrentSection"
              >
                <RotateCw v-if="selectedSection.has_annual_generated" class="w-3.5 h-3.5" />
                <Sparkles v-else class="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                <span>{{ selectedSection.has_annual_generated ? 'إعادة تصدير الصحيفة' : 'إصدار الصحيفة السنوية' }}</span>
              </button>
            </div>

            <!-- Audit Toggle Button (Matching Timetables Audit Mode) -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm"
              :class="
                isAuditMode
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-2 ring-amber-400/20'
                  : 'border-bx-border text-bx-title hover:bg-purple-500/[0.04]'
              "
              @click="isAuditMode = !isAuditMode"
            >
              <BarChart3 class="w-3.5 h-3.5" />
              <span>{{ isAuditMode ? 'إلغاء وضع التدقيق' : '📊 تدقيق الشواغر والنواقص' }}</span>
              <span v-if="totalMissingStudents > 0" class="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-mono">
                {{ totalMissingStudents }}
              </span>
            </button>

            <!-- Detailed Audit Modal Button -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title hover:bg-purple-500/[0.04] transition-all cursor-pointer"
              @click="isAuditModalOpen = true"
              title="عرض تقرير حصر النواقص والشعب غير المكتملة"
            >
              <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
              <span>تقرير النواقص</span>
            </button>

            <!-- Search Input (Pill Shaped) -->
            <div class="relative flex-1 sm:w-60">
              <Search class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-bx-muted pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="بحث في الصفوف والشعب..."
                class="w-full pr-10 pl-5 py-2 rounded-full border border-bx-border bg-transparent text-xs font-medium text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all text-start"
              />
            </div>
          </div>
        </div>

        <!-- 2. KPI Metrics Cards (Exact Taqniya Standard) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
          <TaqniyaKpiCard
            title="إجمالي الطلاب المسكنين"
            :value="`${totalEnrolledStudents} طالب`"
            :icon="Users"
            variant="blue"
            badge-text="كافة الشعب"
            :progress="100"
          />

          <TaqniyaKpiCard
            title="الدرجات المرصودة"
            :value="`${totalGradedStudents} طالب`"
            :icon="CheckCircle2"
            variant="primary"
            badge-text="مرصود رسمي"
            :progress="overallCompletionRate"
          />

          <TaqniyaKpiCard
            title="نواقص رصد الدرجات"
            :value="`${totalMissingStudents} غير مرصود`"
            :icon="Clock"
            variant="amber"
            :badge-text="totalMissingStudents > 0 ? 'نواقص ⚠️' : 'مكتمل ✅'"
            :progress="Math.max(0, 100 - (totalMissingStudents > 0 ? (totalMissingStudents / (totalEnrolledStudents || 1)) * 100 : 0))"
          />

          <TaqniyaKpiCard
            title="نسبة النجاح العامة"
            :value="`${overallPassRate}%`"
            :icon="TrendingUp"
            variant="emerald"
            badge-text="للمرصودين"
            :progress="overallPassRate"
          />
        </div>

        <!-- 3. Filters Bar: Year, Class & Term Selectors -->
        <div class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-[#B4AED8]/50 dark:border-white/[0.06] mb-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Academic Year Select -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">العام الدراسي</label>
              <TaqniyaSelect
                v-model="selectedYearName"
                :options="yearFilterOptions"
                placeholder="اختر العام الدراسي..."
                full-width
                @update:model-value="fetchAuditProgress"
              />
            </div>

            <!-- Class Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">تصفية حسب الصف الدراسي</label>
              <TaqniyaSelect
                v-model="selectedClassIdModel"
                :options="classFilterOptions"
                placeholder="كافة الصفوف..."
                full-width
                @update:model-value="onClassFilterChange"
              />
            </div>

            <!-- Term Filter -->
            <div>
              <label class="block text-[11px] font-bold text-bx-muted mb-1">الفصل الدراسي / الفترة</label>
              <TaqniyaSelect
                v-model="selectedTermModel"
                :options="termFilterOptions"
                placeholder="اختر الفصل الدراسي..."
                full-width
                @update:model-value="fetchAuditProgress"
              />
            </div>
          </div>
        </div>

        <!-- 4. Class & Sections Grid Matrix (Matching Timetables 3-Column Card Layout) -->
        <div class="mb-6 space-y-3">
          <div v-if="isLoadingProgress" class="flex flex-col items-center justify-center p-12 text-bx-muted gap-3">
            <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
            <span class="text-xs font-semibold">جاري تحميل مصفوفة الصفوف والشعب وحالة الرصد...</span>
          </div>

          <GradeEntryClassGrid
            v-else
            :sections="filteredSections"
            :selected-section-id="selectedSection?.class_section_id"
            :is-audit-mode="isAuditMode"
            @select-section="handleSelectSection"
            @generate-annual-class="handleOpenAnnualModalForClass"
            @generate-annual-section="handleOpenAnnualModalForSection"
          />
        </div>

        <!-- 5. Section Students Roster Table -->
        <div v-if="selectedSection" class="space-y-4 pt-6 border-t border-bx-divider">
          <!-- Roster Header Banner -->
          <div class="bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold border border-bx-primary/20 shadow-xs">
                <Users class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm sm:text-base font-black text-bx-title font-display">
                    كشف درجات طلاب: {{ selectedSection.class_name }} ({{ selectedSection.section_name }})
                  </h3>
                  <!-- Exported Transcript Badge for this section -->
                  <span
                    v-if="selectedSection.has_annual_generated"
                    class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
                    <span>تم تصدير الصحيفة لهذا الفصل</span>
                  </span>
                </div>
                <p class="text-[11px] text-bx-muted mt-0.5 font-medium">
                  إجمالي المسكنين: {{ rosterStudents.length }} طالب • المرصودون: {{ gradedStudentsCount }} طالب • متبقي: {{ selectedSection.missing_count }}
                </p>
              </div>
            </div>

            <!-- Right Controls: Quick Transcript Action + Search Filter -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Re-export / Issue Button in Roster Banner -->
              <button
                v-if="selectedSection.has_annual_generated"
                type="button"
                @click="openAnnualModalForCurrentSection"
                class="bx-btn bx-btn-outline h-8 px-3.5 text-xs font-bold transition-all cursor-pointer"
                title="إعادة احتساب وتصدير الصحيفة المعتمدة لهذه الشعبة"
              >
                <RotateCw class="w-3.5 h-3.5" />
                <span>إعادة تصدير الصحيفة</span>
              </button>
              <button
                v-else-if="selectedSection.is_all_terms_completed"
                type="button"
                @click="openAnnualModalForCurrentSection"
                class="bx-btn bx-btn-primary h-8 px-4 text-xs font-black shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 transition-all cursor-pointer"
                title="تم اكتمال رصد درجات كافة فصول هذا الصف بالكامل! انقر لإصدار الصحيفة السنوية للشعبة"
              >
                <Sparkles class="w-3.5 h-3.5 animate-pulse" />
                <span>إصدار الصحيفة للشعبة</span>
              </button>

              <!-- Section Search Filter (Pill Shaped) -->
              <div class="relative min-w-[220px]">
                <Search class="w-4 h-4 text-bx-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="rosterSearch"
                  type="text"
                  placeholder="بحث باسم الطالب أو رمزه..."
                  class="w-full bg-transparent border border-bx-border rounded-full px-4 py-1.5 pr-9 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all"
                />
              </div>
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
              <span class="font-bold text-bx-title text-xs">{{ item.student_name }}</span>
            </template>

            <!-- Seating Number Column -->
            <template #cell-seating_number="{ value }">
              <span class="font-mono text-xs text-bx-muted">{{ value || '—' }}</span>
            </template>

            <!-- Grading Status Column -->
            <template #cell-is_graded="{ value }">
              <span
                v-if="value"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>تم الرصد</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs"
              >
                <Clock class="w-3.5 h-3.5" />
                <span>قيد الرصد</span>
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
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs"
                :class="getStatusBadgeClass(item.transcript.final_status)"
              >
                <Award v-if="item.transcript.final_status === 'passed' || item.transcript.final_status === 'graduated'" class="w-3.5 h-3.5" />
                <AlertTriangle v-else-if="item.transcript.final_status === 'second_round'" class="w-3.5 h-3.5" />
                <XCircle v-else class="w-3.5 h-3.5" />
                <span>{{ item.transcript.final_status_ar || item.transcript.final_status }}</span>
              </span>
              <span v-else class="text-bx-muted text-xs">—</span>
            </template>

            <!-- Actions Column -->
            <template #cell-actions="{ item }">
              <div class="flex items-center justify-center gap-1.5">
                <!-- View Details / Transcript Icon Button -->
                <button
                  type="button"
                  @click="handleViewTranscript(item)"
                  class="w-7 h-7 rounded-full border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white dark:border-purple-400 dark:bg-purple-950/80 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  :title="item.is_graded ? 'عرض كشف الدرجات والصحيفة المعتمدة' : 'معاينة بيانات الطالب'"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>

                <!-- Grade Entry / Edit Icon Button -->
                <button
                  type="button"
                  @click="handleOpenGradeEntry(item)"
                  class="w-7 h-7 rounded-full border border-sky-300 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:bg-sky-950/80 dark:text-sky-300 dark:hover:bg-sky-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  :title="item.is_graded ? 'تعديل درجات الطالب' : 'رصد درجات الطالب'"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </template>
          </TaqniyaTable>
        </div>
      </div>

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

      <!-- 2. Official Transcript Detail & Print Drawer -->
      <TranscriptDetailDrawer
        :is-open="isDetailDrawerOpen"
        :transcript="selectedTranscriptForDetail"
        @close="isDetailDrawerOpen = false"
      />

      <!-- 3. Grade Entry Audit Modal -->
      <GradeEntryAuditModal
        :is-open="isAuditModalOpen"
        :sections="allSections"
        @close="isAuditModalOpen = false"
        @select-section="handleSelectSection"
      />

      <!-- 4. Annual Transcripts Confirm Modal -->
      <AnnualTranscriptsConfirmModal
        :is-open="isAnnualModalOpen"
        :target-class="targetClassForAnnual"
        :section-info="targetSectionForAnnual || selectedSection"
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
  Calendar,
  Clock,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Users,
  TrendingUp,
  Loader2,
  Search,
  Eye,
  Edit2,
  AlertTriangle,
  Award,
  XCircle,
  RotateCw,
} from 'lucide-vue-next';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import GradeEntryClassGrid from '../components/grade-entry/GradeEntryClassGrid.vue';
import GradeEntryStudentDrawer from '../components/grade-entry/GradeEntryStudentDrawer.vue';
import TranscriptDetailDrawer from '../components/promotion/TranscriptDetailDrawer.vue';
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
const isAuditMode = ref(false);
const searchQuery = ref('');

// Roster State
const rosterStudents = ref<StudentRosterItem[]>([]);
const rosterSubjects = ref<ClassSubjectRosterItem[]>([]);
const rosterSearch = ref('');

// Modals / Drawers State
const isStudentDrawerOpen = ref(false);
const selectedStudent = ref<StudentRosterItem | null>(null);
const isDetailDrawerOpen = ref(false);
const selectedTranscriptForDetail = ref<any>(null);
const isAuditModalOpen = ref(false);
const isAnnualModalOpen = ref(false);
const targetClassForAnnual = ref<any>(null);
const targetSectionForAnnual = ref<any>(null);

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
    label: `${y.name} ${Number(y.is_active) === 1 ? '(النشط)' : ''}`,
    value: y.name,
    subtext: Number(y.is_active) === 1 ? 'العام الأكاديمي النشط حالياً' : undefined,
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
    { label: 'الفصل النشط حالياً (تلقائي)', value: 'all', subtext: 'يعرض درجات الفصل النشط لكل صف تلقائياً' },
    ...academicTermsList.value.map((t: any) => ({
      value: t.id,
      label: t.name,
      subtext: `فصل دراسي رقم ${t.term_number || t.id}`,
    })),
  ];
});

const resolvedClassAcademicTerm = computed(() => {
  if (!selectedSection.value) return null;
  const classId = Number(selectedSection.value.class_id);

  // Find class entry in allClassAcademicTerms
  const classItem = allClassAcademicTerms.value.find(
    (c: any) => Number(c.class_id || c.id) === classId,
  );
  const terms: any[] = classItem?.terms || [];

  // If a specific academic_term is selected in selectedTermModel:
  if (selectedTermModel.value !== 'all' && selectedTermModel.value) {
    const termId = Number(selectedTermModel.value);
    const match = terms.find(
      (t: any) => Number(t.academic_term_id) === termId || Number(t.id) === termId,
    );
    if (match) return match;
  }

  // If 'all' or not found, try to find the active or first class academic term for this class
  const activeClassTerm = terms.find((t: any) => Number(t.is_active) === 1);
  return activeClassTerm || terms[0] || null;
});

const selectedTermId = computed<number | undefined>(() => {
  if (resolvedClassAcademicTerm.value) {
    return Number(resolvedClassAcademicTerm.value.id);
  }
  if (selectedTermModel.value !== 'all' && selectedTermModel.value) {
    return Number(selectedTermModel.value);
  }
  return undefined;
});

const currentTermName = computed(() => {
  if (resolvedClassAcademicTerm.value) {
    return (
      resolvedClassAcademicTerm.value.term_name ||
      resolvedClassAcademicTerm.value.academic_term?.name ||
      'الفصل الدراسي النشط'
    );
  }
  const term = academicTermsList.value.find((t) => t.id === Number(selectedTermModel.value));
  return term?.name || 'الفصل الدراسي النشط';
});

// Filtered Sections by selected class & search
const filteredSections = computed(() => {
  let list = allSections.value;
  if (selectedClassIdModel.value !== 'all' && selectedClassIdModel.value) {
    list = list.filter((s) => s.class_id === Number(selectedClassIdModel.value));
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((s) => s.class_name.toLowerCase().includes(q) || s.section_name.toLowerCase().includes(q));
  }
  return list;
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

    // Keep selectedTermModel as 'all' so resolvedClassAcademicTerm dynamically resolves the active term (is_active === 1) for each class
    selectedTermModel.value = 'all';
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

const handleViewTranscript = (student: StudentRosterItem) => {
  if (student.transcript) {
    selectedTranscriptForDetail.value = {
      id: student.transcript.id,
      student_id: student.student_id,
      student_name: student.student_name,
      student_code: student.student_code,
      transcript_type: selectedTermId.value ? 'term' : 'annual',
      transcript_type_ar: selectedTermId.value ? currentTermName.value : 'نهاية العام الدراسي',
      academic_year_name: selectedYearName.value,
      class_name: selectedSection.value?.class_name || '',
      section_name: selectedSection.value?.section_name || '',
      grade_level: selectedSection.value?.grade_level || 0,
      total_score: student.transcript.total_score,
      percentage: student.transcript.percentage,
      final_status: student.transcript.final_status,
      transcript_data: student.transcript.transcript_data,
      created_at: student.transcript.created_at,
    };
    isDetailDrawerOpen.value = true;
  } else {
    handleOpenGradeEntry(student);
  }
};

const handleSaveStudentTranscript = async (payload: FreezeTranscriptDto) => {
  isFreezing.value = true;
  try {
    const res = await gradeEntryApi.freezeTranscript(payload);
    if (res.success) {
      toast.success('تم رصد وتجميد درجات الطالب بنجاح.');
      isStudentDrawerOpen.value = false;

      // Refresh data
      if (selectedSection.value) {
        await fetchSectionRoster(selectedSection.value.class_section_id);
      }
      await fetchAuditProgress();
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل حفظ درجات الطالب.');
  } finally {
    isFreezing.value = false;
  }
};

const handleOpenAnnualModalForClass = (classGroup: any) => {
  targetClassForAnnual.value = classGroup;
  targetSectionForAnnual.value = null;
  isAnnualModalOpen.value = true;
};

const handleOpenAnnualModalForSection = (section: any) => {
  targetClassForAnnual.value = null;
  targetSectionForAnnual.value = section;
  isAnnualModalOpen.value = true;
};

const openAnnualModalForCurrentSection = () => {
  if (selectedSection.value) {
    targetClassForAnnual.value = null;
    targetSectionForAnnual.value = selectedSection.value;
    isAnnualModalOpen.value = true;
  }
};

const handleConfirmAnnualGeneration = async (options: {
  enableCompensation: boolean;
  secondRoundMode: 'replace_exam' | 'full_score';
  capPassingScore: boolean;
}) => {
  isGeneratingAnnual.value = true;
  try {
    let res: any;
    if (targetClassForAnnual.value) {
      res = await gradeEntryApi.generateAnnualForClass({
        class_id: targetClassForAnnual.value.class_id,
        academic_year_name: selectedYearName.value,
        enable_annual_exam_compensation: options.enableCompensation,
        second_round_mode: options.secondRoundMode,
        cap_passing_score: options.capPassingScore,
      });
    } else if (targetSectionForAnnual.value || selectedSection.value) {
      const secId = targetSectionForAnnual.value?.class_section_id || selectedSection.value?.class_section_id;
      res = await gradeEntryApi.generateAnnualForSection({
        class_section_id: secId,
        academic_year_name: selectedYearName.value,
        enable_annual_exam_compensation: options.enableCompensation,
        second_round_mode: options.secondRoundMode,
        cap_passing_score: options.capPassingScore,
      });
    }

    if (res?.success) {
      toast.success(res.message || 'تم إصدار الصحيفة السنوية المجمعة بنجاح.');
      isAnnualModalOpen.value = false;
      await fetchAuditProgress();
      if (selectedSection.value) {
        await fetchSectionRoster(selectedSection.value.class_section_id);
      }
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل إصدار الصحيفة السنوية.');
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
    case 'failed':
      return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    default:
      return 'bg-bx-surface-2 text-bx-muted border border-bx-border';
  }
};
</script>
