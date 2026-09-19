<script setup lang="ts">
import { Sparkles, School, GraduationCap, Users, Search, Check, AlertCircle, Loader2 } from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';

const props = defineProps<{
  isOpen: boolean;
  classOptions: TaqniyaSelectOption[];
  sectionOptions: TaqniyaSelectOption[];
  availableStudents: Array<{ id: number; full_name: string; user_code?: string }>;
  selectedClassId: number | '';
  selectedSectionId: number | '';
  selectedStudentIds: number[];
  studentSearch: string;
  errorMessage: string | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit'): void;
  (e: 'update:selectedClassId', val: number | ''): void;
  (e: 'update:selectedSectionId', val: number | ''): void;
  (e: 'update:selectedStudentIds', val: number[]): void;
  (e: 'update:studentSearch', val: string): void;
}>();

const toggleStudent = (id: number) => {
  if (props.selectedStudentIds.includes(id)) {
    emit('update:selectedStudentIds', props.selectedStudentIds.filter((sId) => sId !== id));
  } else {
    emit('update:selectedStudentIds', [...props.selectedStudentIds, id]);
  }
};

const selectAll = () => {
  emit('update:selectedStudentIds', props.availableStudents.map((s) => s.id));
};

const deselectAll = () => {
  emit('update:selectedStudentIds', []);
};
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    @close="emit('close')"
    title="التسكين والتوزيع الجماعي للطلاب"
    subtitle="تسكين دفعة من الطلاب غير المسكنين بالعام الدراسي الحالي في صف وشعبة محددة"
    :icon="Sparkles"
    max-width="max-w-[560px]"
  >
    <div class="space-y-4 font-sans" dir="rtl">
      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-500/[0.08] dark:bg-rose-950/50 border border-rose-400/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 font-bold"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Card 1: Target Class & Section -->
      <div class="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/[0.02] space-y-3.5 shadow-xs">
        <div class="flex items-center gap-2 border-b border-purple-500/20 pb-2.5">
          <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
            <School class="w-4 h-4" />
          </div>
          <div>
            <h4 class="text-xs font-black text-bx-title font-display">الصف والشعبة المستهدفة</h4>
            <p class="text-[10px] text-bx-muted">حدد وجهة تسكين الطلاب</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-bx-title">
              1. الصف المستهدف <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              :model-value="selectedClassId"
              @update:model-value="(val) => emit('update:selectedClassId', val as number | '')"
              :options="classOptions"
              placeholder="اختر الصف..."
              :icon="School"
              full-width
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-bx-title">
              2. الشعبة المستهدفة <span class="text-rose-500">*</span>
            </label>
            <TaqniyaSelect
              :model-value="selectedSectionId"
              @update:model-value="(val) => emit('update:selectedSectionId', val as number | '')"
              :options="sectionOptions"
              :placeholder="!selectedClassId ? 'اختر الصف أولاً...' : sectionOptions.length === 0 ? 'لا توجد شعب' : 'اختر الشعبة...'"
              :disabled="!selectedClassId || sectionOptions.length === 0"
              :icon="GraduationCap"
              full-width
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Students Multi-select with Search & Quick Actions -->
      <div class="p-4 rounded-2xl border border-bx-border bg-bx-surface space-y-3 shadow-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-xl bg-purple-500/10 text-bx-primary flex items-center justify-center font-bold">
              <Users class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-xs font-black text-bx-title font-display">الطلاب غير المسكنين</h4>
              <p class="text-[10px] text-bx-muted">
                المتاح: {{ availableStudents.length }} طالب
              </p>
            </div>
          </div>

          <!-- Quick Selection Actions -->
          <div v-if="availableStudents.length > 0" class="flex items-center gap-1.5">
            <button
              type="button"
              @click="selectAll"
              class="text-[10.5px] font-bold text-bx-primary hover:underline cursor-pointer px-2 py-0.5 rounded-full hover:bg-purple-500/10 transition"
            >
              تحديد الكل
            </button>
            <span class="text-bx-muted text-[10px] opacity-40">|</span>
            <button
              type="button"
              @click="deselectAll"
              class="text-[10.5px] font-bold text-bx-muted hover:text-rose-500 cursor-pointer px-2 py-0.5 rounded-full hover:bg-rose-500/10 transition"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>

        <!-- Search input -->
        <div class="relative flex items-center">
          <Search class="w-3.5 h-3.5 text-bx-muted absolute right-3 pointer-events-none" />
          <input
            :value="studentSearch"
            @input="(e) => emit('update:studentSearch', (e.target as HTMLInputElement).value)"
            type="text"
            placeholder="تصفية الطلاب بالاسم أو الرمز الموحد..."
            class="w-full pr-9 pl-4 py-2 rounded-full text-xs font-medium border border-bx-border bg-transparent text-bx-title placeholder:text-bx-muted focus:outline-none focus:border-bx-primary transition-all"
          />
        </div>

        <!-- Scrollable Student List -->
        <div class="max-h-60 overflow-y-auto border border-bx-border rounded-2xl divide-y divide-bx-divider bg-purple-500/[0.01]">
          <div
            v-for="s in availableStudents"
            :key="s.id"
            class="flex items-center justify-between p-2.5 hover:bg-purple-500/[0.05] dark:hover:bg-white/[0.03] text-xs cursor-pointer transition-colors"
            @click="toggleStudent(s.id)"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 shadow-2xs"
                :class="[
                  selectedStudentIds.includes(s.id)
                    ? 'bg-bx-primary border-bx-primary text-white shadow-xs'
                    : 'border-bx-border dark:border-white/30 bg-white dark:bg-slate-800'
                ]"
              >
                <Check v-if="selectedStudentIds.includes(s.id)" class="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div class="truncate">
                <span class="font-bold text-bx-title block leading-tight truncate">{{ s.full_name }}</span>
                <span v-if="s.user_code" class="text-bx-muted font-mono text-[10px] block mt-0.5">
                  الرمز: {{ s.user_code }}
                </span>
              </div>
            </div>

            <span
              v-if="selectedStudentIds.includes(s.id)"
              class="text-[10px] font-bold text-bx-primary px-2 py-0.5 rounded-full bg-purple-500/10 shrink-0"
            >
              تم الاختيار
            </span>
          </div>

          <div v-if="availableStudents.length === 0" class="p-8 text-center text-bx-muted text-xs space-y-1">
            <AlertCircle class="w-7 h-7 mx-auto opacity-40 text-amber-500 mb-1" />
            <p class="font-bold text-bx-title">لا يوجد طلاب غير مسكنين متاحين</p>
            <p class="text-[11px]">كافة الطلاب مقيدون ومسكنون في شعب دراسية للعام الحالي.</p>
          </div>
        </div>

        <!-- Counter Info Bar -->
        <div class="flex items-center justify-between text-[11px] font-bold pt-1">
          <span class="text-bx-muted">المحددون للتسكين:</span>
          <span class="text-bx-primary font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            {{ selectedStudentIds.length }} طالب
          </span>
        </div>
      </div>

      <!-- Actions Footer -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-bx-divider">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-full text-xs font-bold border border-bx-border text-bx-muted hover:text-bx-title hover:bg-bx-row-hover cursor-pointer transition"
        >
          إلغاء
        </button>
        <button
          type="button"
          :disabled="submitting || selectedStudentIds.length === 0 || !selectedSectionId"
          @click="emit('submit')"
          class="px-6 py-2 rounded-full text-xs font-bold bg-bx-primary hover:bg-bx-primary-hover text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm active:scale-95"
        >
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-3.5 h-3.5" />
          <span>تسكين {{ selectedStudentIds.length }} طلاب في الشعبة</span>
        </button>
      </div>
    </div>
  </TaqniyaDrawer>
</template>
