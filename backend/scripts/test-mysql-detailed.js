/**
 * 详细的MySQL连接测试脚本
 */

const mysql = require('mysql2/promise');

async function testMySQLConnectionDetailed() {
  try {
    console.log('详细MySQL连接测试开始...');
    console.log('目标: 82.156.83.99:3306');
    console.log('数据库: shangyin');
    
    // 首先尝试连接到默认数据库（不指定特定数据库）
    console.log('\\n步骤 1: 尝试连接到默认数据库');
    const connection1 = await mysql.createConnection({
      host: '82.156.83.99',
      port: 3306,
      user: 'root',
      password: 'shaoyansa',
      connectTimeout: 10000,
    });

    console.log('✓ 连接到默认数据库成功');
    
    // 检查数据库是否存在
    const [databases] = await connection1.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === 'shangyin');
    
    if (!dbExists) {
      console.log('数据库 shangyin 不存在，正在创建...');
      await connection1.execute('CREATE DATABASE IF NOT EXISTS shangyin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✓ 数据库 shangyin 创建成功');
    } else {
      console.log('✓ 数据库 shangyin 已存在');
    }
    
    await connection1.end();
    console.log('默认连接已关闭');
    
    // 现在尝试连接到 shangyin 数据库
    console.log('\\n步骤 2: 尝试连接到 shangyin 数据库');
    const connection2 = await mysql.createConnection({
      host: '82.156.83.99',
      port: 3306,
      user: 'root',
      password: 'shaoyansa',
      database: 'shangyin',
      connectTimeout: 10000,
    });

    console.log('✓ 连接到 shangyin 数据库成功');
    
    // 检查表
    const [tables] = await connection2.execute('SHOW TABLES');
    console.log(`数据库中存在 ${tables.length} 个表`);
    
    if (tables.length > 0) {
      console.log('现有表:', tables.map(t => Object.values(t)[0]));
    }
    
    // 测试创建一个临时表来验证写权限
    console.log('\\n步骤 3: 测试写权限');
    try {
      await connection2.execute(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ 成功创建测试表');
      
      // 插入一条记录
      await connection2.execute('INSERT INTO test_connection () VALUES ()');
      console.log('✓ 成功插入测试记录');
      
      // 查询记录
      const [results] = await connection2.execute('SELECT * FROM test_connection');
      console.log('✓ 查询测试记录成功:', results.length, '条记录');
      
      // 清理测试表
      await connection2.execute('DROP TABLE IF EXISTS test_connection');
      console.log('✓ 测试表已清理');
    } catch (writeError) {
      console.log('✗ 写权限测试失败:', writeError.message);
    }
    
    await connection2.end();
    console.log('✓ shangyin 数据库连接已关闭');
    
    console.log('\\n✓ 所有MySQL连接测试通过！');
    return true;
    
  } catch (error) {
    console.error('\\n✗ MySQL连接测试失败:', error.message);
    
    // 提供更具体的错误信息
    switch (error.code) {
      case 'ECONNREFUSED':
        console.log('  - 服务器可能未运行MySQL服务或端口被阻止');
        break;
      case 'ETIMEDOUT':
        console.log('  - 连接超时，可能是网络延迟或服务器响应慢');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.log('  - 用户名或密码错误');
        break;
      case 'ER_BAD_DB_ERROR':
        console.log('  - 指定的数据库不存在');
        break;
      case 'ENOTFOUND':
        console.log('  - 无法解析主机名');
        break;
      default:
        console.log('  - 未知错误:', error.code);
    }
    
    console.log('  - 错误详细信息:', error);
    return false;
  }
}

async function testWithDifferentOptions() {
  console.log('\\n尝试使用不同的连接选项...');
  
  const configs = [
    {
      name: '基本配置',
      config: {
        host: '82.156.83.99',
        port: 3306,
        user: 'root',
        password: 'shaoyansa',
        database: 'shangyin',
        connectTimeout: 15000,
      }
    },
    {
      name: '带SSL禁用',
      config: {
        host: '82.156.83.99',
        port: 3306,
        user: 'root',
        password: 'shaoyansa',
        database: 'shangyin',
        connectTimeout: 15000,
        ssl: { rejectUnauthorized: false } // 临时允许不安全连接
      }
    },
    {
      name: '使用legacy认证',
      config: {
        host: '82.156.83.99',
        port: 3306,
        user: 'root',
        password: 'shaoyansa',
        database: 'shangyin',
        connectTimeout: 15000,
        authSwitchHandler: (data, cb) => {
          // 如果需要使用旧式认证
          cb(null);
        }
      }
    }
  ];
  
  for (const config of configs) {
    console.log(`\\n测试配置: ${config.name}`);
    try {
      const connection = await mysql.createConnection(config.config);
      console.log(`✓ ${config.name} - 连接成功`);
      await connection.end();
      return true;
    } catch (error) {
      console.log(`✗ ${config.name} - 失败:`, error.message);
    }
  }
  
  return false;
}

async function main() {
  console.log('=== MySQL 连接测试程序 ===');
  
  // 首先尝试基本连接
  const basicSuccess = await testMySQLConnectionDetailed();
  
  if (!basicSuccess) {
    console.log('\\n基本连接失败，尝试其他配置...');
    const alternativeSuccess = await testWithDifferentOptions();
    
    if (!alternativeSuccess) {
      console.log('\\n✗ 所有连接尝试都失败了');
      console.log('\\n可能的原因和解决方案:');
      console.log('1. MySQL服务器可能不允许root用户远程登录');
      console.log('2. MySQL可能使用了新的认证插件（如caching_sha2_password）');
      console.log('3. 防火墙可能允许端口连接但阻止了认证过程');
      console.log('4. 网络环境可能需要特殊的连接设置');
      
      return false;
    }
  }
  
  return true;
}

if (require.main === module) {
  main()
    .then(success => {
      console.log('\\n=== 测试完成 ===');
      if (success) {
        console.log('✓ 至少有一种连接方式成功');
        process.exit(0);
      } else {
        console.log('✗ 所有连接方式都失败');
        process.exit(1);
      }
    });
}

module.exports = { testMySQLConnectionDetailed, testWithDifferentOptions, main };