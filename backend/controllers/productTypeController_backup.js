// controllers/productTypeController.js
const { ProductType, Process, ProductTypeProcess } = require('../models');
const { Op } = require('sequelize');

// 获取所有产品类型
exports.getAllProductTypes = async (req, res) => {
  try {
    const productTypes = await ProductType.findAll({
      include: [{
        model: Process,
        as: 'processes',
        through: {
          attributes: ['sequenceOrder'],
          as: 'productTypeProcess'
        },
        attributes: ['id', 'name', 'code', 'standardTime', 'difficulty']
      }],
      order: [['createdAt', 'DESC'], [{ model: Process, as: 'processes' }, { model: ProductTypeProcess, as: 'productTypeProcess' }, 'sequenceOrder', 'ASC']]
    });

    res.json({
      success: true,
      data: { productTypes }
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

    const productType = await ProductType.findByPk(id, {
      include: [{
        model: Process,
        as: 'processes',
        through: {
          attributes: ['sequenceOrder'],
          as: 'productTypeProcess'
        }
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
    const { name, code, processes = [] } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: '产品类型名称和编码不能为空'
      });
    }

    const existingProductType = await ProductType.findOne({ where: { code } });
    if (existingProductType) {
      return res.status(409).json({
        success: false,
        message: '产品类型编码已存在'
      });
    }

    const productType = await ProductType.create({
      name,
      code,
      status: 'active'
    });

    // 如果有工序数据，保存工序关联
    if (processes.length > 0) {
      await this.saveProductTypeProcesses(productType.id, processes);
    }

    res.status(201).json({
      success: true,
      data: { productType },
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
    const { name, code, status, processes = [] } = req.body;

    const productType = await ProductType.findByPk(id);
    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    await productType.update({
      name: name || productType.name,
      code: code || productType.code,
      status: status || productType.status
    });

    // 更新工序关联
    await this.saveProductTypeProcesses(productType.id, processes);

    res.json({
      success: true,
      data: { productType },
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

// 删除产品类型
exports.deleteProductType = async (req, res) => {
  try {
    const { id } = req.params;

    const productType = await ProductType.findByPk(id);
    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    // 先删除关联的工序
    await ProductTypeProcess.destroy({
      where: { productTypeId: id }
    });

    // 真删除：直接从数据库删除记录
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

// 保存产品类型的工序关联
exports.saveProductTypeProcesses = async (productTypeId, processes) => {
  try {
    // 先删除现有的关联
    await ProductTypeProcess.destroy({
      where: { productTypeId }
    });

    // 创建新的关联
    if (processes.length > 0) {
      const processData = processes.map((process, index) => ({
        productTypeId,
        processId: process.id || process.processId,
        sequenceOrder: index + 1
      }));

      await ProductTypeProcess.bulkCreate(processData);
    }
  } catch (error) {
    console.error('Save product type processes error:', error);
    throw error;
  }
};

// 获取产品类型的工序列表
exports.getProductTypeProcesses = async (req, res) => {
  try {
    const { id } = req.params;

    const productType = await ProductType.findByPk(id, {
      include: [{
        model: Process,
        as: 'processes',
        through: {
          attributes: ['sequenceOrder'],
          as: 'productTypeProcess'
        }
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
      data: { processes: productType.processes }
    });
  } catch (error) {
    console.error('Get product type processes error:', error);
    res.status(500).json({
      success: false,
      message: '获取产品类型工序失败'
    });
  }
};

// 更新产品类型的工序顺序
exports.updateProductTypeProcesses = async (req, res) => {
  try {
    const { id } = req.params;
    const { processes = [] } = req.body;

    const productType = await ProductType.findByPk(id);
    if (!productType) {
      return res.status(404).json({
        success: false,
        message: '产品类型不存在'
      });
    }

    await this.saveProductTypeProcesses(id, processes);

    res.json({
      success: true,
      message: '工序顺序更新成功'
    });
  } catch (error) {
    console.error('Update product type processes error:', error);
    res.status(500).json({
      success: false,
      message: '更新工序顺序失败'
    });
  }
};
