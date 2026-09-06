<script setup lang="ts">
import { ref } from 'vue';
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Layers,
  Users2,
  BookOpenCheck,
  Sparkles,
} from 'lucide-vue-next';
import AcademicYearsTab from '../components/academic/AcademicYearsTab.vue';
import AcademicTermsTab from '../components/academic/AcademicTermsTab.vue';
import AcademicStagesTab from '../components/academic/AcademicStagesTab.vue';
import AcademicClassesTab from '../components/academic/AcademicClassesTab.vue';
import AcademicSectionsTab from '../components/academic/AcademicSectionsTab.vue';
import AcademicSubjectsTab from '../components/academic/AcademicSubjectsTab.vue';

type TabKey = 'years' | 'terms' | 'stages' | 'classes' | 'sections' | 'subjects';

const activeTab = ref<TabKey>('classes');

const tabs = [
  {
    key: 'classes' as TabKey,
    label: 'الصفوف الدراسية',
    sublabel: 'الصفوف والمستويات الرقمية بالمراحل',
    icon: Layers,
  },
  {
    key: 'sections' as TabKey,
    label: 'بنك الشُعب العامة',
    sublabel: 'كتالوج الشعب المعتمدة بالمدرسة',
    icon: Users2,
  },
  {
    key: 'subjects' as TabKey,
    label: 'بنك المواد والمناهج',
    sublabel: 'المواد العامة والأكواد الرمزية',
    icon: BookOpenCheck,
  },
  {
    key: 'stages' as TabKey,
    label: 'المراحل التعليمية',
    sublabel: 'التسلسل الهرمي للمراحل الدراسية',
    icon: GraduationCap,
  },
  {
    key: 'years' as TabKey,
    label: 'السنوات الدراسية',
    sublabel: 'التقويم، والتواريخ، وتفعيل السنة',
    icon: Calendar,
  },
  {
    key: 'terms' as TabKey,
    label: 'كتالوج الفصول',
    sublabel: 'الفصول والأنصاف المعتمدة للنظام',
    icon: BookOpen,
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
          <span>المرحلة 02: الهيكل الأكاديمي والصفوف والمناهج المدرسية</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-black font-display tracking-tight">
          إدارة البنية التعليمية والمقررات
        </h2>
        <p class="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
          المنظومة المركزية المتكاملة لضبط التقويم السنوي، الفصول والأنصاف، المراحل، الصفوف المدرسية، كتالوج الشُعب العامة، وبنك المواد التعليمية المعتمدة.
        </p>
      </div>

      <!-- Decorative Background Blur Circles -->
      <div class="absolute -left-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute right-1/3 -top-12 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none"></div>
    </div>

    <!-- Navigation Tabs Bar (Grid on Large Screens, Responsive Flow) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 bg-[var(--bx-surface)] border border-bx-border rounded-2xl">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex flex-col items-start gap-2 p-3 rounded-xl transition-all text-right cursor-pointer"
        :class="
          activeTab === tab.key
            ? 'bg-bx-primary text-white shadow-lg shadow-bx-primary/20 scale-[1.01]'
            : 'text-bx-muted hover:text-bx-title hover:bg-[var(--bx-surface-solid)]/60'
        "
      >
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-bx-primary/10 text-bx-primary'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
        </div>
        <div>
          <div class="text-xs font-black leading-tight">{{ tab.label }}</div>
          <div
            class="text-[10px] mt-0.5 line-clamp-1"
            :class="activeTab === tab.key ? 'text-white/80' : 'text-bx-muted'"
          >
            {{ tab.sublabel }}
          </div>
        </div>
      </button>
    </div>

    <!-- Tab View Content -->
    <div class="min-h-[450px]">
      <AcademicClassesTab v-if="activeTab === 'classes'" />
      <AcademicSectionsTab v-else-if="activeTab === 'sections'" />
      <AcademicSubjectsTab v-else-if="activeTab === 'subjects'" />
      <AcademicStagesTab v-else-if="activeTab === 'stages'" />
      <AcademicYearsTab v-else-if="activeTab === 'years'" />
      <AcademicTermsTab v-else-if="activeTab === 'terms'" />
    </div>
  </div>
</template>
