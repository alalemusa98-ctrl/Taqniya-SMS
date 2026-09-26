import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useRouteLoader } from '../composables/useRouteLoader';

// Dynamic route-level code-splitting (code_splitting & lazy_loading)
const LoginView = () => import('../views/LoginView.vue');
const DashboardLayout = () => import('../views/DashboardLayout.vue');
const UsersManagementView = () => import('../views/UsersManagementView.vue');
const AuditLogsView = () => import('../views/AuditLogsView.vue');
const AcademicStructureView = () => import('../views/AcademicStructureView.vue');
const TeachersManagementView = () => import('../views/TeachersManagementView.vue');
const TeachingAssignmentsView = () => import('../views/TeachingAssignmentsView.vue');
const StudentsManagementView = () => import('../views/StudentsManagementView.vue');
const StudentEnrollmentsView = () => import('../views/StudentEnrollmentsView.vue');
const GuardiansManagementView = () => import('../views/GuardiansManagementView.vue');
const PeriodSlotsManagementView = () => import('../views/PeriodSlotsManagementView.vue');
const TimetablesManagementView = () => import('../views/TimetablesManagementView.vue');
const HomeworkManagementView = () => import('../views/HomeworkManagementView.vue');
const QuizzesManagementView = () => import('../views/QuizzesManagementView.vue');
const OfficialExamsManagementView = () => import('../views/OfficialExamsManagementView.vue');
const PromotionManagementView = () => import('../views/PromotionManagementView.vue');
const GradeEntryManagementView = () => import('../views/GradeEntryManagementView.vue');
const BackupManagementView = () => import('../views/BackupManagementView.vue');

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
        path: 'students',
        name: 'students',
        component: StudentsManagementView,
        meta: { roles: ['admin'] },
      },
      {
        path: 'student-enrollments',
        name: 'student-enrollments',
        component: StudentEnrollmentsView,
        meta: { roles: ['admin', 'teacher'] },
      },
      {
        path: 'guardians',
        name: 'guardians',
        component: GuardiansManagementView,
        meta: { roles: ['admin'] },
      },
      {
        path: 'teachers',
        name: 'teachers',
        component: TeachersManagementView,
        meta: { roles: ['admin'] },
      },
      {
        path: 'teaching-assignments',
        name: 'teaching-assignments',
        component: TeachingAssignmentsView,
        meta: { roles: ['admin'] },
      },
      {
        path: 'academic-structure',
        name: 'academic-structure',
        component: AcademicStructureView,
        meta: { roles: ['admin'] },
      },
      {
        path: 'period-slots',
        name: 'period-slots',
        component: PeriodSlotsManagementView,
        meta: { roles: ['admin', 'teacher', 'student', 'parent'] },
      },
      {
        path: 'timetables',
        name: 'timetables',
        component: TimetablesManagementView,
        meta: { roles: ['admin', 'teacher', 'student', 'parent'] },
      },
      {
        path: 'homework',
        name: 'homework',
        component: HomeworkManagementView,
        meta: { roles: ['admin', 'teacher', 'student', 'parent'] },
      },
      {
        path: 'quizzes',
        name: 'quizzes',
        component: QuizzesManagementView,
        meta: { roles: ['admin', 'teacher', 'student', 'parent'] },
      },
      {
        path: 'official-exams',
        name: 'official-exams',
        component: OfficialExamsManagementView,
        meta: { roles: ['admin', 'teacher', 'student', 'parent'] },
      },
      {
        path: 'promotions',
        name: 'promotions',
        component: PromotionManagementView,
        meta: { roles: ['admin', 'teacher', 'student', 'parent'] },
      },
      {
        path: 'grade-entry',
        name: 'grade-entry',
        component: GradeEntryManagementView,
        meta: { roles: ['admin', 'teacher'] },
      },
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: AuditLogsView,
        meta: { roles: ['admin'] },
      },
      {
        path: 'backups',
        name: 'backups',
        component: BackupManagementView,
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

// Route Navigation & Loading States (route_loading_states)
router.beforeEach(async (to, _from, next) => {
  const { start } = useRouteLoader();
  start();

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

router.afterEach(() => {
  const { finish } = useRouteLoader();
  finish();
});

router.onError(() => {
  const { error } = useRouteLoader();
  error();
});

