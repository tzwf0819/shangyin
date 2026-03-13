<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-icon">单</div>
          </div>
          <h1 class="brand-title">上茚 ERP</h1>
          <p class="brand-subtitle">工厂管理系统</p>
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">快</span>
              <span>高效生产管理</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">锁</span>
              <span>安全可靠</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">表</span>
              <span>数据可视化</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧登录区 -->
      <div class="login-form-section">
        <div class="form-container">
          <div class="form-header">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-subtitle">请登录您的管理员账户</p>
          </div>
          
          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">
                <span>用户名</span>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">人</span>
                <input
                  v-model="form.username"
                  type="text"
                  placeholder="请输入用户名"
                  :disabled="loading"
                  required
                />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                <span>密码</span>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">锁</span>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  :disabled="loading"
                  required
                />
                <button
                  type="button"
                  class="toggle-password"
                  @click="showPassword = !showPassword"
                  :disabled="loading"
                >
                  <span>{{ showPassword ? '隐' : '显' }}</span>
                </button>
              </div>
            </div>
            
            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" v-model="rememberMe" />
                <span>记住我</span>
              </label>
              <a href="#" class="forgot-password">忘记密码?</a>
            </div>
            
            <button type="submit" class="login-btn" :disabled="loading">
              <span v-if="loading" class="btn-spinner"></span>
              <span v-else>登 录</span>
            </button>
          </form>
          
          <div v-if="error" class="error-message">
            <span class="error-icon">[!]</span>
            <span>{{ error }}</span>
          </div>
          
          <div class="form-footer">
            <p>© 2026 上茚科技 · 版权所有</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import http from '../api/http';

const router = useRouter();

const form = reactive({ username: '', password: '' });
const rememberMe = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码';
    return;
  }
  
  error.value = '';
  loading.value = true;
  
  try {
    const res = await http.post('/shangyin/auth/login', form);
    if (res.data?.token) {
      localStorage.setItem('ADMIN_TOKEN', res.data.token);
      if (rememberMe.value) {
        localStorage.setItem('REMEMBER_USER', form.username);
      } else {
        localStorage.removeItem('REMEMBER_USER');
      }
      router.replace('/');
    }
  } catch (err) {
    error.value = err.response?.data?.message || '登录失败，请重试';
  } finally {
    loading.value = false;
  }
};

// 加载记住的用户名
const savedUser = localStorage.getItem('REMEMBER_USER');
if (savedUser) {
  form.username = savedUser;
  rememberMe.value = true;
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  padding: var(--space-5);
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

/* 左侧品牌区 */
.login-brand {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-10);
  background: linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%);
  color: white;
}

.brand-content {
  text-align: center;
}

.brand-logo {
  margin-bottom: var(--space-6);
}

.logo-icon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xl);
  margin: 0 auto;
  backdrop-filter: blur(8px);
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: var(--space-2);
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: var(--text-xl);
  opacity: 0.9;
  margin-bottom: var(--space-8);
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-size: var(--text-base);
  opacity: 0.9;
}

.feature-icon {
  font-size: 20px;
}

/* 右侧登录区 */
.login-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-10);
  background: var(--bg-surface);
}

.form-container {
  width: 100%;
  max-width: 360px;
}

.form-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.form-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: var(--space-3);
  font-size: 18px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-4) 0 calc(var(--space-4) + 28px);
  font-size: var(--text-base);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  outline: none;
  transition: all var(--transition-fast);
}

.input-wrapper input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.2);
}

.input-wrapper input:disabled {
  background: var(--bg-disabled);
  cursor: not-allowed;
}

.toggle-password {
  position: absolute;
  right: var(--space-3);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.toggle-password:hover {
  opacity: 1;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.remember-me input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.forgot-password {
  font-size: var(--text-sm);
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.forgot-password:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.login-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.login-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-error);
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  margin-top: var(--space-4);
}

.error-icon {
  font-size: 16px;
}

.form-footer {
  margin-top: var(--space-8);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .login-page {
    padding: 0;
    background: var(--bg-surface);
  }
  
  .login-container {
    flex-direction: column;
    min-height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }
  
  .login-brand {
    flex: none;
    padding: var(--space-8) var(--space-5);
    min-height: auto;
  }
  
  .brand-logo {
    margin-bottom: var(--space-4);
  }
  
  .logo-icon {
    width: 80px;
    height: 80px;
    font-size: 48px;
  }
  
  .brand-title {
    font-size: 28px;
  }
  
  .brand-features {
    display: none;
  }
  
  .login-form-section {
    flex: 1;
    padding: var(--space-6);
  }
}
</style>
