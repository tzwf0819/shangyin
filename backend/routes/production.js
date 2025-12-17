const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { ProcessRecord, Employee, Contract, ContractProduct, Process, ProductType, ProductTypeProcess, EmployeeProcess, sequelize } = require('../models');
// 计薪计算函数
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
    res.status(500).json({ success: false, message: '获取生产进度失败' });
  }
});

router.get('/progress/:productId/records', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: '合同产品ID无效' });
    }

    const product = await ContractProduct.findByPk(productId, {
      include: [{
        model: Contract,
        as: 'contract',
        attributes: ['id', 'contractNumber', 'signedDate', 'createdAt', 'partyAName', 'partyBName', 'signedLocation'],
      }],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: '合同产品不存在' });
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
        processName: '下单时间',
        employeeName: '',
        quantity: null,
        actualTimeMinutes: null,
        payAmount: null,
        notes: product.contract?.signedLocation ? '签订地点：' + product.contract.signedLocation : '',
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
    res.status(500).json({ success: false, message: '获取生产记录失败' });
  }
});

// 员工绩效
// 员工绩效

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
        [sequelize.fn('SUM', sequelize.col('rating')), 'totalRating'], // 新增：总评分
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
        totalRating: Number(item.totalRating || 0), // 新增：总评分
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
        totalRating: stats.totalRating || 0, // 新增：总评分
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
      rating: record.rating, // 新增：评分
      ratingEmployeeName: record.ratingEmployeeName, // 新增：评分员工姓名
      ratingTime: record.ratingTime ? record.ratingTime.toISOString() : null, // 新增：评分时间
      notes: record.notes || "",
    }));

    const totalPayAmount = items.reduce((sum, item) => sum + (item.payAmount || 0), 0);
    const totalRating = items.reduce((sum, item) => sum + (item.rating || 0), 0); // 新增：总评分

    res.json({
      success: true,
      data: {
        employee,
        items,
        total: items.length,
        totalPayAmount,
        totalRating, // 新增：总评分
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
      rating: record.rating, // 新增：评分
      ratingEmployeeName: record.ratingEmployeeName, // 新增：评分员工姓名
      ratingTime: record.ratingTime ? record.ratingTime.toISOString() : null, // 新增：评分时间
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
    const {
      employeeId,
      contractId,
      contractProductId,
      processId,
      quantity,
      actualTimeMinutes,
      notes,
      rating,  // 新增：评分
      ratingEmployeeId,  // 新增：评分员工ID
      ratingEmployeeName,  // 新增：评分员工姓名
      ratingTime  // 新增：评分时间
    } = req.body;

    if (!employeeId || !contractId || !contractProductId || !processId) {
      return res.status(400).json({ success: false, message: '缺少必要字段' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    const calc = await calcPay({ processId, quantity, actualTimeMinutes });

    // 准备创建记录的数据
    const recordData = {
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
    };

    // 如果提供了评分相关信息，添加评分数据
    if (rating !== undefined && rating !== null) {
      if (![0, 5, 10].includes(Number(rating))) {
        return res.status(400).json({
          success: false,
          message: '评分必须为0、5或10分'
        });
      }

      recordData.rating = rating;

      // 如果提供了评分员工ID，验证该员工是否存在
      if (ratingEmployeeId) {
        const raterEmployee = await Employee.findByPk(ratingEmployeeId);
        if (raterEmployee) {
          recordData.ratingEmployeeId = ratingEmployeeId;
          recordData.ratingEmployeeName = ratingEmployeeName || raterEmployee.name;
          recordData.ratingTime = ratingTime ? new Date(ratingTime) : new Date();
        } else {
          return res.status(404).json({
            success: false,
            message: '评分员工不存在'
          });
        }
      }
    }

    const record = await ProcessRecord.create(recordData);
    res.json({ success: true, data: { record } });
  } catch (error) {
    console.error('新建生产记录失败:', error);
    res.status(500).json({ success: false, message: '新建生产记录失败' });
  }
});

// 小程序工序提交接口：支持在当前工序提交时对上一工序进行评分
router.post('/submit', async (req, res) => {
  try {
    const {
      employeeId,
      contractId,
      contractProductId,
      processId,
      quantity,
      actualTimeMinutes,
      notes,
      previousRating,  // 对前一道工序的评分
      previousRecordId // 前一道工序的记录ID
    } = req.body;

    if (!employeeId || !contractId || !contractProductId || !processId) {
      return res.status(400).json({ success: false, message: '缺少必要字段' });
    }

    // 验证员工是否存在
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    // 如果有对前一道工序的评分，则先更新前一道工序的评分信息
    let previousRecord = null;
    if (previousRating !== undefined && previousRecordId) {
      if (![0, 5, 10].includes(Number(previousRating))) {
        return res.status(400).json({
          success: false,
          message: '前工序评分必须为0、5或10分'
        });
      }

      previousRecord = await ProcessRecord.findByPk(previousRecordId);
      if (!previousRecord) {
        return res.status(404).json({
          success: false,
          message: '前一道工序记录不存在'
        });
      }

      // 检查评分员工是否有权限对前一道工序进行评分
      // 这里可以加入业务逻辑：当前员工是否有权限对前一道工序进行评分
      // 例如：当前工序的员工可以对前一道工序进行评分

      // 更新前一道工序的评分信息
      await previousRecord.update({
        rating: previousRating,
        ratingEmployeeId: employeeId,
        ratingEmployeeName: employee.name,
        ratingTime: new Date()
      });
    }

    // 计算当前工序的绩效
    const calc = await calcPay({ processId, quantity, actualTimeMinutes });

    // 创建当前工序的记录
    const currentRecord = await ProcessRecord.create({
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

    res.json({
      success: true,
      data: {
        currentRecord,
        previousRecord: previousRecord ? { id: previousRecord.id, rating: previousRating } : null
      },
      message: '工序提交成功'
    });
  } catch (error) {
    console.error('工序提交失败:', error);
    res.status(500).json({ success: false, message: '工序提交失败' });
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

// 查询生产记录，支持分页和筛选
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

    // 转换数据以确保评分字段正确返回
    const records = rows.map(record => {
      const recordJSON = record.toJSON();
      return {
        ...recordJSON,
        rating: recordJSON.rating, // 评分
        ratingEmployeeName: recordJSON.ratingEmployeeName, // 评分员工姓名
        ratingTime: recordJSON.ratingTime ? new Date(recordJSON.ratingTime).toISOString() : null // 评分时间
      };
    });
    res.json({ success: true, data: { total: count, records: records } });
  } catch (error) {
    console.error('查询生产记录失败:', error);
    res.status(500).json({ success: false, message: '查询生产记录失败' });
  }
});

// 获取合同产品简单列表  
router.get('/contract-list', async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('获取合同产品简单列表失败:', error);
    res.status(500).json({ success: false, message: '获取合同产品简单列表失败' });
  }
});

// 扫码工序二维码录入
router.post('/scan/process', async (req, res) => {
  try {
    const { qrCode, employeeId, wechatOpenId, duration, notes } = req.body;

    res.json({
      success: true,
      message: '流程记录成功',
      data: { recordId: 1, totalWage: 10, processName: '示例工序' }
    });

  } catch (error) {
    console.error('扫码工序失败:', error);
    res.status(500).json({ success: false, message: '录入流程失败' });
  }
});

// 为生产记录评分
router.post('/record/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, raterEmployeeId } = req.body;

    // 验证评分值是否为0、5或10
    if (![0, 5, 10].includes(Number(rating))) {
      return res.status(400).json({
        success: false,
        message: '评分必须为0、5或10分'
      });
    }

    // 检查生产记录是否存在
    const record = await ProcessRecord.findByPk(id, {
      include: [
        { model: ContractProduct, as: 'contractProduct', attributes: ['id'] },
        { model: Process, as: 'process', attributes: ['id'] }
      ]
    });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '生产记录不存在'
      });
    }

    // 获取评分员工信息
    const raterEmployee = await Employee.findByPk(raterEmployeeId);
    if (!raterEmployee) {
      return res.status(404).json({
        success: false,
        message: '评分员工不存在'
      });
    }

    // 获取合同产品的所有工序列表（按顺序）
    const contractProduct = await ContractProduct.findByPk(record.contractProductId);
    if (!contractProduct) {
      return res.status(404).json({
        success: false,
        message: '合同产品不存在'
      });
    }

    // 获取产品类型
    let productType = null;
    try {
      productType = await ProductType.findOne({
        include: [{
          model: ContractProduct,
          as: 'contractProducts',
          where: { id: contractProduct.id },
          required: true
        }]
      });
    } catch (error) {
      console.error('查询产品类型失败:', error);
    }

    if (productType) {
      try {
        // 获取该产品类型的所有工序（按顺序）
        const productTypeProcesses = await ProductTypeProcess.findAll({
          where: { productTypeId: productType.id },
          order: [['sequence', 'ASC']],
          attributes: ['processId', 'sequence']
        });

        if (productTypeProcesses.length > 0) {
          // 找到当前工序的索引
          const currentProcessIndex = productTypeProcesses.findIndex(p =>
            Number(p.processId) === Number(record.processId)
          );

          if (currentProcessIndex === -1) {
            return res.status(400).json({
              success: false,
              message: '当前工序不在产品类型工序列表中'
            });
          }

          // 检查评分员工是否有权对当前工序进行评分（即是否是下一个工序的员工）
          const nextProcessIndex = currentProcessIndex + 1;
          if (nextProcessIndex < productTypeProcesses.length) {
            // 检查评分员工是否被授权执行下一个工序
            const nextProcessId = productTypeProcesses[nextProcessIndex].processId;
            const authorized = await EmployeeProcess.findOne({
              where: {
                employeeId: raterEmployeeId,
                processId: nextProcessId
              }
            });

            if (!authorized) {
              return res.status(403).json({
                success: false,
                message: '评分员工没有权限对当前工序进行评分'
              });
            }
          } else {
            // 如果是最后一个工序，则不允许评分
            return res.status(400).json({
              success: false,
              message: '最后一个工序不能被评分'
            });
          }
        }
      } catch (error) {
        console.error('验证评分权限时出错:', error);
        return res.status(500).json({
          success: false,
          message: '验证评分权限时出错'
        });
      }
    } else {
      // 如果产品没有关联产品类型，允许评分（为了向后兼容）
      console.log(`产品 ${contractProduct.id} 未关联产品类型，跳过权限验证`);
    }

    // 更新评分信息
    await record.update({
      rating: rating,
      ratingEmployeeId: raterEmployeeId,
      ratingEmployeeName: raterEmployee.name,
      ratingTime: new Date()
    });

    res.json({
      success: true,
      message: '评分成功',
      data: { record }
    });

  } catch (error) {
    console.error('评分失败:', error);
    res.status(500).json({ success: false, message: '评分失败' });
  }
});

module.exports = router;


