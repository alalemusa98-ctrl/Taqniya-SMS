<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    :title="drawerTitle"
    :subtitle="drawerSubtitle"
    :icon="GraduationCap"
    max-width="max-w-[920px]"
    @close="emit('close')"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-bx-muted" dir="rtl">
      <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
      <span class="text-xs font-bold">جاري تحميل وتدقيق بيانات الكشف الأكاديمي الرسمي...</span>
    </div>

    <div v-else-if="activeTranscript" class="space-y-6 text-bx-text font-sans" dir="rtl">
      <!-- Printable Sheet Wrapper -->
      <div
        id="official-transcript-document"
        class="bg-[var(--bx-surface-solid)] border border-[#B4AED8]/50 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm print:shadow-none print:border-none print:p-0 print:bg-white print:text-black"
      >
        <!-- Ministry & Official School Header -->
        <div class="flex items-center justify-between gap-4 border-b border-[#B4AED8]/40 dark:border-white/[0.08] pb-5">
          <div class="space-y-1">
            <h2 class="text-lg sm:text-xl font-black text-bx-title font-display tracking-tight print:text-black">
              منظومة تقنية لإدارة المدارس والتعليم الأساسي
            </h2>
            <p class="text-xs text-bx-muted font-medium print:text-gray-600">
              إدارة القياس والتقويم الأكاديمي وشؤون الطلاب — السجل الأكاديمي الرسمي
            </p>
          </div>

          <div class="flex flex-col items-end gap-1.5 shrink-0">
            <!-- Dynamic Transcript Type Badge -->
            <span
              v-if="isAnnualTranscript"
              class="px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 print:border-black print:text-black"
              :class="isAnnualComplete ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'"
            >
              <Award class="w-3.5 h-3.5" />
              <span>{{ isAnnualComplete ? 'صحيفة سنوية نهائية معتمدة' : 'صحيفة سنوية (قيد استكمال الفصول)' }}</span>
            </span>
            <span
              v-else
              class="px-3 py-1 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black print:border-black print:text-black flex items-center gap-1.5"
            >
              <Calendar class="w-3.5 h-3.5" />
              <span>صحيفة فصلية: {{ activeTranscript.term_name || 'الفصل الدراسي الأول' }}</span>
            </span>

            <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 print:text-gray-600">
              <Lock class="w-3 h-3" />
              <span>سجل رسمي محفوظ ومُجمد</span>
            </span>
          </div>
        </div>

        <!-- Student Meta Information Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-[#B4AED8]/30 dark:border-white/[0.04] text-xs">
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">اسم الطالب الرباعي:</span>
            <span class="font-black text-bx-title print:text-black">{{ activeTranscript.student_name }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">كود الطالب:</span>
            <span class="font-bold font-mono text-bx-title print:text-black">{{ activeTranscript.student_code }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">الرقم الوطني / الهوية:</span>
            <span class="font-bold font-mono text-bx-title print:text-black">{{ activeTranscript.national_id || '—' }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">الصف والشعبة:</span>
            <span class="font-bold text-bx-title print:text-black">{{ activeTranscript.class_name }} - {{ activeTranscript.section_name }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">العام الدراسي:</span>
            <span class="font-bold text-bx-title print:text-black">{{ activeTranscript.academic_year_name }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-bx-muted block">الفصل الدراسي:</span>
            <span
              class="font-black print:text-black"
              :class="isAnnualTranscript ? 'text-purple-600 dark:text-purple-400' : 'text-sky-600 dark:text-sky-400'"
            >
              {{ isAnnualTranscript ? 'كامل العام (كافة الفصول)' : (activeTranscript.term_name || 'الفصل الدراسي الأول') }}
            </span>
          </div>
          <div class="col-span-2 sm:col-span-1 lg:col-span-2">
            <span class="text-[10px] font-bold text-bx-muted block">نوع الوثيقة الأكاديمية:</span>
            <span class="font-bold print:text-black" :class="isAnnualTranscript ? 'text-purple-600 dark:text-purple-400' : 'text-sky-600 dark:text-sky-400'">
              {{ isAnnualTranscript ? 'صحيفة سنوية مجمعة لنهاية العام' : `كشف درجات معتمد (${activeTranscript.term_name || 'الفصل الدراسي الأول'})` }}
            </span>
          </div>
        </div>

        <!-- WARNING BANNER: If Annual Transcript but not all terms are completed -->
        <div
          v-if="isAnnualTranscript && !isAnnualComplete"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in"
        >
          <div class="flex items-center gap-2 font-black text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0" />
            <span>تنبيه إداري: لم يكتمل رصد درجات كافة الفصول المقررة لهذا الصف</span>
          </div>
          <p class="text-xs leading-relaxed font-medium">
            الصف الدراسي <strong>({{ activeTranscript.class_name }})</strong> يحتوي على
            <strong>{{ termCompletionInfo?.total_required_terms || 2 }}</strong> فصول دراسية، بينما تم رصد
            <strong>{{ termCompletionInfo?.graded_terms_count || 1 }}</strong> فصل دراسي فقط حتى الآن.
            <span v-if="termCompletionInfo?.missing_terms && termCompletionInfo.missing_terms.length > 0" class="block mt-1 font-bold">
              الفصول المتبقية قيد الرصد: {{ termCompletionInfo.missing_terms.join('، ') }}.
            </span>
            <span class="block text-[11px] text-amber-700 dark:text-amber-300 mt-1">
              ⚠️ لا تعتبر هذه الصحيفة نهائية أو صالحة لاعتماد الترحيل والترفيع السنوي إلا بعد رصد وتجميد كافة الفصول المقررة.
            </span>
          </p>
        </div>

        <!-- MODE 1: TERM TRANSCRIPT TABLE (الصحيفة الفصلية) -->
        <div v-if="!isAnnualTranscript" class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black text-bx-title flex items-center gap-1.5 print:text-black">
              <BookOpen class="w-4 h-4 text-bx-primary" />
              <span>جدول رصد درجات المواد الدراسية — {{ activeTranscript.term_name || 'الفصل الدراسي الأول' }}:</span>
            </h4>
            <span class="text-[11px] font-bold text-bx-muted">
              عدد المواد المرصودة: {{ termSubjectsList.length }} مادة
            </span>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] print:border-black">
            <table class="w-full text-right text-xs border-collapse">
              <thead>
                <tr class="bg-black/[0.03] dark:bg-white/[0.03] text-bx-muted font-bold border-b border-[#B4AED8]/40 dark:border-white/[0.08] print:bg-gray-100 print:text-black">
                  <th class="py-3 px-3 text-center w-12 border-l border-[#B4AED8]/30 dark:border-white/[0.06]">#</th>
                  <th class="py-3 px-4 border-l border-[#B4AED8]/30 dark:border-white/[0.06] min-w-[160px]">المادة الدراسية</th>
                  <th class="py-3 px-3 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06] min-w-[100px]">أعمال السنة</th>
                  <th class="py-3 px-3 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06] min-w-[100px]">الامتحان النهائي</th>
                  <th class="py-3 px-3 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06] min-w-[90px]">مجموع الفصل</th>
                  <th class="py-3 px-3 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06] min-w-[90px]">النهاية الكبرى</th>
                  <th class="py-3 px-3 text-center min-w-[90px]">النتيجة</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#B4AED8]/30 dark:divide-white/[0.04]">
                <tr
                  v-for="(subj, sIdx) in termSubjectsList"
                  :key="sIdx"
                  class="hover:bg-bx-primary/5 transition-colors print:hover:bg-transparent"
                >
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted border-l border-[#B4AED8]/20 dark:border-white/[0.04]">{{ sIdx + 1 }}</td>
                  <td class="py-2.5 px-4 font-bold text-bx-title border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-black">
                    {{ subj.subject_name }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono border-l border-[#B4AED8]/20 dark:border-white/[0.04] text-bx-title print:text-black">
                    <span class="font-bold">{{ subj.coursework_score !== undefined ? subj.coursework_score : '—' }}</span>
                    <span v-if="subj.max_coursework_score" class="text-[10px] text-bx-muted"> / {{ subj.max_coursework_score }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono border-l border-[#B4AED8]/20 dark:border-white/[0.04] text-bx-title print:text-black">
                    <span class="font-bold">{{ subj.exam_score !== undefined ? subj.exam_score : '—' }}</span>
                    <span v-if="subj.max_exam_score" class="text-[10px] text-bx-muted"> / {{ subj.max_exam_score }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-center font-black font-mono text-bx-title border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-black">
                    {{ subj.total_score }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-gray-600">
                    {{ subj.max_score }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      :class="subj.is_passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'"
                    >
                      {{ subj.is_passed ? 'ناجح' : 'راسب' }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <!-- Term Table Footer -->
              <tfoot>
                <tr class="bg-black/[0.03] dark:bg-white/[0.03] font-bold text-xs border-t-2 border-[#B4AED8] dark:border-white/[0.12] print:bg-gray-100 print:text-black">
                  <td colspan="4" class="py-3 px-4 text-left font-black text-bx-title print:text-black">
                    مجموع درجات الفصل والنسبة المئوية:
                  </td>
                  <td class="py-3 px-3 text-center font-mono font-black text-bx-title text-sm print:text-black">
                    {{ activeTranscript.total_score }}
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-bx-muted print:text-gray-600">
                    {{ activeTranscript.max_possible_score || termCalculatedMax }}
                  </td>
                  <td class="py-3 px-3 text-center">
                    <span class="font-black font-mono text-sky-600 dark:text-sky-400 text-sm print:text-black">
                      {{ activeTranscript.percentage }}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- MODE 2: ANNUAL MULTI-TERM TRANSCRIPT TABLE (الصحيفة السنوية المجمعة) -->
        <div v-else class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black text-bx-title flex items-center gap-1.5 print:text-black">
              <BookOpen class="w-4 h-4 text-purple-600" />
              <span>جدول رصد درجات المواد عبر الفصول الدراسية للسنة كاملة:</span>
            </h4>
            <span class="text-[11px] font-bold text-bx-muted">
              {{ renderedAnnualTerms.length }} فصول دراسية
            </span>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-[#B4AED8]/50 dark:border-white/[0.08] bg-[var(--bx-surface-solid)] print:border-black">
            <table class="w-full text-right text-xs border-collapse">
              <thead>
                <!-- Top Header Row -->
                <tr class="bg-black/[0.03] dark:bg-white/[0.03] text-bx-muted font-bold border-b border-[#B4AED8]/40 dark:border-white/[0.08] print:bg-gray-100 print:text-black">
                  <th rowspan="2" class="py-3 px-3 border-l border-[#B4AED8]/30 dark:border-white/[0.06] text-center w-10">#</th>
                  <th rowspan="2" class="py-3 px-4 border-l border-[#B4AED8]/30 dark:border-white/[0.06] min-w-[150px]">المادة الدراسية</th>

                  <!-- Dynamic Term Headers (3 columns each: Coursework, Exam, Total) -->
                  <th
                    v-for="term in renderedAnnualTerms"
                    :key="term.id"
                    colspan="3"
                    class="py-2.5 px-3 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06] font-black text-bx-title bg-purple-500/5 print:bg-gray-100 print:text-black"
                  >
                    {{ term.name }}
                  </th>

                  <th rowspan="2" class="py-3 px-3 border-l border-[#B4AED8]/30 dark:border-white/[0.06] text-center min-w-[90px]">المجموع النهائي</th>
                  <th rowspan="2" class="py-3 px-3 border-l border-[#B4AED8]/30 dark:border-white/[0.06] text-center min-w-[90px]">النهاية الكبرى</th>
                  <th rowspan="2" class="py-3 px-3 text-center min-w-[80px]">النتيجة</th>
                </tr>

                <!-- Sub-Headers for each Term (Coursework, Exam, Term Total) -->
                <tr class="bg-black/[0.02] dark:bg-white/[0.02] text-bx-muted font-semibold text-[11px] border-b border-[#B4AED8]/40 dark:border-white/[0.08] print:bg-gray-50 print:text-black">
                  <template v-for="term in renderedAnnualTerms" :key="`sub-${term.id}`">
                    <th class="py-2 px-2 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06]">أعمال السنة</th>
                    <th class="py-2 px-2 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06]">الامتحان</th>
                    <th class="py-2 px-2 text-center border-l border-[#B4AED8]/30 dark:border-white/[0.06] font-bold text-bx-title">المجموع</th>
                  </template>
                </tr>
              </thead>

              <tbody class="divide-y divide-[#B4AED8]/30 dark:divide-white/[0.04]">
                <tr
                  v-for="(subj, sIdx) in annualProcessedSubjects"
                  :key="subj.subject_name"
                  class="hover:bg-purple-500/5 transition-colors print:hover:bg-transparent"
                >
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted border-l border-[#B4AED8]/20 dark:border-white/[0.04]">{{ sIdx + 1 }}</td>
                  <td class="py-2.5 px-4 font-bold text-bx-title border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-black">
                    {{ subj.subject_name }}
                  </td>

                  <!-- Term Scores (Coursework, Exam, Total) -->
                  <template v-for="term in renderedAnnualTerms" :key="`val-${term.id}`">
                    <td class="py-2 px-2 text-center font-mono border-l border-[#B4AED8]/20 dark:border-white/[0.04] text-bx-title print:text-black">
                      <span v-if="subj.terms[term.id] && subj.terms[term.id].coursework_score !== undefined">
                        {{ subj.terms[term.id].coursework_score }}
                      </span>
                      <span v-else class="text-amber-500 text-[10px]">—</span>
                    </td>
                    <td class="py-2 px-2 text-center font-mono border-l border-[#B4AED8]/20 dark:border-white/[0.04] text-bx-title print:text-black">
                      <span v-if="subj.terms[term.id] && subj.terms[term.id].exam_score !== undefined">
                        {{ subj.terms[term.id].exam_score }}
                      </span>
                      <span v-else class="text-amber-500 text-[10px]">—</span>
                    </td>
                    <td class="py-2 px-2 text-center font-mono font-bold border-l border-[#B4AED8]/20 dark:border-white/[0.04] text-bx-primary print:text-black">
                      <span v-if="subj.terms[term.id] && subj.terms[term.id].total_score !== undefined">
                        {{ subj.terms[term.id].total_score }}
                      </span>
                      <span v-else class="text-amber-500 text-[10px]">—</span>
                    </td>
                  </template>

                  <!-- Final Totals for Subject (Summed across terms) -->
                  <td class="py-2.5 px-3 text-center font-black font-mono text-bx-title border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-black">
                    {{ subj.total_score }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted border-l border-[#B4AED8]/20 dark:border-white/[0.04] print:text-gray-600">
                    {{ subj.max_score }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      :class="subj.is_passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'"
                    >
                      {{ subj.is_passed ? 'ناجح' : 'راسب' }}
                    </span>
                  </td>
                </tr>
              </tbody>

              <!-- Annual Footer -->
              <tfoot>
                <tr class="bg-black/[0.03] dark:bg-white/[0.03] font-bold text-xs border-t-2 border-[#B4AED8] dark:border-white/[0.12] print:bg-gray-100 print:text-black">
                  <td :colspan="2 + (renderedAnnualTerms.length * 3)" class="py-3 px-4 text-left font-black text-bx-title print:text-black">
                    المجموع السنوي العام والنسبة المئوية:
                  </td>
                  <td class="py-3 px-3 text-center font-mono font-black text-bx-title text-sm print:text-black">
                    {{ annualCalculatedTotal || activeTranscript.total_score }}
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-bx-muted print:text-gray-600">
                    {{ annualCalculatedMax || activeTranscript.max_possible_score }}
                  </td>
                  <td class="py-3 px-3 text-center">
                    <span class="font-black font-mono text-purple-600 dark:text-purple-400 text-sm print:text-black">
                      {{ annualCalculatedPercentage }}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Academic Decision Banner -->
        <div
          class="p-4 rounded-2xl border flex items-center justify-between gap-4"
          :class="decisionBannerClass"
        >
          <div class="space-y-0.5">
            <span class="text-[11px] font-bold opacity-80 block">
              {{ isAnnualTranscript ? 'القرار السنوي النهائي للجنة الامتحانات والتقويم:' : 'الحالة الأكاديمية للفصل الدراسي:' }}
            </span>
            <span class="text-sm sm:text-base font-black">{{ decisionArabicText }}</span>
          </div>

          <div v-if="activeTranscript.calculated_rank || activeTranscript.rank" class="text-left shrink-0">
            <span class="text-[10px] font-bold opacity-80 block">الترتيب العام:</span>
            <span class="text-sm sm:text-base font-black font-mono">المركز {{ activeTranscript.calculated_rank || activeTranscript.rank }}</span>
          </div>
        </div>

        <!-- SECOND ROUND SCORING & EVALUATION PANEL -->
        <div
          v-if="isAnnualTranscript && activeTranscript.final_status === 'second_round' && secondRoundFailingSubjects.length > 0"
          class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-bx-text space-y-4 shadow-sm"
        >
          <div class="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <div class="flex items-center gap-2">
              <Award class="w-5 h-5 text-amber-600" />
              <div>
                <h4 class="text-xs font-black text-amber-900 dark:text-amber-200">
                  رصد درجات امتحانات الدور الثاني (Second Round Grade Entry)
                </h4>
                <p class="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  إدخال درجات امتحانات الملاحق للمواد الراسبة وإعادة احتساب قرار الترفيع السنوي
                </p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200">
              {{ secondRoundFailingSubjects.length }} مواد متبقية
            </span>
          </div>

          <!-- Second Round Mode & Capping Controls -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--bx-surface-solid)] p-3.5 rounded-xl border border-amber-500/20">
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-bx-title block">نمط احتساب درجة الدور الثاني:</label>
              <div class="flex items-center gap-3 text-xs">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value="replace_exam"
                    v-model="srMode"
                    class="text-purple-600 accent-purple-600"
                  />
                  <span>استبدال الامتحان فقط (أعمال السنة ثابتة)</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value="full_score"
                    v-model="srMode"
                    class="text-purple-600 accent-purple-600"
                  />
                  <span>المادة كاملة (100%)</span>
                </label>
              </div>
            </div>

            <div class="flex items-center">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="srCapScore"
                  class="w-4 h-4 rounded text-purple-600 accent-purple-600"
                />
                <span class="text-xs font-bold text-bx-title">
                  سقف درجة النجاح عند 50% (Passing Score Cap)
                </span>
              </label>
            </div>
          </div>

          <!-- Failed Subjects Table Inputs -->
          <div class="overflow-x-auto rounded-xl border border-amber-500/20 bg-[var(--bx-surface-solid)]">
            <table class="w-full text-right text-xs border-collapse">
              <thead>
                <tr class="bg-amber-500/5 text-bx-muted font-bold border-b border-amber-500/20">
                  <th class="py-2.5 px-3">المادة الدراسية</th>
                  <th class="py-2.5 px-3 text-center">أعمال السنة السابقة</th>
                  <th class="py-2.5 px-3 text-center">درجة امتحان الدور الثاني</th>
                  <th class="py-2.5 px-3 text-center">النهاية الكبرى</th>
                  <th class="py-2.5 px-3 text-center">صغرى النجاح</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-amber-500/10">
                <tr v-for="s in secondRoundFailingSubjects" :key="s.subject_name">
                  <td class="py-2.5 px-3 font-bold text-bx-title">
                    {{ s.subject_name }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted">
                    {{ srMode === 'replace_exam' ? (s.coursework_score ?? '—') : 'ملغاة (0)' }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <div class="inline-flex items-center gap-1 justify-center">
                      <input
                        v-model.number="srGrades[s.subject_name]"
                        type="number"
                        min="0"
                        :max="srMode === 'replace_exam' ? (s.max_exam_score || 60) : (s.max_score || 100)"
                        step="0.5"
                        placeholder="الدرجة"
                        class="w-20 bg-[var(--bx-surface-solid)] border border-amber-500/40 rounded-lg p-1.5 text-center font-mono font-bold text-xs outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                      <span class="text-[10px] text-bx-muted">
                        / {{ srMode === 'replace_exam' ? (s.max_exam_score || 60) : (s.max_score || 100) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted">
                    {{ s.max_score || 100 }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-bx-muted">
                    {{ s.passing_score || 50 }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Submit Button -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-90 text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              :disabled="isSavingSecondRound"
              @click="handleSaveSecondRound"
            >
              <Loader2 v-if="isSavingSecondRound" class="w-4 h-4 animate-spin" />
              <Award v-else class="w-4 h-4" />
              <span>{{ isSavingSecondRound ? 'جاري الحفظ وإعادة الاحتساب...' : 'حفظ واعتماد نتيجة الدور الثاني' }}</span>
            </button>
          </div>
        </div>

        <!-- Official Signatures & Seal Box -->
        <div class="grid grid-cols-3 gap-4 pt-4 border-t border-[#B4AED8]/30 dark:border-white/[0.06] text-center text-xs text-bx-muted">
          <div class="space-y-6">
            <span class="font-bold text-bx-title block print:text-black">مسؤول شؤون الطلاب</span>
            <span class="block text-bx-muted font-mono">................................</span>
          </div>

          <div class="flex flex-col items-center justify-center">
            <div class="w-20 h-20 rounded-full border-2 border-dashed border-[#B4AED8] dark:border-white/[0.2] flex items-center justify-center p-2 text-center text-[10px] text-bx-muted print:border-black print:text-black">
              <span>ختم المدرسة والاعتماد</span>
            </div>
          </div>

          <div class="space-y-6">
            <span class="font-bold text-bx-title block print:text-black">مدير المدرسة</span>
            <span class="block text-bx-muted font-mono">................................</span>
          </div>
        </div>

        <!-- Sheet Timestamp Footer -->
        <div class="flex items-center justify-between text-[10px] text-bx-muted pt-2 border-t border-[#B4AED8]/20 dark:border-white/[0.04]">
          <span>تاريخ التجميد والإصدار: {{ formatDate(activeTranscript.created_at) }}</span>
          <span class="font-mono">TRN-{{ activeTranscript.id }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-2">
        <button
          type="button"
          class="px-4 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
          @click="emit('close')"
        >
          إغلاق
        </button>

        <button
          type="button"
          class="px-5 py-2.5 rounded-full bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          @click="handlePrint"
        >
          <Printer class="w-4 h-4" />
          <span>طباعة الشهادة الرسمية</span>
        </button>
      </div>
    </div>
  </TaqniyaDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  GraduationCap,
  BookOpen,
  Lock,
  Printer,
  Loader2,
  AlertTriangle,
  Award,
  Calendar,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import {
  promotionApi,
  type StudentTranscript,
  type TermCompletionInfo,
} from '../../api/promotion.api';
import { gradeEntryApi } from '../../api/grade-entry.api';
import { useToast } from '../../composables/useToast';

interface Props {
  isOpen: boolean;
  transcript: StudentTranscript | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', transcript: any): void;
}>();

const toast = useToast();
const isLoading = ref(false);
const isSavingSecondRound = ref(false);
const detailedTranscript = ref<StudentTranscript | null>(null);

const srMode = ref<'replace_exam' | 'full_score'>('replace_exam');
const srCapScore = ref(true);
const srGrades = ref<Record<string, number>>({});

const activeTranscript = computed<StudentTranscript | null>(() => {
  return detailedTranscript.value || props.transcript;
});

const isAnnualTranscript = computed(() => {
  return activeTranscript.value?.transcript_type === 'annual';
});

const termCompletionInfo = computed<TermCompletionInfo | undefined>(() => {
  return activeTranscript.value?.term_completion;
});

const isAnnualComplete = computed(() => {
  if (!isAnnualTranscript.value) return true;
  if (termCompletionInfo.value) {
    return termCompletionInfo.value.is_annual_complete;
  }
  return true;
});

const secondRoundFailingSubjects = computed(() => {
  if (!activeTranscript.value || !isAnnualTranscript.value) return [];
  const rawData = activeTranscript.value.transcript_data;
  const subjects: any[] = rawData?.subjects || [];
  return subjects.filter((s) => s.status === 'failed' || s.is_passed === false);
});

const handleSaveSecondRound = async () => {
  if (!activeTranscript.value?.id) return;
  isSavingSecondRound.value = true;
  try {
    const gradesPayload = Object.entries(srGrades.value).map(([subject_name, second_round_exam_score]) => ({
      subject_name,
      second_round_exam_score: Number(second_round_exam_score) || 0,
    }));

    const res = await gradeEntryApi.recordSecondRoundGrades({
      transcript_id: Number(activeTranscript.value.id),
      second_round_mode: srMode.value,
      cap_passing_score: srCapScore.value,
      second_round_grades: gradesPayload,
    });

    if (res.success) {
      toast.success('تم رصد درجات الدور الثاني بنجاح', res.message);
      detailedTranscript.value = {
        ...activeTranscript.value,
        ...res.data,
      };
      emit('updated', res.data);
    }
  } catch (err: any) {
    toast.error('فشل رصد الدور الثاني', err.response?.data?.message || 'حدث خطأ أثناء رصد درجات الدور الثاني.');
  } finally {
    isSavingSecondRound.value = false;
  }
};

const drawerTitle = computed(() => {
  if (!activeTranscript.value) return 'كشف الدرجات والنتائج الأكاديمية';
  if (isAnnualTranscript.value) {
    return 'الصحيفة السنوية المجمعة وكشف النتائج النهائي';
  }
  return `كشف درجات الفصل الدراسي (${activeTranscript.value.term_name || activeTranscript.value.transcript_type_ar || 'الفصل الدراسي'})`;
});

const drawerSubtitle = computed(() => {
  if (!activeTranscript.value) return '';
  return `${activeTranscript.value.student_name} • ${activeTranscript.value.class_name} (${activeTranscript.value.section_name}) • ${activeTranscript.value.academic_year_name}`;
});

// Watch open state and load full transcript details
watch(
  () => [props.isOpen, props.transcript?.id],
  async () => {
    if (!props.isOpen || !props.transcript?.id) {
      detailedTranscript.value = null;
      return;
    }

    isLoading.value = true;
    try {
      const res = await promotionApi.getTranscriptById(props.transcript.id);
      if (res.success && res.data) {
        detailedTranscript.value = res.data;
      } else {
        detailedTranscript.value = props.transcript;
      }
    } catch (err) {
      console.error('Failed to load full transcript details:', err);
      detailedTranscript.value = props.transcript;
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true },
);

// Term subjects list (for Term Transcript View)
interface ProcessedTermSubject {
  subject_name: string;
  coursework_score?: number;
  max_coursework_score?: number;
  exam_score?: number;
  max_exam_score?: number;
  total_score: number;
  max_score: number;
  is_passed: boolean;
}

const termSubjectsList = computed<ProcessedTermSubject[]>(() => {
  if (!activeTranscript.value) return [];
  const rawData = activeTranscript.value.transcript_data;
  const subjects: any[] = rawData?.subjects || rawData?.subject_scores || [];

  return subjects.map((s, idx) => {
    const name = s.subject_name || `المادة ${idx + 1}`;
    const maxScore = Number(s.max_score) || 100;
    const cScore = s.coursework_score !== undefined ? Number(s.coursework_score) : undefined;
    const eScore = s.exam_score !== undefined ? Number(s.exam_score) : undefined;
    const tScore = Number(s.total_score) !== undefined ? Number(s.total_score) : ((cScore || 0) + (eScore || 0));
    const passingScore = Number(s.passing_score) || maxScore * 0.5;

    return {
      subject_name: name,
      coursework_score: cScore,
      max_coursework_score: s.max_coursework_score || Number((maxScore * 0.4).toFixed(0)),
      exam_score: eScore,
      max_exam_score: s.max_exam_score || Number((maxScore * 0.6).toFixed(0)),
      total_score: tScore,
      max_score: maxScore,
      is_passed: s.status ? s.status === 'passed' : tScore >= passingScore,
    };
  });
});

const termCalculatedMax = computed(() => {
  return termSubjectsList.value.reduce((sum, s) => sum + s.max_score, 0);
});

// Annual Terms & Subjects (for Annual Multi-term View)
interface AnnualTermColumn {
  id: string | number;
  name: string;
}

interface ProcessedAnnualSubjectItem {
  subject_name: string;
  terms: Record<
    string | number,
    {
      coursework_score?: number;
      exam_score?: number;
      total_score?: number;
      max_score?: number;
    }
  >;
  total_score: number;
  max_score: number;
  is_passed: boolean;
}

const renderedAnnualTerms = computed<AnnualTermColumn[]>(() => {
  if (termCompletionInfo.value?.required_terms && termCompletionInfo.value.required_terms.length > 0) {
    return termCompletionInfo.value.required_terms.map((t) => ({
      id: t.id,
      name: t.name,
    }));
  }

  const studentTerms = activeTranscript.value?.student_term_transcripts;
  if (studentTerms && studentTerms.length > 0) {
    return studentTerms.map((st, idx) => ({
      id: st.class_academic_term_id || st.id || `term_${idx + 1}`,
      name: st.term_name || `الفصل ${idx + 1}`,
    }));
  }

  return [
    { id: 1, name: 'الفصل الدراسي الأول' },
    { id: 2, name: 'الفصل الدراسي الثاني' },
  ];
});

const annualProcessedSubjects = computed<ProcessedAnnualSubjectItem[]>(() => {
  if (!activeTranscript.value) return [];

  const studentTerms = activeTranscript.value.student_term_transcripts || [];

  // If student has multiple term transcripts, merge across them
  if (studentTerms.length > 0) {
    const subjectMap = new Map<string, ProcessedAnnualSubjectItem>();

    for (const st of studentTerms) {
      const termId = st.class_academic_term_id || st.id;
      const subjects: any[] = st.transcript_data?.subjects || st.transcript_data?.subject_scores || [];

      for (const s of subjects) {
        const name = s.subject_name || 'مادة';
        if (!subjectMap.has(name)) {
          subjectMap.set(name, {
            subject_name: name,
            terms: {},
            total_score: 0,
            max_score: 0,
            is_passed: true,
          });
        }

        const item = subjectMap.get(name)!;
        const cScore = s.coursework_score !== undefined ? Number(s.coursework_score) : undefined;
        const eScore = s.exam_score !== undefined ? Number(s.exam_score) : undefined;
        const tScore = Number(s.total_score) || ((cScore || 0) + (eScore || 0));
        const mScore = Number(s.max_score) || 100;

        item.terms[termId] = {
          coursework_score: cScore,
          exam_score: eScore,
          total_score: tScore,
          max_score: mScore,
        };
      }
    }

    return Array.from(subjectMap.values()).map((item) => {
      let sum = 0;
      let maxSum = 0;
      for (const tVal of Object.values(item.terms)) {
        if (tVal.total_score !== undefined) {
          sum += tVal.total_score;
          maxSum += tVal.max_score || 100;
        }
      }
      const finalScore = Number(sum.toFixed(1));
      const totalMax = maxSum > 0 ? maxSum : 100;
      const passingScore = totalMax * 0.5;

      return {
        ...item,
        total_score: finalScore,
        max_score: totalMax,
        is_passed: finalScore >= passingScore,
      };
    });
  }

  // Fallback: direct subjects from transcript_data
  const rawData = activeTranscript.value.transcript_data;
  const directSubjects: any[] = rawData?.subjects || rawData?.subject_scores || [];

  return directSubjects.map((s, idx) => {
    const name = s.subject_name || `المادة ${idx + 1}`;
    const maxScore = Number(s.max_score) || 100;
    const cScore = s.coursework_score !== undefined ? Number(s.coursework_score) : undefined;
    const eScore = s.exam_score !== undefined ? Number(s.exam_score) : undefined;
    const tScore = Number(s.total_score) || ((cScore || 0) + (eScore || 0));
    const passingScore = Number(s.passing_score) || maxScore * 0.5;

    const firstTermId = renderedAnnualTerms.value[0]?.id || 1;

    return {
      subject_name: name,
      terms: {
        [firstTermId]: {
          coursework_score: cScore,
          exam_score: eScore,
          total_score: tScore,
          max_score: maxScore,
        },
      },
      total_score: tScore,
      max_score: maxScore,
      is_passed: tScore >= passingScore,
    };
  });
});

const annualCalculatedTotal = computed(() => {
  return annualProcessedSubjects.value.reduce((sum, s) => sum + s.total_score, 0);
});

const annualCalculatedMax = computed(() => {
  return annualProcessedSubjects.value.reduce((sum, s) => sum + s.max_score, 0);
});

const annualCalculatedPercentage = computed(() => {
  if (annualCalculatedMax.value > 0) {
    return Number(((annualCalculatedTotal.value / annualCalculatedMax.value) * 100).toFixed(2));
  }
  return activeTranscript.value?.percentage || 0;
});

const decisionArabicText = computed(() => {
  if (isAnnualTranscript.value && !isAnnualComplete.value) {
    return 'قيد استكمال الفصول الدراسية (لا يوجد قرار ترفيع سنوي حتى اكتمال رصد كافة الفصول)';
  }

  const status = activeTranscript.value?.final_status;
  switch (status) {
    case 'passed':
      return isAnnualTranscript.value ? 'ناجح ومرحل إلى الصف التالي' : 'ناجح في الفصل الدراسي';
    case 'second_round':
      return 'له حق دخول امتحانات الدور الثاني';
    case 'failed':
      return isAnnualTranscript.value ? 'باقٍ للإعادة في نفس الصف الدراسي' : 'راسب في الفصل الدراسي';
    case 'graduated':
      return 'ناجح ومتخرج رسمياً من المرحلة التعليمية';
    default:
      return status || '—';
  }
});

const decisionBannerClass = computed(() => {
  if (isAnnualTranscript.value && !isAnnualComplete.value) {
    return 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30';
  }

  const status = activeTranscript.value?.final_status;
  switch (status) {
    case 'passed':
    case 'graduated':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'second_round':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'failed':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
    default:
      return 'bg-bx-surface-2 text-bx-title border-bx-border';
  }
});

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const handlePrint = () => {
  window.print();
};
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden !important;
  }
  #official-transcript-document,
  #official-transcript-document * {
    visibility: visible !important;
  }
  #official-transcript-document {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    background: white !important;
    color: black !important;
  }
}
</style>
