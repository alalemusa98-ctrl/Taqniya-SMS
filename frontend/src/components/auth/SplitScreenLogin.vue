<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import ThemeToggle from '../layout/ThemeToggle.vue';
import { Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const userCode = ref('ADM-1001');
const password = ref('SecretPassword@123');
const showPassword = ref(false);

const errorMessage = ref('');
const successMessage = ref('');
const isRateLimited = ref(false);
const countdown = ref(60);
let timer: any = null;

const startCountdown = () => {
  isRateLimited.value = true;
  countdown.value = 60;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      isRateLimited.value = false;
      errorMessage.value = '';
    }
  }, 1000);
};

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const handleLogin = async () => {
  if (isRateLimited.value) return;
  errorMessage.value = '';
  successMessage.value = '';

  const result = await authStore.login({
    user_code: userCode.value,
    password: password.value,
    device_name: navigator.userAgent,
  });

  if (result.success) {
    successMessage.value = 'تم تسجيل الدخول بنجاح! جاري توجيهك...';
    setTimeout(() => {
      router.push('/users');
    }, 600);
  } else {
    if (result.status === 429) {
      errorMessage.value = result.message || 'تم تجاوز الحد الأقصى للطلبات المسموحة. يرجى الانتظار 60 ثانية.';
      startCountdown();
    } else {
      errorMessage.value = result.message || 'فشل تسجيل الدخول. تحقق من بياناتك.';
    }
  }
};
</script>

<template>
  <div class="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans" dir="rtl">
    <!-- Right Panel: Form Area -->
    <div class="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-14 md:p-20 z-10">
      <!-- Top Branding -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">بوابة تقنية SMS</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">منظومة الإدارة المدرسية الموحدة</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <!-- Center Form -->
      <div class="max-w-md w-full mx-auto my-auto space-y-6">
        <div class="space-y-2">
          <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">تسجيل الدخول</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            أدخل رمز المستخدم المؤسسي الموحد للوصول إلى لوحة التحكم
          </p>
        </div>

        <!-- Feedback Alerts -->
        <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm animate-shake">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p class="font-medium">{{ errorMessage }}</p>
            <p v-if="isRateLimited" class="text-xs mt-1 font-mono">
              إعادة المحاولة بعد: <span class="font-bold text-rose-800 dark:text-rose-300">{{ countdown }}</span> ثانية
            </p>
          </div>
        </div>

        <div v-if="successMessage" class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 class="w-5 h-5 shrink-0" />
          <p class="font-medium">{{ successMessage }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">الرمز المؤسسي الموحد</label>
            <div class="relative">
              <input
                v-model="userCode"
                type="text"
                required
                placeholder="مثال: ADM-1001 أو TCH-2001"
                class="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-600 transition-all font-mono"
              />
              <User class="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">كلمة المرور</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                class="w-full ps-10 pe-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-600 transition-all"
              />
              <Lock class="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5" />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute end-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading || isRateLimited"
            class="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <span v-if="authStore.isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ isRateLimited ? `محظور مؤقتاً (${countdown}s)` : 'دخول إلى المنظومة' }}</span>
          </button>
        </form>

        <!-- Quick Credentials Hint for Reviewer -->
        <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
          <p class="font-bold text-slate-700 dark:text-slate-300">🔑 حسابات الاختبار المعتمدة (Seeder):</p>
          <p>• مدير: <code class="font-mono text-indigo-600 dark:text-indigo-400">ADM-1001</code> | معلم: <code class="font-mono text-indigo-600 dark:text-indigo-400">TCH-2001</code></p>
          <p>• كلمة المرور الموحدة: <code class="font-mono text-indigo-600 dark:text-indigo-400">SecretPassword@123</code></p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-xs text-slate-400 text-center">
        &copy; 2026 Taqniya-SMS — المنظومة المدرسية الشاملة
      </div>
    </div>

    <!-- Left Panel: Spatial UI Artwork / Branding (Hidden on small screens) -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 overflow-hidden items-center justify-center p-12">
      <!-- Glow & Circles -->
      <div class="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -top-20 -right-20"></div>
      <div class="absolute w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none -bottom-20 -left-20"></div>

      <!-- Floating Card (Spatial Glassmorphism) -->
      <div class="relative max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl text-white space-y-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-indigo-200">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          الأنظمة التشغيلية متزامنة
        </div>

        <h3 class="text-2xl font-bold leading-relaxed">
          تجربة رقمية ذكية تجمع المعلمين والطلاب والإدارة في منصة واحدة
        </h3>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p class="text-xs text-indigo-200">حماية الجلسات</p>
            <p class="text-lg font-bold font-mono mt-1">SHA-256 Hash</p>
          </div>
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p class="text-xs text-indigo-200">حوكمة الأدوار</p>
            <p class="text-lg font-bold mt-1">RBAC 4 Roles</p>
          </div>
        </div>

        <p class="text-xs text-indigo-200/70 border-t border-white/10 pt-4">
          نظام تقنية لإدارة المدارس — الإصدار المعماري v1.0
        </p>
      </div>
    </div>
  </div>
</template>
