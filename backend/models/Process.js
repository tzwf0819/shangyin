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
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '工序编码(自动生成)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
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
