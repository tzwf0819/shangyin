/**
 * MySQL数据库初始化脚本
 * 检测数据库架构，如果不存在或结构不符则自动创建
 */

const path = require('path');
const { sequelize, User, Employee, ProductType, Process, Contract, ContractProduct, Product, ProcessRecord, ProductTypeProcess, EmployeeProcess } = require(path.join(__dirname, '../models'));
const { QueryTypes } = require('sequelize');

async function initializeDatabase() {
  try {
    console.log('开始初始化MySQL数据库...');

    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');

    // 检查数据库是否为空
    const showTablesQuery = 'SHOW TABLES;';
    let tables;
    try {
      tables = await sequelize.query(showTablesQuery, {
        type: QueryTypes.SELECT,
        raw: true
      });
    } catch (error) {
      console.log('无法显示表列表:', error.message);
      tables = [];
    }

    const tableNames = tables.map(row => {
      // MySQL的SHOW TABLES结果可能有不同的键名
      return row.Tables_in_shangyin || row['Tables_in_' + (process.env.DB_NAME || 'shangyin')] || row.table_name;
    }).filter(name => name);

    console.log(`发现 ${tableNames.length} 个表:`, JSON.stringify(tableNames, null, 2));

    // 检查表结构详细信息
    console.log('\n=== 数据库结构检测报告 ===');
    for (const tableName of tableNames) {
      try {
        const columns = await sequelize.query(`DESCRIBE \`${tableName}\`;`, {
          type: QueryTypes.SELECT
        });
        console.log(`- 表 ${tableName}: ${columns.length} 个字段`);
      } catch (columnError) {
        console.log(`- 表 ${tableName}: 无法获取字段信息 (${columnError.message})`);
      }
    }

    // 检查关键表是否存在
    const requiredTables = [
      'users', 'employees', 'processes', 'product_types', 'contract_records',
      'contract_products', 'process_records', 'product_type_processes', 'employee_processes'
    ];

    const existingTables = new Set(tableNames);
    const missingTables = requiredTables.filter(table => !existingTables.has(table));
    const existingRequiredTables = requiredTables.filter(table => existingTables.has(table));

    console.log(`\n关键表状态:`);
    console.log(`- 已存在关键表 (${existingRequiredTables.length}/${requiredTables.length}):`, existingRequiredTables);
    if (missingTables.length > 0) {
      console.log(`- 缺失关键表 (${missingTables.length}):`, missingTables);
    } else {
      console.log('- 所有关键表都已存在');
    }

    if (tableNames.length === 0) {
      console.log('\n📋 操作: 数据库为空，正在创建所有表结构...');
      console.log('执行: sequelize.sync({ force: false, alter: true })');

      // 创建所有表
      await sequelize.sync({ force: false, alter: true });
      console.log('✓ 所有表结构创建完成');
    } else {
      console.log('\n📋 操作: 数据库不为空，将检查并同步表结构...');

      // 获取表结构前的状态
      const initialProcessCount = await Process.count().catch(() => 0);
      const initialEmployeeCount = await Employee.count().catch(() => 0);
      const initialContractCount = await Contract.count().catch(() => 0);

      console.log(`初始状态 - 工序: ${initialProcessCount}, 员工: ${initialEmployeeCount}, 合同: ${initialContractCount}`);

      if (missingTables.length > 0) {
        console.log(`发现缺失表，正在创建:`, missingTables);
        await sequelize.sync({ force: false });
        console.log('✓ 缺失表结构已创建');
      } else {
        console.log('开始同步现有表结构...');
        await sequelize.sync({ alter: true });
        console.log('✓ 表结构同步完成（无缺失表）');
      }
    }

    // 检查是否需要添加默认数据（如果数据库是空的）
    if (tableNames.length === 0 || missingTables.length > 0) {
      console.log('\n📋 操作: 检查并添加默认数据...');

      // 检查是否存在管理员用户
      const userCount = await User.count();
      if (userCount === 0) {
        console.log('→ 创建默认管理员用户...');
        await User.create({
          openId: 'default_admin',
          nickname: '系统管理员',
          avatarUrl: '',
          gender: 0,
          city: '',
          province: '',
          country: '',
          language: 'zh_CN',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✓ 默认管理员用户创建成功');
      } else {
        console.log('→ 管理员用户已存在，跳过创建');
      }

      // 检查是否存在默认工序
      const processCount = await Process.count();
      if (processCount === 0) {
        console.log('→ 创建默认工序...');
        const defaultProcesses = [
          { name: '粗加工', description: '初步加工处理', payRate: 10.00, payRateUnit: 'perItem' },
          { name: '精加工', description: '精确加工处理', payRate: 15.00, payRateUnit: 'perItem' },
          { name: '检验', description: '质量检验', payRate: 5.00, payRateUnit: 'perItem' },
          { name: '包装', description: '产品包装', payRate: 3.00, payRateUnit: 'perItem' }
        ];

        for (const process of defaultProcesses) {
          await Process.create({
            name: process.name,
            description: process.description,
            payRate: process.payRate,
            payRateUnit: process.payRateUnit,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        console.log(`✓ 创建了 ${defaultProcesses.length} 个默认工序`);
      } else {
        console.log(`→ 已有 ${processCount} 个工序，跳过默认工序创建`);
      }
    } else {
      console.log('\n📋 操作: 数据库已有数据，跳过默认数据创建');
    }

    // 最终检查
    console.log('\n=== 初始化完成状态 ===');
    const finalProcessCount = await Process.count().catch(() => 0);
    const finalEmployeeCount = await Employee.count().catch(() => 0);
    const finalContractCount = await Contract.count().catch(() => 0);
    console.log(`最终状态 - 工序: ${finalProcessCount}, 员工: ${finalEmployeeCount}, 合同: ${finalContractCount}`);

    console.log('\n数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('数据库初始化脚本执行成功');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据库初始化脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;