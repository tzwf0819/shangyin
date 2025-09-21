// controllers/wechatController.js
const { Employee, Process, EmployeeProcess } = require('../models');

// 微信登录
exports.wechatLogin = async (req, res) => {
  try {
    const { openId, unionId } = req.body;
    
    // 验证必需参数
    if (!openId) {
      return res.status(400).json({
        success: false,
        message: 'openId不能为空'
      });
    }

    // 查找是否已注册的员工
    const whereClause = { wxOpenId: openId };
    if (unionId) {
      whereClause.wxUnionId = unionId;
    }

    let employee = await Employee.findOne({
      where: whereClause,
      include: [{
        model: Process,
        as: 'processes',
        through: { 
          attributes: ['assignedAt', 'status'],
          where: { status: 'active' }
        },
        required: false
      }]
    });

    if (employee) {
      // 已注册用户，直接返回员工信息
      res.json({
        success: true,
        data: {
          isRegistered: true,
          employee: employee
        },
        message: '登录成功'
      });
    } else {
      // 未注册用户，需要输入员工名
      res.json({
        success: true,
        data: {
          isRegistered: false,
          openId,
          unionId
        },
        message: '首次登录，请输入员工姓名完成注册'
      });
    }
  } catch (error) {
    console.error('WeChat login error:', error);
    res.status(500).json({
      success: false,
      message: '微信登录失败'
    });
  }
};

// 微信注册员工
exports.registerEmployee = async (req, res) => {
  try {
    const { openId, unionId, name } = req.body;
    
    // 验证必需参数
    if (!openId || !name) {
      return res.status(400).json({
        success: false,
        message: 'openId和员工姓名不能为空'
      });
    }

    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '员工姓名格式不正确'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: '员工姓名不能超过100个字符'
      });
    }

    // 检查微信账号是否已绑定
    const existingWechatUser = await Employee.findOne({
      where: { wxOpenId: openId }
    });

    if (existingWechatUser) {
      return res.status(409).json({
        success: false,
        message: '该微信账号已绑定其他员工'
      });
    }

    // 生成员工编码
    const generateEmployeeCode = () => {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return 'EMP' + timestamp.slice(-6) + random;
    };

    let code;
    let isCodeUnique = false;
    let attempts = 0;
    
    while (!isCodeUnique && attempts < 10) {
      code = generateEmployeeCode();
      const existingCode = await Employee.findOne({ where: { code } });
      if (!existingCode) {
        isCodeUnique = true;
      }
      attempts++;
    }
    
    if (!isCodeUnique) {
      return res.status(500).json({
        success: false,
        message: '生成唯一编码失败，请重试'
      });
    }

    // 创建员工
    const employee = await Employee.create({
      name: name.trim(),
      code,
      wxOpenId: openId,
      wxUnionId: unionId,
      status: 'active'
    });

    // 获取完整员工信息
    const fullEmployee = await Employee.findByPk(employee.id, {
      include: [{
        model: Process,
        as: 'processes',
        through: { 
          attributes: ['assignedAt', 'status'],
          where: { status: 'active' }
        },
        required: false
      }]
    });

    res.status(201).json({
      success: true,
      data: {
        employee: fullEmployee
      },
      message: '员工注册成功'
    });
  } catch (error) {
    console.error('Register employee error:', error);
    res.status(500).json({
      success: false,
      message: '注册员工失败'
    });
  }
};

// 获取员工信息（通过微信openId）
exports.getEmployeeInfo = async (req, res) => {
  try {
    const { openId } = req.params;
    
    if (!openId) {
      return res.status(400).json({
        success: false,
        message: 'openId不能为空'
      });
    }

    const employee = await Employee.findOne({
      where: { wxOpenId: openId },
      include: [{
        model: Process,
        as: 'processes',
        through: { 
          attributes: ['assignedAt', 'status'],
          where: { status: 'active' }
        },
        required: false
      }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    console.error('Get employee info error:', error);
    res.status(500).json({
      success: false,
      message: '获取员工信息失败'
    });
  }
};

// 获取员工可从事的工序
exports.getEmployeeProcesses = async (req, res) => {
  try {
    const { openId } = req.params;
    
    if (!openId) {
      return res.status(400).json({
        success: false,
        message: 'openId不能为空'
      });
    }

    const employee = await Employee.findOne({
      where: { wxOpenId: openId },
      include: [{
        model: Process,
        as: 'processes',
        through: { 
          attributes: ['assignedAt', 'status'],
          where: { status: 'active' }
        },
        required: false
      }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    res.json({
      success: true,
      data: { 
        processes: employee.processes || [] 
      }
    });
  } catch (error) {
    console.error('Get employee processes error:', error);
    res.status(500).json({
      success: false,
      message: '获取员工工序失败'
    });
  }
};
