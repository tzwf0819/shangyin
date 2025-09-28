// controllers/wechatController.js
const { Employee, Process, User } = require('../models');
const { clearEmployeeWechatBindings } = require('./employeeController');
const { Op } = require('sequelize');

function buildEmployeeInclude() {
  return [
    {
      model: Process,
      as: 'processes',
      through: {
        attributes: ['assignedAt', 'status'],
        where: { status: 'active' },
      },
      required: false,
    },
    {
      model: User,
      as: 'boundUser',
      attributes: ['id', 'nickname', 'phone', 'status', 'lastLoginAt'],
    },
  ];
}

function sanitizeName(name) {
  if (typeof name !== 'string') {
    return '';
  }
  return name.trim();
}

exports.wechatLogin = async (req, res) => {
  try {
    const { openId, unionId } = req.body || {};

    if (!openId) {
      return res.status(400).json({
        success: false,
        message: 'openId is required'
      });
    }

    const include = buildEmployeeInclude();
    let employee = await Employee.findOne({ where: { wxOpenId: openId }, include });

    if (!employee && unionId) {
      employee = await Employee.findOne({ where: { wxUnionId: unionId }, include });
    }

    if (employee) {
      const updates = {};
      if (!employee.wxOpenId) {
        updates.wxOpenId = openId;
      }
      if (unionId && employee.wxUnionId !== unionId) {
        updates.wxUnionId = unionId;
      }
      if (Object.keys(updates).length) {
        await employee.update(updates);
        employee = await Employee.findByPk(employee.id, { include });
      }

      return res.json({
        success: true,
        data: {
          isRegistered: true,
          needRegister: false,
          employee,
          openId: employee.wxOpenId,
          unionId: employee.wxUnionId || null
        }
      });
    }

    return res.json({
      success: true,
      data: {
        isRegistered: false,
        needRegister: true,
        openId,
        unionId: unionId || null
      }
    });
  } catch (error) {
    console.error('WeChat login error:', error);
    res.status(500).json({ success: false, message: 'WeChat login failed' });
  }
};

exports.registerEmployee = async (req, res) => {
  try {
    const { openId, unionId, name } = req.body || {};

    const trimmedOpenId = typeof openId === 'string' ? openId.trim() : '';
    const trimmedUnionId = typeof unionId === 'string' ? unionId.trim() : '';
    const normalizedName = sanitizeName(name);

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: '员工姓名不能为空'
      });
    }

    if (!trimmedOpenId) {
      return res.status(400).json({
        success: false,
        message: 'openId is required'
      });
    }

    const include = buildEmployeeInclude();
    let employee = await Employee.findOne({ where: { wxOpenId: trimmedOpenId }, include });

    if (!employee && trimmedUnionId) {
      employee = await Employee.findOne({ where: { wxUnionId: trimmedUnionId }, include });
    }

    if (employee) {
      if (normalizedName !== employee.name) {
        const duplicate = await Employee.findOne({
          where: {
            name: normalizedName,
            id: { [Op.ne]: employee.id }
          }
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: '该姓名已存在，请修改后再试'
          });
        }
      }

      await employee.update({
        name: normalizedName,
        wxOpenId: trimmedOpenId,
        wxUnionId: trimmedUnionId || employee.wxUnionId || null,
        status: 'active'
      });
      const refreshed = await Employee.findByPk(employee.id, { include });
      return res.json({
        success: true,
        data: {
          employee: refreshed,
          reused: true
        },
        message: '员工资料已更新'
      });
    }

    const matchedByName = await Employee.findOne({ where: { name: normalizedName }, include });
    if (matchedByName) {
      if (matchedByName.wxOpenId && matchedByName.wxOpenId !== trimmedOpenId) {
        return res.status(409).json({
          success: false,
          message: '该姓名已绑定其它微信账号，请联系管理员处理'
        });
      }

      await matchedByName.update({
        wxOpenId: trimmedOpenId,
        wxUnionId: trimmedUnionId || matchedByName.wxUnionId || null,
        status: 'active'
      });
      const refreshed = await Employee.findByPk(matchedByName.id, { include });
      return res.json({
        success: true,
        data: {
          employee: refreshed,
          reused: true,
          matchedByName: true
        },
        message: '员工资料已更新'
      });
    }

    const generateEmployeeCode = () => {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      return 'EMP' + timestamp.slice(-6) + random;
    };

    let code;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      code = generateEmployeeCode();
      // eslint-disable-next-line no-await-in-loop
      const duplicated = await Employee.findOne({ where: { code } });
      if (!duplicated) {
        isUnique = true;
      }
      attempts += 1;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: '生成唯一编码失败'
      });
    }

    const employeeCreated = await Employee.create({
      name: normalizedName,
      code,
      status: 'active',
      wxOpenId: trimmedOpenId,
      wxUnionId: trimmedUnionId || null
    });

    const fullEmployee = await Employee.findByPk(employeeCreated.id, { include });

    return res.status(201).json({
      success: true,
      data: {
        employee: fullEmployee,
        reused: false
      },
      message: '员工注册成功'
    });
  } catch (error) {
    console.error('Register employee error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: '员工姓名已存在'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to register employee'
    });
  }
};
exports.getEmployeeInfo = async (req, res) => {
  try {
    const { openId } = req.params;

    if (!openId) {
      return res.status(400).json({
        success: false,
        message: 'openId is required',
      });
    }

    const employee = await Employee.findOne({
      where: { wxOpenId: openId },
      include: buildEmployeeInclude(),
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: { employee },
    });
  } catch (error) {
    console.error('Get employee info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee info',
    });
  }
};

exports.getEmployeeProcesses = async (req, res) => {
  try {
    const { openId } = req.params;

    if (!openId) {
      return res.status(400).json({
        success: false,
        message: 'openId is required',
      });
    }

    const employee = await Employee.findOne({
      where: { wxOpenId: openId },
      include: buildEmployeeInclude(),
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: {
        processes: employee.processes || [],
      },
    });
  } catch (error) {
    console.error('Get employee processes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee processes',
    });
  }
};

exports.listWechatEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 50, keyword } = req.query;
    const where = { wxOpenId: { [Op.ne]: null } };

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 50;
    const offset = (pageNumber - 1) * pageSize;

    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      include: [
        {
          model: User,
          as: 'boundUser',
          attributes: ['id', 'nickname', 'phone', 'status', 'lastLoginAt'],
        },
      ],
      order: [['id', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        total: count,
        page: pageNumber,
        limit: pageSize,
        employees: rows,
      },
    });
  } catch (error) {
    console.error('List WeChat employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list WeChat employees',
    });
  }
};

exports.deleteWechatEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await clearEmployeeWechatBindings(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    res.json({
      success: true,
      message: '微信绑定已清除'
    });
  } catch (error) {
    console.error('Delete WeChat employee error:', error);
    res.status(500).json({
      success: false,
      message: '清除微信绑定失败'
    });
  }
};
