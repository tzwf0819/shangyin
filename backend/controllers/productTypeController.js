// controllers/productTypeController.js
const { ProductType, Process, ProductTypeProcess } = require('../models');
const { Op } = require('sequelize');

// 工具函数：生成产品类型编码
const generateProductTypeCode = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return 'PT' + timestamp.slice(-6) + random;
};

// 工具函数：验证产品类型数据
const validateProductTypeData = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('产品类型名称不能为空');
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('产品类型名称不能超过100个字符');
  }
  
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.push('状态只能是active或inactive');
  }
  
  return errors;
};

// 获取所有产品类型
exports.getAllProductTypes = async (req, res) => {
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
    const productTypes = await ProductType.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['id', 'DESC']],
      include: [{
        model: Process,
        as: 'processes',
        through: { attributes: ['sequenceOrder'] }
      }]
    });

    res.json({
      success: true,
      data: {
        productTypes: productTypes.rows,
        total: productTypes.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get product types error:', error);
    res.status(500).json({
      success: false,
      message: '获取产品类型列表失败'
    });
  }
};

// 获取单个产品类型
exports.getProductTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const productType = await ProductType.findByPk(id, {
      include: [{
        model: Process,
        as: 'processes',
        through: { attributes: ['sequenceOrder'] }
      }]
    });

    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    res.json({
      success: true,
      data: { productType }
    });
  } catch (error) {
    console.error('Get product type error:', error);
    res.status(500).json({
      success: false,
      message: '获取产品类型失败'
    });
  }
};

// 创建产品类型
exports.createProductType = async (req, res) => {
  try {
    const { name, status = 'active', processes = [] } = req.body;

    // 验证输入数据
    const validationErrors = validateProductTypeData({ name, status });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    // 检查名称是否已存在（代码层验证）
    const existingProductType = await ProductType.findOne({ 
      where: { name: name.trim() } 
    });
    
    if (existingProductType) {
      return res.status(409).json({
        success: false,
        message: '产品类型名称已存在'
      });
    }

    // 生成唯一编码（代码层处理）
    let code;
    let isCodeUnique = false;
    let attempts = 0;
    
    while (!isCodeUnique && attempts < 10) {
      code = generateProductTypeCode();
      const existingCode = await ProductType.findOne({ where: { code } });
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

    // 创建产品类型
    const productType = await ProductType.create({
      name: name.trim(),
      code,
      status
    });

    // 处理工序关联
    if (processes.length > 0) {
      // 验证工序是否存在
      const processIds = processes.map(p => p.id);
      const validProcesses = await Process.findAll({
        where: { id: processIds }
      });
      
      if (validProcesses.length !== processIds.length) {
        return res.status(400).json({
          success: false,
          message: '存在无效的工序ID'
        });
      }
      
      // 使用Sequelize的关联方法
      await productType.setProcesses(validProcesses, {
        through: processes.reduce((acc, process, index) => {
          acc[process.id] = { sequenceOrder: index + 1 };
          return acc;
        }, {})
      });
    }

    // 返回完整数据
    const createdProductType = await ProductType.findByPk(productType.id, {
      include: [{
        model: Process,
        as: 'processes',
        through: { attributes: ['sequenceOrder'] }
      }]
    });

    res.status(201).json({
      success: true,
      data: { productType: createdProductType },
      message: '产品类型创建成功'
    });
  } catch (error) {
    console.error('Create product type error:', error);
    res.status(500).json({
      success: false,
      message: '创建产品类型失败'
    });
  }
};

// 更新产品类型
exports.updateProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, processes = [] } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    // 验证输入数据
    const validationErrors = validateProductTypeData({ name, status });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    const productType = await ProductType.findByPk(id);
    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    // 检查名称是否与其他产品类型冲突
    if (name && name.trim() !== productType.name) {
      const existingProductType = await ProductType.findOne({ 
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingProductType) {
        return res.status(409).json({
          success: false,
          message: '产品类型名称已存在'
        });
      }
    }

    // 更新基本数据
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (status) updateData.status = status;

    await productType.update(updateData);

    // 更新工序关联
    if (processes.length >= 0) {
      if (processes.length > 0) {
        const processIds = processes.map(p => p.id);
        const validProcesses = await Process.findAll({
          where: { id: processIds }
        });
        
        if (validProcesses.length !== processIds.length) {
          return res.status(400).json({
            success: false,
            message: '存在无效的工序ID'
          });
        }
        
        // 使用Sequelize的关联方法更新
        await productType.setProcesses(validProcesses, {
          through: processes.reduce((acc, process, index) => {
            acc[process.id] = { sequenceOrder: index + 1 };
            return acc;
          }, {})
        });
      } else {
        // 清除所有关联
        await productType.setProcesses([]);
      }
    }

    // 返回更新后的数据
    const updatedProductType = await ProductType.findByPk(id, {
      include: [{
        model: Process,
        as: 'processes',
        through: { attributes: ['sequenceOrder'] }
      }]
    });

    res.json({
      success: true,
      data: { productType: updatedProductType },
      message: '产品类型更新成功'
    });
  } catch (error) {
    console.error('Update product type error:', error);
    res.status(500).json({
      success: false,
      message: '更新产品类型失败'
    });
  }
};

// 获取产品类型的工序列表
exports.getProductTypeProcesses = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const productType = await ProductType.findByPk(id, {
      include: [{
        model: Process,
        as: 'processes',
        through: { 
          attributes: ['sequenceOrder', 'id'],
          as: 'ProductTypeProcess'
        },
        attributes: ['id', 'name', 'description', 'payRate', 'payRateUnit', 'status']
      }]
    });

    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    // 按sequenceOrder排序
    const processes = productType.processes.sort((a, b) => 
      a.ProductTypeProcess.sequenceOrder - b.ProductTypeProcess.sequenceOrder
    );

    res.json({
      success: true,
      data: { processes },
      message: '获取工序列表成功'
    });
  } catch (error) {
    console.error('Get product type processes error:', error);
    res.status(500).json({
      success: false,
      message: '获取工序列表失败'
    });
  }
};

// 添加工序到产品类型
exports.addProcessToProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const { processId, sequenceOrder } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    if (!processId || !sequenceOrder) {
      return res.status(400).json({
        success: false,
        message: '工序ID和顺序不能为空'
      });
    }

    const productType = await ProductType.findByPk(id);
    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    const process = await Process.findByPk(processId);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: '工序不存在'
      });
    }

    // 检查是否已存在
    const existingRelation = await ProductTypeProcess.findOne({
      where: { productTypeId: id, processId }
    });

    if (existingRelation) {
      return res.status(400).json({
        success: false,
        message: '该工序已添加到产品类型中'
      });
    }

    // 添加关联
    await ProductTypeProcess.create({
      productTypeId: id,
      processId,
      sequenceOrder
    });

    res.json({
      success: true,
      message: '工序添加成功'
    });
  } catch (error) {
    console.error('Add process to product type error:', error);
    res.status(500).json({
      success: false,
      message: '添加工序失败'
    });
  }
};

// 从产品类型中移除工序
exports.removeProcessFromProductType = async (req, res) => {
  try {
    const { id, relationId } = req.params;

    if (!id || isNaN(id) || !relationId || isNaN(relationId)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const relation = await ProductTypeProcess.findOne({
      where: { id: relationId, productTypeId: id }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: '工序关联不存在'
      });
    }

    await relation.destroy();

    res.json({
      success: true,
      message: '工序移除成功'
    });
  } catch (error) {
    console.error('Remove process from product type error:', error);
    res.status(500).json({
      success: false,
      message: '移除工序失败'
    });
  }
};

// 更新产品类型工序顺序
exports.updateProcessOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { processes } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    if (!processes || !Array.isArray(processes)) {
      return res.status(400).json({
        success: false,
        message: '工序列表格式无效'
      });
    }

    // 批量更新顺序
    const updatePromises = processes.map(({ id: relationId, sequenceOrder }) => 
      ProductTypeProcess.update(
        { sequenceOrder },
        { where: { id: relationId, productTypeId: id } }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '工序顺序更新成功'
    });
  } catch (error) {
    console.error('Update process order error:', error);
    res.status(500).json({
      success: false,
      message: '更新工序顺序失败'
    });
  }
};

// 删除产品类型
exports.deleteProductType = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const productType = await ProductType.findByPk(id);
    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    // 删除产品类型（关联会自动删除）
    await productType.destroy();

    res.json({
      success: true,
      message: '产品类型删除成功'
    });
  } catch (error) {
    console.error('Delete product type error:', error);
    res.status(500).json({
      success: false,
      message: '删除产品类型失败'
    });
  }
};
