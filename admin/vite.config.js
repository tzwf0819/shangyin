import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 部署在根路径，nginx 会处理 /shangyin/ 前缀
  base: './',
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
