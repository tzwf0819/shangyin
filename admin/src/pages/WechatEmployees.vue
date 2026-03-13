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
        <input
          v-model="filter.phone"
          type="text"
          class="search-input"
          placeholder="搜索手机号..."
          @input="debounceLoad"
        />
        <select v-model="filter.status" @change="load">
          <option value="">全部状态</option>
          <option value="active">已绑定</option>
          <option value="inactive">未绑定</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilter">
          <span>🔄</span>
          <span>重置</span>
        </button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>微信OpenID</th>
              <th style="width: 100px">绑定状态</th>
              <th style="width: 120px">绑定时间</th>
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
              <td>{{ item.phone || '-' }}</td>
              <td>
                <code v-if="item.openId">{{ maskOpenId(item.openId) }}</code>
                <span v-else class="text-muted">未绑定</span>
              </td>
              <td>
                <span class="badge" :class="item.openId ? 'badge-success' : 'badge-default'">
                  {{ item.openId ? '已绑定' : '未绑定' }}
                </span>
              </td>
              <td>{{ formatDate(item.boundAt) }}</td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="openEdit(item)" title="编辑">
                    <span>✏️</span>
                  </button>
                  <button
                    v-if="item.openId"
                    class="btn-icon"
                    @click="unbind(item)"
                    title="解绑微信"
                  >
                    <span>🔗</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0 && !loading">
              <td colspan="7" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">💬</div>
                  <div class="empty-title">暂无微信员工</div>
                  <div class="empty-description">员工通过小程序绑定后会自动显示</div>
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
          <h3 class="modal-title">编辑微信员工</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="save">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">姓名</label>
              <input v-model="form.name" type="text" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">手机号</label>
              <input v-model="form.phone" type="tel" placeholder="请输入手机号" />
            </div>
            <div class="form-group">
              <label class="form-label">微信OpenID</label>
              <input v-model="form.openId" type="text" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">绑定时间</label>
              <input :value="formatDate(form.boundAt)" type="text" disabled />
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
const saving = ref(false);

const filter = reactive({ name: '', phone: '', status: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const form = reactive({ id: null, name: '', phone: '', openId: '', boundAt: null });

let debounceTimer = null;
const debounceLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => load(), 300);
};

const resetFilter = () => {
  filter.name = '';
  filter.phone = '';
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

const maskOpenId = (openId) => {
  if (!openId || openId.length < 10) return openId;
  return openId.substring(0, 6) + '...' + openId.substring(openId.length - 4);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

const load = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize };
    if (filter.name) params.name = filter.name;
    if (filter.phone) params.phone = filter.phone;
    if (filter.status) params.status = filter.status;
    const res = await http.get('/shangyin/wechat-employees', { params });
    list.value = res.data.rows || res.data || [];
    pagination.total = res.data.count || list.value.length;
  } catch (e) {
    alert('加载失败：' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

const openEdit = (item) => {
  Object.assign(form, item);
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
};

const save = async () => {
  saving.value = true;
  try {
    await http.put(`/shangyin/wechat-employees/${form.id}`, { phone: form.phone });
    closeModal();
    load();
  } catch (e) {
    alert('保存失败：' + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
};

const unbind = async (item) => {
  if (!confirm(`确定要解绑 ${item.name} 的微信账号吗？`)) return;
  try {
    await http.post(`/shangyin/wechat-employees/${item.id}/unbind`);
    load();
  } catch (e) {
    alert('解绑失败：' + (e.response?.data?.message || e.message));
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
}

.search-input {
  height: 40px;
  min-width: 150px;
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

code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-sm);
}

.text-muted {
  color: var(--text-tertiary);
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

@media (max-width: 768px) {
  .page-header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
}
</style>
