<template>
  <TaqniyaModal
    :is-open="isOpen"
    title="محرك الترحيل الأكاديمي السنوي وتوزيع الفصول"
    subtitle="محاكاة ونقل الطلاب للمستوى الأكاديمي التالي مع الحفاظ على تسكين وتوازن الشعب الدراسية"
    maxWidth="7xl"
    @close="emit('close')"
  >
    <template #icon>
      <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20 shadow-xs">
        <GraduationCap class="w-5 h-5" />
      </div>
    </template>

    <div class="space-y-6" dir="rtl">
      <!-- 1. Year Selection Form & Action Header -->
      <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-bx-title border-b border-[#B4AED8]/30 dark:border-white/[0.06] pb-3">
          <Sparkles class="w-4 h-4 text-bx-primary" />
          <span>تحديد مسار الترحيل الأكاديمي بين الأعوام الدراسية</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-title">
              <span>من العام الدراسي (السنة المنتهية):</span>
              <span class="text-rose-500 font-bold ms-0.5">*</span>
            </label>
            <TaqniyaSelect
              v-model="fromYearId"
              :options="yearOptions"
              placeholder="اختر العام الدراسي الحالي"
              :full-width="true"
              placement="down"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-bx-title">
              <span>إلى العام الدراسي (السنة المستهدفة):</span>
              <span class="text-rose-500 font-bold ms-0.5">*</span>
            </label>
            <TaqniyaSelect
              v-model="toYearId"
              :options="yearOptions"
              placeholder="اختر العام الدراسي الجديد"
              :full-width="true"
              placement="down"
            />
          </div>

          <div>
            <button
              type="button"
              class="w-full h-10 px-5 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canPreview || isPreviewLoading"
              @click="runPreview"
            >
              <Loader2 v-if="isPreviewLoading" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              <span>{{ isPreviewLoading ? 'جاري تشغيل المحاكاة...' : 'تشغيل محاكاة الترحيل ومعاينة النتائج' }}</span>
            </button>
          </div>
        </div>

        <!-- Annual Cumulative Exam Compensation Feature Toggle -->
        <div class="pt-3 border-t border-[#B4AED8]/30 dark:border-white/[0.06]">
          <label class="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="enableAnnualExamCompensation"
              class="w-4 h-4 mt-0.5 rounded-md border-[#B4AED8] text-bx-primary focus:ring-0 cursor-pointer accent-purple-600 shrink-0"
            />
            <div class="space-y-0.5">
              <span class="text-xs font-bold text-bx-title block">
                تفعيل ميزة جبر مجموع الامتحانات النهائية السنوية (Cumulative Exam Compensation)
              </span>
              <span class="text-[11px] text-bx-muted leading-relaxed block">
                عند التفعيل، يتم احتساب شرط الامتحان النهائي على مجموع درجات امتحانات فصول السنة مجتمعة بدلاً من اشتراط اجتياز صغرى الامتحان في كل سمستر على حدة.
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Guidance Card before simulation is executed -->
      <div
        v-if="!previewResult"
        class="bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-[#B4AED8] dark:border-white/[0.12] rounded-3xl p-10 text-center space-y-3"
      >
        <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center mx-auto border border-bx-primary/20 shadow-xs">
          <Sparkles class="w-7 h-7" />
        </div>
        <div class="max-w-md mx-auto space-y-1">
          <h4 class="text-sm font-bold text-bx-title">جاهز لتشغيل محاكاة الترحيل الأكاديمي السنوي</h4>
          <p class="text-xs text-bx-muted leading-relaxed">
            حدد العام الدراسي المنتهي والعام الدراسي الجديد من القوائم أعلاه، ثم اضغط على زر <strong>"تشغيل محاكاة الترحيل ومعاينة النتائج"</strong> لعرض مصفوفة تسكين الشعب وتوزيع أعداد الناجحين والراسبين.
          </p>
        </div>
      </div>

      <!-- 2. Simulation Results Container -->
      <div v-if="previewResult" class="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <!-- 2.1 KPI Overview Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <!-- Total & Pass Rate -->
          <div class="bg-[var(--bx-surface-solid)] border border-sky-500/20 rounded-2xl p-4 space-y-1 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-bx-muted">إجمالي الطلاب</span>
              <div class="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Users class="w-4 h-4" />
              </div>
            </div>
            <div class="flex items-baseline justify-between pt-0.5">
              <span class="text-xl font-black text-bx-title font-mono">{{ previewResult.summary?.total_students ?? 0 }}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300">
                {{ previewResult.summary?.overall_pass_rate ?? 0 }}% نجاح
              </span>
            </div>
            <span class="text-[10px] text-bx-muted block">مسكنون في العام الحالي</span>
          </div>

          <!-- Promoted -->
          <div class="bg-[var(--bx-surface-solid)] border border-emerald-500/20 rounded-2xl p-4 space-y-1 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-bx-muted">المنقولون (Promoted)</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 class="w-4 h-4" />
              </div>
            </div>
            <div class="pt-0.5">
              <span class="text-xl font-black text-emerald-600 font-mono">{{ previewResult.summary?.to_be_promoted ?? 0 }}</span>
            </div>
            <span class="text-[10px] text-bx-muted block">نقل مباشر للمستوى التالي</span>
          </div>

          <!-- Second Round -->
          <div class="bg-[var(--bx-surface-solid)] border border-amber-500/20 rounded-2xl p-4 space-y-1 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-bx-muted">الدور الثاني</span>
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock class="w-4 h-4" />
              </div>
            </div>
            <div class="pt-0.5">
              <span class="text-xl font-black text-amber-600 font-mono">{{ previewResult.summary?.second_round ?? 0 }}</span>
            </div>
            <span class="text-[10px] text-bx-muted block">معلقون حتى ظهور الدور الثاني</span>
          </div>

          <!-- Retained -->
          <div class="bg-[var(--bx-surface-solid)] border border-rose-500/20 rounded-2xl p-4 space-y-1 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-bx-muted">الباقون للإعادة</span>
              <div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <RotateCcw class="w-4 h-4" />
              </div>
            </div>
            <div class="pt-0.5">
              <span class="text-xl font-black text-rose-600 font-mono">{{ previewResult.summary?.retained ?? 0 }}</span>
            </div>
            <span class="text-[10px] text-bx-muted block">في نفس المستوى والشعبة</span>
          </div>

          <!-- Graduated -->
          <div class="bg-[var(--bx-surface-solid)] border border-purple-500/20 rounded-2xl p-4 space-y-1 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-bx-muted">الخريجون</span>
              <div class="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <GraduationCap class="w-4 h-4" />
              </div>
            </div>
            <div class="pt-0.5">
              <span class="text-xl font-black text-purple-600 font-mono">{{ previewResult.summary?.graduated ?? 0 }}</span>
            </div>
            <span class="text-[10px] text-bx-muted block">أتموا المرحلة الثانوية</span>
          </div>
        </div>

        <!-- 2.2 Unified Section Placement Matrix (مصفوفة تسكين الشعب ونتائج المحاكاة) -->
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <!-- Matrix Card Header -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#B4AED8]/30 dark:border-white/[0.06]">
            <div>
              <h3 class="text-base font-black font-display text-bx-title">
                مصفوفة نتائج الترحيل وتسكين الشُعب الموحدة
              </h3>
              <p class="text-xs text-bx-muted font-medium mt-0.5">
                توزيع أعداد الطلاب والناجحين والراسبين لكل شعبة دراسية على مستوى كافة الصفوف
              </p>
            </div>

            <!-- Quick Matrix Search -->
            <div class="relative w-full sm:w-64">
              <input
                v-model="matrixSearch"
                type="text"
                placeholder="بحث بالصف أو المرحلة..."
                class="w-full h-9 bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl px-3.5 pr-8 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all"
              />
              <Search class="w-3.5 h-3.5 text-bx-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <!-- Matrix Table -->
          <div class="rounded-2xl border border-[#B4AED8] dark:border-white/[0.12] overflow-hidden bg-[var(--bx-surface-solid)] shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-start border-collapse text-xs">
                <thead>
                  <tr class="bg-[var(--bx-table-header)] border-b border-[#B4AED8] dark:border-white/15 text-bx-muted">
                    <!-- Sticky Y-Axis Header: Class & Stage -->
                    <th class="py-3.5 px-5 font-bold text-start whitespace-nowrap w-72 min-w-[240px] max-w-[280px] sticky start-0 bg-[var(--bx-table-header)] z-20 border-e border-[#B4AED8]/60 dark:border-white/15">
                      <div class="flex items-center gap-2 text-bx-title font-bold text-xs">
                        <GraduationCap class="w-4 h-4 text-bx-primary" />
                        <span>الصف الدراسي والمرحلة</span>
                      </div>
                    </th>

                    <!-- Dynamic X-Axis Headers: Sections -->
                    <th
                      v-for="sec in matrixSectionsList"
                      :key="sec.id"
                      class="py-3 px-4 font-bold text-center whitespace-nowrap border-e border-[#B4AED8]/60 dark:border-white/15 last:border-e-0 min-w-[160px]"
                    >
                      <div class="flex flex-col items-center justify-center gap-0.5">
                        <div class="flex items-center gap-1.5 text-bx-title font-black text-xs sm:text-sm">
                          <Users2 class="w-3.5 h-3.5 text-bx-primary" />
                          <span>{{ sec.name }}</span>
                        </div>
                        <span class="text-[10px] font-mono text-bx-muted">{{ sec.code }}</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-[#B4AED8]/60 dark:divide-white/15">
                  <tr
                    v-for="row in filteredMatrixRows"
                    :key="row.class_id"
                    class="hover:bg-purple-500/[0.03] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <!-- Sticky Y-Axis Cell: Class Info -->
                    <td class="py-3 px-5 whitespace-nowrap sticky start-0 bg-[var(--bx-surface-solid)] z-10 border-e border-[#B4AED8]/60 dark:border-white/15">
                      <div class="space-y-1">
                        <span class="font-black text-sm text-bx-title block leading-tight">{{ row.class_name }}</span>
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="getStageBadgeClass(row.stage_name)">
                            {{ row.stage_name }}
                          </span>
                          <span class="text-[10px] font-semibold text-bx-muted">
                            {{ getAssignedSectionsCount(row) }} شُعب مسكنة
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Dynamic Section Cells -->
                    <td
                      v-for="sec in matrixSectionsList"
                      :key="sec.id"
                      class="py-2.5 px-3 text-center border-e border-[#B4AED8]/60 dark:border-white/15 last:border-e-0 align-middle"
                    >
                      <!-- Case 1: Section is assigned to this class and has students -->
                      <div
                        v-if="getCellData(row, sec.id)?.is_assigned && (getCellData(row, sec.id)?.total_students ?? 0) > 0"
                        class="p-2.5 rounded-2xl border border-bx-border bg-[var(--bx-surface-solid)] shadow-2xs space-y-1.5 min-w-[140px] text-start transition-all hover:border-bx-primary"
                      >
                        <!-- Header: Total & Pass Rate -->
                        <div class="flex items-center justify-between gap-1 text-[11px]">
                          <span class="text-bx-muted font-medium">المجموع:</span>
                          <span class="font-mono font-black text-bx-title">{{ getCellData(row, sec.id)?.total_students }} طالب</span>
                        </div>

                        <!-- Mini Pills: Passed & Failed -->
                        <div class="grid grid-cols-2 gap-1 pt-1 border-t border-bx-border/60">
                          <div class="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-center font-bold text-[10px]" title="عدد الناجحين">
                            <span>{{ getCellData(row, sec.id)?.passed_count }} ناجح</span>
                          </div>
                          <div class="px-1.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-center font-bold text-[10px]" title="عدد الراسبين">
                            <span>{{ getCellData(row, sec.id)?.failed_count }} راسب</span>
                          </div>
                        </div>

                        <!-- Second Round (If Any) -->
                        <div
                          v-if="(getCellData(row, sec.id)?.second_round_count ?? 0) > 0"
                          class="px-1.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-center font-bold text-[9px]"
                        >
                          <span>{{ getCellData(row, sec.id)?.second_round_count }} دور ثان</span>
                        </div>
                      </div>

                      <!-- Case 2: Section is assigned to class but has 0 students -->
                      <div
                        v-else-if="getCellData(row, sec.id)?.is_assigned"
                        class="py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-center text-[11px] font-semibold text-bx-muted"
                      >
                        <span>شعبة شاغرة (0)</span>
                      </div>

                      <!-- Case 3: Section is not assigned to this class -->
                      <div v-else class="text-center text-xs text-bx-muted/40 font-mono select-none">
                        —
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 2.3 Low Enrollment Warnings -->
        <div
          v-if="previewResult.low_enrollment_warnings && previewResult.low_enrollment_warnings.length > 0"
          class="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 space-y-2.5 text-amber-800 dark:text-amber-200 shadow-2xs"
        >
          <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0" />
            <span>تنبيهات انخفاض الكثافة الطلابية (أقل من 10 طلاب بالشعبة):</span>
          </div>
          <ul class="space-y-1.5 text-xs pr-5 list-disc">
            <li v-for="(warn, wIdx) in previewResult.low_enrollment_warnings" :key="wIdx">
              <strong>{{ warn.class_name }} - {{ warn.section_name }}:</strong>
              <span> {{ warn.warning_message || `العدد المتوقع هو ${warn.students_count ?? warn.projected_count} طلاب فقط.` }}</span>
            </li>
          </ul>
        </div>

        <!-- 2.4 Administrative Execution Notes -->
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-5 space-y-2 shadow-xs">
          <label class="text-xs font-bold text-bx-title block">ملاحظات وقرار لجنة الترحيل السنوي (اختياري للتوثيق):</label>
          <textarea
            v-model="executionNotes"
            rows="2"
            placeholder="اكتب أية ملاحظات توثيقية إدارية خاصة بعملية الترحيل..."
            class="w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl p-3 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all"
          ></textarea>
        </div>

        <!-- 2.5 Automated System Actions Notice -->
        <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2.5">
          <Sparkles class="w-4 h-4 text-purple-600 shrink-0" />
          <div class="space-y-0.5">
            <span class="font-bold block">إجراءات النظام التلقائية عند الاعتماد:</span>
            <span class="text-[11px] leading-relaxed block text-purple-800 dark:text-purple-300">
              سيتم تفعيل السنة المستهدفة تلقائياً لتكون هي السنة النشطة في المدرسة، مع جعل <strong>الفصل الدراسي الأول</strong> هو الفصل النشط تلقائياً لكافة الصفوف.
            </span>
          </div>
        </div>

        <!-- 2.6 Mandatory Confirmation Checkbox -->
        <div class="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
          <input
            id="confirm-promotion"
            v-model="isConfirmed"
            type="checkbox"
            class="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          <label for="confirm-promotion" class="text-xs text-rose-800 dark:text-rose-200 cursor-pointer leading-relaxed">
            <strong>إقرار إداري ملزم:</strong> أقر بأنني راجعت نتائج المحاكاة وتوزيع الشعب بالكامل، وأتحمل مسؤولية ترحيل ونقل الطلاب المسكنين إلى العام الدراسي الجديد في معاملة ذرية غير قابلة للإلغاء المباشر.
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button
          type="button"
          class="px-5 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
          @click="emit('close')"
        >
          إلغاء
        </button>

        <button
          type="button"
          class="px-6 py-2.5 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!previewResult || !isConfirmed || isExecuting"
          @click="handleExecute"
        >
          <Loader2 v-if="isExecuting" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" />
          <span>{{ isExecuting ? 'جاري تنفيذ الترحيل...' : 'اعتماد وتنفيذ الترحيل السنوي وتسكين الفصول' }}</span>
        </button>
      </div>
    </template>
  </TaqniyaModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Sparkles,
  AlertTriangle,
  Loader2,
  GraduationCap,
  Users,
  Users2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
} from 'lucide-vue-next';
import TaqniyaModal from '../ui/TaqniyaModal.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../ui/TaqniyaSelect.vue';
import type {
  PromotionSimulationResult,
  ExecutePromotionDto,
  MatrixClassItem,
  MatrixSectionItem,
} from '../../api/promotion.api';

interface AcademicYearOption {
  id: number;
  name: string;
  is_active?: number | boolean;
}

interface Props {
  isOpen: boolean;
  academicYears: AcademicYearOption[];
  previewResult: PromotionSimulationResult | null;
  isPreviewLoading?: boolean;
  isExecuting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isPreviewLoading: false,
  isExecuting: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'preview', payload: { from_year_id: number; to_year_id: number; enable_annual_exam_compensation?: boolean }): void;
  (e: 'execute', payload: ExecutePromotionDto): void;
}>();

const fromYearId = ref<number | ''>('');
const toYearId = ref<number | ''>('');
const enableAnnualExamCompensation = ref(false);
const executionNotes = ref('');
const isConfirmed = ref(false);
const matrixSearch = ref('');

const yearOptions = computed<TaqniyaSelectOption[]>(() => {
  const list = Array.isArray(props.academicYears)
    ? props.academicYears
    : (props.academicYears as any)?.years || [];
  return list.map((y: any) => ({
    value: Number(y.id),
    label: `${y.name} ${Number(y.is_active) === 1 || y.is_active === true ? '(العام النشط)' : ''}`,
    subtext: Number(y.is_active) === 1 || y.is_active === true ? 'العام الأكاديمي النشط حالياً' : undefined,
  }));
});

watch(
  () => props.academicYears,
  (years) => {
    const list = Array.isArray(years) ? years : (years as any)?.years || [];
    if (!fromYearId.value && list.length > 0) {
      const activeYear = list.find((y: any) => Number(y.is_active) === 1 || y.is_active === true);
      if (activeYear) {
        fromYearId.value = Number(activeYear.id);
      }
    }
  },
  { immediate: true },
);

const canPreview = computed(() => {
  return fromYearId.value !== '' && toYearId.value !== '' && fromYearId.value !== toYearId.value;
});

// Matrix Sections List (X-Axis Columns)
const matrixSectionsList = computed(() => {
  if (props.previewResult?.sections_list && props.previewResult.sections_list.length > 0) {
    return props.previewResult.sections_list;
  }
  // Fallback default list of sections
  return [
    { id: 1, name: 'شعبة (أ)', code: 'SEC-280#' },
    { id: 2, name: 'شعبة (ب)', code: 'SEC-281#' },
    { id: 3, name: 'شعبة (ج)', code: 'SEC-282#' },
    { id: 4, name: 'شعبة (د)', code: 'SEC-283#' },
  ];
});

// Filtered Matrix Rows (Y-Axis Classes)
const filteredMatrixRows = computed<MatrixClassItem[]>(() => {
  const rows = props.previewResult?.sections_matrix || [];
  if (!matrixSearch.value.trim()) return rows;
  const q = matrixSearch.value.trim().toLowerCase();
  return rows.filter(
    (r) =>
      r.class_name.toLowerCase().includes(q) ||
      (r.stage_name && r.stage_name.toLowerCase().includes(q))
  );
});

// Helper to get cell data for a specific class row and section ID
const getCellData = (row: MatrixClassItem, sectionId: number): MatrixSectionItem | undefined => {
  return row.sections?.find((s) => s.section_id === sectionId);
};

// Count assigned sections for a class row
const getAssignedSectionsCount = (row: MatrixClassItem): number => {
  return (row.sections || []).filter((s) => s.is_assigned).length;
};

// Stage badge color helper matching Taqniya standard
const getStageBadgeClass = (stageName?: string): string => {
  if (!stageName) return 'border-[#B4AED8]/60 text-bx-muted bg-slate-500/10';
  if (stageName.includes('روضة') || stageName.includes('تمهيدي')) {
    return 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10';
  }
  if (stageName.includes('ابتدائي')) {
    return 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10';
  }
  if (stageName.includes('إعدادي')) {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
  }
  if (stageName.includes('ثانوي')) {
    return 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10';
  }
  return 'border-[#B4AED8]/60 text-bx-muted bg-slate-500/10';
};

const runPreview = () => {
  if (!canPreview.value) return;
  emit('preview', {
    from_year_id: Number(fromYearId.value),
    to_year_id: Number(toYearId.value),
    enable_annual_exam_compensation: enableAnnualExamCompensation.value,
  });
};

const handleExecute = () => {
  if (!canPreview.value || !isConfirmed.value) return;
  emit('execute', {
    from_academic_year_id: Number(fromYearId.value),
    to_academic_year_id: Number(toYearId.value),
    enable_annual_exam_compensation: enableAnnualExamCompensation.value,
    execution_notes: executionNotes.value || 'تم تنفيذ الترحيل الأكاديمي السنوي بنجاح.',
  });
};
</script>
