// controllers/wechatController.js
const { Employee, Process, EmployeeProcess, User } = require('../models');
const { Op } = require('sequelize');

// 微信登录（仅使用 unionId 作为唯一标识；openId 仅存储不用于匹配）
exports.wechatLogin = async (req, res) => {
  try {
    const { openId, unionId } = req.body;
    if (!unionId) {
      return res.status(400).json({ success:false, message:'unionId不能为空(需在小程序端通过云函数或后端换取 unionId)' });
    }
    // 仅按 unionId 匹配
    const employee = await Employee.findOne({
      where: { wxUnionId: unionId },
      include: [
        {
          model: Process,
          as: 'processes',
          through: { attributes:['assignedAt','status'], where:{ status:'active' } },
          required:false
        },
        {
          model: User,
          as: 'boundUser',
          attributes: ['id', 'nickname', 'phone', 'status', 'lastLoginAt']
        }
      ]
    });
    if (employee) {
      return res.json({ success:true, data:{ isRegistered:true, employee }, message:'登录成功' });
    }
    return res.json({ success:true, data:{ isRegistered:false, unionId, openId }, message:'未注册，请完善姓名后调用 /register' });
  } catch (error) {
    console.error('WeChat login error:', error);
    res.status(500).json({ success:false, message:'微信登录失败' });
  }
};

// 微信注册员工（unionId 必须；如果 unionId 已存在则阻止重复）
exports.registerEmployee = async (req, res) => {
  try {
    const { openId, unionId, name } = req.body;
    if (!unionId || !name) {
      return res.status(400).json({ success:false, message:'unionId和姓名不能为空' });
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

    // 检查 unionId 是否已绑定
    const existingUnion = await Employee.findOne({ where: { wxUnionId: unionId } });
    if (existingUnion) {
      return res.status(409).json({ success:false, message:'该 unionId 已注册' });
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

    // 创建微信员工记录，并按姓名尝试自动绑定
    const normalizedName = name.trim();
    let boundUserId = null;

    const matchedUser = await User.findOne({ where: { nickname: normalizedName } });
    if (matchedUser) {
      const existingBinding = await Employee.findOne({ where: { userId: matchedUser.id } });
      if (!existingBinding) {
        boundUserId = matchedUser.id;
      }
    }

    const employee = await Employee.create({
      name: normalizedName,
      code,
      wxOpenId: openId || null,
      wxUnionId: unionId,
      status: 'active',
      userId: boundUserId
    });

    // 获取完整员工信息
    const fullEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: Process,
          as: 'processes',
          through: { 
            attributes: ['assignedAt', 'status'],
            where: { status: 'active' }
          },
          required: false
        },
        {
          model: User,
          as: 'boundUser',
          attributes: ['id', 'nickname', 'phone', 'status', 'lastLoginAt']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        employee: fullEmployee,
        autoBound: Boolean(boundUserId),
        matchedUserId: boundUserId
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
      include: [
        {
          model: Process,
          as: 'processes',
          through: { 
            attributes: ['assignedAt', 'status'],
            where: { status: 'active' }
          },
          required: false
        },
        {
          model: User,
          as: 'boundUser',
          attributes: ['id', 'nickname', 'phone', 'status', 'lastLoginAt']
        }
      ]
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
      include: [
        {
          model: Process,
          as: 'processes',
          through: { 
            attributes: ['assignedAt', 'status'],
            where: { status: 'active' }
          },
          required: false
        },
        {
          model: User,
          as: 'boundUser',
          attributes: ['id', 'nickname', 'phone', 'status', 'lastLoginAt']
        }
      ]
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

// 管理端：列出已绑定微信的员工
exports.listWechatEmployees = async (req, res) => {
  try {
    const { page=1, limit=50, keyword } = req.query;
    const where = { wxUnionId: { [Op.ne]: null } };
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const offset = (parseInt(page)-1) * parseInt(limit);
    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [{
        model: User,
        as: 'boundUser',
        attributes: ['id', 'nickname', 'phone', 'status', 'lastLoginAt']
      }],
      order: [['id','DESC']]
    });
    res.json({ success:true, data:{ total:count, page:parseInt(page), limit:parseInt(limit), employees: rows } });
  } catch (e) {
    console.error('List wechat employees error:', e);
    res.status(500).json({ success:false, message:'获取微信员工列表失败' });
  }
};

