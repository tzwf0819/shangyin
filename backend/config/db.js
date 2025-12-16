const path = require('path');

function resolveStorage(defaultRelativePath) {
  const override = process.env.DB_STORAGE && process.env.DB_STORAGE.trim();
  const targetPath = override || defaultRelativePath;
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(__dirname, '..', targetPath);
}

// 根据环境变量判断是否使用MySQL
const useMySQL = process.env.DB_DIALECT === 'mysql';

module.exports = {
  development: useMySQL ? {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'shaoyansa',
    database: process.env.DB_NAME || 'shangyin',
    host: process.env.DB_HOST || '82.156.83.99',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  } : {
    dialect: 'sqlite',
    storage: resolveStorage('./database/shangyin.db'),
  },
  test: useMySQL ? {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'shaoyansa',
    database: process.env.DB_NAME || 'shangyin',
    host: process.env.DB_HOST || '82.156.83.99',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  } : {
    dialect: 'sqlite',
    storage: ':memory:',
  },
  production: useMySQL ? {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'shaoyansa',
    database: process.env.DB_NAME || 'shangyin',
    host: process.env.DB_HOST || '82.156.83.99',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  } : {
    dialect: 'sqlite',
    storage: resolveStorage('./database/shangyin.db'),
  },
};
