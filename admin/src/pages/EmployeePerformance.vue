<template>
  <div>
    <div class="filters">
      <input type="date" v-model="summaryFilters.startDate" />
      <input type="date" v-model="summaryFilters.endDate" />
      <button class="primary" @click="loadSummary" :disabled="loading">搜索</button>
    </div>

    <div class="table-wrapper" v-if="employees.length">
      <table>
        <thead>
          <tr>
            <th>员工姓名</th>
            <th>员工编号</th>
            <th>状态</th>
            <th>生产记录数</th>
            <th>累计数量</th>
            <th>累计绩效</th>
            <th>最近记录时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in employees" :key="emp.id">
            <td>{{ emp.name }}</td>
            <td>{{ emp.code || '-' }}</td>
            <td>{{ renderStatus(emp.status) }}</td>
            <td>{{ emp.recordCount }}</td>
            <td>{{ emp.totalQuantity }}</td>
            <td>{{ formatCurrency(emp.totalPayAmount) }}</td>
            <td>{{ formatDate(emp.latestRecordAt) }}</td>
            <td><button @click="openDetail(emp)" :disabled="detailLoading">详情</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无员工绩效数据</div>

    <dialog ref="dlgDetail" class="dialog-large">
      <form method="dialog" @submit.prevent>
        <div class="modal-header">员工生产记录</div>
        <div class="modal-body">
          <section v-if="detailEmployee" class="employee-overview">
            <div><strong>姓名：</strong>{{ detailEmployee.name }}</div>
            <div><strong>编号：</strong>{{ detailEmployee.code || '-' }}</div>
            <div><strong>状态：</strong>{{ renderStatus(detailEmployee.status) }}</div>
            <div><strong>统计周期：</strong>{{ detailFilters.startDate }} ~ {{ detailFilters.endDate }}</div>
          </section>

          <section class="detail-filters">
            <label>开始日期<input type="date" v-model="detailFilters.startDate" /></label>
            <label>结束日期<input type="date" v-model="detailFilters.endDate" /></label>
            <button type="button" class="primary" @click="searchDetail" :disabled="detailLoading">搜索</button>
          </section>

          <section class="records-table">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>合同编号</th>
                  <th>产品</th>
                  <th>工序</th>
                  <th>数量</th>
                  <th>用时(分)</th>
                  <th>绩效</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="detailLoading">
                  <td colspan="8" class="muted">加载中...</td>
                </tr>
                <tr v-else-if="!detailRecords.length">
                  <td colspan="8" class="muted">暂无生产记录</td>
                </tr>
                <tr v-else v-for="record in detailRecords" :key="record.id">
                  <td>{{ formatDate(record.createdAt) }}</td>
                  <td>{{ record.contractNumber || '-' }}</td>
                  <td>{{ record.productName || '-' }}</td>
                  <td>{{ record.processName || '-' }}</td>
                  <td>{{ record.quantity === null || record.quantity === undefined ? '-' : record.quantity }}</td>
                  <td>{{ record.actualTimeMinutes === null || record.actualTimeMinutes === undefined ? '-' : record.actualTimeMinutes }}</td>
                  <td>{{ record.payAmount === null || record.payAmount === undefined ? '-' : formatCurrency(record.payAmount) }}</td>
                  <td>{{ record.notes || '-' }}</td>
                </tr>
                <tr v-if="detailRecords.length">
                  <td colspan="6" class="summary-label">合计绩效</td>
                  <td class="summary-value">{{ formatCurrency(detailTotalPay) }}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeDetail">关闭</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { getPerformanceSummary, getEmployeePerformanceRecords } from '../api/production';

const buildDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const summaryFilters = reactive({
  startDate: buildDateString(firstDay),
  endDate: buildDateString(lastDay),
});

const detailFilters = reactive({
  startDate: buildDateString(firstDay),
  endDate: buildDateString(lastDay),
});

const employees = ref([]);
const loading = ref(false);

const detailEmployee = ref(null);
const detailRecords = ref([]);
const detailTotalPay = ref(0);
const detailLoading = ref(false);
const dlgDetail = ref(null);

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return num.toFixed(2);
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const renderStatus = (status) => {
  if (!status) return '-';
  return status === 'active' ? '在职' : '离职';
};

const loadSummary = async () => {
  loading.value = true;
  try {
    const response = await getPerformanceSummary({
      startDate: summaryFilters.startDate,
      endDate: summaryFilters.endDate,
    });
    if (response.success) {
      employees.value = response.data?.items || [];
    } else {
      employees.value = [];
    }
  } catch (error) {
    console.error('加载绩效汇总失败:', error);
    alert('加载绩效汇总失败');
    employees.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchEmployeeRecords = async (employeeId) => {
  detailLoading.value = true;
  try {
    const response = await getEmployeePerformanceRecords(employeeId, {
      startDate: detailFilters.startDate,
      endDate: detailFilters.endDate,
    });
    if (!response.success) {
      throw new Error(response.message || '获取员工生产记录失败');
    }
    const data = response.data || {};
    if (data.employee) {
      detailEmployee.value = data.employee;
    }
    detailRecords.value = (data.items || []).map((item) => ({
      ...item,
      payAmount: item.payAmount === null || item.payAmount === undefined ? null : Number(item.payAmount),
    }));
    detailTotalPay.value = Number(data.totalPayAmount || 0);
  } catch (error) {
    console.error('加载员工记录失败:', error);
    alert(error?.message || '获取员工生产记录失败');
    detailRecords.value = [];
    detailTotalPay.value = 0;
  } finally {
    detailLoading.value = false;
  }
};

const openDetail = async (employee) => {
  detailEmployee.value = employee;
  detailFilters.startDate = summaryFilters.startDate;
  detailFilters.endDate = summaryFilters.endDate;
  detailRecords.value = [];
  detailTotalPay.value = 0;
  if (dlgDetail.value?.showModal) {
    try {
      dlgDetail.value.showModal();
    } catch (error) {
      console.warn('show dialog failed', error);
    }
  }
  await fetchEmployeeRecords(employee.id);
};

const closeDetail = () => {
  if (dlgDetail.value) {
    try {
      dlgDetail.value.close();
    } catch (error) {
      console.warn('close dialog failed', error);
    }
  }
};

const searchDetail = () => {
  if (!detailEmployee.value) return;
  fetchEmployeeRecords(detailEmployee.value.id);
};

onMounted(() => {
  loadSummary();
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
.primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.empty {
  color: #64748b;
  font-size: 13px;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.dialog-large {
  width: min(760px, 95%);
}
.modal-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.employee-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
}
.detail-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}
.detail-filters label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.records-table table {
  width: 100%;
}
.muted {
  color: #6b7280;
  text-align: center;
  font-size: 13px;
}
.summary-label {
  text-align: right;
  font-weight: 600;
}
.summary-value {
  font-weight: 600;
}
</style>
