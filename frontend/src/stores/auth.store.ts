import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type LoginPayload } from '../api/auth.api';

export interface User {
  id: number;
  user_code: string;
  role_type: 'admin' | 'teacher' | 'student' | 'parent';
  is_active: number;
  last_login_at?: string | null;
  created_at?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('taqniya_auth_token'));
  const user = ref<User | null>(
    localStorage.getItem('taqniya_auth_user')
      ? JSON.parse(localStorage.getItem('taqniya_auth_user')!)
      : null,
  );
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role_type === 'admin');

  const setAuth = (newToken: string, newUser: User) => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('taqniya_auth_token', newToken);
    localStorage.setItem('taqniya_auth_user', JSON.stringify(newUser));
  };

  const clearAuth = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('taqniya_auth_token');
    localStorage.removeItem('taqniya_auth_user');
  };

  const login = async (payload: LoginPayload) => {
    isLoading.value = true;
    try {
      const response = await authApi.login(payload);
      if (response.data.success) {
        setAuth(response.data.data.token, response.data.data.user);
        return { success: true, user: response.data.data.user };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message || 'تعذر تسجيل الدخول. يرجى المحاولة مجدداً.',
        errors: error.response?.data?.errors,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const fetchProfile = async () => {
    if (!token.value) return null;
    try {
      const response = await authApi.getMe();
      if (response.data.success) {
        user.value = response.data.data;
        localStorage.setItem('taqniya_auth_user', JSON.stringify(response.data.data));
        return user.value;
      }
    } catch {
      clearAuth();
    }
    return null;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API failed or session already cleared', e);
    } finally {
      clearAuth();
    }
  };

  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    fetchProfile,
    clearAuth,
  };
});
