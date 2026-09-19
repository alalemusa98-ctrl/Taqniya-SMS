<script setup lang="ts">
import {
  GraduationCap,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-vue-next';
import type { Teacher } from '../../api/teachers.api';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';

defineProps<{
  isOpen: boolean;
  teacher: Teacher | null;
  isUpdatingStatus?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', teacher: Teacher): void;
  (e: 'delete', teacher: Teacher): void;
  (e: 'toggle-status', teacher: Teacher): void;
}>();
</script>

<template>
  <TaqniyaDrawer
    :is-open="isOpen"
    title="الملف الشخصي للمعلم"
    subtitle="تفاصيل السجل المهني والحساب الموحد"
    :icon="GraduationCap"
    @close="emit('close')"
  >
    <div v-if="teacher" class="space-y-6">
      <!-- Profile Attributes Card -->
      <div class="p-5 rounded-2xl border border-[#B4AED8] dark:border-white/[0.08] bg-[var(--bx-surface-solid)] space-y-3.5 shadow-xs">
        <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
          <span class="text-xs font-bold text-bx-muted">الرمز المؤسسي الموحد</span>
          <span class="font-mono font-bold text-xs text-bx-primary px-2.5 py-0.5 rounded-full bg-bx-primary/10 border border-bx-primary/20">
            {{ teacher.user_code }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
          <span class="text-xs font-bold text-bx-muted">الاسم الرباعي</span>
          <span class="font-black text-xs text-bx-title">{{ teacher.full_name }}</span>
        </div>

        <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
          <span class="text-xs font-bold text-bx-muted">التخصص العلمي</span>
          <span class="font-bold text-xs text-purple-600 dark:text-purple-400">
            {{ teacher.specialization || 'غير محدد' }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
          <span class="text-xs font-bold text-bx-muted">رقم الهاتف</span>
          <span class="font-mono font-bold text-xs text-bx-title" dir="ltr">
            {{ teacher.phone || 'غير مسجل' }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-[#B4AED8] dark:border-white/[0.08] pb-3">
          <span class="text-xs font-bold text-bx-muted">تاريخ التعيين والمباشرة</span>
          <span class="font-['Alexandria',sans-serif] font-bold text-xs text-bx-title">
            {{ teacher.hire_date || 'غير محدد' }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-bx-muted">حالة الحساب الموحد</span>
          <span
            class="px-3 py-0.5 rounded-full text-[11px] font-bold border"
            :class="
              teacher.is_active === 1
                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                : 'border-red-500/30 text-red-500 bg-red-500/10'
            "
          >
            {{ teacher.is_active === 1 ? 'حساب نشط' : 'حساب معطل' }}
          </span>
        </div>
      </div>

      <!-- Management Actions Inside Drawer -->
      <div class="space-y-2.5 pt-2">
        <button
          type="button"
          @click="emit('edit', teacher)"
          class="w-full py-2.5 px-4 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-bx-title font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bx-row-hover)] transition-all cursor-pointer"
        >
          <Edit2 class="w-4 h-4" />
          <span>تعديل بيانات المعلم</span>
        </button>

        <!-- Toggle Status Button (Activate / Deactivate) -->
        <button
          type="button"
          :disabled="isUpdatingStatus"
          @click="emit('toggle-status', teacher)"
          class="w-full py-2.5 px-4 rounded-full border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          :class="
            teacher.is_active === 1
              ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
          "
        >
          <Loader2 v-if="isUpdatingStatus" class="w-4 h-4 animate-spin" />
          <template v-else>
            <UserX v-if="teacher.is_active === 1" class="w-4 h-4" />
            <UserCheck v-else class="w-4 h-4" />
            <span>{{ teacher.is_active === 1 ? 'تعطيل حساب المعلم' : 'تفعيل حساب المعلم' }}</span>
          </template>
        </button>

        <button
          type="button"
          @click="emit('delete', teacher)"
          class="w-full py-2.5 px-4 rounded-full border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <Trash2 class="w-4 h-4" />
          <span>حذف ملف المعلم</span>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end w-full">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-full border border-[#B4AED8] dark:border-white/[0.12] text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
