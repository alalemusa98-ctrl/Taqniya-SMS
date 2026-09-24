<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-8 p-6 sm:p-8 max-w-[1600px] mx-auto min-h-screen text-bx-text font-sans" dir="rtl">
      <!-- Page Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#B4AED8] dark:border-white/[0.08]">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20 shadow-xs">
            <GraduationCap class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-bx-title font-display tracking-tight">
              الترحيل الأكاديمي وكشوفات النتائج والأرشيف
            </h1>
            <p class="text-xs sm:text-sm text-bx-muted mt-1 font-medium">
              إدارة كشوفات الدرجات الرسمية، لوحة الشرف، المحاكاة الذكية، والترحيل السنوي المتوازن مع الحفاظ على تسكين الشعب
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            @click="openPromotionModal"
          >
            <Sparkles class="w-4 h-4" />
            <span>تنفيذ الترحيل السنوي وتوزيع الفصول</span>
          </button>
        </div>
      </header>

      <!-- KPI Overview Cards using TaqniyaKpiCard -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <TaqniyaKpiCard
          :icon="Layers"
          title="إجمالي الكشوفات المستعلمة"
          :value="hasExecutedSearch ? totalTranscriptsCount : '—'"
          subtext="سجلات كشوفات مطابقة"
          color="purple"
        />

        <TaqniyaKpiCard
          :icon="CheckCircle2"
          title="نسبة النجاح العامة"
          :value="hasExecutedSearch ? `${overallPassRate}%` : '—'"
          subtext="للكشوفات المعروضة"
          color="emerald"
        />

        <TaqniyaKpiCard
          :icon="RotateCcw"
          title="دفعات الترحيل المعتمدة"
          :value="promotionBatches.length"
          subtext="عمليات ترحيل سنوية مكتملة"
          color="amber"
        />
      </section>

      <!-- Navigation Tabs -->
      <nav class="flex items-center gap-2 border-b border-[#B4AED8] dark:border-white/[0.08] pb-1">
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'transcripts' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title hover:bg-black/5 dark:hover:bg-white/5'"
          @click="activeTab = 'transcripts'"
        >
          <BookOpen class="w-4 h-4" />
          <span>كشوفات الدرجات ولوحة الشرف</span>
        </button>
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'batches' ? 'bg-bx-primary text-white shadow-xs' : 'text-bx-muted hover:text-bx-title hover:bg-black/5 dark:hover:bg-white/5'"
          @click="activeTab = 'batches'"
        >
          <History class="w-4 h-4" />
          <span>سجل دفعات الترحيل المؤرشفة</span>
        </button>
      </nav>

      <!-- TAB 1: Transcripts & Leaderboard -->
      <section v-if="activeTab === 'transcripts'" class="space-y-6">
        <!-- 1. School Classes & Sections Grid (Matching Grade Entry View) -->
        <div class="bg-[var(--bx-surface-solid)]/80 dark:bg-[#31324B]/70 backdrop-blur-md border border-[#B4AED8]/50 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm hover:border-[#B4AED8]/70 dark:hover:border-white/[0.12] transition-colors">
          <PromotionClassSectionsGrid
            :sections="allSections"
            :classes="classesList"
            :selected-class-id="filters.class_id"
            :selected-class-name="filters.class_name"
            :selected-section-id="filters.class_section_id"
            :selected-section-name="filters.section_name"
            @select-class="handleSelectGridClass"
            @select-section="handleSelectGridSection"
            @clear-selection="handleClearGridSelection"
          />
        </div>

        <!-- 2. Filters & Search Panel -->
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 font-bold text-xs sm:text-sm text-bx-title">
              <Filter class="w-4 h-4 text-bx-primary" />
              <span>محددات وفلاتر الاستعلام عن الكشوفات</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <!-- 1. العام الدراسي -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">العام الدراسي:</label>
              <TaqniyaSelect
                v-model="filters.academic_year_name"
                :options="yearFilterOptions"
                placeholder="جميع الأعوام..."
                full-width
                @update:model-value="onYearFilterChange"
              />
            </div>

            <!-- 2. الصف الدراسي -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">الصف الدراسي:</label>
              <TaqniyaSelect
                v-model="selectedClassIdModel"
                :options="classFilterOptions"
                placeholder="اختر الصف..."
                full-width
                @update:model-value="onClassFilterChange"
              />
            </div>

            <!-- 3. الشعبة -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">الشعبة:</label>
              <TaqniyaSelect
                v-model="selectedSectionName"
                :options="sectionFilterOptions"
                placeholder="كافة الشعب..."
                full-width
                @update:model-value="onSectionFilterChange"
              />
            </div>

            <!-- 4. نوع الصحيفة (إلزامي) -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">
                <span>نوع الصحيفة:</span>
                <span class="text-rose-500 font-bold ms-0.5" title="حقل إلزامي">*</span>
              </label>
              <TaqniyaSelect
                v-model="selectedTranscriptOption"
                :options="transcriptTypeFilterOptions"
                placeholder="اختر نوع الصحيفة..."
                full-width
                @update:model-value="onTranscriptTypeChange"
              />
            </div>

            <!-- 5. الحالة الأكاديمية -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">الحالة الأكاديمية:</label>
              <TaqniyaSelect
                v-model="filters.final_status"
                :options="statusFilterOptions"
                placeholder="كافة الحالات..."
                full-width
              />
            </div>

            <!-- 6. البحث باسم الطالب أو رقمه -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-bx-muted">البحث باسم الطالب أو رقمه:</label>
              <div class="flex items-center gap-1.5">
                <div class="relative flex-1">
                  <input
                    v-model="searchInput"
                    type="text"
                    placeholder="اسم الطالب أو رقمه..."
                    class="h-10 w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl ps-8 pe-8 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all shadow-xs"
                    @keyup.enter="executeSearch"
                  />
                  <Search class="w-4 h-4 text-bx-muted absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    v-if="searchInput"
                    type="button"
                    class="w-4 h-4 text-bx-muted hover:text-bx-title absolute end-2.5 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center transition-colors"
                    title="مسح البحث"
                    @click="searchInput = ''; filters.search = undefined"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- زر مطابقة وبحث الأسماء للاختيار الفردي -->
                <button
                  type="button"
                  class="h-10 px-3 rounded-xl border border-bx-primary/30 hover:border-bx-primary bg-bx-primary/10 hover:bg-bx-primary/20 text-bx-primary font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="مطابقة واختيار اسم الطالب من قاعدة البيانات"
                  :disabled="isFetchingSuggestions"
                  @click="openStudentSuggestionsModal"
                >
                  <Users class="w-4 h-4" />
                  <span class="text-xs font-bold whitespace-nowrap">مطابقة</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Search & Actions Bar (Unified & Balanced Heights) -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#B4AED8]/30 dark:border-white/[0.06]">
            <!-- Active Search Summary Tag -->
            <div class="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span v-if="searchInput" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-bx-primary/10 border border-bx-primary/20 text-bx-primary font-bold">
                <Search class="w-3.5 h-3.5" />
                <span>تصفية الطالب: "{{ searchInput }}"</span>
                <button type="button" class="hover:opacity-75 cursor-pointer" @click="searchInput = ''; filters.search = undefined">
                  <X class="w-3 h-3" />
                </button>
              </span>
              <span v-else class="text-[11px] text-bx-muted font-medium">
                اضغط Enter في حقل البحث أو زر "استعلام وعرض الكشوفات" للتنفيذ
              </span>
            </div>

            <!-- Action Buttons with matched height -->
            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                class="h-10 px-4 rounded-xl border border-bx-border hover:bg-black/5 dark:hover:bg-white/5 text-bx-muted hover:text-bx-title font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                @click="resetFilters"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>

              <button
                type="button"
                class="h-10 px-6 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                :disabled="isLoadingTranscripts"
                @click="executeSearch"
              >
                <Search class="w-3.5 h-3.5" />
                <span>{{ isLoadingTranscripts ? 'جاري الاستعلام...' : 'استعلام وعرض الكشوفات' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Guidance / Prompt State before searching -->
        <div
          v-if="!hasExecutedSearch"
          class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-12 text-center shadow-xs space-y-4"
        >
          <div class="w-16 h-16 rounded-3xl bg-bx-primary/10 text-bx-primary flex items-center justify-center mx-auto border border-bx-primary/20 shadow-xs">
            <Filter class="w-8 h-8" />
          </div>
          <div class="max-w-md mx-auto space-y-1.5">
            <h3 class="text-lg font-black text-bx-title font-display">
              يرجى تحديد الصف الدراسي ونوع الصحيفة
            </h3>
            <p class="text-xs text-bx-muted font-medium leading-relaxed">
              اختر الصف الدراسي من المصفوفة أو القائمة أعلاه، وتأكد من تحديد <strong>نوع الصحيفة (سنوية نهائية أو فصلية)</strong>، ثم اضغط على زر <strong>"استعلام وعرض الكشوفات"</strong> للبدء في استعراض النتائج الرسمية ولوحة الشرف.
            </p>
          </div>
        </div>

        <!-- When search has been executed -->
        <template v-else>
          <!-- Dedicated Student Search Banner when searching by name -->
          <div
            v-if="filters.search"
            class="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-bx-primary/15 via-bx-primary/10 to-transparent border border-bx-primary/30 flex items-center justify-between flex-wrap gap-4 shadow-xs"
          >
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-bx-primary text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <User class="w-6 h-6" />
              </div>
              <div>
                <h4 class="text-sm sm:text-base font-black text-bx-title font-display">
                  كشوفات وسجلات الطالب: <span class="text-bx-primary font-black">"{{ filters.search }}"</span>
                </h4>
                <p class="text-xs text-bx-muted font-medium mt-0.5">
                  تم العثور على <strong>{{ totalTranscriptsCount }}</strong> صحيفة مسجلة
                  <span v-if="!filters.academic_year_name || filters.academic_year_name === 'all'">
                    عبر <strong>كافة الأعوام الدراسية</strong>
                  </span>
                  <span v-else>
                    للعام الدراسي <strong>{{ filters.academic_year_name }}</strong>
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-bx-border hover:bg-black/5 dark:hover:bg-white/5 text-bx-muted hover:text-bx-title font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              @click="clearStudentSearch"
            >
              <X class="w-4 h-4" />
              <span>إلغاء تصفية الطالب</span>
            </button>
          </div>

          <!-- Executive Class Cards Grid (Only shown when not searching for a single student) -->
          <div v-else-if="executiveClassSummaries.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <ExecutiveClassCard
              v-for="cSum in executiveClassSummaries"
              :key="cSum.grade_level"
              :class-summary="cSum"
              :is-selected="filters.grade_level === cSum.grade_level"
              @select="handleSelectClassCard"
            />
          </div>

          <!-- Leaderboard Table using TaqniyaTable -->
          <div class="space-y-4">
            <ClassLeaderboardTable
              :transcripts="transcripts"
              :is-loading="isLoadingTranscripts"
              :is-student-search="Boolean(filters.search)"
              @view-detail="handleViewTranscriptDetail"
            />

            <!-- Pagination using TaqniyaPagination -->
            <div v-if="totalPages > 1" class="flex justify-center pt-4">
              <TaqniyaPagination
                :current-page="meta.current_page"
                :total-pages="totalPages"
                @page-change="handlePageChange"
              />
            </div>
          </div>
        </template>
      </section>

      <!-- TAB 2: Promotion Batches History using TaqniyaTable -->
      <section v-if="activeTab === 'batches'" class="space-y-6">
        <div class="bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div class="border-b border-[#B4AED8] dark:border-white/[0.08] pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="text-lg font-bold text-bx-title font-display">سجل عمليات الترحيل الأكاديمي الجماعي (Promotion Batches)</h3>
              <p class="text-xs text-bx-muted mt-1 font-medium">كافة العمليات مؤرخة وموثقة بسجلات التدقيق الأمني Audit Logs</p>
            </div>
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors flex items-center gap-1.5 cursor-pointer"
              @click="fetchPromotionBatches"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>تحديث السجل</span>
            </button>
          </div>

          <TaqniyaTable
            :columns="batchColumns"
            :items="promotionBatches"
            :is-loading="isLoadingBatches"
            row-key="id"
            empty-title="لا توجد دفعات ترحيل منفذة حتى الآن"
            empty-subtitle="يمكنك إنشاء دفعة ترحيل جديدة بالضغط على زر تنفيذ الترحيل السنوي."
          >
            <!-- Custom Cell Templates -->
            <template #cell-id="{ value }">
              <span class="font-mono font-bold text-bx-primary">BAT-{{ value }}</span>
            </template>

            <template #cell-from_year="{ item }">
              <span class="font-bold text-bx-title">{{ item.from_academic_year_name || item.from_academic_year?.name || item.from_academic_year_id }}</span>
            </template>

            <template #cell-to_year="{ item }">
              <span class="font-bold text-bx-primary">{{ item.to_academic_year_name || item.to_academic_year?.name || item.to_academic_year_id }}</span>
            </template>

            <template #cell-total_promoted="{ value }">
              <span class="font-bold text-emerald-600">{{ value }}</span>
            </template>

            <template #cell-total_second_round="{ value }">
              <span class="font-bold text-amber-600">{{ value }}</span>
            </template>

            <template #cell-total_retained="{ value }">
              <span class="font-bold text-rose-600">{{ value }}</span>
            </template>

            <template #cell-overall_passing_rate="{ value }">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {{ value }}%
              </span>
            </template>

            <template #cell-created_at="{ value }">
              <span class="text-xs text-bx-muted">{{ formatDate(value) }}</span>
            </template>

            <template #cell-actions="{ item }">
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-bold rounded-lg bg-bx-primary/10 hover:bg-bx-primary text-bx-primary hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                @click="handleViewBatchDetail(item)"
              >
                <Eye class="w-3.5 h-3.5" />
                <span>التفاصيل</span>
              </button>
            </template>
          </TaqniyaTable>
        </div>
      </section>

      <!-- Detail Drawer for Transcripts -->
      <TranscriptDetailDrawer
        :is-open="isDetailDrawerOpen"
        :transcript="selectedTranscript"
        @close="isDetailDrawerOpen = false"
      />

      <!-- Detail Drawer for Promotion Batches -->
      <PromotionBatchDetailDrawer
        :is-open="isBatchDetailDrawerOpen"
        :batch="selectedBatch"
        @close="isBatchDetailDrawerOpen = false"
      />

      <!-- Promotion Execution Modal -->
      <PromotionExecutionModal
        :is-open="isPromotionModalOpen"
        :academic-years="academicYearsList"
        :preview-result="promotionSimulation"
        :is-preview-loading="isSimulating"
        :is-executing="isExecutingPromotion"
        @close="isPromotionModalOpen = false"
        @preview="handleRunSimulation"
        @execute="handleExecutePromotion"
      />

      <!-- Single Student Match & Picker Modal -->
      <TaqniyaModal
        :is-open="isStudentPickerModalOpen"
        title="مطابقة واختيار اسم الطالب"
        subtitle="اختر طالباً واحداً فقط من النتائج لعرض كافة كشوفاته ودرجاته"
        max-width="2xl"
        @close="isStudentPickerModalOpen = false"
      >
        <template #icon>
          <div class="w-10 h-10 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20">
            <Users class="w-5 h-5" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Search input inside modal -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input
                v-model="pickerSearchQuery"
                type="text"
                placeholder="اكتب جزءاً من اسم الطالب أو رقمه للبحث..."
                class="h-10 w-full bg-[var(--bx-surface-solid)] border border-[#B4AED8] dark:border-white/[0.12] rounded-xl ps-9 pe-9 text-xs text-bx-title placeholder:text-bx-muted outline-none focus:border-bx-primary transition-all"
                @keyup.enter="fetchStudentSuggestions"
              />
              <Search class="w-4 h-4 text-bx-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                v-if="pickerSearchQuery"
                type="button"
                class="w-4 h-4 text-bx-muted hover:text-bx-title absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center"
                @click="pickerSearchQuery = ''; fetchStudentSuggestions()"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              class="h-10 px-4 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              :disabled="isFetchingSuggestions"
              @click="fetchStudentSuggestions"
            >
              <Loader2 v-if="isFetchingSuggestions" class="w-3.5 h-3.5 animate-spin" />
              <Search v-else class="w-3.5 h-3.5" />
              <span>بحث</span>
            </button>
          </div>

          <!-- Single Choice Notice & Count -->
          <div class="flex items-center justify-between text-xs text-bx-muted px-1">
            <span class="font-medium">
              يُسمح بتحديد <strong>طالب واحد فقط</strong>.
            </span>
            <span v-if="!isFetchingSuggestions && suggestedStudents.length > 0" class="font-mono text-[11px] font-bold text-bx-primary">
              تم العثور على {{ suggestedStudents.length }} طالب
            </span>
          </div>

          <!-- Results List -->
          <div class="max-h-[360px] overflow-y-auto space-y-2 pe-1">
            <!-- Loading State -->
            <div v-if="isFetchingSuggestions" class="py-12 flex flex-col items-center justify-center gap-3 text-bx-muted">
              <Loader2 class="w-8 h-8 animate-spin text-bx-primary" />
              <span class="text-xs font-medium">جاري البحث في قاعدة البيانات...</span>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="suggestedStudents.length === 0"
              class="py-10 text-center space-y-2 border border-dashed border-[#B4AED8]/50 dark:border-white/[0.1] rounded-2xl p-6"
            >
              <User class="w-8 h-8 mx-auto text-bx-muted/60" />
              <p class="text-xs font-bold text-bx-title">لا توجد نتائج مطابقة</p>
              <p class="text-[11px] text-bx-muted">جرب البحث بكلمات مختلفة أو اسم آخر للطالب.</p>
            </div>

            <!-- Student Items (Single selection) -->
            <div
              v-for="s in suggestedStudents"
              v-else
              :key="s.id"
              class="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group"
              :class="selectedPickerStudent?.id === s.id
                ? 'bg-bx-primary/10 border-bx-primary shadow-xs ring-1 ring-bx-primary/30'
                : 'bg-[var(--bx-surface-solid)] border-[#B4AED8]/50 dark:border-white/[0.08] hover:border-bx-primary/40 hover:bg-black/5 dark:hover:bg-white/5'"
              @click="selectStudentFromPicker(s)"
              @dblclick="selectStudentFromPicker(s); confirmSelectedStudent()"
            >
              <!-- Info with Radio Indicator -->
              <div class="flex items-center gap-3 min-w-0">
                <!-- Radio Circle indicator -->
                <div
                  class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors"
                  :class="selectedPickerStudent?.id === s.id
                    ? 'border-bx-primary bg-bx-primary text-white'
                    : 'border-[#B4AED8] dark:border-white/[0.2] bg-white dark:bg-white/[0.05] group-hover:border-bx-primary/50'"
                >
                  <div v-if="selectedPickerStudent?.id === s.id" class="w-2 h-2 rounded-full bg-white"></div>
                </div>

                <!-- Avatar / User Icon -->
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
                  :class="s.gender === 'female'
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'"
                >
                  <User class="w-4 h-4" />
                </div>

                <!-- Name & Details -->
                <div class="min-w-0">
                  <div class="text-xs font-bold text-bx-title truncate group-hover:text-bx-primary transition-colors">
                    {{ s.full_name }}
                  </div>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span class="text-[10px] font-mono font-bold text-bx-muted bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                      {{ s.user_code }}
                    </span>
                    <span v-if="s.class_section" class="text-[10px] text-bx-muted font-medium">
                      {{ s.class_section }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Selection Status Badge -->
              <div class="shrink-0">
                <span
                  v-if="selectedPickerStudent?.id === s.id"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-bx-primary text-white shadow-2xs"
                >
                  <Check class="w-3 h-3" />
                  <span>محدد</span>
                </span>
                <span
                  v-else
                  class="text-[11px] text-bx-muted opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  انقر للاختيار
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <template #footer>
          <div class="flex items-center justify-between gap-3">
            <div class="text-xs text-bx-muted truncate max-w-[260px] sm:max-w-md">
              <span v-if="selectedPickerStudent" class="font-bold text-bx-primary">
                الطالب المحدد: {{ selectedPickerStudent.full_name }}
              </span>
              <span v-else>
                لم يتم اختيار أي طالب بعد
              </span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="h-9 px-4 rounded-xl border border-bx-border hover:bg-black/5 dark:hover:bg-white/5 text-bx-muted hover:text-bx-title font-bold text-xs transition-all cursor-pointer"
                @click="isStudentPickerModalOpen = false"
              >
                إلغاء
              </button>
              <button
                type="button"
                class="h-9 px-5 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!selectedPickerStudent"
                @click="confirmSelectedStudent"
              >
                <Check class="w-3.5 h-3.5" />
                <span>تأكيد وعرض الدرجات</span>
              </button>
            </div>
          </div>
        </template>
      </TaqniyaModal>
    </div>
  </TaqniyaErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  History,
  Filter,
  Search,
  Eye,
  X,
  User,
  Users,
  Check,
  Loader2,
} from 'lucide-vue-next';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaSelect, { type TaqniyaSelectOption } from '../components/ui/TaqniyaSelect.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaPagination from '../components/ui/TaqniyaPagination.vue';
import TaqniyaModal from '../components/ui/TaqniyaModal.vue';
import ExecutiveClassCard from '../components/promotion/ExecutiveClassCard.vue';
import ClassLeaderboardTable from '../components/promotion/ClassLeaderboardTable.vue';
import TranscriptDetailDrawer from '../components/promotion/TranscriptDetailDrawer.vue';
import PromotionBatchDetailDrawer from '../components/promotion/PromotionBatchDetailDrawer.vue';
import PromotionExecutionModal from '../components/promotion/PromotionExecutionModal.vue';
import PromotionClassSectionsGrid from '../components/promotion/PromotionClassSectionsGrid.vue';
import { studentsApi, type Student } from '../api/students.api';

import {
  promotionApi,
  type StudentTranscript,
  type ExecutiveClassSummary,
  type PromotionBatch,
  type PromotionSimulationResult,
  type QueryTranscriptsDto,
  type ExecutePromotionDto,
} from '../api/promotion.api';
import {
  academicApi,
  type AcademicYearItem,
  type AcademicClassItem,
  type AcademicTermItem,
} from '../api/academic.api';
import {
  gradeEntryApi,
  type SectionAuditProgressItem,
} from '../api/grade-entry.api';
import { useToast } from '../composables/useToast';

const toast = useToast();

const activeTab = ref<'transcripts' | 'batches'>('transcripts');

// Data State
const transcripts = ref<StudentTranscript[]>([]);
const executiveClassSummaries = ref<ExecutiveClassSummary[]>([]);
const promotionBatches = ref<PromotionBatch[]>([]);
const academicYearsList = ref<AcademicYearItem[]>([]);
const classesList = ref<AcademicClassItem[]>([]);
const academicTermsList = ref<AcademicTermItem[]>([]);
const allClassAcademicTerms = ref<any[]>([]);
const allSections = ref<SectionAuditProgressItem[]>([]);
const promotionSimulation = ref<PromotionSimulationResult | null>(null);

// Selected Items & Drawers/Modals
const selectedTranscript = ref<StudentTranscript | null>(null);
const selectedBatch = ref<PromotionBatch | null>(null);
const isDetailDrawerOpen = ref(false);
const isBatchDetailDrawerOpen = ref(false);
const isPromotionModalOpen = ref(false);

// Loading Flags
const isLoadingTranscripts = ref(false);
const isLoadingBatches = ref(false);
const isSimulating = ref(false);
const isExecutingPromotion = ref(false);

// Search execution flag (Transcripts not shown initially)
const hasExecutedSearch = ref(false);

// Search input
const searchInput = ref('');

// Student Picker Modal State (Single Choice)
const isStudentPickerModalOpen = ref(false);
const isFetchingSuggestions = ref(false);
const pickerSearchQuery = ref('');
const suggestedStudents = ref<Student[]>([]);
const selectedPickerStudent = ref<Student | null>(null);

const openStudentSuggestionsModal = () => {
  pickerSearchQuery.value = searchInput.value.trim();
  selectedPickerStudent.value = null;
  isStudentPickerModalOpen.value = true;
  fetchStudentSuggestions();
};

const fetchStudentSuggestions = async () => {
  isFetchingSuggestions.value = true;
  try {
    const q = pickerSearchQuery.value.trim();
    const res = await studentsApi.getStudents({
      search: q || undefined,
      per_page: 50,
    });
    const resData: any = res.data;
    if (resData && Array.isArray(resData.data)) {
      suggestedStudents.value = resData.data;
    } else if (Array.isArray(resData)) {
      suggestedStudents.value = resData;
    } else {
      suggestedStudents.value = [];
    }
  } catch (err: any) {
    console.error('Failed to fetch students for picker:', err);
    toast.error('تعذر جلب قائمة الطلاب المطابقة.');
    suggestedStudents.value = [];
  } finally {
    isFetchingSuggestions.value = false;
  }
};

const selectStudentFromPicker = (student: Student) => {
  selectedPickerStudent.value = student;
};

const confirmSelectedStudent = () => {
  if (!selectedPickerStudent.value) return;

  const chosen = selectedPickerStudent.value;
  searchInput.value = chosen.full_name;
  filters.value.search = chosen.full_name;

  // If no specific class is locked, clear class constraints to fetch all student transcripts across historical years and grades
  if (selectedClassIdModel.value === 'all' || !selectedClassIdModel.value) {
    filters.value.class_id = undefined;
    filters.value.class_name = undefined;
    filters.value.grade_level = undefined;
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
  }

  isStudentPickerModalOpen.value = false;
  hasExecutedSearch.value = true;
  executeSearch();
  toast.success(`تم اختيار الطالب: ${chosen.full_name}`);
};

// Filters & Pagination
const filters = ref<QueryTranscriptsDto>({
  page: 1,
  per_page: 15,
  academic_year_name: undefined,
  grade_level: undefined,
  class_name: undefined,
  section_name: undefined,
  class_academic_term_id: undefined,
  transcript_type: 'annual',
  final_status: undefined,
  search: undefined,
});

const selectedClassIdModel = ref<string | number>('all');
const selectedSectionName = ref<string>('all');
const selectedTranscriptOption = ref<string>('annual');

const meta = ref({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  total_pages: 1,
});

const totalPages = computed(() => meta.value.last_page || meta.value.total_pages || 1);

// Table Columns for Batches
const batchColumns: TableColumn[] = [
  { key: 'id', label: 'معرف الدفعة', align: 'start' },
  { key: 'from_year', label: 'من عام دراسي', align: 'start' },
  { key: 'to_year', label: 'إلى عام دراسي', align: 'start' },
  { key: 'total_students', label: 'إجمالي الطلاب', align: 'center' },
  { key: 'total_promoted', label: 'المنقولون', align: 'center' },
  { key: 'total_second_round', label: 'الدور الثاني', align: 'center' },
  { key: 'total_retained', label: 'الباقون للإعادة', align: 'center' },
  { key: 'overall_passing_rate', label: 'نسبة النجاح العامة', align: 'center' },
  { key: 'created_at', label: 'تاريخ التنفيذ', align: 'start' },
  { key: 'actions', label: 'الإجراءات', align: 'center' },
];

// Dropdown Options
const yearFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'جميع الأعوام الدراسية', value: 'all' },
  ...academicYearsList.value.map((y) => ({
    label: `${y.name} ${y.is_active ? '(النشط)' : ''}`,
    value: y.name,
  })),
]);

const classFilterOptions = computed<TaqniyaSelectOption[]>(() => [
  { label: 'كافة الصفوف الدراسية', value: 'all' },
  ...classesList.value.map((c) => ({
    label: `${c.name} ${c.stage_name ? `(${c.stage_name})` : ''}`,
    value: c.id,
  })),
]);

const sectionFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  if (selectedClassIdModel.value === 'all' || !selectedClassIdModel.value) {
    return [{ label: 'كافة الشعب المدرسية', value: 'all' }];
  }
  const currentClassSections = allSections.value.filter(
    (s) => s.class_id === Number(selectedClassIdModel.value)
  );
  if (currentClassSections.length === 0) {
    return [{ label: 'كافة الشعب (ترتيب عام)', value: 'all' }];
  }
  return [
    { label: 'كافة شعب الصف (ترتيب عام)', value: 'all' },
    ...currentClassSections.map((s) => ({
      label: `${s.section_name} (${s.total_enrolled} طالب)`,
      value: s.section_name,
    })),
  ];
});

const transcriptTypeFilterOptions = computed<TaqniyaSelectOption[]>(() => {
  const options: TaqniyaSelectOption[] = [
    { label: 'اختر نوع الصحيفة (إلزامي)...', value: 'all' },
    { label: 'النهائية', value: 'annual' },
  ];

  const classId = Number(selectedClassIdModel.value);
  if (classId && !isNaN(classId)) {
    const termsList = Array.isArray(allClassAcademicTerms.value)
      ? allClassAcademicTerms.value
      : (allClassAcademicTerms.value as any)?.classes || [];
    const classGroup = termsList.find((g: any) => Number(g.class_id) === classId);

    if (classGroup && classGroup.terms && classGroup.terms.length > 0) {
      classGroup.terms.forEach((t: any) => {
        options.push({
          label: t.term_name || `الفصل الدراسي ${t.academic_term_id}`,
          value: `term_cat_${t.id}`,
        });
      });
      return options;
    }
  }

  if (academicTermsList.value && academicTermsList.value.length > 0) {
    academicTermsList.value.forEach((t: any) => {
      options.push({
        label: t.name || `الفصل ${t.id}`,
        value: `term_at_${t.id}`,
      });
    });
  } else {
    options.push({ label: 'الفصل الأول', value: 'term_default_1' });
    options.push({ label: 'الفصل الثاني', value: 'term_default_2' });
  }

  return options;
});

const statusFilterOptions: TaqniyaSelectOption[] = [
  { label: 'كافة الحالات الأكاديمية', value: 'all' },
  { label: 'ناجح ومرحل', value: 'passed' },
  { label: 'دور ثانٍ', value: 'second_round' },
  { label: 'باقٍ للإعادة', value: 'failed' },
  { label: 'متخرج', value: 'graduated' },
];

// Computed Metrics
const totalTranscriptsCount = computed(() => meta.value.total);

const overallPassRate = computed(() => {
  if (executiveClassSummaries.value.length === 0) return 0;
  const total = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.total_students, 0);
  const passed = executiveClassSummaries.value.reduce((s: number, c: ExecutiveClassSummary) => s + c.passed_count, 0);
  return total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0;
});

// Grid Selection Handlers
const handleSelectGridClass = (classId: number, className: string, gradeLevel: number) => {
  selectedClassIdModel.value = classId;
  filters.value.class_id = classId;
  filters.value.class_name = className;
  filters.value.grade_level = gradeLevel;
  // Unset section so all sections of this class are included for general ranking
  filters.value.section_name = undefined;
  filters.value.class_section_id = undefined;
  selectedSectionName.value = 'all';
};

const handleSelectGridSection = (sec: SectionAuditProgressItem) => {
  selectedClassIdModel.value = sec.class_id;
  filters.value.class_id = sec.class_id;
  filters.value.class_name = sec.class_name;
  filters.value.grade_level = sec.grade_level;
  filters.value.section_name = sec.section_name;
  filters.value.class_section_id = sec.class_section_id;
  selectedSectionName.value = sec.section_name;
};

const handleClearGridSelection = () => {
  selectedClassIdModel.value = 'all';
  filters.value.class_id = undefined;
  filters.value.class_name = undefined;
  filters.value.grade_level = undefined;
  filters.value.section_name = undefined;
  filters.value.class_section_id = undefined;
  selectedSectionName.value = 'all';
};

// Filter Change Handlers (No auto-fetch; only updates state)
const onYearFilterChange = (val: any) => {
  if (val === 'all' || !val) {
    filters.value.academic_year_name = undefined;
  } else {
    filters.value.academic_year_name = val;
  }
  fetchSections();
};

const onClassFilterChange = (val: any) => {
  if (val === 'all' || !val) {
    filters.value.class_id = undefined;
    filters.value.class_name = undefined;
    filters.value.grade_level = undefined;
    selectedClassIdModel.value = 'all';
  } else {
    const classId = Number(val);
    selectedClassIdModel.value = classId;
    filters.value.class_id = classId;
    const cls = classesList.value.find((c) => c.id === classId);
    filters.value.class_name = cls?.name;
    filters.value.grade_level = cls?.grade_level;
  }
  selectedSectionName.value = 'all';
  filters.value.section_name = undefined;
  filters.value.class_section_id = undefined;
};

const onSectionFilterChange = (val: any) => {
  if (val === 'all' || !val) {
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
    selectedSectionName.value = 'all';
  } else {
    filters.value.section_name = val;
    selectedSectionName.value = val;
    const sec = allSections.value.find(
      (s) => s.class_id === Number(selectedClassIdModel.value) && s.section_name === val,
    );
    filters.value.class_section_id = sec?.class_section_id;
  }
};

const onTranscriptTypeChange = (val: any) => {
  selectedTranscriptOption.value = val;
  if (val === 'all' || !val) {
    filters.value.transcript_type = undefined;
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = undefined;
  } else if (val === 'annual') {
    filters.value.transcript_type = 'annual';
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = undefined;
  } else if (typeof val === 'string' && val.startsWith('term_cat_')) {
    filters.value.transcript_type = 'term';
    filters.value.class_academic_term_id = Number(val.replace('term_cat_', ''));
    filters.value.academic_term_id = undefined;
  } else if (typeof val === 'string' && val.startsWith('term_at_')) {
    filters.value.transcript_type = 'term';
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = Number(val.replace('term_at_', ''));
  } else {
    filters.value.transcript_type = 'term';
    filters.value.class_academic_term_id = undefined;
    filters.value.academic_term_id = undefined;
  }
};

// Explicit Search & Reset Actions
const executeSearch = () => {
  if (!filters.value.class_id && !filters.value.class_name && !searchInput.value.trim()) {
    toast.warning('يرجى تحديد الصف الدراسي أو إدخال اسم الطالب للاستعلام.');
    return;
  }
  filters.value.search = searchInput.value.trim() || undefined;

  // If searching by student name and no specific class was chosen from dropdown, search across all classes
  if (searchInput.value.trim() && (selectedClassIdModel.value === 'all' || !selectedClassIdModel.value)) {
    filters.value.class_id = undefined;
    filters.value.class_name = undefined;
    filters.value.grade_level = undefined;
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
  }

  filters.value.page = 1;
  hasExecutedSearch.value = true;
  fetchTranscripts();
};

const clearStudentSearch = () => {
  searchInput.value = '';
  filters.value.search = undefined;
  filters.value.page = 1;
  fetchTranscripts();
};

const resetFilters = () => {
  filters.value.class_id = undefined;
  filters.value.class_name = undefined;
  filters.value.grade_level = undefined;
  filters.value.class_section_id = undefined;
  filters.value.section_name = undefined;
  filters.value.class_academic_term_id = undefined;
  filters.value.academic_term_id = undefined;
  filters.value.academic_year_name = 'all';
  filters.value.transcript_type = 'annual';
  filters.value.final_status = undefined;
  filters.value.search = undefined;
  filters.value.page = 1;
  selectedClassIdModel.value = 'all';
  selectedSectionName.value = 'all';
  selectedTranscriptOption.value = 'annual';
  searchInput.value = '';
  transcripts.value = [];
  executiveClassSummaries.value = [];
  hasExecutedSearch.value = false;
};

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchAcademicLookups(),
    fetchSections(),
    fetchPromotionBatches(),
  ]);
});

const fetchAcademicLookups = async () => {
  try {
    const [yearsRes, classesRes, termsRes, classTermsRes] = await Promise.all([
      academicApi.getYears({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClasses({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getTerms({ per_page: 50 }).catch(() => ({ data: { data: [] } })),
      academicApi.getClassAcademicTerms({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
    ]);
    if (yearsRes.data?.data) {
      academicYearsList.value = Array.isArray(yearsRes.data.data)
        ? yearsRes.data.data
        : yearsRes.data.data.years || [];
    } else if (Array.isArray(yearsRes.data)) {
      academicYearsList.value = yearsRes.data;
    }

    if (classesRes.data?.data) {
      classesList.value = Array.isArray(classesRes.data.data)
        ? classesRes.data.data
        : classesRes.data.data.classes || [];
    } else if (Array.isArray(classesRes.data)) {
      classesList.value = classesRes.data;
    }

    academicTermsList.value = termsRes.data?.data?.terms || termsRes.data?.data || [];
    allClassAcademicTerms.value = classTermsRes.data?.data?.classes || classTermsRes.data?.data || [];
  } catch (err: any) {
    console.error('Failed to load academic lookups:', err);
  }
};

const fetchSections = async () => {
  try {
    const res = await gradeEntryApi.getSectionAuditProgress({
      academic_year_name: filters.value.academic_year_name === 'all' ? undefined : filters.value.academic_year_name,
    });
    if (res.success && res.data?.sections) {
      allSections.value = res.data.sections;
    }
  } catch (err: any) {
    console.error('Failed to load section audit progress:', err);
  }
};

const fetchTranscripts = async () => {
  isLoadingTranscripts.value = true;
  try {
    const queryParams: QueryTranscriptsDto = {
      page: filters.value.page,
      per_page: filters.value.per_page,
      academic_year_name: filters.value.academic_year_name === 'all'
        ? 'all'
        : (filters.value.academic_year_name || (filters.value.search ? 'all' : undefined)),
      class_id: filters.value.class_id,
      class_name: filters.value.class_name,
      grade_level: filters.value.grade_level,
      class_section_id: filters.value.class_section_id,
      section_name: filters.value.section_name,
      academic_term_id: filters.value.academic_term_id,
      class_academic_term_id: filters.value.class_academic_term_id,
      transcript_type: filters.value.transcript_type === 'all' ? undefined : filters.value.transcript_type,
      final_status: filters.value.final_status === 'all' ? undefined : filters.value.final_status,
      search: filters.value.search,
    };

    const res = await promotionApi.getTranscripts(queryParams);
    if (res.success) {
      if (Array.isArray(res.data)) {
        transcripts.value = res.data;
      } else if (res.data && Array.isArray(res.data.transcripts)) {
        transcripts.value = res.data.transcripts;
        if (Array.isArray(res.data.classes_summary)) {
          executiveClassSummaries.value = res.data.classes_summary;
        }
      } else {
        transcripts.value = [];
      }

      if (res.meta?.class_summaries && Array.isArray(res.meta.class_summaries) && res.meta.class_summaries.length > 0) {
        executiveClassSummaries.value = res.meta.class_summaries;
      }

      meta.value = {
        current_page: res.meta?.current_page || 1,
        per_page: res.meta?.per_page || 15,
        total: res.meta?.total !== undefined ? res.meta.total : transcripts.value.length,
        last_page: res.meta?.last_page || 1,
        total_pages: res.meta?.last_page || res.meta?.total_pages || 1,
      };
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل جلب كشوفات الدرجات.');
  } finally {
    isLoadingTranscripts.value = false;
  }
};

const fetchPromotionBatches = async () => {
  isLoadingBatches.value = true;
  try {
    const res = await promotionApi.getPromotionBatches({ per_page: 50 });
    if (res.success) {
      promotionBatches.value = res.data;
    }
  } catch (err: any) {
    console.error('Failed to load promotion batches:', err);
  } finally {
    isLoadingBatches.value = false;
  }
};

const handleSelectClassCard = (cSum: ExecutiveClassSummary) => {
  const matchClass = classesList.value.find((c) => c.name === cSum.class_name);
  if (filters.value.class_name === cSum.class_name) {
    filters.value.class_id = undefined;
    filters.value.class_name = undefined;
    filters.value.grade_level = undefined;
    selectedClassIdModel.value = 'all';
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
    selectedSectionName.value = 'all';
  } else {
    filters.value.class_id = matchClass?.id;
    filters.value.class_name = cSum.class_name;
    filters.value.grade_level = cSum.grade_level;
    selectedClassIdModel.value = matchClass ? matchClass.id : 'all';
    filters.value.section_name = undefined;
    filters.value.class_section_id = undefined;
    selectedSectionName.value = 'all';
  }
  filters.value.page = 1;
  fetchTranscripts();
};

const handlePageChange = (page: number) => {
  filters.value.page = page;
  fetchTranscripts();
};

const handleViewTranscriptDetail = async (transcript: StudentTranscript) => {
  selectedTranscript.value = transcript;
  isDetailDrawerOpen.value = true;
  try {
    const res = await promotionApi.getTranscriptById(transcript.id);
    if (res.success && res.data) {
      selectedTranscript.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch full transcript details:', err);
  }
};

const handleViewBatchDetail = async (batch: PromotionBatch) => {
  selectedBatch.value = batch;
  isBatchDetailDrawerOpen.value = true;
  try {
    const res = await promotionApi.getPromotionBatchById(batch.id);
    if (res.success && res.data) {
      selectedBatch.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch full batch details:', err);
  }
};

const openPromotionModal = () => {
  promotionSimulation.value = null;
  isPromotionModalOpen.value = true;
};

const handleRunSimulation = async (payload: { from_year_id: number; to_year_id: number; enable_annual_exam_compensation?: boolean }) => {
  isSimulating.value = true;
  try {
    const res = await promotionApi.previewPromotion({
      from_academic_year_id: payload.from_year_id,
      to_academic_year_id: payload.to_year_id,
      enable_annual_exam_compensation: payload.enable_annual_exam_compensation,
    });
    if (res.success) {
      promotionSimulation.value = res.data;
      toast.success(res.message || 'تم توليد محاكاة الترحيل بنجاح.');
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل تشغيل محاكاة الترحيل.');
  } finally {
    isSimulating.value = false;
  }
};

const handleExecutePromotion = async (payload: ExecutePromotionDto) => {
  isExecutingPromotion.value = true;
  try {
    const res = await promotionApi.executePromotion(payload);
    if (res.success) {
      toast.success(res.message || 'تم تنفيذ الترحيل الأكاديمي بنجاح وتفعيل العام الدراسي الجديد.');
      isPromotionModalOpen.value = false;
      await Promise.all([
        fetchAcademicLookups(),
        fetchSections(),
        fetchTranscripts(),
        fetchPromotionBatches(),
      ]);
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل تنفيذ الترحيل السنوي.');
  } finally {
    isExecutingPromotion.value = false;
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>
