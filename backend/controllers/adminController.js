// controllers/adminController.js
const { Employee, Process, ProductType, Contract, EmployeeProcess, User } = require('../models');
const { Op } = require('sequelize');

// 获取管理员面板统计数据
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      employeesCount,
      processesCount,
      productTypesCount,
      contractsCount,
      activeEmployeesCount,
      employeesWithWechatCount
    ] = await Promise.all([
      Employee.count(),
      Process.count(),
      ProductType.count(),
      Contract.count(),
      Employee.count({ where: { status: 'active' } }),
      Employee.count({
        where: {
          [Op.or]: [
            { wxOpenId: { [Op.not]: null } },
            { wxUnionId: { [Op.not]: null } }
          ]
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        employees: employeesCount,
        processes: processesCount,
        productTypes: productTypesCount,
        contracts: contractsCount,
        totalEmployees: employeesCount,
        totalProcesses: processesCount,
        totalProductTypes: productTypesCount,
        totalContracts: contractsCount,
        activeEmployees: activeEmployeesCount,
        employeesWithWechat: employeesWithWechatCount
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
};

// 获取所有员工（Admin视图，包含更多信息）
exports.getAllEmployeesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, hasWechat, keyword } = req.query;

    const buildWhereClause = () => {
      const conditions = [];

      if (status) {
        conditions.push({ status });
      }

      if (keyword) {
        conditions.push({
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { code: { [Op.like]: `%${keyword}%` } }
          ]
        });
      }

      if (hasWechat !== undefined) {
        if (hasWechat === 'true') {
          conditions.push({
            [Op.or]: [
              { wxOpenId: { [Op.not]: null } },
              { wxUnionId: { [Op.not]: null } }
            ]
          });
        } else if (hasWechat === 'false') {
          conditions.push({
            [Op.and]: [
              { wxOpenId: null },
              { wxUnionId: null }
            ]
          });
        }
      }

      if (conditions.length === 0) {
        return {};
      }

      return { [Op.and]: conditions };
    };

    const whereClause = buildWhereClause();
    const countWhereClause = buildWhereClause();

    const employees = await Employee.findAll({
      where: whereClause,
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
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const total = await Employee.count({ where: countWhereClause });

    res.json({
      success: true,
      data: {
        employees,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get employees admin error:', error);
    res.status(500).json({
      success: false,
      message: '获取员工列表失败',
      error: error.message
    });
  }
};

// Admin专用：更新员工信息及工序
exports.updateEmployeeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, processIds } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '员工姓名不能为空'
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: '员工姓名不能超过100个字符'
        });
      }
      updateData.name = name.trim();
    }

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '员工状态无效'
        });
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length > 0) {
      await employee.update(updateData);
    }

    if (processIds !== undefined) {
      if (!Array.isArray(processIds)) {
        return res.status(400).json({
          success: false,
          message: 'processIds必须为数组'
        });
      }

      const normalizedIds = [...new Set(processIds.map(id => parseInt(id, 10)).filter(id => !Number.isNaN(id)))];

      if (normalizedIds.length > 0) {
        const validProcesses = await Process.findAll({
          where: { id: normalizedIds }
        });

        if (validProcesses.length !== normalizedIds.length) {
          return res.status(400).json({
            success: false,
            message: '存在无效的工序ID'
          });
        }

        await employee.setProcesses(validProcesses, {
          through: {
            assignedAt: new Date(),
            status: 'active'
          }
        });
      } else {
        await employee.setProcesses([]);
      }
    }

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
      message: '员工更新成功',
      data: { employee: updatedEmployee }
    });
  } catch (error) {
    console.error('Update employee admin error:', error);
    res.status(500).json({
      success: false,
      message: '更新员工失败'
    });
  }
};

// Admin专用：删除员工并清除微信关联
exports.deleteEmployeeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    // 记录删除信息
    const deletedInfo = {
      id: employee.id,
      name: employee.name,
      code: employee.code,
      wxOpenId: employee.wxOpenId,
      wxUnionId: employee.wxUnionId
    };

    // 删除关联的工序记录
    const deletedProcesses = await EmployeeProcess.destroy({
      where: { employeeId: id }
    });

    // 删除员工记录（彻底清除微信关联）
    await employee.destroy();

    res.json({
      success: true,
      message: '员工删除成功，微信关联已清除，下次该微信登录将视为新用户',
      data: {
        deletedEmployee: deletedInfo,
        deletedProcessAssignments: deletedProcesses,
        wechatCleared: !!(deletedInfo.wxOpenId || deletedInfo.wxUnionId)
      }
    });
  } catch (error) {
    console.error('Delete employee admin error:', error);
    res.status(500).json({
      success: false,
      message: '删除员工失败'
    });
  }
};

// Admin专用：清除员工微信关联
// Admin专用：手动绑定或解绑微信员工
exports.bindWechatEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body || {};

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID参数无效' });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: '微信员工不存在' });
    }

    if (userId === null || userId === undefined || userId === '') {
      await employee.update({ userId: null });
      const refreshed = await Employee.findByPk(id, {
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
      return res.json({ success: true, message: '绑定已解除', data: { employee: refreshed } });
    }

    const parsedUserId = Number(userId);
    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({ success: false, message: 'userId参数无效' });
    }

    const user = await User.findByPk(parsedUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: '目标员工不存在' });
    }

    const existingBinding = await Employee.findOne({
      where: { userId: parsedUserId },
      attributes: ['id', 'name']
    });
    if (existingBinding && existingBinding.id !== employee.id) {
      return res.status(409).json({ success: false, message: '该员工已绑定其他微信账号' });
    }

    await employee.update({ userId: parsedUserId });

    const refreshed = await Employee.findByPk(id, {
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

    return res.json({ success: true, message: '绑定关系已更新', data: { employee: refreshed } });
  } catch (error) {
    console.error('Bind wechat employee error:', error);
    return res.status(500).json({ success: false, message: '更新绑定关系失败' });
  }
};

exports.clearWechatBinding = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID参数无效'
      });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    if (!employee.wxOpenId && !employee.wxUnionId) {
      return res.status(400).json({
        success: false,
        message: '该员工没有微信关联'
      });
    }

    const oldWxInfo = {
      wxOpenId: employee.wxOpenId,
      wxUnionId: employee.wxUnionId,
      boundUserId: employee.userId
    };

    // 清除微信关联信息
    await employee.update({
      wxOpenId: null,
      wxUnionId: null,
      userId: null
    });

    res.json({
      success: true,
      message: '微信关联已清除，该微信下次登录将视为新用户',
      data: {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeCode: employee.code,
        clearedBoundUserId: oldWxInfo.boundUserId,
        clearedWxInfo: oldWxInfo
      }
    });
  } catch (error) {
    console.error('Clear wechat binding error:', error);
    res.status(500).json({
      success: false,
      message: '清除微信关联失败'
    });
  }
};

// Admin专用：批量清除微信关联
exports.batchClearWechatBinding = async (req, res) => {
  try {
    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '员工ID列表不能为空'
      });
    }

    // 获取要清除的员工信息
    const employees = await Employee.findAll({
      where: { 
        id: employeeIds,
        [Op.or]: [
          { wxOpenId: { [Op.not]: null } },
          { wxUnionId: { [Op.not]: null } }
        ]
      },
      attributes: ['id', 'name', 'code', 'wxOpenId', 'wxUnionId', 'userId']
    });

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到有微信关联的指定员工'
      });
    }

    // 记录清除前的信息
    const clearedInfo = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      code: emp.code,
      wxOpenId: emp.wxOpenId,
      wxUnionId: emp.wxUnionId,
      userId: emp.userId
    }));

    // 批量清除微信关联
    const [updatedCount] = await Employee.update(
      { wxOpenId: null, wxUnionId: null, userId: null },
      { where: { id: employeeIds } }
    );

    res.json({
      success: true,
      message: `成功清除${clearedInfo.length}个员工的微信关联`,
      data: {
        clearedCount: clearedInfo.length,
        totalRequested: employeeIds.length,
        clearedEmployees: clearedInfo
      }
    });
  } catch (error) {
    console.error('Batch clear wechat binding error:', error);
    res.status(500).json({
      success: false,
      message: '批量清除微信关联失败'
    });
  }
};

// Admin专用：批量删除员工
exports.batchDeleteEmployees = async (req, res) => {
  try {
    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '员工ID列表不能为空'
      });
    }

    // 获取要删除的员工信息
    const employees = await Employee.findAll({
      where: { id: employeeIds },
      attributes: ['id', 'name', 'code', 'wxOpenId', 'wxUnionId', 'userId']
    });

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的员工'
      });
    }

    // 记录删除的信息
    const deletedInfo = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      code: emp.code,
      wxOpenId: emp.wxOpenId,
      wxUnionId: emp.wxUnionId,
      userId: emp.userId
    }));

    // 删除关联的工序记录
    const deletedProcesses = await EmployeeProcess.destroy({
      where: { employeeId: employeeIds }
    });

    // 批量删除员工
    const deletedCount = await Employee.destroy({
      where: { id: employeeIds }
    });

    res.json({
      success: true,
      message: `成功删除${deletedCount}个员工，微信关联已清除`,
      data: {
        deletedCount: deletedCount,
        deletedEmployees: deletedInfo,
        deletedProcessAssignments: deletedProcesses
      }
    });
  } catch (error) {
    console.error('Batch delete employees error:', error);
    res.status(500).json({
      success: false,
      message: '批量删除员工失败'
    });
  }
};
