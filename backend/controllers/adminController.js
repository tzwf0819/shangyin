// controllers/adminController.js
const { Employee, Process, ProductType, Contract, EmployeeProcess } = require('../models');
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
      Employee.count({ where: { wxOpenId: { [Op.not]: null } } })
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

    const whereClause = {};
    if (status) whereClause.status = status;
    if (keyword) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (hasWechat !== undefined) {
      if (hasWechat === 'true') {
        whereClause.wxOpenId = { [Op.not]: null };
      } else if (hasWechat === 'false') {
        whereClause.wxOpenId = null;
      }
    }

    const employees = await Employee.findAndCountAll({
      where: whereClause,
      include: [{
        model: Process,
        as: 'processes',
        through: { 
          attributes: ['assignedAt', 'status'],
          where: { status: 'active' }
        },
        required: false
      }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
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
    console.error('Get employees admin error:', error);
    res.status(500).json({
      success: false,
      message: '获取员工列表失败'
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
      wxUnionId: employee.wxUnionId
    };

    // 清除微信关联信息
    await employee.update({
      wxOpenId: null,
      wxUnionId: null
    });

    res.json({
      success: true,
      message: '微信关联已清除，该微信下次登录将视为新用户',
      data: {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeCode: employee.code,
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
      attributes: ['id', 'name', 'code', 'wxOpenId', 'wxUnionId']
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
      wxUnionId: emp.wxUnionId
    }));

    // 批量清除微信关联
    const [updatedCount] = await Employee.update(
      { wxOpenId: null, wxUnionId: null },
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
      attributes: ['id', 'name', 'code', 'wxOpenId', 'wxUnionId']
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
      wxUnionId: emp.wxUnionId
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
