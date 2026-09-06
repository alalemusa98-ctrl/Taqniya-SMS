<script setup lang="ts">
import { ref } from 'vue';
import { Calendar, BookOpen, GraduationCap, Sparkles } from 'lucide-vue-next';
import AcademicYearsTab from '../components/academic/AcademicYearsTab.vue';
import AcademicTermsTab from '../components/academic/AcademicTermsTab.vue';
import AcademicStagesTab from '../components/academic/AcademicStagesTab.vue';

type TabKey = 'years' | 'terms' | 'stages';

const activeTab = ref<TabKey>('years');

const tabs = [
  {
    key: 'years' as TabKey,
    label: 'السنوات الدراسية',
    sublabel: 'التقويم، والتواريخ، وتفعيل السنة النشطة',
    icon: Calendar,
  },
  {
    key: 'terms' as TabKey,
    label: 'كتالوج الفصول',
    sublabel: 'الفصول والأنصاف المعتمدة للنظام',
    icon: BookOpen,
  },
  {
    key: 'stages' as TabKey,
    label: 'المراحل التعليمية',
    sublabel: 'التسلسل الهرمي للمراحل والصفوف',
    icon: GraduationCap,
  },
];
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-300">
    <!-- Page Header Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-bx-primary via-indigo-600 to-purple-600 p-8 text-white shadow-xl shadow-bx-primary/10">
      <div class="relative z-10 max-w-3xl space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black tracking-wide border border-white/20">
          <Sparkles class="w-3.5 h-3.5" />
          <span>المرحلة 02-A | الهيكل والتقويم الأكاديمي</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-black font-display tracking-tight">
          إدارة الهيكل الأكاديمي والمراحل
        </h2>
        <p class="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
          المرتكز المركزي لضبط التقويم السنوي للمدرسة، والفصول الدراسية المعتمدة، وهيكلية المراحل التعليمية مع فرض القواعد الصارمة لمنع تضارب البيانات.
        </p>
      </div>

      <!-- Decorative Background Blur Circles -->
      <div class="absolute -left-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute right-1/3 -top-12 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none"></div>
    </div>

    <!-- Navigation Tabs Bar -->
    <div class="flex flex-col sm:flex-row gap-3 p-1.5 bg-[var(--bx-surface)] border border-bx-border rounded-2xl">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex-1 flex items-center gap-3.5 p-3.5 rounded-xl transition-all text-right cursor-pointer"
        :class="
          activeTab === tab.key
            ? 'bg-bx-primary text-white shadow-lg shadow-bx-primary/20 scale-[1.01]'
            : 'text-bx-muted hover:text-bx-title hover:bg-[var(--bx-surface-solid)]/60'
        "
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-bx-primary/10 text-bx-primary'"
        >
          <component :is="tab.icon" class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-black leading-tight">{{ tab.label }}</div>
          <div
            class="text-[11px] mt-0.5"
            :class="activeTab === tab.key ? 'text-white/80' : 'text-bx-muted'"
          >
            {{ tab.sublabel }}
          </div>
        </div>
      </button>
    </div>

    <!-- Tab View Content -->
    <div class="min-h-[450px]">
      <AcademicYearsTab v-if="activeTab === 'years'" />
      <AcademicTermsTab v-else-if="activeTab === 'terms'" />
      <AcademicStagesTab v-else-if="activeTab === 'stages'" />
    </div>
  </div>
</template>
