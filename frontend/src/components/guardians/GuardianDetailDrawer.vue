<script setup lang="ts">
import {
  User,
  Edit2,
  Link,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import type { Guardian } from '../../api/guardians.api';

interface Props {
  isOpen: boolean;
  guardian?: Guardian | null;
}

withDefaults(defineProps<Props>(), {
  guardian: null,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', guardian: Guardian): void;
  (e: 'manage-custody', guardian: Guardian): void;
}>();

const relationshipLabels: Record<string, string> = {
  father: 'أب',
  mother: 'أم',
  brother: 'أخ',
  uncle: 'عم / خال',
  other: 'صلة قرابة أخرى',
};
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    title="الملف الشخصي لولي الأمر"
    subtitle="تفاصيل الحساب الموحد وبيانات التواصل وصلة القرابة"
    :icon="User"
    max-width="max-w-[550px]"
    @close="emit('close')"
  >
    <div v-if="guardian" class="space-y-6">
      <div class="p-5 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">الرمز المؤسسي الموحد</span>
          <span class="font-mono font-bold text-xs text-bx-primary px-2.5 py-0.5 rounded-full bg-bx-primary/10 border border-bx-primary/20">
            {{ guardian.user_code }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">الاسم الكامل</span>
          <span class="font-black text-xs text-bx-title">{{ guardian.full_name }}</span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">رقم الهاتف للتواصل</span>
          <span class="font-mono text-xs text-bx-title" dir="ltr">
            {{ guardian.phone }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">صلة القرابة المعتمدة</span>
          <span class="font-bold text-xs text-bx-primary">
            {{ relationshipLabels[guardian.relationship] || guardian.relationship }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">عدد الأبناء المكفولين</span>
          <span class="font-mono font-bold text-xs text-bx-title">
            {{ guardian.students_count }} طلاب
          </span>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-xs font-bold text-bx-muted">تاريخ التسجيل</span>
          <span class="font-mono text-[11px] text-bx-muted">
            {{ guardian.created_at ? new Date(guardian.created_at).toLocaleDateString('ar-LY') : '—' }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إغلاق
        </button>
        <div v-if="guardian" class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('manage-custody', guardian)"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 text-xs font-bold transition-all cursor-pointer"
          >
            <Link class="w-3.5 h-3.5" />
            <span>إدارة الوصاية الأسرية</span>
          </button>
          <button
            type="button"
            @click="emit('edit', guardian)"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
            <span>تعديل البيانات</span>
          </button>
        </div>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
