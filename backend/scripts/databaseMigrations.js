const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

async function ensureProcessDescriptionColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('processes');
  if (!tableDefinition.description) {
    await queryInterface.addColumn('processes', 'description', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '工序描述',
    });
    console.log('[migrate] Added description column to processes table');
  }
}

async function ensureProcessPayRateColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('processes');
  
  if (!tableDefinition.payRate) {
    await queryInterface.addColumn('processes', 'payRate', {
      type: DataTypes.DECIMAL(10,2),
      defaultValue: 0,
      comment: '绩效工资',
    });
    console.log('[migrate] Added payRate column to processes table');
  }
  
  if (!tableDefinition.payRateUnit) {
    await queryInterface.addColumn('processes', 'payRateUnit', {
      type: DataTypes.ENUM('perItem', 'perHour'),
      defaultValue: 'perItem',
      comment: '绩效单位',
    });
    console.log('[migrate] Added payRateUnit column to processes table');
  }
}

async function ensureContractProductColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('contract_products').catch(() => null);
  if (!tableDefinition) {
    console.warn('[migrate] contract_products table not found, skipped column checks');
    return;
  }

  const ensureColumn = async (name, definition) => {
    if (!tableDefinition[name]) {
      await queryInterface.addColumn('contract_products', name, definition);
      console.log(`[migrate] Added ${name} column to contract_products table`);
    }
  };

  await ensureColumn('productIndex', {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '产品顺序',
  });
  await ensureColumn('productId', {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: '产品ID',
  });
  await ensureColumn('inkVolume', {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: '上墨量',
  });
  await ensureColumn('plateUnitPrice', {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: '制版单价',
  });
  await ensureColumn('productTypeId', {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: '产品类型ID',
  });
  await ensureColumn('productTypeName', {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: '产品类型名称',
  });
  await ensureColumn('productTypeCode', {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: '产品类型编码',
  });
  await ensureColumn('productType', {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '产品类型冗余字段',
  });
  await ensureColumn('cellShape', {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: '网穴形状',
  });
  await ensureColumn('newWoodBox', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: '是否新木箱',
  });
  await ensureColumn('extraInfoJson', {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '额外字段快照',
  });
}

module.exports = async function runDatabaseMigrations() {
  await ensureProcessDescriptionColumn();
  await ensureProcessPayRateColumns();
  await ensureContractProductColumns();
};
