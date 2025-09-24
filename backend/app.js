require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 管理后台静态页面
const adminStaticPath = path.join(__dirname, '../admin');
app.use('/shangyin/admin', express.static(adminStaticPath));
app.get('/shangyin/admin*', (req, res) => {
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
