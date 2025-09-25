<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="搜索名称/编码" @keyup.enter="load" />
      <button class="primary" @click="openCreate">新增类型</button>
    </div>
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead>
          <tr><th>名称</th><th>工序数量</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="t in items" :key="t.id">
            <td>{{ t.name }}</td>
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

    <dialog ref="dlg">
      <form @submit.prevent="save">
        <div class="modal-header">{{ form.id ? '编辑产品类型' : '新增产品类型' }}</div>
        <div class="modal-body">
          <div class="field"><label>名称</label><input v-model="form.name" required /></div>
          <div class="field"><label>工序选择 / 排序 (拖动右侧句柄)</label>
            <div style="display:flex; gap:16px; align-items:flex-start;">
              <div style="flex:1; min-width:200px;">
                <div style="font-size:12px; margin-bottom:4px; color:var(--muted);">可选工序</div>
                <div style="max-height:200px; overflow:auto; border:1px solid var(--border); padding:6px; border-radius:6px;">
                  <label v-for="p in processes" :key="p.id" style="display:flex; align-items:center; gap:6px; margin:4px 0; font-size:12px;">
                    <input type="checkbox" :value="p.id" v-model="selectedProcessIds" />
                    <span>{{ p.name }}</span>
                  </label>
                </div>
              </div>
              <div style="flex:1; min-width:200px;">
                <div style="font-size:12px; margin-bottom:4px; color:var(--muted); display:flex; justify-content:space-between;">
                  <span>已选顺序 (拖动排序)</span>
                  <span v-if="orderedSelected.length" style="color:#2563eb;cursor:pointer;" @click="resetOrder">重置</span>
                </div>
                <ul style="list-style:none; margin:0; padding:0; min-height:200px; border:1px solid var(--border); border-radius:6px;">
                  <li v-for="(op,i) in orderedSelected" :key="op.id"
                      draggable="true"
                      @dragstart="dragStart(i)"
                      @dragover.prevent
                      @drop="drop(i)"
                      style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; font-size:12px; border-bottom:1px solid var(--border); background:#fff; cursor:move;">
                    <span>{{ i+1 }}. {{ op.name }}</span>
                    <span style="opacity:.4;">☰</span>
                  </li>
                  <li v-if="!orderedSelected.length" style="padding:10px; font-size:12px; color:var(--muted); text-align:center;">无已选工序</li>
                </ul>
              </div>
            </div>
            <small class="muted">左侧勾选，右侧可拖动排序。保存时顺序写入 sequenceOrder。</small>
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
import { listProductTypes, createProductType, updateProductType, deleteProductType } from '../api/productTypes';
import { listProcesses } from '../api/processes';

const query = reactive({ page:1, limit:50, keyword:'' });
const items = ref([]);
const processes = ref([]);
const dlg = ref();
const form = reactive({ id:null,name:'',processes:[] });
const selectedProcessIds = ref([]);
const orderedSelected = ref([]); // [{id,name}]
let dragIndex = -1;

const load = async () => { const r = await listProductTypes(query); if(r.success){ items.value = r.data.productTypes; } };
const loadProcesses = async () => { const r = await listProcesses({ limit:500 }); if(r.success) processes.value = r.data.processes; };

const openCreate = () => { Object.assign(form,{id:null,name:''}); selectedProcessIds.value = []; orderedSelected.value = []; dlg.value.showModal(); };
const edit = (t) => { Object.assign(form,t); selectedProcessIds.value = (t.processes||[]).map(p=>p.id); orderedSelected.value = (t.processes||[]).map(p=>({ id:p.id, name:p.name })); dlg.value.showModal(); };
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
const resetOrder = () => { orderedSelected.value = [...orderedSelected.value]; };

const save = async () => {
  const procs = orderedSelected.value.map((o,idx)=>({ id:o.id, sequenceOrder: idx+1 }));
  if(form.id) await updateProductType(form.id,{ name:form.name, processes:procs });
  else await createProductType({ name:form.name, processes:procs });
  close(); load();
};
const remove = async (id) => { if(!confirm('确认删除?')) return; await deleteProductType(id); load(); };

onMounted(()=>{ load(); loadProcesses(); });
</script>
