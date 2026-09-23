<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import HeaderUserDropdown from '../components/layout/HeaderUserDropdown.vue';
import ThemeToggle from '../components/layout/ThemeToggle.vue';
import HeaderNavDropdown, { type NavDropdownItem } from '../components/layout/HeaderNavDropdown.vue';
import {
  Users,
  ShieldCheck,
  Layers,
  GraduationCap,
  UserCheck,
  BookOpenCheck,
  HeartHandshake,
  School,
  Clock,
  Calendar,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Sparkles,
  Menu,
  X,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const route = useRoute();
const isMobileMenuOpen = ref(false);

// Coordinated single-dropdown state (opening one closes any previous)
const activeDropdown = ref<string | null>(null);

const handleToggleDropdown = (id: string) => {
  activeDropdown.value = activeDropdown.value === id ? null : id;
};

const closeAllDropdowns = () => {
  activeDropdown.value = null;
};

// Auto-close dropdowns on route changes
watch(() => route.path, () => {
  closeAllDropdowns();
  isMobileMenuOpen.value = false;
});

// Click outside of any nav dropdown
const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('[data-dropdown-container]')) {
    closeAllDropdowns();
  }
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    activeDropdown.value = null;
    isMobileMenuOpen.value = false;
  }
};

// Nav Groups (Option A)
const studentsGroup: NavDropdownItem[] = [
  {
    label: 'سجلات الطلاب',
    to: '/students',
    description: 'إدارة ملفات الطلاب، الأكواد الموحدة والتسكين الأكاديمي',
    icon: GraduationCap,
  },
  {
    label: 'تسكين وتسجيل الطلاب',
    to: '/student-enrollments',
    description: 'توزيع وتسكين الطلاب بالفصول والشعب وأرقام الجلوس',
    icon: School,
  },
  {
    label: 'أولياء الأمور والوصاية',
    to: '/guardians',
    description: 'ملفات أولياء الأمور، قيد الهواتف، وروابط كفالة الأبناء',
    icon: HeartHandshake,
  },
];

const academicGroup: NavDropdownItem[] = [
  {
    label: 'الهيكل الأكاديمي',
    to: '/academic-structure',
    description: 'المراحل الدراسية، الصفوف، الشعب، والمناهج والمواد',
    icon: Layers,
  },
  {
    label: 'الكادر التعليمي',
    to: '/teachers',
    description: 'ملفات المعلمين، الأكواد الوظيفية، والتخصصات التدريسية',
    icon: UserCheck,
  },
  {
    label: 'إسناد التدريس والنصاب',
    to: '/teaching-assignments',
    description: 'كشوفات توزيع المواد والشعب وفحص النصاب الأكاديمي',
    icon: BookOpenCheck,
  },
  {
    label: 'أوقات الحصص اليومية',
    to: '/period-slots',
    description: 'ضبط المخطط الزمني ومواعيد الحصص والفسح لليوم المدرسي',
    icon: Clock,
  },
  {
    label: 'جدول الحصص الأسبوعي',
    to: '/timetables',
    description: 'إدارة وتوزيع الحصص المدرسية، مصفوفة الشعب، وتدقيق الشواغر',
    icon: Calendar,
  },
];

const assessmentsGroup: NavDropdownItem[] = [
  {
    label: 'الواجبات المدرسية',
    to: '/homework',
    description: 'متابعة وإدارة التكاليف المنزلية والملازم ومواعيد التسليم',
    icon: BookOpen,
  },
  {
    label: 'الاختبارات والتطبيقات',
    to: '/quizzes',
    description: 'جدولة ونشر مواعيد الاختبارات والتطبيقات الشهرية والمرفقات',
    icon: CalendarCheck,
  },
  {
    label: 'جدول الامتحانات الرسمية',
    to: '/official-exams',
    description: 'جدولة ونشر مواعيد الامتحانات النصفية والنهائية ومرفقاتها',
    icon: CalendarDays,
  },
  {
    label: 'رصد الدرجات والصحائف',
    to: '/grade-entry',
    description: 'رصد درجات الطلاب حسب الصف والشعبة وإصدار الصحائف السنوية',
    icon: BookOpenCheck,
  },
  {
    label: 'الترحيل الأكاديمي والنتائج',
    to: '/promotions',
    description: 'كشوفات الدرجات، لوحة الشرف، تجميد السجلات، والترحيل السنوي',
    icon: Sparkles,
  },
];

const systemGroup: NavDropdownItem[] = [
  {
    label: 'المستخدمون والحسابات',
    to: '/users',
    description: 'إدارة الحسابات الموحدة، الصلاحيات وتفعيل الجلسات',
    icon: Users,
  },
  {
    label: 'سجلات التدقيق الأمني',
    to: '/audit-logs',
    description: 'رصد وتتبع كافة العمليات الحساسة والتغييرات بالنظام',
    icon: ShieldCheck,
  },
];

// Smart Header: Hide on scroll down, reveal on scroll up
const isHeaderVisible = ref(true);
let lastScrollY = 0;
const scrollThreshold = 8;

const handleScroll = () => {
  const currentScrollY = window.scrollY;

  // Always show header near the top of the page
  if (currentScrollY < 60) {
    isHeaderVisible.value = true;
    lastScrollY = currentScrollY;
    return;
  }

  // Scroll Down -> Hide
  if (currentScrollY > lastScrollY + scrollThreshold) {
    isHeaderVisible.value = false;
    isMobileMenuOpen.value = false;
    closeAllDropdowns();
  }
  // Scroll Up -> Show
  else if (currentScrollY < lastScrollY - scrollThreshold) {
    isHeaderVisible.value = true;
  }

  lastScrollY = currentScrollY;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div
    class="min-h-screen bg-[var(--bx-canvas)] text-bx-text flex flex-col font-sans antialiased selection:bg-bx-primary selection:text-white"
    :style="{ '--header-offset': isHeaderVisible ? '65px' : '0px' }"
    dir="rtl"
  >
    <!-- Main Navigation Header Bar (Auto-hiding Smart Header) -->
    <header
      class="sticky top-0 z-40 bg-[var(--bx-surface-solid)]/90 backdrop-blur-xl border-b border-bx-border transition-transform duration-300 ease-in-out"
      :class="isHeaderVisible ? 'translate-y-0' : '-translate-y-full shadow-none'"
    >
      <div class="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-6 lg:gap-8">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-bx-primary to-purple-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-bx-primary/20">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <h1 class="font-display font-black text-base sm:text-lg text-bx-title leading-tight">تقنية SMS</h1>
              <p class="text-[11px] text-bx-muted font-bold">بوابة الإدارة المدرسية الموحدة</p>
            </div>
          </div>

          <!-- Nav Items with Dropdowns (Single active dropdown coordination) -->
          <nav v-if="authStore.isAdmin" class="hidden md:flex items-center gap-2">
            <!-- 1. Students & Guardians -->
            <HeaderNavDropdown
              id="students"
              title="شؤون الطلاب والأسرة"
              :icon="GraduationCap"
              :items="studentsGroup"
              :is-open="activeDropdown === 'students'"
              @toggle="handleToggleDropdown('students')"
              @close="closeAllDropdowns"
            />

            <!-- 2. Academic Structure & Faculty -->
            <HeaderNavDropdown
              id="academic"
              title="الهيكل والتعليم"
              :icon="Layers"
              :items="academicGroup"
              :is-open="activeDropdown === 'academic'"
              @toggle="handleToggleDropdown('academic')"
              @close="closeAllDropdowns"
            />

            <!-- 3. Homework & Assessments / Exams -->
            <HeaderNavDropdown
              id="assessments"
              title="الواجبات والامتحانات"
              :icon="CalendarCheck"
              :items="assessmentsGroup"
              :is-open="activeDropdown === 'assessments'"
              @toggle="handleToggleDropdown('assessments')"
              @close="closeAllDropdowns"
            />

            <!-- 4. System & Governance -->
            <HeaderNavDropdown
              id="system"
              title="إدارة النظام والأمان"
              :icon="ShieldCheck"
              :items="systemGroup"
              :is-open="activeDropdown === 'system'"
              @toggle="handleToggleDropdown('system')"
              @close="closeAllDropdowns"
            />
          </nav>
        </div>

        <!-- Controls: Theme Toggle + User Dropdown + Mobile Menu Button -->
        <div class="flex items-center gap-2.5 sm:gap-3">
          <!-- Mobile Menu Toggle Button -->
          <button
            v-if="authStore.isAdmin"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 rounded-full border border-bx-border text-bx-muted hover:text-bx-title hover:bg-[var(--bx-pill)] transition-all cursor-pointer"
            :title="isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الرئيسية'"
          >
            <component :is="isMobileMenuOpen ? X : Menu" class="w-5 h-5" />
          </button>

          <ThemeToggle />
          <HeaderUserDropdown />
        </div>
      </div>

      <!-- Mobile Navigation Drawer / Dropdown Panel -->
      <div
        v-if="isMobileMenuOpen && authStore.isAdmin"
        class="md:hidden border-t border-[#B4AED8] dark:border-white/20 bg-white dark:bg-[#1E1F31] px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-in slide-in-from-top-2 duration-200"
      >
        <!-- Group 1 -->
        <div>
          <div class="text-[11px] font-black text-bx-primary flex items-center gap-1.5 mb-2 px-2">
            <GraduationCap class="w-3.5 h-3.5" />
            <span>شؤون الطلاب والأسرة</span>
          </div>
          <div class="grid grid-cols-1 gap-1.5">
            <RouterLink
              v-for="item in studentsGroup"
              :key="item.to"
              :to="item.to"
              @click="isMobileMenuOpen = false"
              active-class="!bg-bx-primary !text-white font-black shadow-sm"
              class="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-bx-title hover:bg-[var(--bx-pill)] transition-all"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-purple-500/20 bg-purple-500/10 text-bx-primary dark:border-white/10 dark:text-purple-300"
                style="border-radius: 50% !important;"
              >
                <component :is="item.icon" class="w-4 h-4 stroke-[2.2]" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold leading-tight">{{ item.label }}</div>
                <div class="text-[10px] text-bx-muted font-normal mt-0.5 truncate">{{ item.description }}</div>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Group 2 -->
        <div class="pt-2 border-t border-[#B4AED8]/40 dark:border-white/10">
          <div class="text-[11px] font-black text-bx-primary flex items-center gap-1.5 mb-2 px-2">
            <Layers class="w-3.5 h-3.5" />
            <span>الهيكل والتعليم</span>
          </div>
          <div class="grid grid-cols-1 gap-1.5">
            <RouterLink
              v-for="item in academicGroup"
              :key="item.to"
              :to="item.to"
              @click="isMobileMenuOpen = false"
              active-class="!bg-bx-primary !text-white font-black shadow-sm"
              class="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-bx-title hover:bg-[var(--bx-pill)] transition-all"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-purple-500/20 bg-purple-500/10 text-bx-primary dark:border-white/10 dark:text-purple-300"
                style="border-radius: 50% !important;"
              >
                <component :is="item.icon" class="w-4 h-4 stroke-[2.2]" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold leading-tight">{{ item.label }}</div>
                <div class="text-[10px] text-bx-muted font-normal mt-0.5 truncate">{{ item.description }}</div>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Group 3: Homework & Assessments / Exams -->
        <div class="pt-2 border-t border-[#B4AED8]/40 dark:border-white/10">
          <div class="text-[11px] font-black text-bx-primary flex items-center gap-1.5 mb-2 px-2">
            <CalendarCheck class="w-3.5 h-3.5" />
            <span>الواجبات والامتحانات</span>
          </div>
          <div class="grid grid-cols-1 gap-1.5">
            <RouterLink
              v-for="item in assessmentsGroup"
              :key="item.to"
              :to="item.to"
              @click="isMobileMenuOpen = false"
              active-class="!bg-bx-primary !text-white font-black shadow-sm"
              class="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-bx-title hover:bg-[var(--bx-pill)] transition-all"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-purple-500/20 bg-purple-500/10 text-bx-primary dark:border-white/10 dark:text-purple-300"
                style="border-radius: 50% !important;"
              >
                <component :is="item.icon" class="w-4 h-4 stroke-[2.2]" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold leading-tight">{{ item.label }}</div>
                <div class="text-[10px] text-bx-muted font-normal mt-0.5 truncate">{{ item.description }}</div>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Group 4 -->
        <div class="pt-2 border-t border-[#B4AED8]/40 dark:border-white/10">
          <div class="text-[11px] font-black text-bx-primary flex items-center gap-1.5 mb-2 px-2">
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>إدارة النظام والأمان</span>
          </div>
          <div class="grid grid-cols-1 gap-1.5">
            <RouterLink
              v-for="item in systemGroup"
              :key="item.to"
              :to="item.to"
              @click="isMobileMenuOpen = false"
              active-class="!bg-bx-primary !text-white font-black shadow-sm"
              class="flex items-center gap-3 p-2.5 rounded-2xl text-xs font-bold text-bx-title hover:bg-[var(--bx-pill)] transition-all"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-purple-500/20 bg-purple-500/10 text-bx-primary dark:border-white/10 dark:text-purple-300"
                style="border-radius: 50% !important;"
              >
                <component :is="item.icon" class="w-4 h-4 stroke-[2.2]" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold leading-tight">{{ item.label }}</div>
                <div class="text-[10px] text-bx-muted font-normal mt-0.5 truncate">{{ item.description }}</div>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main View Content -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <router-view />
    </main>

    <!-- Global Footer -->
    <footer class="border-t border-bx-border py-4 text-center text-xs text-bx-muted font-bold bg-[var(--bx-surface-solid)]">
      &copy; 2026 Taqniya-SMS — نظام إدارة المدارس المتكامل (Taqniya Framework Design System v3.0)
    </footer>
  </div>
</template>
