<template>
  <div class="space-y-3" dir="rtl">
    <!-- Header Info Line -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h3 class="text-xs font-bold text-bx-muted flex items-center gap-1.5">
        <School class="w-4 h-4 text-bx-primary" />
        <span>صفوف وشعب المدرسة (حدد الصف كاملاً للترتيب العام، أو حدد شعبة معينة):</span>
      </h3>
      <div v-if="selectedClassId" class="flex items-center gap-2">
        <span class="text-[11px] font-bold text-bx-primary bg-bx-primary/10 px-3 py-1 rounded-full border border-bx-primary/20 shadow-xs flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-bx-primary"></span>
          <span>المحدد: {{ selectedClassName || 'صف دراسي' }}</span>
          <span v-if="selectedSectionName && selectedSectionName !== 'all'" class="text-bx-title font-black">
            — {{ selectedSectionName }}
          </span>
          <span v-else class="text-bx-muted font-normal">
            (كافة الشعب • الترتيب العام)
          </span>
        </span>
      </div>
      <span v-else class="text-[11px] text-bx-muted font-medium">
        لم يتم تحديد صف دراسي بعد
      </span>
    </div>

    <!-- Empty State -->
    <div
      v-if="classGroups.length === 0"
      class="text-center py-8 bg-purple-500/[0.02] rounded-2xl border border-bx-border"
    >
      <School class="w-8 h-8 text-bx-muted mx-auto mb-2 opacity-50" />
      <p class="text-xs text-bx-muted">جاري تحميل الصفوف والشعب المدرسية...</p>
    </div>

    <!-- 3-Column Class & Sections Cards Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="cls in classGroups"
        :key="cls.class_id"
        class="p-3.5 rounded-2xl border transition-all duration-150"
        :class="[
          isClassSelected(cls.class_id)
            ? 'border-bx-primary bg-bx-primary/[0.04] ring-1 ring-bx-primary/30 shadow-xs'
            : 'border-bx-border bg-bx-surface hover:border-bx-primary/40',
        ]"
      >
        <!-- Class Header with Stage Badge -->
        <div class="flex items-center justify-between gap-2 mb-2.5">
          <button
            type="button"
            class="flex items-center gap-2 text-start cursor-pointer hover:opacity-80 transition-opacity"
            @click="$emit('select-class', cls.class_id, cls.class_name, cls.grade_level)"
            :title="`اختيار كافة شعب ${cls.class_name} لعرض الترتيب العام`"
          >
            <span
              class="w-2.5 h-2.5 rounded-full transition-colors shrink-0"
              :class="isClassSelected(cls.class_id) ? 'bg-bx-primary ring-2 ring-bx-primary/30' : 'bg-slate-300 dark:bg-white/30'"
            ></span>
            <div>
              <span class="font-black text-xs text-bx-title font-display">{{ cls.class_name }}</span>
              <span v-if="cls.stage_name" class="ms-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-bx-muted border border-slate-200 dark:border-white/[0.08]">
                {{ cls.stage_name }}
              </span>
            </div>
          </button>

          <!-- Quick Action: Select Entire Class (All Sections) -->
          <button
            type="button"
            class="px-2 py-0.8 text-[10px] font-bold rounded-lg transition-all cursor-pointer border shrink-0"
            :class="[
              isClassSelected(cls.class_id) && (!selectedSectionName || selectedSectionName === 'all')
                ? 'bg-bx-primary text-white border-bx-primary shadow-xs'
                : 'text-bx-muted hover:text-bx-primary border-bx-border/60 hover:bg-black/5 dark:hover:bg-white/5 bg-transparent',
            ]"
            @click="$emit('select-class', cls.class_id, cls.class_name, cls.grade_level)"
            title="عرض كشف عام لكافة طلاب الصف وترتيبهم تنازلياً"
          >
            كافة الشعب (ترتيب عام)
          </button>
        </div>

        <!-- Sections Buttons (Pills) -->
        <div class="flex flex-wrap gap-1.5 pt-1 border-t border-bx-border/40">
          <button
            v-for="sec in cls.sections"
            :key="sec.class_section_id"
            type="button"
            class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
            :class="[
              isSectionSelected(cls.class_id, sec.section_name, sec.class_section_id)
                ? 'bg-bx-primary text-white border-bx-primary shadow-xs ring-1 ring-bx-primary/30'
                : 'border-bx-border text-bx-muted hover:text-bx-title hover:border-bx-primary/40 bg-transparent',
            ]"
            @click="$emit('select-section', sec)"
            :title="`عرض طلاب ${cls.class_name} - ${sec.section_name} فقط`"
          >
            <span>{{ sec.section_name }}</span>
            <span
              v-if="sec.total_enrolled > 0"
              class="text-[10px] font-mono opacity-80"
              :class="isSectionSelected(cls.class_id, sec.section_name, sec.class_section_id) ? 'text-white/90' : 'text-bx-muted'"
            >
              ({{ sec.total_enrolled }})
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { School } from 'lucide-vue-next';
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

defineEmits<{
  (e: 'select-class', classId: number, className: string, gradeLevel: number): void;
  (e: 'select-section', section: SectionAuditProgressItem): void;
}>();

interface ClassGroup {
  class_id: number;
  class_name: string;
  grade_level: number;
  stage_name?: string;
  sections: SectionAuditProgressItem[];
}

const classGroups = computed<ClassGroup[]>(() => {
  const map = new Map<number, ClassGroup>();
  for (const s of props.sections) {
    if (!map.has(s.class_id)) {
      const classItem = props.classes.find((c) => c.id === s.class_id);
      map.set(s.class_id, {
        class_id: s.class_id,
        class_name: s.class_name,
        grade_level: s.grade_level,
        stage_name: classItem?.stage_name,
        sections: [],
      });
    }
    const group = map.get(s.class_id)!;
    group.sections.push(s);
  }
  return Array.from(map.values()).sort((a, b) => a.class_id - b.class_id);
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
</script>
