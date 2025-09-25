import http from './http';
export const listEmployees = (params={}) => http.get('/shangyin/employees', { params });
export const createEmployee = data => http.post('/shangyin/employees', data);
export const updateEmployee = (id,data) => http.put(`/shangyin/employees/${id}`, data);
export const deleteEmployee = id => http.delete(`/shangyin/employees/${id}`);
export const assignEmployeeProcesses = (id, processIds) => http.post(`/shangyin/employees/${id}/processes`, { processIds });
