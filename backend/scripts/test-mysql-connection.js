/**
 * 简单的MySQL连接测试脚本
 */

const mysql = require('mysql2/promise');

async function testMySQLConnection() {
  try {
    console.log('正在尝试连接到MySQL数据库...');
    console.log('主机:', '82.156.83.99');
    console.log('端口:', 3306);
    console.log('用户:', 'root');
    console.log('数据库:', 'shangyin');
    
    const connection = await mysql.createConnection({
      host: '82.156.83.99',
      port: 3306,
      user: 'root',
      password: 'shaoyansa',
      database: 'shangyin',
      connectTimeout: 10000, // 10秒超时
    });

    console.log('✓ MySQL数据库连接成功！');
    
    // 尝试执行一个简单的查询
    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    console.log('✓ 查询执行成功:', rows[0]);
    
    // 检查数据库中是否存在表
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('数据库中表的数量:', tables.length);
    
    if (tables.length === 0) {
      console.log('⚠ 数据库中没有表，需要初始化');
    } else {
      console.log('数据库中已存在表:', tables);
    }
    
    await connection.end();
    console.log('✓ 数据库连接已关闭');
    
    return true;
  } catch (error) {
    console.error('✗ MySQL连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('错误原因: 连接被拒绝，服务器可能未运行MySQL或端口被阻止');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('错误原因: 连接超时，可能是网络问题或服务器不可达');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('错误原因: 访问被拒绝，用户名或密码可能不正确');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('错误原因: 数据库不存在');
    } else {
      console.log('错误代码:', error.code);
    }
    
    return false;
  }
}

if (require.main === module) {
  testMySQLConnection()
    .then(success => {
      if (success) {
        console.log('\\n✓ MySQL连接测试成功');
        process.exit(0);
      } else {
        console.log('\\n✗ MySQL连接测试失败');
        process.exit(1);
      }
    });
}

module.exports = testMySQLConnection;