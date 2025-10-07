#!/usr/bin/env node
/**
 * 生成演示数据脚本
 *
 * 说明：
 * 1. 会清空与工序、合同、员工相关的主要业务表，请谨慎运行；
 * 2. 默认读取 NODE_ENV 对应的数据库配置，若未设置则使用 production；
 * 3. 适用于首次部署或数据库丢失后的快速恢复。
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const {
  sequelize,
  Process,
  Employee,
  ProductType,
  ProductTypeProcess,
  Contract,
  ContractProduct,
  ProcessRecord,
  EmployeeProcess,
} = require('../backend/models');

function logStep(message) {
  console.log(`=> ${message}`);
}

function formatDateFromNow(daysOffset) {
  const now = new Date();
  now.setDate(now.getDate() + daysOffset);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function truncateTables(transaction) {
  const models = [
    ProcessRecord,
    EmployeeProcess,
    ProductTypeProcess,
    ContractProduct,
    Contract,
    ProductType,
    Process,
    Employee,
  ];

  for (const model of models) {
    await model.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true,
      transaction,
    }).catch(async () => {
      // SQLite 对部分选项不支持，回退为普通删除
      await model.destroy({ where: {}, transaction });
      if (sequelize.getDialect() === 'sqlite') {
        const tableName = model.getTableName();
        await sequelize.query(`DELETE FROM sqlite_sequence WHERE name='${tableName}'`, { transaction }).catch(() => {});
      }
    });
  }
}

async function generateTestData() {
  const transaction = await sequelize.transaction();

  try {
    logStep('连接数据库...');
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    logStep('清理旧数据...');
    await truncateTables(transaction);

    logStep('创建工序...');
    const processes = await Process.bulkCreate(
      [
        { name: '设计', code: 'DESIGN', description: '完成图纸设计方案', payRate: 80, payRateUnit: 'perHour' },
        { name: '雕刻', code: 'CARVE', description: '按图纸雕刻木材', payRate: 45, payRateUnit: 'perItem' },
        { name: '打磨', code: 'POLISH', description: '表面精细打磨', payRate: 30, payRateUnit: 'perItem' },
        { name: '质检', code: 'QC', description: '整体质量检查', payRate: 60, payRateUnit: 'perHour' },
        { name: '包装', code: 'PACK', description: '成品安全包装', payRate: 18, payRateUnit: 'perItem' },
      ],
      { transaction, returning: true },
    );

    logStep('创建员工...');
    const employees = await Employee.bulkCreate(
      [
        { name: '张三', code: 'EMP001', phone: '13800138001', status: 'active' },
        { name: '李四', code: 'EMP002', phone: '13800138002', status: 'active' },
        { name: '王五', code: 'EMP003', phone: '13800138003', status: 'active' },
      ],
      { transaction, returning: true },
    );

    logStep('设置员工工序能力...');
    await EmployeeProcess.bulkCreate(
      [
        { employeeId: employees[0].id, processId: processes[0].id, status: 'active', assignedAt: new Date() },
        { employeeId: employees[0].id, processId: processes[1].id, status: 'active', assignedAt: new Date() },
        { employeeId: employees[1].id, processId: processes[2].id, status: 'active', assignedAt: new Date() },
        { employeeId: employees[1].id, processId: processes[3].id, status: 'active', assignedAt: new Date() },
        { employeeId: employees[2].id, processId: processes[4].id, status: 'active', assignedAt: new Date() },
      ],
      { transaction },
    );

    logStep('创建产品类型...');
    const productTypes = await ProductType.bulkCreate(
      [
        { name: '艺术木雕', code: 'WOOD_ART', status: 'active' },
        { name: '金属工艺', code: 'METAL_ART', status: 'active' },
      ],
      { transaction, returning: true },
    );

    logStep('配置产品类型工序顺序...');
    await ProductTypeProcess.bulkCreate(
      [
        { productTypeId: productTypes[0].id, processId: processes[0].id, sequenceOrder: 1 },
        { productTypeId: productTypes[0].id, processId: processes[1].id, sequenceOrder: 2 },
        { productTypeId: productTypes[0].id, processId: processes[2].id, sequenceOrder: 3 },
        { productTypeId: productTypes[0].id, processId: processes[3].id, sequenceOrder: 4 },
        { productTypeId: productTypes[0].id, processId: processes[4].id, sequenceOrder: 5 },
        { productTypeId: productTypes[1].id, processId: processes[0].id, sequenceOrder: 1 },
        { productTypeId: productTypes[1].id, processId: processes[2].id, sequenceOrder: 2 },
        { productTypeId: productTypes[1].id, processId: processes[3].id, sequenceOrder: 3 },
        { productTypeId: productTypes[1].id, processId: processes[4].id, sequenceOrder: 4 },
      ],
      { transaction },
    );

    logStep('创建合同...');
    const contracts = await Contract.bulkCreate(
      [
        {
          contractNumber: 'HT-2025001',
          partyAName: '上海艺术馆',
          partyBName: '上茚工厂',
          signedDate: formatDateFromNow(-20),
          signedLocation: '上海',
          isNewWoodBox: true,
          isNewDrawing: true,
          isDrawingReviewed: true,
          remark: '首批艺术木雕合作项目',
        },
        {
          contractNumber: 'HT-2025002',
          partyAName: '北京文化公司',
          partyBName: '上茚工厂',
          signedDate: formatDateFromNow(-10),
          signedLocation: '北京',
          isNewWoodBox: false,
          isNewDrawing: true,
          isDrawingReviewed: false,
          remark: '定制礼品批量生产',
        },
      ],
      { transaction, returning: true },
    );

    logStep('创建合同产品...');
    const contractProducts = await ContractProduct.bulkCreate(
      [
        {
          contractId: contracts[0].id,
          productTypeId: productTypes[0].id,
          productCode: 'WOOD-001',
          productName: '祥瑞龙凤木雕',
          specification: '30×20×15cm',
          quantity: 20,
          unitPrice: 3800,
          totalAmount: 76000,
          deliveryDeadline: formatDateFromNow(15),
        },
        {
          contractId: contracts[0].id,
          productTypeId: productTypes[0].id,
          productCode: 'WOOD-002',
          productName: '祥和连年挂饰',
          specification: '45×25×8cm',
          quantity: 35,
          unitPrice: 2200,
          totalAmount: 77000,
          deliveryDeadline: formatDateFromNow(25),
        },
        {
          contractId: contracts[1].id,
          productTypeId: productTypes[1].id,
          productCode: 'METAL-001',
          productName: '定制纪念奖杯',
          specification: '28×10×10cm',
          quantity: 50,
          unitPrice: 980,
          totalAmount: 49000,
          deliveryDeadline: formatDateFromNow(18),
        },
      ],
      { transaction, returning: true },
    );

    logStep('插入工序生产记录...');
    await ProcessRecord.bulkCreate(
      [
        {
          contractId: contracts[0].id,
          contractProductId: contractProducts[0].id,
          processId: processes[0].id,
          employeeId: employees[0].id,
          employeeNameSnapshot: employees[0].name,
          quantity: 1,
          actualTimeMinutes: 240,
          payRateSnapshot: processes[0].payRate,
          payRateUnitSnapshot: processes[0].payRateUnit,
          payAmount: 320,
          notes: '完成初版设计稿',
        },
        {
          contractId: contracts[0].id,
          contractProductId: contractProducts[0].id,
          processId: processes[1].id,
          employeeId: employees[0].id,
          employeeNameSnapshot: employees[0].name,
          quantity: 2,
          actualTimeMinutes: 0,
          payRateSnapshot: processes[1].payRate,
          payRateUnitSnapshot: processes[1].payRateUnit,
          payAmount: 90,
          notes: '雕刻完成两件样品',
        },
        {
          contractId: contracts[0].id,
          contractProductId: contractProducts[0].id,
          processId: processes[2].id,
          employeeId: employees[1].id,
          employeeNameSnapshot: employees[1].name,
          quantity: 2,
          actualTimeMinutes: 0,
          payRateSnapshot: processes[2].payRate,
          payRateUnitSnapshot: processes[2].payRateUnit,
          payAmount: 60,
          notes: '打磨完成两件样品',
        },
        {
          contractId: contracts[1].id,
          contractProductId: contractProducts[2].id,
          processId: processes[3].id,
          employeeId: employees[1].id,
          employeeNameSnapshot: employees[1].name,
          quantity: 1,
          actualTimeMinutes: 90,
          payRateSnapshot: processes[3].payRate,
          payRateUnitSnapshot: processes[3].payRateUnit,
          payAmount: 90,
          notes: '完成首批质检',
        },
        {
          contractId: contracts[1].id,
          contractProductId: contractProducts[2].id,
          processId: processes[4].id,
          employeeId: employees[2].id,
          employeeNameSnapshot: employees[2].name,
          quantity: 10,
          actualTimeMinutes: 0,
          payRateSnapshot: processes[4].payRate,
          payRateUnitSnapshot: processes[4].payRateUnit,
          payAmount: 180,
          notes: '完成10件包装',
        },
      ],
      { transaction },
    );

    await transaction.commit();

    console.log('\n测试数据生成完成');
    console.log(`- 工序：${processes.length} 个`);
    console.log(`- 员工：${employees.length} 个`);
    console.log(`- 产品类型：${productTypes.length} 个`);
    console.log(`- 合同：${contracts.length} 份`);
    console.log(`- 合同产品：${contractProducts.length} 个`);
    console.log(`- 生产记录：5 条`);
  } catch (error) {
    await transaction.rollback();
    console.error('生成测试数据失败：', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  generateTestData();
}

module.exports = generateTestData;
