// models/Employee.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '员工ID'
    },
    name: {
      type: DataTypes.STRING(100),
      comment: '员工姓名'
    },
    code: {
      type: DataTypes.STRING(50),
      comment: '员工编码'
    },
    wxOpenId: {
      type: DataTypes.STRING(100),
      comment: '微信OpenID'
    },
    wxUnionId: {
      type: DataTypes.STRING(100),
      comment: '微信UnionID'
    },
    status: {
      type: DataTypes.STRING(20),
      comment: '状态：active-在职, inactive-离职'
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    comment: '员工表'
  });

  // 简化的关联关系
  Employee.associate = (models) => {
    // 员工与工序的多对多关系
    if (models.EmployeeProcess) {
      Employee.hasMany(models.EmployeeProcess, {
        foreignKey: 'employeeId',
        as: 'employeeProcesses'
      });
    }
  };

  return Employee;
};
