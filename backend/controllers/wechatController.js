// controllers/wechatController.js
const { Employee, Process, User } = require('../models');
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
        message: 'openId is required',
      });
    }

    const identifiers = [];
    if (unionId) {
      identifiers.push({ wxUnionId: unionId });
    }
    identifiers.push({ wxOpenId: openId });

    let employee = await Employee.findOne({
      where: { [Op.or]: identifiers },
      include: buildEmployeeInclude(),
    });

    if (employee) {
      const updates = {};
      if (openId && !employee.wxOpenId) {
        updates.wxOpenId = openId;
      }
      if (unionId && !employee.wxUnionId) {
        updates.wxUnionId = unionId;
      }
      if (Object.keys(updates).length > 0) {
        await employee.update(updates);
        employee = await Employee.findByPk(employee.id, {
          include: buildEmployeeInclude(),
        });
      }

      return res.json({
        success: true,
        data: {
          isRegistered: true,
          needRegister: false,
          employee,
          openId: employee.wxOpenId || openId,
          unionId: employee.wxUnionId || unionId || null,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        isRegistered: false,
        needRegister: true,
        openId,
        unionId: unionId || null,
      },
    });
  } catch (error) {
    console.error('WeChat login error:', error);
    res.status(500).json({ success: false, message: 'WeChat login failed' });
  }
};

exports.registerEmployee = async (req, res) => {
  try {
    const { openId, unionId, name } = req.body || {};

    const normalizedName = sanitizeName(name);

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: 'Employee name is required',
      });
    }

    if (!openId && !unionId) {
      return res.status(400).json({
        success: false,
        message: 'Either openId or unionId must be provided',
      });
    }

    if (normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Employee name is too long',
      });
    }

    const include = buildEmployeeInclude();
    const identifiers = [];
    if (unionId) {
      identifiers.push({ wxUnionId: unionId });
    }
    if (openId) {
      identifiers.push({ wxOpenId: openId });
    }

    let existing = null;
    if (identifiers.length > 0) {
      existing = await Employee.findOne({
        where: { [Op.or]: identifiers },
        include,
      });
    }

    if (existing) {
      const updates = { name: normalizedName };
      if (openId && !existing.wxOpenId) {
        updates.wxOpenId = openId;
      }
      if (unionId && !existing.wxUnionId) {
        updates.wxUnionId = unionId;
      }
      await existing.update(updates);
      const refreshed = await Employee.findByPk(existing.id, { include });
      return res.json({
        success: true,
        data: {
          employee: refreshed,
          reused: true,
        },
        message: 'Employee profile updated',
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
        message: 'Failed to generate unique employee code',
      });
    }

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
      wxUnionId: unionId || null,
      status: 'active',
      userId: boundUserId,
    });

    const fullEmployee = await Employee.findByPk(employee.id, { include });

    res.status(201).json({
      success: true,
      data: {
        employee: fullEmployee,
        reused: false,
        autoBound: Boolean(boundUserId),
        matchedUserId: boundUserId,
      },
      message: 'Employee registered successfully',
    });
  } catch (error) {
    console.error('Register employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register employee',
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
    const where = { wxUnionId: { [Op.ne]: null } };

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
