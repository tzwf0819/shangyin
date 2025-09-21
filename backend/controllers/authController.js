// controllers/authController.js
const jwt = require('jsonwebtoken');
const { User, Employee } = require('../models');

exports.login = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少微信授权码' 
      });
    }

    // TODO: 使用微信 SDK 换取 openid
    // 目前使用模拟数据进行开发测试
    const openid = 'mock_openid_' + code;
    const nickname = 'Test User ' + code;
    
    // 查找或创建用户
    let user = await User.findOne({ 
      where: { wechatOpenid: openid },
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });
    
    if (!user) {
      // 创建新用户
      user = await User.create({
        wechatOpenid: openid,
        nickname: nickname,
        status: 'active',
        lastLoginAt: new Date()
      });
    } else {
      // 更新最后登录时间
      await user.update({ lastLoginAt: new Date() });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        openid: user.wechatOpenid,
        isEmployee: !!user.employee
      }, 
      process.env.JWT_SECRET || 'default_secret_key_for_development', 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      data: {
        token,
        userInfo: {
          id: user.id,
          openId: user.wechatOpenid,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          isEmployee: !!user.employee,
          employee: user.employee
        },
        expiresIn: 604800
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请重试' 
    });
  }
};