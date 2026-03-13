import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: () => import('./pages/Login.vue'), meta: { public: true } },
  { path: '/dashboard', name: 'Dashboard', component: () => import('./pages/Dashboard.vue') },
  { path: '/contracts', name: 'Contracts', component: () => import('./pages/Contracts.vue') },
  { path: '/processes', name: 'Processes', component: () => import('./pages/Processes.vue') },
  { path: '/product-types', name: 'ProductTypes', component: () => import('./pages/ProductTypes.vue') },
  { path: '/employees', name: 'Employees', component: () => import('./pages/Employees.vue') },
  { path: '/wechat-employees', name: 'WechatEmployees', component: () => import('./pages/WechatEmployees.vue') },
  { path: '/permissions', name: 'Permissions', component: () => import('./pages/Permissions.vue') },
  { path: '/performance-summary', name: 'PerformanceSummary', component: () => import('./pages/PerformanceSummary.vue') },
  { path: '/production-records', name: 'ProductionRecords', component: () => import('./pages/ProductionRecords.vue') },
  { path: '/production-progress', name: 'ProductionProgress', component: () => import('./pages/ProductionProgress.vue') },
  { path: '/employee-performance', name: 'EmployeePerformance', component: () => import('./pages/EmployeePerformance.vue') }
];

const router = createRouter({
  history: createWebHistory('/shangyin/admin/'),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('ADMIN_TOKEN');
  if (to.meta?.public) {
    next();
  } else if (!token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
