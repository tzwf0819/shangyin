// models/Process.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Process = sequelize.define('Process', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '工序名称'
    },
    // 工序描述
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '工序描述'
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '工序编码 (自动生成)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    },
    // 绩效工资
    payRate: {
      type: DataTypes.DECIMAL(10,2),
      defaultValue: 0,
      comment: '绩效工资'
    },
    // 绩效单位：perItem 每件；perHour 每小时
    payRateUnit: {
      type: DataTypes.ENUM('perItem', 'perHour'),
      defaultValue: 'perItem',
      comment: '绩效单位'
    },
    // 激光雕刻相关字段
    isLaserEngraving: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为激光雕刻工序'
    },
    laserMode1PayRate: {
      type: DataTypes.DECIMAL(10,2),
      defaultValue: 0,
      comment: '激光雕刻模式 1 绩效单价'
    },
    laserMode2PayRate: {
      type: DataTypes.DECIMAL(10,2),
      defaultValue: 0,
      comment: '激光雕刻模式 2 绩效单价'
    },
    laserMode1Name: {
      type: DataTypes.STRING(50),
      defaultValue: '模式 A',
      comment: '激光雕刻模式 1 名称'
    },
    laserMode2Name: {
      type: DataTypes.STRING(50),
      defaultValue: '模式 B',
      comment: '激光雕刻模式 2 名称'
    }
  }, {
    tableName: 'processes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code']
      }
    ],
    hooks: {
      // 创建前自动生成编码
      beforeCreate: async (process, options) => {
        if (!process.code) {
          const count = await Process.count();
          process.code = `PROC${String(count + 1).padStart(3, '0')}`;
        }
      }
    }
  });

  return Process;
};
