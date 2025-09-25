<template>
  <div class="grid cols-4">
    <div class="card stat" v-for="s in stats" :key="s.key">
      <div class="label">{{ s.label }}</div>
      <div class="value">{{ s.value }}</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import http from '../api/http';

const stats = ref([
  { key:'productTypes', label:'产品类型', value:'-' },
  { key:'processes', label:'工序', value:'-' },
  { key:'employees', label:'员工', value:'-' },
  { key:'contracts', label:'合同', value:'-' }
]);

const load = async () => {
  try { const r = await http.get('/shangyin/api/admin/dashboard/stats');
    stats.value.forEach(s=>{ s.value = r.data?.[s.key] ?? '-'; });
  } catch(e){ console.warn(e); }
};
onMounted(load);
</script>
