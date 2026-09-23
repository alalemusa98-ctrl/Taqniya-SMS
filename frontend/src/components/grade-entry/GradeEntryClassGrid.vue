<template>
  <div class="space-y-3" dir="rtl">
    <!-- Header info line matching Timetables view -->
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold text-bx-muted flex items-center gap-1.5">
        <School class="w-3.5 h-3.5 text-bx-primary" />
        <span>صفوف وشعب المدرسة (اختر الشعبة لعرض كشف درجاتها ورصدها):</span>
      </h3>
      <span class="text-[11px] text-bx-muted">التحميل عند الطلب (Lazy Load)</span>
    </div>

    <!-- Empty State -->
    <div
      v-if="classGroups.length === 0"
      class="text-center py-8 bg-purple-500/[0.02] rounded-2xl border border-bx-border"
    >
      <School class="w-8 h-8 text-bx-muted mx-auto mb-2 opacity-50" />
      <p class="text-xs text-bx-muted">لا توجد صفوف أو شعب مطابقة للمحددات أو البحث.</p>
    </div>

    <!-- 3-Column Class Cards Grid (Matching Timetables Management View exactly) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="cls in classGroups"
        :key="cls.class_id"
        class="p-3.5 rounded-2xl border transition-all"
        :class="[
          isAuditMode && cls.totalMissing > 0
            ? 'border-amber-400/80 bg-amber-500/[0.04]'
            : isAuditMode
            ? 'border-emerald-400/80 bg-emerald-500/[0.03]'
            : 'border-bx-border bg-bx-surface hover:border-bx-primary/40',
        ]"
      >
        <!-- Class Name Header with Dot Indicator & Audit Badge -->
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-bx-primary"></span>
            <span class="font-black text-xs text-bx-title font-display">{{ cls.class_name }}</span>
          </div>

          <!-- Audit Deficit Badge on Class Header -->
          <div v-if="isAuditMode">
            <span
              v-if="cls.totalMissing > 0"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
            >
              <AlertTriangle class="w-3 h-3" />
              <span>{{ cls.totalMissing }} غير مرصود</span>
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
            >
              <CheckCircle2 class="w-3 h-3" />
              <span>مكتمل الرصد</span>
            </span>
          </div>
          <div v-else-if="cls.totalEnrolled > 0">
            <span class="text-[10px] font-medium text-bx-muted">
              {{ cls.totalGraded }} / {{ cls.totalEnrolled }} مرصود
            </span>
          </div>
        </div>

        <!-- Sections Buttons (Pills) -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="sec in cls.sections"
            :key="sec.class_section_id"
            @click="$emit('select-section', sec)"
            type="button"
            class="px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
            :class="[
              selectedSectionId === sec.class_section_id
                ? 'bg-bx-primary text-white border-bx-primary shadow-xs'
                : 'border-bx-border text-bx-muted hover:text-bx-title hover:border-bx-primary/40 bg-transparent',
              isAuditMode && sec.missing_count > 0 && selectedSectionId !== sec.class_section_id
                ? 'border-amber-400 text-amber-600 bg-amber-500/5'
                : '',
            ]"
          >
            <span>{{ sec.section_name }}</span>

            <!-- Badge when in Audit Mode -->
            <span
              v-if="isAuditMode"
              class="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold"
              :class="
                sec.missing_count > 0
                  ? selectedSectionId === sec.class_section_id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  : selectedSectionId === sec.class_section_id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              "
            >
              {{ sec.missing_count > 0 ? `-${sec.missing_count}` : '✓' }}
            </span>

            <!-- Annual Generated Badge -->
            <span
              v-else-if="sec.has_annual_generated"
              class="w-1.5 h-1.5 rounded-full bg-purple-400"
              title="تم إصدار الصحيفة السنوية"
            ></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { School, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import type { SectionAuditProgressItem } from '../../api/grade-entry.api';

interface Props {
  sections: SectionAuditProgressItem[];
  selectedSectionId?: number | null;
  isAuditMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
  selectedSectionId: null,
  isAuditMode: false,
});

defineEmits<{
  (e: 'select-section', section: SectionAuditProgressItem): void;
}>();

interface ClassGroup {
  class_id: number;
  class_name: string;
  grade_level: number;
  totalEnrolled: number;
  totalGraded: number;
  totalMissing: number;
  sections: SectionAuditProgressItem[];
}

const classGroups = computed<ClassGroup[]>(() => {
  const map = new Map<number, ClassGroup>();
  for (const s of props.sections) {
    if (!map.has(s.class_id)) {
      map.set(s.class_id, {
        class_id: s.class_id,
        class_name: s.class_name,
        grade_level: s.grade_level,
        totalEnrolled: 0,
        totalGraded: 0,
        totalMissing: 0,
        sections: [],
      });
    }
    const group = map.get(s.class_id)!;
    group.sections.push(s);
    group.totalEnrolled += s.total_enrolled;
    group.totalGraded += s.graded_count;
    group.totalMissing += s.missing_count;
  }
  return Array.from(map.values()).sort((a, b) => a.grade_level - b.grade_level);
});
</script>
