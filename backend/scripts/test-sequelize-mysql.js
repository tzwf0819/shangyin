/**
 * 使用Sequelize测试MySQL连接
 * 这与应用实际使用的方式相同
 */

const { Sequelize } = require('sequelize');

// 使用与应用相同的配置方式
const config = {
  development: {
    username: 'root',
    password: 'shaoyansa',
    database: 'shangyin',
    host: '82.156.83.99',
    port: 3306,
    dialect: 'mysql',
    logging: console.log, // 显示SQL查询
    dialectOptions: {
      connectTimeout: 20000, // 20秒连接超时
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

async function testWithSequelize() {
  try {
    console.log('使用Sequelize测试MySQL连接...');
    console.log('配置:', {
      host: '82.156.83.99',
      port: 3306,
      username: 'root',
      database: 'shangyin'
    });
    
    const sequelize = new Sequelize(
      config.development.database,
      config.development.username,
      config.development.password,
      {
        host: config.development.host,
        port: config.development.port,
        dialect: config.development.dialect,
        logging: config.development.logging,
        dialectOptions: config.development.dialectOptions,
        pool: config.development.pool,
        define: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
        }
      }
    );

    // 测试连接
    await sequelize.authenticate();
    console.log('✓ Sequelize数据库连接成功！');

    // 尝试获取表列表
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log('数据库中已存在表:', tables);
    } catch (tableError) {
      console.log('获取表列表时出错（这可能是因为数据库不存在或权限问题）:', tableError.message);
    }

    // 尝试创建一个简单的测试
    console.log('\\n测试数据库操作...');
    try {
      // 检查数据库是否存在，如果不存在则创建
      await sequelize.query(`CREATE DATABASE IF NOT EXISTS shangyin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log('✓ 数据库检查/创建成功');
    } catch (dbError) {
      console.log('数据库创建检查失败（可能没有权限）:', dbError.message);
    }

    await sequelize.close();
    console.log('✓ Sequelize连接已关闭');
    return true;
    
  } catch (error) {
    console.error('✗ Sequelize连接测试失败:', error.message);
    
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.log('  - MySQL服务器未运行或连接被拒绝');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.log('  - 用户名或密码错误，或用户没有远程访问权限');
    } else if (error.name === 'SequelizeConnectionError') {
      console.log('  - 连接错误:', error.parent?.message);
    } else {
      console.log('  - 其他错误:', error.name);
    }
    
    return false;
  }
}

// 额外测试：尝试不指定数据库连接
async function testConnectionToServer() {
  console.log('\\n尝试连接到MySQL服务器（不指定数据库）...');
  
  try {
    const sequelizeNoDB = new Sequelize('mysql', 'root', 'shaoyansa', {
      host: '82.156.83.99',
      port: 3306,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        connectTimeout: 20000,
      }
    });
    
    await sequelizeNoDB.authenticate();
    console.log('✓ 连接到MySQL服务器成功（未指定数据库）');
    
    // 检查数据库是否存在
    const [rows] = await sequelizeNoDB.query("SHOW DATABASES LIKE 'shangyin'");
    if (rows.length > 0) {
      console.log('✓ 数据库 shangyin 已存在');
    } else {
      console.log('ℹ 数据库 shangyin 不存在，需要创建');
      await sequelizeNoDB.query("CREATE DATABASE shangyin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
      console.log('✓ 数据库 shangyin 已创建');
    }
    
    await sequelizeNoDB.close();
    return true;
  } catch (error) {
    console.error('✗ 服务器连接测试失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('=== Sequelize MySQL 连接测试 ===');
  
  // 首先尝试连接到服务器（不指定数据库）
  const serverConnectSuccess = await testConnectionToServer();
  
  if (serverConnectSuccess) {
    console.log('\\n服务器连接成功，现在尝试使用应用配置连接...');
    const appConnectSuccess = await testWithSequelize();
    return appConnectSuccess;
  } else {
    console.log('\\n服务器连接失败，无法继续测试');
    return false;
  }
}

if (require.main === module) {
  main()
    .then(success => {
      console.log('\\n=== Sequelize测试完成 ===');
      if (success) {
        console.log('✓ Sequelize连接测试成功');
        process.exit(0);
      } else {
        console.log('✗ Sequelize连接测试失败');
        process.exit(1);
      }
    });
}

module.exports = { testWithSequelize, testConnectionToServer, main };