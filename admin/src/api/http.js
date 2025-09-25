import axios from 'axios';

const http = axios.create({
  baseURL: '/', // proxied by vite to backend
  timeout: 12000,
});

// 附加管理员 Token
http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ADMIN_TOKEN');
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

http.interceptors.response.use(
  r => r.data,
  e => {
    if (e.response?.status === 401) {
      localStorage.removeItem('ADMIN_TOKEN');
      if (!location.hash.includes('#/login')) {
        location.hash = '#/login';
      }
    }
    if (e.response?.data) return Promise.reject(e.response.data);
    return Promise.reject({ success:false, message:e.message || '网络错误' });
  }
);

export default http;
