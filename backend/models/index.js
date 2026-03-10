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

// 加载所有模型
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
const Permission = require('./Permission')(sequelize);
const EmployeePermission = require('./EmployeePermission')(sequelize);
const WecomConfig = require('./WecomConfig')(sequelize);
const NotificationLog = require('./NotificationLog')(sequelize);

// 用户与员工关联
User.hasOne(Employee, {
  foreignKey: {
    name: 'userId',
    allowNull: true,
  },
  constraints: false,
  as: 'employee',
});

// 产品类型与工序关联
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

// 员工与工序关联
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

// 合同与合同产品关联
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

// 产品类型自关联（二级分类）
ProductType.hasMany(ProductType, {
  foreignKey: 'parentId',
  as: 'children'
});
ProductType.belongsTo(ProductType, {
  foreignKey: 'parentId',
  as: 'parent'
});

// 产品类型与通知工序关联
ProductType.belongsTo(Process, {
  foreignKey: 'notifyProcessId',
  as: 'notifyProcess'
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

// 员工与权限关联
Employee.belongsToMany(Permission, {
  through: EmployeePermission,
  foreignKey: 'employeeId',
  otherKey: 'permissionId',
  as: 'permissions'
});
Permission.belongsToMany(Employee, {
  through: EmployeePermission,
  foreignKey: 'permissionId',
  otherKey: 'employeeId',
  as: 'employees'
});

// 通知日志关联
NotificationLog.belongsTo(Contract, {
  foreignKey: 'contractId',
  as: 'contract'
});
NotificationLog.belongsTo(Process, {
  foreignKey: 'processId',
  as: 'process'
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
  Permission,
  EmployeePermission,
  WecomConfig,
  NotificationLog,
};

// 执行模型关联
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};
