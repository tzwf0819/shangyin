import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 构建时使用 /shangyin/ 作为基础路径
  base: '/shangyin/',
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
