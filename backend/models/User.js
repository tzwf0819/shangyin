// models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID'
    },
    wechatOpenid: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'wechat_openid',
      comment: '微信OpenID'
    },
    wechatUnionid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      field: 'wechat_unionid',
      comment: '微信UnionID'
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '用户昵称'
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'avatar_url',
      comment: '头像URL'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
      comment: '用户状态'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
      comment: '最后登录时间'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '用户表'
  });

  return User;
};