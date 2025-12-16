/**
 * MySQL数据库初始化脚本（纯SQL方式）
 * 用于初始化远程MySQL数据库表结构
 */

const { Sequelize, DataTypes } = require('sequelize');

// 使用MySQL配置
const sequelize = new Sequelize('shangyin', 'root', 'shaoyansa', {
  host: '82.156.83.99',
  port: 3306,
  dialect: 'mysql',
  logging: false, // 设为true可查看SQL语句
  dialectOptions: {
    charset: 'utf8mb4',
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function initializeMySQLDatabase() {
  try {
    console.log('开始初始化MySQL数据库 (shangyin)...');

    // 测试连接
    await sequelize.authenticate();
    console.log('✓ MySQL数据库连接成功');

    // 定义表结构（使用纯SQL或sequelize模型定义）
    console.log('正在创建表结构...');
    
    // 创建 users 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(100) NOT NULL UNIQUE,
        nickname VARCHAR(100),
        avatarUrl TEXT,
        gender TINYINT DEFAULT 0,
        city VARCHAR(50),
        province VARCHAR(50),
        country VARCHAR(50),
        language VARCHAR(10),
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ users 表创建完成');

    // 创建 employees 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NULL,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(100) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ employees 表创建完成');

    // 创建 processes 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS processes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        payRate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payRateUnit ENUM('perItem', 'perHour') DEFAULT 'perItem',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ processes 表创建完成');

    // 创建 product_types 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS product_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(100) UNIQUE,
        description TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ product_types 表创建完成');

    // 创建 contracts 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contract_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contractNumber VARCHAR(100) NOT NULL UNIQUE,
        partyAName VARCHAR(150),
        partyBName VARCHAR(150),
        signedDate VARCHAR(100),
        signedLocation VARCHAR(150),
        isNewArtwork BOOLEAN DEFAULT FALSE,
        clause1 TEXT,
        clause2 TEXT,
        clause3 TEXT,
        clause4 TEXT,
        clause5 TEXT,
        clause6 TEXT,
        clause7 TEXT,
        clause8 TEXT,
        clause9 TEXT,
        clause10 TEXT,
        partyACompanyName VARCHAR(200),
        partyAAddress VARCHAR(200),
        partyAContact VARCHAR(100),
        partyAPhoneFax VARCHAR(120),
        partyABank VARCHAR(150),
        partyABankNo VARCHAR(100),
        partyABankAccount VARCHAR(120),
        partyATaxNumber VARCHAR(120),
        partyBCompanyName VARCHAR(200),
        partyBAddress VARCHAR(200),
        partyBContact VARCHAR(100),
        partyBPhoneFax VARCHAR(120),
        partyBBank VARCHAR(150),
        partyBBankNo VARCHAR(100),
        partyBBankAccount VARCHAR(120),
        partyBTaxNumber VARCHAR(120),
        isReviewed BOOLEAN DEFAULT FALSE,
        isScheduled BOOLEAN DEFAULT FALSE,
        inkCapacity VARCHAR(120),
        cellShape VARCHAR(120),
        remark TEXT,
        status VARCHAR(100),
        contractAttribute VARCHAR(100),
        deliveryDeadline VARCHAR(100),
        actualDeliveryDate VARCHAR(100),
        settlementDate VARCHAR(100),
        paymentStatus VARCHAR(100),
        paymentDate VARCHAR(100),
        shippingDate VARCHAR(100),
        salesId VARCHAR(100),
        salesEmployeeId INT NULL,
        termsJson TEXT,
        processStatusJson TEXT,
        extraInfoJson TEXT,
        rawDataJson TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ contract_records 表创建完成');

    // 创建 contract_products 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contract_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contractId INT NOT NULL,
        productIndex INT,
        productId VARCHAR(120),
        productCode VARCHAR(120),
        productName VARCHAR(150) NOT NULL,
        specification VARCHAR(150),
        carveWidth VARCHAR(120),
        meshType VARCHAR(120),
        lineCount VARCHAR(120),
        volumeRatio VARCHAR(120),
        inkVolume VARCHAR(120),
        quantity VARCHAR(120),
        unitPrice VARCHAR(120),
        plateUnitPrice VARCHAR(120),
        totalAmount VARCHAR(120),
        deliveryDeadline VARCHAR(120),
        productTypeId VARCHAR(120),
        productTypeName VARCHAR(150),
        productType TEXT,
        cellShape VARCHAR(120),
        newWoodBox BOOLEAN,
        extraInfoJson TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ contract_products 表创建完成');

    // 创建 process_records 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS process_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT NULL,
        contractId INT NOT NULL,
        contractProductId INT NOT NULL,
        processId INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        actualTimeMinutes INT NOT NULL DEFAULT 0,
        payRateSnapshot DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payRateUnitSnapshot ENUM('perItem', 'perHour') NOT NULL DEFAULT 'perItem',
        employeeNameSnapshot VARCHAR(120) NOT NULL DEFAULT '',
        payAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status ENUM('pending', 'completed') DEFAULT 'completed',
        notes TEXT,
        -- 评分相关字段
        rating INT DEFAULT NULL COMMENT '评分(0,5,10分)',
        ratingEmployeeId INT DEFAULT NULL COMMENT '评分员工ID',
        ratingEmployeeName VARCHAR(120) DEFAULT NULL COMMENT '评分员工姓名',
        ratingTime DATETIME DEFAULT NULL COMMENT '评分时间',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ process_records 表创建完成');

    // 创建 product_type_processes 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS product_type_processes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        productTypeId INT NOT NULL,
        processId INT NOT NULL,
        sequence INT DEFAULT 0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ product_type_processes 表创建完成');

    // 创建 employee_processes 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS employee_processes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT NOT NULL,
        processId INT NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ employee_processes 表创建完成');

    // 添加外键约束（可选，根据需要启用）
    console.log('数据库表结构创建完成！');

    // 检查是否存在数据
    const [userResult] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const userCount = userResult[0].count;
    
    if (userCount === 0) {
      console.log('数据库为空，添加默认数据...');
      
      // 插入默认工序
      await sequelize.query(`
        INSERT INTO processes (name, description, payRate, payRateUnit, createdAt, updatedAt) VALUES
        ('粗加工', '初步加工处理', 10.00, 'perItem', NOW(), NOW()),
        ('精加工', '精确加工处理', 15.00, 'perItem', NOW(), NOW()),
        ('检验', '质量检验', 5.00, 'perItem', NOW(), NOW()),
        ('包装', '产品包装', 3.00, 'perItem', NOW(), NOW());
      `);
      console.log('✓ 默认工序数据添加完成');
    } else {
      console.log('数据库中已存在数据，跳过默认数据插入');
    }

    console.log('\\nMySQL数据库初始化成功完成！');

  } catch (error) {
    console.error('MySQL数据库初始化失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeMySQLDatabase()
    .then(() => {
      console.log('\\n数据库初始化脚本执行成功');
      process.exit(0);
    })
    .catch(error => {
      console.error('\\n数据库初始化脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = initializeMySQLDatabase;