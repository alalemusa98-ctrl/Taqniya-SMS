<script setup lang="ts">
import {
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  UserCheck,
  AlertCircle,
} from 'lucide-vue-next';
import type { AssignmentItem } from '../../api/teaching-assignments.api';

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

defineProps<{
  groups: ClassMatrixGroup[];
  appliedTeacherFilter: string | number;
}>();

const emit = defineEmits<{
  (e: 'create', classId?: number, sectionId?: number, subjectId?: number): void;
  (e: 'edit', assignment: AssignmentItem, classId: number, sectionId: number): void;
  (e: 'delete', assignment: AssignmentItem): void;
  (e: 'view-workload', teacherId: number): void;
}>();
</script>

<template>
  <div class="space-y-6" dir="rtl">
    <!-- Empty State -->
    <div
      v-if="!groups || groups.length === 0"
      class="py-14 text-center space-y-3 rounded-2xl border border-dashed border-[#B4AED8] dark:border-white/[0.12] p-8"
    >
      <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-bx-primary flex items-center justify-center mx-auto">
        <BookOpen class="w-6 h-6" />
      </div>
      <h3 class="text-sm font-bold text-bx-title">لا توجد إسنادات تدريس مسجلة تطابق محددات البحث</h3>
      <p class="text-xs text-bx-muted max-w-sm mx-auto">
        يمكنك البدء بتكليف المعلمين وتوزيع المواد على الشُعب الدراسية للعام الدراسي المعتمد.
      </p>
      <button
        type="button"
        @click="emit('create')"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer mt-2"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>إسناد أول مادة الآن</span>
      </button>
    </div>

    <!-- Hierarchical Classes Matrix List -->
    <div v-else class="space-y-6">
      <div
        v-for="grp in groups"
        :key="grp.class_id"
        :id="'class-group-' + grp.class_id"
        class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs transition-all duration-300"
      >
        <!-- Class Header Bar -->
        <div class="bg-purple-500/[0.04] dark:bg-white/[0.03] py-3.5 px-5 border-b border-[#B4AED8]/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-400/40 flex items-center justify-center text-bx-primary dark:text-purple-300 shrink-0">
              <GraduationCap class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-black text-sm text-bx-title font-display block leading-tight">{{ grp.class_name }}</h3>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] font-semibold text-bx-muted px-2 py-0.5 rounded-full border border-[#B4AED8]/60 dark:border-white/10 bg-[var(--bx-surface-solid)]">
                  {{ grp.sections?.length || 0 }} شُعب دراسية
                </span>
                <span class="text-[10px] font-bold text-bx-primary px-2 py-0.5 rounded-full border border-purple-500/30 dark:border-purple-400/30 bg-purple-500/10">
                  {{ grp.totalAssignmentsCount }} إسنادات مسجلة
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="emit('create', grp.class_id)"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-purple-300 bg-purple-50 text-bx-primary hover:bg-bx-primary hover:text-white dark:border-purple-400/60 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="إسناد مادة لهذا الصف الدراسي"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>إسناد مادة لهذا الصف</span>
            </button>
          </div>
        </div>

        <!-- If class has no sections -->
        <div v-if="!grp.sections || grp.sections.length === 0" class="p-8 text-center text-xs text-bx-muted space-y-2">
          <AlertCircle class="w-8 h-8 text-amber-500 mx-auto opacity-70" />
          <p class="font-bold text-bx-title">لم يتم تسجيل شُعب دراسية لهذا الصف حتى الآن</p>
          <p class="text-[11px]">يرجى إضافة شُعب دراسية في تبويب الهيكل الأكاديمي لتتمكن من توزيع الكادر التعليمي.</p>
        </div>

        <!-- Class Matrix Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-start border-collapse text-[11px]">
            <thead>
              <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8]/60 dark:border-white/15 text-bx-muted text-[11px]">
                <th class="py-2.5 px-3.5 font-bold text-start w-12 font-['Alexandria',sans-serif] border-e border-[#B4AED8]/50 dark:border-white/10">#</th>
                <th class="py-2.5 px-3.5 font-bold text-start min-w-[190px] border-e border-[#B4AED8]/50 dark:border-white/10">
                  <div class="flex items-center gap-1.5">
                    <BookOpen class="w-3 h-3 text-bx-primary" />
                    <span>المادة الدراسية</span>
                  </div>
                </th>
                <!-- Dynamic Section Headers for THIS class -->
                <th
                  v-for="sec in grp.sections"
                  :key="sec.class_section_id"
                  class="py-2.5 px-3 font-bold text-center min-w-[195px] border-e border-[#B4AED8]/50 dark:border-white/10"
                >
                  <div class="inline-flex items-center justify-center gap-1.5 font-bold text-bx-title text-[11px]">
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span>{{ sec.section_name }}</span>
                  </div>
                </th>
                <th class="py-2.5 px-3 font-bold text-center w-24 last:border-e-0">نسبة التغطية</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/10">
              <!-- Empty subjects row -->
              <tr v-if="!grp.subjects || grp.subjects.length === 0" class="hover:bg-[var(--bx-row-hover)]/20 transition-colors">
                <td :colspan="3 + grp.sections.length" class="py-8 px-4 text-center text-bx-muted text-[11px]">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <AlertCircle class="w-7 h-7 text-bx-muted opacity-40" />
                    <span>لا توجد مواد مسندة لهذا الصف بعد.</span>
                    <button
                      type="button"
                      @click="emit('create', grp.class_id)"
                      class="text-bx-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1 text-[11px] mt-1"
                    >
                      <Plus class="w-3 h-3" />
                      <span>إسناد أول مادة الآن</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Subject Rows -->
              <tr
                v-for="(row, idx) in grp.subjects"
                :key="row.subject_id"
                class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors duration-150"
              >
                <!-- Index -->
                <td class="py-2.5 px-3.5 font-['Alexandria',sans-serif] font-bold text-bx-muted text-[10px] whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                  {{ idx + 1 }}
                </td>

                <!-- Subject Name -->
                <td class="py-2.5 px-3.5 whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10">
                  <span class="font-black text-[11px] text-bx-title block leading-tight">
                    {{ row.subject_name }}
                  </span>
                  <span v-if="row.subject_code" class="text-[9px] font-mono text-bx-muted">
                    {{ row.subject_code }}
                  </span>
                </td>

                <!-- Columns per Section showing Teacher Capsule -->
                <td
                  v-for="sec in grp.sections"
                  :key="sec.class_section_id"
                  class="py-2 px-2.5 text-center whitespace-nowrap border-e border-[#B4AED8]/50 dark:border-white/10"
                >
                  <!-- Assigned: Interactive Teacher Capsule -->
                  <div
                    v-if="row.assignmentsBySection[sec.class_section_id]"
                    @click="emit('edit', row.assignmentsBySection[sec.class_section_id], grp.class_id, sec.class_section_id)"
                    class="inline-flex items-center justify-between gap-2 h-[34px] px-3 rounded-full border transition-all cursor-pointer group/pill shadow-2xs max-w-[200px] w-full"
                    :class="[
                      appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[sec.class_section_id].teacher_id)
                        ? 'border-bx-primary ring-2 ring-bx-primary/50 bg-purple-500/15 dark:bg-purple-500/25 shadow-md scale-[1.01]'
                        : 'border-[#B4AED8]/70 dark:border-white/15 bg-purple-500/[0.04] dark:bg-slate-800/80 hover:border-bx-primary hover:bg-purple-500/[0.08] dark:hover:border-purple-400 dark:hover:bg-purple-900/30'
                    ]"
                    :title="'انقر لتعديل إسناد المعلم ' + row.assignmentsBySection[sec.class_section_id].teacher_name"
                  >
                    <!-- Teacher Info -->
                    <div class="flex-1 min-w-0 text-start leading-tight">
                      <div class="flex items-center gap-1">
                        <span
                          v-if="appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[sec.class_section_id].teacher_id)"
                          class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"
                          title="المعلم المختار"
                        ></span>
                        <div
                          class="font-bold text-[11px] group-hover/pill:text-bx-primary transition-colors truncate"
                          :class="appliedTeacherFilter !== 'all' && Number(appliedTeacherFilter) === Number(row.assignmentsBySection[sec.class_section_id].teacher_id)
                            ? 'text-bx-primary font-black'
                            : 'text-bx-title'"
                          dir="auto"
                        >
                          {{ row.assignmentsBySection[sec.class_section_id].teacher_name }}
                        </div>
                      </div>
                      <div class="text-[9px] text-bx-muted font-mono leading-none mt-0.5">
                        {{ row.assignmentsBySection[sec.class_section_id].teacher_code }}
                      </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      <!-- Workload Button -->
                      <button
                        type="button"
                        @click.stop="emit('view-workload', row.assignmentsBySection[sec.class_section_id].teacher_id)"
                        class="w-6 h-6 rounded-full border border-[#B4AED8] bg-white text-bx-primary hover:bg-bx-primary hover:text-white dark:border-white/20 dark:bg-slate-800 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="عرض النصاب التدريسي للمعلم"
                      >
                        <UserCheck class="w-3 h-3" />
                      </button>

                      <!-- Delete Button -->
                      <button
                        type="button"
                        @click.stop="emit('delete', row.assignmentsBySection[sec.class_section_id])"
                        class="w-6 h-6 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="فك وإلغاء إسناد المادة"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <!-- Unassigned: + تعيين معلم button -->
                  <button
                    v-else
                    type="button"
                    @click="emit('create', grp.class_id, sec.class_section_id, row.subject_id)"
                    class="inline-flex items-center justify-center gap-1.5 h-[36px] px-2.5 rounded-full border border-dashed border-[#B4AED8]/70 dark:border-slate-600 bg-transparent hover:bg-bx-primary/5 hover:border-bx-primary text-bx-muted hover:text-bx-primary dark:text-slate-400 dark:hover:text-purple-300 text-[11px] font-bold transition-all cursor-pointer max-w-[210px] w-full shadow-2xs active:scale-95"
                    title="إسناد معلم لهذه المادة في هذه الشعبة"
                  >
                    <Plus class="w-3 h-3" />
                    <span>تعيين معلم</span>
                  </button>
                </td>

                <!-- Coverage Badge -->
                <td class="py-2 px-3 text-center whitespace-nowrap last:border-e-0">
                  <span
                    class="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs"
                    :class="row.assignedCount === row.totalSections && row.totalSections > 0
                      ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 dark:border-emerald-400/50'
                      : row.assignedCount > 0
                      ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/40 dark:border-amber-400/50'
                      : 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/40 dark:border-rose-400/50'"
                  >
                    <span class="font-mono font-black">{{ row.assignedCount }}</span>
                    <span class="text-[9px] opacity-70">من</span>
                    <span class="font-mono font-black">{{ row.totalSections }}</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
