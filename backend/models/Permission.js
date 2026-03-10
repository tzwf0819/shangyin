// models/Permission.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '权限编码'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '权限描述'
    },
    module: {
      type: DataTypes.STRING(50),
      defaultValue: 'default',
      comment: '所属模块'
    }
  }, {
    tableName: 'permissions',
    timestamps: true
  });

  Permission.associate = (models) => {
    if (models.Employee) {
      Permission.belongsToMany(models.Employee, {
        through: models.EmployeePermission,
        foreignKey: 'permissionId',
        otherKey: 'employeeId',
        as: 'employees'
      });
    }
  };

  return Permission;
};
