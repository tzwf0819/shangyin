import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 部署在后端的 /shangyin/admin 路径下，需设置 base 以修正静态资源引用（避免默认从根 / 加载导致 404 或 JS 报错）
  base: '/shangyin/admin/',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/shangyin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
