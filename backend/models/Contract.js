const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Contract = sequelize.define(
    'Contract',
    {
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
      partyAName: { type: DataTypes.STRING(150), comment: '甲方名称' },
      partyACompanyName: { type: DataTypes.STRING(150), comment: '甲方单位名称' },
      partyAAddress: { type: DataTypes.STRING(200), comment: '甲方地址' },
      partyAContact: { type: DataTypes.STRING(100), comment: '甲方联系人' },
      partyAPhoneFax: { type: DataTypes.STRING(100), comment: '甲方电话传真' },
      partyABank: { type: DataTypes.STRING(150), comment: '甲方开户银行' },
      partyABankAccount: { type: DataTypes.STRING(100), comment: '甲方账号' },
      partyABankNo: { type: DataTypes.STRING(100), comment: '甲方行号' },
      partyATaxNumber: { type: DataTypes.STRING(100), comment: '甲方税号' },
      partyBName: { type: DataTypes.STRING(150), comment: '乙方名称' },
      partyBCompanyName: { type: DataTypes.STRING(150), comment: '乙方单位名称' },
      partyBAddress: { type: DataTypes.STRING(200), comment: '乙方地址' },
      partyBContact: { type: DataTypes.STRING(100), comment: '乙方联系人' },
      partyBPhoneFax: { type: DataTypes.STRING(100), comment: '乙方电话传真' },
      partyBBank: { type: DataTypes.STRING(150), comment: '乙方开户银行' },
      partyBBankAccount: { type: DataTypes.STRING(100), comment: '乙方账号' },
      partyBBankNo: { type: DataTypes.STRING(100), comment: '乙方行号' },
      partyBTaxNumber: { type: DataTypes.STRING(100), comment: '乙方税号' },
      signedDate: { type: DataTypes.STRING(100), comment: '签订日期' },
      signedLocation: { type: DataTypes.STRING(100), comment: '签订地点' },
      status: { type: DataTypes.STRING(50), comment: '合同状态' },
      contractAttribute: { type: DataTypes.STRING(100), comment: '合同属性' },
      deliveryDeadline: { type: DataTypes.STRING(100), comment: '交货期限' },
      actualDeliveryDate: { type: DataTypes.STRING(100), comment: '实际交货日期' },
      paymentStatus: { type: DataTypes.STRING(50), comment: '是否回款' },
      paymentDate: { type: DataTypes.STRING(100), comment: '回款时间' },
      shippingDate: { type: DataTypes.STRING(100), comment: '出库日期' },
      settlementDate: { type: DataTypes.STRING(100), comment: '结清日期' },
      salesId: { type: DataTypes.STRING(100), comment: '销售ID或员工编码' },
      salesEmployeeId: { type: DataTypes.INTEGER, comment: '销售员工ID（软关联）' },
      isNewArtwork: { type: DataTypes.BOOLEAN, comment: '是否新图' },
      isReviewed: { type: DataTypes.BOOLEAN, comment: '是否审核' },
      isScheduled: { type: DataTypes.BOOLEAN, comment: '是否排产' },
      inkCapacity: { type: DataTypes.STRING(100), comment: '载墨量' },
      cellShape: { type: DataTypes.STRING(100), comment: '网穴形状' },
      termsJson: { type: DataTypes.TEXT, comment: '合同条款(JSON)' },
      processStatusJson: { type: DataTypes.TEXT, comment: '工序进度(JSON)' },
      extraInfoJson: { type: DataTypes.TEXT, comment: '补充信息(JSON)' },
      rawDataJson: { type: DataTypes.TEXT, comment: '原始数据(JSON)' },
      remark: { type: DataTypes.TEXT, comment: '备注' },
    },
    {
      tableName: 'contract_records',
      timestamps: true,
    }
  );

  return Contract;
};