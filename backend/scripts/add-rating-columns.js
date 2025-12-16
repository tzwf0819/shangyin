const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

async function addRatingColumns() {
  try {
    console.log('开始添加评分相关字段到 process_records 表...');

    // 检查字段是否已存在
    const existingColumns = await sequelize.query(
      "PRAGMA table_info(process_records);",
      { type: QueryTypes.SELECT }
    );

    const hasRatingColumn = existingColumns.some(col => col.name === 'rating');
    const hasRatingEmployeeIdColumn = existingColumns.some(col => col.name === 'ratingEmployeeId');
    const hasRatingEmployeeNameColumn = existingColumns.some(col => col.name === 'ratingEmployeeName');
    const hasRatingTimeColumn = existingColumns.some(col => col.name === 'ratingTime');

    if (!hasRatingColumn) {
      await sequelize.query('ALTER TABLE process_records ADD COLUMN rating INTEGER DEFAULT NULL;');
      console.log('添加 rating 字段成功');
    } else {
      console.log('rating 字段已存在');
    }

    if (!hasRatingEmployeeIdColumn) {
      await sequelize.query('ALTER TABLE process_records ADD COLUMN ratingEmployeeId INTEGER DEFAULT NULL;');
      console.log('添加 ratingEmployeeId 字段成功');
    } else {
      console.log('ratingEmployeeId 字段已存在');
    }

    if (!hasRatingEmployeeNameColumn) {
      await sequelize.query('ALTER TABLE process_records ADD COLUMN ratingEmployeeName TEXT DEFAULT NULL;');
      console.log('添加 ratingEmployeeName 字段成功');
    } else {
      console.log('ratingEmployeeName 字段已存在');
    }

    if (!hasRatingTimeColumn) {
      await sequelize.query('ALTER TABLE process_records ADD COLUMN ratingTime DATETIME DEFAULT NULL;');
      console.log('添加 ratingTime 字段成功');
    } else {
      console.log('ratingTime 字段已存在');
    }

    console.log('所有评分相关字段已处理完成');
  } catch (error) {
    console.error('添加评分字段时出错:', error);
    throw error;
  }
}

if (require.main === module) {
  addRatingColumns()
    .then(() => {
      console.log('评分字段添加完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('执行失败:', err);
      process.exit(1);
    });
}

module.exports = addRatingColumns;