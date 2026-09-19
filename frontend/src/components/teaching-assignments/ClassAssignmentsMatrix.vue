<script setup lang="ts">
import { computed } from 'vue';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  UserCheck,
  AlertCircle,
} from 'lucide-vue-next';
import type { AssignmentItem } from '../../api/teaching-assignments.api';
import TaqniyaGroupedTable, {
  type TableGroup,
  type GroupedTableColumn,
} from '../ui/TaqniyaGroupedTable.vue';

export interface ClassMatrixSubjectRow {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  assignmentsBySection: Record<number, AssignmentItem>;
  assignedCount: number;
  totalSections: number;
}

export interface ClassMatrixGroup {
  class_id: number;
  class_name: string;
  sections: {
    class_section_id: number;
    section_name: string;
  }[];
  subjects: ClassMatrixSubjectRow[];
  totalAssignmentsCount: number;
}

const props = defineProps<{
  groups: ClassMatrixGroup[];
  appliedTeacherFilter: string | number;
}>();

const emit = defineEmits<{
  (e: 'create', classId?: number, sectionId?: number, subjectId?: number): void;
  (e: 'edit', assignment: AssignmentItem, classId: number, sectionId: number): void;
  (e: 'delete', assignment: AssignmentItem): void;
  (e: 'view-workload', teacherId: number): void;
}>();

// Helper to extract sectionId from column key format "section_123"
function getSectionId(colKey: string): number {
  return Number(colKey.replace('section_', ''));
}

// Convert ClassMatrixGroups into TaqniyaGroupedTable compatible TableGroup[]
const tableGroups = computed<TableGroup[]>(() => {
  return (props.groups || []).map((grp) => {
    const hasSections = (grp.sections || []).length > 0;

    const columns: GroupedTableColumn[] = [
      {
        key: 'index',
        label: '#',
        width: '3.5rem',
        align: 'start',
        headerClass: "font-['Alexandria',sans-serif] w-12",
      },
      {
        key: 'subject',
        label: 'المادة الدراسية',
        minWidth: '190px',
        align: 'start',
        icon: BookOpen,
      },
      ...(grp.sections || []).map((sec) => ({
        key: `section_${sec.class_section_id}`,
        label: sec.section_name,
        minWidth: '195px',
        align: 'center' as const,
      })),
      {
        key: 'coverage',
        label: 'نسبة التغطية',
        width: '6.5rem',
        minWidth: '6.5rem',
        align: 'center' as const,
      },
    ];

    return {
      id: grp.class_id,
      title: grp.class_name,
      icon: GraduationCap,
      badge: `${grp.sections?.length || 0} شُعب دراسية`,
      subtitle: `${grp.totalAssignmentsCount} إسنادات مسجلة`,
      columns,
      // If no sections exist for class, treat items as empty to show custom no-sections empty alert
      items: hasSections
        ? (grp.subjects || []).map((s, idx) => ({
            ...s,
            index: idx + 1,
          }))
        : [],
      sections: grp.sections || [],
    };
  });
});
</script>

<template>
  <div dir="rtl">
    <!-- Reusable Shared TaqniyaGroupedTable -->
    <TaqniyaGroupedTable
      :groups="tableGroups"
      empty-title="لا توجد إسنادات تدريس مسجلة تطابق محددات البحث"
      empty-subtitle="يمكنك البدء بتكليف المعلمين وتوزيع المواد على الشُعب الدراسية للعام الدراسي المعتمد."
      group-empty-text="لا توجد مواد مسندة لهذا الصف بعد."
      group-action-text="إسناد مادة لهذا الصف"
      :group-action-icon="Plus"
      @group-action="emit('create', Number($event.id))"
    >
      <!-- Custom Class Header: Title with Sections & Assignments Badges -->
      <template #group-header="{ group }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-400/40 flex items-center justify-center text-bx-primary dark:text-purple-300 shrink-0">
            <GraduationCap class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-black text-sm text-bx-title font-display block leading-tight">{{ group.title }}</h3>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] font-semibold text-bx-muted px-2 py-0.5 rounded-full border border-[#B4AED8]/60 dark:border-white/10 bg-[var(--bx-surface-solid)]">
                {{ group.badge }}
              </span>
              <span class="text-[10px] font-bold text-bx-primary px-2 py-0.5 rounded-full border border-purple-500/30 dark:border-purple-400/30 bg-purple-500/10">
                {{ group.subtitle }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- Custom Header Slot for Dynamic Sections & Standard Columns -->
      <template #header="{ column }">
        <div v-if="column.key.startsWith('section_')" class="inline-flex items-center justify-center gap-1.5 font-bold text-bx-title text-[11px]">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          <span>{{ column.label }}</span>
        </div>
        <div v-else class="flex items-center gap-1.5" :class="{ 'justify-center': column.align === 'center' }">
          <component :is="column.icon" v-if="column.icon" class="w-3 h-3 text-bx-primary" />
          <span>{{ column.label }}</span>
        </div>
      </template>

      <!-- Cell: Index -->
      <template #cell-index="{ row }">
        <span class="font-['Alexandria',sans-serif] font-bold text-bx-muted text-[10px] whitespace-nowrap">
          {{ row.index }}
        </span>
      </template>

      <!-- Cell: Subject Name & Code -->
      <template #cell-subject="{ row }">
        <span class="font-black text-[11px] text-bx-title block leading-tight">
          {{ row.subject_name }}
        </span>
        <span v-if="row.subject_code" class="text-[9px] font-mono text-bx-muted">
          {{ row.subject_code }}
        </span>
      </template>

      <!-- Cell: Dynamic Section Columns (Teacher Capsule or Assign Button) -->
      <template #cell="{ row, column, group }">
        <template v-if="column.key.startsWith('section_')">
          <!-- 1. Assigned: Interactive Teacher Capsule -->
          <div
            v-if="row.assignmentsBySection && row.assignmentsBySection[getSectionId(column.key)]"
            @click="emit('edit', row.assignmentsBySection[getSectionId(column.key)], Number(group.id), getSectionId(column.key))"
            class="inline-flex items-center justify-between gap-2 h-[34px] px-3 rounded-full border transition-all cursor-pointer group/pill shadow-2xs max-w-[200px] w-full"
            :class="[
              appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[getSectionId(column.key)].teacher_id)
                ? 'border-bx-primary ring-2 ring-bx-primary/50 bg-purple-500/15 dark:bg-purple-500/25 shadow-md scale-[1.01]'
                : 'border-[#B4AED8]/70 dark:border-white/15 bg-purple-500/[0.04] dark:bg-slate-800/80 hover:border-bx-primary hover:bg-purple-500/[0.08] dark:hover:border-purple-400 dark:hover:bg-purple-900/30'
            ]"
            :title="'انقر لتعديل إسناد المعلم ' + row.assignmentsBySection[getSectionId(column.key)].teacher_name"
          >
            <!-- Teacher Info -->
            <div class="flex-1 min-w-0 text-start leading-tight">
              <div class="flex items-center gap-1">
                <span
                  v-if="appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[getSectionId(column.key)].teacher_id)"
                  class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"
                  title="المعلم المختار"
                ></span>
                <div
                  class="font-bold text-[11px] group-hover/pill:text-bx-primary transition-colors truncate"
                  :class="appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[getSectionId(column.key)].teacher_id)
                    ? 'text-bx-primary font-black'
                    : 'text-bx-title'"
                  dir="auto"
                >
                  {{ row.assignmentsBySection[getSectionId(column.key)].teacher_name }}
                </div>
              </div>
              <div class="text-[9px] text-bx-muted font-mono leading-none mt-0.5">
                {{ row.assignmentsBySection[getSectionId(column.key)].teacher_code }}
              </div>
            </div>

            <!-- Action Buttons Inside Capsule -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Workload Button -->
              <button
                type="button"
                @click.stop="emit('view-workload', row.assignmentsBySection[getSectionId(column.key)].teacher_id)"
                class="w-6 h-6 rounded-full border border-[#B4AED8] bg-white text-bx-primary hover:bg-bx-primary hover:text-white dark:border-white/20 dark:bg-slate-800 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="عرض النصاب التدريسي للمعلم"
              >
                <UserCheck class="w-3 h-3" />
              </button>

              <!-- Delete Button -->
              <button
                type="button"
                @click.stop="emit('delete', row.assignmentsBySection[getSectionId(column.key)])"
                class="w-6 h-6 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="فك وإلغاء إسناد المادة"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- 2. Unassigned: Assign Teacher Button -->
          <button
            v-else
            type="button"
            @click="emit('create', Number(group.id), getSectionId(column.key), row.subject_id)"
            class="inline-flex items-center justify-center gap-1.5 h-[36px] px-2.5 rounded-full border border-dashed border-[#B4AED8]/70 dark:border-slate-600 bg-transparent hover:bg-bx-primary/5 hover:border-bx-primary text-bx-muted hover:text-bx-primary dark:text-slate-400 dark:hover:text-purple-300 text-[11px] font-bold transition-all cursor-pointer max-w-[210px] w-full shadow-2xs active:scale-95"
            title="إسناد معلم لهذه المادة في هذه الشعبة"
          >
            <Plus class="w-3 h-3" />
            <span>تعيين معلم</span>
          </button>
        </template>
      </template>

      <!-- Cell: Coverage Badge -->
      <template #cell-coverage="{ row }">
        <div
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border shadow-2xs"
          :class="[
            row.assignedCount === row.totalSections && row.totalSections > 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : row.assignedCount > 0
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
          ]"
        >
          <span>{{ row.assignedCount }}</span>
          <span class="opacity-50">/</span>
          <span>{{ row.totalSections }}</span>
        </div>
      </template>

      <!-- Custom Group Empty Slot -->
      <template #group-empty="{ group }">
        <!-- If Class has NO sections configured yet -->
        <div
          v-if="!group.sections || group.sections.length === 0"
          class="p-8 text-center text-xs text-bx-muted space-y-2"
        >
          <AlertCircle class="w-8 h-8 text-amber-500 mx-auto opacity-70" />
          <p class="font-bold text-bx-title">لم يتم تسجيل شُعب دراسية لهذا الصف حتى الآن</p>
          <p class="text-[11px]">يرجى إضافة شُعب دراسية في تبويب الهيكل الأكاديمي لتتمكن من توزيع الكادر التعليمي.</p>
        </div>

        <!-- If Class has sections but no assignments/subjects yet -->
        <div v-else class="flex flex-col items-center justify-center gap-2">
          <AlertCircle class="w-7 h-7 text-bx-muted opacity-40" />
          <span>لا توجد مواد مسندة لهذا الصف بعد.</span>
          <button
            type="button"
            @click="emit('create', Number(group.id))"
            class="text-bx-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1 text-[11px] mt-1"
          >
            <Plus class="w-3 h-3" />
            <span>إسناد أول مادة الآن</span>
          </button>
        </div>
      </template>
    </TaqniyaGroupedTable>
  </div>
</template>
