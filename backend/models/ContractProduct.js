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
    productType: { type: DataTypes.STRING(150), comment: '产品类型' },
    productCode: { type: DataTypes.STRING(120), comment: '产品编号' },
    productName: { type: DataTypes.STRING(150), allowNull: false, comment: '产品名称' },
    specification: { type: DataTypes.STRING(150), comment: '规格' },
    carveWidth: { type: DataTypes.STRING(120), comment: '雕宽' },
    meshType: { type: DataTypes.STRING(120), comment: '网型' },
    lineCount: { type: DataTypes.STRING(120), comment: '线数' },
    volumeRatio: { type: DataTypes.STRING(120), comment: '容积率' },
    quantity: { type: DataTypes.STRING(120), comment: '数量' },
    unitPrice: { type: DataTypes.STRING(120), comment: '单价' },
    deliveryDeadline: { type: DataTypes.STRING(120), comment: '交货期限' },
    totalAmount: { type: DataTypes.STRING(120), comment: '总金额' },
  }, {
    tableName: 'contract_products',
    timestamps: true,
  });

  return ContractProduct;
};
