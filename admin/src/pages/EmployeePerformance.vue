<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header-actions">
      <div class="search-bar">
        <select v-model="filter.employeeId" @change="loadData">
          <option value="">选择员工</option>
          <option v-for="emp in employees" :key="emp.id" :value="emp.id">
            {{ emp.name }}
          </option>
        </select>
        <div class="date-range">
          <input v-model="filter.startDate" type="date" />
          <span>至</span>
          <input v-model="filter.endDate" type="date" />
        </div>
        <button class="btn btn-primary" @click="loadData" :disabled="loading">
          <span v-if="loading" class="spinner spinner-sm"></span>
          <span v-else>搜 查询</span>
        </button>
      </div>
      <button class="btn btn-secondary" @click="exportData">
        <span>下 导出</span>
      </button>
    </div>

    <!-- 员工概览卡片 -->
    <div v-if="selectedEmployee" class="employee-card">
      <div class="employee-avatar">{{ getInitial(selectedEmployee.name) }}</div>
      <div class="employee-info">
        <h2 class="employee-name">{{ selectedEmployee.name }}</h2>
        <p class="employee-meta">
          <span>工号：{{ selectedEmployee.employeeNo || '暂无' }}</span>
          <span>职位：{{ selectedEmployee.position || '暂无' }}</span>
          <span>电话：{{ selectedEmployee.phone || '暂无' }}</span>
        </p>
      </div>
      <div class="employee-stats">
        <div class="stat-item">
          <div class="stat-value">¥{{ formatMoney(performance.totalAmount) }}</div>
          <div class="stat-label">累计绩效</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ performance.totalTasks }}</div>
          <div class="stat-label">完成任务</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatMoney(performance.avgAmount) }}</div>
          <div class="stat-label">平均绩效</div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">绩效明细</h4>
      </div>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>合同编号</th>
              <th>产品</th>
              <th>工序</th>
              <th class="text-right">数量</th>
              <th class="text-right">单价</th>
              <th class="text-right">金额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dataList" :key="item.id">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ item.contractNo }}</td>
              <td>{{ item.productName || '-' }}</td>
              <td>{{ item.processName || '-' }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">¥{{ formatMoney(item.unitPrice) }}</td>
              <td class="text-right font-bold">¥{{ formatMoney(item.amount) }}</td>
              <td>
                <span class="badge" :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
            </tr>
            <tr v-if="dataList.length === 0 && !loading">
              <td colspan="8" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">人</div>
                  <div class="empty-title">暂无绩效记录</div>
                  <div class="empty-description">请选择员工并设置时间范围后查询</div>
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

    <!-- 月度趋势 -->
    <div class="card chart-card">
      <div class="card-header">
        <h4 class="card-title">绩效趋势</h4>
      </div>
      <div class="chart-content">
        <div v-if="monthlyData.length === 0" class="chart-empty">
          暂无数据
        </div>
        <div v-else class="trend-chart">
          <div v-for="item in monthlyData" :key="item.month" class="trend-item">
            <span class="trend-label">{{ item.month }}</span>
            <div class="trend-bar-wrapper">
              <div
                class="trend-bar"
                :style="{ width: item.percentage + '%' }"
              ></div>
            </div>
            <span class="trend-value">¥{{ formatMoney(item.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import http from '../api/http';

const loading = ref(false);
const dataList = ref([]);
const employees = ref([]);
const monthlyData = ref([]);
const performance = reactive({ totalAmount: 0, totalTasks: 0, avgAmount: 0 });

const filter = reactive({
  employeeId: '',
  startDate: getFirstDayOfMonth(),
  endDate: getToday()
});

const selectedEmployee = computed(() => {
  if (!filter.employeeId) return null;
  return employees.value.find(e => e.id === filter.employeeId);
});

const totalQuantity = computed(() => {
  return dataList.value.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

const totalAmount = computed(() => {
  return dataList.value.reduce((sum, item) => sum + (item.amount || 0), 0);
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

const getInitial = (name) => {
  return name ? name.charAt(0) : '?';
};

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成'
  };
  return map[status] || status;
};

const getStatusClass = (status) => {
  const map = {
    pending: 'badge-default',
    in_progress: 'badge-warning',
    completed: 'badge-success'
  };
  return map[status] || 'badge-default';
};

const loadEmployees = async () => {
  try {
    const res = await http.get('/shangyin/employees');
    employees.value = res.data.rows || res.data || [];
  } catch (e) {
    console.warn('加载员工失败', e);
  }
};

const loadData = async () => {
  if (!filter.employeeId) {
    alert('请选择员工');
    return;
  }
  
  loading.value = true;
  try {
    const params = {
      employeeId: filter.employeeId,
      startDate: filter.startDate,
      endDate: filter.endDate
    };
    const res = await http.get('/shangyin/employee-performance', { params });
    dataList.value = res.data.rows || res.data || [];
    
    // 更新统计
    Object.assign(performance, res.data.performance || {
      totalAmount: 0,
      totalTasks: 0,
      avgAmount: 0
    });
    
    // 生成月度数据
    generateMonthlyData();
  } catch (e) {
    alert('加载失败：' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

const generateMonthlyData = () => {
  const map = {};
  dataList.value.forEach(item => {
    const month = item.date ? item.date.substring(0, 7) : '未知';
    if (!map[month]) {
      map[month] = { month, amount: 0 };
    }
    map[month].amount += item.amount || 0;
  });
  
  const list = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  const max = Math.max(...list.map(i => i.amount), 1);
  monthlyData.value = list.map(item => ({
    ...item,
    percentage: (item.amount / max) * 100
  }));
};

const exportData = () => {
  if (dataList.value.length === 0) {
    alert('没有可导出的数据');
    return;
  }
  
  const headers = ['日期', '合同编号', '产品', '工序', '数量', '单价', '金额', '状态'];
  const rows = dataList.value.map(item => [
    formatDate(item.date),
    item.contractNo,
    item.productName || '-',
    item.processName || '-',
    item.quantity,
    item.unitPrice,
    item.amount,
    getStatusText(item.status)
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${selectedEmployee.value?.name || '员工'}绩效_${filter.startDate}_${filter.endDate}.csv`;
  link.click();
};

onMounted(() => {
  loadEmployees();
});
</script>

<style scoped>
.page-header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  gap: var(--space-4);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.date-range {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.employee-card {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-6);
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-5);
}

.employee-avatar {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border-radius: 50%;
}

.employee-info {
  flex: 1;
}

.employee-name {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.employee-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.employee-meta span {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.employee-stats {
  display: flex;
  gap: var(--space-8);
}

.stat-item {
  text-align: center;
}

.stat-item .stat-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--space-1);
}

.stat-item .stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.text-right {
  text-align: right;
}

.font-bold {
  font-weight: 600;
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

.chart-card {
  margin-top: var(--space-5);
}

.chart-card .card-header {
  background: transparent;
  border-bottom: 1px solid var(--border-primary);
}

.chart-content {
  padding: var(--space-5);
}

.trend-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.trend-item {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  align-items: center;
  gap: var(--space-3);
}

.trend-label {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.trend-bar-wrapper {
  height: 24px;
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.trend-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #106ebe);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.trend-value {
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

@media (max-width: 768px) {
  .page-header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range {
    justify-content: space-between;
  }
  
  .employee-card {
    flex-direction: column;
    text-align: center;
  }
  
  .employee-stats {
    width: 100%;
    justify-content: space-around;
    gap: 0;
  }
  
  .trend-item {
    grid-template-columns: 60px 1fr 80px;
  }
}
</style>
