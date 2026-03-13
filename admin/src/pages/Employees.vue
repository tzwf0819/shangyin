<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header-actions">
      <div class="search-bar">
        <input
          v-model="filter.name"
          type="text"
          class="search-input"
          placeholder="搜索员工姓名..."
          @input="debounceLoad"
        />
        <select v-model="filter.status" @change="load">
          <option value="">全部状态</option>
          <option value="active">在职</option>
          <option value="inactive">离职</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilter">
          <span>刷</span>
          <span>重置</span>
        </button>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <span>+</span>
        <span>添加员工</span>
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th>姓名</th>
              <th>工号</th>
              <th>职位</th>
              <th>联系电话</th>
              <th style="width: 100px">状态</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.id }}</td>
              <td>
                <div class="employee-name">
                  <span class="employee-avatar">{{ getInitial(item.name) }}</span>
                  <span>{{ item.name }}</span>
                </div>
              </td>
              <td>{{ item.employeeNo || '-' }}</td>
              <td>{{ item.position || '-' }}</td>
              <td>{{ item.phone || '-' }}</td>
              <td>
                <span class="badge" :class="item.status === 'active' ? 'badge-success' : 'badge-default'">
                  {{ item.status === 'active' ? '在职' : '离职' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="openEdit(item)" title="编辑">
                    <span>编</span>
                  </button>
                  <button class="btn-icon" @click="toggleStatus(item)" :title="item.status === 'active' ? '设为离职' : '设为在职'">
                    <span>{{ item.status === 'active' ? '门' : '[OK]' }}</span>
                  </button>
                  <button class="btn-icon" @click="remove(item.id)" title="删除">
                    <span>删</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0 && !loading">
              <td colspan="7" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">群</div>
                  <div class="empty-title">暂无员工</div>
                  <div class="empty-description">点击上方按钮添加第一位员工</div>
                </div>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="7" class="loading-cell">
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
          <h3 class="modal-title">{{ isEdit ? '编辑员工' : '添加员工' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="save">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  姓名 <span class="required">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="请输入员工姓名"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">工号</label>
                <input
                  v-model="form.employeeNo"
                  type="text"
                  placeholder="如：YG-001"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">职位</label>
                <input
                  v-model="form.position"
                  type="text"
                  placeholder="如：车工、质检员"
                />
              </div>
              <div class="form-group">
                <label class="form-label">联系电话</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="form.status">
                <option value="active">在职</option>
                <option value="inactive">离职</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea
                v-model="form.remark"
                rows="2"
                placeholder="员工备注信息..."
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
const loading = ref(false);
const modalVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);

const filter = reactive({ name: '', status: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const form = reactive({
  id: null,
  name: '',
  employeeNo: '',
  position: '',
  phone: '',
  status: 'active',
  remark: ''
});

let debounceTimer = null;
const debounceLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => load(), 300);
};

const resetFilter = () => {
  filter.name = '';
  filter.status = '';
  pagination.page = 1;
  load();
};

const changePage = (page) => {
  pagination.page = page;
  load();
};

const getInitial = (name) => {
  return name ? name.charAt(0) : '?';
};

const load = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize };
    if (filter.name) params.name = filter.name;
    if (filter.status) params.status = filter.status;
    const res = await http.get('/shangyin/employees', { params });
    list.value = res.data.rows || res.data || [];
    pagination.total = res.data.count || list.value.length;
  } catch (e) {
    alert('加载失败：' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    name: '',
    employeeNo: '',
    position: '',
    phone: '',
    status: 'active',
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

const save = async () => {
  saving.value = true;
  try {
    if (isEdit.value) {
      await http.put(`/shangyin/employees/${form.id}`, form);
    } else {
      await http.post('/shangyin/employees', form);
    }
    closeModal();
    load();
  } catch (e) {
    alert('保存失败：' + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
};

const toggleStatus = async (item) => {
  const newStatus = item.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? '设为在职' : '设为离职';
  
  if (!confirm(`确定要将 ${item.name} ${action}吗？`)) return;
  
  try {
    await http.put(`/shangyin/employees/${item.id}`, { ...item, status: newStatus });
    load();
  } catch (e) {
    alert('操作失败：' + (e.response?.data?.message || e.message));
  }
};

const remove = async (id) => {
  if (!confirm('确定删除此员工？')) return;
  try {
    await http.delete(`/shangyin/employees/${id}`);
    load();
  } catch (e) {
    alert('删除失败：' + (e.response?.data?.message || e.message));
  }
};

onMounted(load);
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

.employee-name {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.employee-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border-radius: 50%;
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
