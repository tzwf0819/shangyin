/**
 * 权限管理路由
 */

const express = require('express');
const router = express.Router();
const {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getEmployeePermissions,
  assignPermissions,
  checkPermission
} = require('../controllers/permissionController');

// 获取权限列表
router.get('/', getPermissions);

// 创建权限
router.post('/', createPermission);

// 更新权限
router.put('/:id', updatePermission);

// 删除权限
router.delete('/:id', deletePermission);

// 获取员工权限
router.get('/employees/:id/permissions', getEmployeePermissions);

// 分配权限给员工
router.post('/employees/:id/permissions', assignPermissions);

// 检查员工权限
router.get('/employees/:id/permissions/check/:code', checkPermission);

module.exports = router;
