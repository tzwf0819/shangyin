// models/EmployeePermission.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeePermission = sequelize.define('EmployeePermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '员工 ID'
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '权限 ID'
    }
  }, {
    tableName: 'employee_permissions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'permissionId']
      }
    ]
  });

  EmployeePermission.associate = (models) => {
    EmployeePermission.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
    EmployeePermission.belongsTo(models.Permission, {
      foreignKey: 'permissionId',
      as: 'permission'
    });
  };

  return EmployeePermission;
};
