const path = require('path');
// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const { sequelize } = require('../backend/models');
const { Contract, ContractProduct, ProductType, Process, Employee, ProductionRecord } = require('../backend/models');
...([SYSTEM: More diff content has been truncated for context window])

// 测试数据生成函数
async function generateTestData() {
  try {
    console.log('开始生成测试数据...');
    
    // 连接到数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 清空现有数据（可选，谨慎使用）
    console.log('清空现有数据...');
    await ProductionRecord.destroy({ where: {} });
    await ContractProduct.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await ProductType.destroy({ where: {} });
    await Process.destroy({ where: {} });
    await Employee.destroy({ where: {} });

    // 1. 创建工序数据
    console.log('创建工序数据...');
    const processes = await Process.bulkCreate([
      { name: '设计', code: 'DESIGN', payRate: 50.00, payRateUnit: 'perHour', description: '产品设计阶段' },
      { name: '切割', code: 'CUT', payRate: 30.00, payRateUnit: 'perItem', description: '材料切割工序' },
      { name: '雕刻', code: 'CARVE', payRate: 45.00, payRateUnit: 'perItem', description: '精细雕刻工序' },
      { name: '打磨', code: 'POLISH', payRate: 25.00, payRateUnit: 'perItem', description: '表面打磨处理' },
      { name: '组装', code: 'ASSEMBLE', payRate: 35.00, payRateUnit: 'perItem', description: '产品组装工序' },
      { name: '质检', code: 'QC', payRate: 40.00, payRateUnit: 'perHour', description: '质量检查工序' },
      { name: '包装', code: 'PACK', payRate: 20.00, payRateUnit: 'perItem', description: '产品包装工序' }
    ]);

    // 2. 创建员工数据
    console.log('创建员工数据...');
    const employees = await Employee.bulkCreate([
      { name: '张三', code: 'EMP001', phone: '13800138001', status: 'active' },
      { name: '李四', code: 'EMP002', phone: '13800138002', status: 'active' },
      { name: '王五', code: 'EMP003', phone: '13800138003', status: 'active' },
      { name: '赵六', code: 'EMP004', phone: '13800138004', status: 'active' },
      { name: '钱七', code: 'EMP005', phone: '13800138005', status: 'active' }
    ]);

    // 3. 创建产品类型数据
    console.log('创建产品类型数据...');
    const productTypes = await ProductType.bulkCreate([
      { 
        name: '木雕工艺品', 
        code: 'WOOD_CARVING',
        processSequence: JSON.stringify([processes[0].id, processes[1].id, processes[2].id, processes[5].id, processes[6].id])
      },
      { 
        name: '金属工艺品', 
        code: 'METAL_ART',
        processSequence: JSON.stringify([processes[0].id, processes[1].id, processes[3].id, processes[4].id, processes[5].id, processes[6].id])
      },
      { 
        name: '陶瓷工艺品', 
        code: 'CERAMIC',
        processSequence: JSON.stringify([processes[0].id, processes[4].id, processes[5].id, processes[6].id])
      }
    ]);

    // 4. 创建合同数据
    console.log('创建合同数据...');
    const contracts = await Contract.bulkCreate([
      {
        contractNumber: 'HT-2025001',
        partyAName: '上海艺术馆',
        partyBName: '上茚工艺品厂',
        signedDate: '2025-01-15',
        signedLocation: '上海市',
        isNewWoodBox: true,
        isNewDrawing: true,
        isDrawingReviewed: true,
        partyACompanyName: '上海艺术馆有限公司',
        partyAAddress: '上海市浦东新区艺术路123号',
        partyAContact: '张经理',
        partyAPhoneFax: '021-12345678',
        partyABank: '中国银行上海分行',
        partyABankNo: '102100099996',
        partyABankAccount: '1234567890123456',
        partyATaxNumber: '91310101MA1F123456',
        partyBCompanyName: '上茚工艺品有限公司',
        partyBAddress: '浙江省义乌市工艺园区88号',
        partyBContact: '李厂长',
        partyBPhoneFax: '0579-87654321',
        partyBBank: '工商银行义乌支行',
        partyBBankNo: '102200099997',
        partyBBankAccount: '6543210987654321',
        partyBTaxNumber: '91330782MA28B12345',
        clause1: '产品质量符合国家标准',
        clause2: '交货期限为签订后30天内',
        clause3: '付款方式为货到付款',
        clause4: '运输费用由乙方承担',
        clause5: '验收标准以样品为准',
        remark: '首批样品需经甲方确认'
      },
      {
        contractNumber: 'HT-2025002',
        partyAName: '北京文化公司',
        partyBName: '上茚工艺品厂',
        signedDate: '2025-02-20',
        signedLocation: '北京市',
        isNewWoodBox: false,
        isNewDrawing: true,
        isDrawingReviewed: false,
        partyACompanyName: '北京文化传播有限公司',
        partyAAddress: '北京市朝阳区文化路456号',
        partyAContact: '王总监',
        partyAPhoneFax: '010-87654321',
        partyABank: '建设银行北京分行',
        partyABankNo: '105100088885',
        partyABankAccount: '9876543210987654',
        partyATaxNumber: '91110108MA01X12345',
        partyBCompanyName: '上茚工艺品有限公司',
        partyBAddress: '浙江省义乌市工艺园区88号',
        partyBContact: '李厂长',
        partyBPhoneFax: '0579-87654321',
        partyBBank: '工商银行义乌支行',
        partyBBankNo: '102200099997',
        partyBBankAccount: '6543210987654321',
        partyBTaxNumber: '91330782MA28B12345',
        clause1: '产品设计需经甲方审核',
        clause2: '分批交货，每批10件',
        clause3: '付款方式为30%预付款，70%货到付款',
        clause4: '包装要求防震防潮',
        clause5: '质保期一年',
        remark: '紧急订单，请优先安排生产'
      }
    ]);

    // 5. 创建合同产品数据
    console.log('创建合同产品数据...');
    const contractProducts = await ContractProduct.bulkCreate([
      {
        contractId: contracts[0].id,
        productTypeId: productTypes[0].id,
        productCode: 'P-001',
        productName: '龙凤呈祥木雕',
        specification: '30x20x15cm',
        carveWidth: '5mm',
        meshType: '细网',
        lineCount: '200',
        volumeRatio: '0.8',
        quantity: 50,
        unitPrice: 280.00,
        deliveryDeadline: '2025-03-15',
        totalAmount: 14000.00
      },
      {
        contractId: contracts[0].id,
        productTypeId: productTypes[0].id,
        productCode: 'P-002',
        productName: '福禄寿木雕',
        specification: '25x18x12cm',
        carveWidth: '3mm',
        meshType: '中网',
        lineCount: '150',
        volumeRatio: '0.7',
        quantity: 30,
        unitPrice: 320.00,
        deliveryDeadline: '2025-03-20',
        totalAmount: 9600.00
      },
      {
        contractId: contracts[1].id,
        productTypeId: productTypes[1].id,
        productCode: 'P-003',
        productName: '青铜鼎工艺品',
        specification: '15x15x20cm',
        carveWidth: '2mm',
        meshType: '密网',
        lineCount: '300',
        volumeRatio: '0.9',
        quantity: 20,
        unitPrice: 450.00,
        deliveryDeadline: '2025-04-10',
        totalAmount: 9000.00
      }
    ]);

    // 6. 创建生产记录数据
    console.log('创建生产记录数据...');
    const productionRecords = await ProductionRecord.bulkCreate([
      {
        contractId: contracts[0].id,
        contractProductId: contractProducts[0].id,
        processId: processes[0].id,
        employeeId: employees[0].id,
        quantity: 10,
        actualTimeMinutes: 120,
        payAmount: 100.00,
        notes: '首批设计完成，效果良好'
      },
      {
        contractId: contracts[0].id,
        contractProductId: contractProducts[0].id,
        processId: processes[1].id,
        employeeId: employees[1].id,
        quantity: 10,
        actualTimeMinutes: 180,
        payAmount: 300.00,
        notes: '材料切割完成，精度达标'
      },
      {
        contractId: contracts[0].id,
        contractProductId: contractProducts[0].id,
        processId: processes[2].id,
        employeeId: employees[2].id,
        quantity: 5,
        actualTimeMinutes: 240,
        payAmount: 225.00,
        notes: '精细雕刻进行中'
      },
      {
        contractId: contracts[1].id,
        contractProductId: contractProducts[2].id,
        processId: processes[0].id,
        employeeId: employees[3].id,
        quantity: 5,
        actualTimeMinutes: 150,
        payAmount: 125.00,
        notes: '青铜鼎设计初稿完成'
      },
      {
        contractId: contracts[1].id,
        contractProductId: contractProducts[2].id,
        processId: processes[3].id,
        employeeId: employees[4].id,
        quantity: 5,
        actualTimeMinutes: 200,
        payAmount: 125.00,
        notes: '表面打磨处理'
      }
    ]);

    console.log('测试数据生成完成！');
    console.log('\n生成数据统计:');
    console.log(`- 工序: ${processes.length} 个`);
    console.log(`- 员工: ${employees.length} 个`);
    console.log(`- 产品类型: ${productTypes.length} 个`);
    console.log(`- 合同: ${contracts.length} 个`);
    console.log(`- 合同产品: ${contractProducts.length} 个`);
    console.log(`- 生产记录: ${productionRecords.length} 条`);

    console.log('\n测试数据使用说明:');
    console.log('1. 管理后台地址: https://www.yidasoftware.xyz/shangyin/admin');
    console.log('2. 可以使用以下员工进行生产记录录入:');
    employees.forEach(emp => console.log(`   - ${emp.name} (${emp.code})`));
    console.log('3. 合同编号: HT-2025001, HT-2025002');

  } catch (error) {
    console.error('生成测试数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果是直接运行此脚本，则执行生成函数
if (require.main === module) {
  generateTestData();
}

module.exports = generateTestData;