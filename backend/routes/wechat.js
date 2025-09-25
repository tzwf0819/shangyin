// routes/wechat.js
const express = require('express');
const router = express.Router();
const {
  wechatLogin,
  registerEmployee,
  getEmployeeProcesses,
  getEmployeeInfo,
  listWechatEmployees
} = require('../controllers/wechatController');

// 微信小程序登录
router.post('/login', wechatLogin);

// 新用户注册员工信息
router.post('/register', registerEmployee);

// 获取员工的工序列表
router.get('/employee/:openId/processes', getEmployeeProcesses);

// 获取员工基本信息
router.get('/employee/:openId', getEmployeeInfo);

// 管理端：获取绑定微信员工列表
router.get('/employees', listWechatEmployees);

module.exports = router;
