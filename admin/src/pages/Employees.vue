<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="姓名/编码" @keyup.enter="load" />
      <select v-model="query.status" @change="load"><option value="">全部</option><option value="active">在职</option><option value="inactive">离职</option></select>
      <button class="primary" @click="openCreate">新增员工</button>
    </div>
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead><tr><th>ID</th><th>姓名</th><th>编码</th><th>状态</th><th>微信</th><th>工序</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="e in items" :key="e.id">
            <td>{{ e.id }}</td>
            <td>{{ e.name }}</td>
            <td>{{ e.code || '-' }}</td>
            <td>{{ e.status }}</td>
            <td><span v-if="e.wxOpenId" class="tag">绑定</span><span v-else class="muted">-</span></td>
            <td>
              <span v-if="!(e.processes||[]).length" class="muted">无</span>
              <span v-for="p in e.processes" :key="p.id" class="tag">{{ p.name }}</span>
            </td>
            <td>
              <button @click="edit(e)">编辑</button>
              <button class="danger" @click="remove(e.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无员工</div>

    <dialog ref="dlg">
      <form @submit.prevent="save">
        <div class="modal-header">{{ form.id ? '编辑员工' : '新增员工' }}</div>
        <div class="modal-body">
          <div class="field"><label>姓名</label><input v-model="form.name" required /></div>
          <div class="field"><label>状态</label><select v-model="form.status"><option value="active">active</option><option value="inactive">inactive</option></select></div>
          <div class="field"><label>工序授权</label>
            <div>
              <label v-for="p in processes" :key="p.id" style="display:inline-block;margin:2px 8px 4px 0;">
                <input type="checkbox" :value="p.id" v-model="selectedProcessIds" /> {{ p.name }}
              </label>
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
import { listEmployees, createEmployee, updateEmployee, deleteEmployee, assignEmployeeProcesses } from '../api/employees';
import { listProcesses } from '../api/processes';

const query = reactive({ page:1, limit:100, keyword:'', status:'' });
const items = ref([]);
const processes = ref([]);
const dlg = ref();
const form = reactive({ id:null, name:'', status:'active' });
const selectedProcessIds = ref([]);

const load = async () => { const r = await listEmployees(query); if(r.success){ items.value = r.data.employees; } };
const loadProcesses = async () => { const r = await listProcesses({ limit:500 }); if(r.success) processes.value = r.data.processes; };

const openCreate = () => { Object.assign(form,{ id:null, name:'', status:'active'}); selectedProcessIds.value=[]; dlg.value.showModal(); };
const edit = (e) => { Object.assign(form,e); selectedProcessIds.value=(e.processes||[]).map(p=>p.id); dlg.value.showModal(); };
const close = () => dlg.value.close();
const save = async () => {
  if(form.id){ await updateEmployee(form.id,{ name:form.name, status:form.status }); await assignEmployeeProcesses(form.id, selectedProcessIds.value); }
  else { const r = await createEmployee({ name:form.name, status:form.status, processes:selectedProcessIds.value.map(id=>({id})) }); if(r.data?.employee){ form.id = r.data.employee.id; } }
  close(); load();
};
const remove = async (id) => { if(!confirm('确认删除?')) return; await deleteEmployee(id); load(); };

onMounted(()=>{ load(); loadProcesses(); });
</script>
