<script setup lang="ts">
import { computed } from 'vue';
import { Calendar } from 'lucide-vue-next';
import type { PeriodSlot } from '../../api/period-slots.api';

interface Props {
  slots: PeriodSlot[];
}

const props = defineProps<Props>();

const sortedSlots = computed(() => {
  return [...props.slots].sort((a, b) => a.slot_number - b.slot_number);
});
</script>

<template>
  <div
    v-if="sortedSlots.length > 0"
    class="p-4 rounded-2xl bg-purple-500/[0.03] dark:bg-white/[0.02] border border-bx-border mb-6 space-y-3 shadow-2xs"
    dir="rtl"
  >
    <!-- Timeline Header -->
    <div class="flex items-center justify-between gap-2 border-b border-bx-divider pb-2.5">
      <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
        <Calendar class="w-4 h-4 text-bx-primary shrink-0" />
        <span>المخطط الزمني لليوم المدرسي</span>
      </div>
      <div class="flex items-center gap-2 text-[11px] text-bx-primary font-bold">
        <span class="w-2 h-2 rounded-full bg-bx-primary animate-pulse"></span>
        <span>{{ sortedSlots.length }} فترات مجدولة بتسلسل اليوم</span>
      </div>
    </div>

    <!-- Timeline Horizontal Scroll Track -->
    <div class="relative overflow-x-auto pb-1">
      <div class="flex items-stretch gap-3 min-w-max py-1">
        <div
          v-for="slot in sortedSlots"
          :key="slot.id"
          class="flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 min-w-[170px]"
          :class="[
            slot.is_break === 1
              ? 'bg-amber-500/[0.06] dark:bg-amber-500/[0.08] border-amber-300/80 dark:border-amber-400/40 text-amber-900 dark:text-amber-200'
              : 'bg-purple-500/[0.04] dark:bg-purple-500/[0.08] border-purple-300/70 dark:border-purple-400/30 text-bx-title',
          ]"
        >
          <!-- Top Slot Badge & Classification -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <span
              class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono"
              :class="[
                slot.is_break === 1
                  ? 'bg-amber-500 text-white'
                  : 'bg-bx-primary text-white',
              ]"
            >
              {{ slot.slot_number }}
            </span>
            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-bold"
              :class="[
                slot.is_break === 1
                  ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
                  : 'bg-purple-100 dark:bg-purple-900/50 text-bx-primary dark:text-purple-300',
              ]"
            >
              {{ slot.is_break === 1 ? 'فسحة / استراحة' : 'حصة دراسية' }}
            </span>
          </div>

          <!-- Slot Name -->
          <div class="font-black text-xs text-bx-title font-display mb-2 truncate" :title="slot.name">
            {{ slot.name }}
          </div>

          <!-- Start & End Time -->
          <div class="flex items-center justify-between text-[11px] text-bx-muted font-mono pt-2 border-t border-bx-divider">
            <span>{{ slot.start_time.substring(0, 5) }}</span>
            <span class="text-[10px] text-bx-muted/60">←</span>
            <span>{{ slot.end_time.substring(0, 5) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
