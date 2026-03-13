<template>
  <div class="erp-layout">
    <!-- 顶部标题栏 -->
    <header class="erp-header">
      <div class="header-title">
        <span class="title-icon">📋</span>
        <span class="title-text">鸿浩达 ERP 管理系统</span>
      </div>
      <div class="header-info">
        <span>版本: 2.0</span>
        <span class="separator">|</span>
        <span>用户: 管理员</span>
      </div>
    </header>
    
    <!-- 主内容区 -->
    <div class="erp-main">
      <!-- 左侧菜单栏 -->
      <aside class="erp-sidebar">
        <div class="menu-title">功能菜单</div>
        <nav class="menu-nav">
          <RouterLink 
            v-for="item in menu" 
            :key="item.path" 
            :to="item.path" 
            :class="['menu-item', { active: isActive(item.path) }]"
          >
            <span class="menu-icon">{{ item.icon }}</span>
            <span class="menu-label">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>
      
      <!-- 右侧内容区 -->
      <main class="erp-content">
        <!-- 窗口标题栏 -->
        <div class="content-header">
          <h1 class="window-title">{{ currentTitle }}</h1>
        </div>
        
        <!-- 页面内容 -->
        <div class="content-body">
          <RouterView />
        </div>
      </main>
    </div>
    
    <!-- 底部状态栏 -->
    <footer class="erp-footer">
      <span>鸿浩达 ERP 系统</span>
      <span class="footer-right">状态: 正常运行</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const menu = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/contracts', label: '合同管理', icon: '📄' },
  { path: '/processes', label: '工序管理', icon: '⚙️' },
  { path: '/product-types', label: '产品类型', icon: '📦' },
  { path: '/employees', label: '员工管理', icon: '👥' },
  { path: '/permissions', label: '权限管理', icon: '🔐' },
  { path: '/performance-summary', label: '绩效汇总', icon: '📈' },
  { path: '/production-records', label: '生产记录', icon: '📝' },
  { path: '/production-progress', label: '生产进度', icon: '📋' },
  { path: '/employee-performance', label: '员工绩效', icon: '📉' },
  { path: '/wechat-employees', label: '微信员工', icon: '💬' }
];

const route = useRoute();

const currentTitle = computed(() => {
  const f = menu.find(m => m.path === route.path);
  return f ? f.label : '';
});

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};
</script>

<style scoped>
/* ERP 整体布局 */
.erp-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Microsoft YaHei', 'SimSun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 12px;
}

/* 顶部标题栏 */
.erp-header {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
  border-bottom: 1px solid #a0a0a0;
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 14px;
  color: #000;
}

.title-icon {
  font-size: 16px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #333;
}

.separator {
  color: #999;
}

/* 主内容区 */
.erp-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧菜单栏 */
.erp-sidebar {
  width: 180px;
  background: #f5f5f5;
  border-right: 1px solid #a0a0a0;
  display: flex;
  flex-direction: column;
}

.menu-title {
  background: #d4d4d4;
  padding: 6px 10px;
  font-weight: bold;
  border-bottom: 1px solid #a0a0a0;
  font-size: 12px;
}

.menu-nav {
  display: flex;
  flex-direction: column;
  padding: 4px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  text-decoration: none;
  color: #000;
  border: 1px solid transparent;
  margin-bottom: 2px;
  cursor: pointer;
}

.menu-item:hover {
  background: #e8e8e8;
  border-color: #c0c0c0;
}

.menu-item.active {
  background: #e0e0e0;
  border: 1px solid #a0a0a0;
  font-weight: bold;
}

.menu-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.menu-label {
  font-size: 12px;
}

/* 右侧内容区 */
.erp-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  overflow: hidden;
}

/* 窗口标题栏 */
.content-header {
  background: linear-gradient(to bottom, #ffffff, #e8e8e8);
  border-bottom: 1px solid #a0a0a0;
  padding: 6px 12px;
  height: 32px;
  display: flex;
  align-items: center;
}

.window-title {
  font-size: 13px;
  font-weight: bold;
  margin: 0;
  color: #000;
}

/* 页面内容 */
.content-body {
  flex: 1;
  padding: 12px;
  overflow: auto;
  background: #f0f0f0;
}

/* 底部状态栏 */
.erp-footer {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
  border-top: 1px solid #a0a0a0;
  padding: 4px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 24px;
  font-size: 11px;
  color: #333;
}

.footer-right {
  color: #008000;
}
</style>
