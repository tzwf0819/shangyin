/**
 * 权限验证中间件
 */

const { Employee, Permission, EmployeePermission } = require('../models');

/**
 * 验证员工权限
 * @param {string|string[]} requiredPermissions - 需要的权限编码
 */
function requirePermission(requiredPermissions) {
  return async (req, res, next) => {
    try {
      const employeeId = req.employeeId || (req.employee && req.employee.id);
      
      if (!employeeId) {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      }

      // 获取员工权限
      const employee = await Employee.findOne({
        where: { id: employeeId },
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

      // 检查是否是管理员（可以查看所有合同）
      if (employee.canViewAllContracts) {
        req.employee = employee;
        return next();
      }

      // 将权限编码转换为数组
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // 检查员工是否有需要的权限
      const hasPermission = employee.permissions.some(p => 
        permissions.includes(p.code)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '没有权限执行此操作'
        });
      }

      req.employee = employee;
      next();
    } catch (error) {
      console.error('权限验证失败:', error);
      res.status(500).json({
        success: false,
        message: '权限验证失败'
      });
    }
  };
}

/**
 * 验证员工类型
 * @param {string|string[]} allowedTypes - 允许的员工类型
 */
function requireEmployeeType(allowedTypes) {
  return async (req, res, next) => {
    try {
      const employeeId = req.employeeId || (req.employee && req.employee.id);
      
      if (!employeeId) {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      }

      const employee = await Employee.findOne({
        where: { id: employeeId }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      // 将允许的类型转换为数组
      const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

      if (!types.includes(employee.employeeType)) {
        return res.status(403).json({
          success: false,
          message: '没有权限访问此功能'
        });
      }

      req.employee = employee;
      next();
    } catch (error) {
      console.error('员工类型验证失败:', error);
      res.status(500).json({
        success: false,
        message: '验证失败'
      });
    }
  };
}

module.exports = {
  requirePermission,
  requireEmployeeType
};
