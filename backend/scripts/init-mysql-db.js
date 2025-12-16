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

    console.log(`发现 ${tableNames.length} 个表:`, tableNames);

    if (tableNames.length === 0) {
      console.log('数据库为空，正在创建表结构...');
      
      // 创建所有表
      await sequelize.sync({ force: false, alter: true });
      console.log('✓ 所有表结构创建完成');
    } else {
      console.log('数据库不为空，检查表结构...');
      
      // 检查是否需要同步结构（使用alter选项更新表结构）
      await sequelize.sync({ alter: true });
      console.log('✓ 表结构同步完成');
    }

    // 检查关键表是否存在
    const requiredTables = [
      'users', 'employees', 'processes', 'product_types', 'contracts', 
      'contract_products', 'process_records', 'product_type_processes', 'employee_processes'
    ];
    
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    if (missingTables.length > 0) {
      console.log(`发现缺失表:`, missingTables);
      
      // 对于缺失的表，执行完整的同步
      await sequelize.sync({ force: false });
      console.log('✓ 缺失表结构已创建');
    }

    // 检查是否需要添加默认数据（如果数据库是空的）
    if (tableNames.length === 0 || missingTables.length > 0) {
      console.log('检查默认数据...');
      
      // 检查是否存在管理员用户
      const userCount = await User.count();
      if (userCount === 0) {
        console.log('创建默认管理员用户...');
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
      }
      
      // 检查是否存在默认工序
      const processCount = await Process.count();
      if (processCount === 0) {
        console.log('创建默认工序...');
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
      }
    }

    console.log('数据库初始化完成！');
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