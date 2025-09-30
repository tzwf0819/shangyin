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

module.exports = async function runDatabaseMigrations() {
  await ensureProcessDescriptionColumn();
  await ensureProcessPayRateColumns();
};
