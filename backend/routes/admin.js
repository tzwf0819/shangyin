// routes/admin.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllEmployeesAdmin,
  updateEmployeeAdmin,
  deleteEmployeeAdmin,
  clearWechatBinding,
  batchClearWechatBinding,
  batchDeleteEmployees
} = require('../controllers/adminController');

// 管理员面板统计数据
router.get('/dashboard/stats', getDashboardStats);

// 员工管理
router.get('/employees', getAllEmployeesAdmin);
router.put('/employees/:id', updateEmployeeAdmin);

// 删除单个员工（含微信关联清除）
router.delete('/employees/:id', deleteEmployeeAdmin);

// 清除单个员工微信关联
router.delete('/employees/:id/wechat', clearWechatBinding);

// 批量清除员工微信关联
router.post('/employees/batch/clear-wechat', batchClearWechatBinding);

// 批量删除员工
router.post('/employees/batch/delete', batchDeleteEmployees);

module.exports = router;
