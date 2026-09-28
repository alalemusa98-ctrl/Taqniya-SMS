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

          <div class="overflow-x-auto rounded-2xl border-2 border-[#8c8275]/40 dark:border-white/10 bg-[var(--bx-surface-solid)] shadow-sm print:border-black print:rounded-none">
            <table class="w-full text-center text-xs border-collapse border border-[#8c8275]/40 dark:border-white/10 print:border-black print:text-black">
              <thead>
                <tr class="font-bold text-xs border-b-2 border-[#8c8275]/60 dark:border-white/20 print:border-black">
                  <th class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdebd0] dark:bg-amber-950/40 text-gray-900 dark:text-amber-100 font-black min-w-[150px] align-middle print:bg-[#fdebd0] print:text-black">
                    المواد الدراسية المقررة
                  </th>
                  <th class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[120px] align-middle print:bg-[#fdf2e9] print:text-black">
                    التفاصيل
                  </th>
                  <th class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[90px] align-middle print:bg-[#fdf2e9] print:text-black">
                    الدرجة المقررة
                  </th>
                  <th class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[90px] align-middle print:bg-[#fdf2e9] print:text-black">
                    درجة التلميذ
                  </th>
                  <th class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#ebf5fb] dark:bg-sky-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[80px] align-middle print:bg-[#ebf5fb] print:text-black">
                    النهاية الكبرى
                  </th>
                  <th class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#eafaf1] dark:bg-emerald-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[80px] align-middle print:bg-[#eafaf1] print:text-black">
                    النهاية الصغرى
                  </th>
                  <th class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#eafaf1] dark:bg-emerald-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[80px] align-middle print:bg-[#eafaf1] print:text-black">
                    النتيجة
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="subj in termSubjectsList" :key="subj.subject_name">
                  <!-- Row 1: الأعمال -->
                  <tr class="border-t border-[#8c8275]/40 dark:border-white/10 print:border-black">
                    <td rowspan="3" class="py-2.5 px-3 font-bold text-gray-900 dark:text-white border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle text-sm print:text-black print:bg-white">
                      {{ subj.subject_name }}
                    </td>
                    <td class="py-2 px-2.5 font-medium text-gray-800 dark:text-gray-200 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      الأعمال
                    </td>
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.max_coursework_score }}
                    </td>
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.coursework_score !== undefined ? subj.coursework_score : '—' }}
                    </td>
                    <td rowspan="3" class="py-2 px-2 font-black font-mono text-gray-900 dark:text-white border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle text-sm print:text-black print:bg-white">
                      {{ subj.max_score }}
                    </td>
                    <td rowspan="3" class="py-2 px-2 font-black font-mono text-gray-900 dark:text-white border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle text-sm print:text-black print:bg-white">
                      {{ subj.passing_score }}
                    </td>
                    <td rowspan="3" class="py-2 px-2 font-bold border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-bold"
                        :class="subj.is_passed ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 border border-rose-500/30'"
                      >
                        {{ subj.is_passed ? 'ناجح' : 'راسب' }}
                      </span>
                    </td>
                  </tr>
                  <!-- Row 2: امتحان نهاية الفصل -->
                  <tr class="border-t border-[#8c8275]/30 dark:border-white/5 print:border-black">
                    <td class="py-2 px-2.5 font-medium text-gray-800 dark:text-gray-200 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      امتحان نهاية الفصل
                    </td>
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.max_exam_score }}
                    </td>
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.exam_score !== undefined ? subj.exam_score : '—' }}
                    </td>
                  </tr>
                  <!-- Row 3: المجموع -->
                  <tr class="border-t border-[#8c8275]/30 dark:border-white/5 print:border-black bg-[#fef5e7] dark:bg-amber-950/20 print:bg-[#fef5e7]">
                    <td class="py-2 px-2.5 font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 align-middle print:text-black">
                      المجموع
                    </td>
                    <td class="py-2 px-2 font-black font-mono text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 align-middle print:text-black">
                      {{ subj.max_score }}
                    </td>
                    <td class="py-2 px-2 font-black font-mono text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 align-middle print:text-black">
                      {{ subj.total_score }}
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <!-- Footer Summary -->
                <tr class="font-bold text-xs border-t-2 border-[#8c8275]/80 dark:border-white/30 bg-[#fdebd0]/50 dark:bg-amber-950/30 print:bg-[#fdebd0] print:text-black">
                  <td colspan="2" class="py-3 px-3 text-right font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 text-sm print:text-black">
                    مجموع درجات الفصل والنسبة المئوية:
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ termCalculatedMax }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-purple-700 dark:text-purple-300 border border-[#8c8275]/40 dark:border-white/10 text-base print:text-black">
                    {{ activeTranscript.total_score }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 text-sm print:text-black">
                    {{ activeTranscript.max_possible_score || termCalculatedMax }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 text-sm print:text-black">
                    {{ Number((termCalculatedMax * 0.5).toFixed(0)) }}
                  </td>
                  <td class="py-3 px-2 text-center border border-[#8c8275]/40 dark:border-white/10">
                    <span class="font-mono font-black text-sky-700 dark:text-sky-300 text-base print:text-black">
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
              <span>جدول رصد درجات المواد عبر الفصول الدراسية للسنة كاملة (الصحيفة السنوية الرسمية):</span>
            </h4>
            <span class="text-[11px] font-bold text-bx-muted">
              عدد المواد: {{ annualProcessedSubjects.length }} مادة
            </span>
          </div>

          <div class="overflow-x-auto rounded-2xl border-2 border-[#8c8275]/40 dark:border-white/10 bg-[var(--bx-surface-solid)] shadow-sm print:border-black print:rounded-none">
            <table class="w-full text-center text-xs border-collapse border border-[#8c8275]/40 dark:border-white/10 print:border-black print:text-black">
              <thead>
                <!-- Row 1: Master Headers -->
                <tr class="font-bold text-xs border-b border-[#8c8275]/40 dark:border-white/10 print:border-black">
                  <th
                    rowspan="3"
                    class="py-3 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdebd0] dark:bg-amber-950/40 text-gray-900 dark:text-amber-100 font-black min-w-[140px] align-middle print:bg-[#fdebd0] print:text-black"
                  >
                    المواد الدراسية المقررة
                  </th>
                  <th
                    colspan="6"
                    class="py-2.5 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdebd0] dark:bg-amber-950/40 text-gray-900 dark:text-amber-100 font-black text-sm align-middle print:bg-[#fdebd0] print:text-black"
                  >
                    درجات الفصلين
                  </th>
                  <th
                    colspan="3"
                    class="py-2.5 px-3 border border-[#8c8275]/40 dark:border-white/10 bg-[#eafaf1] dark:bg-emerald-950/40 text-gray-900 dark:text-emerald-100 font-black text-sm align-middle print:bg-[#eafaf1] print:text-black"
                  >
                    النتيجة النهائية للتلميذ
                  </th>
                </tr>

                <!-- Row 2: Sub-Headers -->
                <tr class="font-bold text-[11px] border-b border-[#8c8275]/40 dark:border-white/10 print:border-black">
                  <th
                    rowspan="2"
                    class="py-2 px-2.5 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[110px] align-middle print:bg-[#fdf2e9] print:text-black"
                  >
                    التفاصيل
                  </th>
                  <th
                    rowspan="2"
                    class="py-2 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[70px] align-middle print:bg-[#fdf2e9] print:text-black"
                  >
                    الدرجة المقررة لكل فصل
                  </th>
                  <th
                    colspan="2"
                    class="py-1.5 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold align-middle print:bg-[#fdf2e9] print:text-black"
                  >
                    درجة التلميذ
                  </th>
                  <th
                    colspan="2"
                    class="py-1.5 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#ebf5fb] dark:bg-sky-950/30 text-gray-900 dark:text-gray-100 font-bold align-middle print:bg-[#ebf5fb] print:text-black"
                  >
                    النهايات
                  </th>
                  <th
                    rowspan="2"
                    class="py-2 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#eafaf1] dark:bg-emerald-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[65px] align-middle print:bg-[#eafaf1] print:text-black"
                  >
                    مجموع الفصلين
                  </th>
                  <th
                    rowspan="2"
                    class="py-2 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#eafaf1] dark:bg-emerald-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[65px] align-middle print:bg-[#eafaf1] print:text-black"
                  >
                    امتحان الدور الثاني 60 %
                  </th>
                  <th
                    rowspan="2"
                    class="py-2 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#eafaf1] dark:bg-emerald-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[65px] align-middle print:bg-[#eafaf1] print:text-black"
                  >
                    نتيجة الدور الثاني
                  </th>
                </tr>

                <!-- Row 3: Column Labels -->
                <tr class="font-bold text-[11px] border-b-2 border-[#8c8275]/60 dark:border-white/20 print:border-black">
                  <th class="py-1.5 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[55px] align-middle print:bg-[#fdf2e9] print:text-black">
                    الفصل الأول
                  </th>
                  <th class="py-1.5 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#fdf2e9] dark:bg-amber-950/30 text-gray-900 dark:text-gray-100 font-bold min-w-[55px] align-middle print:bg-[#fdf2e9] print:text-black">
                    الفصل الثاني
                  </th>
                  <th class="py-1.5 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#ebf5fb] dark:bg-sky-950/40 text-gray-900 dark:text-sky-100 font-bold min-w-[50px] align-middle print:bg-[#ebf5fb] print:text-black">
                    الكبرى
                  </th>
                  <th class="py-1.5 px-2 border border-[#8c8275]/40 dark:border-white/10 bg-[#eafaf1] dark:bg-emerald-950/40 text-gray-900 dark:text-emerald-100 font-bold min-w-[50px] align-middle print:bg-[#eafaf1] print:text-black">
                    الصغرى
                  </th>
                </tr>
              </thead>

              <tbody>
                <template v-for="subj in annualProcessedSubjects" :key="subj.subject_name">
                  <!-- Row 1: الأعمال -->
                  <tr class="border-t border-[#8c8275]/40 dark:border-white/10 print:border-black">
                    <!-- Col 1: المادة الدراسية (rowspan 3) -->
                    <td
                      rowspan="3"
                      class="py-2.5 px-3 font-bold text-gray-900 dark:text-white border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle text-sm print:text-black print:bg-white"
                    >
                      {{ subj.subject_name }}
                    </td>

                    <!-- Col 2: التفاصيل -->
                    <td class="py-2 px-2.5 font-medium text-gray-800 dark:text-gray-200 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      الأعمال
                    </td>

                    <!-- Col 3: الدرجة المقررة لكل فصل -->
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.max_coursework_per_term }}
                    </td>

                    <!-- Col 4: الفصل الأول (الأعمال) -->
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.term1_coursework !== undefined ? subj.term1_coursework : '—' }}
                    </td>

                    <!-- Col 5: الفصل الثاني (الأعمال) -->
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.term2_coursework !== undefined ? subj.term2_coursework : '—' }}
                    </td>

                    <!-- Col 6: الكبرى (rowspan 3) -->
                    <td
                      rowspan="3"
                      class="py-2 px-2 font-black font-mono text-gray-900 dark:text-white border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle text-sm print:text-black print:bg-white"
                    >
                      {{ subj.max_score }}
                    </td>

                    <!-- Col 7: الصغرى (rowspan 3) -->
                    <td
                      rowspan="3"
                      class="py-2 px-2 font-black font-mono text-gray-900 dark:text-white border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle text-sm print:text-black print:bg-white"
                    >
                      {{ subj.passing_score }}
                    </td>

                    <!-- Col 8: مجموع الفصلين (rowspan 3) -->
                    <td
                      rowspan="3"
                      class="py-2 px-2 font-black font-mono text-gray-900 dark:text-white border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle text-sm print:text-black print:bg-white"
                    >
                      {{ subj.total_score }}
                    </td>

                    <!-- Col 9: امتحان الدور الثاني 60% (rowspan 3) -->
                    <td
                      rowspan="3"
                      class="py-2 px-2 font-bold font-mono border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white"
                      :class="subj.second_round_exam_score !== undefined ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400'"
                    >
                      {{ subj.second_round_exam_score !== undefined ? subj.second_round_exam_score : '' }}
                    </td>

                    <!-- Col 10: نتيجة الدور الثاني (rowspan 3) -->
                    <td
                      rowspan="3"
                      class="py-2 px-2 font-bold border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white"
                    >
                      <span
                        v-if="subj.second_round_result_text"
                        class="px-2 py-0.5 rounded text-[10px] font-bold"
                        :class="subj.is_passed ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 border border-rose-500/30'"
                      >
                        {{ subj.second_round_result_text }}
                      </span>
                    </td>
                  </tr>

                  <!-- Row 2: امتحان نهاية الفصل -->
                  <tr class="border-t border-[#8c8275]/30 dark:border-white/5 print:border-black">
                    <td class="py-2 px-2.5 font-medium text-gray-800 dark:text-gray-200 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      امتحان نهاية الفصل
                    </td>
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.max_exam_per_term }}
                    </td>
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.term1_exam !== undefined ? subj.term1_exam : '—' }}
                    </td>
                    <td class="py-2 px-2 font-bold font-mono text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 bg-white dark:bg-gray-900/50 align-middle print:text-black print:bg-white">
                      {{ subj.term2_exam !== undefined ? subj.term2_exam : '—' }}
                    </td>
                  </tr>

                  <!-- Row 3: المجموع -->
                  <tr class="border-t border-[#8c8275]/30 dark:border-white/5 print:border-black bg-[#fef5e7] dark:bg-amber-950/20 print:bg-[#fef5e7]">
                    <td class="py-2 px-2.5 font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 align-middle print:text-black">
                      المجموع
                    </td>
                    <td class="py-2 px-2 font-black font-mono text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 align-middle print:text-black">
                      {{ subj.max_total_per_term }}
                    </td>
                    <td class="py-2 px-2 font-black font-mono text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 align-middle print:text-black">
                      {{ subj.term1_total !== undefined ? subj.term1_total : '—' }}
                    </td>
                    <td class="py-2 px-2 font-black font-mono text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 align-middle print:text-black">
                      {{ subj.term2_total !== undefined ? subj.term2_total : '—' }}
                    </td>
                  </tr>
                </template>
              </tbody>

              <!-- Footer Summary -->
              <tfoot>
                <!-- Footer Row 1: مجموع أعمال السنة -->
                <tr class="font-bold text-xs border-t-2 border-[#8c8275]/60 dark:border-white/20 bg-black/[0.02] dark:bg-white/[0.02] print:bg-gray-100 print:text-black">
                  <td colspan="2" class="py-2 px-3 text-right font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    المجموع الكلي لأعمال السنة:
                  </td>
                  <td class="py-2 px-2 font-mono font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalMaxCourseworkPerTerm }}
                  </td>
                  <td class="py-2 px-2 font-mono font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalTerm1Coursework }}
                  </td>
                  <td class="py-2 px-2 font-mono font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalTerm2Coursework }}
                  </td>
                  <td colspan="5" class="py-2 px-2 font-mono font-black text-center text-gray-700 dark:text-gray-300 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    مجموع الأعمال السنوي: {{ annualTotals.totalAnnualCoursework }}
                  </td>
                </tr>

                <!-- Footer Row 2: مجموع الامتحانات -->
                <tr class="font-bold text-xs border-t border-[#8c8275]/40 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] print:bg-gray-100 print:text-black">
                  <td colspan="2" class="py-2 px-3 text-right font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    المجموع الكلي لامتحانات نهاية الفصل:
                  </td>
                  <td class="py-2 px-2 font-mono font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalMaxExamPerTerm }}
                  </td>
                  <td class="py-2 px-2 font-mono font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalTerm1Exam }}
                  </td>
                  <td class="py-2 px-2 font-mono font-black text-gray-900 dark:text-gray-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalTerm2Exam }}
                  </td>
                  <td colspan="5" class="py-2 px-2 font-mono font-black text-center text-gray-700 dark:text-gray-300 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    مجموع الامتحانات السنوي: {{ annualTotals.totalAnnualExam }}
                  </td>
                </tr>

                <!-- Footer Row 3: المجموع السنوي العام والنسبة المئوية -->
                <tr class="font-bold text-xs border-t-2 border-[#8c8275]/80 dark:border-white/30 bg-[#fdebd0]/50 dark:bg-amber-950/30 print:bg-[#fdebd0] print:text-black">
                  <td colspan="2" class="py-3 px-3 text-right font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 text-sm print:text-black">
                    المجموع العام والنسبة المئوية:
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalMaxPerTerm }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalTerm1 }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 print:text-black">
                    {{ annualTotals.totalTerm2 }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 text-sm print:text-black">
                    {{ annualTotals.grandMaxScore }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-gray-900 dark:text-amber-100 border border-[#8c8275]/40 dark:border-white/10 text-sm print:text-black">
                    {{ annualTotals.grandPassingScore }}
                  </td>
                  <td class="py-3 px-2 font-mono font-black text-purple-700 dark:text-purple-300 border border-[#8c8275]/40 dark:border-white/10 text-base print:text-black">
                    {{ annualTotals.grandTotalScore }}
                  </td>
                  <td colspan="2" class="py-3 px-2 text-center border border-[#8c8275]/40 dark:border-white/10">
                    <span class="font-mono font-black text-purple-700 dark:text-purple-300 text-base print:text-black">
                      {{ annualTotals.percentage }}%
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

      // Initialize second round settings dynamically from transcript
      const tData = detailedTranscript.value?.transcript_data as any;
      if (tData) {
        if (tData.second_round_mode) {
          srMode.value = tData.second_round_mode;
        }
        if (tData.cap_passing_score !== undefined) {
          srCapScore.value = !!tData.cap_passing_score;
        }
        // Pre-fill existing second-round grades if present
        const subjectsList = tData.subjects || [];
        const initialGrades: Record<string, number> = {};
        for (const s of subjectsList) {
          if (s.second_round_score !== undefined && s.second_round_score !== null) {
            initialGrades[s.subject_name] = Number(s.second_round_score);
          }
        }
        srGrades.value = initialGrades;
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
  max_coursework_score: number;
  exam_score?: number;
  max_exam_score: number;
  total_score: number;
  max_score: number;
  passing_score: number;
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
      max_coursework_score: s.max_coursework_score !== undefined && s.max_coursework_score !== null 
        ? Number(s.max_coursework_score) 
        : Number((maxScore * 0.4).toFixed(0)),
      exam_score: eScore,
      max_exam_score: s.max_exam_score !== undefined && s.max_exam_score !== null 
        ? Number(s.max_exam_score) 
        : Number((maxScore * 0.6).toFixed(0)),
      total_score: tScore,
      max_score: maxScore,
      passing_score: passingScore,
      is_passed: s.status ? s.status === 'passed' : tScore >= passingScore,
    };
  });
});

const termCalculatedMax = computed(() => {
  return termSubjectsList.value.reduce((sum, s) => sum + s.max_score, 0);
});

// Annual Multi-term Detailed Subject Row
interface ProcessedAnnualSubjectRow {
  subject_name: string;
  max_coursework_per_term: number;
  max_exam_per_term: number;
  max_total_per_term: number;

  term1_coursework?: number;
  term1_exam?: number;
  term1_total?: number;

  term2_coursework?: number;
  term2_exam?: number;
  term2_total?: number;

  max_score: number; // الكبرى
  passing_score: number; // الصغرى
  total_score: number; // مجموع الفصلين

  second_round_exam_score?: number; // امتحان الدور الثاني 60%
  second_round_result_text?: string; // نتيجة الدور الثاني
  is_passed: boolean;
}

const annualProcessedSubjects = computed<ProcessedAnnualSubjectRow[]>(() => {
  if (!activeTranscript.value) return [];

  const rawData = activeTranscript.value.transcript_data;
  const annualDirectSubjects: any[] = rawData?.subjects || rawData?.subject_scores || [];
  const studentTerms: any[] = activeTranscript.value.student_term_transcripts || [];

  // Sort terms if possible: term 1 first, term 2 second
  const sortedTerms = [...studentTerms].sort((a, b) => {
    const aId = Number(a.class_academic_term_id || a.id || 0);
    const bId = Number(b.class_academic_term_id || b.id || 0);
    return aId - bId;
  });

  const term1 = sortedTerms[0];
  const term2 = sortedTerms[1];

  const term1Subjects: any[] = term1?.transcript_data?.subjects || term1?.transcript_data?.subject_scores || [];
  const term2Subjects: any[] = term2?.transcript_data?.subjects || term2?.transcript_data?.subject_scores || [];

  // Build ordered subject list
  const subjectNamesSet = new Set<string>();
  const subjectList: string[] = [];

  for (const s of annualDirectSubjects) {
    const name = s.subject_name;
    if (name && !subjectNamesSet.has(name)) {
      subjectNamesSet.add(name);
      subjectList.push(name);
    }
  }

  for (const s of term1Subjects) {
    const name = s.subject_name;
    if (name && !subjectNamesSet.has(name)) {
      subjectNamesSet.add(name);
      subjectList.push(name);
    }
  }

  for (const s of term2Subjects) {
    const name = s.subject_name;
    if (name && !subjectNamesSet.has(name)) {
      subjectNamesSet.add(name);
      subjectList.push(name);
    }
  }

  return subjectList.map((name) => {
    const annSubj = annualDirectSubjects.find((s) => s.subject_name === name);
    const t1Subj = term1Subjects.find((s) => s.subject_name === name);
    const t2Subj = term2Subjects.find((s) => s.subject_name === name);

    // Max score for year (الكبرى)
    const maxScore = annSubj?.max_score !== undefined
      ? Number(annSubj.max_score)
      : (t1Subj?.max_score ? Number(t1Subj.max_score) * 2 : (t2Subj?.max_score ? Number(t2Subj.max_score) * 2 : 100));

    // Passing score for year (الصغرى)
    const passingScore = annSubj?.passing_score !== undefined
      ? Number(annSubj.passing_score)
      : Number((maxScore * 0.5).toFixed(1));

    // Max scores per term
    const maxTotalPerTerm = t1Subj?.max_score !== undefined
      ? Number(t1Subj.max_score)
      : (t2Subj?.max_score !== undefined ? Number(t2Subj.max_score) : Number((maxScore / 2).toFixed(1)));

    const maxCourseworkPerTerm = t1Subj?.max_coursework_score !== undefined
      ? Number(t1Subj.max_coursework_score)
      : (t2Subj?.max_coursework_score !== undefined ? Number(t2Subj.max_coursework_score) : Number((maxTotalPerTerm * 0.4).toFixed(1)));

    const maxExamPerTerm = t1Subj?.max_exam_score !== undefined
      ? Number(t1Subj.max_exam_score)
      : (t2Subj?.max_exam_score !== undefined ? Number(t2Subj.max_exam_score) : Number((maxTotalPerTerm * 0.6).toFixed(1)));

    // Term 1 student scores
    const term1Coursework = t1Subj?.coursework_score !== undefined ? Number(t1Subj.coursework_score) : undefined;
    const term1Exam = t1Subj?.exam_score !== undefined ? Number(t1Subj.exam_score) : undefined;
    const term1Total = t1Subj?.total_score !== undefined
      ? Number(t1Subj.total_score)
      : (term1Coursework !== undefined || term1Exam !== undefined ? (term1Coursework || 0) + (term1Exam || 0) : undefined);

    // Term 2 student scores
    const term2Coursework = t2Subj?.coursework_score !== undefined ? Number(t2Subj.coursework_score) : undefined;
    const term2Exam = t2Subj?.exam_score !== undefined ? Number(t2Subj.exam_score) : undefined;
    const term2Total = t2Subj?.total_score !== undefined
      ? Number(t2Subj.total_score)
      : (term2Coursework !== undefined || term2Exam !== undefined ? (term2Coursework || 0) + (term2Exam || 0) : undefined);

    // Sum of terms (مجموع الفصلين)
    const totalScore = annSubj?.total_score !== undefined
      ? Number(annSubj.total_score)
      : ((term1Total || 0) + (term2Total || 0));

    // Second round scores
    let srExamScore: number | undefined = undefined;
    if (annSubj?.second_round_exam_score !== undefined && annSubj?.second_round_exam_score !== null) {
      srExamScore = Number(annSubj.second_round_exam_score);
    } else if (srGrades.value[name] !== undefined) {
      srExamScore = Number(srGrades.value[name]);
    }

    let srResultText: string | undefined = undefined;
    if (annSubj?.second_round_status) {
      srResultText = annSubj.second_round_status === 'passed' ? 'ناجح' : 'راسب';
    } else if (srExamScore !== undefined) {
      srResultText = annSubj?.status === 'passed' ? 'ناجح' : undefined;
    }

    const isPassed = annSubj?.status ? annSubj.status === 'passed' : totalScore >= passingScore;

    return {
      subject_name: name,
      max_coursework_per_term: maxCourseworkPerTerm,
      max_exam_per_term: maxExamPerTerm,
      max_total_per_term: maxTotalPerTerm,
      term1_coursework: term1Coursework,
      term1_exam: term1Exam,
      term1_total: term1Total,
      term2_coursework: term2Coursework,
      term2_exam: term2Exam,
      term2_total: term2Total,
      max_score: maxScore,
      passing_score: passingScore,
      total_score: totalScore,
      second_round_exam_score: srExamScore,
      second_round_result_text: srResultText,
      is_passed: isPassed,
    };
  });
});

const annualTotals = computed(() => {
  const subjects = annualProcessedSubjects.value;
  
  const totalMaxCourseworkPerTerm = subjects.reduce((sum, s) => sum + (s.max_coursework_per_term || 0), 0);
  const totalTerm1Coursework = subjects.reduce((sum, s) => sum + (s.term1_coursework || 0), 0);
  const totalTerm2Coursework = subjects.reduce((sum, s) => sum + (s.term2_coursework || 0), 0);
  const totalAnnualCoursework = totalTerm1Coursework + totalTerm2Coursework;

  const totalMaxExamPerTerm = subjects.reduce((sum, s) => sum + (s.max_exam_per_term || 0), 0);
  const totalTerm1Exam = subjects.reduce((sum, s) => sum + (s.term1_exam || 0), 0);
  const totalTerm2Exam = subjects.reduce((sum, s) => sum + (s.term2_exam || 0), 0);
  const totalAnnualExam = totalTerm1Exam + totalTerm2Exam;

  const totalMaxPerTerm = subjects.reduce((sum, s) => sum + (s.max_total_per_term || 0), 0);
  const totalTerm1 = subjects.reduce((sum, s) => sum + (s.term1_total || 0), 0);
  const totalTerm2 = subjects.reduce((sum, s) => sum + (s.term2_total || 0), 0);
  
  const grandMaxScore = subjects.reduce((sum, s) => sum + (s.max_score || 0), 0);
  const grandPassingScore = subjects.reduce((sum, s) => sum + (s.passing_score || 0), 0);
  const grandTotalScore = subjects.reduce((sum, s) => sum + (s.total_score || 0), 0);

  const percentage = grandMaxScore > 0 ? Number(((grandTotalScore / grandMaxScore) * 100).toFixed(2)) : (activeTranscript.value?.percentage || 0);

  return {
    totalMaxCourseworkPerTerm,
    totalTerm1Coursework,
    totalTerm2Coursework,
    totalAnnualCoursework,
    totalMaxExamPerTerm,
    totalTerm1Exam,
    totalTerm2Exam,
    totalAnnualExam,
    totalMaxPerTerm,
    totalTerm1,
    totalTerm2,
    grandMaxScore,
    grandPassingScore,
    grandTotalScore,
    percentage,
  };
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
