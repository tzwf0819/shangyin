// routes/employee.js
const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/adminAuth');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignProcesses
} = require('../controllers/employeeController');

// 所有员工路由都需要管理员权限
router.use(verifyAdmin);

// 获取所有员工
router.get('/', getAllEmployees);

// 获取单个员工
router.get('/:id', getEmployeeById);

// 创建员工
router.post('/', createEmployee);

// 更新员工
router.put('/:id', updateEmployee);

// 删除员工
router.delete('/:id', deleteEmployee);

// 分配工序给员工
router.post('/:id/processes', assignProcesses);

module.exports = router;
