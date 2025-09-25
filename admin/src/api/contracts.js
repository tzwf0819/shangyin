import http from './http';
export const listContracts = (params={}) => http.get('/shangyin/contracts', { params });
export const getContract = id => http.get(`/shangyin/contracts/${id}`);
export const createContract = data => http.post('/shangyin/contracts', data);
export const updateContract = (id,data) => http.put(`/shangyin/contracts/${id}`, data);
export const deleteContract = id => http.delete(`/shangyin/contracts/${id}`);
export const importContracts = contracts => http.post('/shangyin/contracts/import', { contracts });
