const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = config.dialect === 'sqlite'
  ? new Sequelize({
      dialect: 'sqlite',
      storage: config.storage,
      logging: false,
    })
  : new Sequelize(config.database, config.user, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: false,
    });

const User = require('./User')(sequelize);
const Employee = require('./Employee')(sequelize);
const ProductType = require('./ProductType')(sequelize);
const Process = require('./Process')(sequelize);
const Contract = require('./Contract')(sequelize);
const ContractProduct = require('./ContractProduct')(sequelize);
const Product = require('./Product')(sequelize);
const ProcessRecord = require('./ProcessRecord')(sequelize);
const ProductTypeProcess = require('./ProductTypeProcess')(sequelize);
const EmployeeProcess = require('./EmployeeProcess')(sequelize);

User.hasOne(Employee, {
  foreignKey: {
    name: 'userId',
    allowNull: true,
  },
  constraints: false,
  as: 'employee',
});

ProductType.belongsToMany(Process, {
  through: ProductTypeProcess,
  foreignKey: 'productTypeId',
  otherKey: 'processId',
  as: 'processes',
  constraints: false,
});

Process.belongsToMany(ProductType, {
  through: ProductTypeProcess,
  foreignKey: 'processId',
  otherKey: 'productTypeId',
  as: 'productTypes',
  constraints: false,
});

Employee.belongsToMany(Process, {
  through: EmployeeProcess,
  foreignKey: 'employeeId',
  otherKey: 'processId',
  as: 'processes',
  constraints: false,
});

Process.belongsToMany(Employee, {
  through: EmployeeProcess,
  foreignKey: 'processId',
  otherKey: 'employeeId',
  as: 'employees',
  constraints: false,
});

Contract.hasMany(ContractProduct, {
  foreignKey: {
    name: 'contractId',
    allowNull: true,
  },
  as: 'products',
  constraints: false,
});

ContractProduct.belongsTo(Contract, {
  foreignKey: {
    name: 'contractId',
    allowNull: true,
  },
  as: 'contract',
  constraints: false,
});

const models = {
  User,
  Employee,
  ProductType,
  Process,
  Contract,
  ContractProduct,
  Product,
  ProcessRecord,
  ProductTypeProcess,
  EmployeeProcess,
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};