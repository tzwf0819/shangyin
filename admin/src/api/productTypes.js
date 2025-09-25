import http from './http';
export const listProductTypes = (params={}) => http.get('/shangyin/product-types', { params });
export const getProductType = id => http.get(`/shangyin/product-types/${id}`);
export const createProductType = data => http.post('/shangyin/product-types', data);
export const updateProductType = (id,data) => http.put(`/shangyin/product-types/${id}`, data);
export const deleteProductType = id => http.delete(`/shangyin/product-types/${id}`);
