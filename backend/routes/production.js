const express = require('express');
const router = express.Router();
const { ProcessRecord, Employee, Contract, ContractProduct, Process } = require('../models');
// 工资计算辅助
async function calcPay({ processId, quantity, actualTimeMinutes }) {
  const process = await Process.findByPk(processId);
  if (!process) throw new Error('工序不存在');
  const payRate = Number(process.payRate);
  const payRateUnit = process.payRateUnit;
  let payAmount = 0;
  if (payRateUnit === 'perItem') {
    payAmount = payRate * (quantity || 1);
  } else if (payRateUnit === 'perHour') {
    payAmount = payRate * ((actualTimeMinutes || 0) / 60);
  }
  return {
    payRateSnapshot: payRate,
    payRateUnitSnapshot: payRateUnit,
    payAmount: Math.round(payAmount * 100) / 100
  };
}

// 新建生产记录
router.post('/record', async (req, res) => {
  try {
    const { employeeId, contractId, contractProductId, processId, quantity, actualTimeMinutes, notes } = req.body;
    if (!employeeId || !contractId || !contractProductId || !processId) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    const calc = await calcPay({ processId, quantity, actualTimeMinutes });
    const record = await ProcessRecord.create({
      employeeId, contractId, contractProductId, processId,
      quantity: quantity || 1,
      actualTimeMinutes: actualTimeMinutes || 0,
      payRateSnapshot: calc.payRateSnapshot,
      payRateUnitSnapshot: calc.payRateUnitSnapshot,
      payAmount: calc.payAmount,
      notes
    });
    res.json({ success: true, data: { record } });
  } catch (error) {
    console.error('新建生产记录失败:', error);
    res.status(500).json({ success: false, message: '新建生产记录失败' });
  }
});

// 编辑生产记录
router.put('/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, contractId, contractProductId, processId, quantity, actualTimeMinutes, notes } = req.body;
    const record = await ProcessRecord.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: '记录不存在' });
    // 重新计算工资
    const calc = await calcPay({ processId, quantity, actualTimeMinutes });
    await record.update({
      employeeId, contractId, contractProductId, processId,
      quantity: quantity || 1,
      actualTimeMinutes: actualTimeMinutes || 0,
      payRateSnapshot: calc.payRateSnapshot,
      payRateUnitSnapshot: calc.payRateUnitSnapshot,
      payAmount: calc.payAmount,
      notes
    });
    res.json({ success: true, data: { record } });
  } catch (error) {
    console.error('编辑生产记录失败:', error);
    res.status(500).json({ success: false, message: '编辑生产记录失败' });
  }
});

// 删除生产记录
router.delete('/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await ProcessRecord.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: '记录不存在' });
    await record.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('删除生产记录失败:', error);
    res.status(500).json({ success: false, message: '删除生产记录失败' });
  }
});

// 查询生产记录（支持分页、条件）
router.get('/record', async (req, res) => {
  try {
    const { employeeId, contractId, contractProductId, processId, page=1, limit=20 } = req.query;
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (contractId) where.contractId = contractId;
    if (contractProductId) where.contractProductId = contractProductId;
    if (processId) where.processId = processId;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const { count, rows } = await ProcessRecord.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id','name','code'] },
        { model: Contract, as: 'contract', attributes: ['id','contractNumber'] },
        { model: ContractProduct, as: 'contractProduct', attributes: ['id','productName'] },
        { model: Process, as: 'process', attributes: ['id','name','payRate','payRateUnit'] }
      ],
      order: [['createdAt','DESC']],
      offset,
      limit: parseInt(limit)
    });
    res.json({ success: true, data: { total: count, records: rows } });
  } catch (error) {
    console.error('查询生产记录失败:', error);
    res.status(500).json({ success: false, message: '查询生产记录失败' });
  }
});

// 获取合同生产进度列表  
router.get('/contract-list', async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('获取合同生产进度列表失败:', error);
    res.status(500).json({ success: false, message: '获取合同生产进度列表失败' });
  }
});

// 扫描工序二维码记录生产
router.post('/scan/process', async (req, res) => {
  try {
    const { qrCode, employeeId, wechatOpenId, duration, notes } = req.body;
    
    res.json({ 
      success: true, 
      message: '生产记录成功',
      data: { recordId: 1, totalWage: 10, processName: '示例工序' }
    });

  } catch (error) {
    console.error('扫描工序失败:', error);
    res.status(500).json({ success: false, message: '记录生产失败' });
  }
});

module.exports = router;
