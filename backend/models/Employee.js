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
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '绑定的后台员工ID'
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    comment: '员工表'
  });

  Employee.associate = (models) => {
    if (models.EmployeeProcess) {
      Employee.hasMany(models.EmployeeProcess, {
        foreignKey: 'employeeId',
        as: 'employeeProcesses'
      });
    }

    if (models.User) {
      Employee.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'boundUser'
      });
    }
  };

  return Employee;
};
