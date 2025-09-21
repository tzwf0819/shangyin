// routes/process.js
const express = require('express');
const router = express.Router();
const {
  getAllProcesses,
  createProcess,
  updateProcess,
  deleteProcess
} = require('../controllers/processController');

// 获取所有工序
router.get('/', getAllProcesses);

// 创建新工序
router.post('/', createProcess);

// 更新工序
router.put('/:id', updateProcess);

// 删除工序
router.delete('/:id', deleteProcess);

module.exports = router;
