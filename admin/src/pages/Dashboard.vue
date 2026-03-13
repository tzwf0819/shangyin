<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="section-title">系统概览</div>
      <div class="stats-grid">
        <div class="stat-card" v-for="s in stats" :key="s.key">
          <div class="stat-icon" :style="{ background: s.color + '20', color: s.color }">
            {{ s.icon }}
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-section">
      <div class="section-title">快捷操作</div>
      <div class="quick-grid">
        <button class="quick-card" @click="$router.push('/contracts')">
          <div class="quick-icon" style="background: #0078d420; color: #0078d4;">📄</div>
          <div class="quick-text">新建合同</div>
        </button>
        <button class="quick-card" @click="$router.push('/employees')">
          <div class="quick-icon" style="background: #107c1020; color: #107c10;">👤</div>
          <div class="quick-text">添加员工</div>
        </button>
        <button class="quick-card" @click="$router.push('/processes')">
          <div class="quick-icon" style="background: #ffc10720; color: #856404;">⚙️</div>
          <div class="quick-text">添加工序</div>
        </button>
        <button class="quick-card" @click="$router.push('/product-types')">
          <div class="quick-icon" style="background: #a8000020; color: #a80000;">📦</div>
          <div class="quick-text">添加产品</div>
        </button>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="info-section">
      <div class="section-title">系统信息</div>
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">系统名称</span>
          <span class="info-value">鸿浩达 ERP 管理系统</span>
        </div>
        <div class="info-row">
          <span class="info-label">系统版本</span>
          <span class="info-value">V2.0.0</span>
        </div>
        <div class="info-row">
          <span class="info-label">最后更新</span>
          <span class="info-value">2026-03-13</span>
        </div>
        <div class="info-row">
          <span class="info-label">运行状态</span>
          <span class="info-value status-online">🟢 正常运行</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '../api/http';

const stats = ref([
  { key: 'productTypes', label: '产品类型', value: '-', icon: '📦', color: '#0078d4' },
  { key: 'processes', label: '工序数量', value: '-', icon: '⚙️', color: '#107c10' },
  { key: 'employees', label: '员工人数', value: '-', icon: '👥', color: '#ffc107' },
  { key: 'contracts', label: '合同数量', value: '-', icon: '📄', color: '#a80000' }
]);

const load = async () => {
  try {
    const r = await http.get('/shangyin/api/admin/dashboard/stats');
    stats.value.forEach(s => { s.value = r.data?.[s.key] ?? '-'; });
  } catch (e) { console.warn(e); }
};

onMounted(load);
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

/* 统计卡片 */
.stats-section {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-md);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: var(--radius-lg);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 快捷操作 */
.quick-section {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-card:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.quick-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border-radius: var(--radius-lg);
}

.quick-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 系统信息 */
.info-section {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.info-card {
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-md);
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-primary);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.status-online {
  color: var(--color-success);
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
