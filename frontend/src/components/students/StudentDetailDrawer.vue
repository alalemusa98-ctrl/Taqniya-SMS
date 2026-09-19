<script setup lang="ts">
import {
  GraduationCap,
  Edit2,
  AlertCircle,
  HeartHandshake,
} from 'lucide-vue-next';
import TaqniyaDrawer from '../ui/TaqniyaDrawer.vue';
import type { Student } from '../../api/students.api';

interface Props {
  isOpen: boolean;
  student?: Student | null;
}

withDefaults(defineProps<Props>(), {
  student: null,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', student: Student): void;
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
    title="الملف الشخصي والأكاديمي للطالب"
    subtitle="تفاصيل السجل الدراسي والبيانات الشخصية والحساب الموحد"
    :icon="GraduationCap"
    max-width="max-w-[700px]"
    @close="emit('close')"
  >
    <div v-if="student" class="space-y-6">
      <!-- 1. Institutional Identity & Account Info Card -->
      <div class="p-5 rounded-2xl border border-bx-border bg-bx-surface space-y-3.5 shadow-xs">
        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">الرمز المؤسسي الموحد</span>
          <span class="font-mono font-bold text-xs text-bx-primary px-2.5 py-0.5 rounded-full bg-bx-primary/10 border border-bx-primary/20">
            {{ student.user_code }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">الاسم الرباعي</span>
          <span class="font-black text-xs text-bx-title">{{ student.full_name }}</span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">الجنس</span>
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
            :class="student.gender === 'male' ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10' : 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10'"
          >
            {{ student.gender === 'male' ? 'ذكر' : 'أنثى' }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">الصف والشعبة المسكن بها</span>
          <span class="font-bold text-xs text-bx-primary">
            {{ student.class_section || 'غير مسكن حالياً' }}
          </span>
        </div>

        <div v-if="student.seating_number" class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">رقم الجلوس</span>
          <span class="font-mono font-bold text-xs text-bx-title">
            {{ student.seating_number }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">رقم الهاتف</span>
          <span class="font-mono text-xs text-bx-title" dir="ltr">
            {{ student.phone || '—' }}
          </span>
        </div>

        <div class="flex items-center justify-between border-b border-bx-divider pb-3">
          <span class="text-xs font-bold text-bx-muted">تاريخ الميلاد</span>
          <span class="font-mono text-xs text-bx-title">
            {{ student.birth_date || '—' }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-xs font-bold text-bx-muted">تاريخ التسجيل بالمنظومة</span>
          <span class="font-mono text-[11px] text-bx-muted">
            {{ student.created_at ? new Date(student.created_at).toLocaleDateString('ar-LY') : '—' }}
          </span>
        </div>
      </div>

      <!-- 2. Family Custody & Guardians Card -->
      <div class="p-5 rounded-2xl border border-bx-border bg-bx-surface space-y-4 shadow-xs">
        <div class="flex items-center justify-between border-b border-bx-divider pb-2.5">
          <div class="flex items-center gap-2">
            <HeartHandshake class="w-4 h-4 text-bx-primary" />
            <span class="text-xs font-black text-bx-title">أولياء الأمور والوصاية المعتمدة</span>
          </div>
          <span class="text-[11px] font-bold text-bx-muted">
            {{ student.guardians && student.guardians.length > 0 ? `${student.guardians.length} مسجلين` : 'لا يوجد ولي أمر مرتبط' }}
          </span>
        </div>

        <div v-if="student.guardians && student.guardians.length > 0" class="space-y-3">
          <div
            v-for="g in student.guardians"
            :key="g.id"
            class="p-3.5 rounded-xl border border-bx-border bg-purple-500/[0.02] flex items-center justify-between gap-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-xs text-bx-title">{{ g.full_name }}</span>
                <span
                  v-if="g.is_primary"
                  class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  الوصي الرئيسي
                </span>
              </div>
              <div class="flex items-center gap-3 text-[11px] text-bx-muted mt-1">
                <span>{{ relationshipLabels[g.relationship] || g.relationship }}</span>
                <span class="font-mono" dir="ltr">{{ g.phone }}</span>
                <span class="font-mono text-bx-primary font-bold">({{ g.user_code }})</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6 text-bx-muted">
          <AlertCircle class="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p class="text-xs font-bold">لم يتم ربط الطالب بأي ولي أمر حتى الآن</p>
          <p class="text-[11px] mt-0.5">يمكن ربط أولياء الأمور من شاشة إدارة أولياء الأمور</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-full border border-bx-border text-xs font-bold text-bx-muted hover:text-bx-title transition-all cursor-pointer"
        >
          إغلاق
        </button>
        <button
          v-if="student"
          type="button"
          @click="emit('edit', student)"
          class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-bx-primary text-white text-xs font-bold shadow-sm hover:bg-bx-primary-hover transition-all cursor-pointer"
        >
          <Edit2 class="w-3.5 h-3.5" />
          <span>تعديل بيانات الطالب</span>
        </button>
      </div>
    </template>
  </TaqniyaDrawer>
</template>
