<template>
  <div class="dashboard">
    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <div class="section-title">系统概览</div>
      <div class="stats-grid">
        <div class="stat-card" v-for="s in stats" :key="s.key">
          <div class="stat-icon">{{ s.icon }}</div>
          <div class="stat-content">
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快捷操作 -->
    <div class="quick-section">
      <div class="section-title">快捷操作</div>
      <div class="quick-buttons">
        <button class="quick-btn" @click="$router.push('/contracts')">
          <span class="btn-icon">📄</span>
          <span>新建合同</span>
        </button>
        <button class="quick-btn" @click="$router.push('/employees')">
          <span class="btn-icon">👤</span>
          <span>添加员工</span>
        </button>
        <button class="quick-btn" @click="$router.push('/processes')">
          <span class="btn-icon">⚙️</span>
          <span>添加工序</span>
        </button>
        <button class="quick-btn" @click="$router.push('/product-types')">
          <span class="btn-icon">📦</span>
          <span>添加产品类型</span>
        </button>
      </div>
    </div>
    
    <!-- 系统信息 -->
    <div class="info-section">
      <div class="section-title">系统信息</div>
      <div class="info-content">
        <div class="info-row">
          <span class="info-label">系统名称:</span>
          <span class="info-value">鸿浩达 ERP 管理系统</span>
        </div>
        <div class="info-row">
          <span class="info-label">系统版本:</span>
          <span class="info-value">V2.0</span>
        </div>
        <div class="info-row">
          <span class="info-label">最后更新:</span>
          <span class="info-value">2026-03-13</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '../api/http';

const stats = ref([
  { key:'productTypes', label:'产品类型', value:'-', icon: '📦' },
  { key:'processes', label:'工序数量', value:'-', icon: '⚙️' },
  { key:'employees', label:'员工人数', value:'-', icon: '👥' },
  { key:'contracts', label:'合同数量', value:'-', icon: '📄' }
]);

const load = async () => {
  try { 
    const r = await http.get('/shangyin/api/admin/dashboard/stats');
    stats.value.forEach(s=>{ s.value = r.data?.[s.key] ?? '-'; });
  } catch(e){ console.warn(e); }
};
onMounted(load);
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 区块标题 */
.section-title {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
  padding: 6px 12px;
  font-weight: bold;
  border: 1px solid #a0a0a0;
  margin-bottom: 8px;
  font-size: 12px;
}

/* 统计区域 */
.stats-section {
  background: #ffffff;
  border: 1px solid #a0a0a0;
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 12px;
}

.stat-card {
  background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
  border: 1px solid #c0c0c0;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #c0c0c0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #000;
  font-family: 'Consolas', 'Courier New', monospace;
}

/* 快捷操作 */
.quick-section {
  background: #ffffff;
  border: 1px solid #a0a0a0;
  padding: 0;
}

.quick-buttons {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
  border: 1px solid #c0c0c0;
  cursor: pointer;
  font-size: 12px;
}

.quick-btn:hover {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
  border-color: #a0a0a0;
}

.btn-icon {
  font-size: 24px;
}

/* 系统信息 */
.info-section {
  background: #ffffff;
  border: 1px solid #a0a0a0;
  padding: 0;
}

.info-content {
  padding: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 12px;
}

.info-label {
  width: 80px;
  text-align: right;
  margin-right: 8px;
  color: #666;
}

.info-value {
  color: #000;
  font-weight: bold;
}
</style>
