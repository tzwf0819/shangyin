<template>
  <div class="page-container">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">时间范围</label>
        <input v-model="filter.startDate" type="date" />
        <span class="filter-separator">至</span>
        <input v-model="filter.endDate" type="date" />
      </div>
      <div class="filter-group">
        <label class="filter-label">员工</label>
        <select v-model="filter.employeeId">
          <option value="">全部员工</option>
          <option v-for="emp in employees" :key="emp.id" :value="emp.id">
            {{ emp.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">合同</label>
        <select v-model="filter.contractId">
          <option value="">全部合同</option>
          <option v-for="c in contracts" :key="c.id" :value="c.id">
            {{ c.contractNo }}
          </option>
        </select>
      </div>
      <button class="btn btn-primary" @click="loadData" :disabled="loading">
        <span v-if="loading" class="spinner spinner-sm"></span>
        <Icon v-else name="search" :size="16" />
        <span v-if="!loading">查询</span>
      </button>
      <button class="btn btn-secondary" @click="exportData">
        <Icon name="download" :size="16" />
        <span>导出</span>
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background: #0078d420; color: #0078d4;"><Icon name="clipboard-list" :size="28" /></div>
        <div class="stat-info">
          <div class="stat-value">{{ summary.totalTasks || 0 }}</div>
          <div class="stat-label">总任务数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #107c1020; color: #107c10;"><Icon name="check-circle" :size="28" /></div>
        <div class="stat-info">
          <div class="stat-value">{{ summary.completedTasks || 0 }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ffc10720; color: #856404;"><Icon name="loader" :size="28" /></div>
        <div class="stat-info">
          <div class="stat-value">{{ summary.inProgressTasks || 0 }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #a8000020; color: #a80000;"><Icon name="currency-yen" :size="28" /></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ formatMoney(summary.totalPerformance || 0) }}</div>
          <div class="stat-label">绩效总额</div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>员工</th>
              <th>合同编号</th>
              <th>产品</th>
              <th>工序</th>
              <th class="text-right">数量</th>
              <th class="text-right">单价</th>
              <th class="text-right">金额</th>
              <th>完成日期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dataList" :key="item.id">
              <td>{{ item.employeeName }}</td>
              <td>{{ item.contractNo }}</td>
              <td>{{ item.productName || '-' }}</td>
              <td>{{ item.processName || '-' }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">¥{{ formatMoney(item.unitPrice) }}</td>
              <td class="text-right font-bold">¥{{ formatMoney(item.amount) }}</td>
              <td>{{ formatDate(item.completedAt) }}</td>
            </tr>
            <tr v-if="dataList.length === 0 && !loading">
              <td colspan="8" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon"><Icon name="bar-chart" :size="48" /></div>
                  <div class="empty-title">暂无数据</div>
                  <div class="empty-description">请选择筛选条件后点击查询</div>
                </div>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="8" class="loading-cell">
                <div class="spinner spinner-sm"></div>
                <span>加载中...</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="dataList.length > 0">
            <tr class="total-row">
              <td colspan="4" class="text-right">合计：</td>
              <td class="text-right">{{ totalQuantity }}</td>
              <td></td>
              <td class="text-right font-bold">¥{{ formatMoney(totalAmount) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="card chart-card">
        <div class="card-header">
          <h4 class="card-title">员工绩效排名</h4>
        </div>
        <div class="chart-content">
          <div v-for="emp in employeeRanking" :key="emp.id" class="chart-bar-item">
            <span class="bar-label">{{ emp.name }}</span>
            <div class="bar-wrapper">
              <div
                class="bar-fill"
                :style="{ width: emp.percentage + '%', background: emp.color }"
              ></div>
            </div>
            <span class="bar-value">¥{{ formatMoney(emp.amount) }}</span>
          </div>
          <div v-if="employeeRanking.length === 0" class="chart-empty">
            暂无数据
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card-header">
          <h4 class="card-title">工序绩效分布</h4>
        </div>
        <div class="chart-content">
          <div v-for="proc in processDistribution" :key="proc.id" class="chart-bar-item">
            <span class="bar-label">{{ proc.name }}</span>
            <div class="bar-wrapper">
              <div
                class="bar-fill"
                :style="{ width: proc.percentage + '%', background: proc.color }"
              ></div>
            </div>
            <span class="bar-value">¥{{ formatMoney(proc.amount) }}</span>
          </div>
          <div v-if="processDistribution.length === 0" class="chart-empty">
            暂无数据
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import http from '../api/http';
import Icon from '../components/Icon.vue';

const loading = ref(false);
const dataList = ref([]);
const summary = ref({});
const employees = ref([]);
const contracts = ref([]);

const filter = reactive({
  startDate: getFirstDayOfMonth(),
  endDate: getToday(),
  employeeId: '',
  contractId: ''
});

const totalQuantity = computed(() => {
  return dataList.value.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

const totalAmount = computed(() => {
  return dataList.value.reduce((sum, item) => sum + (item.amount || 0), 0);
});

const employeeRanking = computed(() => {
  const map = {};
  dataList.value.forEach(item => {
    if (!map[item.employeeId]) {
      map[item.employeeId] = { id: item.employeeId, name: item.employeeName, amount: 0 };
    }
    map[item.employeeId].amount += item.amount || 0;
  });
  const list = Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 10);
  const max = Math.max(...list.map(i => i.amount), 1);
  const colors = ['#0078d4', '#107c10', '#ffc107', '#a80000', '#8764b8', '#00b7c3', '#ff8c00'];
  return list.map((item, idx) => ({
    ...item,
    percentage: (item.amount / max) * 100,
    color: colors[idx % colors.length]
  }));
});

const processDistribution = computed(() => {
  const map = {};
  dataList.value.forEach(item => {
    if (!map[item.processId]) {
      map[item.processId] = { id: item.processId, name: item.processName || '未知', amount: 0 };
    }
    map[item.processId].amount += item.amount || 0;
  });
  const list = Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 10);
  const max = Math.max(...list.map(i => i.amount), 1);
  const colors = ['#107c10', '#0078d4', '#ffc107', '#a80000', '#8764b8', '#00b7c3', '#ff8c00'];
  return list.map((item, idx) => ({
    ...item,
    percentage: (item.amount / max) * 100,
    color: colors[idx % colors.length]
  }));
});

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
};

const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(2);
};

const loadEmployees = async () => {
  try {
    const res = await http.get('/shangyin/employees');
    employees.value = res.data.rows || res.data || [];
  } catch (e) {
    console.warn('加载员工失败', e);
  }
};

const loadContracts = async () => {
  try {
    const res = await http.get('/shangyin/contracts');
    contracts.value = res.data.rows || res.data || [];
  } catch (e) {
    console.warn('加载合同失败', e);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      startDate: filter.startDate,
      endDate: filter.endDate
    };
    if (filter.employeeId) params.employeeId = filter.employeeId;
    if (filter.contractId) params.contractId = filter.contractId;
    
    const res = await http.get('/shangyin/performance-summary', { params });
    dataList.value = res.data.rows || res.data || [];
    summary.value = res.data.summary || {};
  } catch (e) {
    alert('加载失败：' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

const exportData = () => {
  // 导出CSV
  if (dataList.value.length === 0) {
    alert('没有可导出的数据');
    return;
  }
  
  const headers = ['员工', '合同编号', '产品', '工序', '数量', '单价', '金额', '完成日期'];
  const rows = dataList.value.map(item => [
    item.employeeName,
    item.contractNo,
    item.productName || '-',
    item.processName || '-',
    item.quantity,
    item.unitPrice,
    item.amount,
    formatDate(item.completedAt)
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `绩效汇总_${filter.startDate}_${filter.endDate}.csv`;
  link.click();
};

onMounted(() => {
  loadEmployees();
  loadContracts();
  loadData();
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-separator {
  color: var(--text-tertiary);
  padding: 0 var(--space-2);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
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
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.empty-cell {
  padding: var(--space-10) !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-3);
  opacity: 0.5;
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.empty-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.loading-cell {
  padding: var(--space-10) !important;
  text-align: center;
  color: var(--text-secondary);
}

.total-row {
  background: var(--bg-surface-secondary);
  font-weight: 600;
}

.text-right {
  text-align: right;
}

.font-bold {
  font-weight: 600;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-top: var(--space-5);
}

.chart-card {
  padding: var(--space-5);
}

.chart-card .card-header {
  background: transparent;
  border-bottom: none;
  padding: 0 0 var(--space-4);
}

.chart-card .card-title {
  font-size: var(--text-lg);
}

.chart-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chart-bar-item {
  display: grid;
  grid-template-columns: 100px 1fr 100px;
  align-items: center;
  gap: var(--space-3);
}

.bar-label {
  font-size: var(--text-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-wrapper {
  height: 24px;
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.bar-value {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  text-align: right;
}

.chart-empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-tertiary);
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .chart-bar-item {
    grid-template-columns: 80px 1fr 80px;
  }
}
</style>
