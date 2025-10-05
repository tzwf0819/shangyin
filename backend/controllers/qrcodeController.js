const QRCode = require('qrcode');
const { Contract, ContractProduct, Process } = require('../models');

async function createQRCodeResponse(payload) {
  const text = JSON.stringify(payload);
  const dataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
  });
  return {
    success: true,
    data: {
      payload,
      text,
      dataUrl,
    },
  };
}

function parseId(raw) {
  if (raw === undefined || raw === null) {
    return NaN;
  }
  const id = Number(raw);
  return Number.isInteger(id) ? id : NaN;
}

function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

exports.getContractQRCode = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid contract id' });
    }
    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }
    const payload = {
      type: 'contract',
      contractId: contract.id,
      contractNumber: contract.contractNumber || null,
    };
    const response = await createQRCodeResponse(payload);
    res.json(response);
  } catch (error) {
    console.error('Failed to generate contract QR code', error);
    res.status(500).json({ success: false, message: 'Failed to generate contract QR code' });
  }
};

exports.getContractProductQRCode = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid contract product id' });
    }
    const product = await ContractProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Contract product not found' });
    }
    const contract = product.contractId ? await Contract.findByPk(product.contractId) : null;
    const payload = {
      type: 'contractProduct',
      contractId: product.contractId,
      contractProductId: product.id,
      contractNumber: contract ? contract.contractNumber || null : null,
      productCode: product.productCode || null,
      productName: product.productName || null,
    };
    const response = await createQRCodeResponse(payload);
    res.json(response);
  } catch (error) {
    console.error('Failed to generate contract product QR code', error);
    res.status(500).json({ success: false, message: 'Failed to generate contract product QR code' });
  }
};

exports.getProcessQRCode = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid process id' });
    }
    const process = await Process.findByPk(id);
    if (!process) {
      return res.status(404).json({ success: false, message: 'Process not found' });
    }
    const payload = {
      type: 'process',
      processId: process.id,
      processCode: process.code || null,
      processName: process.name || null,
    };
    const response = await createQRCodeResponse(payload);
    res.json(response);
  } catch (error) {
    console.error('Failed to generate process QR code', error);
    res.status(500).json({ success: false, message: 'Failed to generate process QR code' });
  }
};

