const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const sequelize = require('../models').sequelize;

// 获取员工绩效概览
router.get('/employee/:employeeId/overview', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    res.json({
      success: true,
      data: {
        employee: { id: employeeId, name: '示例员工' },
        currentMonth: { records: 0, wage: 0 },
        lastMonth: { records: 0, wage: 0 }
      }
    });
  } catch (error) {
    console.error('获取员工绩效概览失败:', error);
    res.status(500).json({ success: false, message: '获取员工绩效概览失败' });
  }
});

// 创建计时工序
router.post('/timing-process', async (req, res) => {
  try {
    const { employeeId, processId, contractId, productId } = req.body;
    
    res.json({
      success: true,
      message: '开始计时工序',
      data: { timingId: 1 }
    });
  } catch (error) {
    console.error('创建计时工序失败:', error);
    res.status(500).json({ success: false, message: '创建计时工序失败' });
  }
});

module.exports = router;
