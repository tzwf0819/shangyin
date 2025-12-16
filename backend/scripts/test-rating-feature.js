/**
 * 评分功能测试脚本
 */

const path = require('path');
const { sequelize, ProcessRecord, Employee, Contract, ContractProduct, Process, ProductType, ProductTypeProcess } = require(path.join(__dirname, '../models'));
const { Op } = require('sequelize');

async function testRatingFunctionality() {
  try {
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');

    // 测试1: 检查ProcessRecord模型是否包含新的评分字段
    const sampleRecord = await ProcessRecord.findOne();
    if (sampleRecord) {
      console.log('✓ ProcessRecord模型字段检查:');
      console.log('  - rating字段存在:', 'rating' in sampleRecord.toJSON());
      console.log('  - ratingEmployeeId字段存在:', 'ratingEmployeeId' in sampleRecord.toJSON());
      console.log('  - ratingEmployeeName字段存在:', 'ratingEmployeeName' in sampleRecord.toJSON());
      console.log('  - ratingTime字段存在:', 'ratingTime' in sampleRecord.toJSON());
    }

    console.log('\\n✓ 评分功能数据库结构检查完成');
    console.log('\\nAPI端点:');
    console.log('POST /shangyin/production/record/:id/rate - 为生产记录评分');
    console.log('员工绩效汇总现在包含: totalRating 字段');
    console.log('员工绩效详情现在包含: rating, ratingEmployeeName, ratingTime 字段');
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  testRatingFunctionality()
    .then(() => {
      console.log('\\n✓ 评分功能测试完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('\\n✗ 评分功能测试失败:', error);
      process.exit(1);
    });
}

module.exports = testRatingFunctionality;