<script setup lang="ts">
import { ref, computed } from 'vue';
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

type PhaseKey = 'phase_c' | 'phase_b' | 'phase_a';

const activePhase = ref<PhaseKey>('phase_c');
const activeTab = ref<TabKey>('class_terms');

const phaseGroups = [
  {
    key: 'phase_c' as PhaseKey,
    title: 'فترات الصفوف والمناهج',
    code: '02-C',
    defaultTab: 'class_terms' as TabKey,
    tabs: [
      { key: 'class_terms' as TabKey, label: 'فترات الصفوف', icon: CalendarDays },
      { key: 'class_sections' as TabKey, label: 'تسكين الشُعب', icon: Grid },
      { key: 'class_subjects' as TabKey, label: 'مناهج الصفوف', icon: Award },
    ],
  },
  {
    key: 'phase_b' as PhaseKey,
    title: 'الصفوف والكتالوج العام',
    code: '02-B',
    defaultTab: 'classes' as TabKey,
    tabs: [
      { key: 'classes' as TabKey, label: 'الصفوف الدراسية', icon: Layers },
      { key: 'sections' as TabKey, label: 'بنك الشُعب', icon: Users2 },
      { key: 'subjects' as TabKey, label: 'بنك المواد', icon: BookOpenCheck },
    ],
  },
  {
    key: 'phase_a' as PhaseKey,
    title: 'التقويم والأساس الأكاديمي',
    code: '02-A',
    defaultTab: 'years' as TabKey,
    tabs: [
      { key: 'years' as TabKey, label: 'السنوات الدراسية', icon: Calendar },
      { key: 'terms' as TabKey, label: 'الفصول الدراسية', icon: BookOpen },
      { key: 'stages' as TabKey, label: 'المراحل التعليمية', icon: GraduationCap },
    ],
  },
];

const currentPhaseTabs = computed(() => {
  const current = phaseGroups.find((g) => g.key === activePhase.value);
  return current?.tabs || [];
});

function selectPhase(phase: (typeof phaseGroups)[0]) {
  activePhase.value = phase.key;
  activeTab.value = phase.defaultTab;
}
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

    <!-- 3 Phase Selector Buttons (Top Level) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-[var(--bx-surface-solid)] border border-bx-border rounded-2xl shadow-xs">
      <button
        v-for="phase in phaseGroups"
        :key="phase.key"
        @click="selectPhase(phase)"
        class="flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
        :class="
          activePhase === phase.key
            ? 'bg-bx-primary text-white shadow-sm'
            : 'text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)]'
        "
      >
        <span>{{ phase.title }}</span>
        <span
          class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black"
          :class="activePhase === phase.key ? 'bg-white/20 text-white' : 'bg-bx-primary/10 text-bx-primary'"
        >
          {{ phase.code }}
        </span>
      </button>
    </div>

    <!-- Active Phase Sub-Tabs -->
    <div class="flex flex-wrap gap-2 p-1.5 bg-[var(--bx-surface-solid)] border border-bx-border rounded-xl shadow-xs">
      <button
        v-for="tab in currentPhaseTabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold cursor-pointer"
        :class="
          activeTab === tab.key
            ? 'bg-[var(--bx-pill)] text-bx-primary border border-bx-primary/30 shadow-xs'
            : 'text-bx-muted hover:text-bx-title hover:bg-[var(--bx-row-hover)] border border-transparent'
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
