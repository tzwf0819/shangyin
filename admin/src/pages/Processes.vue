<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="搜索名称/编码" @keyup.enter="load" />
      <button class="primary" @click="openCreate">新增工序</button>
    </div>
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead><tr><th>名称</th><th>绩效</th><th>单位</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="p in items" :key="p.id">
            <td>{{ p.name }}</td>
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
const form = reactive({ id:null, name:'', payRate:0, payRateUnit:'perItem', description:'' });

const load = async () => {
  const r = await listProcesses(query); if(r.success){ items.value = r.data.processes; }
};
const openCreate = () => { Object.assign(form,{ id:null,name:'',payRate:0,payRateUnit:'perItem',description:''}); dlg.value.showModal(); };
const edit = (p) => { Object.assign(form,p); dlg.value.showModal(); };
const close = () => dlg.value.close();
const save = async () => {
  const payload = { name:form.name, payRate:form.payRate, payRateUnit:form.payRateUnit, status:'active', description:form.description };
  if(form.id) await updateProcess(form.id,payload); else await createProcess(payload);
  close(); load();
};
const remove = async (id) => { if(!confirm('确认删除?')) return; await deleteProcess(id); load(); };

onMounted(load);
</script>
