// 数据库配置 (开发环境使用 SQLite)
module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './database/shangyin.db'
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'factory_management',
    dialect: 'mysql'
  }
};