<script setup lang="ts">
import { ref, watch } from 'vue';
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
  () => props.userId,
  () => {
    if (props.isOpen && props.userId) {
      fetchDetails();
    }
  },
);
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <!-- Backdrop -->
    <div @click="emit('close')" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>

    <!-- Drawer Panel (500px from right) -->
    <div class="fixed inset-y-0 end-0 max-w-full flex">
      <div class="w-screen max-w-[500px] bg-white dark:bg-slate-900 shadow-2xl border-s border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 sm:p-8 animate-in slide-in-from-right duration-300" dir="rtl">
        <!-- Top Bar -->
        <div class="space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-lg">
                <User class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">تفاصيل حساب المستخدم</h3>
                <p class="text-xs text-slate-400">سجل النشاط وحالة المصادقة</p>
              </div>
            </div>
            <button @click="emit('close')" class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="space-y-4 py-8">
            <div class="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div class="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div class="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          </div>

          <!-- Content -->
          <div v-else-if="userDetails" class="space-y-6">
            <!-- Header Card -->
            <div class="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">الرمز المؤسسي الموحد</span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  :class="userDetails.is_active === 1
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'"
                >
                  {{ userDetails.is_active === 1 ? 'نشط' : 'معطل' }}
                </span>
              </div>
              <p class="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-wider">
                {{ userDetails.user_code }}
              </p>
              <div class="pt-2 flex items-center gap-2">
                <span class="text-xs text-slate-500">الدور الأساسي:</span>
                <span class="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                  {{ userDetails.role_type.toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Activity Logs -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">سجل التوقيتات</h4>
              <div class="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5" /> تاريخ الإنشاء:
                  </span>
                  <span class="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {{ formatDateTime(userDetails.created_at) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5" /> آخر تسجيل دخول:
                  </span>
                  <span class="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {{ userDetails.last_login_at ? formatDateTime(userDetails.last_login_at) : 'لم يسجل دخول بعد' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            @click="emit('toggle-status')"
            class="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <UserX v-if="userDetails?.is_active === 1" class="w-4 h-4 text-rose-500" />
            <UserCheck v-else class="w-4 h-4 text-emerald-500" />
            <span>{{ userDetails?.is_active === 1 ? 'تعطيل الحساب وإلغاء الجلسات' : 'تفعيل الحساب' }}</span>
          </button>

          <button
            @click="emit('reset-password')"
            class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <KeyRound class="w-4 h-4" />
            <span>إعادة تعيين كلمة المرور</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
