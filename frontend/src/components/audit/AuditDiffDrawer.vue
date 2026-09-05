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
            class="w-screen max-w-[620px] bg-[var(--bx-surface-solid)] border-s-2 border-bx-border shadow-2xl flex flex-col justify-between p-6 sm:p-8 overflow-y-auto"
          >
            <div class="space-y-6">
              <!-- Top Bar -->
              <div class="flex items-center justify-between border-b border-bx-border pb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-black text-lg border border-bx-primary/20">
                    <ShieldAlert class="w-6 h-6" />
                  </div>
                  <div>
                    <h3 class="font-display font-black text-lg text-bx-title">تفاصيل حركة التدقيق الأمني</h3>
                    <p class="text-xs text-bx-muted font-bold">فحص التعديلات ومقارنة القيم قبل وبعد</p>
                  </div>
                </div>
                <button
                  @click="emit('close')"
                  class="bx-icon-btn p-2 rounded-xl border border-bx-border hover:border-bx-primary text-bx-muted hover:text-bx-primary transition-all cursor-pointer"
                  title="إغلاق"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

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

            <!-- Footer -->
            <div class="pt-6 border-t border-bx-border">
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
