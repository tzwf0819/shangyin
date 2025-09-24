// routes/productType.js
const express = require('express');
const router = express.Router();
const {
  getAllProductTypes,
  getProductTypeById,
  createProductType,
  updateProductType,
  deleteProductType,
  getProductTypeProcesses,
  addProcessToProductType,
  removeProcessFromProductType,
  updateProcessOrder
} = require('../controllers/productTypeController');

// 获取所有产品类型
router.get('/', getAllProductTypes);

// 获取单个产品类型
router.get('/:id', getProductTypeById);

// 获取产品类型的工序列表
router.get('/:id/processes', getProductTypeProcesses);

// 创建产品类型
router.post('/', createProductType);

// 添加工序到产品类型
router.post('/:id/processes', addProcessToProductType);

// 更新产品类型
router.put('/:id', updateProductType);

// 更新产品类型工序顺序
router.put('/:id/processes/order', updateProcessOrder);

// 删除产品类型
router.delete('/:id', deleteProductType);

// 从产品类型中移除工序
router.delete('/:id/processes/:relationId', removeProcessFromProductType);

module.exports = router;
