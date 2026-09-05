<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { usersApi } from '../../api/users.api';
import { X, User, Calendar, Clock, KeyRound, UserX, UserCheck } from 'lucide-vue-next';
import { formatDateTime } from '../../utils/formatters';

const props = defineProps<{
  isOpen: boolean;
  userId?: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-status'): void;
  (e: 'reset-password'): void;
}>();

const userDetails = ref<any>(null);
const isLoading = ref(false);

const fetchDetails = async () => {
  if (!props.userId) return;
  isLoading.value = true;
  try {
    const res = await usersApi.getUserById(props.userId);
    if (res.data.success) {
      userDetails.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch user details:', err);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      if (props.userId) {
        fetchDetails();
      }
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true },
);

watch(
  () => props.userId,
  () => {
    if (props.isOpen && props.userId) {
      fetchDetails();
    }
  },
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

        <!-- Drawer Panel docked on the RIGHT -->
        <div
          class="fixed inset-y-0 right-0 max-w-full flex drawer-right-panel"
          style="right: 0 !important; left: auto !important;"
        >
          <div
            class="w-screen max-w-[500px] h-full bg-[var(--bx-surface-solid)] border-s-2 border-bx-border shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <!-- Fixed Header (Compact) -->
            <div class="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-bx-border shrink-0 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-bx-primary/10 text-bx-primary flex items-center justify-center font-black border border-bx-primary/20">
                  <User class="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 class="font-display font-black text-sm text-bx-title leading-snug">تفاصيل حساب المستخدم</h3>
                  <p class="text-[11px] text-bx-muted font-medium">سجل النشاط وحالة المصادقة</p>
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
              <!-- Loading -->
              <div v-if="isLoading" class="space-y-4 py-8">
                <div class="h-10 bg-[var(--bx-table-header)] rounded-xl animate-pulse"></div>
                <div class="h-20 bg-[var(--bx-table-header)] rounded-xl animate-pulse"></div>
                <div class="h-20 bg-[var(--bx-table-header)] rounded-xl animate-pulse"></div>
              </div>

              <!-- Content -->
              <div v-else-if="userDetails" class="space-y-6">
                <!-- Header Card -->
                <div class="p-5 rounded-3xl bg-[var(--bx-table-header)] border border-bx-border space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-bx-muted font-bold">الرمز المؤسسي الموحد</span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-xs font-black border"
                      :class="userDetails.is_active === 1
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30'"
                    >
                      {{ userDetails.is_active === 1 ? 'نشط' : 'معطل' }}
                    </span>
                  </div>
                  <p class="text-2xl font-black font-mono text-bx-title tracking-wider">
                    {{ userDetails.user_code }}
                  </p>
                  <div class="pt-2 flex items-center gap-2">
                    <span class="text-xs text-bx-muted font-bold">الدور الأساسي:</span>
                    <span class="px-2.5 py-0.5 rounded-lg bg-bx-primary/10 border border-bx-primary/25 text-bx-primary text-xs font-black font-mono">
                      {{ userDetails.role_type.toUpperCase() }}
                    </span>
                  </div>
                </div>

                <!-- Activity Logs -->
                <div class="space-y-3">
                  <h4 class="text-xs font-black text-bx-muted uppercase tracking-wider">سجل التوقيتات</h4>
                  <div class="p-4 rounded-2xl bg-[var(--bx-table-header)] border border-bx-border space-y-3 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="text-bx-muted font-bold flex items-center gap-1.5">
                        <Calendar class="w-3.5 h-3.5" /> تاريخ الإنشاء:
                      </span>
                      <span class="font-mono text-bx-title font-bold">
                        {{ formatDateTime(userDetails.created_at) }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-bx-muted font-bold flex items-center gap-1.5">
                        <Clock class="w-3.5 h-3.5" /> آخر تسجيل دخول:
                      </span>
                      <span class="font-mono text-bx-title font-bold">
                        {{ userDetails.last_login_at ? formatDateTime(userDetails.last_login_at) : 'لم يسجل دخول بعد' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fixed Action Buttons Footer -->
            <div class="p-6 sm:p-8 pt-4 border-t border-bx-border bg-[var(--bx-surface-solid)] shrink-0 space-y-3">
              <button
                @click="emit('toggle-status')"
                class="bx-btn bx-btn-outline bx-btn-md w-full text-xs font-bold"
              >
                <UserX v-if="userDetails?.is_active === 1" class="w-4 h-4 text-bx-danger" />
                <UserCheck v-else class="w-4 h-4 text-bx-success" />
                <span>{{ userDetails?.is_active === 1 ? 'تعطيل الحساب وإلغاء الجلسات' : 'تفعيل الحساب' }}</span>
              </button>

              <button
                @click="emit('reset-password')"
                class="bx-btn bx-btn-primary bx-btn-md w-full text-xs font-bold"
              >
                <KeyRound class="w-4 h-4" />
                <span>إعادة تعيين كلمة المرور</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
