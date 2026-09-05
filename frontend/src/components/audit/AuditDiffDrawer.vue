<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import { X, ShieldAlert, Laptop, Globe, Clock } from 'lucide-vue-next';
import { formatDateTime } from '../../utils/formatters';

const props = defineProps<{
  isOpen: boolean;
  log?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-right">
      <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-hidden" dir="rtl">
        <!-- Backdrop with click-to-close -->
        <div
          @click="emit('close')"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
        ></div>

        <!-- Drawer Panel docked on the RIGHT (620px) -->
        <div
          class="fixed inset-y-0 right-0 max-w-full flex drawer-right-panel"
          style="right: 0 !important; left: auto !important;"
        >
          <div
            class="w-screen max-w-[620px] h-full bg-[var(--bx-surface-solid)] border-s-2 border-bx-border shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <!-- Fixed Header (Compact) -->
            <div class="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-bx-border shrink-0 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-black border border-bx-primary/20">
                  <ShieldAlert class="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 class="font-display font-black text-sm text-bx-title leading-snug">تفاصيل حركة التدقيق الأمني</h3>
                  <p class="text-[11px] text-bx-muted font-medium">فحص التعديلات ومقارنة القيم قبل وبعد</p>
                </div>
              </div>
              <button
                @click="emit('close')"
                class="bx-icon-btn p-1.5 rounded-lg border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-all cursor-pointer"
                title="إغلاق"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Scrollable Content Body with Custom Scrollbar -->
            <div class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bx-drawer-scroll">
              <!-- Metadata Grid -->
              <div v-if="log" class="p-4 rounded-2xl bg-[var(--bx-table-header)] border border-bx-border grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-bx-muted font-bold block mb-1">رقم الحركة:</span>
                  <span class="font-mono font-black text-bx-title">#{{ log.id }}</span>
                </div>
                <div>
                  <span class="text-bx-muted font-bold block mb-1">المستخدم المنفذ:</span>
                  <span class="font-mono font-black text-bx-primary">{{ log.user_code || 'النظام' }}</span>
                </div>
                <div>
                  <span class="text-bx-muted font-bold block mb-1">الكيان المتأثر:</span>
                  <span class="font-mono font-bold text-bx-title">{{ log.entity_type }} ({{ log.entity_id || 'عام' }})</span>
                </div>
                <div>
                  <span class="text-bx-muted font-bold block mb-1">نوع الإجراء:</span>
                  <span class="font-black text-bx-title">{{ log.action }}</span>
                </div>
                <div class="col-span-2 pt-2 border-t border-bx-border space-y-1.5 text-[11px] text-bx-muted">
                  <p class="flex items-center gap-1.5">
                    <Globe class="w-3.5 h-3.5 text-bx-muted" />
                    <span>عنوان الـ IP:</span> <span class="font-mono font-bold text-bx-title">{{ log.ip_address || '—' }}</span>
                  </p>
                  <p class="flex items-center gap-1.5">
                    <Laptop class="w-3.5 h-3.5 text-bx-muted" />
                    <span>المتصفح والنظام:</span> <span class="truncate font-bold text-bx-title">{{ log.user_agent || '—' }}</span>
                  </p>
                  <p class="flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5 text-bx-muted" />
                    <span>التوقيت الدقيق:</span> <span class="font-mono font-bold text-bx-title">{{ formatDateTime(log.created_at) }}</span>
                  </p>
                </div>
              </div>

              <!-- Side-by-Side Diff View -->
              <div v-if="log" class="space-y-4">
                <h4 class="text-xs font-black text-bx-title flex items-center gap-2">
                  <span>مقارنة الفروقات والتعديلات الحساسة (Side-by-Side Diff)</span>
                </h4>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Old Values (Red/Before) -->
                  <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
                    <span class="text-[11px] font-black text-bx-danger block">
                      القيم السابقة قبل التعديل (Old Values)
                    </span>
                    <pre v-if="log.old_values" class="text-[11px] font-mono text-bx-text bg-[var(--bx-surface-solid)] p-3 rounded-xl border border-rose-500/20 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(log.old_values, null, 2) }}</pre>
                    <p v-else class="text-xs text-bx-muted italic py-2">لا توجد قيم سابقة (حركة أولى أو مصادقة)</p>
                  </div>

                  <!-- New Values (Green/After) -->
                  <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                    <span class="text-[11px] font-black text-bx-success block">
                      القيم الجديدة بعد التعديل (New Values)
                    </span>
                    <pre v-if="log.new_values" class="text-[11px] font-mono text-bx-text bg-[var(--bx-surface-solid)] p-3 rounded-xl border border-emerald-500/20 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(log.new_values, null, 2) }}</pre>
                    <p v-else class="text-xs text-bx-muted italic py-2">لا توجد قيم جديدة مسجلة</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fixed Footer -->
            <div class="p-6 sm:p-8 pt-4 border-t border-bx-border bg-[var(--bx-surface-solid)] shrink-0">
              <button
                @click="emit('close')"
                class="bx-btn bx-btn-outline bx-btn-md w-full text-xs font-bold"
              >
                إغلاق لوحة التدقيق
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
