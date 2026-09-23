<template>
  <div class="space-y-6" dir="rtl">
    <!-- Group sections by class -->
    <div v-for="group in classGroups" :key="group.class_id" class="space-y-3">
      <!-- Class Title Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold text-xs">
            {{ group.grade_level }}
          </div>
          <div>
            <h3 class="font-display font-black text-sm text-bx-title">{{ group.class_name }}</h3>
            <span class="text-[11px] text-bx-muted font-medium">المستوى الأكاديمي {{ group.grade_level }} • {{ group.sections.length }} شعب دراسية</span>
          </div>
        </div>
      </div>

      <!-- Sections Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="sec in group.sections"
          :key="sec.class_section_id"
          class="bg-[var(--bx-surface-solid)] border rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden"
          :class="[
            selectedSectionId === sec.class_section_id
              ? 'border-bx-primary shadow-md ring-2 ring-bx-primary/20 bg-bx-primary/5'
              : 'border-[#B4AED8]/60 dark:border-white/[0.08] hover:border-bx-primary/60 hover:shadow-sm',
          ]"
          @click="$emit('select-section', sec)"
        >
          <!-- Top Row: Section Name & Status Badge -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-black text-sm text-bx-title">{{ sec.section_name }}</span>
                <span v-if="sec.has_annual_generated" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20" title="تم إصدار الصحيفة السنوية المجمعة">
                  سنوية معتمدة
                </span>
              </div>
              <span class="text-[11px] text-bx-muted block mt-0.5">{{ sec.total_enrolled }} طالب مسجل</span>
            </div>

            <!-- Status Pill -->
            <div
              class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
              :class="getStatusClass(sec)"
            >
              {{ getStatusLabel(sec) }}
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-bx-muted font-medium">تقدم الرصد:</span>
              <span class="font-mono font-bold text-bx-title">{{ sec.graded_count }} / {{ sec.total_enrolled }} ({{ sec.completion_rate }}%)</span>
            </div>
            <div class="h-2 bg-bx-surface-2 rounded-full overflow-hidden border border-bx-border/40">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="getProgressFillClass(sec.completion_rate)"
                :style="{ width: `${Math.min(100, Math.max(0, sec.completion_rate))}%` }"
              ></div>
            </div>
          </div>

          <!-- Bottom Row: Metrics & Action Hint -->
          <div class="flex items-center justify-between pt-2 border-t border-[#B4AED8]/30 dark:border-white/[0.04] text-[11px]">
            <div class="flex items-center gap-2">
              <span v-if="sec.graded_count > 0" class="text-emerald-600 font-bold">
                نجاح {{ sec.pass_rate }}%
              </span>
              <span v-else class="text-bx-muted">
                لم يبدأ الرصد
              </span>
            </div>
            <span class="text-bx-primary font-bold text-xs flex items-center gap-0.5 group-hover:underline">
              <span>كشف الدرجات</span>
              <span>←</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="classGroups.length === 0"
      class="bg-[var(--bx-surface-solid)] border border-dashed border-[#B4AED8] dark:border-white/[0.12] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs"
    >
      <div class="w-12 h-12 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center">
        <Layers class="w-6 h-6" />
      </div>
      <h3 class="text-sm font-black text-bx-title">لا توجد شعب دراسية متاحة</h3>
      <p class="text-xs text-bx-muted max-w-md leading-relaxed">
        لم يتم العثور على أي صفوف أو شعب مطابقة للمحددات المختارة. يرجى التأكد من اختيار العام الدراسي أو تسكين الصفوف والشعب.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Layers } from 'lucide-vue-next';
import type { SectionAuditProgressItem } from '../../api/grade-entry.api';

interface Props {
  sections: SectionAuditProgressItem[];
  selectedSectionId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
  selectedSectionId: null,
});

defineEmits<{
  (e: 'select-section', section: SectionAuditProgressItem): void;
}>();

interface ClassGroup {
  class_id: number;
  class_name: string;
  grade_level: number;
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
        sections: [],
      });
    }
    map.get(s.class_id)!.sections.push(s);
  }
  return Array.from(map.values()).sort((a, b) => a.grade_level - b.grade_level);
});

const getStatusClass = (sec: SectionAuditProgressItem) => {
  if (sec.total_enrolled === 0) return 'bg-bx-surface-2 text-bx-muted border border-bx-border';
  if (sec.is_fully_graded) return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
  if (sec.graded_count > 0) return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
  return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
};

const getStatusLabel = (sec: SectionAuditProgressItem) => {
  if (sec.total_enrolled === 0) return 'لا يوجد طلاب';
  if (sec.is_fully_graded) return 'مكتمل الرصد ✅';
  if (sec.graded_count > 0) return `متبقي ${sec.missing_count} طلاب ⏳`;
  return 'غير مرصود ⚪';
};

const getProgressFillClass = (rate: number) => {
  if (rate >= 100) return 'bg-emerald-500';
  if (rate >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
};
</script>
