/* eslint-disable no-console */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { Op } = require('sequelize');
const {
  sequelize,
  Contract,
  ContractProduct,
  ProductType,
} = require('../models');
const contractController = require('../controllers/contractController');

const TEST_PREFIX = 'TEST-AUTO-';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const createMockReqRes = ({ query = {}, params = {}, body = {} } = {}) => {
  const req = { query, params, body };
  let responded = false;
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      responded = true;
      this.payload = data;
      return this;
    },
  };
  return { req, res, didRespond: () => responded };
};

const invokeController = async (handler, options) => {
  const { req, res, didRespond } = createMockReqRes(options);
  await handler(req, res);
  if (!didRespond()) {
    throw new Error('Controller did not send any response');
  }
  return { status: res.statusCode, body: res.payload };
};

const ensureProductType = async () => {
  const code = 'PT-AUTO-TEST';
  const name = 'Auto Test Type';
  const [record] = await ProductType.findOrCreate({
    where: { code },
    defaults: { name },
  });
  return record;
};

const logDivider = title => {
  const banner = '='.repeat(12);
  console.log(`\n${banner} ${title} ${banner}`);
};

const summarizeList = data => data?.items?.map(item => ({
  id: item.id,
  contractNumber: item.contractNumber,
  productCount: item.products?.length || 0,
})) || [];

(async () => {
  try {
    await sequelize.authenticate();
    await ensureProductType();

    const timestamp = Date.now();
    const contractNumber = `${TEST_PREFIX}${timestamp}`;

    const basePayload = {
      contractNumber,
      partyAName: 'Test Party A',
      partyBName: 'Test Party B',
      status: 'draft',
      salesId: 'EMP-001',
      signedDate: '2025-09-28',
      terms: ['Delivery within 30 days', 'Payment due upon receipt'],
      startProduction: '2025-09-29',
      packaging: 'Pending',
      products: [
        {
          productName: 'Test Product 1',
          productCode: 'TP-001',
          quantity: '100',
          unitPrice: '25',
          totalAmount: '2500',
          productTypeCode: 'PT-AUTO-TEST',
        },
        {
          productName: 'Test Product 2',
          productCode: 'TP-002',
          quantity: '50',
          unitPrice: '40',
          totalAmount: '2000',
          productTypeName: 'Auto Test Type',
        },
      ],
    };

    logDivider('Create Contract');
    const createResult = await invokeController(contractController.createContract, { body: basePayload });
    console.log('status:', createResult.status);
    console.log('response:', createResult.body);

    if (!createResult.body?.data?.contract?.id) {
      throw new Error('Contract creation failed during test');
    }

    const createdId = createResult.body.data.contract.id;

    await delay(50);

    logDivider('List Contracts - General');
    const listResult = await invokeController(contractController.listContracts, { query: { page: 1, pageSize: 5 } });
    console.log('status:', listResult.status);
    console.log('contracts:', summarizeList(listResult.body?.data));

    logDivider('List Contracts - Keyword');
    const searchResult = await invokeController(contractController.listContracts, { query: { keyword: contractNumber } });
    console.log('status:', searchResult.status);
    console.log('contracts:', summarizeList(searchResult.body?.data));

    logDivider('List Contracts - Date Range');
    const nowIso = new Date().toISOString();
    const dateFilterResult = await invokeController(contractController.listContracts, {
      query: { dateFrom: new Date(Date.now() - 86400000).toISOString(), dateTo: nowIso },
    });
    console.log('status:', dateFilterResult.status);
    console.log('contracts:', summarizeList(dateFilterResult.body?.data));

    logDivider('Get Contract Detail');
    const detailResult = await invokeController(contractController.getContractDetail, { params: { id: createdId } });
    console.log('status:', detailResult.status);
    console.log('detail number:', detailResult.body?.data?.contract?.contractNumber);

    const updatePayload = {
      ...basePayload,
      contractNumber: `${contractNumber}-UPDATED`,
      remark: 'Updated during automated test',
      products: [
        {
          productName: 'Updated Product',
          productCode: 'TP-009',
          quantity: '75',
          unitPrice: '30',
          totalAmount: '2250',
          productTypeName: 'Auto Test Type',
        },
      ],
    };

    logDivider('Update Contract');
    const updateResult = await invokeController(contractController.updateContract, { params: { id: createdId }, body: updatePayload });
    console.log('status:', updateResult.status);
    console.log('updated number:', updateResult.body?.data?.contract?.contractNumber);

    logDivider('Import Contracts');
    const importContracts = [
      {
        contractNumber: `${TEST_PREFIX}B-${timestamp}`,
        partyAName: 'Import Party 1',
        products: [{ productName: 'Import Product 1', quantity: '20', unitPrice: '100', totalAmount: '2000' }],
        terms: ['Imported term 1'],
      },
      {
        contractNumber: `${TEST_PREFIX}C-${timestamp}`,
        partyAName: 'Import Party 2',
        startProduction: 'Scheduled',
        products: [{ productName: 'Import Product 2', quantity: '40', unitPrice: '80', totalAmount: '3200' }],
      },
    ];
    const importResult = await invokeController(contractController.importContracts, { body: { contracts: importContracts } });
    console.log('status:', importResult.status);
    console.log('import summary:', importResult.body?.data);

    logDivider('Delete Contract');
    const deleteResult = await invokeController(contractController.deleteContract, { params: { id: createdId } });
    console.log('status:', deleteResult.status);
    console.log('response:', deleteResult.body);

    const importedContracts = importResult.body?.data?.contracts || [];
    const importIds = importedContracts.map(item => item.id).filter(Boolean);
    const importProductCleanup = importIds.length
      ? await ContractProduct.destroy({ where: { contractId: { [Op.in]: importIds } } })
      : 0;
    if (importIds.length) {
      await Contract.destroy({ where: { id: { [Op.in]: importIds } } });
    }

    // Ensure the updated contract version is gone (deleteContract should handle it)
    const residual = await Contract.findByPk(createdId);
    if (residual) {
      await ContractProduct.destroy({ where: { contractId: createdId } });
      await Contract.destroy({ where: { id: createdId } });
    }

    console.log('\nCleanup removed products:', importProductCleanup);
    console.log('All simulated contract controller tests completed successfully.');
  } catch (error) {
    console.error('Test run failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
