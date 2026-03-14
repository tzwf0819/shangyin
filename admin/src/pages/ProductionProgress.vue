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
          <option value="pending">未开始</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="delayed">延期</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilter">
          <Icon name="refresh" :size="16" />
          <span>重置</span>
        </button>
      </div>
    </div>

    <!-- 进度概览 -->
    <div class="progress-overview">
      <div class="overview-card">
        <div class="overview-icon" style="background: #0078d420; color: #0078d4;"><Icon name="file-text" :size="28" /></div>
        <div class="overview-info">
          <div class="overview-value">{{ overview.total }}</div>
          <div class="overview-label">总任务</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: #107c1020; color: #107c10;"><Icon name="check-circle" :size="28" /></div>
        <div class="overview-info">
          <div class="overview-value">{{ overview.completed }}</div>
          <div class="overview-label">已完成</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: #ffc10720; color: #856404;"><Icon name="loader" :size="28" /></div>
        <div class="overview-info">
          <div class="overview-value">{{ overview.inProgress }}</div>
          <div class="overview-label">进行中</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: #a8000020; color: #a80000;"><Icon name="alert-circle" :size="28" /></div>
        <div class="overview-info">
          <div class="overview-value">{{ overview.delayed }}</div>
          <div class="overview-label">延期</div>
        </div>
      </div>
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
              <th>负责人</th>
              <th>计划时间</th>
              <th class="text-center">进度</th>
              <th style="width: 100px">状态</th>
              <th style="width: 120px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td><strong>{{ item.contractNo }}</strong></td>
              <td>{{ item.productName || '-' }}</td>
              <td>{{ item.processName || '-' }}</td>
              <td>{{ item.employeeName || '-' }}</td>
              <td>
                <div class="plan-date">
                  <div>{{ formatDate(item.plannedStart) }}</div>
                  <div class="text-muted">至 {{ formatDate(item.plannedEnd) }}</div>
                </div>
              </td>
              <td>
                <div class="progress-cell">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :style="{ width: item.progress + '%', background: getProgressColor(item) }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ item.progress }}%</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="openProgressModal(item)" title="更新进度">
                    <Icon name="edit" :size="16" />
                  </button>
                  <button class="btn-icon" @click="viewDetail(item)" title="查看详情">
                    <Icon name="eye" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0 && !loading">
              <td colspan="8" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon"><Icon name="file-text" :size="48" /></div>
                  <div class="empty-title">暂无生产进度</div>
                  <div class="empty-description">暂无生产任务数据</div>
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

    <!-- 进度更新弹窗 -->
    <div v-if="progressModalVisible" class="modal-overlay" @click.self="closeProgressModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">更新生产进度</h3>
          <button class="modal-close" @click="closeProgressModal">×</button>
        </div>
        <form @submit.prevent="saveProgress">
          <div class="modal-body">
            <div class="progress-info">
              <div class="info-row">
                <span class="info-label">合同：</span>
                <span class="info-value">{{ progressForm.contractNo }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">工序：</span>
                <span class="info-value">{{ progressForm.processName }}</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">当前进度 (%)</label>
              <div class="progress-input-group">
                <input
                  v-model.number="progressForm.progress"
                  type="range"
                  min="0"
                  max="100"
                  class="progress-range"
                />
                <input
                  v-model.number="progressForm.progress"
                  type="number"
                  min="0"
                  max="100"
                  class="progress-number"
                />
                <span>%</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="progressForm.status">
                <option value="pending">未开始</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="delayed">延期</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea
                v-model="progressForm.remark"
                rows="3"
                placeholder="进度更新说明..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeProgressModal">
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
import Icon from '../components/Icon.vue';

const list = ref([]);
const loading = ref(false);
const progressModalVisible = ref(false);
const saving = ref(false);

const filter = reactive({ contractNo: '', status: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const overview = reactive({ total: 0, completed: 0, inProgress: 0, delayed: 0 });

const progressForm = reactive({
  id: null,
  contractNo: '',
  processName: '',
  progress: 0,
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

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
};

const getStatusText = (status) => {
  const map = {
    pending: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    delayed: '延期'
  };
  return map[status] || status;
};

const getStatusClass = (status) => {
  const map = {
    pending: 'badge-default',
    in_progress: 'badge-warning',
    completed: 'badge-success',
    delayed: 'badge-error'
  };
  return map[status] || 'badge-default';
};

const getProgressColor = (item) => {
  if (item.status === 'completed') return '#107c10';
  if (item.status === 'delayed') return '#a80000';
  if (item.progress >= 80) return '#0078d4';
  if (item.progress >= 50) return '#ffc107';
  return '#605e5c';
};

const load = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize };
    if (filter.contractNo) params.contractNo = filter.contractNo;
    if (filter.status) params.status = filter.status;
    const res = await http.get('/shangyin/production-progress', { params });
    list.value = res.data.rows || res.data || [];
    pagination.total = res.data.count || list.value.length;
    // 更新概览
    const stats = res.data.overview || {};
    Object.assign(overview, {
      total: stats.total || 0,
      completed: stats.completed || 0,
      inProgress: stats.inProgress || 0,
      delayed: stats.delayed || 0
    });
  } catch (e) {
    alert('加载失败：' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
};

const openProgressModal = (item) => {
  Object.assign(progressForm, {
    id: item.id,
    contractNo: item.contractNo,
    processName: item.processName,
    progress: item.progress || 0,
    status: item.status || 'pending',
    remark: item.remark || ''
  });
  progressModalVisible.value = true;
};

const closeProgressModal = () => {
  progressModalVisible.value = false;
};

const saveProgress = async () => {
  saving.value = true;
  try {
    await http.put(`/shangyin/production-progress/${progressForm.id}`, {
      progress: progressForm.progress,
      status: progressForm.status,
      remark: progressForm.remark
    });
    closeProgressModal();
    load();
  } catch (e) {
    alert('保存失败：' + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
};

const viewDetail = (item) => {
  alert(`合同详情：${item.contractNo}\n工序：${item.processName}\n进度：${item.progress}%`);
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

.progress-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.overview-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.overview-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: var(--radius-lg);
}

.overview-info {
  flex: 1;
}

.overview-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.overview-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.plan-date {
  font-size: var(--text-sm);
}

.text-muted {
  color: var(--text-tertiary);
}

.text-center {
  text-align: center;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  min-width: 40px;
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

.progress-info {
  background: var(--bg-surface-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.info-row {
  display: flex;
  margin-bottom: var(--space-2);
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 60px;
}

.info-value {
  color: var(--text-primary);
}

.progress-input-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-range {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-full);
  outline: none;
}

.progress-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.progress-number {
  width: 70px;
  text-align: center;
}

@media (max-width: 1200px) {
  .progress-overview {
    grid-template-columns: repeat(2, 1fr);
  }
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
  
  .progress-overview {
    grid-template-columns: 1fr;
  }
  
  .progress-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}
</style>
