<template>
  <div style="max-width:360px;margin:80px auto;padding:32px;background:#fff;border:1px solid var(--border);border-radius:12px;">
    <h2 style="margin:0 0 20px;font-size:20px;">管理员登录</h2>
    <form @submit.prevent="login">
      <div class="field" style="margin-bottom:14px;">
        <label>用户名</label>
        <input v-model="username" required autocomplete="username" />
      </div>
      <div class="field" style="margin-bottom:18px;">
        <label>密码</label>
        <input type="password" v-model="password" required autocomplete="current-password" />
      </div>
      <button class="primary" style="width:100%;margin-bottom:12px;" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
      <p v-if="error" style="color:#dc2626;font-size:12px;margin:4px 0 0;">{{ error }}</p>
    </form>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import http from '../api/http';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('admin');
const password = ref('');
const loading = ref(false);
const error = ref('');

const login = async () => {
  error.value=''; loading.value=true;
  try {
    const r = await http.post('/shangyin/admin-auth/login',{ username:username.value, password:password.value });
    localStorage.setItem('ADMIN_TOKEN', r.data.token);
    router.replace('/dashboard');
  } catch(e){
    error.value = e.message || '登录失败';
  } finally { loading.value=false; }
};
</script>
