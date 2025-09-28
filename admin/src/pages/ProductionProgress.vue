<template>
  <div>
    <div class="toolbar">
      <input v-model="filters.contractNumber" placeholder="合同编号" @keyup.enter="search" />
      <input v-model="filters.productKeyword" placeholder="产品名称/编号" @keyup.enter="search" />
      <button class="primary" @click="search" :disabled="loading">搜索</button>
    </div>

    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead>
          <tr>
            <th>合同编号</th>
            <th>产品名称</th>
            <th>产品编号</th>
            <th>产品类型</th>
            <th>签订日期</th>
            <th>交货期限</th>
            <th>生产记录数</th>
            <th>最近进度</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.contractNumber || '-' }}</td>
            <td>{{ item.productName || '-' }}</td>
            <td>{{ item.productCode || '-' }}</td>
            <td>{{ item.productType || '-' }}</td>
            <td>{{ formatDate(item.contractSignedDate) }}</td>
            <td>{{ item.deliveryDeadline || '-' }}</td>
            <td>{{ item.recordCount }}</td>
            <td>{{ formatDate(item.latestRecordAt) }}</td>
            <td>
              <button @click="openDetail(item)" :disabled="detailLoading">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无合同产品</div>

    <div class="pagination">
      <button :disabled="!hasPrev || loading" @click="changePage(page - 1)">上一页</button>
      <span>第 {{ page }} 页</span>
      <button :disabled="!hasNext || loading" @click="changePage(page + 1)">下一页</button>
    </div>

    <dialog ref="dlgDetail" class="dialog-large">
      <form method="dialog" @submit.prevent>
        <div class="modal-header">产品生产记录</div>
        <div class="modal-body">
          <section v-if="detailProduct" class="product-overview">
            <div><strong>合同编号：</strong>{{ detailProduct.contractNumber || '-' }}</div>
            <div><strong>产品名称：</strong>{{ detailProduct.productName || '-' }}</div>
            <div><strong>产品编号：</strong>{{ detailProduct.productCode || '-' }}</div>
            <div><strong>产品类型：</strong>{{ detailProduct.productType || '-' }}</div>
            <div><strong>签订日期：</strong>{{ formatDate(detailProduct.contractSignedDate) }}</div>
            <div><strong>交货期限：</strong>{{ detailProduct.deliveryDeadline || '-' }}</div>
            <div><strong>计划数量：</strong>{{ detailProduct.quantity || '-' }}</div>
          </section>

          <section class="records-table">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>节点</th>
                  <th>执行人</th>
                  <th>数量</th>
                  <th>用时(分)</th>
                  <th>绩效</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="detailLoading">
                  <td colspan="7" class="muted">加载中...</td>
                </tr>
                <tr v-else-if="!detailRecords.length">
                  <td colspan="7" class="muted">暂无记录</td>
                </tr>
                <tr v-else v-for="record in detailRecords" :key="record.id">
                  <td>{{ formatDate(record.createdAt) }}</td>
                  <td>{{ record.processName || '-' }}</td>
                  <td>{{ record.employeeName || '-' }}</td>
                  <td>{{ record.quantity === null || record.quantity === undefined ? '-' : record.quantity }}</td>
                  <td>{{ record.actualTimeMinutes === null || record.actualTimeMinutes === undefined ? '-' : record.actualTimeMinutes }}</td>
                  <td>{{ record.payAmount === null || record.payAmount === undefined ? '-' : record.payAmount.toFixed(2) }}</td>
                  <td>{{ record.notes || '-' }}</td>
                </tr>
                <tr v-if="detailRecords.length">
                  <td colspan="5" class="summary-label">合计绩效</td>
                  <td class="summary-value">{{ detailTotalPay.toFixed(2) }}</td>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { listProgress, getProductProgressRecords } from '../api/production';

const filters = reactive({ contractNumber: '', productKeyword: '' });
const page = ref(1);
const limit = 20;
const total = ref(0);
const items = ref([]);
const loading = ref(false);

const dlgDetail = ref(null);
const detailLoading = ref(false);
const detailProduct = ref(null);
const detailRecords = ref([]);
const detailTotalPay = ref(0);

const hasPrev = computed(() => page.value > 1);
const hasNext = computed(() => page.value * limit < total.value);

const buildQuery = () => {
  const params = {
    page: page.value,
    limit,
  };
  if (filters.contractNumber && filters.contractNumber.trim()) {
    params.contractNumber = filters.contractNumber.trim();
  }
  if (filters.productKeyword && filters.productKeyword.trim()) {
    params.productKeyword = filters.productKeyword.trim();
  }
  return params;
};

const load = async () => {
  loading.value = true;
  try {
    const response = await listProgress(buildQuery());
    if (response.success) {
      items.value = response.data?.items || [];
      total.value = response.data?.total || 0;
    } else {
      items.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('加载生产进度失败:', error);
    alert('加载生产进度失败');
  } finally {
    loading.value = false;
  }
};

const search = () => {
  page.value = 1;
  load();
};

const changePage = (nextPage) => {
  if (nextPage === page.value || nextPage <= 0 || loading.value) return;
  page.value = nextPage;
  load();
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const fetchProductDetail = async (productId) => {
  detailLoading.value = true;
  try {
    const response = await getProductProgressRecords(productId);
    if (!response.success) {
      throw new Error(response.message || '获取生产记录失败');
    }
    const data = response.data || {};
    if (data.product) {
      detailProduct.value = { ...detailProduct.value, ...data.product };
    }
    detailRecords.value = (data.records || []).map((record) => ({
      ...record,
      payAmount: record.payAmount === null || record.payAmount === undefined ? null : Number(record.payAmount),
    }));
    detailTotalPay.value = Number(data.totalPayAmount || 0);
  } catch (error) {
    console.error('加载产品生产记录失败:', error);
    alert(error?.message || '获取生产记录失败');
    closeDetail();
  } finally {
    detailLoading.value = false;
  }
};

const openDetail = async (product) => {
  detailProduct.value = { ...product };
  detailRecords.value = [];
  detailTotalPay.value = 0;
  if (dlgDetail.value?.showModal) {
    try {
      dlgDetail.value.showModal();
    } catch (error) {
      console.warn('show dialog failed', error);
    }
  }
  await fetchProductDetail(product.id);
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

onMounted(() => {
  load();
});
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
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.empty {
  color: #64748b;
  font-size: 13px;
}
.dialog-large {
  width: min(720px, 95%);
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
.product-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
}
.product-overview strong {
  margin-right: 4px;
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
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
