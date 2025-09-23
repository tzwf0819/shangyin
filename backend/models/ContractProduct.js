const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const ContractProduct = sequelize.define(
    'ContractProduct',
    {
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
        comment: '成品序号',
      },
      productId: { type: DataTypes.STRING(100), comment: '成品ID' },
      productCode: { type: DataTypes.STRING(100), comment: '产品编号' },
      productName: { type: DataTypes.STRING(150), comment: '产品名称' },
      specification: { type: DataTypes.STRING(150), comment: '规格' },
      carveWidth: { type: DataTypes.STRING(100), comment: '雕宽' },
      meshType: { type: DataTypes.STRING(100), comment: '网型' },
      lineCount: { type: DataTypes.STRING(100), comment: '线数' },
      volumeRatio: { type: DataTypes.STRING(100), comment: '容积率' },
      inkVolume: { type: DataTypes.STRING(100), comment: '载墨量' },
      quantity: { type: DataTypes.STRING(100), comment: '数量' },
      unitPrice: { type: DataTypes.STRING(100), comment: '单价' },
      plateUnitPrice: { type: DataTypes.STRING(100), comment: '平厘单价' },
      totalAmount: { type: DataTypes.STRING(100), comment: '总金额' },
      productTypeId: { type: DataTypes.STRING(100), comment: '产品类型ID' },
      productTypeName: { type: DataTypes.STRING(150), comment: '产品类型名称' },
      cellShape: { type: DataTypes.STRING(100), comment: '网穴形状' },
      newWoodBox: { type: DataTypes.BOOLEAN, comment: '是否新木箱' },
      extraInfoJson: { type: DataTypes.TEXT, comment: '成品补充信息(JSON)' },
    },
    {
      tableName: 'contract_products',
      timestamps: true,
    }
  );

  return ContractProduct;
};
