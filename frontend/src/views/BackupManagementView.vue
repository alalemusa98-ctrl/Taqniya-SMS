<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from '../composables/useToast';
import { backupApi, type BackupItem, type BackupSummary, type BackupType } from '../api/backup.api';
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
  Package,
  Layers,
} from 'lucide-vue-next';

const toast = useToast();

const backups = ref<BackupItem[]>([]);
const summary = ref<BackupSummary>({
  total_backups: 0,
  total_size: '0 B',
  full_count: 0,
  database_count: 0,
  files_count: 0,
  storage_directory: '',
});
const loading = ref(false);
const searchQuery = ref('');
const activeTab = ref<'all' | BackupType>('all');

// Modal states
const showCreateModal = ref(false);
const showUploadModal = ref(false);
const restoreTarget = ref<BackupItem | null>(null);
const deleteTarget = ref<BackupItem | null>(null);
const deleting = ref(false);

const tableColumns: TableColumn[] = [
  { key: 'filename', label: 'ملف النسخة الاحتياطية' },
  { key: 'type', label: 'نوع النسخة والتصنيف' },
  { key: 'created_at', label: 'تاريخ وتوقيت الإنشاء' },
  { key: 'size', label: 'حجم الملف' },
  { key: 'note', label: 'الملاحظة والوصف' },
  { key: 'actions', label: 'الإجراءات والعمليات', align: 'center' },
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
  let list = backups.value;

  // Filter by active tab
  if (activeTab.value !== 'all') {
    list = list.filter(b => b.type === activeTab.value);
  }

  // Filter by search query
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list;

  return list.filter(
    b =>
      b.filename.toLowerCase().includes(q) ||
      (b.note && b.note.toLowerCase().includes(q)) ||
      b.created_at.includes(q),
  );
});

const latestBackup = computed(() => {
  return backups.value.length > 0 ? backups.value[0] : null;
});

const downloadingFilename = ref<string | null>(null);

const handleDownload = async (backup: BackupItem) => {
  downloadingFilename.value = backup.filename;
  try {
    await backupApi.downloadBackup(backup.filename);
    toast.success(`بدأ تنزيل ملف النسخة الاحتياطية (${backup.filename}) بنجاح.`);
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'تعذر تنزيل ملف النسخة الاحتياطية.');
  } finally {
    downloadingFilename.value = null;
  }
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

const getTypeMeta = (type: BackupType) => {
  if (type === 'database') {
    return {
      label: 'قاعدة بيانات',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: Database,
    };
  }
  if (type === 'files') {
    return {
      label: 'ملفات ومرفقات',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: FolderArchive,
    };
  }
  return {
    label: 'نسخة شاملة',
    badgeClass: 'bg-purple-500/10 text-bx-primary border-purple-500/20',
    icon: Package,
  };
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
              إدارة النسخ الاحتياطي واستعادة البيانات والملفات
            </h1>
            <p class="text-xs sm:text-sm text-bx-muted mt-1 font-medium">
              محرك النسخ المنفصل: تفريغ خفيف لقواعد البيانات، أرشفة شجرية للمرفقات، والتعافي من الكوارث (Disaster Recovery)
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            @click="fetchBackups"
            :disabled="loading"
            class="h-10 px-4 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] hover:bg-bx-surface-2 text-bx-title font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
            <span class="hidden sm:inline">تحديث</span>
          </button>

          <button
            type="button"
            @click="showUploadModal = true"
            class="h-10 px-4 rounded-xl border border-[#B4AED8] dark:border-white/[0.12] bg-[var(--bx-surface-solid)] hover:bg-bx-surface-2 text-bx-title font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Upload class="w-4 h-4 text-bx-primary" />
            <span>رفع واستيراد نسخة</span>
          </button>

          <button
            type="button"
            @click="showCreateModal = true"
            class="h-10 px-5 rounded-xl bg-bx-primary hover:bg-bx-primary/90 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>إنشاء نسخة احتياطية</span>
          </button>
        </div>
      </header>

      <!-- KPI Overview Cards using TaqniyaKpiCard -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TaqniyaKpiCard
          :icon="Database"
          title="إجمالي النسخ الاحتياطية"
          :value="summary.total_backups"
          :badgeText="`${summary.database_count} قاعدة | ${summary.files_count} ملفات | ${summary.full_count} شاملة`"
          variant="primary"
        />

        <TaqniyaKpiCard
          :icon="HardDrive"
          title="المساحة التخزينية الكلية"
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
          badgeText="MySQL + Files Atomic"
          :pulseBadge="true"
          variant="amber"
        />
      </section>

      <!-- Type Filter Tabs Navigation -->
      <section class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-2xl bg-bx-surface border border-bx-border shadow-xs">
        <div class="flex items-center gap-1.5 overflow-x-auto p-1">
          <button
            type="button"
            @click="activeTab = 'all'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0',
              activeTab === 'all'
                ? 'bg-bx-primary text-white shadow-xs'
                : 'text-bx-muted hover:text-bx-title hover:bg-bx-surface-2'
            ]"
          >
            <Layers class="w-3.5 h-3.5" />
            <span>كافة النسخ</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full" :class="activeTab === 'all' ? 'bg-white/20' : 'bg-bx-surface-3'">
              {{ backups.length }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'database'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0',
              activeTab === 'database'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-bx-muted hover:text-bx-title hover:bg-bx-surface-2'
            ]"
          >
            <Database class="w-3.5 h-3.5" />
            <span>قاعدة البيانات</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full" :class="activeTab === 'database' ? 'bg-white/20' : 'bg-bx-surface-3'">
              {{ summary.database_count }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'files'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0',
              activeTab === 'files'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-bx-muted hover:text-bx-title hover:bg-bx-surface-2'
            ]"
          >
            <FolderArchive class="w-3.5 h-3.5" />
            <span>الملفات والمرفقات</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full" :class="activeTab === 'files' ? 'bg-white/20' : 'bg-bx-surface-3'">
              {{ summary.files_count }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'full'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0',
              activeTab === 'full'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-bx-muted hover:text-bx-title hover:bg-bx-surface-2'
            ]"
          >
            <Package class="w-3.5 h-3.5" />
            <span>نسخ شاملة</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full" :class="activeTab === 'full' ? 'bg-white/20' : 'bg-bx-surface-3'">
              {{ summary.full_count }}
            </span>
          </button>
        </div>

        <!-- Search input -->
        <div class="relative w-full sm:w-72 px-1">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="ابحث بالاسم أو الملاحظة..."
            class="w-full h-9 pr-9 pl-4 rounded-xl border border-bx-border bg-bx-bg text-xs font-bold text-bx-text focus:outline-none focus:border-bx-primary transition-all"
          />
          <Search class="w-3.5 h-3.5 text-bx-muted absolute right-3.5 top-2.5" />
        </div>
      </section>

      <!-- Standard TaqniyaTable Component -->
      <section>
        <TaqniyaTable
          :columns="tableColumns"
          :items="filteredBackups"
          :isLoading="loading"
          rowKey="filename"
          emptyTitle="لا توجد نسخ احتياطية مطابقة للتصفية"
          emptySubtitle="يمكنك إنشاء نسخة احتياطية جديدة أو استيراد ملف خارجي في أي وقت."
          :emptyIcon="Database"
          loadingText="جاري قراءة وفحص ملفات النسخ الاحتياطية..."
        >
          <!-- Filename Cell -->
          <template #cell-filename="{ item }">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-bx-primary/10 border border-bx-primary/20 text-bx-primary flex items-center justify-center shrink-0">
                <Database v-if="item.type === 'database'" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <FolderArchive v-else-if="item.type === 'files'" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <Package v-else class="w-4 h-4 text-bx-primary" />
              </div>
              <div class="min-w-0">
                <span class="font-mono text-xs font-bold text-bx-title block dir-ltr text-right truncate">
                  {{ item.filename }}
                </span>
                <span class="text-[10px] font-semibold text-bx-muted">أرشيف مضغوط (.zip)</span>
              </div>
            </div>
          </template>

          <!-- Type Cell -->
          <template #cell-type="{ item }">
            <div class="flex items-center gap-1.5">
              <component :is="getTypeMeta(item.type).icon" class="w-3.5 h-3.5 text-bx-muted" />
              <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold border" :class="getTypeMeta(item.type).badgeClass">
                {{ getTypeMeta(item.type).label }}
              </span>
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

          <!-- Standard Actions Cell with Design System Circular Buttons -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-center gap-1.5">
              <!-- Download Button -->
              <button
                type="button"
                @click="handleDownload(item)"
                :disabled="downloadingFilename === item.filename"
                class="w-7 h-7 rounded-full border border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50"
                title="تنزيل ملف النسخة الاحتياطية"
              >
                <RefreshCw v-if="downloadingFilename === item.filename" class="w-3.5 h-3.5 animate-spin" />
                <Download v-else class="w-3.5 h-3.5" />
              </button>

              <!-- Restore Button -->
              <button
                type="button"
                @click="restoreTarget = item"
                class="w-7 h-7 rounded-full border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="استعادة البيانات من هذه النسخة"
              >
                <RotateCcw class="w-3.5 h-3.5" />
              </button>

              <!-- Delete Button -->
              <button
                type="button"
                @click="deleteTarget = item"
                class="w-7 h-7 rounded-full border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="حذف ملف النسخة الاحتياطية"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
        </TaqniyaTable>
      </section>

      <!-- Modals Integration -->
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
            هل أنت متأكد من رغبتك في حذف ملف النسخة الاحتياطية <strong class="font-mono text-rose-700 dark:text-rose-300 font-bold">{{ deleteTarget.filename }}</strong>؟ لن تتمكن من استعادة البيانات أو الملفات من هذا الأرشيف بعد حذفه.
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
