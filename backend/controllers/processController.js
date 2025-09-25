// controllers/processController.js
const { Process, ProductTypeProcess } = require('../models');
const { Op } = require('sequelize');

// 工具函数：生成工序编码
const generateProcessCode = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return 'GX' + timestamp.slice(-6) + random;
};

// 工具函数：验证工序数据
const validateProcessData = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('工序名称不能为空');
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('工序名称不能超过100个字符');
  }
  
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.push('状态只能是active或inactive');
  }
  
  return errors;
};

// 获取所有工序
exports.getAllProcesses = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, keyword } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (keyword) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const processes = await Process.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        processes: processes.rows,
        total: processes.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get processes error:', error);
    res.status(500).json({
      success: false,
      message: '获取工序列表失败'
    });
  }
};

// 获取单个工序
exports.getProcessById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const process = await Process.findByPk(id);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: '工序不存在'
      });
    }

    res.json({
      success: true,
      data: { process }
    });
  } catch (error) {
    console.error('Get process error:', error);
    res.status(500).json({
      success: false,
      message: '获取工序失败'
    });
  }
};

// 创建工序
exports.createProcess = async (req, res) => {
  try {
  const { name, status = 'active', description = '', payRate = 0, payRateUnit = 'perItem' } = req.body;

    // 验证输入数据
    const validationErrors = validateProcessData({ name, status });
    // 验证绩效工资和单位
    if (isNaN(payRate) || Number(payRate) < 0) {
      validationErrors.push('绩效工资格式无效');
    }
    if (!['perItem', 'perHour'].includes(payRateUnit)) {
      validationErrors.push('绩效单位无效');
    }
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    // 检查名称是否已存在（代码层验证）
    const existingProcess = await Process.findOne({ 
      where: { name: name.trim() } 
    });
    
    if (existingProcess) {
      return res.status(409).json({
        success: false,
        message: '工序名称已存在'
      });
    }

    // 生成唯一编码（代码层处理）
    let code;
    let isCodeUnique = false;
    let attempts = 0;
    
    while (!isCodeUnique && attempts < 10) {
      code = generateProcessCode();
      const existingCode = await Process.findOne({ where: { code } });
      if (!existingCode) {
        isCodeUnique = true;
      }
      attempts++;
    }
    
    if (!isCodeUnique) {
      return res.status(500).json({
        success: false,
        message: '生成唯一编码失败，请重试'
      });
    }

    const process = await Process.create({
      name: name.trim(),
      description: description || null,
      code,
      status,
      payRate,
      payRateUnit
    });

    res.status(201).json({
      success: true,
      data: { process },
      message: '工序创建成功'
    });
  } catch (error) {
    console.error('Create process error:', error);
    res.status(500).json({
      success: false,
      message: '创建工序失败'
    });
  }
};

// 更新工序
exports.updateProcess = async (req, res) => {
  try {
  const { id } = req.params;
  const { name, status, description, payRate, payRateUnit } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    // 验证输入数据
    const validationErrors = validateProcessData({ name, status });
    if (payRate !== undefined) {
      if (isNaN(payRate) || Number(payRate) < 0) {
        validationErrors.push('绩效工资格式无效');
      }
    }
    if (payRateUnit !== undefined) {
      if (!['perItem', 'perHour'].includes(payRateUnit)) {
        validationErrors.push('绩效单位无效');
      }
    }
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    const process = await Process.findByPk(id);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: '工序不存在'
      });
    }

    // 检查名称是否与其他工序冲突
    if (name && name.trim() !== process.name) {
      const existingProcess = await Process.findOne({ 
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingProcess) {
        return res.status(409).json({
          success: false,
          message: '工序名称已存在'
        });
      }
    }

    // 更新数据
  const updateData = {};
  if (name) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description;
  if (status) updateData.status = status;
  if (payRate !== undefined) updateData.payRate = payRate;
  if (payRateUnit !== undefined) updateData.payRateUnit = payRateUnit;

    await process.update(updateData);

    const updatedProcess = await Process.findByPk(id);

    res.json({
      success: true,
      data: { process: updatedProcess },
      message: '工序更新成功'
    });
  } catch (error) {
    console.error('Update process error:', error);
    res.status(500).json({
      success: false,
      message: '更新工序失败'
    });
  }
};

// 删除工序
exports.deleteProcess = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const process = await Process.findByPk(id);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: '工序不存在'
      });
    }

    // 删除前清理关联（放开限制，满足“工序可删除”需求）
    await ProductTypeProcess.destroy({ where: { processId: id } });
    await process.destroy();

    res.json({
      success: true,
      message: '工序删除成功（已自动解除关联）'
    });
  } catch (error) {
    console.error('Delete process error:', error);
    res.status(500).json({
      success: false,
      message: '删除工序失败'
    });
  }
};
