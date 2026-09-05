import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

import LoginView from '../views/LoginView.vue';
import DashboardLayout from '../views/DashboardLayout.vue';
import UsersManagementView from '../views/UsersManagementView.vue';
import AuditLogsView from '../views/AuditLogsView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/users',
      },
      {
        path: 'users',
        name: 'users',
        component: UsersManagementView,
        meta: { roles: ['admin'] },
      },
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: AuditLogsView,
        meta: { roles: ['admin'] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // If page requires auth and not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Try to restore session
    if (authStore.token) {
      const user = await authStore.fetchProfile();
      if (!user) {
        return next('/login');
      }
    } else {
      return next('/login');
    }
  }

  // If page is for guests only and user is already authenticated
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next('/users');
  }

  // Role checks
  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    if (!authStore.user || !to.meta.roles.includes(authStore.user.role_type)) {
      return next('/login');
    }
  }

  next();
});
