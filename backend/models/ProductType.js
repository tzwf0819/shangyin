const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductType = sequelize.define('ProductType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '产品类型名称'
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '产品类型编码(自动生成)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    }
  }, {
    tableName: 'product_types',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code']
      }
    ],
    hooks: {
      // 创建前自动生成编码
      beforeCreate: async (productType, options) => {
        if (!productType.code) {
          const count = await ProductType.count();
          productType.code = `PT${String(count + 1).padStart(3, '0')}`;
        }
      }
    }
  });

  return ProductType;
};
