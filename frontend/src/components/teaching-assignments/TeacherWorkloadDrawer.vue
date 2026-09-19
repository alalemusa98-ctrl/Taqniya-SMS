<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  GraduationCap,
  Users,
  School,
  Layers,
  BookOpen,
  Plus,
  Loader2,
} from 'lucide-vue-next';
import {
  teachingAssignmentsApi,
  type TeacherWorkloadItem,
} from '../../api/teaching-assignments.api';
import type { Teacher } from '../../api/teachers.api';
import { useToast } from '../../composables/useToast';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';

interface GroupedClassWorkload {
  class_id: number;
  class_name: string;
  items: TeacherWorkloadItem[];
}

const props = defineProps<{
  isOpen: boolean;
  teacher: Teacher | null;
  academicYearId: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'assign-more', teacherId: number): void;
}>();

const toast = useToast();
const teacherWorkload = ref<TeacherWorkloadItem[]>([]);
const loadingWorkload = ref(false);

async function fetchWorkload() {
  if (!props.teacher) return;
  loadingWorkload.value = true;
  try {
    const res = await teachingAssignmentsApi.getTeacherAssignments(props.teacher.id, {
      academic_year_id: props.academicYearId || undefined,
    });
    teacherWorkload.value = res.data.data;
  } catch (err: any) {
    toast.error('تعذر جلب النصاب التدريسي للمعلم.');
  } finally {
    loadingWorkload.value = false;
  }
}

watch(
  () => [props.isOpen, props.teacher?.id],
  ([open]) => {
    if (open && props.teacher) {
      fetchWorkload();
    } else {
      teacherWorkload.value = [];
    }
  },
  { immediate: true },
);

// Workload Stats Computed
const workloadStats = computed(() => {
  const items = teacherWorkload.value;
  const totalAssignments = items.length;
  const uniqueSubjects = new Set(items.map((i) => i.subject_id)).size;
  const uniqueSections = new Set(items.map((i) => i.class_section_id)).size;
  const uniqueClasses = new Set(items.map((i) => i.class_id)).size;
  return {
    totalAssignments,
    uniqueSubjects,
    uniqueSections,
    uniqueClasses,
  };
});

// Group Workload by Class
const groupedTeacherWorkload = computed<GroupedClassWorkload[]>(() => {
  const map = new Map<number, GroupedClassWorkload>();

  for (const item of teacherWorkload.value) {
    if (!map.has(item.class_id)) {
      map.set(item.class_id, {
        class_id: item.class_id,
        class_name: item.class_name,
        items: [],
      });
    }
    map.get(item.class_id)!.items.push(item);
  }

  return Array.from(map.values());
});
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="teacher ? `النصاب التدريسي: ${teacher.full_name}` : 'النصاب التدريسي'"
    :subtitle="teacher ? `كشف الشعب والمناهج المسندة للمعلم (${teacher.user_code})` : ''"
    :icon="GraduationCap"
    max-width="max-w-[560px]"
    @close="emit('close')"
  >
    <!-- 1. Loading State -->
    <div v-if="loadingWorkload" class="py-16 text-center space-y-3">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-bx-primary" />
      <span class="text-xs font-bold text-bx-muted block">جاري استرجاع النصاب التدريسي للمعلم...</span>
    </div>

    <!-- 2. Empty State -->
    <div
      v-else-if="teacherWorkload.length === 0"
      class="py-14 text-center space-y-3 rounded-2xl border border-dashed border-bx-border bg-bx-surface p-8"
    >
      <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center mx-auto shadow-xs">
        <BookOpen class="w-7 h-7" />
      </div>
      <h4 class="text-sm font-black font-display text-bx-title">لا توجد مهام تدريسية مسندة</h4>
      <p class="text-xs text-bx-muted max-w-xs mx-auto leading-relaxed">
        لم يتم تسكين أو إسناد أي مواد وشعب دراسية لهذا المعلم في العام الدراسي المحدد حتى الآن.
      </p>
      <button
        v-if="teacher"
        type="button"
        @click="emit('assign-more', teacher.id)"
        class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>إسناد مادة جديدة للمعلم</span>
      </button>
    </div>

    <!-- 3. Rich Workload State -->
    <div v-else class="space-y-4">
      <!-- 3.1 Teacher Overview Card -->
      <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold border border-purple-500/20 shrink-0 shadow-2xs">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-black text-sm text-bx-title font-display">
                {{ teacher?.full_name }}
              </h4>
              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                <span class="font-mono text-[11px] font-bold text-bx-muted px-2.5 py-0.5 rounded-full border border-bx-border bg-bx-surface">
                  {{ teacher?.user_code }}#
                </span>
                <span
                  v-if="teacher?.specialization"
                  class="text-[11px] font-bold text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20"
                >
                  {{ teacher?.specialization }}
                </span>
              </div>
            </div>
          </div>

          <!-- Status Badge -->
          <span
            v-if="teacher"
            class="text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0"
            :class="teacher.is_active === 1
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'"
          >
            {{ teacher.is_active === 1 ? 'معلم نشط' : 'معطل' }}
          </span>
        </div>

        <!-- Micro KPI Stats Ribbon -->
        <div class="grid grid-cols-3 gap-2.5 pt-2 border-t border-bx-divider">
          <div class="p-2.5 rounded-xl bg-purple-500/[0.04] dark:bg-white/[0.02] border border-bx-divider text-center">
            <span class="text-[10px] text-bx-muted font-bold block">إجمالي الإسنادات</span>
            <span class="text-sm font-black font-mono text-bx-primary">{{ workloadStats.totalAssignments }}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-emerald-500/[0.04] dark:bg-white/[0.02] border border-bx-divider text-center">
            <span class="text-[10px] text-bx-muted font-bold block">المواد الدراسية</span>
            <span class="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{{ workloadStats.uniqueSubjects }}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-blue-500/[0.04] dark:bg-white/[0.02] border border-bx-divider text-center">
            <span class="text-[10px] text-bx-muted font-bold block">الشعب المسندة</span>
            <span class="text-sm font-black font-mono text-blue-600 dark:text-blue-400">{{ workloadStats.uniqueSections }}</span>
          </div>
        </div>
      </div>

      <!-- 3.2 Section Header -->
      <div class="flex items-center justify-between px-1 pt-1">
        <div class="flex items-center gap-2 text-xs font-bold text-bx-title">
          <Layers class="w-4 h-4 text-bx-primary" />
          <span>النصاب موزّع حسب الفصول والشعب</span>
        </div>
        <span class="text-[11px] text-bx-muted font-mono font-bold">
          {{ groupedTeacherWorkload.length }} فصول • {{ teacherWorkload.length }} مساق
        </span>
      </div>

      <!-- 3.3 Workload Grouped by Class Cards -->
      <div class="space-y-3.5">
        <div
          v-for="grp in groupedTeacherWorkload"
          :key="grp.class_id"
          class="rounded-2xl border border-bx-border bg-bx-surface overflow-hidden shadow-xs"
        >
          <!-- Class Header Ribbon -->
          <div class="bg-purple-500/[0.05] dark:bg-white/[0.03] px-4 py-3 border-b border-bx-divider flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-bold">
                <School class="w-4 h-4" />
              </div>
              <h5 class="font-black text-xs sm:text-sm text-bx-title font-display">
                {{ grp.class_name }}
              </h5>
            </div>
            <span class="text-[11px] font-bold text-bx-muted px-2.5 py-0.5 rounded-full border border-bx-divider bg-bx-surface">
              {{ grp.items.length }} {{ grp.items.length === 1 ? 'مادة / شعبة' : 'مواد وشعب' }}
            </span>
          </div>

          <!-- Subject Rows for this Class -->
          <div class="p-3 divide-y divide-bx-divider">
            <div
              v-for="(item, idx) in grp.items"
              :key="item.id"
              class="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group"
            >
              <!-- Subject Info -->
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-lg bg-purple-500/10 text-bx-primary flex items-center justify-center font-mono font-bold text-[11px] shrink-0 group-hover:scale-105 transition-transform">
                  {{ idx + 1 }}
                </span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-black text-xs text-bx-title group-hover:text-bx-primary transition-colors">
                      {{ item.subject_name }}
                    </span>
                    <span
                      v-if="item.subject_code"
                      class="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md bg-purple-500/[0.06] border border-purple-500/20"
                    >
                      {{ item.subject_code }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Section Badge -->
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[10px] text-bx-muted font-bold hidden sm:inline">الشعبة:</span>
                <span class="px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-500/30 dark:border-purple-400/30 shadow-2xs">
                  {{ item.section_name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Footer -->
    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="px-5 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
      >
        إغلاق
      </button>
      <button
        v-if="teacher"
        type="button"
        @click="emit('assign-more', teacher.id)"
        class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>إسناد مادة أخرى</span>
      </button>
    </template>
  </TaqniyaDrawer>
</template>
