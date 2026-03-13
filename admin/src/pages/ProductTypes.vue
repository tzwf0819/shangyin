<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="搜索名称/编码" @keyup.enter="load" />
      <button class="primary" @click="openCreate">新增类型</button>
    </div>
    
    <!-- 产品类型表格 -->
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>父级分类</th>
            <th>通知工序</th>
            <th>工序数量</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in items" :key="t.id">
            <td>
              {{ t.name }}
              <span v-if="t.parent" class="tag tag-child">子类</span>
            </td>
            <td>{{ t.parent?.name || '-' }}</td>
            <td>
              <span v-if="t.needNotification && t.notifyProcess" class="tag tag-notify">
                {{ t.notifyProcess.name }}
              </span>
              <span v-else class="muted">-</span>
            </td>
            <td>{{ (t.processes||[]).length }}</td>
            <td>
              <button @click="edit(t)">编辑</button>
              <button class="danger" @click="remove(t.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无产品类型</div>

    <!-- 新增/编辑对话框 -->
    <dialog ref="dlg">
      <form @submit.prevent="save">
        <div class="modal-header">{{ form.id ? '编辑产品类型' : '新增产品类型' }}</div>
        <div class="modal-body">
          <!-- 名称 -->
          <div class="field">
            <label>名称 *</label>
            <input v-model="form.name" required placeholder="输入产品类型名称" />
          </div>
          
          <!-- 父级分类 -->
          <div class="field">
            <label>父级分类</label>
            <select v-model="form.parentId">
              <option :value="null">-- 顶级分类 --</option>
              <option v-for="pt in topLevelTypes" :key="pt.id" :value="pt.id" :disabled="pt.id === form.id">
                {{ pt.name }}
              </option>
            </select>
            <small class="hint">选择父级分类可创建二级分类</small>
          </div>
          
          <!-- 通知工序设置 -->
          <div class="field">
            <label>
              <input type="checkbox" v-model="form.needNotification" />
              启用工序完成通知
            </label>
            <small class="hint">启用后，当生产执行到指定工序时会通知业务员</small>
          </div>
          
          <div class="field" v-if="form.needNotification">
            <label>通知工序 *</label>
            <select v-model="form.notifyProcessId" required>
              <option :value="null">-- 选择工序 --</option>
              <option v-for="p in processes" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <small class="hint">当产品完成此工序时，将发送通知给业务员</small>
          </div>
          
          <!-- 工序选择 -->
          <div class="field">
            <label>关联工序 / 排序 (拖动排序)</label>
            <div class="process-selector">
              <div class="process-available">
                <div class="section-title">可选工序</div>
                <div class="process-list">
                  <label v-for="p in availableProcesses" :key="p.id" class="process-item">
                    <input type="checkbox" :value="p.id" v-model="selectedProcessIds" />
                    <span>{{ p.name }}</span>
                  </label>
                </div>
              </div>
              <div class="process-selected">
                <div class="section-title">
                  已选顺序 (拖动排序)
                  <span v-if="orderedSelected.length" class="reset-link" @click="resetOrder">重置</span>
                </div>
                <ul class="sortable-list">
                  <li v-for="(op,i) in orderedSelected" :key="op.id"
                      draggable="true"
                      @dragstart="dragStart(i)"
                      @dragover.prevent
                      @drop="drop(i)"
                      class="sortable-item">
                    <span>{{ i+1 }}. {{ op.name }}</span>
                    <span class="drag-handle">☰</span>
                  </li>
                  <li v-if="!orderedSelected.length" class="empty-item">无已选工序</li>
                </ul>
              </div>
            </div>
            <small class="hint">左侧勾选工序，右侧可拖动排序</small>
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
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { listProductTypes, createProductType, updateProductType, deleteProductType } from '../api/productTypes';
import { listProcesses } from '../api/processes';

const query = reactive({ page:1, limit:50, keyword:'' });
const items = ref([]);
const processes = ref([]);
const dlg = ref();
const form = reactive({ 
  id:null, 
  name:'',
  parentId: null,
  notifyProcessId: null,
  needNotification: false,
  processes:[] 
});
const selectedProcessIds = ref([]);
const orderedSelected = ref([]);
let dragIndex = -1;

// 计算顶级分类（用于父级选择）
const topLevelTypes = computed(() => {
  return items.value.filter(t => !t.parentId);
});

// 计算可选工序（排除已选的）
const availableProcesses = computed(() => {
  return processes.value;
});

const load = async () => { 
  const r = await listProductTypes(query); 
  if(r.success){ 
    items.value = r.data.productTypes; 
  } 
};

const loadProcesses = async () => { 
  const r = await listProcesses({ limit:500 }); 
  if(r.success) processes.value = r.data.processes; 
};

const openCreate = () => { 
  Object.assign(form, {
    id:null, 
    name:'',
    parentId: null,
    notifyProcessId: null,
    needNotification: false,
    processes:[]
  }); 
  selectedProcessIds.value = []; 
  orderedSelected.value = []; 
  dlg.value.showModal(); 
};

const edit = (t) => { 
  Object.assign(form, {
    id: t.id,
    name: t.name,
    parentId: t.parentId || null,
    notifyProcessId: t.notifyProcessId || null,
    needNotification: t.needNotification || false,
    processes: t.processes || []
  }); 
  selectedProcessIds.value = (t.processes||[]).map(p=>p.id); 
  orderedSelected.value = (t.processes||[]).map(p=>({ id:p.id, name:p.name })); 
  dlg.value.showModal(); 
};

const close = () => dlg.value.close();

const syncOrder = () => {
  orderedSelected.value = selectedProcessIds.value
    .map(id => orderedSelected.value.find(o=>o.id===id) || processes.value.find(p=>p.id===id) || { id, name: '工序'+id })
    .filter(Boolean);
};

watch(selectedProcessIds, syncOrder);

const dragStart = (i) => { dragIndex = i; };

const drop = (i) => {
  if(dragIndex===-1 || dragIndex===i) return;
  const arr = [...orderedSelected.value];
  const [m] = arr.splice(dragIndex,1);
  arr.splice(i,0,m);
  orderedSelected.value = arr;
  dragIndex = -1;
};

const resetOrder = () => { 
  orderedSelected.value = [...orderedSelected.value]; 
};

const save = async () => {
  const procs = orderedSelected.value.map((o,idx)=>({ id:o.id, sequenceOrder: idx+1 }));
  const payload = {
    name: form.name,
    parentId: form.parentId,
    notifyProcessId: form.needNotification ? form.notifyProcessId : null,
    needNotification: form.needNotification,
    processes: procs
  };
  
  if(form.id) {
    await updateProductType(form.id, payload);
  } else {
    await createProductType(payload);
  }
  close(); 
  load();
};

const remove = async (id) => { 
  if(!confirm('确认删除?')) return; 
  await deleteProductType(id); 
  load(); 
};

onMounted(()=>{ load(); loadProcesses(); });
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.toolbar input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.toolbar button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.toolbar button.primary {
  background: #3BA372;
  color: #fff;
}
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
table {
  width: 100%;
  border-collapse: collapse;
}
thead {
  background: #f5f5f5;
}
th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 8px;
}
.tag-child {
  background: #e6f7ec;
  color: #3BA372;
}
.tag-notify {
  background: #fff2e8;
  color: #fa8c16;
}
.muted {
  color: #999;
}
.empty {
  text-align: center;
  padding: 60px 0;
  color: #999;
}
dialog {
  border: none;
  border-radius: 8px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  font-size: 18px;
  font-weight: bold;
}
.modal-body {
  padding: 20px;
}
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
.field input[type="text"],
.field input[type="time"],
.field select,
.field textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.field input[type="checkbox"] {
  margin-right: 8px;
}
.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
.process-selector {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.process-available,
.process-selected {
  flex: 1;
  min-width: 200px;
}
.section-title {
  font-size: 12px;
  margin-bottom: 8px;
  color: #666;
  display: flex;
  justify-content: space-between;
}
.reset-link {
  color: #2563eb;
  cursor: pointer;
}
.process-list {
  max-height: 200px;
  overflow: auto;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
}
.process-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
  font-size: 13px;
}
.sortable-list {
  list-style: none;
  margin: 0;
  padding: 0;
  min-height: 200px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.sortable-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid #eee;
  background: #fff;
  cursor: move;
}
.drag-handle {
  opacity: 0.4;
}
.empty-item {
  padding: 10px;
  font-size: 13px;
  color: #999;
  text-align: center;
}
.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button.primary {
  background: #3BA372;
  color: #fff;
}
button.danger {
  background: #dc2626;
  color: #fff;
}
</style>
