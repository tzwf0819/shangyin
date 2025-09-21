require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 引入路由
const authRoutes = require('./routes/auth');
const productTypeRoutes = require("./routes/productType");
const processRoutes = require('./routes/process');
const taskRoutes = require('./routes/task');
const employeeRoutes = require('./routes/employee');
const wechatRoutes = require('./routes/wechat');
const adminRoutes = require('./routes/admin');

// 根路径处理
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: '版辊加工工厂管理系统API',
    version: '1.0.0',
    endpoints: [
      '/shangyin/auth', 
      '/shangyin/product-types', 
      '/shangyin/processes', 
      '/shangyin/employees',
      '/shangyin/wechat',
      '/shangyin/task'
    ],
    timestamp: new Date().toISOString()
  });
});

// 配置路由 - 添加 /shangyin 前缀
app.use('/shangyin/auth', authRoutes);
app.use('/shangyin/product-types', productTypeRoutes);
app.use('/shangyin/processes', processRoutes);
app.use('/shangyin/employees', employeeRoutes);
app.use('/shangyin/wechat', wechatRoutes);
app.use('/shangyin/admin', adminRoutes);
app.use('/shangyin/task', taskRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

const PORT = process.env.PORT || 3000;

// 数据库连接和服务器启动
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return sequelize.sync({ force: false });  // 改为false，避免每次重建表
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
