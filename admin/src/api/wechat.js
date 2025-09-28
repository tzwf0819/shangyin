import http from './http';
export const listWechatEmployees = (params={}) => http.get('/shangyin/wechat/employees', { params });
export const deleteWechatEmployee = (id) => http.delete(`/shangyin/wechat/employees/${id}`);
