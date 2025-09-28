<template>
  <div>
    <div class="filters">
      <select v-model="filters.employeeId">
        <option value="">所有员工</option>
        <option v-for="employee in employees" :key="employee.id" :value="employee.id">
          {{ employee.name }}
        </option>
      </select>
      <input type="date" v-model="filters.startDate" />
      <input type="date" v-model="filters.endDate" />
      <button class="primary" @click="search">搜索</button>
    </div>

    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>员工</th>
            <th>合同编号</th>
            <th>产品</th>
            <th>工序</th>
            <th>数量</th>
            <th>工时(分钟)</th>
            <th>绩效金额</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in items" :key="record.id">
            <td>{{ formatDate(record.createdAt) }}</td>
            <td>{{ record.employeeName || '-' }}</td>
            <td>{{ record.contractNumber || '-' }}</td>
            <td>{{ record.productName || '-' }}</td>
            <td>{{ record.processName || '-' }}</td>
            <td>{{ record.quantity }}</td>
            <td>{{ record.actualTimeMinutes }}</td>
            <td>{{ record.payAmount.toFixed(2) }}</td>
            <td>{{ record.notes || '-' }}</td>
          </tr>
          <tr class="summary">
            <td colspan="7">合计</td>
            <td>{{ totalPayAmount.toFixed(2) }}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">暂无记录</div>

    <div class="pagination">
      <button :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
      <span>第 {{ page }} 页</span>
      <button :disabled="items.length < limit" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { listPerformance } from '../api/production';
import { listEmployees } from '../api/employees';

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

const filters = reactive({ employeeId: '', startDate: firstDay, endDate: lastDay });
const employees = ref([]);
const items = ref([]);
const totalPayAmount = ref(0);
const page = ref(1);
const limit = 20;

const loadEmployees = async () => {
  const response = await listEmployees({ limit: 500 });
  if (response.success) {
    employees.value = response.data.employees || response.data.items || [];
  }
};

const buildParams = () => {
  const params = {
    page: page.value,
    limit,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
  const id = Number(filters.employeeId);
  if (!Number.isNaN(id) && id > 0) {
    params.employeeId = id;
  }
  return params;
};

const load = async () => {
  const response = await listPerformance(buildParams());
  if (response.success) {
    items.value = response.data.items || [];
    totalPayAmount.value = response.data.totalPayAmount || 0;
  }
};

const search = () => {
  page.value = 1;
  load();
};

const changePage = (nextPage) => {
  if (nextPage <= 0) return;
  page.value = nextPage;
  load();
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

onMounted(async () => {
  await loadEmployees();
  await load();
});
</script>

<style scoped>
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.table-wrapper {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  text-align: left;
}
.summary {
  font-weight: 600;
  background: #f8fafc;
}
.empty {
  color: #64748b;
  font-size: 13px;
}
.primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
</style>
