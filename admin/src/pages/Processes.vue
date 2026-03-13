<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="搜索名称/编码" @keyup.enter="load" />
      <button class="primary" @click="openCreate">新增工序</button>
    </div>
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead><tr><th>名称</th><th>激光雕刻</th><th>绩效</th><th>单位</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="p in items" :key="p.id">
            <td>{{ p.name }}</td>
            <td><span v-if="p.isLaserEngraving" class="tag tag-laser">是</span><span v-else class="muted">-</span></td>
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
    <div class="empty" v-else>暂无工序</div>

    <dialog ref="dlg">
      <form @submit.prevent="save">
        <div class="modal-header">{{ form.id ? '编辑工序' : '新增工序' }}</div>
        <div class="modal-body">
          <div class="field"><label>名称</label><input v-model="form.name" required /></div>
          <div class="field"><label>绩效单价</label><input type="number" step="0.01" v-model.number="form.payRate" required /></div>
          <div class="field"><label>单位</label>
            <select v-model="form.payRateUnit"><option value="perItem">件</option><option value="perHour">小时</option></select>
          </div>
          <div class="field"><label>描述</label><textarea v-model="form.description" rows="3" /></div>
          <div class="field">
            <label><input type="checkbox" v-model="form.isLaserEngraving" /> 激光雕刻工序</label>
          </div>
          <div v-if="form.isLaserEngraving" class="laser-config">
            <div class="field">
              <label>模式1名称</label>
              <input v-model="form.laserMode1Name" placeholder="例如：模式 A" />
            </div>
            <div class="field">
              <label>模式1绩效单价</label>
              <input type="number" step="0.01" v-model.number="form.laserMode1PayRate" />
            </div>
            <div class="field">
              <label>模式2名称</label>
              <input v-model="form.laserMode2Name" placeholder="例如：模式 B" />
            </div>
            <div class="field">
              <label>模式2绩效单价</label>
              <input type="number" step="0.01" v-model.number="form.laserMode2PayRate" />
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
const form = reactive({ id:null, name:'', payRate:0, payRateUnit:'perItem', description:'', isLaserEngraving:false, laserMode1PayRate:0, laserMode2PayRate:0, laserMode1Name:'模式 A', laserMode2Name:'模式 B' });

const load = async () => {
  const r = await listProcesses(query); if(r.success){ items.value = r.data.processes; }
};
const openCreate = () => { Object.assign(form,{ id:null,name:'',payRate:0,payRateUnit:'perItem',description:'',isLaserEngraving:false,laserMode1PayRate:0,laserMode2PayRate:0,laserMode1Name:'模式 A',laserMode2Name:'模式 B'}); dlg.value.showModal(); };
const edit = (p) => { Object.assign(form,p); dlg.value.showModal(); };
const close = () => dlg.value.close();
const save = async () => {
  const payload = { 
    name:form.name, payRate:form.payRate, payRateUnit:form.payRateUnit, status:'active', description:form.description,
    isLaserEngraving:form.isLaserEngraving, laserMode1PayRate:form.laserMode1PayRate, laserMode2PayRate:form.laserMode2PayRate,
    laserMode1Name:form.laserMode1Name, laserMode2Name:form.laserMode2Name
  };
  if(form.id) await updateProcess(form.id,payload); else await createProcess(payload);
  close(); load();
};
const remove = async (id) => {
  if(!confirm('确认删除?')) return;
  try {
    const result = await deleteProcess(id);
    if (result.success) {
      load(); // 重新加载数据
      alert('工序删除成功');
    } else {
      alert(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除工序失败:', error);
    alert('删除工序失败: ' + (error.response?.data?.message || error.message || '未知错误'));
  }
};

onMounted(load);
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
.empty {
  text-align: center;
  padding: 60px 0;
  color: #999;
}
dialog {
  border: none;
  border-radius: 8px;
  padding: 0;
  max-width: 500px;
  width: 90%;
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
.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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
.tag-laser { 
  background: #e6f7ec; 
  color: #3BA372; 
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.laser-config { 
  background: #f5f5f5; 
  padding: 15px; 
  border-radius: 6px; 
  margin-top: 10px; 
}
.muted {
  color: #999;
}
</style>
