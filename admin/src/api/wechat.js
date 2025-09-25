import http from './http';
export const listWechatEmployees = (params={}) => http.get('/shangyin/wechat/employees', { params });
