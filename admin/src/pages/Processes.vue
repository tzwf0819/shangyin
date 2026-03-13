<template>
  <div class="process-page">
    <!-- 查询工具栏 -->
    <div class="query-bar">
      <div class="form-row">
        <div class="form-field">
          <label>工序名称:</label>
          <input v-model="query.keyword" placeholder="搜索名称或编码" @keyup.enter="load" />
        </div>
        <div class="form-field">
          <button class="primary" @click="load">查询</button>
          <button class="primary" @click="openCreate">新增工序</button>
        </div>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <div class="data-grid">
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>激光雕刻</th>
            <th>绩效单价</th>
            <th>单位</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in items" :key="p.id">
            <td>{{ p.name }}</td>
            <td>
              <span v-if="p.isLaserEngraving" class="tag tag-laser">是</span>
              <span v-else class="muted">-</span>
            </td>
            <td>{{ p.payRate }}</td>
            <td>{{ p.payRateUnit === 'perItem' ? '件' : '小时' }}</td>
            <td>
              <button @click="edit(p)">编辑</button>
              <button class="danger" @click="remove(p.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-if="!items.length">暂无工序数据</div>

    <!-- 新增/编辑对话框 -->
    <dialog ref="dlg">
      <form @submit.prevent="save">
        <div class="modal-header">{{ form.id ? '编辑工序' : '新增工序' }}</div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-field">
              <label class="required">名称:</label>
              <input v-model="form.name" required />
            </div>
            <div class="form-field">
              <label>绩效单价:</label>
              <input type="number" step="0.01" v-model.number="form.payRate" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>单位:</label>
              <select v-model="form.payRateUnit">
                <option value="perItem">件</option>
                <option value="perHour">小时</option>
              </select>
            </div>
            <div class="form-field">
              <label>描述:</label>
              <input v-model="form.description" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field checkbox-field">
              <input type="checkbox" v-model="form.isLaserEngraving" id="isLaser" />
              <label for="isLaser">激光雕刻工序</label>
            </div>
          </div>
          <div class="laser-config" v-if="form.isLaserEngraving">
            <div class="group-title">激光雕刻配置</div>
            <div class="form-row">
              <div class="form-field">
                <label>模式1名称:</label>
                <input v-model="form.laserMode1Name" placeholder="例如：模式 A" />
              </div>
              <div class="form-field">
                <label>模式1单价:</label>
                <input type="number" step="0.01" v-model.number="form.laserMode1PayRate" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>模式2名称:</label>
                <input v-model="form.laserMode2Name" placeholder="例如：模式 B" />
              </div>
              <div class="form-field">
                <label>模式2单价:</label>
                <input type="number" step="0.01" v-model.number="form.laserMode2PayRate" />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="close">取消</button>
          <button class="primary" type="submit">保存</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { listProcesses, createProcess, updateProcess, deleteProcess } from '../api/processes';

const query = reactive({ page:1, limit:50, keyword:'' });
const items = ref([]);
const dlg = ref();
const form = reactive({ 
  id:null, 
  name:'', 
  payRate:0, 
  payRateUnit:'perItem', 
  description:'', 
  isLaserEngraving:false, 
  laserMode1PayRate:0, 
  laserMode2PayRate:0, 
  laserMode1Name:'模式 A', 
  laserMode2Name:'模式 B' 
});

const load = async () => {
  const r = await listProcesses(query); 
  if(r.success){ 
    items.value = r.data.processes; 
  }
};

const openCreate = () => { 
  Object.assign(form,{ 
    id:null, name:'', payRate:0, payRateUnit:'perItem', description:'', 
    isLaserEngraving:false, laserMode1PayRate:0, laserMode2PayRate:0, 
    laserMode1Name:'模式 A', laserMode2Name:'模式 B'
  }); 
  dlg.value.showModal(); 
};

const edit = (p) => { 
  Object.assign(form,p); 
  dlg.value.showModal(); 
};

const close = () => dlg.value.close();

const save = async () => {
  const payload = { 
    name:form.name, payRate:form.payRate, payRateUnit:form.payRateUnit, 
    status:'active', description:form.description,
    isLaserEngraving:form.isLaserEngraving, laserMode1PayRate:form.laserMode1PayRate, 
    laserMode2PayRate:form.laserMode2PayRate,
    laserMode1Name:form.laserMode1Name, laserMode2Name:form.laserMode2Name
  };
  if(form.id) await updateProcess(form.id,payload); 
  else await createProcess(payload);
  close(); 
  load();
};

const remove = async (id) => {
  if(!confirm('确认删除?')) return;
  try {
    const result = await deleteProcess(id);
    if (result.success) {
      load();
      alert('工序删除成功');
    } else {
      alert(result.message || '删除失败');
    }
  } catch (error) {
    alert('删除工序失败: ' + (error.response?.data?.message || error.message));
  }
};

onMounted(load);
</script>

<style scoped>
.process-page {
  height: 100%;
}

/* 查询栏 */
.query-bar {
  background: #e8e8e8;
  border: 1px solid #a0a0a0;
  padding: 8px;
  margin-bottom: 8px;
}

.query-bar .form-row {
  margin-bottom: 0;
}

/* 数据网格 */
.data-grid {
  background: #ffffff;
  border: 1px solid #a0a0a0;
  overflow: auto;
  max-height: calc(100% - 60px);
}

.data-grid table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-grid th {
  background: #d4d4d4;
  padding: 6px 8px;
  text-align: left;
  border: 1px solid #a0a0a0;
  font-weight: bold;
}

.data-grid td {
  padding: 6px 8px;
  border: 1px solid #c0c0c0;
}

.data-grid tr:hover {
  background: #e8f4fc;
}

/* 标签 */
.tag {
  display: inline-block;
  padding: 1px 6px;
  background: #e6f7ec;
  border: 1px solid #3BA372;
  color: #3BA372;
  font-size: 11px;
}

.muted {
  color: #999;
}

.empty {
  text-align: center;
  padding: 40px 0;
  color: #999;
  background: #ffffff;
  border: 1px solid #a0a0a0;
  margin-top: 8px;
}

/* 复选框字段 */
.checkbox-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkbox-field label {
  margin-bottom: 0;
}

/* 激光配置 */
.laser-config {
  border: 1px solid #c0c0c0;
  background: #ffffff;
  margin-top: 12px;
  padding: 8px;
}

.group-title {
  background: #d4d4d4;
  padding: 4px 8px;
  margin: -8px -8px 8px -8px;
  font-weight: bold;
  font-size: 12px;
  border-bottom: 1px solid #c0c0c0;
}

/* 对话框 */
dialog {
  border: 1px solid #a0a0a0;
  border-radius: 2px;
  padding: 0;
  width: 550px;
  max-width: 90vw;
  max-height: 85vh;
  overflow: auto;
  background: #f0f0f0;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.3);
}

.modal-header {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
  padding: 8px 12px;
  border-bottom: 1px solid #a0a0a0;
  font-size: 13px;
  font-weight: bold;
}

.modal-body {
  padding: 12px;
  background: #f0f0f0;
}

.modal-footer {
  padding: 8px 12px;
  border-top: 1px solid #a0a0a0;
  background: #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.required::before {
  content: "*";
  color: #ff0000;
  margin-right: 2px;
}
</style>
