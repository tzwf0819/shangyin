const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/shangyin.db',
  logging: console.log,
});

async function cleanupDatabase() {
  try {
    console.log('连接到数据库...');
    await sequelize.authenticate();
    
    console.log('清理可能存在的备份表...');
    
    // 获取所有表名
    const [results] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup';"
    );
    
    console.log('找到的备份表:', results);
    
    // 删除所有备份表
    for (const table of results) {
      console.log(`删除备份表: ${table.name}`);
      await sequelize.query(`DROP TABLE IF EXISTS \`${table.name}\`;`);
    }
    
    console.log('数据库清理完成！');
    
    // 检查现有表
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    
    console.log('现有表:', tables.map(t => t.name));
    
  } catch (error) {
    console.error('清理数据库时出错:', error);
  } finally {
    await sequelize.close();
  }
}

cleanupDatabase();