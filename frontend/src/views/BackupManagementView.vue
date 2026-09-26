<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { backupApi, type BackupItem, type BackupSummary } from '../api/backup.api';
import CreateBackupModal from '../components/backup/CreateBackupModal.vue';
import RestoreBackupModal from '../components/backup/RestoreBackupModal.vue';
import UploadBackupModal from '../components/backup/UploadBackupModal.vue';
import {
  Database,
  Download,
  RotateCcw,
  Trash2,
  Upload,
  Plus,
  HardDrive,
  Clock,
  ShieldCheck,
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-vue-next';

const backups = ref<BackupItem[]>([]);
const summary = ref<BackupSummary>({
  total_backups: 0,
  total_size: '0 B',
  storage_directory: '',
});
const loading = ref(false);
const searchQuery = ref('');
const toastMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null);

// Modal states
const showCreateModal = ref(false);
const showUploadModal = ref(false);
const restoreTarget = ref<BackupItem | null>(null);
const deleteTarget = ref<BackupItem | null>(null);
const deleting = ref(false);

const showToast = (text: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = { text, type };
  setTimeout(() => {
    toastMessage.value = null;
  }, 4500);
};

const fetchBackups = async () => {
  loading.value = true;
  try {
    const data = await backupApi.listBackups();
    summary.value = data.summary;
    backups.value = data.backups;
  } catch (err: any) {
    showToast(err.response?.data?.message || 'تعذر تحميل قائمة النسخ الاحتياطية', 'error');
  } finally {
    loading.value = false;
  }
};

const filteredBackups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return backups.value;
  return backups.value.filter(
    b =>
      b.filename.toLowerCase().includes(q) ||
      (b.note && b.note.toLowerCase().includes(q)) ||
      b.created_at.includes(q),
  );
});

const latestBackup = computed(() => {
  return backups.value.length > 0 ? backups.value[0] : null;
});

const handleDownload = (backup: BackupItem) => {
  const url = backupApi.getDownloadUrl(backup.filename);
  window.open(url, '_blank');
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await backupApi.deleteBackup(deleteTarget.value.filename);
    showToast(`تم حذف النسخة الاحتياطية (${deleteTarget.value.filename}) بنجاح.`);
    deleteTarget.value = null;
    await fetchBackups();
  } catch (err: any) {
    showToast(err.response?.data?.message || 'فشل حذف النسخة الاحتياطية', 'error');
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchBackups();
});
</script>

<template>
  <div class="space-y-8 p-4 sm:p-6 lg:p-8 dir-rtl text-right">
    <!-- Toast Notification Banner -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toastMessage"
        :class="[
          'fixed bottom-6 left-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md',
          toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
            : 'bg-red-600 text-white border-red-500 shadow-red-500/20'
        ]"
      >
        <CheckCircle2 v-if="toastMessage.type === 'success'" class="w-6 h-6 shrink-0" />
        <AlertCircle v-else class="w-6 h-6 shrink-0" />
        <span class="text-sm font-bold">{{ toastMessage.text }}</span>
      </div>
    </transition>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shadow-md">
          <Database class="w-7 h-7" />
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            إدارة النسخ الاحتياطي واستعادة البيانات
          </h1>
          <p class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>تفريغ وحفظ قواعد البيانات، الاستعادة الآمنة، والأرشفة المضغوطة (Disaster Recovery)</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          @click="fetchBackups"
          :disabled="loading"
          class="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          title="تحديث البيانات"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
          <span class="hidden sm:inline">تحديث</span>
        </button>

        <button
          type="button"
          @click="showUploadModal = true"
          class="h-12 px-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <Upload class="w-4 h-4 text-indigo-500" />
          <span>رفع واستيراد نسخة</span>
        </button>

        <button
          type="button"
          @click="showCreateModal = true"
          class="h-12 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Plus class="w-5 h-5" />
          <span>إنشاء نسخة احتياطية</span>
        </button>
      </div>
    </div>

    <!-- 4 KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Backups -->
      <div class="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500">إجمالي النسخ المتاحة</div>
          <div class="text-3xl font-black text-slate-900 dark:text-white mt-1">{{ summary.total_backups }}</div>
          <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">ملفات أرشيف ZIP مؤمنة</div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
          <Database class="w-6 h-6" />
        </div>
      </div>

      <!-- Total Size -->
      <div class="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500">المساحة التخزينية المستهلكة</div>
          <div class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{{ summary.total_size }}</div>
          <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">داخل مسار storage/backups</div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <HardDrive class="w-6 h-6" />
        </div>
      </div>

      <!-- Latest Backup -->
      <div class="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl flex items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500">آخر نسخة احتياطية</div>
          <div class="text-lg font-black text-slate-800 dark:text-slate-100 mt-1 truncate">
            {{ latestBackup ? latestBackup.created_at : 'لا توجد نسخ' }}
          </div>
          <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">
            {{ latestBackup?.note || 'بدون ملاحظة وصفية' }}
          </div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
          <Clock class="w-6 h-6" />
        </div>
      </div>

      <!-- Engine Status -->
      <div class="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500">حالة محرك الاستعادة</div>
          <div class="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>جاهز ونشط</span>
          </div>
          <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">MySQL 8.0 / Chunked 500</div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
          <ShieldCheck class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Search and Controls Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div class="relative w-full sm:w-80">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="ابحث باسم الملف أو الملاحظة..."
          class="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary"
        />
        <Search class="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      <div class="text-xs font-bold text-slate-500 dark:text-slate-400">
        عرض <span class="text-primary font-extrabold">{{ filteredBackups.length }}</span> من إجمالي <span class="text-slate-700 dark:text-slate-200 font-extrabold">{{ backups.length }}</span> نسخة
      </div>
    </div>

    <!-- Main Backups Table -->
    <div class="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-xl">
      <!-- Loading State -->
      <div v-if="loading" class="p-16 text-center space-y-4">
        <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="text-sm font-bold text-slate-500">جارٍ قراءة وفحص ملفات النسخ الاحتياطية...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBackups.length === 0" class="p-16 text-center space-y-4">
        <div class="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
          <Database class="w-10 h-10" />
        </div>
        <div class="space-y-1">
          <div class="text-base font-black text-slate-800 dark:text-slate-200">لا توجد نسخ احتياطية مطابقة</div>
          <div class="text-xs font-bold text-slate-400">يمكنك إنشاء نسخة احتياطية جديدة الآن لقاعدة البيانات أو استيراد ملف خارجي.</div>
        </div>
        <button
          type="button"
          @click="showCreateModal = true"
          class="h-11 px-6 rounded-xl bg-primary text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>إنشاء نسخة أولى الآن</span>
        </button>
      </div>

      <!-- Desktop Table -->
      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-right border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-bold">
              <th class="py-4 px-6">ملف النسخة الاحتياطية</th>
              <th class="py-4 px-6">تاريخ الإنشاء</th>
              <th class="py-4 px-6">حجم الملف</th>
              <th class="py-4 px-6">الملاحظة والوصف</th>
              <th class="py-4 px-6 text-center">الإجراءات والعمليات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="backup in filteredBackups"
              :key="backup.filename"
              class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <!-- Filename -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Database class="w-5 h-5" />
                  </div>
                  <div>
                    <span class="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 block dir-ltr text-right">
                      {{ backup.filename }}
                    </span>
                    <span class="text-[10px] font-semibold text-slate-400">أرشيف SQL مضغوط</span>
                  </div>
                </div>
              </td>

              <!-- Date -->
              <td class="py-4 px-6 font-semibold text-xs text-slate-600 dark:text-slate-300">
                <div class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ backup.created_at }}</span>
                </div>
              </td>

              <!-- Size -->
              <td class="py-4 px-6 font-mono text-xs font-extrabold text-slate-700 dark:text-slate-200">
                {{ backup.size }}
              </td>

              <!-- Note -->
              <td class="py-4 px-6 text-xs font-medium max-w-xs">
                <div v-if="backup.note" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-start gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
                  <FileText class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span class="truncate">{{ backup.note }}</span>
                </div>
                <span v-else class="text-slate-400 italic text-[11px]">بدون ملاحظة</span>
              </td>

              <!-- Actions -->
              <td class="py-4 px-6">
                <div class="flex items-center justify-center gap-2">
                  <!-- Download -->
                  <button
                    type="button"
                    @click="handleDownload(backup)"
                    class="h-9 px-3.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="تنزيل إلى جهازك"
                  >
                    <Download class="w-3.5 h-3.5" />
                    <span>تنزيل</span>
                  </button>

                  <!-- Restore -->
                  <button
                    type="button"
                    @click="restoreTarget = backup"
                    class="h-9 px-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="استعادة قاعدة البيانات"
                  >
                    <RotateCcw class="w-3.5 h-3.5" />
                    <span>استعادة</span>
                  </button>

                  <!-- Delete -->
                  <button
                    type="button"
                    @click="deleteTarget = backup"
                    class="h-9 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="حذف من السيرفر"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards View -->
      <div class="md:hidden p-4 space-y-4">
        <div
          v-for="backup in filteredBackups"
          :key="backup.filename"
          class="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
        >
          <div class="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
            <div class="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Database class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-mono text-xs font-bold text-slate-900 dark:text-white block dir-ltr text-right truncate">
                {{ backup.filename }}
              </span>
              <span class="text-[11px] font-semibold text-slate-400 mt-0.5 block">
                {{ backup.created_at }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-slate-400">حجم الملف:</span>
            <span class="text-slate-800 dark:text-slate-100 font-mono">{{ backup.size }}</span>
          </div>

          <div v-if="backup.note" class="text-xs font-medium text-slate-600 dark:text-slate-300 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong class="text-primary font-bold">الملاحظة:</strong> {{ backup.note }}
          </div>

          <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              @click="handleDownload(backup)"
              class="h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Download class="w-3.5 h-3.5" />
              <span>تنزيل</span>
            </button>

            <button
              type="button"
              @click="restoreTarget = backup"
              class="h-10 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>استعادة</span>
            </button>

            <button
              type="button"
              @click="deleteTarget = backup"
              class="h-10 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateBackupModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @success="(msg) => { showToast(msg); fetchBackups(); }"
    />

    <UploadBackupModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @success="(msg) => { showToast(msg); fetchBackups(); }"
    />

    <RestoreBackupModal
      v-if="restoreTarget"
      :backup="restoreTarget"
      @close="restoreTarget = null"
      @success="(msg) => { showToast(msg); fetchBackups(); }"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      @click.self="deleteTarget = null"
    >
      <div class="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-right dir-rtl">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Trash2 class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">حذف النسخة الاحتياطية</h3>
            <p class="text-xs text-slate-400 mt-0.5">إزالة الملف نهائياً من السيرفر</p>
          </div>
        </div>

        <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          هل أنت متأكد من رغبتك في حذف ملف النسخة الاحتياطية <strong class="font-mono text-slate-900 dark:text-white font-bold">{{ deleteTarget.filename }}</strong>؟ لن تتمكن من استعادة البيانات من هذا الملف بعد حذفه.
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="button"
            @click="confirmDelete"
            :disabled="deleting"
            class="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 class="w-4 h-4" />
            <span>{{ deleting ? 'جارٍ الحذف...' : 'نعم، حذف الملف الآن' }}</span>
          </button>
          <button
            type="button"
            @click="deleteTarget = null"
            :disabled="deleting"
            class="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
