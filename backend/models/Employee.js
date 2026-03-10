// models/Employee.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '员工 ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '员工姓名'
    },
    code: {
      type: DataTypes.STRING(50),
      comment: '员工编码'
    },
    wxOpenId: {
      type: DataTypes.STRING(100),
      comment: '微信 OpenID'
    },
    wxUnionId: {
      type: DataTypes.STRING(100),
      comment: '微信 UnionID'
    },
    employeeType: {
      type: DataTypes.ENUM('worker', 'salesman'),
      defaultValue: 'worker',
      comment: '员工类型：worker-工人，salesman-业务员'
    },
    workStartTime: {
      type: DataTypes.TIME,
      defaultValue: '08:00:00',
      comment: '上班开始时间'
    },
    workEndTime: {
      type: DataTypes.TIME,
      defaultValue: '18:00:00',
      comment: '下班结束时间'
    },
    canViewAllContracts: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否可以查看所有合同（业务员权限）'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态：active-在职，inactive-离职'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '绑定的后台员工 ID'
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

    if (models.Permission) {
      Employee.belongsToMany(models.Permission, {
        through: models.EmployeePermission,
        foreignKey: 'employeeId',
        otherKey: 'permissionId',
        as: 'permissions'
      });
    }
  };

  return Employee;
};
