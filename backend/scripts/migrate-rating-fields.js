/**
 * 评分功能数据库迁移脚本
 * 为process_records表添加评分相关字段
 */

const path = require('path');
const { sequelize } = require(path.join(__dirname, '../models'));
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    console.log('开始数据库迁移...');

    // 检查是否是SQLite
    const dialect = sequelize.getDialect();
    console.log(`数据库类型: ${dialect}`);

    if (dialect === 'sqlite') {
      // SQLite方式添加字段
      console.log('检测并添加评分相关字段到SQLite表...');

      // 添加评分字段
      try {
        await sequelize.query(`
          ALTER TABLE process_records ADD COLUMN rating INTEGER DEFAULT NULL
        `);
        console.log('✓ 已添加 rating 字段');
      } catch (error) {
        // 如果字段已存在，会报错，但这没关系
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log('✓ rating 字段已存在');
        } else {
          console.error('添加 rating 字段时出错:', error.message);
        }
      }

      // 添加评分员工ID字段
      try {
        await sequelize.query(`
          ALTER TABLE process_records ADD COLUMN ratingEmployeeId INTEGER DEFAULT NULL
        `);
        console.log('✓ 已添加 ratingEmployeeId 字段');
      } catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log('✓ ratingEmployeeId 字段已存在');
        } else {
          console.error('添加 ratingEmployeeId 字段时出错:', error.message);
        }
      }

      // 添加评分员工姓名字段
      try {
        await sequelize.query(`
          ALTER TABLE process_records ADD COLUMN ratingEmployeeName TEXT DEFAULT NULL
        `);
        console.log('✓ 已添加 ratingEmployeeName 字段');
      } catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log('✓ ratingEmployeeName 字段已存在');
        } else {
          console.error('添加 ratingEmployeeName 字段时出错:', error.message);
        }
      }

      // 添加评分时间字段
      try {
        await sequelize.query(`
          ALTER TABLE process_records ADD COLUMN ratingTime DATETIME DEFAULT NULL
        `);
        console.log('✓ 已添加 ratingTime 字段');
      } catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log('✓ ratingTime 字段已存在');
        } else {
          console.error('添加 ratingTime 字段时出错:', error.message);
        }
      }

    } else {
      // 其他数据库（如MySQL）方式
      console.log('检测并添加评分相关字段到表...');

      const columnsToCheck = [
        { name: 'rating', type: 'INTEGER', default: 'NULL' },
        { name: 'ratingEmployeeId', type: 'INTEGER', default: 'NULL' },
        { name: 'ratingEmployeeName', type: 'TEXT', default: 'NULL' },
        { name: 'ratingTime', type: 'DATETIME', default: 'NULL' }
      ];

      for (const column of columnsToCheck) {
        try {
          await sequelize.query(`
            ALTER TABLE process_records ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}
          `);
          console.log(`✓ 已添加 ${column.name} 字段`);
        } catch (error) {
          if (error.message.includes('Duplicate column') || error.message.includes('already exists')) {
            console.log(`✓ ${column.name} 字段已存在`);
          } else {
            console.error(`添加 ${column.name} 字段时出错:`, error.message);
          }
        }
      }
    }

    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('迁移脚本执行成功');
      process.exit(0);
    })
    .catch(error => {
      console.error('迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = migrate;