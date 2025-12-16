/**
 * 调试环境变量加载
 */

require('dotenv').config();

console.log('=== 环境变量调试 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_DIALECT:', process.env.DB_DIALECT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '[HIDDEN]' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_STORAGE:', process.env.DB_STORAGE);

console.log('\\n=== 加载数据库配置 ===');

const dbConfig = require('../config/db');
const env = process.env.NODE_ENV || 'development';
console.log('当前环境:', env);
console.log('数据库配置:', dbConfig[env]);

console.log('\\n=== 检查是否使用MySQL ===');
const useMySQL = process.env.DB_DIALECT === 'mysql';
console.log('useMySQL:', useMySQL);

// 直接从环境变量获取
console.log('\\n从环境变量直接获取:');
console.log('username:', process.env.DB_USER || 'root');
console.log('password:', process.env.DB_PASS || 'shaoyansa');
console.log('database:', process.env.DB_NAME || 'shangyin');
console.log('host:', process.env.DB_HOST || '82.156.83.99');
console.log('port:', process.env.DB_PORT || 3306);