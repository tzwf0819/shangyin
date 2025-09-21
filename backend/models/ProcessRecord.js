const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProcessRecord = sequelize.define('ProcessRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    actualTime: {
      type: DataTypes.INTEGER,
      comment: '实际用时(分钟)'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending',
      comment: '状态'
    }
  }, {
    tableName: 'process_records',
    timestamps: true
  });

  return ProcessRecord;
};
