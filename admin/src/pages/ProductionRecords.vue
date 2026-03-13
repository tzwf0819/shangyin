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
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilter">
          <span>刷</span>
          <span>重置</span>
        </button>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <span>+</span>
        <span>新建记录</span>
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 140px">合同编号</th>
              <th>产品</th>
              <th>工序</th>
              <th>员工</th>
              <th class="text-right">数量</th>
              <th class="text-right">金额</th>
              <th style="width: 100px">状态</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td><strong>{{ item.contractNo }}</strong></td>
              <td>{{ item.productName || '-' }}</td>
              <td>{{ item.processName || '-' }}</td>
              <td>{{ item.employeeName || '-' }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">¥{{ formatMoney(item.amount) }}</td>
              <td>
                <span class="badge" :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="openEdit(item)" title="编辑">
                    <span>编</span>
                  </button>
                  <button class="btn-icon" @click="updateStatus(item)" title="更新状态">
                    <span>刷</span>
                  </button>
                  <button class="btn-icon" @click="remove(item.id)" title="删除">
                    <span>删</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0 && !loading">
              <td colspan="8" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">记</div>
                  <div class="empty-title">暂无生产记录</div>
                  <div class="empty-description">点击上方按钮创建第一条记录</div>
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

    <!-- 编辑弹窗 -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '编辑生产记录' : '新建生产记录' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="save">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  合同 <span class="required">*</span>
                </label>
                <select v-model="form.contractId" required @change="onContractChange">
                  <option value="">选择合同</option>
                  <option v-for="c in contracts" :key="c.id" :value="c.id">
                    {{ c.contractNo }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">
                  产品 <span class="required">*</span>
                </label>
                <select v-model="form.productTypeId" required>
                  <option value="">选择产品</option>
                  <option v-for="p in productTypes" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  工序 <span class="required">*</span>
                </label>
                <select v-model="form.processId" required @change="onProcessChange">
                  <option value="">选择工序</option>
                  <option v-for="p in processes" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">
                  员工 <span class="required">*</span>
                </label>
                <select v-model="form.employeeId" required>
                  <option value="">选择员工</option>
                  <option v-for="e in employees" :key="e.id" :value="e.id">
                    {{ e.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  数量 <span class="required">*</span>
                </label>
                <input
                  v-model.number="form.quantity"
                  type="number"
                  min="1"
                  placeholder="请输入数量"
                  required
                  @input="calculateAmount"
                />
              </div>
              <div class="form-group">
                <label class="form-label">单价</label>
                <input
                  v-model.number="form.unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="自动计算"
                  @input="calculateAmount"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">金额</label>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                readonly
                class="bg-secondary"
              />
            </div>
            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea
                v-model="form.remark"
                rows="2"
                placeholder="备注信息..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner spinner-sm"></span>
              <span>保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import http from '../api/http';

const list = ref([]);
const contracts = ref([]);
const productTypes = ref([]);
const processes = ref([]);
const employees = ref([]);
const loading = ref(false);
const modalVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);

const filter = reactive({ contractNo: '', status: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const form = reactive({
  id: null,
  contractId: '',
  productTypeId: '',
  processId: '',
  employeeId: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  status: 'pending',
  remark: ''
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

const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(2);
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

const load = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize };
    if (filter.contractNo) params.contractNo = filter.contractNo;
    if (filter.status) params.status = filter.status;
    const res = await http.get('/shangyin/production-records', { params });
    list.value = res.data.rows || res.data || [];
    pagination.total = res.data.count || list.value.length;
  } catch (e) {
    alert('加载失败：' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

const loadOptions = async () => {
  try {
    const [cRes, pRes, prRes, eRes] = await Promise.all([
      http.get('/shangyin/contracts'),
      http.get('/shangyin/product-types'),
      http.get('/shangyin/processes'),
      http.get('/shangyin/employees')
    ]);
    contracts.value = cRes.data.rows || cRes.data || [];
    productTypes.value = pRes.data.rows || pRes.data || [];
    processes.value = prRes.data.rows || prRes.data || [];
    employees.value = eRes.data.rows || eRes.data || [];
  } catch (e) {
    console.warn('加载选项失败', e);
  }
};

const onContractChange = () => {
  // 根据合同自动选择产品类型
  const contract = contracts.value.find(c => c.id === form.contractId);
  if (contract && contract.items?.length > 0) {
    form.productTypeId = contract.items[0].productTypeId;
  }
};

const onProcessChange = () => {
  // 根据工序自动填充单价
  const process = processes.value.find(p => p.id === form.processId);
  if (process) {
    form.unitPrice = process.unitPrice;
    calculateAmount();
  }
};

const calculateAmount = () => {
  form.amount = (form.quantity || 0) * (form.unitPrice || 0);
};

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    contractId: '',
    productTypeId: '',
    processId: '',
    employeeId: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    status: 'pending',
    remark: ''
  });
  modalVisible.value = true;
};

const openEdit = (item) => {
  isEdit.value = true;
  Object.assign(form, item);
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
};

const updateStatus = async (item) => {
  const statusMap = {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: 'pending'
  };
  const newStatus = statusMap[item.status];
  
  if (!confirm(`确定将状态更新为 "${getStatusText(newStatus)}" 吗？`)) return;
  
  try {
    await http.put(`/shangyin/production-records/${item.id}`, { ...item, status: newStatus });
    load();
  } catch (e) {
    alert('更新失败：' + (e.response?.data?.message || e.message));
  }
};

const save = async () => {
  saving.value = true;
  try {
    if (isEdit.value) {
      await http.put(`/shangyin/production-records/${form.id}`, form);
    } else {
      await http.post('/shangyin/production-records', form);
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
  if (!confirm('确定删除此记录？')) return;
  try {
    await http.delete(`/shangyin/production-records/${id}`);
    load();
  } catch (e) {
    alert('删除失败：' + (e.response?.data?.message || e.message));
  }
};

onMounted(() => {
  load();
  loadOptions();
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

.text-right {
  text-align: right;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.required {
  color: var(--color-error);
}

.bg-secondary {
  background: var(--bg-surface-secondary);
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
}
</style>
