// routes/productType.js
const express = require('express');
const router = express.Router();
const {
  getAllProductTypes,
  getProductTypeById,
  createProductType,
  updateProductType,
  deleteProductType
} = require('../controllers/productTypeController');

// 获取所有产品类型
router.get('/', getAllProductTypes);

// 获取单个产品类型
router.get('/:id', getProductTypeById);

// 创建产品类型
router.post('/', createProductType);

// 更新产品类型
router.put('/:id', updateProductType);

// 删除产品类型
router.delete('/:id', deleteProductType);

module.exports = router;
