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
        class="p-4 rounded-2xl border transition-all flex flex-col justify-between"
        :class="[
          isAuditMode && cls.totalMissing > 0
            ? 'border-amber-400/80 bg-amber-500/[0.04]'
            : isAuditMode
            ? 'border-emerald-400/80 bg-emerald-500/[0.03]'
            : cls.hasAnnualGenerated
            ? 'border-purple-300 dark:border-purple-500/30 bg-purple-500/[0.02]'
            : 'border-bx-border bg-bx-surface hover:border-bx-primary/40',
        ]"
      >
        <div>
          <!-- Class Name Header with Dot Indicator & Audit Badge -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-bx-primary"></span>
              <span class="font-black text-xs sm:text-sm text-bx-title font-display">{{ cls.class_name }}</span>
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
          <div class="flex flex-wrap gap-1.5 mb-3">
            <button
              v-for="sec in cls.sections"
              :key="sec.class_section_id"
              @click="$emit('select-section', sec)"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
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
                class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold"
                :class="
                  selectedSectionId === sec.class_section_id
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                "
                title="تم تصدير الصحيفة المعتمدة لهذه الشعبة"
              >
                <CheckCircle2 class="w-2.5 h-2.5" />
                <span>تم التصدير</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Class-Level Annual Transcript Action Card Footer -->
        <div class="pt-2.5 mt-2 border-t border-bx-divider">
          <!-- State 1: Annual Transcripts Already Generated For This Class -->
          <div
            v-if="cls.hasAnnualGenerated"
            class="flex items-center justify-between w-full p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <span class="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
              <span>تم تصدير الصحيفة لهذا الفصل</span>
            </span>
            <button
              @click.stop="$emit('generate-annual-class', cls)"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
              title="إعادة احتساب وتصدير الصحيفة السنوية لطلاب الصف"
            >
              <RotateCw class="w-3 h-3" />
              <span>إعادة التصدير</span>
            </button>
          </div>

          <!-- State 2: All Terms Fully Graded (Ready to Generate Annual Transcript) -->
          <div v-else-if="cls.isAllTermsCompleted" class="w-full">
            <button
              @click.stop="$emit('generate-annual-class', cls)"
              type="button"
              class="bx-btn bx-btn-primary w-full h-9 px-4 text-xs font-black shadow-md shadow-purple-500/20 hover:shadow-purple-500/35 transition-all cursor-pointer"
              title="تم رصد درجات كافة فصول هذا الصف بالكامل! انقر لتوليد وتصدير الصحيفة"
            >
              <Sparkles class="w-4 h-4 animate-pulse" />
              <span>إصدار الصحيفة السنوية للصف</span>
            </button>
          </div>

          <!-- State 3: Terms In Progress (No button shown until all terms are completed) -->
          <div v-else class="flex items-center justify-between w-full py-1">
            <span class="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-bold" title="درجات بعض الفصول أو الشعب ما زالت قيد الرصد">
              <Clock class="w-3.5 h-3.5 text-amber-500" />
              <span>فصول الصف قيد الرصد (غير مكتمل)</span>
            </span>
            <span class="text-[10px] font-mono text-bx-muted font-bold">
              {{ cls.totalGraded }} / {{ cls.totalEnrolled }} مرصود
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { School, AlertTriangle, CheckCircle2, Sparkles, Clock, RotateCw } from 'lucide-vue-next';
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
  (e: 'generate-annual-class', classGroup: ClassGroup): void;
  (e: 'generate-annual-section', section: SectionAuditProgressItem): void;
}>();

export interface ClassGroup {
  class_id: number;
  class_name: string;
  grade_level: number;
  totalEnrolled: number;
  totalGraded: number;
  totalMissing: number;
  isAllTermsCompleted: boolean;
  hasAnnualGenerated: boolean;
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
        isAllTermsCompleted: false,
        hasAnnualGenerated: false,
        sections: [],
      });
    }
    const group = map.get(s.class_id)!;
    group.sections.push(s);
    group.totalEnrolled += s.total_enrolled;
    group.totalGraded += s.graded_count;
    group.totalMissing += s.missing_count;
  }

  // Calculate class-level annual completion metrics
  for (const group of map.values()) {
    group.isAllTermsCompleted =
      group.totalEnrolled > 0 &&
      group.sections.every((s) => s.is_all_terms_completed);
    group.hasAnnualGenerated =
      group.totalEnrolled > 0 &&
      group.sections.every((s) => s.has_annual_generated);
  }

  return Array.from(map.values()).sort((a, b) => a.grade_level - b.grade_level);
});
</script>
