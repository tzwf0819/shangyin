// routes/process.js
const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/adminAuth');
const {
  getAllProcesses,
  createProcess,
  updateProcess,
  deleteProcess
} = require('../controllers/processController');

// 所有工序路由都需要管理员权限
router.use(verifyAdmin);

// 获取所有工序
router.get('/', getAllProcesses);

// 创建新工序
router.post('/', createProcess);

// 更新工序
router.put('/:id', updateProcess);

// 删除工序
router.delete('/:id', deleteProcess);

module.exports = router;
