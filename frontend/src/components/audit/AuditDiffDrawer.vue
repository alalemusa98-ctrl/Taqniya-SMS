<script setup lang="ts">
import { X, ShieldAlert, Laptop, Globe, Clock } from 'lucide-vue-next';
import { formatDateTime } from '../../utils/formatters';

defineProps<{
  isOpen: boolean;
  log?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <!-- Backdrop -->
    <div @click="emit('close')" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>

    <!-- Drawer Panel (600px from right) -->
    <div class="fixed inset-y-0 end-0 max-w-full flex">
      <div class="w-screen max-w-[600px] bg-white dark:bg-slate-900 shadow-2xl border-s border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 sm:p-8 animate-in slide-in-from-right duration-300 overflow-y-auto" dir="rtl">
        <div class="space-y-6">
          <!-- Top Bar -->
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-lg">
                <ShieldAlert class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">تفاصيل حركة التدقيق الأمني</h3>
                <p class="text-xs text-slate-400">فحص التعديلات ومقارنة القيم قبل وبعد</p>
              </div>
            </div>
            <button @click="emit('close')" class="p-2 rounded-xl text-slate-400 hover:text-slate-600">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Metadata Grid -->
          <div v-if="log" class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-slate-400 block mb-1">رقم الحركة:</span>
              <span class="font-mono font-bold text-slate-800 dark:text-slate-200">#{{ log.id }}</span>
            </div>
            <div>
              <span class="text-slate-400 block mb-1">المستخدم المنفذ:</span>
              <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ log.user_code || 'النظام' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block mb-1">الكيان المتأثر:</span>
              <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ log.entity_type }} ({{ log.entity_id || 'عام' }})</span>
            </div>
            <div>
              <span class="text-slate-400 block mb-1">نوع الإجراء:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ log.action }}</span>
            </div>
            <div class="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 space-y-1.5 text-[11px] text-slate-500">
              <p class="flex items-center gap-1.5">
                <Globe class="w-3.5 h-3.5 text-slate-400" />
                <span>عنوان الـ IP:</span> <span class="font-mono font-bold">{{ log.ip_address || '—' }}</span>
              </p>
              <p class="flex items-center gap-1.5">
                <Laptop class="w-3.5 h-3.5 text-slate-400" />
                <span>المتصفح والنظام:</span> <span class="truncate">{{ log.user_agent || '—' }}</span>
              </p>
              <p class="flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-slate-400" />
                <span>التوقيت الدقيق:</span> <span class="font-mono font-bold">{{ formatDateTime(log.created_at) }}</span>
              </p>
            </div>
          </div>

          <!-- Side-by-Side Diff View -->
          <div v-if="log" class="space-y-4">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>مقارنة الفروقات والتعديلات الحساسة (Side-by-Side Diff)</span>
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Old Values (Red/Before) -->
              <div class="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
                <span class="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">
                  القيم السابقة قبل التعديل (Old Values)
                </span>
                <pre v-if="log.old_values" class="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(log.old_values, null, 2) }}</pre>
                <p v-else class="text-xs text-slate-400 italic py-2">لا توجد قيم سابقة (حركة إنشاء أو مصادقة أولى)</p>
              </div>

              <!-- New Values (Green/After) -->
              <div class="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                  القيم الجديدة بعد التعديل (New Values)
                </span>
                <pre v-if="log.new_values" class="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(log.new_values, null, 2) }}</pre>
                <p v-else class="text-xs text-slate-400 italic py-2">لا توجد قيم جديدة مسجلة</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            @click="emit('close')"
            class="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
          >
            إغلاق اللوحة
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
