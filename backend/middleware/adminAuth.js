const jwt = require('jsonwebtoken');

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
// 生产环境请使用强随机密码并放入环境变量
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (process.env.JWT_SECRET || 'default_secret_key_for_development');

exports.adminLogin = (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名或密码缺失' });
  }
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  const token = jwt.sign({ admin: true, username }, ADMIN_JWT_SECRET, { expiresIn: '2d' });
  res.json({ success: true, data: { token, username, expiresIn: 172800 } });
};

exports.verifyAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: '未认证' });
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!decoded.admin) return res.status(401).json({ success: false, message: '无效令牌' });
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: '认证失败' });
  }
};
