const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/adminAuth');
const {
  listContracts,
  getContractDetail,
  createContract,
  updateContract,
  deleteContract,
  importContracts,
} = require('../controllers/contractController');

// 所有合同路由都需要管理员权限
router.use(verifyAdmin);

router.get('/', listContracts);
router.post('/import', importContracts);
router.get('/:id', getContractDetail);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

module.exports = router;
