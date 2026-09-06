<script setup lang="ts">
import { X, UserCheck, Calendar, Phone, BookOpen, Shield, Clock } from 'lucide-vue-next';
import type { Teacher } from '../../api/teachers.api';

defineProps<{
  isOpen: boolean;
  teacher: Teacher | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div v-if="isOpen && teacher" class="fixed inset-0 z-50 overflow-hidden" dir="rtl">
    <!-- Backdrop Blur -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
    ></div>

    <div class="fixed inset-y-0 left-0 pl-10 max-w-full flex">
      <div class="w-screen max-w-md bg-[var(--bx-surface-solid)] border-r border-bx-border shadow-2xl flex flex-col">
        <!-- Header -->
        <div class="p-6 border-b border-bx-border flex items-center justify-between bg-[var(--bx-canvas)]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <UserCheck class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-bx-title">الملف الشخصي للمعلم</h3>
              <p class="text-xs text-bx-muted">تفاصيل السجل والبيانات المهنية</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="p-2 text-bx-muted hover:text-bx-title rounded-xl hover:bg-[var(--bx-pill)] transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Profile Badge Card -->
          <div class="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/60 dark:border-blue-800/40 text-center space-y-3">
            <div class="w-16 h-16 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-600/30">
              {{ teacher.full_name ? teacher.full_name.charAt(0) : 'T' }}
            </div>
            <div>
              <h4 class="text-lg font-bold text-bx-title">{{ teacher.full_name }}</h4>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-blue-600 text-white text-xs font-mono font-bold shadow-sm">
                <Shield class="w-3.5 h-3.5" />
                <span>{{ teacher.user_code }}</span>
              </div>
            </div>
          </div>

          <!-- Attributes Grid -->
          <div class="space-y-3.5 text-xs">
            <div class="p-3.5 rounded-xl bg-[var(--bx-canvas)] border border-bx-border flex items-center justify-between">
              <span class="flex items-center gap-2 text-bx-muted font-medium">
                <BookOpen class="w-4 h-4 text-blue-500" />
                التخصص العلمي:
              </span>
              <span class="font-bold text-bx-title">{{ teacher.specialization || 'غير محدد' }}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-[var(--bx-canvas)] border border-bx-border flex items-center justify-between">
              <span class="flex items-center gap-2 text-bx-muted font-medium">
                <Phone class="w-4 h-4 text-emerald-500" />
                رقم الهاتف:
              </span>
              <span class="font-bold text-bx-title font-mono" dir="ltr">{{ teacher.phone || 'غير مسجل' }}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-[var(--bx-canvas)] border border-bx-border flex items-center justify-between">
              <span class="flex items-center gap-2 text-bx-muted font-medium">
                <Calendar class="w-4 h-4 text-purple-500" />
                تاريخ التعيين والمباشرة:
              </span>
              <span class="font-bold text-bx-title font-mono">{{ teacher.hire_date || 'غير محدد' }}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-[var(--bx-canvas)] border border-bx-border flex items-center justify-between">
              <span class="flex items-center gap-2 text-bx-muted font-medium">
                <UserCheck class="w-4 h-4 text-amber-500" />
                حالة الحساب الموحد:
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                :class="teacher.is_active === 1 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'"
              >
                {{ teacher.is_active === 1 ? 'حساب نشط' : 'حساب معطل' }}
              </span>
            </div>

            <div v-if="teacher.created_at" class="p-3.5 rounded-xl bg-[var(--bx-canvas)] border border-bx-border flex items-center justify-between">
              <span class="flex items-center gap-2 text-bx-muted font-medium">
                <Clock class="w-4 h-4 text-gray-400" />
                تاريخ التسجيل بالمنظومة:
              </span>
              <span class="font-bold text-bx-title font-mono text-[11px]">{{ new Date(teacher.created_at).toLocaleDateString('ar-LY') }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-bx-border bg-[var(--bx-canvas)] flex justify-end">
          <button
            @click="emit('close')"
            class="px-5 py-2 rounded-xl bg-[var(--bx-pill)] hover:bg-gray-200 dark:hover:bg-gray-700 text-bx-title font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
