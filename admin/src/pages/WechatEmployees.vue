<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="姓名/编码" @keyup.enter="load" />
      <button class="primary" @click="load">查询</button>
    </div>
    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead><tr><th>ID</th><th>姓名</th><th>编码</th><th>UnionId</th><th>OpenId</th><th>状态</th><th>创建时间</th></tr></thead>
        <tbody>
          <tr v-for="e in items" :key="e.id">
            <td>{{ e.id }}</td>
            <td>{{ e.name }}</td>
            <td>{{ e.code }}</td>
            <td class="mono">{{ e.wxUnionId }}</td>
            <td class="mono">{{ e.wxOpenId || '-' }}</td>
            <td>{{ e.status }}</td>
            <td>{{ format(e.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无绑定微信的员工</div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue';
import { listWechatEmployees } from '../api/wechat';
const query = reactive({ page:1, limit:50, keyword:'' });
const items = ref([]);
const load = async ()=>{ const r = await listWechatEmployees(query); if(r.success){ items.value = r.data.employees; } };
const format = (s)=> new Date(s).toLocaleString();
onMounted(load);
</script>
<style scoped>
.toolbar{ display:flex; gap:8px; margin-bottom:12px; }
.mono{ font-family:monospace; font-size:12px; max-width:160px; overflow:hidden; text-overflow:ellipsis; }
.table-wrapper{ background:#fff; border:1px solid #e5e7eb; border-radius:8px; overflow:auto; }
 table{ width:100%; border-collapse:collapse; }
 th,td{ padding:8px 10px; border-bottom:1px solid #f0f0f0; font-size:13px; }
.empty{ color:#64748b; font-size:13px; }
.primary{ background:#2563eb; color:#fff; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; }
</style>
