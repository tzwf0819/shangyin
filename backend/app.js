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
    if (sequelize.getDialect && sequelize.getDialect() === 'sqlite') {
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

    // 如果使用 SQLite，避免使用 alter=true 自动同步，因为 Sequelize 在 SQLite 上
    // 通过创建 <table>_backup 临时表并写入数据来实现 alter，这会与残留表或外键约束冲突。
    if (sequelize.getDialect && sequelize.getDialect() === 'sqlite') {
      if (syncOptions.alter) {
        console.log('[database] SQLite detected - disabling alter sync to avoid DROP/CREATE conflicts');
      }
      syncOptions.alter = false;
      syncOptions.force = false;
    }

    // 使用最小化的 sync（不使用 alter）以避免在 SQLite 上触发复杂的表重建逻辑
    await sequelize.sync(syncOptions);
    console.log('[database] Sequelize sync complete (safe mode for SQLite)');

    await runDatabaseMigrations();
    console.log('Database migrations executed');

    app.listen(PORT, () => {
      console.log('Server running on port ' + PORT);
      console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
    });
  } catch (err) {
    console.error('Unable to initialize the database:', err);
  }
};

startServer();

module.exports = app;
