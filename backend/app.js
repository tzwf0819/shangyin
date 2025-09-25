require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 管理后台静态页面 (优先使用构建产物 dist)
let adminStaticPath = path.join(__dirname, '../admin/dist');
if (!fs.existsSync(path.join(adminStaticPath, 'index.html'))) {
  // 回退到源码根目录 (开发模式: 通过 Vite dev server 访问, 这里仅作为占位)
  adminStaticPath = path.join(__dirname, '../admin');
  console.log('[admin] dist 未找到, 使用源码目录提供静态文件:', adminStaticPath);
} else {
  console.log('[admin] 使用构建后的 dist 目录提供静态文件:', adminStaticPath);
}
// 静态资源托管：优先精确匹配实际文件
app.use('/shangyin/admin', express.static(adminStaticPath, { index: 'index.html', maxAge: '1h' }));
// SPA Fallback：仅当请求不包含点号(认为不是具体文件)时返回 index.html
app.get('/shangyin/admin*', (req, res, next) => {
  const requestPath = req.path;
  if (/\.[a-zA-Z0-9]+$/.test(requestPath)) {
    // 例如 /shangyin/admin/assets/vue.global.js (旧路径) 不应回退为 index，交给后续 404 处理
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
app.get('/shangyin', (req, res) => res.redirect('/shangyin/'));
app.get('/shangyin/', (req, res) => {
  res.json({
    success: true,
    message: '上茚工厂管理系统 API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

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
app.use('/shangyin/performance', require('./routes/performance'));

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 处理 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

const PORT = process.env.PORT || 3000;

// 数据库连接和服务器启动
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected successfully');
    // 使用更安全的同步选项，避免alter时的约束冲突
    return sequelize.sync({ force: false });
  })
  .then(() => {
    console.log('Database tables synchronized');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = app;
