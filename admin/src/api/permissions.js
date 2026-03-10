import { api } from './http';

/**
 * 获取权限列表
 */
export async function getPermissions(params = {}) {
  return api.get('/shangyin/permissions', params);
}

/**
 * 创建权限
 */
export async function createPermission(data) {
  return api.post('/shangyin/permissions', data);
}

/**
 * 更新权限
 */
export async function updatePermission(id, data) {
  return api.put(`/shangyin/permissions/${id}`, data);
}

/**
 * 删除权限
 */
export async function deletePermission(id) {
  return api.delete(`/shangyin/permissions/${id}`);
}

/**
 * 获取员工权限
 */
export async function getEmployeePermissions(employeeId) {
  return api.get(`/shangyin/employees/${employeeId}/permissions`);
}

/**
 * 分配权限给员工
 */
export async function assignEmployeePermissions(employeeId, permissionIds) {
  return api.post(`/shangyin/employees/${employeeId}/permissions`, { permissionIds });
}

/**
 * 检查员工权限
 */
export async function checkEmployeePermission(employeeId, code) {
  return api.get(`/shangyin/employees/${employeeId}/permissions/check/${code}`);
}
