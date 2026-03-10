/**
 * 权限管理控制器
 */

const { Permission, Employee, EmployeePermission } = require('../models');

/**
 * 获取权限列表
 * GET /shangyin/permissions
 */
async function getPermissions(req, res) {
  try {
    const { module, keyword } = req.query;
    
    const where = {};
    if (module) {
      where.module = module;
    }
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const permissions = await Permission.findAll({
      where,
      order: [['module', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('获取权限列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取权限列表失败',
      error: error.message
    });
  }
}

/**
 * 创建权限
 * POST /shangyin/permissions
 */
async function createPermission(req, res) {
  try {
    const { name, code, description, module } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: '权限名称和编码不能为空'
      });
    }

    // 检查权限编码是否已存在
    const existing = await Permission.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '权限编码已存在'
      });
    }

    const permission = await Permission.create({
      name,
      code,
      description,
      module: module || 'default'
    });

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('创建权限失败:', error);
    res.status(500).json({
      success: false,
      message: '创建权限失败',
      error: error.message
    });
  }
}

/**
 * 更新权限
 * PUT /shangyin/permissions/:id
 */
async function updatePermission(req, res) {
  try {
    const { id } = req.params;
    const { name, code, description, module } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: '权限不存在'
      });
    }

    // 如果修改了编码，检查是否与其他权限冲突
    if (code && code !== permission.code) {
      const existing = await Permission.findOne({ where: { code } });
      if (existing && existing.id !== id) {
        return res.status(400).json({
          success: false,
          message: '权限编码已存在'
        });
      }
    }

    await permission.update({
      name: name || permission.name,
      code: code || permission.code,
      description: description !== undefined ? description : permission.description,
      module: module || permission.module
    });

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('更新权限失败:', error);
    res.status(500).json({
      success: false,
      message: '更新权限失败',
      error: error.message
    });
  }
}

/**
 * 删除权限
 * DELETE /shangyin/permissions/:id
 */
async function deletePermission(req, res) {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: '权限不存在'
      });
    }

    await permission.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除权限失败:', error);
    res.status(500).json({
      success: false,
      message: '删除权限失败',
      error: error.message
    });
  }
}

/**
 * 获取员工权限
 * GET /shangyin/employees/:id/permissions
 */
async function getEmployeePermissions(req, res) {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions'
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
      data: employee.permissions
    });
  } catch (error) {
    console.error('获取员工权限失败:', error);
    res.status(500).json({
      success: false,
      message: '获取员工权限失败',
      error: error.message
    });
  }
}

/**
 * 分配权限给员工
 * POST /shangyin/employees/:id/permissions
 */
async function assignPermissions(req, res) {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: '权限 ID 必须为数组'
      });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    // 验证权限 ID 是否存在
    const permissions = await Permission.findAll({
      where: { id: permissionIds }
    });

    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: '部分权限 ID 不存在'
      });
    }

    // 获取当前权限
    const currentPermissions = await employee.getPermissions();
    const currentIds = currentPermissions.map(p => p.id);

    // 需要添加的权限
    const toAdd = permissionIds.filter(id => !currentIds.includes(id));
    // 需要移除的权限
    const toRemove = currentIds.filter(id => !permissionIds.includes(id));

    // 添加权限
    if (toAdd.length > 0) {
      await employee.addPermissions(toAdd);
    }

    // 移除权限
    if (toRemove.length > 0) {
      await employee.removePermissions(toRemove);
    }

    // 重新获取权限列表
    const updatedEmployee = await Employee.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    });

    res.json({
      success: true,
      data: updatedEmployee.permissions
    });
  } catch (error) {
    console.error('分配权限失败:', error);
    res.status(500).json({
      success: false,
      message: '分配权限失败',
      error: error.message
    });
  }
}

/**
 * 检查员工权限
 * GET /shangyin/employees/:id/permissions/check/:code
 */
async function checkPermission(req, res) {
  try {
    const { id, code } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    const hasPermission = employee.permissions.some(p => p.code === code);

    res.json({
      success: true,
      data: {
        hasPermission,
        code
      }
    });
  } catch (error) {
    console.error('检查权限失败:', error);
    res.status(500).json({
      success: false,
      message: '检查权限失败',
      error: error.message
    });
  }
}

module.exports = {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getEmployeePermissions,
  assignPermissions,
  checkPermission
};
