import { createRouter, createWebHashHistory } from 'vue-router';
import Dashboard from './pages/Dashboard.vue';
import Processes from './pages/Processes.vue';
import ProductTypes from './pages/ProductTypes.vue';
import Employees from './pages/Employees.vue';
import Contracts from './pages/Contracts.vue';
import Login from './pages/Login.vue';
import ProductionRecords from './pages/ProductionRecords.vue';
import WechatEmployees from './pages/WechatEmployees.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/processes', component: Processes },
  { path: '/product-types', component: ProductTypes },
  { path: '/employees', component: Employees },
  { path: '/contracts', component: Contracts },
  { path: '/production-records', component: ProductionRecords },
  { path: '/wechat-employees', component: WechatEmployees },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.path === '/login') return next();
  const token = localStorage.getItem('ADMIN_TOKEN');
  if (!token) return next('/login');
  next();
});

export default router;
