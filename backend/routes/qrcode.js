const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/adminAuth');
const {
  getContractQRCode,
  getContractProductQRCode,
  getProcessQRCode,
} = require('../controllers/qrcodeController');

// 所有二维码路由都需要管理员权限
router.use(verifyAdmin);

router.get('/contract/:id', getContractQRCode);
router.get('/contract-product/:id', getContractProductQRCode);
router.get('/process/:id', getProcessQRCode);

module.exports = router;
