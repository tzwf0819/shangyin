// 数据库配置 (开发环境使用 SQLite)
module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './database/shangyin.db'
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    dialect: 'sqlite',
    storage: './database/shangyin.db'
  }
};