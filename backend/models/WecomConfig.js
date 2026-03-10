// models/WecomConfig.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WecomConfig = sequelize.define('WecomConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    corpId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '企业微信 CorpID'
    },
    agentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '应用 AgentId'
    },
    secret: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '应用 Secret'
    },
    token: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Token'
    },
    encodingAesKey: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'EncodingAESKey'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否启用'
    }
  }, {
    tableName: 'wecom_configs',
    timestamps: true
  });

  return WecomConfig;
};
