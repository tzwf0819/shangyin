// models/ProductType.js
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
      comment: '产品类型编码 (自动生成)'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: '父级分类 ID（二级分类）'
    },
    notifyProcessId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: '通知工序 ID'
    },
    needNotification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否需要工序完成通知'
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

  ProductType.associate = (models) => {
    // 自关联：父分类 - 子分类
    ProductType.hasMany(models.ProductType, {
      foreignKey: 'parentId',
      as: 'children'
    });

    ProductType.belongsTo(models.ProductType, {
      foreignKey: 'parentId',
      as: 'parent'
    });

    // 通知工序关联
    ProductType.belongsTo(models.Process, {
      foreignKey: 'notifyProcessId',
      as: 'notifyProcess'
    });
  };

  return ProductType;
};
