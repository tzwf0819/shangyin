<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header-actions">
      <div class="search-bar">
        <input
          v-model="filter.name"
          type="text"
          class="search-input"
          placeholder="搜索产品类型..."
          @input="debounceLoad"
        />
        <button class="btn btn-secondary" @click="resetFilter">
          <span>刷</span>
          <span>重置</span>
        </button>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <span>+</span>
        <span>添加产品类型</span>
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th>名称</th>
              <th>描述</th>
              <th style="width: 120px">创建时间</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td>{{ item.description || '-' }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="openEdit(item)" title="编辑">
                    <span>编</span>
                  </button>
                  <button class="btn-icon" @click="remove(item.id)" title="删除">
                    <span>删</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0 && !loading">
              <td colspan="5" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">包</div>
                  <div class="empty-title">暂无产品类型</div>
                  <div class="empty-description">点击上方按钮添加第一条产品类型</div>
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
          <h3 class="modal-title">{{ isEdit ? '编辑产品类型' : '添加产品类型' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="save">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">
                名称 <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="请输入产品类型名称"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="产品类型描述（可选）"
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

const filter = reactive({ name: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const form = reactive({ id: null, name: '', description: '' });

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

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
};

const load = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize };
    if (filter.name) params.name = filter.name;
    const res = await http.get('/shangyin/product-types', { params });
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
  Object.assign(form, { id: null, name: '', description: '' });
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
      await http.put(`/shangyin/product-types/${form.id}`, form);
    } else {
      await http.post('/shangyin/product-types', form);
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
  if (!confirm('确定删除？')) return;
  try {
    await http.delete(`/shangyin/product-types/${id}`);
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
