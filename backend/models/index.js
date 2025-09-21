// models/index.js
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db');

// 获取当前环境配置
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// 创建 Sequelize 实例
const sequelize = config.dialect === 'sqlite' 
  ? new Sequelize({
      dialect: 'sqlite',
      storage: config.storage,
      logging: false
    })
  : new Sequelize(config.database, config.user, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: false
    });

// 导入所有模型
const User = require('./User')(sequelize);
const Employee = require('./Employee')(sequelize);
const ProductType = require('./ProductType')(sequelize);
const Process = require('./Process')(sequelize);
const Contract = require('./Contract')(sequelize);
const Product = require('./Product')(sequelize);
const ProcessRecord = require('./ProcessRecord')(sequelize);
const ProductTypeProcess = require('./ProductTypeProcess')(sequelize);
const EmployeeProcess = require('./EmployeeProcess')(sequelize);

// 定义基础关联关系
User.hasOne(Employee, { 
  foreignKey: 'userId', 
  as: 'employee' 
});

// 产品类型与工序的多对多关系
ProductType.belongsToMany(Process, {
  through: ProductTypeProcess,
  foreignKey: 'productTypeId',
  otherKey: 'processId',
  as: 'processes'
});

Process.belongsToMany(ProductType, {
  through: ProductTypeProcess,
  foreignKey: 'processId',
  otherKey: 'productTypeId',
  as: 'productTypes'
});

// 员工与工序的多对多关系
Employee.belongsToMany(Process, {
  through: EmployeeProcess,
  foreignKey: 'employeeId',
  otherKey: 'processId',
  as: 'processes'
});

Process.belongsToMany(Employee, {
  through: EmployeeProcess,
  foreignKey: 'processId',
  otherKey: 'employeeId',
  as: 'employees'
});

// 创建模型对象
const models = {
  User,
  Employee,
  ProductType,
  Process,
  Contract,
  Product,
  ProcessRecord,
  ProductTypeProcess,
  EmployeeProcess,
};

// 执行关联关系
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// 导出模型和 sequelize 实例
module.exports = {
  sequelize,
  ...models
};
