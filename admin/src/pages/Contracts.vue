<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="合同编号/甲方/乙方" @keyup.enter="load" />
      <input v-model="query.salesId" placeholder="销售ID" @keyup.enter="load" />
      <button class="primary" @click="openCreate">新增合同</button>
      <button @click="openImport">批量导入</button>
    </div>
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead><tr><th>编号</th><th>甲方</th><th>乙方</th><th>签订日期</th><th>状态</th><th>成品数</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in items" :key="c.id">
            <td>{{ c.contractNumber }}</td>
            <td>{{ c.partyAName || '-' }}</td>
            <td>{{ c.partyBName || '-' }}</td>
            <td>{{ c.signedDate || '-' }}</td>
            <td>{{ c.status || '-' }}</td>
            <td>{{ (c.products||[]).length }}</td>
            <td>
              <button @click="edit(c)">编辑</button>
              <button class="danger" @click="remove(c.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无合同</div>

    <!-- 创建/编辑 -->
    <dialog ref="dlgEdit">
      <form @submit.prevent="saveEdit">
        <div class="modal-header">{{ form.id ? '编辑合同' : '新增合同' }}</div>
        <div class="modal-body">
          <div class="field"><label>合同编号</label><input v-model="form.contractNumber" required /></div>
          <div class="field"><label>甲方</label><input v-model="form.partyAName" /></div>
          <div class="field"><label>乙方</label><input v-model="form.partyBName" /></div>
          <div class="field"><label>签订日期</label><input v-model="form.signedDate" /></div>
          <div class="field"><label>状态</label><input v-model="form.status" placeholder="例如: 进行中" /></div>
          <div class="field"><label>成品列表</label>
            <div v-for="(p,i) in form.products" :key="i" class="card" style="padding:10px;margin-bottom:8px;">
              <div class="field"><label>产品名称</label><input v-model="p.productName" required /></div>
              <div class="field"><label>数量</label><input v-model="p.quantity" /></div>
              <div class="field"><label>产品类型</label>
                <select v-model="p.productTypeId">
                  <option value="">未选择</option>
                  <option v-for="pt in productTypes" :key="pt.id" :value="pt.id">{{ pt.name }}</option>
                </select>
              </div>
              <button type="button" class="danger" @click="form.products.splice(i,1)">移除</button>
            </div>
            <button type="button" @click="form.products.push({productName:'',quantity:'',productTypeName:''})">+ 添加成品</button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeEdit">取消</button>
          <button class="primary" type="submit">保存</button>
        </div>
      </form>
    </dialog>

    <!-- 导入 -->
    <dialog ref="dlgImport">
      <form @submit.prevent="doImport">
        <div class="modal-header">批量导入合同(JSON)</div>
        <div class="modal-body">
          <textarea v-model="importText" rows="12" style="width:100%;font-family:monospace;font-size:12px;"></textarea>
          <small class="muted">需要格式: {"contracts":[{"合同编号":"HT001","甲方":"甲方A","乙方":"乙方B","products":[{"productName":"X","quantity":"10"}]}]}</small>
        </div>
        <div class="modal-footer">
          <button type="button" @click="dlgImport.value.close()">取消</button>
          <button class="primary" type="submit">导入</button>
        </div>
      </form>
    </dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue';
import { listContracts, createContract, updateContract, deleteContract, importContracts } from '../api/contracts';
import { listProductTypes } from '../api/productTypes';

const query = reactive({ page:1, pageSize:50, keyword:'', salesId:'' });
const items = ref([]);
const productTypes = ref([]);
const dlgEdit = ref();
const dlgImport = ref();
const form = reactive({ id:null, contractNumber:'', partyAName:'', partyBName:'', signedDate:'', status:'', products:[] });
const importText = ref('{\n  "contracts": [\n    {"合同编号":"HT-DEMO-1","甲方":"甲方A","乙方":"乙方B","products":[{"productName":"样品1","quantity":"10"}]}\n  ]\n}');

const load = async () => { const r = await listContracts(query); if(r.success){ items.value = r.data.items; } };
const loadProductTypes = async () => { const r = await listProductTypes({ limit:500 }); if(r.success){ productTypes.value = r.data.productTypes || r.data.items || []; } };

const openCreate = () => { Object.assign(form,{ id:null, contractNumber:'', partyAName:'', partyBName:'', signedDate:'', status:'', products:[] }); dlgEdit.value.showModal(); };
const edit = (c) => { Object.assign(form, JSON.parse(JSON.stringify(c))); dlgEdit.value.showModal(); };
const closeEdit = () => { try { dlgEdit.value && dlgEdit.value.close(); } catch(e) {} };
const saveEdit = async () => {
  const payload = { ...form };
  if(!payload.products.length) payload.products=[{ productName:'默认产品', quantity:'1' }];
  // 规范化产品，确保 productTypeId 为数字（或去掉空值字段）
  payload.products = payload.products.map(p => {
    const ptid = p.productTypeId !== '' && p.productTypeId !== undefined && p.productTypeId !== null ? Number(p.productTypeId) : undefined;
    const np = { ...p };
    if (ptid) np.productTypeId = ptid; else delete np.productTypeId;
    return np;
  });
  if(form.id) await updateContract(form.id,payload); else await createContract(payload);
  closeEdit(); load();
};
const remove = async (id) => { if(!confirm('确认删除?')) return; await deleteContract(id); load(); };

const openImport = () => { dlgImport.value.showModal(); };
const doImport = async () => { try { const json = JSON.parse(importText.value); const r = await importContracts(json.contracts || []); alert('导入完成: 成功 '+r.data.successCount+' 条, 失败 '+r.data.failureCount+' 条'); dlgImport.value.close(); load(); } catch(e){ alert('格式错误或导入失败'); } };

onMounted(async ()=>{ await Promise.all([loadProductTypes(), load()]); });
</script>
