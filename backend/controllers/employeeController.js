// controllers/employeeController.js
const { Employee, Process, EmployeeProcess, User, ProcessRecord, sequelize } = require('../models');
const { Op } = require('sequelize');

const clearEmployeeWechatBindings = async (employeeId, options = {}) => {
  const transaction = options.transaction || null;
  const employee = await Employee.findByPk(employeeId, { transaction });
  if (!employee) {
    return null;
  }
  await employee.update({ wxOpenId: null, wxUnionId: null }, { transaction });
  return employee;
};

// 工具函数：生成员工编码
const generateEmployeeCode = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return 'EMP' + timestamp.slice(-6) + random;
};

// 工具函数：验证员工数据
const validateEmployeeData = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('员工姓名不能为空');
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('员工姓名不能超过100个字符');
  }
  
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.push('状态只能是active或inactive');
  }
  
  return errors;
};

const hardDeleteEmployeeById = async (employeeId, options = {}) => {
  const transaction = options.transaction || await sequelize.transaction();
  const manageTransaction = !options.transaction;
  try {
    const employee = await Employee.findByPk(employeeId, { transaction });
    if (!employee) {
      if (manageTransaction) await transaction.rollback();
      return null;
    }

    await ProcessRecord.update(
      { employeeNameSnapshot: employee.name || '' },
      { where: { employeeId: employeeId }, transaction }
    );

    await ProcessRecord.update(
      { employeeId: null },
      { where: { employeeId: employeeId }, transaction }
    );

    await EmployeeProcess.destroy({ where: { employeeId: employeeId }, transaction });

    await employee.destroy({ transaction });

    if (manageTransaction) await transaction.commit();
    return employee;
  } catch (error) {
    if (manageTransaction) await transaction.rollback();
    throw error;
  }
};

// 获取所有员工
exports.getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, keyword } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (keyword) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const employees = await Employee.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['id', 'DESC']],
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

    res.json({
      success: true,
      data: {
        employees: employees.rows,
        total: employees.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: '获取员工列表失败'
    });
  }
};

// 创建员工
exports.createEmployee = async (req, res) => {
  try {
    const { name, code, status = 'active', processes = [], processIds = [] } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';

    const validationErrors = validateEmployeeData({ name: trimmedName, status });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: '员工姓名不能为空'
      });
    }

    const existingEmployee = await Employee.findOne({
      where: { name: trimmedName }
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: '员工姓名已存在'
      });
    }

    let finalCode = code ? String(code).trim() : '';
    if (!finalCode) {
      let isCodeUnique = false;
      let attempts = 0;

      while (!isCodeUnique && attempts < 10) {
        finalCode = generateEmployeeCode();
        const existingCode = await Employee.findOne({ where: { code: finalCode } });
        if (!existingCode) {
          isCodeUnique = true;
        }
        attempts += 1;
      }

      if (!isCodeUnique) {
        return res.status(500).json({
          success: false,
          message: '生成唯一编码失败，请重试'
        });
      }
    } else {
      const existingCode = await Employee.findOne({ where: { code: finalCode } });
      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: '员工编码已存在'
        });
      }
    }

    const requestedProcessIds = Array.isArray(processIds) && processIds.length
      ? processIds
      : (Array.isArray(processes) ? processes.map((item) => {
          if (item && typeof item === 'object') {
            return item.id;
          }
          return item;
        }).filter(Boolean) : []);

    const transaction = await sequelize.transaction();
    try {
      const employee = await Employee.create({
        name: trimmedName,
        code: finalCode,
        status
      }, { transaction });

      if (requestedProcessIds.length) {
        const validProcesses = await Process.findAll({
          where: { id: requestedProcessIds }
        });

        if (validProcesses.length !== requestedProcessIds.length) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: '存在无效的工序ID'
          });
        }

        await employee.setProcesses(validProcesses, {
          through: {
            assignedAt: new Date(),
            status: 'active'
          },
          transaction
        });
      }

      await transaction.commit();

      const createdEmployee = await Employee.findByPk(employee.id, {
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

      return res.status(201).json({
        success: true,
        data: { employee: createdEmployee },
        message: '员工创建成功'
      });
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error('Create employee error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: '员工姓名已存在'
      });
    }
    res.status(500).json({
      success: false,
      message: '创建员工失败'
    });
  }
};


// 获取单个员工
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
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
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: '获取员工信息失败'
    });
  }
};

// 更新员工
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, status } = req.body;

    const employee = await Employee.findByPk(id);

    const trimmedName = typeof name === 'string' ? name.trim() : employee.name;

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    // 验证数据
    const validationErrors = validateEmployeeData({ name: trimmedName, status });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    // 检查姓名唯一性（除了当前员工）
    if (name && trimmedName !== employee.name) {
      const existingEmployee = await Employee.findOne({ 
        where: { 
          name: trimmedName,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: '员工姓名已存在'
        });
      }
    }

    // 检查编码唯一性（除了当前员工）
    if (code && code !== employee.code) {
      const existingCode = await Employee.findOne({ 
        where: { 
          code: code,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: '员工编码已存在'
        });
      }
    }

    // 更新数据
    const updateData = {};
    if (name) updateData.name = trimmedName;
    if (code) updateData.code = code;
    if (status) updateData.status = status;

    await employee.update(updateData);

    // 返回更新后的数据
    const updatedEmployee = await Employee.findByPk(id, {
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

    res.json({
      success: true,
      data: { employee: updatedEmployee },
      message: '员工更新成功'
    });
  } catch (error) {
    console.error('Update employee error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: '员工姓名已存在'
      });
    }
    res.status(500).json({
      success: false,
      message: '更新员工失败'
    });
  }
};

// 删除员工
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await hardDeleteEmployeeById(id);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    res.json({
      success: true,
      message: '员工已删除'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: '删除员工失败'
    });
  }
};

// 为员工分配工序
exports.hardDeleteEmployeeById = hardDeleteEmployeeById;
exports.clearEmployeeWechatBindings = clearEmployeeWechatBindings;

exports.assignProcesses = async (req, res) => {
  try {
    const { id } = req.params;
    const { processIds = [] } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    // 验证工序是否存在
    if (processIds.length > 0) {
      const validProcesses = await Process.findAll({
        where: { id: processIds }
      });
      
      if (validProcesses.length !== processIds.length) {
        return res.status(400).json({
          success: false,
          message: '存在无效的工序ID'
        });
      }
      
      // 重新分配工序
      await employee.setProcesses(validProcesses, {
        through: { 
          assignedAt: new Date(),
          status: 'active'
        }
      });
    } else {
      // 清空所有工序
      await employee.setProcesses([]);
    }

    // 返回更新后的员工数据
    const updatedEmployee = await Employee.findByPk(id, {
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

    res.json({
      success: true,
      data: { employee: updatedEmployee },
      message: '工序分配成功'
    });
  } catch (error) {
    console.error('Assign processes error:', error);
    res.status(500).json({
      success: false,
      message: '分配工序失败'
    });
  }
};
