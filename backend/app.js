require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const runDatabaseMigrations = require('./scripts/databaseMigrations');

const app = express();
app.use(cors());
app.use(bodyParser.json());
// 支持 application/x-www-form-urlencoded（例如传统表单提交）
app.use(bodyParser.urlencoded({ extended: true }));

// 管理后台静态页面（优先使用构建产物 dist）
let adminStaticPath = path.join(__dirname, '../admin/dist');
if (!fs.existsSync(path.join(adminStaticPath, 'index.html'))) {
  // 回退到源码根目录（开发模式通过 Vite dev server 访问，这里仅作为占位）
  adminStaticPath = path.join(__dirname, '../admin');
  console.log('[admin] dist 未找到，使用源码目录提供静态文件', adminStaticPath);
} else {
  console.log('[admin] 使用构建后的 dist 目录提供静态文件', adminStaticPath);
}
// 静态资源托管：优先精确匹配实际文件
app.use('/shangyin/admin', express.static(adminStaticPath, { index: 'index.html', maxAge: '1h' }));
// SPA Fallback：仅当请求不包含点号（认为不是具体文件）时返回 index.html
app.get('/shangyin/admin*', (req, res, next) => {
  const requestPath = req.path;
  if (/\.[a-zA-Z0-9]+$/.test(requestPath)) {
    // 例如 /shangyin/admin/assets/vue.global.js（旧路径），不应回退到 index，交给后续 404 处理
    return next();
  }
  res.sendFile(path.join(adminStaticPath, 'index.html'));
});

// 健康检查与根信息
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '上茚工厂管理系统 API',
    version: '1.0.0',
    endpoints: [
      '/shangyin/auth',
      '/shangyin/product-types',
      '/shangyin/processes',
      '/shangyin/employees',
      '/shangyin/wechat',
      '/shangyin/contracts',
      '/shangyin/task',
      '/shangyin/api/admin',
      '/shangyin/production',
      '/shangyin/performance',
      '/shangyin/admin'
    ],
    timestamp: new Date().toISOString(),
  });
});
// 先处理带尾斜杠的精确路径，返回健康检查 JSON
app.get('/shangyin/', (req, res) => {
  res.json({
    success: true,
    message: '上茚工厂管理系统 API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});
// 仅当路径严格为 /shangyin（不含尾斜杠）时重定向，避免对 /shangyin/ 误重定向
app.get(/^\/?shangyin$/, (req, res) => res.redirect('/shangyin/'));

// 业务路由 - 统一 /shangyin 前缀
app.use('/shangyin/auth', require('./routes/auth'));
app.use('/shangyin/admin-auth', require('./routes/adminAuth')); // JWT 管理员登录
// 极简内存令牌登录（单用户），访问: POST /shangyin/admin-login/login
// 返回 { success:true, data:{ token } }，后续接口附带 Authorization: Bearer <token>
app.use('/shangyin/admin-login', require('./routes/adminLoginSimple').router);
app.use('/shangyin/product-types', require('./routes/productType'));
app.use('/shangyin/processes', require('./routes/process'));
app.use('/shangyin/employees', require('./routes/employee'));
app.use('/shangyin/wechat', require('./routes/wechat'));
app.use('/shangyin/contracts', require('./routes/contract'));
app.use('/shangyin/api/admin', require('./routes/admin'));
app.use('/shangyin/task', require('./routes/task'));
app.use('/shangyin/production', require('./routes/production'));
app.use('/shangyin/qrcodes', require('./routes/qrcode'));
app.use('/shangyin/performance', require('./routes/performance'));

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;

// Database connection and server startup
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // 检查数据库类型并初始化
    const dialect = sequelize.getDialect();
    console.log(`Database dialect: ${dialect}`);

    // 在测试环境中，需要等待数据库初始化完成
    if (process.env.NODE_ENV === 'test') {
      console.log('Test environment detected - waiting for database initialization...');

      if (dialect === 'mysql') {
        // MySQL数据库：对于测试环境，进行详细但轻量级的数据库结构检查
        console.log('开始检查 MySQL 数据库结构...');
        await sequelize.authenticate();
        console.log('✓ 数据库连接成功');

        // 显示数据库结构的详细信息（不进行修改操作）
        const { QueryTypes } = require('sequelize');
        try {
          console.log('=== 数据库结构检测报告 ===');

          // 获取所有表
          const tables = await sequelize.query('SHOW TABLES;', {
            type: QueryTypes.SELECT,
            raw: true
          });

          const tableNames = tables.map(row => {
            return row.Tables_in_shangyin ||
                   row['Tables_in_' + (process.env.DB_NAME || 'shangyin')] ||
                   row.table_name;
          }).filter(name => name);

          console.log(`发现 ${tableNames.length} 个表:`, JSON.stringify(tableNames, null, 2));

          // 检查关键表是否存在
          const requiredTables = [
            'users', 'employees', 'processes', 'product_types', 'contract_records',
            'contract_products', 'process_records', 'product_type_processes', 'employee_processes'
          ];

          const existingTables = new Set(tableNames);
          const missingTables = requiredTables.filter(table => !existingTables.has(table));
          const existingRequiredTables = requiredTables.filter(table => existingTables.has(table));

          console.log(`\n关键表状态:`);
          console.log(`- 已存在关键表 (${existingRequiredTables.length}/${requiredTables.length}):`, existingRequiredTables);
          if (missingTables.length > 0) {
            console.log(`- 缺失关键表 (${missingTables.length}):`, missingTables);
          } else {
            console.log('- 所有关键表都已存在');
          }

          // 显示各表的基本信息
          for (const tableName of tableNames.slice(0, 10)) { // 只显示前10个表以避免日志过长
            try {
              const recordsCount = await sequelize.query(
                `SELECT COUNT(*) as count FROM \`${tableName}\`;`,
                { type: QueryTypes.SELECT }
              );
              console.log(`- 表 ${tableName}: ${recordsCount[0].count} 条记录`);
            } catch (countError) {
              console.log(`- 表 ${tableName}: 无法获取记录数 (${countError.message})`);
            }
          }

          if (missingTables.length > 0) {
            console.log(`\n⚠️  检测到缺失表: ${missingTables.join(', ')}`);
          } else {
            console.log('\n✓ 所有必需的表都存在');
          }
        } catch (structError) {
          console.error('数据库结构检查失败:', structError.message);
        }

        // 仅执行必要的迁移，避免在生产数据库上进行耗时的表结构同步
        console.log('\n执行数据库迁移...');
        await runDatabaseMigrations();
        console.log('Database migrations executed');
      } else {
        console.log('Running database sync...');
        const syncOptions = { alter: true }; // 为测试环境启用自动同步
        await sequelize.sync(syncOptions);
      }

      const server = app.listen(PORT, () => {
        console.log('Server running on port ' + PORT);
        console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
      });

      return server; // 返回服务器实例以便测试使用
    } else {
      // 非测试环境 - 保持原有逻辑
      if (dialect === 'mysql') {
        // MySQL数据库：运行初始化脚本
        console.log('Initializing MySQL database...');
        const initMysqlDb = require('./scripts/init-mysql-db');
        await initMysqlDb();
      } else {
        // SQLite数据库：使用原有逻辑
        const env = process.env.NODE_ENV || 'development';
        const syncOptions = {};
        if (process.env.DB_SYNC_FORCE === 'true') {
          syncOptions.force = true;
          console.warn('[database] Running sync with force=true (data may be dropped)');
        } else if (process.env.DB_SYNC_ALTER === 'true') {
          syncOptions.alter = true;
          console.log('[database] Running sync with alter=true (explicit override)');
        } else if (env !== 'production') {
          syncOptions.alter = true;
          console.log('[database] Running sync with alter=true (non-production default)');
        } else {
          console.log('[database] Running sync without automatic schema alterations (safe production mode)');
        }

        // 在执行 sync({ alter: true }) 之前，清理残留的 SQLite 中间表（例如 product_types_backup）
        // Sequelize 在对 SQLite 执行 alter 时会创建 <table>_backup 临时表并向其中插入数据；
        // 如果项目目录中已存在同名 backup 表（历史残留），会导致 UNIQUE 约束冲突。
        if (dialect === 'sqlite') {
          try {
            console.log('[database] Looking for leftover *_backup tables to avoid ALTER conflicts...');
            const [backupTables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup';");
            if (Array.isArray(backupTables) && backupTables.length > 0) {
              for (const row of backupTables) {
                // row may be { name: 'xxx_backup' }
                const tname = row.name || Object.values(row)[0];
                if (tname) {
                  console.log('[database] Dropping leftover table:', tname);
                  try {
                    await sequelize.query(`DROP TABLE IF EXISTS \`${tname}\`;`);
                  } catch (dropErr) {
                    console.warn('[database] Failed to drop table', tname, dropErr);
                  }
                }
              }
            } else {
              console.log('[database] No leftover _backup tables found.');
            }
          } catch (cleanupErr) {
            console.warn('[database] Error while searching/dropping backup tables:', cleanupErr);
          }
        }

        // 在SQLite上运行自定义迁移以添加新字段（如果需要）
        if (dialect === 'sqlite') {
          try {
            // 检查并添加评分相关字段
            await sequelize.query(`
              ALTER TABLE process_records ADD COLUMN rating INTEGER DEFAULT NULL
            `).catch(() => {}); // 如果字段已存在则忽略错误

            await sequelize.query(`
              ALTER TABLE process_records ADD COLUMN ratingEmployeeId INTEGER DEFAULT NULL
            `).catch(() => {});

            await sequelize.query(`
              ALTER TABLE process_records ADD COLUMN ratingEmployeeName TEXT DEFAULT NULL
            `).catch(() => {});

            await sequelize.query(`
              ALTER TABLE process_records ADD COLUMN ratingTime DATETIME DEFAULT NULL
            `).catch(() => {});

            console.log('[database] Process records 表结构更新检查完成');
          } catch (migrationError) {
            console.log('[database] 表结构更新检查完成（可能字段已存在）');
          }

          if (syncOptions.alter) {
            console.log('[database] SQLite detected - disabling alter sync to avoid DROP/CREATE conflicts');
          }
          syncOptions.alter = false;
          syncOptions.force = false;
        }

        // 使用最小化的 sync（不使用 alter）以避免在 SQLite 上触发复杂的表重建逻辑
        await sequelize.sync(syncOptions);
        console.log('[database] Sequelize sync complete (safe mode for SQLite)');
      }

      await runDatabaseMigrations();
      console.log('Database migrations executed');

      const server = app.listen(PORT, () => {
        console.log('Server running on port ' + PORT);
        console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
      });

      return server;
    }
  } catch (err) {
    console.error('Unable to initialize the database:', err);
    process.exit(1); // 在生产环境中，数据库错误应该导致进程退出
  }
};

const server = startServer();

// 将服务器实例导出，以便测试使用
module.exports = app;
