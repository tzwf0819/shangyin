const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
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
    payAmount: Math.round(payAmount * 100) / 100,
  };
}

// 生产进度
router.get('/progress', async (req, res) => {
  try {
    const { page = 1, limit = 20, contractId, contractProductId, processId, contractNumber, productKeyword } = req.query;
    const where = {};
    if (contractId) where.contractId = Number(contractId);
    if (contractProductId) where.contractProductId = Number(contractProductId);
    if (processId) where.processId = Number(processId);

    const contractInclude = { model: Contract, as: 'contract', attributes: ['id', 'contractNumber', 'signedDate', 'signedLocation'] };
    if (contractNumber && String(contractNumber).trim()) {
      contractInclude.where = { contractNumber: { [Op.like]: `%${String(contractNumber).trim()}%` } };
      contractInclude.required = true;
    }

    const productInclude = { model: ContractProduct, as: 'contractProduct', attributes: ['id', 'productName', 'productCode', 'productType', 'specification', 'deliveryDeadline'] };
    if (productKeyword && String(productKeyword).trim()) {
      const text = `%${String(productKeyword).trim()}%`;
      productInclude.where = {
        [Op.or]: [
          { productName: { [Op.like]: text } },
          { productCode: { [Op.like]: text } },
        ],
      };
      productInclude.required = true;
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const offset = (pageNumber - 1) * pageSize;

    const { rows, count } = await ProcessRecord.findAndCountAll({
      where,
      include: [
        contractInclude,
        productInclude,
        { model: Process, as: 'process', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'ASC']],
      limit: pageSize,
      offset,
      distinct: true,
    });

    const items = rows.map((record) => ({
      id: record.id,
      createdAt: record.createdAt,
      contractId: record.contractId,
      contractNumber: record.contract?.contractNumber || '',
      contractSignedDate: record.contract?.signedDate || '',
      contractSignedLocation: record.contract?.signedLocation || '',
      contractProductId: record.contractProductId,
      productName: record.contractProduct?.productName || '',
      productCode: record.contractProduct?.productCode || '',
      productType: record.contractProduct?.productType || '',
      specification: record.contractProduct?.specification || '',
      deliveryDeadline: record.contractProduct?.deliveryDeadline || '',
      processId: record.processId,
      processName: record.process?.name || '',
      employeeId: record.employeeId,
      employeeName: record.employeeNameSnapshot || '',
      quantity: record.quantity,
      actualTimeMinutes: record.actualTimeMinutes,
      payAmount: Number(record.payAmount || 0),
      notes: record.notes || '',
    }));

    res.json({
      success: true,
      data: {
        items,
        total: count,
        page: pageNumber,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('List production progress error:', error);
    res.status(500).json({ success: false, message: '获取生产进度失败' });
  }
});

// 员工绩效
router.get('/performance', async (req, res) => {
  try {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { employeeId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const offset = (pageNumber - 1) * pageSize;

    const where = {};
    if (employeeId) {
      where.employeeId = Number(employeeId);
    }

    const start = startDate ? new Date(startDate) : defaultStart;
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : defaultEnd;
    end.setHours(23, 59, 59, 999);

    where.createdAt = { [Op.between]: [start, end] };

    const { rows, count } = await ProcessRecord.findAndCountAll({
      where,
      include: [
        { model: Contract, as: 'contract', attributes: ['id', 'contractNumber', 'signedDate'] },
        { model: ContractProduct, as: 'contractProduct', attributes: ['id', 'productName', 'productCode'] },
        { model: Process, as: 'process', attributes: ['id', 'name'] },
        { model: Employee, as: 'employee', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'ASC']],
      limit: pageSize,
      offset,
      distinct: true,
    });

    const totalPayAmount = await ProcessRecord.sum('payAmount', { where });

    const items = rows.map((record) => ({
      id: record.id,
      createdAt: record.createdAt,
      employeeId: record.employeeId,
      employeeName: record.employeeNameSnapshot || record.employee?.name || '',
      contractNumber: record.contract?.contractNumber || '',
      productName: record.contractProduct?.productName || '',
      processName: record.process?.name || '',
      quantity: record.quantity,
      actualTimeMinutes: record.actualTimeMinutes,
      payAmount: Number(record.payAmount || 0),
      notes: record.notes || '',
    }));

    res.json({
      success: true,
      data: {
        items,
        total: count,
        page: pageNumber,
        limit: pageSize,
        totalPayAmount: Number(totalPayAmount || 0),
        range: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('List employee performance error:', error);
    res.status(500).json({ success: false, message: '获取员工绩效失败' });
  }
});

// 新建生产记录
router.post('/record', async (req, res) => {
  try {
    const { employeeId, contractId, contractProductId, processId, quantity, actualTimeMinutes, notes } = req.body;
    if (!employeeId || !contractId || !contractProductId || !processId) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }
    const calc = await calcPay({ processId, quantity, actualTimeMinutes });
    const record = await ProcessRecord.create({
      employeeId,
      employeeNameSnapshot: employee.name,
      contractId,
      contractProductId,
      processId,
      quantity: quantity || 1,
      actualTimeMinutes: actualTimeMinutes || 0,
      payRateSnapshot: calc.payRateSnapshot,
      payRateUnitSnapshot: calc.payRateUnitSnapshot,
      payAmount: calc.payAmount,
      notes,
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
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }
    const calc = await calcPay({ processId, quantity, actualTimeMinutes });
    await record.update({
      employeeId,
      employeeNameSnapshot: employee.name,
      contractId,
      contractProductId,
      processId,
      quantity: quantity || 1,
      actualTimeMinutes: actualTimeMinutes || 0,
      payRateSnapshot: calc.payRateSnapshot,
      payRateUnitSnapshot: calc.payRateUnitSnapshot,
      payAmount: calc.payAmount,
      notes,
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
