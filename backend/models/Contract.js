const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contract = sequelize.define('Contract', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contractNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '合同编号',
    },
    partyAName: { type: DataTypes.STRING(150), comment: '甲方' },
    partyBName: { type: DataTypes.STRING(150), comment: '乙方' },
    signedDate: { type: DataTypes.STRING(100), comment: '签订时间' },
    signedLocation: { type: DataTypes.STRING(150), comment: '签订地点' },
    isNewWoodBox: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否新木箱',
    },
    clause1: { type: DataTypes.TEXT, comment: '条款一' },
    clause2: { type: DataTypes.TEXT, comment: '条款二' },
    clause3: { type: DataTypes.TEXT, comment: '条款三' },
    clause4: { type: DataTypes.TEXT, comment: '条款四' },
    clause5: { type: DataTypes.TEXT, comment: '条款五' },
    clause6: { type: DataTypes.TEXT, comment: '条款六' },
    clause7: { type: DataTypes.TEXT, comment: '条款七' },
    clause8: { type: DataTypes.TEXT, comment: '条款八' },
    clause9: { type: DataTypes.TEXT, comment: '条款九' },
    clause10: { type: DataTypes.TEXT, comment: '条款十' },
    partyACompanyName: { type: DataTypes.STRING(200), comment: '甲单位名称' },
    partyAAddress: { type: DataTypes.STRING(200), comment: '甲单位地址' },
    partyAContact: { type: DataTypes.STRING(100), comment: '甲联系人' },
    partyAPhoneFax: { type: DataTypes.STRING(120), comment: '甲电话传真' },
    partyABank: { type: DataTypes.STRING(150), comment: '甲开户银行' },
    partyABankNo: { type: DataTypes.STRING(100), comment: '甲行号' },
    partyABankAccount: { type: DataTypes.STRING(120), comment: '甲账号' },
    partyATaxNumber: { type: DataTypes.STRING(120), comment: '甲税号' },
    partyBCompanyName: { type: DataTypes.STRING(200), comment: '乙单位名称' },
    partyBAddress: { type: DataTypes.STRING(200), comment: '乙单位地址' },
    partyBContact: { type: DataTypes.STRING(100), comment: '乙联系人' },
    partyBPhoneFax: { type: DataTypes.STRING(120), comment: '乙电话传真' },
    partyBBank: { type: DataTypes.STRING(150), comment: '乙开户银行' },
    partyBBankNo: { type: DataTypes.STRING(100), comment: '乙行号' },
    partyBBankAccount: { type: DataTypes.STRING(120), comment: '乙账号' },
    partyBTaxNumber: { type: DataTypes.STRING(120), comment: '乙税号' },
    isNewDrawing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'isNewArtwork',
      comment: '是否新图纸',
    },
    isDrawingReviewed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'isReviewed',
      comment: '是否图纸审核',
    },
    remark: { type: DataTypes.TEXT, comment: '备注' },
  }, {
    tableName: 'contract_records',
    timestamps: true,
  });

  return Contract;
};
