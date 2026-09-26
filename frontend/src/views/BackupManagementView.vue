<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from '../composables/useToast';
import { backupApi, type BackupItem, type BackupSummary } from '../api/backup.api';
import CreateBackupModal from '../components/backup/CreateBackupModal.vue';
import RestoreBackupModal from '../components/backup/RestoreBackupModal.vue';
import UploadBackupModal from '../components/backup/UploadBackupModal.vue';
import TaqniyaErrorBoundary from '../components/ui/TaqniyaErrorBoundary.vue';
import TaqniyaKpiCard from '../components/ui/TaqniyaKpiCard.vue';
import TaqniyaTable, { type TableColumn } from '../components/ui/TaqniyaTable.vue';
import TaqniyaModal from '../components/ui/TaqniyaModal.vue';
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
  FolderArchive,
} from 'lucide-vue-next';

const toast = useToast();

const backups = ref<BackupItem[]>([]);
const summary = ref<BackupSummary>({
  total_backups: 0,
  total_size: '0 B',
  storage_directory: '',
});
const loading = ref(false);
const searchQuery = ref('');

// Modal states
const showCreateModal = ref(false);
const showUploadModal = ref(false);
const restoreTarget = ref<BackupItem | null>(null);
const deleteTarget = ref<BackupItem | null>(null);
const deleting = ref(false);

const tableColumns: TableColumn[] = [
  { key: 'filename', label: 'ملف النسخة الاحتياطية' },
  { key: 'created_at', label: 'تاريخ وتوقيت الإنشاء' },
  { key: 'size', label: 'حجم الملف' },
  { key: 'note', label: 'الملاحظة والوصف' },
  { key: 'actions', label: 'الإجراءات والعمليات', align: 'end' },
];

const fetchBackups = async () => {
  loading.value = true;
  try {
    const data = await backupApi.listBackups();
    summary.value = data.summary;
    backups.value = data.backups;
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'تعذر تحميل قائمة النسخ الاحتياطية');
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
    toast.success(`تم حذف النسخة الاحتياطية (${deleteTarget.value.filename}) بنجاح.`);
    deleteTarget.value = null;
    await fetchBackups();
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'فشل حذف النسخة الاحتياطية');
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchBackups();
});
</script>

<template>
  <TaqniyaErrorBoundary>
    <div class="space-y-8 p-6 sm:p-8 max-w-[1600px] mx-auto min-h-screen text-bx-text font-sans" dir="rtl">

      <!-- Standard Page Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#B4AED8] dark:border-white/[0.08]">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center border border-bx-primary/20 shadow-xs">
            <Database class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-bx-title font-display tracking-tight">
              إدارة النسخ الاحتياطي واستعادة البيانات
            </h1>
            <p class="text-xs sm:text-sm text-bx-muted mt-1 font-medium">
              تفريغ وحفظ قواعد البيانات، الاستعادة الآمنة، والأرشفة المضغوطة للتعافي من الكوارث (Disaster Recovery)
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            @click="fetchBackups"
            :disabled="loading"
            class="h-11 px-4 rounded-2xl border border-bx-border bg-bx-surface hover:bg-bx-bg text-bx-text font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
            <span class="hidden sm:inline">تحديث</span>
          </button>

          <button
            type="button"
            @click="showUploadModal = true"
            class="h-11 px-5 rounded-2xl border border-bx-border bg-bx-surface hover:bg-bx-bg text-bx-text font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Upload class="w-4 h-4 text-bx-primary" />
            <span>رفع واستيراد نسخة</span>
          </button>

          <button
            type="button"
            @click="showCreateModal = true"
            class="px-5 py-2.5 rounded-2xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>إنشاء نسخة احتياطية</span>
          </button>
        </div>
      </header>

      <!-- KPI Overview Cards using TaqniyaKpiCard -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TaqniyaKpiCard
          :icon="FolderArchive"
          title="إجمالي النسخ المتاحة"
          :value="summary.total_backups"
          badgeText="ملفات ZIP مؤمنة"
          variant="primary"
        />

        <TaqniyaKpiCard
          :icon="HardDrive"
          title="المساحة التخزينية"
          :value="summary.total_size"
          badgeText="storage/backups"
          variant="emerald"
        />

        <TaqniyaKpiCard
          :icon="Clock"
          title="أحدث نسخة احتياطية"
          :value="latestBackup ? latestBackup.created_at : '—'"
          :badgeText="latestBackup?.note ? 'مصحوبة بوصف' : 'بدون ملاحظة'"
          variant="blue"
        />

        <TaqniyaKpiCard
          :icon="ShieldCheck"
          title="حالة محرك الاستعادة"
          value="جاهز ونشط"
          badgeText="MySQL 8.0 Chunked"
          :pulseBadge="true"
          variant="amber"
        />
      </section>

      <!-- Search and Controls Bar -->
      <section class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-bx-surface border border-bx-border shadow-xs">
        <div class="relative w-full sm:w-80">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="ابحث باسم الملف أو الملاحظة..."
            class="w-full h-11 pr-10 pl-4 rounded-xl border border-bx-border bg-bx-bg text-xs font-bold text-bx-text focus:outline-none focus:border-bx-primary transition-all"
          />
          <Search class="w-4 h-4 text-bx-muted absolute right-3.5 top-3.5" />
        </div>

        <div class="text-xs font-bold text-bx-muted">
          عرض <span class="text-bx-primary font-extrabold">{{ filteredBackups.length }}</span> من إجمالي <span class="text-bx-title font-extrabold">{{ backups.length }}</span> نسخة
        </div>
      </section>

      <!-- Standard TaqniyaTable Component -->
      <section>
        <TaqniyaTable
          :columns="tableColumns"
          :items="filteredBackups"
          :isLoading="loading"
          rowKey="filename"
          emptyTitle="لا توجد نسخ احتياطية متاحة حالياً"
          emptySubtitle="يمكنك إنشاء نسخة احتياطية جديدة لقاعدة البيانات بنقرة زر أو استيراد ملف خارجي."
          :emptyIcon="Database"
          loadingText="جاري قراءة وفحص ملفات النسخ الاحتياطية..."
        >
          <!-- Filename Cell -->
          <template #cell-filename="{ item }">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-bx-primary/10 border border-bx-primary/20 text-bx-primary flex items-center justify-center shrink-0">
                <Database class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <span class="font-mono text-xs font-bold text-bx-title block dir-ltr text-right truncate">
                  {{ item.filename }}
                </span>
                <span class="text-[10px] font-semibold text-bx-muted">أرشيف SQL مضغوط</span>
              </div>
            </div>
          </template>

          <!-- Created At Cell -->
          <template #cell-created_at="{ item }">
            <div class="flex items-center gap-1.5 text-bx-muted font-medium text-xs">
              <Clock class="w-3.5 h-3.5 text-bx-primary" />
              <span>{{ item.created_at }}</span>
            </div>
          </template>

          <!-- Size Cell -->
          <template #cell-size="{ item }">
            <span class="font-mono text-xs font-extrabold text-bx-title">
              {{ item.size }}
            </span>
          </template>

          <!-- Note Cell -->
          <template #cell-note="{ item }">
            <div v-if="item.note" class="p-2 rounded-xl bg-bx-bg text-bx-text flex items-start gap-1.5 border border-bx-border max-w-xs">
              <FileText class="w-3.5 h-3.5 text-bx-primary shrink-0 mt-0.5" />
              <span class="truncate text-xs font-medium">{{ item.note }}</span>
            </div>
            <span v-else class="text-bx-muted italic text-[11px]">بدون ملاحظة</span>
          </template>

          <!-- Actions Cell -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-2">
              <!-- Download -->
              <button
                type="button"
                @click="handleDownload(item)"
                class="h-8 px-3 rounded-xl border border-bx-primary/30 bg-bx-primary/10 hover:bg-bx-primary hover:text-white text-bx-primary font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="تنزيل إلى جهازك"
              >
                <Download class="w-3.5 h-3.5" />
                <span>تنزيل</span>
              </button>

              <!-- Restore -->
              <button
                type="button"
                @click="restoreTarget = item"
                class="h-8 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="استعادة قاعدة البيانات"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>استعادة</span>
              </button>

              <!-- Delete -->
              <button
                type="button"
                @click="deleteTarget = item"
                class="h-8 px-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="حذف من السيرفر"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            </div>
          </template>
        </TaqniyaTable>
      </section>

      <!-- Modals -->
      <CreateBackupModal
        v-if="showCreateModal"
        @close="showCreateModal = false"
        @success="(msg) => { toast.success(msg); fetchBackups(); }"
      />

      <UploadBackupModal
        v-if="showUploadModal"
        @close="showUploadModal = false"
        @success="(msg) => { toast.success(msg); fetchBackups(); }"
      />

      <RestoreBackupModal
        v-if="restoreTarget"
        :backup="restoreTarget"
        @close="restoreTarget = null"
        @success="(msg) => { toast.success(msg); fetchBackups(); }"
      />

      <!-- Delete Confirmation Modal -->
      <TaqniyaModal
        :is-open="Boolean(deleteTarget)"
        title="حذف النسخة الاحتياطية (Delete Backup)"
        subtitle="إزالة الملف نهائياً من مسار التخزين بالسيرفر"
        max-width="md"
        @close="deleteTarget = null"
      >
        <template #icon>
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-xs">
            <Trash2 class="w-5 h-5" />
          </div>
        </template>

        <div v-if="deleteTarget" class="space-y-4" dir="rtl">
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 text-xs leading-relaxed">
            هل أنت متأكد من رغبتك في حذف ملف النسخة الاحتياطية <strong class="font-mono text-rose-700 dark:text-rose-300 font-bold">{{ deleteTarget.filename }}</strong>؟ لن تتمكن من استعادة البيانات من هذا الملف بعد حذفه.
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between w-full">
            <button
              type="button"
              class="px-5 py-2 text-xs font-bold rounded-xl bg-bx-surface-2 hover:bg-bx-surface-3 text-bx-title border border-bx-border transition-colors cursor-pointer"
              :disabled="deleting"
              @click="deleteTarget = null"
            >
              إلغاء
            </button>

            <button
              type="button"
              class="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              :disabled="deleting"
              @click="confirmDelete"
            >
              <Trash2 class="w-4 h-4" />
              <span>{{ deleting ? 'جاري الحذف...' : 'نعم، حذف الملف الآن' }}</span>
            </button>
          </div>
        </template>
      </TaqniyaModal>
    </div>
  </TaqniyaErrorBoundary>
</template>
