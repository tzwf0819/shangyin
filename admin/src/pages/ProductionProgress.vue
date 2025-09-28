<template>
  <div>
    <div class="toolbar">
      <input v-model="filters.contractNumber" placeholder="合同编号" @keyup.enter="load" />
      <input v-model="filters.productKeyword" placeholder="产品名称/编号" @keyup.enter="load" />
      <button class="primary" @click="search">搜索</button>
    </div>

    <div class="table-wrapper" v-if="rows.length">
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>合同编号</th>
            <th>下单时间</th>
            <th>产品名称</th>
            <th>产品编号</th>
            <th>工序</th>
            <th>员工</th>
            <th>数量</th>
            <th>工时(分钟)</th>
            <th>绩效金额</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in rows" :key="row.key">
            <tr v-if="row.type === 'header'" class="group-header">
              <td colspan="11">
                合同：{{ row.contractNumber || '-' }}
                <span class="muted">(下单时间：{{ row.contractSignedDate || '-' }})</span>
              </td>
            </tr>
            <tr v-else>
              <td>{{ formatDate(row.createdAt) }}</td>
              <td>{{ row.contractNumber }}</td>
              <td>{{ row.contractSignedDate || '-' }}</td>
              <td>{{ row.productName || '-' }}</td>
              <td>{{ row.productCode || '-' }}</td>
              <td>{{ row.processName || '-' }}</td>
              <td>{{ row.employeeName || '-' }}</td>
              <td>{{ row.quantity }}</td>
              <td>{{ row.actualTimeMinutes }}</td>
              <td>{{ row.payAmount.toFixed(2) }}</td>
              <td>{{ row.notes || '-' }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无数据</div>

    <div class="pagination">
      <button :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
      <span>第 {{ page }} 页</span>
      <button :disabled="records.length < limit" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { listProgress } from '../api/production';

const filters = reactive({ contractNumber: '', productKeyword: '' });
const page = ref(1);
const limit = 20;
const records = ref([]);
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const response = await listProgress({
      page: page.value,
      limit,
      contractNumber: filters.contractNumber || undefined,
      productKeyword: filters.productKeyword || undefined,
    });
    if (response.success) {
      records.value = response.data.items || [];
    }
  } finally {
    loading.value = false;
  }
};

const changePage = (nextPage) => {
  if (nextPage <= 0) return;
  page.value = nextPage;
  load();
};

const search = () => {
  page.value = 1;
  load();
};

const rows = computed(() => {
  const result = [];
  let currentContractId = null;
  records.value.forEach((item, index) => {
    if (item.contractId !== currentContractId) {
      currentContractId = item.contractId;
      result.push({
        type: 'header',
        contractId: item.contractId,
        contractNumber: item.contractNumber,
        contractSignedDate: item.contractSignedDate,
        key: `header-${item.contractId}-${index}`,
      });
    }
    result.push({ type: 'record', key: item.id, ...item });
  });
  return result;
});



const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.table-wrapper {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
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
}
.group-header {
  background: #f1f5f9;
  font-weight: 600;
}
.muted {
  color: #64748b;
  margin-left: 8px;
  font-size: 12px;
}
.empty {
  color: #64748b;
  font-size: 13px;
}
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
