// 简化版测试数据生成脚本
const path = require('path');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 直接使用数据库连接
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../backend/database/database.sqlite');
const db = new sqlite3.Database(dbPath);

// 测试数据
const testData = {
  processes: [
    { name: '设计', code: 'DESIGN', payRate: 50.00, payRateUnit: 'perHour', description: '产品设计阶段' },
    { name: '切割', code: 'CUT', payRate: 30.00, payRateUnit: 'perItem', description: '材料切割工序' },
    { name: '雕刻', code: 'CARVE', payRate: 45.00, payRateUnit: 'perItem', description: '精细雕刻工序' },
    { name: '打磨', code: 'POLISH', payRate: 25.00, payRateUnit: 'perItem', description: '表面打磨处理' },
    { name: '组装', code: 'ASSEMBLE', payRate: 35.00, payRateUnit: 'perItem', description: '产品组装工序' },
    { name: '质检', code: 'QC', payRate: 40.00, payRateUnit: 'perHour', description: '质量检查工序' },
    { name: '包装', code: 'PACK', payRate: 20.00, payRateUnit: 'perItem', description: '产品包装工序' }
  ],
  employees: [
    { name: '张三', code: 'EMP001', phone: '13800138001', status: 'active' },
    { name: '李四', code: 'EMP002', phone: '13800138002', status: 'active' },
    { name: '王五', code: 'EMP003', phone: '13800138003', status: 'active' },
    { name: '赵六', code: 'EMP004', phone: '13800138004', status: 'active' },
    { name: '钱七', code: 'EMP005', phone: '13800138005', status: 'active' }
  ],
  productTypes: [
    { name: '木雕工艺品', code: 'WOOD_CARVING', processSequence: '[1,2,3,6,7]' },
    { name: '金属工艺品', code: 'METAL_ART', processSequence: '[1,2,4,5,6,7]' },
    { name: '陶瓷工艺品', code: 'CERAMIC', processSequence: '[1,5,6,7]' }
  ]
};

async function generateTestData() {
  return new Promise((resolve, reject) => {
    console.log('开始生成测试数据...');
    
    db.serialize(() => {
      // 清空现有数据
      console.log('清空现有数据...');
      db.run('DELETE FROM ProductionRecords');
      db.run('DELETE FROM ContractProducts');
      db.run('DELETE FROM Contracts');
      db.run('DELETE FROM ProductTypes');
      db.run('DELETE FROM Processes');
      db.run('DELETE FROM Employees');

      // 插入工序数据
      console.log('插入工序数据...');
      const processStmt = db.prepare('INSERT INTO Processes (name, code, payRate, payRateUnit, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))');
      testData.processes.forEach(process => {
        processStmt.run(process.name, process.code, process.payRate, process.payRateUnit, process.description);
      });
      processStmt.finalize();

      // 插入员工数据
      console.log('插入员工数据...');
      const employeeStmt = db.prepare('INSERT INTO Employees (name, code, phone, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))');
      testData.employees.forEach(employee => {
        employeeStmt.run(employee.name, employee.code, employee.phone, employee.status);
      });
      employeeStmt.finalize();

      // 插入产品类型数据
      console.log('插入产品类型数据...');
      const productTypeStmt = db.prepare('INSERT INTO ProductTypes (name, code, processSequence, createdAt, updatedAt) VALUES (?, ?, ?, datetime("now"), datetime("now"))');
      testData.productTypes.forEach(productType => {
        productTypeStmt.run(productType.name, productType.code, productType.processSequence);
      });
      productTypeStmt.finalize();

      console.log('测试数据生成完成！');
      console.log('生成数据统计:');
      console.log(`- 工序: ${testData.processes.length} 个`);
      console.log(`- 员工: ${testData.employees.length} 个`);
      console.log(`- 产品类型: ${testData.productTypes.length} 个`);
      
      resolve();
    });
  });
}

// 运行生成函数
generateTestData()
  .then(() => {
    console.log('\n测试数据使用说明:');
    console.log('1. 管理后台地址: https://www.yidasoftware.xyz/shangyin/admin');
    console.log('2. 可以使用以下员工进行生产记录录入:');
    testData.employees.forEach(emp => console.log(`   - ${emp.name} (${emp.code})`));
    db.close();
  })
  .catch(err => {
    console.error('生成测试数据时出错:', err);
    db.close();
  });