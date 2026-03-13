<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header-actions">
      <div class="search-bar">
        <input
          v-model="filter.contractNo"
          type="text"
          class="search-input"
          placeholder="搜索合同编号..."
          @input="debounceLoad"
        />
        <select v-model="filter.status" @change="load">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="signed">已签订</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilter">
          <span>🔄</span>
          <span>重置</span>
        </button>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <span>➕</span>
        <span>新建合同</span>
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 140px">合同编号</th>
              <th>客户名称</th>
              <th style="width: 120px">签订日期</th>
              <th style="width: 120px">总金额</th>
              <th style="width: 100px">状态</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td><strong>{{ item.contractNo }}</strong></td>
              <td>{{ item.customerName }}</td>
              <td>{{ formatDate(item.signDate) }}</td>
              <td>¥{{ formatMoney(item.totalAmount) }}</td>
              <td>
                <span class="badge" :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="viewDetail(item)" title="查看">
                    <span>👁️</span>
                  </button>
                  <button class="btn-icon" @click="openEdit(item)" title="编辑">
                    <span>✏️</span>
                  </button>
                  <button class="btn-icon" @click="remove(item.id)" title="删除">
                    <span>🗑️</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0 && !loading">
              <td colspan="6" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">📄</div>
                  <div class="empty-title">暂无合同</div>
                  <div class="empty-description">点击上方按钮创建第一份合同</div>
                </div>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="6" class="loading-cell">
                <div class="spinner spinner-sm"></div>
                <span>加载中...</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="card-footer" v-if="pagination.total > pagination.pageSize">
        <div class="pagination">
          <button
            class="btn btn-sm btn-secondary"
            :disabled="pagination.page === 1"
            @click="changePage(pagination.page - 1)"
          >
            上一页
          </button>
          <span class="pagination-info">
            第 {{ pagination.page }} / {{ Math.ceil(pagination.total / pagination.pageSize) }} 页
          </span>
          <button
            class="btn btn-sm btn-secondary"
            :disabled="pagination.page * pagination.pageSize >= pagination.total"
            @click="changePage(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 合同弹窗 -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '编辑合同' : '新建合同' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="save">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  合同编号 <span class="required">*</span>
                </label>
                <input v-model="form.contractNo" type="text" placeholder="如：HT-2026-001" required />
              </div>
              <div class="form-group">
                <label class="form-label">
                  客户名称 <span class="required">*</span>
                </label>
                <input v-model="form.customerName" type="text" placeholder="请输入客户名称" required />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">签订日期</label>
                <input v-model="form.signDate" type="date" />
              </div>
              <div class="form-group">
                <label class="form-label">交货日期</label>
                <input v-model="form.deliveryDate" type="date" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">合同状态</label>
              <select v-model="form.status">
                <option value="draft">草稿</option>
                <option value="signed">已签订</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                合同明细
                <button type="button" class="btn btn-sm btn-secondary" @click="addItem">
                  <span>➕</span>
                  <span>添加产品</span>
                </button>
              </label>
              <div class="items-list">
                <div v-for="(item, index) in form.items" :key="index" class="item-row">
                  <select v-model="item.productTypeId" required>
                    <option value="">选择产品</option>
                    <option v-for="pt in productTypes" :key="pt.id" :value="pt.id">
                      {{ pt.name }}
                    </option>
                  </select>
                  <input v-model.number="item.quantity" type="number" min="1" placeholder="数量" required />
                  <input v-model.number="item.unitPrice" type="number" step="0.01" min="0" placeholder="单价" required />
                  <button type="button" class="btn-icon" @click="removeItem(index)">
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea v-model="form.remark" rows="3" placeholder="合同备注信息..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <div class="footer-left">
              <span class="total-amount">合计: ¥{{ formatMoney(calculateTotal) }}</span>
            </div>
            <div class="footer-right">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                取消
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner spinner-sm"></span>
                <span>保存</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import http from '../api/http';

const list = ref([]);
const productTypes = ref([]);
const loading = ref(false);
const modalVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);

const filter = reactive({ contractNo: '', status: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const form = reactive({
  id: null,
  contractNo: '',
  customerName: '',
  signDate: '',
  deliveryDate: '',
  status: 'draft',
  remark: '',
  items: []
});

const calculateTotal = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0);
});

let debounceTimer = null;
const debounceLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => load(), 300);
};

const resetFilter = () => {
  filter.contractNo = '';
  filter.status = '';
  pagination.page = 1;
  load();
};

const changePage = (page) => {
  pagination.page = page;
  load();
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
};

const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(2);
};

const getStatusText = (status) => {
  const map = {
    draft: '草稿',
    signed: '已签订',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
};

const getStatusClass = (status) => {
  const map = {
    draft: 'badge-default',
    signed: 'badge-info',
    in_progress: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error'
  };
  return map[status] || 'badge-default';
};

const load = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize };
    if (filter.contractNo) params.contractNo = filter.contractNo;
    if (filter.status) params.status = filter.status;
    const res = await http.get('/shangyin/contracts', { params });
    list.value = res.data.rows || res.data || [];
    pagination.total = res.data.count || list.value.length;
  } catch (e) {
    alert('加载失败：' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

const loadProductTypes = async () => {
  try {
    const res = await http.get('/shangyin/product-types');
    productTypes.value = res.data.rows || res.data || [];
  } catch (e) {
    console.warn('加载产品类型失败', e);
  }
};

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    contractNo: '',
    customerName: '',
    signDate: '',
    deliveryDate: '',
    status: 'draft',
    remark: '',
    items: []
  });
  modalVisible.value = true;
};

const openEdit = (item) => {
  isEdit.value = true;
  Object.assign(form, item);
  // 确保 items 存在
  if (!form.items) form.items = [];
  modalVisible.value = true;
};

const viewDetail = (item) => {
  // 查看详情逻辑
  alert('合同详情功能开发中...\n\n合同编号: ' + item.contractNo);
};

const closeModal = () => {
  modalVisible.value = false;
};

const addItem = () => {
  form.items.push({
    productTypeId: '',
    quantity: 1,
    unitPrice: 0
  });
};

const removeItem = (index) => {
  form.items.splice(index, 1);
};

const save = async () => {
  if (form.items.length === 0) {
    alert('请至少添加一个产品');
    return;
  }
  
  saving.value = true;
  try {
    const data = { ...form, totalAmount: calculateTotal.value };
    if (isEdit.value) {
      await http.put(`/shangyin/contracts/${form.id}`, data);
    } else {
      await http.post('/shangyin/contracts', data);
    }
    closeModal();
    load();
  } catch (e) {
    alert('保存失败：' + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
};

const remove = async (id) => {
  if (!confirm('确定删除此合同？')) return;
  try {
    await http.delete(`/shangyin/contracts/${id}`);
    load();
  } catch (e) {
    alert('删除失败：' + (e.response?.data?.message || e.message));
  }
};

onMounted(() => {
  load();
  loadProductTypes();
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
  max-width: 600px;
}

.search-input {
  flex: 1;
  height: 40px;
}

.table-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-hover);
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.modal-lg {
  max-width: 800px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.required {
  color: var(--color-error);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.item-row {
  display: grid;
  grid-template-columns: 1fr 100px 120px 40px;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-md);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-amount {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .page-header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    max-width: none;
    flex-wrap: wrap;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .item-row {
    grid-template-columns: 1fr 80px 100px 40px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .footer-left,
  .footer-right {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style>
