import http from './http';
export const listProcesses = (params={}) => http.get('/shangyin/processes', { params });
export const createProcess = data => http.post('/shangyin/processes', data);
export const updateProcess = (id, data) => http.put(`/shangyin/processes/${id}`, data);
export const deleteProcess = id => http.delete(`/shangyin/processes/${id}`);
