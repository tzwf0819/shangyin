<template>
  <div>
    <div class="toolbar">
  <select v-model="query.contractId"><option value="">合同(全部)</option><option v-for="c in contracts" :key="c.id" :value="c.id">{{ c.contractNumber || ('合同#'+c.id) }}</option></select>
  <select v-model="query.contractProductId"><option value="">产品(全部)</option><option v-for="p in contractProducts" :key="p.id" :value="p.id">{{ p.productName }}</option></select>
  <select v-model="query.processId"><option value="">工序(全部)</option><option v-for="p in processes" :key="p.id" :value="p.id">{{ p.name }}</option></select>
  <select v-model="query.employeeId"><option value="">员工(全部)</option><option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option></select>
      <button class="primary" @click="load">查询</button>
      <button @click="openCreate">新建记录</button>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>时间</th><th>合同</th><th>产品</th><th>工序</th><th>员工</th><th>数量</th><th>用时(分)</th><th>金额</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in items" :key="r.id">
            <td>{{ formatTime(r.createdAt) }}</td>
            <td>{{ r.contract?.contractNumber }}</td>
            <td>{{ r.contractProduct?.productName }}</td>
            <td>{{ r.process?.name }}</td>
            <td>{{ r.employee?.name }}</td>
            <td>{{ r.quantity }}</td>
            <td>{{ r.actualTimeMinutes }}</td>
            <td>￥{{ Number(r.payAmount||0).toFixed(2) }}</td>
            <td>
              <button @click="edit(r)">编辑</button>
              <button class="danger" @click="remove(r.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog ref="dlg">
      <form @submit.prevent="save">
        <div class="modal-header">{{ form.id ? '编辑生产记录' : '新建生产记录' }}</div>
        <div class="modal-body">
          <div class="grid2">
            <div class="field"><label>合同</label>
              <select v-model.number="form.contractId" @change="onContractChange" required>
                <option value="" disabled>请选择合同</option>
                <option v-for="c in contracts" :key="c.id" :value="c.id">{{ c.contractNumber || ('合同#'+c.id) }}</option>
              </select>
              <small v-if="!contracts.length" class="muted">暂无合同数据，请先到“合同管理”创建。</small>
            </div>
            <div class="field"><label>产品</label>
              <select v-model.number="form.contractProductId" required>
                <option value="" disabled>请选择产品</option>
                <option v-for="p in contractProducts" :key="p.id" :value="p.id">{{ p.productName }}</option>
              </select>
            </div>
            <div class="field"><label>工序</label>
              <select v-model.number="form.processId" required>
                <option value="" disabled>请选择工序</option>
                <option v-for="p in formProcesses" :key="p.id" :value="p.id">{{ p.name }} ({{ p.payRateUnit==='perItem' ? ('计件￥'+p.payRate) : ('计时￥'+p.payRate+'/h') }})</option>
              </select>
              <small v-if="!processes.length" class="muted">暂无工序数据，请先到“工序管理”创建。</small>
            </div>
            <div class="field"><label>员工</label>
              <select v-model.number="form.employeeId" required>
                <option value="" disabled>请选择员工</option>
                <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
              </select>
            </div>
            <div class="field"><label>数量</label><input type="number" min="1" v-model.number="form.quantity" required /></div>
            <div class="field"><label>用时(分钟)</label><input type="number" min="0" v-model.number="form.actualTimeMinutes" required /></div>
            <div class="field" style="grid-column:1/3"><label>备注</label><textarea v-model="form.notes" rows="3"></textarea></div>
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
import { ref, reactive, onMounted, watch } from 'vue';
import { listRecords, createRecord, updateRecord, deleteRecord } from '../api/production';
import http from '../api/http';

const items = ref([]);
const query = reactive({ employeeId:'', contractId:'', contractProductId:'', processId:'', page:1, limit:20 });
const contracts = ref([]);
const contractProducts = ref([]);
const processes = ref([]); // 全量工序（用于筛选）
const formProcesses = ref([]); // 表单内工序（按产品类型顺序）
const employees = ref([]);
const dlg = ref();
const form = reactive({ id:null, employeeId:'', contractId:'', contractProductId:'', processId:'', quantity:1, actualTimeMinutes:0, notes:'' });

const load = async ()=>{
  const r = await listRecords({ ...query });
  if(r.success){ items.value = r.data.records; }
};
const loadContracts = async ()=>{ 
  const r = await http.get('/shangyin/contracts',{ params:{ pageSize:100 }});
  if(r.success) contracts.value = r.data.items || r.data.contracts || [];
};
const loadProductsByContract = async (cid)=>{ if(!cid){contractProducts.value=[];return;} const r = await http.get('/shangyin/contracts/'+cid); if(r.success) contractProducts.value = r.data.contract.products||[]; };
const loadProcesses = async ()=>{ const r = await http.get('/shangyin/processes',{ params:{ limit:500 }}); if(r.success) processes.value = r.data.processes || r.data.items || []; };
const loadEmployees = async ()=>{ const r = await http.get('/shangyin/employees',{ params:{ limit:500 }}); if(r.success) employees.value = r.data.employees || r.data.items || []; };

const openCreate = ()=>{ 
  Object.assign(form,{
    id:null,
    employeeId: query.employeeId || '',
    contractId: query.contractId || '',
    contractProductId: query.contractProductId || '',
    processId: query.processId || '',
    quantity:1,
    actualTimeMinutes:0,
    notes:''
  });
  onContractChange().then(onProductChange);
  dlg.value.showModal(); 
};
const edit = async (r)=>{ 
  Object.assign(form,{ id:r.id, employeeId:r.employeeId, contractId:r.contractId, contractProductId:r.contractProductId, processId:r.processId, quantity:r.quantity, actualTimeMinutes:r.actualTimeMinutes, notes:r.notes||'' }); 
  await onContractChange(); 
  await onProductChange();
  dlg.value.showModal(); 
};
const close = ()=> dlg.value.close();
const save = async ()=>{
  const payload = { employeeId:+form.employeeId, contractId:+form.contractId, contractProductId:+form.contractProductId, processId:+form.processId, quantity:+form.quantity, actualTimeMinutes:+form.actualTimeMinutes, notes:form.notes };
  if(form.id) await updateRecord(form.id, payload); else await createRecord(payload);
  close(); load();
};
const remove = async (id)=>{ if(!confirm('确认删除?')) return; await deleteRecord(id); load(); };
const onContractChange = async ()=>{ await loadProductsByContract(form.contractId || query.contractId); };
const onProductChange = async ()=>{
  const pid = form.contractProductId;
  if(!pid){ formProcesses.value = processes.value; return; }
  const prod = (contractProducts.value||[]).find(p=> p.id === pid);
  const ptId = prod && (Number(prod.productTypeId) || Number(prod.productType?.id));
  if(ptId){
    const r = await http.get(`/shangyin/product-types/${ptId}/processes`);
    if(r.success){ formProcesses.value = r.data.processes || []; return; }
  }
  // 回退：使用全量工序
  formProcesses.value = processes.value;
};

const formatTime = (s)=> new Date(s).toLocaleString();

onMounted(async ()=>{ await Promise.all([loadContracts(), loadProcesses(), loadEmployees()]); formProcesses.value = processes.value; load(); });
watch(()=>form.contractProductId, ()=>{ onProductChange(); });
watch(()=>query.contractId, (v)=>{ loadProductsByContract(v); });
</script>

<style scoped>
.toolbar{ display:flex; gap:8px; align-items:center; margin-bottom:12px; }
select, input, textarea { padding:6px 8px; border:1px solid var(--border,#e5e7eb); border-radius:6px; font-size:13px; }
.muted{ color:#6b7280; font-size:12px; display:block; margin-top:6px; }
.table-wrapper{ background:#fff; border:1px solid #e5e7eb; border-radius:8px; overflow:auto; }
table{ width:100%; border-collapse:collapse; }
th,td{ padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:left; font-size:13px; }
.grid2{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
.modal-header{ font-weight:600; margin-bottom:8px; }
.modal-footer{ display:flex; justify-content:flex-end; gap:8px; margin-top:10px; }
.primary{ background:#2563eb; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; }
.danger{ background:#ef4444; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; }
</style>