const axios = require('axios');
const crypto = require('crypto');

const DEFAULT_TIMEOUT = 5000;

function isMockMode() {
  const appId = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appId || !secret) {
    return true;
  }
  const placeholders = new Set([
    'your_wechat_appid',
    'your_wechat_app_secret'
  ]);
  return placeholders.has(appId) || placeholders.has(secret);
}

async function exchangeCodeForSession(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Missing js_code when requesting WeChat session');
  }

  const appId = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;

  if (isMockMode()) {
    const hash = crypto.createHash('md5').update(code).digest('hex');
    return {
      openid: `mock_openid_${hash}`,
      unionid: `mock_union_${hash}`,
      session_key: `mock_session_${hash.slice(0, 24)}`,
      isMock: true,
    };
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;

  try {
    const { data } = await axios.get(url, { timeout: DEFAULT_TIMEOUT });

    if (!data) {
      throw new Error('Empty response from WeChat');
    }

    if (data.errcode) {
      const error = new Error(data.errmsg || 'WeChat code2session failed');
      error.code = data.errcode;
      throw error;
    }

    return {
      openid: data.openid,
      unionid: data.unionid || null,
      session_key: data.session_key,
      isMock: false,
    };
  } catch (error) {
    const message = error.response?.data?.errmsg || error.message || 'WeChat authentication failed';
    const err = new Error(`Failed to exchange js_code: ${message}`);
    err.code = error.response?.data?.errcode || 'WECHAT_CODE2SESSION_FAIL';
    throw err;
  }
}

module.exports = {
  exchangeCodeForSession,
  isMockMode,
};
