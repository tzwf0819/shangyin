// models/EmployeeProcess.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeProcess = sequelize.define('EmployeeProcess', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    employeeId: {
      type: DataTypes.INTEGER,
      comment: '员工ID'
    },
    processId: {
      type: DataTypes.INTEGER,
      comment: '工序ID'
    },
    assignedAt: {
      type: DataTypes.DATE,
      comment: '分配时间'
    },
    status: {
      type: DataTypes.STRING(20),
      comment: '状态：active-有效, inactive-无效'
    }
  }, {
    tableName: 'employee_processes',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    comment: '员工工序关联表'
  });

  // 关联关系
  EmployeeProcess.associate = (models) => {
    if (models.Employee) {
      EmployeeProcess.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
    }
    
    if (models.Process) {
      EmployeeProcess.belongsTo(models.Process, {
        foreignKey: 'processId',
        as: 'process'
      });
    }
  };

  return EmployeeProcess;
};
