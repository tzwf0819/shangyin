// 简单单用户管理员登录（内存令牌版）
// 适用场景：只有一个后台用户，需要快速验证 & 免去 JWT 与数据库复杂度。
// 注意：进程重启后已签发 token 失效；若需长期稳定/可追踪，请使用现有 admin-auth (JWT) 方案。

const express = require('express');
const router = express.Router();

// 可通过环境变量覆盖默认账号密码
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 进程内存保存有效 token
const issuedTokens = new Set();

function generateToken(username) {
  const raw = `${username}:${Date.now()}:${Math.random().toString(36).slice(2,10)}`;
  return Buffer.from(raw).toString('base64');
}

// 登录接口：POST /shangyin/admin-login/login  { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success:false, message:'用户名或密码缺失' });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success:false, message:'用户名或密码错误' });
  }
  const token = generateToken(username);
  issuedTokens.add(token);
  return res.json({ success:true, data:{ token, username } });
});

// 简单校验中间件，可用于受保护接口
function simpleAdminAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token && issuedTokens.has(token)) return next();
  return res.status(401).json({ success:false, message:'未认证' });
}

// 健康校验：GET /shangyin/admin-login/ping  (需要 header Authorization: Bearer <token>)
router.get('/ping', simpleAdminAuth, (req, res) => {
  res.json({ success:true, data:{ ok:true, ts: Date.now() } });
});

module.exports = { router, simpleAdminAuth };
