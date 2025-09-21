const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contract = sequelize.define('Contract', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '合同编号'
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '客户名称'
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
      comment: '合同状态'
    }
  }, {
    tableName: 'contracts',
    timestamps: true
  });

  return Contract;
};
