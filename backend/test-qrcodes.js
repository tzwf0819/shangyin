const axios = require('axios');

const baseURL = 'http://localhost:3000/shangyin';
axios.defaults.baseURL = baseURL;
axios.defaults.timeout = 15000;

async function ensureProcess() {
  const listResp = await axios.get('/processes');
  if (!listResp.data?.success) {
    throw new Error(`Failed to fetch processes: ${listResp.data?.message || 'unknown error'}`);
  }
  const processes = listResp.data.data?.processes || listResp.data.data || [];
  if (processes.length > 0) {
    return processes[0];
  }
  const payload = {
    name: `Auto Process ${Date.now()}`,
    description: 'Created by CI smoke test',
    payRate: 1,
    payRateUnit: 'perItem',
  };
  const createResp = await axios.post('/processes', payload);
  if (!createResp.data?.success) {
    throw new Error(`Failed to create process: ${createResp.data?.message || 'unknown error'}`);
  }
  return createResp.data.data?.process || createResp.data.data;
}

async function ensureContractWithProduct() {
  const listResp = await axios.get('/contracts', { params: { limit: 1 } });
  if (!listResp.data?.success) {
    throw new Error(`Failed to fetch contracts: ${listResp.data?.message || 'unknown error'}`);
  }
  const contracts = listResp.data.data?.contracts || [];
  if (contracts.length > 0) {
    const contract = contracts[0];
    const products = Array.isArray(contract.products) ? contract.products : [];
    if (products.length > 0) {
      return { contract, product: products[0] };
    }
    const detailResp = await axios.get(`/contracts/${contract.id}`);
    if (detailResp.data?.success) {
      const detail = detailResp.data.data?.contract || detailResp.data.data;
      const detailProducts = Array.isArray(detail?.products) ? detail.products : [];
      if (detailProducts.length > 0) {
        return { contract: detail, product: detailProducts[0] };
      }
    }
  }

  const now = Date.now();
  const payload = {
    contractNumber: `QR-AUTO-${now}`,
    partyAName: 'Automation Party A',
    partyBName: 'Automation Party B',
    products: [
      {
        productName: 'Automation Product',
        productCode: `AUTO-P-${now}`,
      },
    ],
  };

  const createResp = await axios.post('/contracts', payload);
  if (!createResp.data?.success) {
    throw new Error(`Failed to create contract: ${createResp.data?.message || 'unknown error'}`);
  }
  const contract = createResp.data.data?.contract || createResp.data.data;
  const products = Array.isArray(contract?.products) ? contract.products : [];
  if (!contract || products.length === 0) {
    throw new Error('Contract created but no product returned');
  }
  return { contract, product: products[0] };
}

async function assertQRCode(path, id, description) {
  const resp = await axios.get(`${path}/${id}`);
  if (!resp.data?.success) {
    throw new Error(`${description} QR code endpoint failed: ${resp.data?.message || 'unknown error'}`);
  }
  const data = resp.data.data || {};
  if (!data.payload || !data.dataUrl) {
    throw new Error(`${description} QR code response missing payload or dataUrl`);
  }
  if (!String(data.dataUrl).startsWith('data:image/png;base64,')) {
    throw new Error(`${description} QR code dataUrl is not a PNG base64 image`);
  }
  return data;
}

(async () => {
  try {
    console.log('== QR Code API smoke test ==');
    const processInfo = await ensureProcess();
    console.log('Process ready, id =', processInfo.id);

    const { contract, product } = await ensureContractWithProduct();
    console.log('Contract ready, id =', contract.id, 'product id =', product.id);

    await assertQRCode('/qrcodes/process', processInfo.id, 'Process');
    console.log('Process QR code endpoint OK');

    await assertQRCode('/qrcodes/contract', contract.id, 'Contract');
    console.log('Contract QR code endpoint OK');

    if (!product.id) {
      throw new Error('Contract product missing id');
    }
    await assertQRCode('/qrcodes/contract-product', product.id, 'Contract product');
    console.log('Contract product QR code endpoint OK');

    console.log('== QR Code API smoke test passed ==');
    global.process.exit(0);
  } catch (error) {
    console.error('QR code smoke test failed:', error?.message || error);
    if (error?.response?.data) {
      console.error('API response:', JSON.stringify(error.response.data, null, 2));
    }
    global.process.exit(1);
  }
})();
