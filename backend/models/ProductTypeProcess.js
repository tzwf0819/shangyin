const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductTypeProcess = sequelize.define('ProductTypeProcess', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_types',
        key: 'id'
      },
      comment: '产品类型ID'
    },
    processId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'processes',
        key: 'id'
      },
      comment: '工序ID'
    },
    sequenceOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '工序顺序'
    }
  }, {
    tableName: 'product_type_processes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['productTypeId', 'processId']
      },
      {
        fields: ['productTypeId', 'sequenceOrder']
      }
    ]
  });

  return ProductTypeProcess;
};
