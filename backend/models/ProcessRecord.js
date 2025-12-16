const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProcessRecord = sequelize.define('ProcessRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '员工ID'
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '合同ID'
    },
    contractProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '合同产品ID'
    },
    processId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '工序ID'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '数量(计件)'
    },
    actualTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '实际用时(分钟)'
    },
    payRateSnapshot: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0,
      comment: '工序单价/时薪快照'
    },
    payRateUnitSnapshot: {
      type: DataTypes.ENUM('perItem','perHour'),
      allowNull: false,
      defaultValue: 'perItem',
      comment: '计价单位快照'
    },
    employeeNameSnapshot: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: '',
      comment: '员工姓名快照'
    },
    payAmount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0,
      comment: '本条记录绩效金额'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed'),
      defaultValue: 'completed',
      comment: '状态'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    // 评分相关字段
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: '评分(0,5,10分)'
    },
    ratingEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '评分员工ID'
    },
    ratingEmployeeName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '评分员工姓名'
    },
    ratingTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '评分时间'
    }
  }, {
    tableName: 'process_records',
    timestamps: true
  });

  return ProcessRecord;
};
