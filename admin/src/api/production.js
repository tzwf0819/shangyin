import http from './http';
export const listRecords = (params={}) => http.get('/shangyin/production/record', { params });
export const createRecord = (data) => http.post('/shangyin/production/record', data);
export const updateRecord = (id,data) => http.put(`/shangyin/production/record/${id}`, data);
export const deleteRecord = (id) => http.delete(`/shangyin/production/record/${id}`);
