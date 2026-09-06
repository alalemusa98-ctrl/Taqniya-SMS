<script setup lang="ts">
import { ref } from 'vue';
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Layers,
  Users2,
  BookOpenCheck,
  CalendarDays,
  Grid,
  Award,
} from 'lucide-vue-next';
import AcademicYearsTab from '../components/academic/AcademicYearsTab.vue';
import AcademicTermsTab from '../components/academic/AcademicTermsTab.vue';
import AcademicStagesTab from '../components/academic/AcademicStagesTab.vue';
import AcademicClassesTab from '../components/academic/AcademicClassesTab.vue';
import AcademicSectionsTab from '../components/academic/AcademicSectionsTab.vue';
import AcademicSubjectsTab from '../components/academic/AcademicSubjectsTab.vue';
import ClassTermsTab from '../components/academic/ClassTermsTab.vue';
import ClassSectionsTab from '../components/academic/ClassSectionsTab.vue';
import ClassSubjectsTab from '../components/academic/ClassSubjectsTab.vue';

type TabKey =
  | 'classes'
  | 'sections'
  | 'subjects'
  | 'class_terms'
  | 'class_sections'
  | 'class_subjects'
  | 'stages'
  | 'years'
  | 'terms';

const activeTab = ref<TabKey>('class_terms');

const tabs = [
  {
    key: 'class_terms' as TabKey,
    label: 'فترات الصفوف',
    icon: CalendarDays,
  },
  {
    key: 'class_sections' as TabKey,
    label: 'تسكين الشُعب',
    icon: Grid,
  },
  {
    key: 'class_subjects' as TabKey,
    label: 'مناهج الصفوف',
    icon: Award,
  },
  {
    key: 'classes' as TabKey,
    label: 'الصفوف الدراسية',
    icon: Layers,
  },
  {
    key: 'sections' as TabKey,
    label: 'بنك الشُعب',
    icon: Users2,
  },
  {
    key: 'subjects' as TabKey,
    label: 'بنك المواد',
    icon: BookOpenCheck,
  },
  {
    key: 'stages' as TabKey,
    label: 'المراحل التعليمية',
    icon: GraduationCap,
  },
  {
    key: 'years' as TabKey,
    label: 'السنوات الدراسية',
    icon: Calendar,
  },
  {
    key: 'terms' as TabKey,
    label: 'الفصول الدراسية',
    icon: BookOpen,
  },
];
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-300">
    <!-- Page Header Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-bx-primary via-indigo-600 to-purple-600 p-7 text-white shadow-lg shadow-bx-primary/10">
      <div class="relative z-10 max-w-3xl space-y-2">
        <h2 class="text-2xl sm:text-3xl font-black font-display tracking-tight">
          الهيكل الأكاديمي والتعليمي
        </h2>
        <p class="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
          إدارة المراحل والصفوف الدراسية، الفصول والتقويم السنوي، وتوزيع الشُعب والمناهج التعليمية.
        </p>
      </div>

      <!-- Decorative Background Blur Circles -->
      <div class="absolute -left-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute right-1/3 -top-12 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none"></div>
    </div>

    <!-- Navigation Tabs Bar -->
    <div class="flex flex-wrap gap-2 p-2 bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl shadow-xs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer"
        :class="
          activeTab === tab.key
            ? 'bg-bx-primary text-white shadow-sm'
            : 'text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)]'
        "
      >
        <component :is="tab.icon" class="w-4 h-4 shrink-0" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab View Content -->
    <div class="min-h-[450px]">
      <ClassTermsTab v-if="activeTab === 'class_terms'" />
      <ClassSectionsTab v-else-if="activeTab === 'class_sections'" />
      <ClassSubjectsTab v-else-if="activeTab === 'class_subjects'" />
      <AcademicClassesTab v-else-if="activeTab === 'classes'" />
      <AcademicSectionsTab v-else-if="activeTab === 'sections'" />
      <AcademicSubjectsTab v-else-if="activeTab === 'subjects'" />
      <AcademicStagesTab v-else-if="activeTab === 'stages'" />
      <AcademicYearsTab v-else-if="activeTab === 'years'" />
      <AcademicTermsTab v-else-if="activeTab === 'terms'" />
    </div>
  </div>
</template>
