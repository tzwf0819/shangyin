/**
 * 使用环境变量测试MySQL连接
 */

require('dotenv').config(); // 加载 .env 文件

const mysql = require('mysql2/promise');

async function testMySQLWithEnv() {
  const dbUser = process.env.DB_USER || 'shangyin';
  const dbPass = process.env.DB_PASS || 'shaoyansa';
  const dbHost = process.env.DB_HOST || '82.156.83.99';
  const dbPort = parseInt(process.env.DB_PORT) || 3306;
  const dbName = process.env.DB_NAME || 'shangyin';

  console.log('使用环境变量测试MySQL连接...');
  console.log('用户:', dbUser);
  console.log('主机:', dbHost);
  console.log('端口:', dbPort);
  console.log('数据库:', dbName);

  try {
    // 测试连接到服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
      connectTimeout: 15000, // 15秒超时
    });

    console.log('✓ 连接到MySQL服务器成功！');

    // 检查数据库是否存在
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbName);

    if (!dbExists) {
      console.log(`数据库 ${dbName} 不存在，正在创建...`);
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✓ 数据库 ${dbName} 创建成功`);
    } else {
      console.log(`✓ 数据库 ${dbName} 已存在`);
    }

    await connection.end();
    console.log('✓ 连接已关闭');

    // 现在尝试连接到特定数据库
    const dbConnection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
      database: dbName,
      connectTimeout: 15000,
    });

    console.log(`✓ 连接到数据库 ${dbName} 成功！`);

    // 检查表
    const [tables] = await dbConnection.execute('SHOW TABLES');
    console.log(`数据库中存在 ${tables.length} 个表`);

    // 测试创建一个临时表验证写权限
    try {
      await dbConnection.execute(`
        CREATE TABLE IF NOT EXISTS _test_connection (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ 成功创建测试表');

      // 插入测试数据
      await dbConnection.execute('INSERT INTO _test_connection () VALUES ()');
      console.log('✓ 成功插入测试数据');

      // 查询测试数据
      const [results] = await dbConnection.execute('SELECT * FROM _test_connection');
      console.log(`✓ 查询到 ${results.length} 条测试记录`);

      // 清理测试表
      await dbConnection.execute('DROP TABLE IF EXISTS _test_connection');
      console.log('✓ 测试表已清理');

    } catch (writeError) {
      console.log('✗ 写权限测试失败:', writeError.message);
    }

    await dbConnection.end();
    console.log('✓ 数据库连接已关闭');

    console.log('\\n✓ 所有测试通过！MySQL连接正常工作。');
    return true;

  } catch (error) {
    console.error('\\n✗ 连接测试失败:', error.message);
    
    switch (error.code) {
      case 'ECONNREFUSED':
        console.log('  - MySQL服务器未运行或连接被拒绝');
        break;
      case 'ETIMEDOUT':
        console.log('  - 连接超时');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.log('  - 用户名或密码错误，或用户没有访问权限');
        break;
      case 'ER_BAD_DB_ERROR':
        console.log('  - 数据库不存在');
        break;
      default:
        console.log('  - 其他错误:', error.code);
    }
    
    return false;
  }
}

async function testWithSequelize() {
  console.log('\\n=== 使用Sequelize测试 ===');
  
  const { Sequelize } = require('sequelize');
  
  const dbUser = process.env.DB_USER || 'shangyin';
  const dbPass = process.env.DB_PASS || 'shaoyansa';
  const dbHost = process.env.DB_HOST || '82.156.83.99';
  const dbPort = parseInt(process.env.DB_PORT) || 3306;
  const dbName = process.env.DB_NAME || 'shangyin';

  try {
    const sequelize = new Sequelize(dbName, dbUser, dbPass, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false, // 设为true可查看SQL查询
      dialectOptions: {
        connectTimeout: 20000,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    await sequelize.authenticate();
    console.log('✓ Sequelize连接成功！');

    // 检查表数量
    const tableNames = await sequelize.getQueryInterface().showAllTables();
    console.log(`数据库中存在 ${tableNames.length} 个表:`, tableNames);

    await sequelize.close();
    console.log('✓ Sequelize连接已关闭');
    return true;

  } catch (error) {
    console.error('✗ Sequelize连接失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('=== MySQL连接测试 (使用环境变量) ===');
  
  const mysqlSuccess = await testMySQLWithEnv();
  const sequelizeSuccess = await testWithSequelize();
  
  if (mysqlSuccess && sequelizeSuccess) {
    console.log('\\n✓ 所有测试成功！');
    return true;
  } else {
    console.log('\\n✗ 部分或全部测试失败');
    return false;
  }
}

if (require.main === module) {
  main()
    .then(success => {
      console.log('\\n=== 测试完成 ===');
      if (success) {
        console.log('✓ 连接测试成功');
        process.exit(0);
      } else {
        console.log('✗ 连接测试失败');
        process.exit(1);
      }
    });
}

module.exports = { testMySQLWithEnv, testWithSequelize, main };