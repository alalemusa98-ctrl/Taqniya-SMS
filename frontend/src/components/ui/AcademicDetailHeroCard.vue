<script setup lang="ts">
import { computed } from 'vue';
import {
  BookOpen,
  School,
  UserCheck,
  Clock,
  GraduationCap,
} from 'lucide-vue-next';

const props = defineProps<{
  type: 'quiz' | 'homework';
  title: string;
  subjectName: string;
  className?: string;
  sectionName?: string;
  teacherName: string;
  recordId: number;
  targetDate?: string;
  status?: 'active' | 'expired' | string;
}>();

// Dynamic Countdown and Timing Status calculation
const countdownInfo = computed(() => {
  if (!props.targetDate) {
    if (props.status === 'expired') {
      return { label: 'منتهي الصلاحية', isUrgent: false, isPast: true };
    }
    return { label: 'ساري للتسليم', isUrgent: false, isPast: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tDate = new Date(props.targetDate);
  tDate.setHours(0, 0, 0, 0);

  const diffTime = tDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const pastDays = Math.abs(diffDays);
    const dayText = pastDays === 1 ? 'يوم واحد' : pastDays === 2 ? 'يومين' : `${pastDays} أيام`;
    return {
      label: `منتهي (منذ ${dayText})`,
      isUrgent: false,
      isPast: true,
    };
  } else if (diffDays === 0) {
    return {
      label: props.type === 'quiz' ? 'موعد الاختبار اليوم!' : 'مستحق اليوم!',
      isUrgent: true,
      isPast: false,
    };
  } else if (diffDays === 1) {
    return {
      label: props.type === 'quiz' ? 'موعد الاختبار غداً' : 'مستحق غداً',
      isUrgent: true,
      isPast: false,
    };
  } else if (diffDays === 2) {
    return {
      label: 'متبقي يومان',
      isUrgent: false,
      isPast: false,
    };
  } else {
    return {
      label: `متبقي ${diffDays} أيام`,
      isUrgent: false,
      isPast: false,
    };
  }
});
</script>

<template>
  <div
    class="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-[#B4AED8] dark:border-white/[0.1] bg-gradient-to-br from-purple-500/[0.08] via-purple-500/[0.03] to-[var(--bx-surface-solid)] shadow-sm space-y-4 text-start font-sans"
    dir="rtl"
  >
    <!-- Ambient Glow Effect -->
    <div class="absolute -top-12 -left-12 w-36 h-36 bg-bx-primary/10 rounded-full blur-2xl pointer-events-none"></div>

    <!-- 1. Top Meta Row: Subject & Class Hierarchy (No Badges) + Countdown Status Badge -->
    <div class="flex items-center justify-between gap-3 flex-wrap relative z-10">
      <!-- Subject, Class, Section (Clean Typography) -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="inline-flex items-center gap-1.5 text-xs font-black text-bx-primary">
          <component :is="type === 'quiz' ? GraduationCap : BookOpen" class="w-4 h-4 text-bx-primary" />
          <span>{{ subjectName }}</span>
        </span>

        <span v-if="className || sectionName" class="text-[#B4AED8] dark:text-white/20 font-light">/</span>

        <span v-if="className || sectionName" class="inline-flex items-center gap-1.5 text-xs font-bold text-bx-muted">
          <School class="w-3.5 h-3.5 text-bx-muted" />
          <span v-if="className">{{ className }}</span>
          <span v-if="className && sectionName" class="text-bx-muted/60">•</span>
          <span v-if="sectionName">{{ sectionName }}</span>
        </span>
      </div>

      <!-- Countdown / Timing Status Badge -->
      <span
        class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border shadow-xs"
        :class="
          countdownInfo.isPast
            ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20'
            : countdownInfo.isUrgent
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
        "
      >
        <Clock class="w-3.5 h-3.5" />
        <span>{{ countdownInfo.label }}</span>
      </span>
    </div>

    <!-- Visual Subtle Gradient Divider 1 -->
    <div class="h-px w-full bg-gradient-to-r from-transparent via-[#B4AED8]/60 dark:via-white/10 to-transparent"></div>

    <!-- 2. Main Content Showcase: Avatar Icon + Title -->
    <div class="flex items-start gap-4 pt-1 relative z-10">
      <!-- Icon Avatar -->
      <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/15 text-bx-primary border border-purple-500/25 flex items-center justify-center shrink-0 shadow-xs">
        <component :is="type === 'quiz' ? GraduationCap : BookOpen" class="w-7 h-7 stroke-[1.8]" />
      </div>

      <!-- Title & Label -->
      <div class="min-w-0 flex-1 space-y-1">
        <span class="text-[11px] font-bold text-bx-muted block">
          {{ type === 'quiz' ? 'عنوان الاختبار / التطبيق الدوري:' : 'عنوان الواجب / النشاط المنزلي:' }}
        </span>
        <h2 class="text-base sm:text-xl font-black text-bx-title font-display leading-snug">
          {{ title }}
        </h2>
      </div>
    </div>

    <!-- 3. Visual Subtle Divider 2 & Supervisor Meta Footer -->
    <div class="pt-3 border-t border-[#B4AED8]/40 dark:border-white/[0.08] flex items-center justify-between gap-3 text-xs flex-wrap relative z-10">
      <div class="inline-flex items-center gap-2 bg-purple-500/5 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-[#B4AED8]/40 dark:border-white/[0.06]">
        <UserCheck class="w-3.5 h-3.5 text-bx-primary" />
        <span class="text-bx-muted">{{ type === 'quiz' ? 'المعلم المشرف:' : 'المعلم المسؤول:' }}</span>
        <span class="font-bold text-bx-title">{{ teacherName }}</span>
      </div>

      <div class="inline-flex items-center gap-1.5 font-mono text-[11px] text-bx-muted bg-[var(--bx-surface-solid)] px-2.5 py-1 rounded-lg border border-[#B4AED8]/40 dark:border-white/[0.06] shadow-2xs">
        <span class="text-bx-primary font-bold">#</span>
        <span>{{ type === 'quiz' ? 'سجل رقم' : 'تكليف رقم' }} {{ recordId }}</span>
      </div>
    </div>
  </div>
</template>
