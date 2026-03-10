<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="姓名/编码" @keyup.enter="load" />
      <select v-model="query.status" @change="load">
        <option value="">全部</option>
        <option value="active">在职</option>
        <option value="inactive">离职</option>
      </select>
      <select v-model="query.employeeType" @change="load">
        <option value="">全部类型</option>
        <option value="worker">工人</option>
        <option value="salesman">业务员</option>
      </select>
      <button class="primary" @click="openCreate">新增员工</button>
    </div>
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>编码</th>
            <th>类型</th>
            <th>工作时间</th>
            <th>状态</th>
            <th>微信</th>
            <th>工序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in items" :key="e.id">
            <td>{{ e.id }}</td>
            <td>{{ e.name }}</td>
            <td>{{ e.code || '-' }}</td>
            <td>
              <span class="tag" :class="e.employeeType === 'salesman' ? 'tag-blue' : ''">
                {{ e.employeeType === 'salesman' ? '业务员' : '工人' }}
              </span>
            </td>
            <td>{{ e.workStartTime }}-{{ e.workEndTime }}</td>
            <td>{{ e.status }}</td>
            <td>
              <span v-if="e.wxOpenId" class="tag">绑定</span>
              <span v-else class="muted">-</span>
            </td>
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
          <div class="field">
            <label>姓名 *</label>
            <input v-model="form.name" required />
          </div>
          <div class="field">
            <label>员工类型 *</label>
            <select v-model="form.employeeType">
              <option value="worker">工人</option>
              <option value="salesman">业务员</option>
            </select>
          </div>
          <div class="field">
            <label>状态 *</label>
            <select v-model="form.status">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <div class="field" v-if="form.employeeType === 'worker'">
            <label>上班时间</label>
            <input type="time" v-model="form.workStartTime" />
          </div>
          <div class="field" v-if="form.employeeType === 'worker'">
            <label>下班时间</label>
            <input type="time" v-model="form.workEndTime" />
          </div>
          <div class="field">
            <label>可以查看所有合同</label>
            <input type="checkbox" v-model="form.canViewAllContracts" />
            <span style="font-size:12px;color:#666;margin-left:8px;">
              {{ form.canViewAllContracts ? '是（业务员权限）' : '否' }}
            </span>
          </div>
          <div class="field">
            <label>工序授权</label>
            <div>
              <label v-for="p in processes" :key="p.id" style="display:inline-block;margin:2px 8px 4px 0;">
                <input type="checkbox" :value="p.id" v-model="selectedProcessIds" /> {{ p.name }}
              </label>
            </div>
          </div>
          <div class="field" v-if="form.id">
            <label>权限分配</label>
            <div>
              <label v-for="perm in allPermissions" :key="perm.id" style="display:inline-block;margin:2px 8px 4px 0;">
                <input type="checkbox" :value="perm.id" v-model="selectedPermissionIds" /> 
                {{ perm.name }} ({{ perm.code }})
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
import { getPermissions, assignEmployeePermissions, getEmployeePermissions } from '../api/permissions';

const query = reactive({ page:1, limit:100, keyword:'', status:'', employeeType:'' });
const items = ref([]);
const processes = ref([]);
const allPermissions = ref([]);
const dlg = ref();
const form = reactive({ 
  id:null, 
  name:'', 
  status:'active',
  employeeType: 'worker',
  workStartTime: '08:00',
  workEndTime: '18:00',
  canViewAllContracts: false
});
const selectedProcessIds = ref([]);
const selectedPermissionIds = ref([]);

const load = async () => { 
  const r = await listEmployees(query); 
  if(r.success){ 
    items.value = r.data.employees || []; 
  } 
};

const loadProcesses = async () => { 
  const r = await listProcesses({ limit:500 }); 
  if(r.success) processes.value = r.data.processes || []; 
};

const loadPermissions = async () => {
  const r = await getPermissions();
  if(r.success) allPermissions.value = r.data || [];
};

const loadEmployeePermissions = async (employeeId) => {
  const r = await getEmployeePermissions(employeeId);
  if(r.success) {
    selectedPermissionIds.value = (r.data || []).map(p => p.id);
  }
};

const openCreate = () => { 
  Object.assign(form, { 
    id:null, 
    name:'', 
    status:'active',
    employeeType: 'worker',
    workStartTime: '08:00',
    workEndTime: '18:00',
    canViewAllContracts: false
  }); 
  selectedProcessIds.value = [];
  selectedPermissionIds.value = [];
  dlg.value.showModal(); 
};

const edit = (e) => { 
  Object.assign(form, {
    ...e,
    workStartTime: (e.workStartTime || '08:00').substring(0, 5),
    workEndTime: (e.workEndTime || '18:00').substring(0, 5)
  }); 
  selectedProcessIds.value = (e.processes||[]).map(p=>p.id);
  if (e.id) {
    loadEmployeePermissions(e.id);
  }
  dlg.value.showModal(); 
};

const close = () => dlg.value.close();

const save = async () => {
  try {
    const payload = { 
      name: form.name, 
      status: form.status,
      employeeType: form.employeeType,
      workStartTime: form.workStartTime,
      workEndTime: form.workEndTime,
      canViewAllContracts: form.canViewAllContracts
    };
    const processIds = [...selectedProcessIds.value];
    
    if (form.id) {
      await updateEmployee(form.id, payload);
      await assignEmployeeProcesses(form.id, processIds);
      // 分配权限
      await assignEmployeePermissions(form.id, selectedPermissionIds.value);
    } else {
      payload.processIds = processIds;
      const response = await createEmployee(payload);
      if (response?.data?.employee) {
        form.id = response.data.employee.id;
        // 创建后分配权限
        if (selectedPermissionIds.value.length > 0) {
          await assignEmployeePermissions(form.id, selectedPermissionIds.value);
        }
      }
    }
    close();
    await load();
  } catch (error) {
    const message = error && error.response && error.response.data && error.response.data.message 
      ? error.response.data.message 
      : '保存失败';
    alert(message);
  }
};

const remove = async (id) => {
  if(!confirm('确认删除该员工？删除后将无法恢复。')) return;
  try {
    await deleteEmployee(id);
    await load();
  } catch (error) {
    const message = error && error.response && error.response.data && error.response.data.message 
      ? error.response.data.message 
      : '删除失败';
    alert(message);
  }
};

onMounted(() => { 
  load(); 
  loadProcesses();
  loadPermissions();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.toolbar input,
.toolbar select {
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
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
  margin: 2px;
}

.tag-blue {
  background: #e6f7ec;
  color: #3BA372;
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
.field select {
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
</style>
