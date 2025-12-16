const { Op } = require('sequelize');
const {
  sequelize,
  Contract,
  ContractProduct,
  Employee,
  ProductType,
  ProcessRecord,
} = require('../models');

const MAX_PRODUCTS = 10;
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'y', 't', '是', '有', '已', '已完成', '已回款']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'n', 'f', '否', '无', '未', '未完成', '未回款']);

const CONTRACT_FIELD_MAP = {
  contractNumber: ['contractNumber', '合同编号'],
  partyAName: ['partyAName', '甲方', '甲方名称'],
  partyACompanyName: ['partyACompanyName', '甲方单位名称'],
  partyAAddress: ['partyAAddress', '甲方地址', '甲方单位地址'],
  partyAContact: ['partyAContact', '甲方联系人'],
  partyAPhoneFax: ['partyAPhoneFax', '甲方电话传真'],
  partyABank: ['partyABank', '甲方开户银行'],
  partyABankAccount: ['partyABankAccount', '甲方账号', '甲方帐号'],
  partyABankNo: ['partyABankNo', '甲方行号'],
  partyATaxNumber: ['partyATaxNumber', '甲方税号'],
  partyBName: ['partyBName', '乙方', '乙方名称'],
  partyBCompanyName: ['partyBCompanyName', '乙方单位名称'],
  partyBAddress: ['partyBAddress', '乙方地址', '乙方单位地址'],
  partyBContact: ['partyBContact', '乙方联系人'],
  partyBPhoneFax: ['partyBPhoneFax', '乙方电话传真'],
  partyBBank: ['partyBBank', '乙方开户银行'],
  partyBBankAccount: ['partyBBankAccount', '乙方账号', '乙方帐号'],
  partyBBankNo: ['partyBBankNo', '乙方行号'],
  partyBTaxNumber: ['partyBTaxNumber', '乙方税号'],
  signedDate: ['signedDate', '签订日期'],
  signedLocation: ['signedLocation', '签订地点'],
  status: ['status', '合同状态'],
  contractAttribute: ['contractAttribute', '合同属性'],
  deliveryDeadline: ['deliveryDeadline', '交货期限'],
  actualDeliveryDate: ['actualDeliveryDate', '实际交货日期'],
  settlementDate: ['settlementDate', '结清日期'],
  paymentStatus: ['paymentStatus', '是否回款'],
  paymentDate: ['paymentDate', '回款时间'],
  shippingDate: ['shippingDate', '出库日期'],
  salesId: ['salesId', '销售ID', '销售编号'],
  isNewArtwork: ['isNewArtwork', '是否新图'],
  isReviewed: ['isReviewed', '是否审核'],
  isScheduled: ['isScheduled', '是否排产'],
  inkCapacity: ['inkCapacity', '载墨量'],
  cellShape: ['cellShape', '网穴形状'],
  remark: ['remark', '备注'],
};

const PRODUCT_FIELD_MAP = {
  productId: ['productId', '产品ID'],
  productCode: ['productCode', '产品编号'],
  productName: ['productName', '产品名称'],
  specification: ['specification', '规格'],
  carveWidth: ['carveWidth', '雕宽'],
  meshType: ['meshType', '网型'],
  lineCount: ['lineCount', '线数'],
  volumeRatio: ['volumeRatio', '容积率'],
  inkVolume: ['inkVolume', '载墨量'],
  quantity: ['quantity', '数量'],
  unitPrice: ['unitPrice', '单价'],
  plateUnitPrice: ['plateUnitPrice', '平厘单价'],
  totalAmount: ['totalAmount', '总金额'],
  productTypeId: ['productTypeId', '产品类型ID'],
  productTypeName: ['productTypeName', '产品类型', '类型名称'],
  productTypeCode: ['productTypeCode', '产品类型编码', '类型编码'],
  cellShape: ['cellShape', '网穴形状'],
  newWoodBox: ['newWoodBox', '新木箱'],
};

const PROCESS_STATUS_ALIASES = {
  startProduction: ['开始生产', 'startProduction'],
  baseRollProcessing: ['基辊加工', 'baseRollProcessing'],
  thermalSpraying: ['热喷涂', 'thermalSpraying'],
  ceramicGrinding: ['陶瓷磨削', 'ceramicGrinding'],
  prePolishing: ['前续抛光', 'prePolishing'],
  laserEngraving: ['激光雕刻', 'laserEngraving'],
  postPolishing: ['后续抛光', 'postPolishing'],
  inspection: ['检验尺寸', 'inspection'],
  packaging: ['包装出库', 'packaging'],
};

const KNOWN_CONTRACT_KEYS = new Set([
  ...Object.values(CONTRACT_FIELD_MAP).flat(),
  'terms',
  'termsJson',
  'processStatus',
  'processStatusJson',
  'products',
  'productList',
  '产品列表',
]);

const KNOWN_PRODUCT_KEYS = new Set(Object.values(PRODUCT_FIELD_MAP).flat());
KNOWN_PRODUCT_KEYS.add('id');

const normalizeText = value => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const normalizeBoolean = value => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  if (TRUE_VALUES.has(lower) || TRUE_VALUES.has(text)) return true;
  if (FALSE_VALUES.has(lower) || FALSE_VALUES.has(text)) return false;
  return null;
};

const pickFirst = (source = {}, aliases = []) => {
  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          if (value.trim() !== '') {
            return value;
          }
        } else {
          return value;
        }
      }
    }
  }
  return null;
};

const collectTerms = payload => {
  if (Array.isArray(payload?.terms)) {
    return payload.terms.map(item => normalizeText(item)).filter(Boolean);
  }

  const terms = [];
  const digits = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  digits.forEach((digit, index) => {
    const value = pickFirst(payload, [`条款${digit}`, `条款${index + 1}`]);
    const text = normalizeText(value);
    if (text) {
      terms.push(text);
    }
  });
  return terms;
};

const collectProcessStatus = payload => {
  const status = {};
  Object.entries(PROCESS_STATUS_ALIASES).forEach(([key, aliases]) => {
    const value = pickFirst(payload, aliases);
    const text = normalizeText(value);
    if (text) {
      status[key] = text;
    }
  });
  return status;
};

const collectProductCandidates = payload => {
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.productList)) return payload.productList;
  if (Array.isArray(payload['产品列表'])) return payload['产品列表'];
  const indicator = pickFirst(payload, PRODUCT_FIELD_MAP.productName);
  return indicator ? [payload] : [];
};

const normalizeProduct = (source = {}, index = 0) => {
  const product = {
    productIndex: index + 1,
  };

  const existingId = source && Object.prototype.hasOwnProperty.call(source, 'id') ? source.id : undefined;
  if (existingId !== null && existingId !== undefined && `${existingId}` !== '') {
    const numericId = Number(existingId);
    product.id = Number.isNaN(numericId) ? existingId : numericId;
  }

  Object.entries(PRODUCT_FIELD_MAP).forEach(([field, aliases]) => {
    const value = pickFirst(source, aliases);
    if (value !== null && value !== undefined) {
      if (field === 'newWoodBox') {
        const boolValue = normalizeBoolean(value);
        if (boolValue !== null) {
          product[field] = boolValue;
        }
      } else {
        product[field] = normalizeText(value) ?? value;
      }
    }
  });

  const extraInfo = {};
  Object.keys(source).forEach(key => {
    if (!KNOWN_PRODUCT_KEYS.has(key)) {
      extraInfo[key] = source[key];
    }
  });
  if (Object.keys(extraInfo).length) {
    product.extraInfo = extraInfo;
  }

  return product;
};

const normalizeContractPayload = (payload = {}) => {
  const contractData = {};
  Object.entries(CONTRACT_FIELD_MAP).forEach(([field, aliases]) => {
    const value = pickFirst(payload, aliases);
    if (value !== null && value !== undefined) {
      if (['isNewArtwork', 'isReviewed', 'isScheduled'].includes(field)) {
        const boolValue = normalizeBoolean(value);
        if (boolValue !== null) {
          contractData[field] = boolValue;
        }
      } else {
        contractData[field] = normalizeText(value) ?? value;
      }
    }
  });

  const terms = collectTerms(payload);
  const processStatus = collectProcessStatus(payload);
  const rawProducts = collectProductCandidates(payload);
  const products = rawProducts.map((item, index) => normalizeProduct(item, index));

  const extraInfo = {};
  Object.keys(payload || {}).forEach(key => {
    if (!KNOWN_CONTRACT_KEYS.has(key)) {
      extraInfo[key] = payload[key];
    }
  });

  return {
    contractData,
    terms,
    processStatus,
    extraInfo,
    products,
    rawPayload: payload,
  };
};

const parseJSON = value => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const formatContract = contract => {
  if (!contract) return null;
  const plain = typeof contract.toJSON === 'function' ? contract.toJSON() : { ...contract };

  plain.terms = parseJSON(plain.termsJson) || [];
  plain.processStatus = parseJSON(plain.processStatusJson) || {};
  plain.extraInfo = parseJSON(plain.extraInfoJson) || {};
  plain.rawData = parseJSON(plain.rawDataJson) || {};

  if (Array.isArray(plain.products)) {
    plain.products = plain.products.map((product, index) => {
      const item = { ...product };
      item.extraInfo = parseJSON(item.extraInfoJson) || {};
      delete item.extraInfoJson;
      let normalizedTypeId = normalizeText(item.productTypeId);
      if (normalizedTypeId === null && plain.rawData && Array.isArray(plain.rawData.products)) {
        const rawProduct = plain.rawData.products[index] || {};
        normalizedTypeId = normalizeText(rawProduct.productTypeId);
        if (normalizedTypeId !== null) {
          item.productTypeId = normalizedTypeId;
        }
        const rawTypeName = rawProduct.productTypeName || rawProduct.productType || rawProduct.productTypeCode;
        if (!item.productTypeName && rawTypeName) {
          item.productTypeName = rawTypeName;
        }
        if (!item.productType && rawTypeName) {
          item.productType = rawTypeName;
        }
        if (!item.productTypeCode && rawProduct.productTypeCode) {
          item.productTypeCode = rawProduct.productTypeCode;
        }
      }
      item.productTypeId = normalizedTypeId !== null ? normalizedTypeId : '';
      if (!item.productTypeName && item.productType) {
        item.productTypeName = item.productType;
      }
      if (!item.productType && item.productTypeName) {
        item.productType = item.productTypeName;
      }
      if (!item.productTypeCode) {
        item.productTypeCode = item.productType || '';
      }
      if (item.newWoodBox !== null && item.newWoodBox !== undefined) {
        item.newWoodBox = normalizeBoolean(item.newWoodBox);
      }
      return item;
    });
  }

  delete plain.termsJson;
  delete plain.processStatusJson;
  delete plain.extraInfoJson;
  delete plain.rawDataJson;

  return plain;
};

const resolveSalesReference = async (contractData, transaction) => {
  const salesId = normalizeText(contractData.salesId);
  if (!salesId) {
    contractData.salesEmployeeId = null;
    return;
  }

  let employee = null;
  const numeric = Number(salesId);
  if (!Number.isNaN(numeric)) {
    employee = await Employee.findOne({
      where: {
        [Op.or]: [
          { id: numeric },
          { code: salesId },
        ],
      },
      transaction,
    });
  } else {
    employee = await Employee.findOne({
      where: { code: salesId },
      transaction,
    });
  }

  if (employee) {
    contractData.salesEmployeeId = employee.id;
    contractData.salesId = contractData.salesId || employee.code || `${employee.id}`;
  } else {
    contractData.salesEmployeeId = null;
  }
};

const productTypeCache = () => ({
  byId: new Map(),
  byCode: new Map(),
  byName: new Map(),
});

const lookupProductType = async (product, cache, transaction) => {
  const cacheLookup = async (bucket, key, finder) => {
    const normalized = normalizeText(key);
    if (!normalized) return null;
    if (cache[bucket].has(normalized)) {
      return cache[bucket].get(normalized);
    }
    const record = await finder(normalized);
    cache[bucket].set(normalized, record || null);
    return record;
  };

  const findById = async value => {
    const id = Number(value);
    if (Number.isNaN(id)) return null;
    return ProductType.findByPk(id, { transaction });
  };

  const findByCode = value => ProductType.findOne({ where: { code: value }, transaction });
  const findByName = value => ProductType.findOne({ where: { name: value }, transaction });

  let record = null;
  if (!record && product.productTypeId) {
    record = await cacheLookup('byId', product.productTypeId, findById);
  }
  if (!record && product.productTypeCode) {
    record = await cacheLookup('byCode', product.productTypeCode, findByCode);
  }
  if (!record && product.productTypeName) {
    record = await cacheLookup('byName', product.productTypeName, findByName);
  }

  return record;
};


const buildContractProductPayload = (input = {}, { contractId, index }) => {
  const {
    extraInfo: productExtra = {},
    id,
    productTypeCode,
    newWoodBox,
    ...rest
  } = input || {};

  const payload = {
    ...rest,
    productIndex: index,
    extraInfoJson: JSON.stringify(productExtra || {}),
  };

  if (contractId !== undefined) {
    payload.contractId = contractId;
  }

  const normalizedTypeId = normalizeText(rest.productTypeId ?? input.productTypeId);
  payload.productTypeId = normalizedTypeId || null;

  const resolvedTypeName = rest.productTypeName ?? input.productTypeName ?? rest.productType ?? input.productType;
  if (resolvedTypeName !== undefined) {
    payload.productTypeName = resolvedTypeName || '';
  }

  if (productTypeCode !== undefined) {
    payload.productType = productTypeCode || '';
  } else if (payload.productTypeName && !payload.productType) {
    payload.productType = payload.productTypeName;
  }

  if (newWoodBox !== undefined) {
    payload.newWoodBox = newWoodBox === null ? null : Boolean(newWoodBox);
  }

  return { id, payload };
};


const resolveProductReferences = async (products, transaction) => {
  if (!products.length) return;
  const cache = productTypeCache();
  for (const product of products) {
    const record = await lookupProductType(product, cache, transaction);
    if (record) {
      product.productTypeId = record.id;
      product.productTypeName = record.name;
      product.productTypeCode = record.code;
    }
  }
};

const persistContract = async (normalized, transaction) => {
  const { contractData, terms, processStatus, extraInfo, products, rawPayload } = normalized;

  await resolveSalesReference(contractData, transaction);
  await resolveProductReferences(products, transaction);

  const productRows = products.map((product, index) => {
    const { payload: productPayload } = buildContractProductPayload(product, {
      index: index + 1,
    });
    delete productPayload.contractId;
    return productPayload;
  });

  const payload = {
    ...contractData,
    termsJson: JSON.stringify(terms),
    processStatusJson: JSON.stringify(processStatus),
    extraInfoJson: JSON.stringify(extraInfo),
    rawDataJson: JSON.stringify(rawPayload),
    products: productRows,
  };

  return Contract.create(payload, {
    include: [{ model: ContractProduct, as: 'products' }],
    transaction,
  });
};

const updateContractRecord = async (contract, normalized, transaction) => {
  const { contractData, terms, processStatus, extraInfo, products, rawPayload } = normalized;

  await resolveSalesReference(contractData, transaction);
  await resolveProductReferences(products, transaction);

  await contract.update(
    {
      ...contractData,
      termsJson: JSON.stringify(terms),
      processStatusJson: JSON.stringify(processStatus),
      extraInfoJson: JSON.stringify(extraInfo),
      rawDataJson: JSON.stringify(rawPayload),
    },
    { transaction }
  );

  const existingProducts = await ContractProduct.findAll({
    where: { contractId: contract.id },
    transaction,
  });
  const existingMap = new Map(existingProducts.map(item => [item.id, item]));
  const retainedIds = new Set();
  let orderCounter = 1;

  for (const product of products) {
    const { payload: productPayload, id } = buildContractProductPayload(product, {
      contractId: contract.id,
      index: orderCounter,
    });
    orderCounter += 1;

    const numericId = Number(id);
    if (!Number.isNaN(numericId) && existingMap.has(numericId)) {
      await existingMap.get(numericId).update(productPayload, { transaction });
      retainedIds.add(numericId);
    } else {
      await ContractProduct.create(productPayload, { transaction });
    }
  }

  const removable = existingProducts.filter(item => !retainedIds.has(item.id));
  if (removable.length) {
    const removableIds = removable.map(item => item.id);
    const inUseCount = await ProcessRecord.count({
      where: { contractProductId: removableIds },
      transaction,
    });
    if (inUseCount > 0) {
      const error = new Error('CONTRACT_PRODUCT_IN_USE');
      error.code = 'CONTRACT_PRODUCT_IN_USE';
      error.meta = { productIds: removableIds };
      throw error;
    }
    await ContractProduct.destroy({ where: { id: removableIds }, transaction });
  }

  return Contract.findByPk(contract.id, {
    include: [{ model: ContractProduct, as: 'products' }],
    transaction,
  });
};

const ensureArray = value => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

const validateNormalizedPayload = normalized => {
  if (!normalizeText(normalized.contractData.contractNumber)) {
    return '合同编号不能为空';
  }
  if (!normalized.products.length) {
    return '合同需要至少包含一个成品';
  }
  if (normalized.products.length > MAX_PRODUCTS) {
    return `合同成品不能超过 ${MAX_PRODUCTS} 个`;
  }
  return null;
};

exports.listContracts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, salesId, dateFrom, dateTo } = req.query;
    const limit = Math.min(Number(pageSize) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const offset = (currentPage - 1) * limit;

    const whereClause = {};
    const orConditions = [];

    if (status) {
      whereClause.status = status;
    }
    if (keyword) {
      orConditions.push(
        { contractNumber: { [Op.like]: `%${keyword}%` } },
        { partyAName: { [Op.like]: `%${keyword}%` } },
        { partyBName: { [Op.like]: `%${keyword}%` } }
      );
    }
    if (salesId) {
      orConditions.push({ salesId: { [Op.like]: `%${salesId}%` } });
    }

    if (orConditions.length) {
      whereClause[Op.or] = orConditions;
    }

    const createdAtRange = {};
    const parsedFrom = dateFrom ? new Date(dateFrom) : null;
    const parsedTo = dateTo ? new Date(dateTo) : null;
    if (!Number.isNaN(parsedFrom?.valueOf())) {
      createdAtRange[Op.gte] = parsedFrom;
    }
    if (!Number.isNaN(parsedTo?.valueOf())) {
      createdAtRange[Op.lte] = parsedTo;
    }
    if (Object.keys(createdAtRange).length) {
      whereClause.createdAt = createdAtRange;
    }

    const { rows, count } = await Contract.findAndCountAll({
      where: Object.keys(whereClause).length ? whereClause : undefined,
      limit,
      offset,
      order: [['createdAt', 'DESC'], [{ model: ContractProduct, as: 'products' }, 'id', 'ASC']],
      include: [{ model: ContractProduct, as: 'products' }],
    });

    res.json({
      success: true,
      data: {
        pagination: {
          page: currentPage,
          pageSize: limit,
          total: count,
        },
        items: rows.map(formatContract),
      },
    });
  } catch (error) {
    console.error('查询合同列表失败:', error);
    res.status(500).json({ success: false, message: '查询合同列表失败' });
  }
};

exports.getContractDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findByPk(id, {
      include: [{ model: ContractProduct, as: 'products' }],
    });

    if (!contract) {
      return res.status(404).json({ success: false, message: '合同不存在' });
    }

    res.json({ success: true, data: { contract: formatContract(contract) } });
  } catch (error) {
    console.error('获取合同详情失败:', error);
    res.status(500).json({ success: false, message: '获取合同详情失败' });
  }
};

exports.createContract = async (req, res) => {
  try {
    const normalized = normalizeContractPayload(req.body || {});
    const validationError = validateNormalizedPayload(normalized);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const exists = await Contract.findOne({
      where: { contractNumber: normalized.contractData.contractNumber },
    });
    if (exists) {
      return res.status(409).json({ success: false, message: '合同编号已存在' });
    }

    const contract = await sequelize.transaction(transaction =>
      persistContract(normalized, transaction)
    );

    res.json({ success: true, message: '合同创建成功', data: { contract: formatContract(contract) } });
  } catch (error) {
    console.error('创建合同失败:', error);
    res.status(500).json({ success: false, message: '创建合同失败' });
  }
};

exports.updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const normalized = normalizeContractPayload(req.body || {});
    const validationError = validateNormalizedPayload(normalized);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ success: false, message: '合同不存在' });
    }

    if (
      normalizeText(normalized.contractData.contractNumber) &&
      normalized.contractData.contractNumber !== contract.contractNumber
    ) {
      const exists = await Contract.findOne({
        where: { contractNumber: normalized.contractData.contractNumber },
      });
      if (exists) {
        return res.status(409).json({ success: false, message: '合同编号已存在' });
      }
    }

    const updated = await sequelize.transaction(transaction =>
      updateContractRecord(contract, normalized, transaction)
    );

    res.json({ success: true, message: '合同更新成功', data: { contract: formatContract(updated) } });
  } catch (error) {
    if (error && error.code === 'CONTRACT_PRODUCT_IN_USE') {
      return res.status(400).json({ success: false, message: '存在已被生产记录引用的合同产品，无法删除或替换。请先处理相关生产记录。' });
    }
    console.error('更新合同失败:', error);
    res.status(500).json({ success: false, message: '更新合同失败' });
  }
};
exports.deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true' || req.body.force === true; // 添加强制删除参数

    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ success: false, message: '合同不存在' });
    }

    await sequelize.transaction(async transaction => {
      // 检查是否存在关联的生产记录
      const productIds = (await ContractProduct.findAll({
        where: { contractId: contract.id },
        attributes: ['id'],
        transaction,
      })).map(p => p.id);

      if (productIds.length > 0) {
        const inUseCount = await ProcessRecord.count({
          where: { contractProductId: productIds },
          transaction,
        });

        if (inUseCount > 0 && !force) {
          // 如果存在关联记录且未强制删除，返回错误
          const error = new Error('CONTRACT_IN_USE');
          error.code = 'CONTRACT_IN_USE';
          error.meta = { productIds, processRecordCount: inUseCount };
          throw error;
        } else if (inUseCount > 0 && force) {
          // 如果存在关联记录但强制删除，则删除关联的生产记录
          await ProcessRecord.destroy({
            where: { contractProductId: productIds },
            transaction,
          });
        }
      }

      // 删除合同下的所有产品
      await ContractProduct.destroy({ where: { contractId: contract.id }, transaction });

      // 删除合同本身
      await contract.destroy({ transaction });
    });

    res.json({ success: true, message: '合同已删除' });
  } catch (error) {
    if (error && error.code === 'CONTRACT_IN_USE') {
      return res.status(400).json({
        success: false,
        message: '存在已被生产记录引用的合同产品，无法删除。请先处理相关生产记录，或使用 force=true 参数强制删除。',
        meta: error.meta
      });
    }
    console.error('删除合同失败:', error);
    res.status(500).json({ success: false, message: '删除合同失败' });
  }
};

exports.importContracts = async (req, res) => {
  try {
    const payloadContracts = ensureArray(req.body?.contracts);
    if (!payloadContracts.length) {
      return res.status(400).json({ success: false, message: '导入数据不能为空' });
    }

    const results = [];
    const errors = [];

    for (let index = 0; index < payloadContracts.length; index += 1) {
      const raw = payloadContracts[index];
      const normalized = normalizeContractPayload(raw || {});
      const validationError = validateNormalizedPayload(normalized);
      if (validationError) {
        errors.push({
          index,
          contractNumber: normalized.contractData.contractNumber,
          message: validationError,
        });
        continue;
      }

      const exists = await Contract.findOne({
        where: { contractNumber: normalized.contractData.contractNumber },
      });
      if (exists) {
        errors.push({
          index,
          contractNumber: normalized.contractData.contractNumber,
          message: '合同编号已存在',
        });
        continue;
      }

      try {
        const contract = await sequelize.transaction(transaction =>
          persistContract(normalized, transaction)
        );
        results.push(formatContract(contract));
      } catch (error) {
        console.error('导入合同失败:', error);
        errors.push({
          index,
          contractNumber: normalized.contractData.contractNumber,
          message: error.message || '导入失败',
        });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        successCount: results.length,
        failureCount: errors.length,
        contracts: results,
        errors,
      },
    });
  } catch (error) {
    console.error('批量导入合同失败:', error);
    res.status(500).json({ success: false, message: '批量导入合同失败' });
  }
};


