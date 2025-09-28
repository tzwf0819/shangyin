// controllers/employeeController.js
const { Employee, Process, EmployeeProcess, User } = require('../models');
const { Op } = require('sequelize');

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
    const { name, code, status = 'active', processes = [] } = req.body;

    // 验证输入数据
    const validationErrors = validateEmployeeData({ name, status });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    // 检查姓名是否已存在（代码层验证）
    const existingEmployee = await Employee.findOne({ 
      where: { name: name.trim() } 
    });
    
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: '员工姓名已存在'
      });
    }

    // 生成或验证员工编码
    let finalCode = code;
    if (!finalCode) {
      // 自动生成编码
      let isCodeUnique = false;
      let attempts = 0;
      
      while (!isCodeUnique && attempts < 10) {
        finalCode = generateEmployeeCode();
        const existingCode = await Employee.findOne({ where: { code: finalCode } });
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
    } else {
      // 验证编码唯一性
      const existingCode = await Employee.findOne({ where: { code: finalCode } });
      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: '员工编码已存在'
        });
      }
    }

    // 创建员工
    const employee = await Employee.create({
      name: name.trim(),
      code: finalCode,
      status
    });

    // 处理工序关联
    if (processes.length > 0) {
      // 验证工序是否存在
      const processIds = processes.map(p => p.id || p);
      const validProcesses = await Process.findAll({
        where: { id: processIds }
      });
      
      if (validProcesses.length !== processIds.length) {
        return res.status(400).json({
          success: false,
          message: '存在无效的工序ID'
        });
      }
      
      // 使用关联方法
      await employee.setProcesses(validProcesses, {
        through: { 
          assignedAt: new Date(),
          status: 'active'
        }
      });
    }

    // 返回完整数据
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

    res.status(201).json({
      success: true,
      data: { employee: createdEmployee },
      message: '员工创建成功'
    });
  } catch (error) {
    console.error('Create employee error:', error);
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
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    // 验证数据
    const validationErrors = validateEmployeeData({ name, status });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0]
      });
    }

    // 检查姓名唯一性（除了当前员工）
    if (name && name.trim() !== employee.name) {
      const existingEmployee = await Employee.findOne({ 
        where: { 
          name: name.trim(),
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
    if (name) updateData.name = name.trim();
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
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    // 软删除 - 将状态设置为inactive
    await employee.update({ status: 'inactive' });

    res.json({
      success: true,
      message: '员工已停用'
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
