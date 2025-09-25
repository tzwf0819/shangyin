const express = require('express');
const router = express.Router();
const { adminLogin } = require('../middleware/adminAuth');

// POST /shangyin/admin-auth/login  { username, password }
router.post('/login', adminLogin);

module.exports = router;
