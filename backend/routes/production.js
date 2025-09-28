const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { ProcessRecord, Employee, Contract, ContractProduct, Process, sequelize } = require('../models');
// ���ʼ��㸨��
async function calcPay({ processId, quantity, actualTimeMinutes }) {
  const process = await Process.findByPk(processId);
  if (!process) throw new Error('���򲻴���');
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

// ��������
router.get('/progress', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      contractNumber,
      productKeyword,
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const offset = (pageNumber - 1) * pageSize;

    const whereClause = {};
    if (productKeyword && String(productKeyword).trim()) {
      const keyword = '%' + String(productKeyword).trim() + '%';
      whereClause[Op.or] = [
        { productName: { [Op.like]: keyword } },
        { productCode: { [Op.like]: keyword } },
      ];
    }

    const contractInclude = {
      model: Contract,
      as: 'contract',
      attributes: ['id', 'contractNumber', 'signedDate', 'createdAt', 'partyAName', 'partyBName'],
    };
    if (contractNumber && String(contractNumber).trim()) {
      contractInclude.where = {
        contractNumber: { [Op.like]: '%' + String(contractNumber).trim() + '%' },
      };
      contractInclude.required = true;
    }

    const { rows, count } = await ContractProduct.findAndCountAll({
      where: whereClause,
      include: [contractInclude],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    });

    const productIds = rows.map(product => product.id);
    const statsMap = new Map();

    if (productIds.length) {
      const aggregates = await ProcessRecord.findAll({
        where: { contractProductId: productIds },
        attributes: [
          'contractProductId',
          [sequelize.fn('COUNT', sequelize.col('ProcessRecord.id')), 'recordCount'],
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('MAX', sequelize.col('createdAt')), 'latestRecordAt'],
        ],
        group: ['contractProductId'],
        raw: true,
      });

      aggregates.forEach(item => {
        const key = Number(item.contractProductId ?? item['ProcessRecord.contractProductId']);
        if (!Number.isNaN(key)) {
          statsMap.set(key, {
            recordCount: Number(item.recordCount || 0),
            totalQuantity: Number(item.totalQuantity || 0),
            latestRecordAt: item.latestRecordAt || null,
          });
        }
      });
    }

    const toIsoString = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };

    const items = rows.map(product => {
      const stats = statsMap.get(product.id) || {};
      const signedAt = toIsoString(product.contract?.signedDate);
      const contractCreatedAt = toIsoString(product.contract?.createdAt);
      const productCreatedAt = toIsoString(product.createdAt);
      return {
        id: product.id,
        contractId: product.contractId,
        contractNumber: product.contract?.contractNumber || '',
        contractSignedDate: product.contract?.signedDate || '',
        contractPartyAName: product.contract?.partyAName || '',
        contractPartyBName: product.contract?.partyBName || '',
        orderPlacedAt: signedAt || contractCreatedAt || productCreatedAt,
        productName: product.productName || '',
        productCode: product.productCode || '',
        productType: product.productType || '',
        specification: product.specification || '',
        quantity: product.quantity || '',
        deliveryDeadline: product.deliveryDeadline || '',
        recordCount: stats.recordCount || 0,
        totalQuantity: stats.totalQuantity || 0,
        latestRecordAt: stats.latestRecordAt || null,
      };
    });

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
    res.status(500).json({ success: false, message: '��ȡ��������ʧ��' });
  }
});

router.get('/progress/:productId/records', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: '��ͬ��ƷID��Ч' });
    }

    const product = await ContractProduct.findByPk(productId, {
      include: [{
        model: Contract,
        as: 'contract',
        attributes: ['id', 'contractNumber', 'signedDate', 'createdAt', 'partyAName', 'partyBName', 'signedLocation'],
      }],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: '��ͬ��Ʒ������' });
    }

    const records = await ProcessRecord.findAll({
      where: { contractProductId: productId },
      include: [
        { model: Process, as: 'process', attributes: ['id', 'name'] },
        { model: Employee, as: 'employee', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    const timeline = records.map(record => ({
      id: record.id,
      type: 'record',
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      processName: record.process?.name || '',
      employeeName: record.employeeNameSnapshot || record.employee?.name || '',
      quantity: record.quantity,
      actualTimeMinutes: record.actualTimeMinutes,
      payAmount: Number(record.payAmount || 0),
      notes: record.notes || '',
    }));

    const resolveDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const orderDateSource = resolveDate(product.contract?.signedDate)
      || resolveDate(product.contract?.createdAt)
      || resolveDate(product.createdAt);

    if (orderDateSource) {
      timeline.unshift({
        id: 'order-' + product.id,
        type: 'order',
        createdAt: orderDateSource.toISOString(),
        processName: '�µ�ʱ��',
        employeeName: '',
        quantity: null,
        actualTimeMinutes: null,
        payAmount: null,
        notes: product.contract?.signedLocation ? 'ǩ���ص㣺' + product.contract.signedLocation : '',
      });
    }

    const totalPayAmount = timeline.reduce((sum, item) => sum + (typeof item.payAmount === 'number' ? item.payAmount : 0), 0);

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          contractId: product.contractId,
          contractNumber: product.contract?.contractNumber || '',
          contractSignedDate: product.contract?.signedDate || '',
          contractPartyAName: product.contract?.partyAName || '',
          contractPartyBName: product.contract?.partyBName || '',
          productName: product.productName || '',
          productCode: product.productCode || '',
          productType: product.productType || '',
          specification: product.specification || '',
          quantity: product.quantity || '',
          deliveryDeadline: product.deliveryDeadline || '',
          orderPlacedAt: orderDateSource ? orderDateSource.toISOString() : null,
        },
        records: timeline,
        totalPayAmount,
      },
    });
  } catch (error) {
    console.error('Load product progress records error:', error);
    res.status(500).json({ success: false, message: '��ȡ������¼ʧ��' });
  }
});

// Ա����Ч
// Ա����Ч

// 员工绩效汇总
router.get('/performance/summary', async (req, res) => {
  try {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { startDate, endDate, status, keyword } = req.query || {};

    const start = startDate ? new Date(startDate) : defaultStart;
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : defaultEnd;
    end.setHours(23, 59, 59, 999);

    const recordWhere = {
      createdAt: { [Op.between]: [start, end] },
    };

    const aggregates = await ProcessRecord.findAll({
      where: recordWhere,
      attributes: [
        'employeeId',
        [sequelize.fn('COUNT', sequelize.col('ProcessRecord.id')), 'recordCount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('payAmount')), 'totalPayAmount'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'latestRecordAt'],
      ],
      group: ['employeeId'],
      raw: true,
    });

    const statsMap = new Map();
    aggregates.forEach(item => {
      const key = Number(item.employeeId);
      if (!key || Number.isNaN(key)) return;
      statsMap.set(key, {
        recordCount: Number(item.recordCount || 0),
        totalQuantity: Number(item.totalQuantity || 0),
        totalPayAmount: Number(item.totalPayAmount || 0),
        latestRecordAt: item.latestRecordAt || null,
      });
    });

    const employeeWhere = {};
    if (status) {
      employeeWhere.status = status;
    }
    if (keyword && String(keyword).trim()) {
      const text = '%' + String(keyword).trim() + '%';
      employeeWhere[Op.or] = [
        { name: { [Op.like]: text } },
        { code: { [Op.like]: text } },
      ];
    }

    const employees = await Employee.findAll({
      where: employeeWhere,
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'code', 'status'],
    });

    const items = employees.map(emp => {
      const stats = statsMap.get(emp.id) || {};
      return {
        id: emp.id,
        name: emp.name,
        code: emp.code || "",
        status: emp.status || "",
        recordCount: stats.recordCount || 0,
        totalQuantity: stats.totalQuantity || 0,
        totalPayAmount: Number(stats.totalPayAmount || 0),
        latestRecordAt: stats.latestRecordAt || null,
      };
    });

    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        range: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('List employee performance summary error:', error);
    res.status(500).json({ success: false, message: '获取员工绩效汇总失败' });
  }
});

router.get('/performance/:employeeId/records', async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId || Number.isNaN(employeeId)) {
      return res.status(400).json({ success: false, message: '员工ID无效' });
    }

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { startDate, endDate } = req.query || {};

    const start = startDate ? new Date(startDate) : defaultStart;
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : defaultEnd;
    end.setHours(23, 59, 59, 999);

    const employee = await Employee.findByPk(employeeId, {
      attributes: ['id', 'name', 'code', 'status'],
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    const records = await ProcessRecord.findAll({
      where: {
        employeeId,
        createdAt: { [Op.between]: [start, end] },
      },
      include: [
        { model: Contract, as: 'contract', attributes: ['id', 'contractNumber'] },
        { model: ContractProduct, as: 'contractProduct', attributes: ['id', 'productName', 'productCode'] },
        { model: Process, as: 'process', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    const items = records.map(record => ({
      id: record.id,
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      contractNumber: record.contract?.contractNumber || "",
      productName: record.contractProduct?.productName || "",
      productCode: record.contractProduct?.productCode || "",
      processName: record.process?.name || "",
      quantity: record.quantity,
      actualTimeMinutes: record.actualTimeMinutes,
      payAmount: Number(record.payAmount || 0),
      notes: record.notes || "",
    }));

    const totalPayAmount = items.reduce((sum, item) => sum + (item.payAmount || 0), 0);

    res.json({
      success: true,
      data: {
        employee,
        items,
        total: items.length,
        totalPayAmount,
        range: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('List employee performance detail error:', error);
    res.status(500).json({ success: false, message: '获取员工生产记录失败' });
  }
});

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
    res.status(500).json({ success: false, message: '��ȡԱ����Чʧ��' });
  }
});

// �½�������¼
router.post('/record', async (req, res) => {
  try {
    const { employeeId, contractId, contractProductId, processId, quantity, actualTimeMinutes, notes } = req.body;
    if (!employeeId || !contractId || !contractProductId || !processId) {
      return res.status(400).json({ success: false, message: 'ȱ�ٱ�Ҫ����' });
    }
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Ա��������' });
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
    console.error('�½�������¼ʧ��:', error);
    res.status(500).json({ success: false, message: '�½�������¼ʧ��' });
  }
});

// �༭������¼
router.put('/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, contractId, contractProductId, processId, quantity, actualTimeMinutes, notes } = req.body;
    const record = await ProcessRecord.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: '��¼������' });
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Ա��������' });
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
    console.error('�༭������¼ʧ��:', error);
    res.status(500).json({ success: false, message: '�༭������¼ʧ��' });
  }
});

// ɾ��������¼
router.delete('/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await ProcessRecord.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: '��¼������' });
    await record.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('ɾ��������¼ʧ��:', error);
    res.status(500).json({ success: false, message: 'ɾ��������¼ʧ��' });
  }
});

// ��ѯ������¼��֧�ַ�ҳ��������
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
    console.error('��ѯ������¼ʧ��:', error);
    res.status(500).json({ success: false, message: '��ѯ������¼ʧ��' });
  }
});

// ��ȡ��ͬ���������б�  
router.get('/contract-list', async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('��ȡ��ͬ���������б�ʧ��:', error);
    res.status(500).json({ success: false, message: '��ȡ��ͬ���������б�ʧ��' });
  }
});

// ɨ�蹤���ά���¼����
router.post('/scan/process', async (req, res) => {
  try {
    const { qrCode, employeeId, wechatOpenId, duration, notes } = req.body;
    
    res.json({ 
      success: true, 
      message: '������¼�ɹ�',
      data: { recordId: 1, totalWage: 10, processName: 'ʾ������' }
    });

  } catch (error) {
    console.error('ɨ�蹤��ʧ��:', error);
    res.status(500).json({ success: false, message: '��¼����ʧ��' });
  }
});

module.exports = router;


