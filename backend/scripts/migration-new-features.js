/**
 * 数据库迁移脚本：添加新功能字段
 * 
 * 更新内容：
 * 1. 员工表：增加类型、上下班时间、登录时间限制
 * 2. 产品类型表：增加二级分类、通知工序
 * 3. 工序表：增加激光雕刻生产方式字段
 * 4. 合同产品表：增加产品编号尾号
 * 5. 生产记录表：增加激光雕刻生产方式、业务员通知标记
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

async function runMigration() {
  console.log('开始数据库迁移...');

  try {
    // 1. 员工表新增字段
    console.log('更新员工表...');
    await sequelize.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS employeeType ENUM('worker', 'salesman') DEFAULT 'worker' COMMENT '员工类型：worker-工人，salesman-业务员'
    `).catch(() => console.log('employeeType 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS workStartTime TIME DEFAULT '08:00:00' COMMENT '上班开始时间'
    `).catch(() => console.log('workStartTime 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS workEndTime TIME DEFAULT '18:00:00' COMMENT '下班结束时间'
    `).catch(() => console.log('workEndTime 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS canViewAllContracts BOOLEAN DEFAULT false COMMENT '是否可以查看所有合同（业务员权限）'
    `).catch(() => console.log('canViewAllContracts 字段可能已存在'));

    // 2. 产品类型表新增字段
    console.log('更新产品类型表...');
    await sequelize.query(`
      ALTER TABLE product_types 
      ADD COLUMN IF NOT EXISTS parentId INTEGER DEFAULT NULL COMMENT '父级分类 ID（二级分类）'
    `).catch(() => console.log('parentId 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE product_types 
      ADD COLUMN IF NOT EXISTS notifyProcessId INTEGER DEFAULT NULL COMMENT '通知工序 ID'
    `).catch(() => console.log('notifyProcessId 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE product_types 
      ADD COLUMN IF NOT EXISTS needNotification BOOLEAN DEFAULT false COMMENT '是否需要工序完成通知'
    `).catch(() => console.log('needNotification 字段可能已存在'));

    // 3. 工序表新增字段
    console.log('更新工序表...');
    await sequelize.query(`
      ALTER TABLE processes 
      ADD COLUMN IF NOT EXISTS isLaserEngraving BOOLEAN DEFAULT false COMMENT '是否为激光雕刻工序'
    `).catch(() => console.log('isLaserEngraving 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE processes 
      ADD COLUMN IF NOT EXISTS laserMode1PayRate DECIMAL(10,2) DEFAULT 0 COMMENT '激光雕刻模式 1 绩效单价'
    `).catch(() => console.log('laserMode1PayRate 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE processes 
      ADD COLUMN IF NOT EXISTS laserMode2PayRate DECIMAL(10,2) DEFAULT 0 COMMENT '激光雕刻模式 2 绩效单价'
    `).catch(() => console.log('laserMode2PayRate 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE processes 
      ADD COLUMN IF NOT EXISTS laserMode1Name VARCHAR(50) DEFAULT '模式 A' COMMENT '激光雕刻模式 1 名称'
    `).catch(() => console.log('laserMode1Name 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE processes 
      ADD COLUMN IF NOT EXISTS laserMode2Name VARCHAR(50) DEFAULT '模式 B' COMMENT '激光雕刻模式 2 名称'
    `).catch(() => console.log('laserMode2Name 字段可能已存在'));

    // 4. 合同产品表新增字段
    console.log('更新合同产品表...');
    await sequelize.query(`
      ALTER TABLE contract_products 
      ADD COLUMN IF NOT EXISTS productSuffix VARCHAR(20) DEFAULT '' COMMENT '产品编号尾号（如 -1, -2）'
    `).catch(() => console.log('productSuffix 字段可能已存在'));

    // 5. 生产记录表新增字段
    console.log('更新生产记录表...');
    await sequelize.query(`
      ALTER TABLE process_records 
      ADD COLUMN IF NOT EXISTS laserMode VARCHAR(20) DEFAULT NULL COMMENT '激光雕刻生产方式（mode1/mode2）'
    `).catch(() => console.log('laserMode 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE process_records 
      ADD COLUMN IF NOT EXISTS notificationSent BOOLEAN DEFAULT false COMMENT '是否已发送业务员通知'
    `).catch(() => console.log('notificationSent 字段可能已存在'));

    await sequelize.query(`
      ALTER TABLE process_records 
      ADD COLUMN IF NOT EXISTS notificationTime DATETIME DEFAULT NULL COMMENT '业务员通知发送时间'
    `).catch(() => console.log('notificationTime 字段可能已存在'));

    // 6. 创建权限表
    console.log('创建权限表...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE COMMENT '权限名称',
        code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
        description TEXT COMMENT '权限描述',
        module VARCHAR(50) DEFAULT 'default' COMMENT '所属模块',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表'
    `).catch(() => console.log('permissions 表可能已存在'));

    // 7. 创建员工权限关联表
    console.log('创建员工权限关联表...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS employee_permissions (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        employeeId INTEGER NOT NULL COMMENT '员工 ID',
        permissionId INTEGER NOT NULL COMMENT '权限 ID',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_employee_permission (employeeId, permissionId),
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工权限关联表'
    `).catch(() => console.log('employee_permissions 表可能已存在'));

    // 8. 创建企业微信通知配置表
    console.log('创建企业微信通知配置表...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS wecom_configs (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        corpId VARCHAR(100) COMMENT '企业微信 CorpID',
        agentId VARCHAR(100) COMMENT '应用 AgentId',
        secret VARCHAR(200) COMMENT '应用 Secret',
        token VARCHAR(200) COMMENT 'Token',
        encodingAesKey VARCHAR(200) COMMENT 'EncodingAESKey',
        enabled BOOLEAN DEFAULT false COMMENT '是否启用',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业微信配置表'
    `).catch(() => console.log('wecom_configs 表可能已存在'));

    // 9. 创建通知发送记录表
    console.log('创建通知发送记录表...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        contractId INTEGER NOT NULL COMMENT '合同 ID',
        contractProductId INTEGER NOT NULL COMMENT '合同产品 ID',
        processId INTEGER NOT NULL COMMENT '工序 ID',
        salesmanId INTEGER COMMENT '业务员 ID',
        notificationType VARCHAR(50) DEFAULT 'process_complete' COMMENT '通知类型',
        content TEXT COMMENT '通知内容',
        status ENUM('pending', 'sent', 'failed') DEFAULT 'pending' COMMENT '发送状态',
        errorMessage TEXT COMMENT '错误信息',
        sentAt DATETIME DEFAULT NULL COMMENT '发送时间',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知发送记录表'
    `).catch(() => console.log('notification_logs 表可能已存在'));

    console.log('✅ 数据库迁移完成！');

    // 插入默认权限数据
    console.log('插入默认权限数据...');
    const defaultPermissions = [
      { name: '查看所有合同', code: 'contracts:view:all', module: 'contracts' },
      { name: '查看自己的合同', code: 'contracts:view:self', module: 'contracts' },
      { name: '提交生产记录', code: 'production:submit', module: 'production' },
      { name: '查看生产记录', code: 'production:view', module: 'production' },
      { name: '管理员工', code: 'employees:manage', module: 'employees' },
      { name: '管理工序', code: 'processes:manage', module: 'processes' },
      { name: '管理合同', code: 'contracts:manage', module: 'contracts' },
      { name: '查看绩效汇总', code: 'performance:summary', module: 'performance' },
    ];

    for (const perm of defaultPermissions) {
      await sequelize.query(
        `INSERT IGNORE INTO permissions (name, code, module) VALUES (?, ?, ?)`,
        { replacements: [perm.name, perm.code, perm.module] }
      );
    }

    console.log('✅ 默认权限数据已插入！');

  } catch (error) {
    console.error('数据库迁移失败:', error);
    throw error;
  }
}

module.exports = runMigration;
