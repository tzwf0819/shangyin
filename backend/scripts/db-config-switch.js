/**
 * 数据库配置切换脚本
 * 用于在SQLite(测试)和MySQL(生产)之间切换配置
 */

const fs = require('fs');
const path = require('path');

function switchToSQLite() {
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 替换为SQLite配置
  envContent = envContent.replace(
    /# 数据库配置.*?DB_STORAGE=.*?(?=\n#|$)/s,
    `# 数据库配置 (SQLite，用于CI/CD测试)
DB_DIALECT=sqlite
DB_STORAGE=./database/shangyin.db`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✓ 已切换到SQLite配置');
}

function switchToMySQL() {
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 替换为MySQL配置
  envContent = envContent.replace(
    /# 数据库配置.*?DB_STORAGE=.*?(?=\n#|$)/s,
    `# 数据库配置 (MySQL)
DB_DIALECT=mysql
DB_HOST=82.156.83.99
DB_PORT=3306
DB_USER=shangyin
DB_PASS=shaoyansa
DB_NAME=shangyin`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✓ 已切换到MySQL配置');
}

function showCurrentConfig() {
  const envPath = path.join(__dirname, '../backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const dialectMatch = envContent.match(/DB_DIALECT=(.+)/);
  const dialect = dialectMatch ? dialectMatch[1] : '未找到DB_DIALECT';
  
  console.log('当前数据库配置:', dialect);
  
  if (dialect === 'mysql') {
    console.log('- 使用MySQL数据库');
    console.log('- 主机: 82.156.83.99');
    console.log('- 用户: shangyin');
  } else if (dialect === 'sqlite') {
    console.log('- 使用SQLite数据库');
    console.log('- 文件: ./database/shangyin.db');
  }
}

// 处理命令行参数
const action = process.argv[2];

switch(action) {
  case 'mysql':
    switchToMySQL();
    break;
  case 'sqlite':
    switchToSQLite();
    break;
  case 'show':
    showCurrentConfig();
    break;
  case 'help':
  case undefined:
    console.log('数据库配置切换工具');
    console.log('用法:');
    console.log('  node db-config-switch.js mysql   - 切换到MySQL配置');
    console.log('  node db-config-switch.js sqlite  - 切换到SQLite配置');
    console.log('  node db-config-switch.js show    - 显示当前配置');
    console.log('  node db-config-switch.js help    - 显示此帮助信息');
    break;
  default:
    console.log('未知命令。使用 "node db-config-switch.js help" 查看帮助。');
}

module.exports = {
  switchToSQLite,
  switchToMySQL,
  showCurrentConfig
};