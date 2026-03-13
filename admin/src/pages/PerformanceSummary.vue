<template>
  <div class="performance-page">
    <div class="page-header">
      <h2>生产绩效汇总</h2>
      <button class="primary" @click="exportData">导出 Excel</button>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <div class="field">
        <label>开始日期</label>
        <input type="date" v-model="filters.startDate" @change="load" />
      </div>
      <div class="field">
        <label>结束日期</label>
        <input type="date" v-model="filters.endDate" @change="load" />
      </div>
      <div class="field">
        <label>员工</label>
        <select v-model="filters.employeeId" @change="load">
          <option value="">全部员工</option>
          <option v-for="emp in employees" :key="emp.id" :value="emp.id">
            {{ emp.name }} ({{ emp.employeeType === 'salesman' ? '业务员' : '工人' }})
          </option>
        </select>
      </div>
    </div>

    <!-- 汇总统计 -->
    <div class="summary-cards">
      <div class="card">
        <div class="card-title">总记录数</div>
        <div class="card-value">{{ totalStats.recordCount }}</div>
      </div>
      <div class="card">
        <div class="card-title">总产量</div>
        <div class="card-value">{{ totalStats.totalQuantity }}</div>
      </div>
      <div class="card">
        <div class="card-title">总工资</div>
        <div class="card-value">¥{{ totalStats.totalPayAmount.toFixed(2) }}</div>
      </div>
    </div>

    <!-- 员工绩效表格 -->
    <div class="table-wrapper" v-if="summaryData.length">
      <h3>员工绩效汇总</h3>
      <table>
        <thead>
          <tr>
            <th>员工 ID</th>
            <th>姓名</th>
            <th>类型</th>
            <th>记录数</th>
            <th>总产量</th>
            <th>总工资</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in summaryData" :key="item.employeeId">
            <td>{{ item.employeeId }}</td>
            <td>{{ item.employeeName }}</td>
            <td>{{ item.employeeType === 'salesman' ? '业务员' : '工人' }}</td>
            <td>{{ item.recordCount }}</td>
            <td>{{ item.totalQuantity }}</td>
            <td class="amount">¥{{ item.totalPayAmount.toFixed(2) }}</td>
            <td>
              <button @click="viewDetail(item)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 工序统计表格 -->
    <div class="table-wrapper" v-if="processStatsData.length">
      <h3>工序生产统计</h3>
      <table>
        <thead>
          <tr>
            <th>员工</th>
            <th>工序名称</th>
            <th>生产次数</th>
            <th>总产量</th>
            <th>总工资</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in processStatsData" :key="item.processId + '-' + item.employeeId">
            <td>{{ item.employeeName }}</td>
            <td>{{ item.processName }}</td>
            <td>{{ item.processCount }}</td>
            <td>{{ item.totalQuantity }}</td>
            <td class="amount">¥{{ item.totalPayAmount.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 详情对话框 -->
    <dialog ref="detailDlg">
      <div class="modal-header">
        <span>{{ selectedEmployee?.employeeName }} - 绩效详情</span>
        <button @click="closeDetail">✕</button>
      </div>
      <div class="modal-body">
        <div v-if="selectedEmployee">
          <div class="detail-summary">
            <div class="stat-item">
              <div class="stat-label">总记录数</div>
              <div class="stat-value">{{ selectedEmployee.summary.recordCount }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">总产量</div>
              <div class="stat-value">{{ selectedEmployee.summary.totalQuantity }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">总工资</div>
              <div class="stat-value amount">¥{{ selectedEmployee.summary.totalPayAmount.toFixed(2) }}</div>
            </div>
          </div>
          <h4>工序明细</h4>
          <table class="detail-table">
            <thead>
              <tr>
                <th>工序名称</th>
                <th>生产次数</th>
                <th>工资</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="proc in selectedEmployee.processStats" :key="proc.processId">
                <td>{{ proc.processName }}</td>
                <td>{{ proc.processCount }}</td>
                <td class="amount">¥{{ proc.totalPayAmount.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script>
import http from '../api/http';

export default {
  name: 'PerformanceSummary',
  data() {
    return {
      filters: {
        startDate: this.formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        endDate: this.formatDate(new Date())
      },
      employees: [],
      summaryData: [],
      processStatsData: [],
      totalStats: {
        recordCount: 0,
        totalQuantity: 0,
        totalPayAmount: 0
      },
      selectedEmployee: null
    };
  },
  mounted() {
    this.loadEmployees();
    this.load();
  },
  methods: {
    formatDate(date) {
      const d = new Date(date);
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    },
    async loadEmployees() {
      try {
        const res = await http.get('/shangyin/employees', { status: 'active' });
        if (res.success) {
          this.employees = res.data.employees || [];
        }
      } catch (error) {
        console.error('加载员工列表失败', error);
      }
    },
    async load() {
      await this.loadSummary();
      await this.loadProcessStats();
    },
    async loadSummary() {
      try {
        const params = {
          startDate: this.filters.startDate,
          endDate: this.filters.endDate
        };
        if (this.filters.employeeId) {
          params.employeeId = this.filters.employeeId;
        }

        const res = await http.get('/shangyin/performance/summary', params);
        if (res.success) {
          this.summaryData = res.data || [];
          this.calculateTotal();
        }
      } catch (error) {
        console.error('加载绩效汇总失败', error);
        alert('加载绩效汇总失败');
      }
    },
    async loadProcessStats() {
      try {
        const params = {
          startDate: this.filters.startDate,
          endDate: this.filters.endDate
        };
        if (this.filters.employeeId) {
          params.employeeId = this.filters.employeeId;
        }

        const res = await http.get('/shangyin/performance/process-stats', params);
        if (res.success) {
          this.processStatsData = res.data || [];
        }
      } catch (error) {
        console.error('加载工序统计失败', error);
      }
    },
    calculateTotal() {
      this.totalStats = this.summaryData.reduce((acc, item) => {
        acc.recordCount += item.recordCount;
        acc.totalQuantity += item.totalQuantity;
        acc.totalPayAmount += item.totalPayAmount;
        return acc;
      }, { recordCount: 0, totalQuantity: 0, totalPayAmount: 0 });
    },
    async viewDetail(item) {
      try {
        const res = await http.get(`/shangyin/performance/employee/${item.employeeId}`, {
          startDate: this.filters.startDate,
          endDate: this.filters.endDate
        });
        if (res.success) {
          this.selectedEmployee = res.data;
          this.$refs.detailDlg.showModal();
        }
      } catch (error) {
        console.error('加载详情失败', error);
        alert('加载详情失败');
      }
    },
    closeDetail() {
      this.$refs.detailDlg.close();
      this.selectedEmployee = null;
    },
    exportData() {
      // 导出 Excel 功能
      const data = [
        ['员工 ID', '姓名', '类型', '记录数', '总产量', '总工资'],
        ...this.summaryData.map(item => [
          item.employeeId,
          item.employeeName,
          item.employeeType === 'salesman' ? '业务员' : '工人',
          item.recordCount,
          item.totalQuantity,
          item.totalPayAmount.toFixed(2)
        ])
      ];

      const csvContent = data.map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `绩效汇总_${this.filters.startDate}_${this.filters.endDate}.csv`;
      link.click();
    }
  }
};
</script>

<style scoped>
.performance-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-weight: 500;
  color: #666;
}

.field input,
.field select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: linear-gradient(135deg, #3BA372 0%, #2d8a5e 100%);
  color: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.card-title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.table-wrapper h3 {
  margin-bottom: 15px;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f5f5f5;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.amount {
  color: #3BA372;
  font-weight: bold;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button.primary {
  background: #3BA372;
  color: #fff;
}

dialog {
  border: none;
  border-radius: 8px;
  padding: 0;
  max-width: 700px;
  width: 90%;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-value.amount {
  color: #3BA372;
}

h4 {
  margin: 20px 0 15px;
  color: #333;
}

.detail-table {
  width: 100%;
}

.detail-table th,
.detail-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}
</style>
