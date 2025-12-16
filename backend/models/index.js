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
  : new Sequelize(config.database, config.username, config.password, {
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
    allowNull: false,
  },
  as: 'products',
  constraints: false,
  onDelete: 'CASCADE',
  hooks: true,
});

ContractProduct.belongsTo(Contract, {
  foreignKey: {
    name: 'contractId',
    allowNull: false,
  },
  as: 'contract',
  constraints: false,
});


// 生产记录关联
ProcessRecord.belongsTo(Employee, { foreignKey: { name: 'employeeId', allowNull: true }, as: 'employee', constraints: false });
Employee.hasMany(ProcessRecord, { foreignKey: { name: 'employeeId', allowNull: true }, as: 'processRecords', constraints: false });
ProcessRecord.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
Contract.hasMany(ProcessRecord, { foreignKey: 'contractId', as: 'processRecords' });
ProcessRecord.belongsTo(ContractProduct, { foreignKey: 'contractProductId', as: 'contractProduct' });
ContractProduct.hasMany(ProcessRecord, { foreignKey: 'contractProductId', as: 'processRecords' });
ProcessRecord.belongsTo(Process, { foreignKey: 'processId', as: 'process' });
Process.hasMany(ProcessRecord, { foreignKey: 'processId', as: 'processRecords' });

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