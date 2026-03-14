<template>
  <div class="app-wrapper">
    <!-- 登录页 -->
    <Login v-if="!isAuthenticated" />
    
    <!-- 主应用布局 -->
    <template v-else>
      <!-- 顶部导航栏 -->
      <header class="app-header">
        <div class="header-left">
          <button class="menu-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
            <Icon name="menu" :size="18" />
          </button>
          <div class="header-brand">
            <span class="brand-icon">
              <Icon name="layers" :size="20" />
            </span>
            <span class="brand-text">上茚 ERP</span>
          </div>
        </div>
        
        <div class="header-center">
          <nav class="header-nav">
            <RouterLink
              v-for="item in quickNav"
              :key="item.path"
              :to="item.path"
              class="header-nav-item"
              :class="{ active: isActive(item.path) }"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>
        
        <div class="header-right">
          <div class="header-search">
            <input
              type="text"
              class="search-input"
              placeholder="搜索..."
              v-model="searchQuery"
              @keyup.enter="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">
              <Icon name="search" :size="16" />
            </button>
          </div>
          
          <div class="header-actions">
            <button class="action-btn" title="通知">
              <Icon name="bell" :size="18" />
              <span v-if="notificationCount" class="badge">{{ notificationCount }}</span>
            </button>
            <button class="action-btn" title="帮助">
              <Icon name="help" :size="18" />
            </button>
            
            <div class="user-menu">
              <button class="user-btn" @click="showUserMenu = !showUserMenu">
                <span class="user-avatar">
                  <Icon name="user" :size="16" />
                </span>
                <span class="user-name">管理员</span>
                <Icon name="chevron-down" :size="14" />
              </button>
              
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-item" @click="goToProfile">
                  <Icon name="user" :size="16" />
                  <span>个人资料</span>
                </div>
                <div class="dropdown-item" @click="goToSettings">
                  <Icon name="settings" :size="16" />
                  <span>系统设置</span>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item logout" @click="handleLogout">
                  <Icon name="logout" :size="16" />
                  <span>退出登录</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <!-- 主体区域 -->
      <div class="app-body" :style="{ '--sidebar-width': sidebarCollapsed ? '64px' : '260px' }">
        <!-- 侧边导航栏 -->
        <aside class="app-sidebar" :class="{ collapsed: sidebarCollapsed }">
          <nav class="sidebar-nav">
            <div
              v-for="group in menuGroups"
              :key="group.name"
              class="nav-group"
            >
              <div class="nav-group-title">{{ group.name }}</div>
              <RouterLink
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="nav-item"
                :class="{ active: isActive(item.path) }"
                :title="sidebarCollapsed ? item.label : ''"
              >
                <span class="nav-icon">
                  <Icon :name="item.icon" :size="18" />
                </span>
                <span class="nav-label">{{ item.label }}</span>
              </RouterLink>
            </div>
          </nav>
          
          <div class="sidebar-footer">
            <div class="system-status">
              <span class="status-dot online"></span>
              <span class="status-text">系统正常</span>
            </div>
          </div>
        </aside>
        
        <!-- 主内容区 -->
        <main class="app-main">
          <div class="main-header">
            <h1 class="page-title">{{ currentTitle }}</h1>
            <div class="breadcrumb">
              <span>首页</span>
              <span class="separator">/</span>
              <span>{{ currentTitle }}</span>
            </div>
          </div>
          
          <div class="main-content">
            <RouterView />
          </div>
        </main>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Login from './pages/Login.vue';
import Icon from './components/Icon.vue';

const route = useRoute();
const router = useRouter();

const sidebarCollapsed = ref(false);
const showUserMenu = ref(false);
const searchQuery = ref('');
const notificationCount = ref(0);

// 检查是否已登录
const isAuthenticated = computed(() => {
  return !!localStorage.getItem('ADMIN_TOKEN');
});

// 快捷导航
const quickNav = [
  { path: '/dashboard', label: '首页' },
  { path: '/contracts', label: '合同' },
  { path: '/employees', label: '员工' }
];

// 菜单分组
const menuGroups = [
  {
    name: '核心功能',
    items: [
      { path: '/dashboard', label: '仪表盘', icon: 'dashboard' },
      { path: '/contracts', label: '合同管理', icon: 'contract' },
      { path: '/production-records', label: '生产记录', icon: 'records' },
      { path: '/production-progress', label: '生产进度', icon: 'progress' }
    ]
  },
  {
    name: '基础数据',
    items: [
      { path: '/processes', label: '工序管理', icon: 'process' },
      { path: '/product-types', label: '产品类型', icon: 'product' },
      { path: '/employees', label: '员工管理', icon: 'employee' },
      { path: '/wechat-employees', label: '微信员工', icon: 'wechat' }
    ]
  },
  {
    name: '系统管理',
    items: [
      { path: '/permissions', label: '权限管理', icon: 'permission' },
      { path: '/performance-summary', label: '绩效汇总', icon: 'summary' },
      { path: '/employee-performance', label: '员工绩效', icon: 'performance' }
    ]
  }
];

// 当前页面标题
const currentTitle = computed(() => {
  for (const group of menuGroups) {
    const item = group.items.find(i => isActive(i.path));
    if (item) return item.label;
  }
  return '';
});

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    // 实现搜索逻辑
    console.log('搜索:', searchQuery.value);
  }
};

const goToProfile = () => {
  showUserMenu.value = false;
  // 跳转到个人资料
};

const goToSettings = () => {
  showUserMenu.value = false;
  // 跳转到设置
};

const handleLogout = () => {
  localStorage.removeItem('ADMIN_TOKEN');
  showUserMenu.value = false;
  router.replace('/login');
};

// 点击外部关闭用户菜单
const handleClickOutside = (e) => {
  if (!e.target.closest('.user-menu')) {
    showUserMenu.value = false;
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside);
}
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: var(--bg-page);
  overflow: hidden;
}

/* 顶部导航栏 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-menu {
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-toggle:hover {
  background: var(--bg-hover);
  border-color: var(--border-primary);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
}

.brand-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-nav {
  display: flex;
  gap: 8px;
}

.header-nav-item {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.header-nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.header-nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--bg-surface);
  outline: none;
  transition: all var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0,120,212,0.2);
}

.search-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 12px;
  color: var(--text-secondary);
}

.search-btn:hover {
  background: var(--bg-hover);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.icon-bell, .icon-help {
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: var(--color-error);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.user-btn:hover {
  background: var(--bg-hover);
}

.user-avatar {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 50%;
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.user-arrow {
  font-size: 10px;
  color: var(--text-secondary);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  background: var(--bg-surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: dropdown-in 0.15s ease;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item:first-child {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.dropdown-item.logout {
  color: var(--color-error);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-primary);
  margin: 4px 0;
}

/* 主体区域 */
.app-body {
  display: flex;
  flex: 1;
  width: 100%;
  overflow: hidden;
  --sidebar-width: 260px;
}

/* 侧边栏 */
.app-sidebar {
  width: var(--sidebar-width);
  background: var(--bg-surface);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  overflow: hidden;
  flex-shrink: 0;
}

.app-sidebar.collapsed {
  width: 64px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 24px;
}

.nav-group-title {
  padding: 0 12px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 2px;
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
  font-weight: 500;
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.nav-item.active .nav-icon {
  background: var(--color-primary);
  color: white;
}

.nav-label {
  white-space: nowrap;
}

.app-sidebar.collapsed .nav-label,
.app-sidebar.collapsed .nav-group-title {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-primary);
}

.system-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: var(--color-success);
}

/* 主内容区 */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: calc(100% - var(--sidebar-width));
  overflow: hidden;
}

.app-sidebar.collapsed ~ .app-main {
  width: calc(100% - 64px);
}

.main-header {
  padding: 20px 24px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-primary);
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.breadcrumb {
  font-size: 13px;
  color: var(--text-secondary);
}

.breadcrumb .separator {
  margin: 0 8px;
  color: var(--text-tertiary);
}

.main-content {
  flex: 1;
  width: 100%;
  padding: 24px;
  overflow: auto;
  background: var(--bg-page);
}

/* PC端优化 - 大屏幕 */
@media (min-width: 1400px) {
  .app-body {
    --sidebar-width: 280px;
  }
  
  .app-sidebar.collapsed {
    width: 72px;
  }
  
  .sidebar-nav {
    padding: 20px 16px;
  }
  
  .nav-item {
    padding: 12px 16px;
    font-size: 15px;
  }
  
  .main-content {
    padding: 32px;
  }
}

/* 平板和中等屏幕适配 */
@media (max-width: 1200px) {
  .header-center {
    display: none;
  }
  
  .header-search {
    width: 160px;
  }
  
  .search-input {
    width: 120px;
  }
}

/* 小屏幕适配 */
@media (max-width: 992px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    z-index: 99;
    transform: translateX(-100%);
    box-shadow: var(--shadow-lg);
  }
  
  .app-sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .app-main {
    margin-left: 0;
  }
  
  .menu-toggle {
    display: flex;
  }
  
  .header-search {
    display: none;
  }
}

/* 手机端适配 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }
  
  .brand-text {
    font-size: 16px;
  }
  
  .header-brand {
    gap: 8px;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .page-title {
    font-size: 22px;
  }
  
  .user-name {
    display: none;
  }
  
  .header-actions {
    gap: 4px;
  }
}
</style>
