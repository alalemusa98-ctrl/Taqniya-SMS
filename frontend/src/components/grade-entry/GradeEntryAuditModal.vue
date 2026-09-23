<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="تدقيق ومطابقة نواقص رصد الدرجات (Grade Entry Audit)"
    subtitle="حصر الشعب والفصول التي لم تكتمل درجات طلابها في الفصل الدراسي المختار"
    max-width="lg"
    @close="emit('close')"
  >
    <div class="space-y-6" dir="rtl">
      <!-- KPI Overview Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-[var(--bx-surface-solid)] border border-bx-border rounded-xl p-3.5 flex flex-col gap-1">
          <span class="text-[11px] font-bold text-bx-muted">إجمالي الشعب</span>
          <span class="text-lg font-black text-bx-title font-mono">{{ sections.length }}</span>
        </div>

        <div class="bg-[var(--bx-surface-solid)] border border-emerald-500/20 rounded-xl p-3.5 flex flex-col gap-1">
          <span class="text-[11px] font-bold text-emerald-600">مكتملة الرصد</span>
          <span class="text-lg font-black text-emerald-600 font-mono">{{ completedSections.length }}</span>
        </div>

        <div class="bg-[var(--bx-surface-solid)] border border-amber-500/20 rounded-xl p-3.5 flex flex-col gap-1">
          <span class="text-[11px] font-bold text-amber-600">شعب بها نواقص</span>
          <span class="text-lg font-black text-amber-600 font-mono">{{ incompleteSections.length }}</span>
        </div>

        <div class="bg-[var(--bx-surface-solid)] border border-rose-500/20 rounded-xl p-3.5 flex flex-col gap-1">
          <span class="text-[11px] font-bold text-rose-600">إجمالي الطلاب المتبقين</span>
          <span class="text-lg font-black text-rose-600 font-mono">{{ totalMissingStudents }}</span>
        </div>
      </div>

      <!-- Incomplete Sections Table -->
      <div v-if="incompleteSections.length > 0" class="space-y-2">
        <h4 class="text-xs font-black text-bx-title flex items-center gap-1.5">
          <AlertTriangle class="w-4 h-4 text-amber-500" />
          <span>الشعب التي تتطلب استكمال الرصد:</span>
        </h4>
        <div class="overflow-x-auto rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.08] bg-[var(--bx-surface-solid)]">
          <table class="w-full text-right text-xs border-collapse">
            <thead>
              <tr class="bg-black/[0.02] dark:bg-white/[0.02] text-bx-muted font-bold border-b border-[#B4AED8]/30 dark:border-white/[0.06]">
                <th class="py-3 px-4">الصف الدراسي</th>
                <th class="py-3 px-4">الشعبة</th>
                <th class="py-3 px-4 text-center">إجمالي الطلاب</th>
                <th class="py-3 px-4 text-center">تم رصدهم</th>
                <th class="py-3 px-4 text-center">المتبقون</th>
                <th class="py-3 px-4 text-center">نسبة الإنجاز</th>
                <th class="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#B4AED8]/30 dark:divide-white/[0.04]">
              <tr
                v-for="sec in incompleteSections"
                :key="sec.class_section_id"
                class="hover:bg-bx-primary/5 transition-colors"
              >
                <td class="py-2.5 px-4 font-bold text-bx-title">{{ sec.class_name }}</td>
                <td class="py-2.5 px-4 font-bold text-bx-primary">{{ sec.section_name }}</td>
                <td class="py-2.5 px-4 text-center font-mono font-bold">{{ sec.total_enrolled }}</td>
                <td class="py-2.5 px-4 text-center font-mono text-emerald-600 font-bold">{{ sec.graded_count }}</td>
                <td class="py-2.5 px-4 text-center font-mono text-rose-600 font-bold">{{ sec.missing_count }}</td>
                <td class="py-2.5 px-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        :class="sec.completion_rate > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'">
                    {{ sec.completion_rate }}%
                  </span>
                </td>
                <td class="py-2.5 px-4 text-center">
                  <button
                    type="button"
                    class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-bx-primary text-white hover:bg-bx-primary/90 transition-colors cursor-pointer"
                    @click="handleSelectAndClose(sec)"
                  >
                    فتح الرصد
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="text-center py-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-300 space-y-1">
        <CheckCircle2 class="w-8 h-8 mx-auto text-emerald-600" />
        <p class="font-bold text-sm">ممتاز! كافة الشعب مكتملة الرصد بنسبة 100%.</p>
        <p class="text-xs opacity-80">لا توجد أية نواقص في كشوفات درجات الطلاب للعام والفصل المختار.</p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="px-4 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
        @click="emit('close')"
      >
        إغلاق
      </button>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import type { SectionAuditProgressItem } from '../../api/grade-entry.api';

interface Props {
  isOpen: boolean;
  sections: SectionAuditProgressItem[];
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  sections: () => [],
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-section', section: SectionAuditProgressItem): void;
}>();

const completedSections = computed(() => {
  return props.sections.filter((s) => s.is_fully_graded && s.total_enrolled > 0);
});

const incompleteSections = computed(() => {
  return props.sections.filter((s) => s.missing_count > 0 && s.total_enrolled > 0);
});

const totalMissingStudents = computed(() => {
  return props.sections.reduce((sum, s) => sum + s.missing_count, 0);
});

const handleSelectAndClose = (sec: SectionAuditProgressItem) => {
  emit('select-section', sec);
  emit('close');
};
</script>
