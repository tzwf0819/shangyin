<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header-actions">
      <div class="search-bar">
        <input
          v-model="filter.name"
          type="text"
          class="search-input"
          placeholder="搜索角色名称..."
          @input="debounceLoad"
        />
        <button class="btn btn-secondary" @click="resetFilter">
          <span>🔄</span>
          <span>重置</span>
        </button>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <span>➕</span>
        <span>新建角色</span>
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th>角色名称</th>
              <th>描述</th>
              <th style="width: 200px">权限</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td>{{ item.description || '-' }}</td>
              <td>
                <div class="permission-tags">
                  <span
                    v-for="perm in getPermissionNames(item.permissions)"
                    :key="perm"
                    class="permission-tag"
                  >
                    {{ perm }}
                  </span>
                  <span v-if="!item.permissions || item.permissions.length === 0" class="text-muted">
                    暂无权限
                  </span>
                </div>
              </td>
              <td>
                <div class="table-actions">
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
              <td colspan="5" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">🔐</div>
                  <div class="empty-title">暂无角色</div>
                  <div class="empty-description">点击上方按钮创建第一个角色</div>
                </div>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="5" class="loading-cell">
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
          <h3 class="modal-title">{{ isEdit ? '编辑角色' : '新建角色' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="save">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">
                角色名称 <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="如：管理员、普通用户"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="form.description"
                rows="2"
                placeholder="角色描述（可选）"
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">权限配置</label>
              <div class="permissions-list">
                <label
                  v-for="perm in allPermissions"
                  :key="perm.key"
                  class="permission-checkbox"
                >
                  <input
                    type="checkbox"
                    :value="perm.key"
                    v-model="form.permissions"
                  />
                  <span class="checkbox-label">
                    <strong>{{ perm.name }}</strong>
                    <span class="checkbox-desc">{{ perm.description }}</span>
                  </span>
                </label>
              </div>
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

const filter = reactive({ name: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const form = reactive({ id: null, name: '', description: '', permissions: [] });

// 所有可用权限
const allPermissions = [
  { key: 'contracts:view', name: '查看合同', description: '查看合同列表和详情' },
  { key: 'contracts:edit', name: '编辑合同', description: '创建和修改合同' },
  { key: 'contracts:delete', name: '删除合同', description: '删除合同' },
  { key: 'employees:view', name: '查看员工', description: '查看员工列表' },
  { key: 'employees:edit', name: '编辑员工', description: '管理员工信息' },
  { key: 'processes:view', name: '查看工序', description: '查看工序列表' },
  { key: 'processes:edit', name: '编辑工序', description: '管理工序信息' },
  { key: 'production:view', name: '查看生产', description: '查看生产记录和进度' },
  { key: 'production:edit', name: '编辑生产', description: '管理生产记录' },
  { key: 'reports:view', name: '查看报表', description: '查看绩效汇总等报表' },
  { key: 'system:admin', name: '系统管理', description: '系统设置和权限管理' }
];

let debounceTimer = null;
const debounceLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => load(), 300);
};

const resetFilter = () => {
  filter.name = '';
  pagination.page = 1;
  load();
};

const changePage = (page) => {
  pagination.page = page;
  load();
};

const getPermissionNames = (permissions) => {
  if (!permissions || permissions.length === 0) return [];
  return permissions
    .map(key => allPermissions.find(p => p.key === key)?.name)
    .filter(Boolean);
};

const load = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize };
    if (filter.name) params.name = filter.name;
    const res = await http.get('/shangyin/permissions', { params });
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
  Object.assign(form, { id: null, name: '', description: '', permissions: [] });
  modalVisible.value = true;
};

const openEdit = (item) => {
  isEdit.value = true;
  Object.assign(form, {
    id: item.id,
    name: item.name,
    description: item.description || '',
    permissions: Array.isArray(item.permissions) ? [...item.permissions] : []
  });
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
};

const save = async () => {
  saving.value = true;
  try {
    if (isEdit.value) {
      await http.put(`/shangyin/permissions/${form.id}`, form);
    } else {
      await http.post('/shangyin/permissions', form);
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
  if (!confirm('确定删除此角色？')) return;
  try {
    await http.delete(`/shangyin/permissions/${id}`);
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
  max-width: 500px;
}

.search-input {
  flex: 1;
  height: 40px;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.permission-tag {
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: var(--radius-full);
}

.text-muted {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
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

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 300px;
  overflow-y: auto;
  padding: var(--space-3);
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-md);
}

.permission-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.permission-checkbox:hover {
  background: var(--bg-hover);
}

.permission-checkbox input {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.checkbox-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-label strong {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-primary);
}

.checkbox-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
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
  }
}
</style>
