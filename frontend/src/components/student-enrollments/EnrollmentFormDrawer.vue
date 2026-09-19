<script setup lang="ts">
import {
  User,
  School,
  GraduationCap,
  Hash,
  ArrowLeftRight,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type { EnrolledStudent, EnrollmentStatusType } from '../../api/student-enrollments.api';

defineProps<{
  isOpen: boolean;
  mode: 'create' | 'edit';
  form: {
    academic_year_id: number | '';
    student_id: number | '';
    class_section_id: number | '';
    seating_number: string;
    status: EnrollmentStatusType;
  };
  studentOptions: TaqniyaSelectOption[];
  classOptions: TaqniyaSelectOption[];
  sectionOptions: TaqniyaSelectOption[];
  statusOptions: TaqniyaSelectOption[];
  selectedClassId: number | '';
  activeStudent: EnrolledStudent | null;
  currentSectionInfo: { className: string; sectionName: string } | null;
  fieldErrors: Record<string, string[]>;
  errorMessage: string | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit'): void;
  (e: 'update:selectedClassId', val: number | ''): void;
}>();
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    @close="emit('close')"
    :title="mode === 'create' ? 'تسكين طالب جديد في صف وشعبة' : 'نقل الشعبة وتعديل بيانات التسكين'"
    max-width="max-w-[660px]"
  >
    <form @submit.prevent="emit('submit')" class="space-y-4 font-sans" dir="rtl">
      <!-- Form Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-500/[0.08] dark:bg-rose-950/50 border border-rose-400/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 font-bold"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- ============================================== -->
      <!-- 🟢 CREATE MODE: ENROLL STUDENT INTO CLASS & SECTION -->
      <!-- ============================================== -->
      <template v-if="mode === 'create'">
        <!-- Card 1: Student Selection -->
        <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
          <div class="flex items-center gap-2 border-b border-bx-divider pb-2.5">
            <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
              <User class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-xs font-black text-bx-title font-display">بيانات الطالب المستهدف</h4>
              <p class="text-[10px] text-bx-muted">ابحث عن الطالب غير المسكن لتسكينه في العام الدراسي النشط</p>
            </div>
          </div>

          <!-- Student Selection via Searchable TaqniyaSelect -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-title block">
              الطالب المستهدف <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              v-model="form.student_id"
              :options="studentOptions"
              :placeholder="studentOptions.length === 0 ? 'لا يوجد طلاب غير مسكنين بالعام الحالي' : 'ابحث عن الطالب بالاسم أو الرمز الموحد...'"
              :icon="User"
              :disabled="studentOptions.length === 0"
              full-width
            />
            <p v-if="fieldErrors.student_id" class="text-[11px] text-rose-500 font-bold mt-1">
              {{ fieldErrors.student_id[0] }}
            </p>
          </div>
        </div>

        <!-- Card 2: Academic Placement (Hierarchical: Class THEN Section) -->
        <div class="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] space-y-3.5 shadow-xs">
          <div class="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <School class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-black text-bx-title font-display">التسكين الأكاديمي وتحديد الشعبة</h4>
                <p class="text-[10px] text-bx-muted">اختر الصف الدراسي أولاً لتفعيل الشعب المتاحة له</p>
              </div>
            </div>
          </div>

          <!-- 2-Column Dependent Selectors -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- 1. Select Class -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-bx-title block">
                1. الصف الدراسي <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                :model-value="selectedClassId"
                @update:model-value="(val) => emit('update:selectedClassId', val as number | '')"
                :options="classOptions"
                placeholder="اختر الصف الدراسي..."
                :icon="School"
                full-width
              />
            </div>

            <!-- 2. Select Section -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-bx-title block">
                2. الشعبة الدراسية <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="form.class_section_id"
                :options="sectionOptions"
                :placeholder="
                  !selectedClassId
                    ? 'يرجى اختيار الصف أولاً...'
                    : sectionOptions.length === 0
                    ? 'لا توجد شعب لهذا الصف'
                    : 'اختر الشعبة المتاحة...'
                "
                :disabled="!selectedClassId || sectionOptions.length === 0"
                :icon="GraduationCap"
                full-width
              />
              <p v-if="fieldErrors.class_section_id" class="text-[11px] text-rose-500 font-bold mt-1">
                {{ fieldErrors.class_section_id[0] }}
              </p>
            </div>
          </div>

          <!-- Seating Number (Optional) -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center gap-1.5 text-bx-title">
              <Hash class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <label class="text-[11px] font-bold">رقم الجلوس في الشعبة (اختياري)</label>
            </div>
            <input
              v-model="form.seating_number"
              type="text"
              maxlength="50"
              placeholder="مثال: 101، أو SEAT-501"
              class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
          </div>
        </div>
      </template>

      <!-- ============================================== -->
      <!-- 🔵 EDIT MODE: SECTION TRANSFER & PLACEMENT EDIT -->
      <!-- ============================================== -->
      <template v-else>
        <!-- Card 1: Current Student & Placement Information -->
        <div v-if="activeStudent" class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3 shadow-xs">
          <div class="flex items-center justify-between border-b border-bx-divider pb-2.5">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
                <User class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-black text-bx-title font-display">بيانات القيد الحالي للطالب</h4>
                <p class="text-[10px] text-bx-muted">معلومات الطالب والشعبة المسكن بها حالياً</p>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-purple-500/10 text-bx-primary border border-purple-500/20">
              {{ activeStudent.student_code }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-purple-500/[0.03] border border-bx-border">
              <span class="text-[10px] text-bx-muted font-bold block mb-1">اسم الطالب الرباعي</span>
              <span class="font-black text-bx-title">{{ activeStudent.student_name }}</span>
            </div>
            <div class="p-3 rounded-xl bg-purple-500/[0.03] border border-bx-border">
              <span class="text-[10px] text-bx-muted font-bold block mb-1">الشعبة والصف الحالي</span>
              <span class="font-black text-indigo-600 dark:text-indigo-400">
                {{ currentSectionInfo ? `${currentSectionInfo.className} — ${currentSectionInfo.sectionName}` : 'الشعبة الحالية' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2: Transfer to Target Class & Section -->
        <div class="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3.5 shadow-xs">
          <div class="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ArrowLeftRight class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-black text-bx-title font-display">نقل الطالب إلى شعبة جديدة</h4>
                <p class="text-[10px] text-bx-muted">حدد الصف والشعبة المستهدفة لنقل قيد الطالب</p>
              </div>
            </div>
            <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              نقل الشعبة
            </span>
          </div>

          <!-- 2-Column Dependent Selectors -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- 1. Target Class -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-bx-title block">
                1. الصف الدراسي المستهدف <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                :model-value="selectedClassId"
                @update:model-value="(val) => emit('update:selectedClassId', val as number | '')"
                :options="classOptions"
                placeholder="اختر الصف الدراسي..."
                :icon="School"
                full-width
              />
            </div>

            <!-- 2. Target Section -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-bx-title block">
                2. الشعبة الدراسية المستهدفة <span class="text-rose-500">*</span>
              </label>
              <TaqniyaSelect
                v-model="form.class_section_id"
                :options="sectionOptions"
                :placeholder="
                  !selectedClassId
                    ? 'يرجى اختيار الصف أولاً...'
                    : sectionOptions.length === 0
                    ? 'لا توجد شعب لهذا الصف'
                    : 'اختر الشعبة المتاحة...'
                "
                :disabled="!selectedClassId || sectionOptions.length === 0"
                :icon="GraduationCap"
                full-width
              />
              <p v-if="fieldErrors.class_section_id" class="text-[11px] text-rose-500 font-bold mt-1">
                {{ fieldErrors.class_section_id[0] }}
              </p>
            </div>
          </div>

          <!-- Seating Number -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center gap-1.5 text-bx-title">
              <Hash class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <label class="text-[11px] font-bold">رقم الجلوس في الشعبة الجديدة (اختياري)</label>
            </div>
            <input
              v-model="form.seating_number"
              type="text"
              maxlength="50"
              placeholder="مثال: 101، أو SEAT-501"
              class="w-full px-5 py-2.5 rounded-full border border-bx-border bg-transparent text-xs text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all font-mono"
            />
          </div>

          <!-- Optional Status Update in Edit Mode -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between text-bx-title">
              <label class="text-[11px] font-bold">الحالة الأكاديمية للقيد</label>
              <span class="text-[10px] text-bx-muted">(مسكن افتراضياً)</span>
            </div>
            <TaqniyaSelect
              v-model="form.status"
              :options="statusOptions"
              full-width
            />
          </div>
        </div>
      </template>

      <!-- Drawer Actions Footer -->
      <div class="pt-4 flex items-center justify-end gap-3 border-t border-bx-divider">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2.5 rounded-full text-xs font-bold border border-bx-border text-bx-muted hover:text-bx-title hover:bg-bx-row-hover transition cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="submit"
          :disabled="submitting || (mode === 'create' && (!form.student_id || !form.class_section_id)) || (mode === 'edit' && !form.class_section_id)"
          class="px-6 py-2.5 rounded-full text-xs font-bold bg-bx-primary text-white shadow-sm hover:bg-bx-primary-hover transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          <span>{{ mode === 'create' ? 'تسكين الطالب' : 'تأكيد نقل الشعبة والتحديث' }}</span>
        </button>
      </div>
    </form>
  </TaqniyaDrawer>
</template>
