const path = require('path');

function resolveStorage(defaultRelativePath) {
  const override = process.env.DB_STORAGE && process.env.DB_STORAGE.trim();
  const targetPath = override || defaultRelativePath;
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(__dirname, '..', targetPath);
}

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: resolveStorage('./database/shangyin.db'),
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
  },
  production: {
    dialect: 'sqlite',
    storage: resolveStorage('./database/shangyin.db'),
  },
};
