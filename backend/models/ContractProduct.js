const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContractProduct = sequelize.define('ContractProduct', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '合同ID',
    },
    productIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '序号',
    },
    productId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '产品ID',
    },
    productCode: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '产品编号',
    },
    productName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      comment: '产品名称',
    },
    specification: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: '规格',
    },
    carveWidth: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '雕刻宽度',
    },
    meshType: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '网纹类型',
    },
    lineCount: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '线数',
    },
    volumeRatio: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '容积率',
    },
    inkVolume: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '上墨量',
    },
    quantity: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '数量',
    },
    unitPrice: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '单价',
    },
    plateUnitPrice: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '制版单价',
    },
    totalAmount: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '总金额',
    },
    deliveryDeadline: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '交付期限',
    },
    productTypeId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '产品类型ID',
    },
    productTypeName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: '产品类型名称',
    },
    productType: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '产品类型冗余字段',
    },
    cellShape: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: '网穴形状',
    },
    newWoodBox: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: '是否新木箱',
    },
    extraInfoJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '额外字段快照',
    },
  }, {
    tableName: 'contract_products',
    timestamps: true,
  });

  return ContractProduct;
};
