<template>
  <div class="space-y-4" dir="rtl">
    <!-- 1. Executive Section Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#B4AED8]/30 dark:border-white/[0.06]">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-bx-primary/20 via-bx-primary/10 to-transparent border border-bx-primary/30 flex items-center justify-center text-bx-primary shadow-xs shrink-0">
          <School class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm sm:text-base font-black text-bx-title font-display tracking-tight">
              صفوف وشعب المدرسة
            </h3>
            <!-- Quick Summary Counters -->
            <div class="flex items-center gap-1.5 text-[11px] font-bold text-bx-muted">
              <span class="px-2 py-0.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-[#B4AED8]/40 dark:border-white/[0.08]">
                {{ classGroups.length }} صفاً
              </span>
              <span>•</span>
              <span class="px-2 py-0.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-[#B4AED8]/40 dark:border-white/[0.08]">
                {{ totalSectionsCount }} شعبة
              </span>
              <span v-if="totalStudentsCount > 0">•</span>
              <span v-if="totalStudentsCount > 0" class="px-2 py-0.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-[#B4AED8]/40 dark:border-white/[0.08]">
                {{ totalStudentsCount }} طالب
              </span>
            </div>
          </div>
          <p class="text-xs text-bx-muted mt-0.5 font-medium">
            حدد الصف كاملاً لاستعراض الترتيب التنافسي العام، أو حدد شعبة دراسية مخصصة
          </p>
        </div>
      </div>

      <!-- Selection Indicator Pill / Chip -->
      <div class="flex items-center gap-2 self-start md:self-auto">
        <div
          v-if="selectedClassId"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-bx-primary/15 via-bx-primary/10 to-bx-primary/5 border border-bx-primary/30 shadow-xs animate-in fade-in duration-200"
        >
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-bx-primary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-bx-primary"></span>
          </span>
          <div class="text-xs font-bold text-bx-title flex items-center gap-1.5">
            <span class="text-bx-muted">المحدد:</span>
            <span class="text-bx-primary font-black">{{ selectedClassName || 'صف دراسي' }}</span>
            <span v-if="selectedSectionName && selectedSectionName !== 'all'" class="text-bx-title font-extrabold">
              — {{ selectedSectionName }}
            </span>
            <span v-else class="text-[11px] text-bx-muted font-normal">
              (كافة الشعب • ترتيب عام)
            </span>
          </div>
          <button
            type="button"
            class="ms-1 w-5 h-5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-bx-muted hover:text-bx-title flex items-center justify-center transition-colors cursor-pointer"
            title="إلغاء التحديد"
            @click="clearSelection"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          v-else
          class="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#B4AED8]/40 dark:border-white/[0.06] text-xs text-bx-muted font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-slate-400/60 dark:bg-white/20"></span>
          <span>لم يتم تحديد صف دراسي بعد</span>
        </div>
      </div>
    </div>

    <!-- 2. Stage Filter Tabs (Micro Filter) -->
    <div v-if="availableStages.length > 1" class="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
        :class="[
          selectedStageFilter === 'all'
            ? 'bg-bx-primary text-white border-bx-primary shadow-xs'
            : 'border-[#B4AED8]/40 dark:border-white/[0.08] text-bx-muted hover:text-bx-title hover:bg-black/5 dark:hover:bg-white/5 bg-transparent'
        ]"
        @click="selectedStageFilter = 'all'"
      >
        <span>كافة المراحل</span>
        <span class="text-[10px] font-mono opacity-80">({{ classGroups.length }})</span>
      </button>

      <button
        v-for="stg in availableStages"
        :key="stg.name"
        type="button"
        class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
        :class="[
          selectedStageFilter === stg.name
            ? 'bg-bx-primary text-white border-bx-primary shadow-xs'
            : 'border-[#B4AED8]/40 dark:border-white/[0.08] text-bx-muted hover:text-bx-title hover:bg-black/5 dark:hover:bg-white/5 bg-transparent'
        ]"
        @click="selectedStageFilter = stg.name"
      >
        <span>{{ stg.name }}</span>
        <span class="text-[10px] font-mono opacity-80">({{ stg.count }})</span>
      </button>
    </div>

    <!-- 3. Empty State -->
    <div
      v-if="filteredClassGroups.length === 0"
      class="text-center py-10 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-dashed border-[#B4AED8]/50 dark:border-white/[0.08] space-y-2"
    >
      <div class="w-12 h-12 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center mx-auto border border-bx-primary/20 shadow-xs">
        <School class="w-6 h-6" />
      </div>
      <p class="text-xs font-bold text-bx-muted">لا توجد صفوف دراسية تطابق التصفية المحددة.</p>
    </div>

    <!-- 4. Class & Sections Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
      <div
        v-for="cls in filteredClassGroups"
        :key="cls.class_id"
        class="group relative overflow-hidden rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between"
        :class="[
          isClassSelected(cls.class_id)
            ? 'border-bx-primary/80 bg-gradient-to-br from-bx-primary/[0.08] via-bx-primary/[0.03] to-transparent ring-1 ring-bx-primary/40 shadow-[0_8px_25px_rgba(91,60,230,0.12)] -translate-y-0.5'
            : 'border-[#B4AED8]/50 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.015] hover:border-bx-primary/50 hover:bg-bx-primary/[0.02] hover:shadow-md hover:-translate-y-0.5',
        ]"
      >
        <!-- Top Glow Ambient Bar (Active Indicator) -->
        <div
          v-if="isClassSelected(cls.class_id)"
          class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-bx-primary via-purple-400 to-bx-primary"
        ></div>

        <!-- Class Header -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <!-- Class Title & Stage Info -->
          <div
            class="flex items-start gap-2.5 text-start cursor-pointer group-hover:opacity-90 transition-opacity flex-1 min-w-0"
            @click="$emit('select-class', cls.class_id, cls.class_name, cls.grade_level)"
            :title="`اختيار ${cls.class_name} كاملاً لعرض الترتيب العام`"
          >
            <div
              class="w-3 h-3 rounded-full mt-1 shrink-0 transition-all"
              :class="isClassSelected(cls.class_id) ? 'bg-bx-primary ring-4 ring-bx-primary/20 scale-110' : 'bg-slate-300 dark:bg-white/20 group-hover:bg-bx-primary/50'"
            ></div>
            <div class="space-y-1 min-w-0">
              <span class="font-black text-xs sm:text-sm text-bx-title font-display block truncate leading-tight group-hover:text-bx-primary transition-colors">
                {{ cls.class_name }}
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-if="cls.stage_name"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                  :class="getStageBadgeClass(cls.stage_name)"
                >
                  {{ cls.stage_name }}
                </span>
                <span class="text-[10px] font-medium text-bx-muted">
                  {{ cls.sections.length }} شعبة
                </span>
                <span v-if="cls.total_students > 0" class="text-[10px] font-medium text-bx-muted">
                  • {{ cls.total_students }} طالب
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Action: All Sections (General Ranking) -->
          <button
            type="button"
            class="px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer border shrink-0 flex items-center gap-1.5"
            :class="[
              isClassSelected(cls.class_id) && (!selectedSectionName || selectedSectionName === 'all')
                ? 'bg-bx-primary text-white border-bx-primary shadow-xs ring-2 ring-bx-primary/20 font-black'
                : 'text-bx-muted hover:text-bx-primary border-[#B4AED8]/50 dark:border-white/10 hover:border-bx-primary/40 hover:bg-bx-primary/10 bg-transparent',
            ]"
            @click="$emit('select-class', cls.class_id, cls.class_name, cls.grade_level)"
            title="عرض كشف عام لكافة طلاب الصف وترتيبهم تنازلياً"
          >
            <Trophy class="w-3 h-3" />
            <span>كافة الشعب (ترتيب عام)</span>
          </button>
        </div>

        <!-- Subtle Gradient Divider -->
        <div class="h-px bg-gradient-to-r from-transparent via-[#B4AED8]/40 dark:via-white/10 to-transparent my-2.5"></div>

        <!-- Sections Pills -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold text-bx-muted block">الشعب الدراسية:</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="sec in cls.sections"
              :key="sec.class_section_id"
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95"
              :class="[
                isSectionSelected(cls.class_id, sec.section_name, sec.class_section_id)
                  ? 'bg-bx-primary text-white border-bx-primary shadow-sm ring-2 ring-bx-primary/30 font-black scale-[1.02]'
                  : 'border-[#B4AED8]/50 dark:border-white/10 text-bx-title hover:text-bx-primary hover:border-bx-primary/50 hover:bg-bx-primary/10 bg-black/[0.02] dark:bg-white/[0.03]',
              ]"
              @click="$emit('select-section', sec)"
              :title="`عرض طلاب ${cls.class_name} - ${sec.section_name} فقط`"
            >
              <span>{{ sec.section_name }}</span>
              <span
                v-if="sec.total_enrolled > 0"
                class="text-[10px] font-mono px-1.5 py-0.2 rounded-md"
                :class="isSectionSelected(cls.class_id, sec.section_name, sec.class_section_id) ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-bx-muted'"
              >
                {{ sec.total_enrolled }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { School, Trophy, X } from 'lucide-vue-next';
import type { SectionAuditProgressItem } from '../../api/grade-entry.api';
import type { AcademicClassItem } from '../../api/academic.api';

interface Props {
  sections: SectionAuditProgressItem[];
  classes?: AcademicClassItem[];
  selectedClassId?: number | null;
  selectedClassName?: string | null;
  selectedSectionId?: number | null;
  selectedSectionName?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
  classes: () => [],
  selectedClassId: null,
  selectedClassName: null,
  selectedSectionId: null,
  selectedSectionName: null,
});

const emit = defineEmits<{
  (e: 'select-class', classId: number, className: string, gradeLevel: number): void;
  (e: 'select-section', section: SectionAuditProgressItem): void;
  (e: 'clear-selection'): void;
}>();

interface ClassGroup {
  class_id: number;
  class_name: string;
  grade_level: number;
  stage_name?: string;
  sections: SectionAuditProgressItem[];
  total_students: number;
}

const selectedStageFilter = ref<string>('all');

const classGroups = computed<ClassGroup[]>(() => {
  const map = new Map<number, ClassGroup>();
  for (const s of props.sections) {
    if (!map.has(s.class_id)) {
      const classItem = props.classes.find((c) => c.id === s.class_id);
      map.set(s.class_id, {
        class_id: s.class_id,
        class_name: s.class_name,
        grade_level: s.grade_level,
        stage_name: classItem?.stage_name || s.class_name.includes('روضة') ? 'مرحلة الروضة' : undefined,
        sections: [],
        total_students: 0,
      });
    }
    const group = map.get(s.class_id)!;
    group.sections.push(s);
    group.total_students += s.total_enrolled || 0;
  }
  return Array.from(map.values()).sort((a, b) => a.class_id - b.class_id);
});

const availableStages = computed(() => {
  const counts: Record<string, number> = {};
  for (const cg of classGroups.value) {
    const stage = cg.stage_name || 'عام';
    counts[stage] = (counts[stage] || 0) + 1;
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
});

const filteredClassGroups = computed(() => {
  if (selectedStageFilter.value === 'all') return classGroups.value;
  return classGroups.value.filter((cg) => cg.stage_name === selectedStageFilter.value);
});

const totalSectionsCount = computed(() => {
  return classGroups.value.reduce((acc, cg) => acc + cg.sections.length, 0);
});

const totalStudentsCount = computed(() => {
  return classGroups.value.reduce((acc, cg) => acc + cg.total_students, 0);
});

const isClassSelected = (classId: number) => {
  return props.selectedClassId === classId;
};

const isSectionSelected = (classId: number, sectionName: string, classSectionId: number) => {
  if (props.selectedClassId !== classId) return false;
  if (!props.selectedSectionName || props.selectedSectionName === 'all') return false;
  return (
    props.selectedSectionName === sectionName ||
    (props.selectedSectionId && props.selectedSectionId === classSectionId)
  );
};

const clearSelection = () => {
  emit('clear-selection');
};

function getStageBadgeClass(stageName?: string) {
  if (!stageName) return 'border-[#B4AED8]/50 dark:border-white/10 text-bx-muted bg-slate-500/10';
  if (stageName.includes('روضة') || stageName.includes('تمهيدي')) {
    return 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10';
  }
  if (stageName.includes('ابتدائي')) {
    return 'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10';
  }
  if (stageName.includes('إعدادي')) {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
  }
  if (stageName.includes('ثانوي')) {
    return 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10';
  }
  return 'border-[#B4AED8]/50 dark:border-white/10 text-bx-muted bg-slate-500/10';
}
</script>
