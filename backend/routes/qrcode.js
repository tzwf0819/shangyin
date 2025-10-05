const express = require('express');
const router = express.Router();
const {
  getContractQRCode,
  getContractProductQRCode,
  getProcessQRCode,
} = require('../controllers/qrcodeController');

router.get('/contract/:id', getContractQRCode);
router.get('/contract-product/:id', getContractProductQRCode);
router.get('/process/:id', getProcessQRCode);

module.exports = router;
