/**
 * 简化的数据库初始化测试
 */

require('dotenv').config();
const { sequelize } = require('../models');

async function testInit() {
  try {
    console.log('正在测试数据库初始化...');
    
    // 测试连接
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');
    
    const dialect = sequelize.getDialect();
    console.log('数据库方言:', dialect);
    
    // 打印当前配置信息
    console.log('连接配置:', {
      host: sequelize.config.host,
      port: sequelize.config.port,
      database: sequelize.config.database,
      username: sequelize.config.username
    });
    
    // 同步数据库结构
    console.log('正在同步数据库结构...');
    await sequelize.sync({ alter: true });
    console.log('✓ 数据库结构同步完成');
    
    // 检查已同步的表
    const tableNames = await sequelize.getQueryInterface().showAllTables();
    console.log('当前数据库表:', tableNames);
    
    if (tableNames.length === 0) {
      console.log('数据库仍然为空，正在手动创建表...');
      // 由于使用了 { alter: true }，表应该已经自动创建
      // 但如果仍然为空，我们可以手动定义一个测试表来验证
    } else {
      console.log(`数据库中有 ${tableNames.length} 个表`);
      
      // 检查特定的评分相关的表是否被正确创建
      const hasProcessRecords = tableNames.includes('process_records');
      if (hasProcessRecords) {
        console.log('✓ process_records 表已存在');
        
        // 获取表结构信息
        const tableDescription = await sequelize.getQueryInterface().describeTable('process_records');
        const hasRatingFields = 'rating' in tableDescription &&
                               'ratingEmployeeId' in tableDescription &&
                               'ratingEmployeeName' in tableDescription &&
                               'ratingTime' in tableDescription;
        
        if (hasRatingFields) {
          console.log('✓ 评分相关字段已正确添加到 process_records 表');
        } else {
          console.log('⚠ 评分相关字段可能未添加到 process_records 表');
        }
      } else {
        console.log('⚠ process_records 表不存在');
      }
    }
    
    console.log('\\n✓ 数据库初始化测试完成');
    
  } catch (err) {
    console.error('✗ 初始化错误:', err.message);
    console.error('错误详情:', err);
    throw err;
  }
}

// 执行测试
testInit()
  .then(() => {
    console.log('\\n✓ 所有测试完成，连接成功！');
    process.exit(0);
  })
  .catch(err => {
    console.error('\\n✗ 测试失败:', err.message);
    process.exit(1);
  });