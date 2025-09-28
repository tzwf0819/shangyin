// controllers/authController.js
const jwt = require('jsonwebtoken');
const { User, Employee } = require('../models');
const {
  exchangeCodeForSession,
  isMockMode,
} = require('../services/wechatAuthService');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_for_development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

exports.login = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Missing WeChat login code',
      });
    }

    let sessionData;
    try {
      sessionData = await exchangeCodeForSession(code);
    } catch (error) {
      console.error('WeChat code2session failed:', error);
      return res.status(502).json({
        success: false,
        message: error.message || 'Unable to validate WeChat login credential',
      });
    }

    const openid = sessionData.openid;
    const unionid = sessionData.unionid;

    if (!openid) {
      return res.status(502).json({
        success: false,
        message: 'WeChat did not return openId',
      });
    }

    const include = [
      {
        model: Employee,
        as: 'employee',
      },
    ];

    let user = null;

    if (unionid) {
      user = await User.findOne({
        where: { wechatUnionid: unionid },
        include,
      });
    }

    if (!user) {
      user = await User.findOne({
        where: { wechatOpenid: openid },
        include,
      });
    }

    if (!user) {
      const nickname = `WeChat User ${openid.slice(-6)}`;
      const newUser = await User.create({
        wechatOpenid: openid,
        wechatUnionid: unionid,
        nickname,
        status: 'active',
        lastLoginAt: new Date(),
      });
      user = await User.findByPk(newUser.id, { include });
    } else {
      const updates = { lastLoginAt: new Date() };
      if (!user.wechatOpenid || user.wechatOpenid !== openid) {
        updates.wechatOpenid = openid;
      }
      if (unionid && !user.wechatUnionid) {
        updates.wechatUnionid = unionid;
      }

      if (Object.keys(updates).length > 0) {
        await user.update(updates);
        await user.reload({ include });
      }
    }

    const tokenPayload = {
      id: user.id,
      openid: user.wechatOpenid,
      unionid: user.wechatUnionid || null,
      isEmployee: !!user.employee,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      success: true,
      data: {
        token,
        expiresIn: JWT_EXPIRES_IN,
        sessionKey: sessionData.session_key,
        userInfo: {
          id: user.id,
          openId: user.wechatOpenid,
          unionId: user.wechatUnionid || null,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          isEmployee: !!user.employee,
          employee: user.employee || null,
        },
        mock: sessionData.isMock || isMockMode(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed, please try again later',
    });
  }
};
