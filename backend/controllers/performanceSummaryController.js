/**
 * 绩效汇总控制器
 */

const { ProcessRecord, Employee, Process, Contract, ContractProduct, Sequelize } = require('../models');

/**
 * 获取员工绩效汇总
 * GET /shangyin/performance/summary
 * 参数：
 * - employeeId: 员工 ID（可选，不传则查询所有）
 * - startDate: 开始日期（YYYY-MM-DD）
 * - endDate: 结束日期（YYYY-MM-DD）
 */
async function getPerformanceSummary(req, res) {
  try {
    const { employeeId, startDate, endDate } = req.query;

    // 构建查询条件
    const where = {
      status: 'completed'
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Sequelize.Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.createdAt = {
        [Sequelize.Op.gte]: startDate
      };
    } else if (endDate) {
      where.createdAt = {
        [Sequelize.Op.lte]: endDate
      };
    }

    // 查询绩效汇总
    const summary = await ProcessRecord.findAll({
      where,
      attributes: [
        'employeeId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'recordCount'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('payAmount')), 'totalPayAmount']
      ],
      group: ['employeeId'],
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'name', 'code', 'employeeType']
      }],
      raw: false
    });

    // 格式化结果
    const result = summary.map(item => {
      const data = item.get({ plain: true });
      return {
        employeeId: data.employeeId,
        employeeName: data.employee?.name,
        employeeCode: data.employee?.code,
        employeeType: data.employee?.employeeType,
        recordCount: parseInt(data.recordCount) || 0,
        totalQuantity: parseInt(data.totalQuantity) || 0,
        totalPayAmount: parseFloat(data.totalPayAmount) || 0
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取绩效汇总失败:', error);
    res.status(500).json({
      success: false,
      message: '获取绩效汇总失败',
      error: error.message
    });
  }
}

/**
 * 获取员工工序生产次数统计
 * GET /shangyin/performance/process-stats
 */
async function getProcessStats(req, res) {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const where = {
      status: 'completed'
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Sequelize.Op.between]: [startDate, endDate]
      };
    }

    // 查询工序统计
    const stats = await ProcessRecord.findAll({
      where,
      attributes: [
        'employeeId',
        'processId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'processCount'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('payAmount')), 'totalPayAmount']
      ],
      group: ['employeeId', 'processId'],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name']
        },
        {
          model: Process,
          as: 'process',
          attributes: ['id', 'name', 'code']
        }
      ],
      raw: false
    });

    // 格式化结果
    const result = stats.map(item => {
      const data = item.get({ plain: true });
      return {
        employeeId: data.employeeId,
        employeeName: data.employee?.name,
        processId: data.processId,
        processName: data.process?.name,
        processCode: data.process?.code,
        processCount: parseInt(data.processCount) || 0,
        totalQuantity: parseInt(data.totalQuantity) || 0,
        totalPayAmount: parseFloat(data.totalPayAmount) || 0
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取工序统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工序统计失败',
      error: error.message
    });
  }
}

/**
 * 获取单个员工的详细绩效
 * GET /shangyin/performance/employee/:id
 */
async function getEmployeePerformance(req, res) {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where = {
      employeeId: id,
      status: 'completed'
    };

    if (startDate && endDate) {
      where.createdAt = {
        [Sequelize.Op.between]: [startDate, endDate]
      };
    }

    // 查询汇总数据
    const summary = await ProcessRecord.findOne({
      where,
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'recordCount'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('payAmount')), 'totalPayAmount']
      ],
      raw: false
    });

    // 查询各工序统计
    const processStats = await ProcessRecord.findAll({
      where,
      attributes: [
        'processId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'processCount'],
        [Sequelize.fn('SUM', Sequelize.col('payAmount')), 'totalPayAmount']
      ],
      group: ['processId'],
      include: [{
        model: Process,
        as: 'process',
        attributes: ['id', 'name']
      }]
    });

    // 获取员工信息
    const employee = await Employee.findByPk(id, {
      attributes: ['id', 'name', 'code', 'employeeType']
    });

    res.json({
      success: true,
      data: {
        employee,
        summary: {
          recordCount: parseInt(summary?.recordCount) || 0,
          totalQuantity: parseInt(summary?.totalQuantity) || 0,
          totalPayAmount: parseFloat(summary?.totalPayAmount) || 0
        },
        processStats: processStats.map(item => ({
          processId: item.processId,
          processName: item.process?.name,
          processCount: parseInt(item.dataValues.processCount) || 0,
          totalPayAmount: parseFloat(item.dataValues.totalPayAmount) || 0
        }))
      }
    });
  } catch (error) {
    console.error('获取员工绩效失败:', error);
    res.status(500).json({
      success: false,
      message: '获取员工绩效失败',
      error: error.message
    });
  }
}

module.exports = {
  getPerformanceSummary,
  getProcessStats,
  getEmployeePerformance
};
