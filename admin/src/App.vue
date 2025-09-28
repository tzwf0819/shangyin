<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">Shangyin</div>
      <nav class="nav">
        <RouterLink v-for="item in menu" :key="item.path" :to="item.path" active-class="active">{{ item.label }}</RouterLink>
      </nav>
    </aside>
    <main class="main">
      <header class="appbar">
        <h1>{{ currentTitle }}</h1>
        <div class="bar-actions">
          <slot name="actions" />
        </div>
      </header>
      <section class="page"><RouterView /></section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const menu = [
  { path: '/dashboard', label: '仪表盘' },
  { path: '/processes', label: '工序管理' },
  { path: '/product-types', label: '产品类型' },
  { path: '/employees', label: '员工管理' },
  { path: '/contracts', label: '合同管理' },
  { path: '/production-records', label: '生产记录' },
  { path: '/production-progress', label: '生产进度' },
  { path: '/employee-performance', label: '员工绩效' },
  { path: '/wechat-employees', label: '微信员工' }
];

const route = useRoute();
const currentTitle = computed(() => {
  const f = menu.find(m => m.path === route.path);
  return f ? f.label : '';
});
</script>

<style scoped>
.layout { display:flex; min-height:100vh; }
.sidebar { width:220px; background:#111827; color:#fff; display:flex; flex-direction:column; }
.brand { font-weight:600; padding:16px 18px; font-size:18px; letter-spacing:.5px; }
.nav { display:flex; flex-direction:column; padding:0 10px 16px; gap:4px; }
.nav a { text-decoration:none; color:#cbd5e1; padding:10px 12px; border-radius:6px; font-size:14px; }
.nav a.active, .nav a:hover { background:#1e293b; color:#fff; }
.main { flex:1; display:flex; flex-direction:column; min-width:0; }
.appbar { height:56px; background:#fff; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; padding:0 20px; }
.appbar h1 { font-size:16px; margin:0; font-weight:600; }
.page { padding:20px; }
</style>
