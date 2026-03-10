/**
 * 工作时间验证中间件
 */

const { Employee } = require('../models');

/**
 * 检查是否在工作时间内
 */
async function checkWorkTime(req, res, next) {
  try {
    // 从请求中获取员工 ID（由认证中间件设置）
    const employeeId = req.employeeId || (req.employee && req.employee.id);
    
    if (!employeeId) {
      // 如果没有员工信息，跳过检查
      return next();
    }

    // 获取员工信息
    const employee = await Employee.findOne({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: '员工不存在'
      });
    }

    req.employee = employee;

    // 业务员不受时间限制
    if (employee.employeeType === 'salesman') {
      return next();
    }

    // 获取当前时间
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS

    // 获取工作时间
    const workStartTime = employee.workStartTime || '08:00:00';
    const workEndTime = employee.workEndTime || '18:00:00';

    // 检查是否在工作时间内
    if (currentTime < workStartTime || currentTime > workEndTime) {
      return res.status(403).json({
        success: false,
        message: `当前不在工作时间 (${workStartTime}-${workEndTime})`,
        currentTime,
        workStartTime,
        workEndTime
      });
    }

    next();
  } catch (error) {
    console.error('工作时间验证失败:', error);
    res.status(500).json({
      success: false,
      message: '工作时间验证失败'
    });
  }
}

/**
 * 验证员工类型是否为工人
 */
async function requireWorker(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  if (req.employee.employeeType !== 'worker') {
    return res.status(403).json({
      success: false,
      message: '此功能仅限工人使用'
    });
  }

  next();
}

/**
 * 验证员工类型是否为业务员
 */
async function requireSalesman(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  if (req.employee.employeeType !== 'salesman') {
    return res.status(403).json({
      success: false,
      message: '此功能仅限业务员使用'
    });
  }

  next();
}

module.exports = {
  checkWorkTime,
  requireWorker,
  requireSalesman
};
