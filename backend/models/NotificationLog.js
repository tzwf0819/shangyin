// models/NotificationLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationLog = sequelize.define('NotificationLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '合同 ID'
    },
    contractProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '合同产品 ID'
    },
    processId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '工序 ID'
    },
    salesmanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '业务员 ID'
    },
    notificationType: {
      type: DataTypes.STRING(50),
      defaultValue: 'process_complete',
      comment: '通知类型'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '通知内容'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      defaultValue: 'pending',
      comment: '发送状态'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发送时间'
    }
  }, {
    tableName: 'notification_logs',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  });

  NotificationLog.associate = (models) => {
    NotificationLog.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });
    NotificationLog.belongsTo(models.Process, {
      foreignKey: 'processId',
      as: 'process'
    });
  };

  return NotificationLog;
};
