/**
 * 完整数据库迁移脚本 - 添加缺失字段
 */

const path = require('path');
const { sequelize } = require(path.join(__dirname, '../models'));
const { QueryTypes } = require('sequelize');

async function fullMigrate() {
  try {
    console.log('开始完整数据库迁移...');

    // 检查是否是SQLite
    const dialect = sequelize.getDialect();
    console.log(`数据库类型: ${dialect}`);

    if (dialect === 'sqlite') {
      console.log('检测并添加所有缺失字段到SQLite表...');

      // 添加employeeNameSnapshot字段（如果不存在）
      try {
        await sequelize.query(`
          ALTER TABLE process_records ADD COLUMN employeeNameSnapshot TEXT DEFAULT ''
        `);
        console.log('✓ 已添加 employeeNameSnapshot 字段');
      } catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log('✓ employeeNameSnapshot 字段已存在');
        } else {
          console.log('ℹ employeeNameSnapshot 字段可能已存在:', error.message);
        }
      }

      // 添加评分字段
      const fieldsToCheck = [
        { name: 'rating', type: 'INTEGER', default: 'NULL' },
        { name: 'ratingEmployeeId', type: 'INTEGER', default: 'NULL' },
        { name: 'ratingEmployeeName', type: 'TEXT', default: 'NULL' },
        { name: 'ratingTime', type: 'DATETIME', default: 'NULL' }
      ];

      for (const field of fieldsToCheck) {
        try {
          await sequelize.query(`
            ALTER TABLE process_records ADD COLUMN ${field.name} ${field.type} DEFAULT ${field.default}
          `);
          console.log(`✓ 已添加 ${field.name} 字段`);
        } catch (error) {
          if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
            console.log(`✓ ${field.name} 字段已存在`);
          } else {
            console.log(`ℹ ${field.name} 字段可能已存在:`, error.message);
          }
        }
      }
    }

    console.log('完整数据库迁移完成！');
  } catch (error) {
    console.error('完整性数据库迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fullMigrate()
    .then(() => {
      console.log('完整性迁移脚本执行成功');
      process.exit(0);
    })
    .catch(error => {
      console.error('完整性迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = fullMigrate;