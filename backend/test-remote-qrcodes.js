const axios = require('axios');

const BASE = process.env.REMOTE_BASE || 'https://www.yidasoftware.xyz/shangyin';
axios.defaults.baseURL = BASE;
axios.defaults.timeout = 15000;

async function pickProcessId() {
  const resp = await axios.get('/processes');
  if (!resp.data?.success) {
    throw new Error(`获取工序列表失败: ${resp.data?.message || 'unknown error'}`);
  }
  const processes = resp.data.data?.processes || resp.data.data || [];
  if (!Array.isArray(processes) || processes.length === 0) {
    throw new Error('远程环境没有可用工序，无法继续二维码测试');
  }
  return processes[0].id;
}

async function assertProcessQRCode(id) {
  const resp = await axios.get(`/qrcodes/process/${id}`);
  if (!resp.data?.success) {
    throw new Error(`工序二维码接口失败: ${resp.data?.message || 'unknown error'}`);
  }
  const data = resp.data.data || {};
  if (!data.payload || !data.dataUrl) {
    throw new Error('二维码响应缺少 payload 或 dataUrl');
  }
  if (!String(data.dataUrl).startsWith('data:image/png;base64,')) {
    throw new Error('二维码 dataUrl 非 PNG base64');
  }
  return data;
}

(async () => {
  try {
    console.log('== 远程二维码冒烟测试 ==');
    console.log('Base =', BASE);
    const pid = await pickProcessId();
    console.log('选择工序 id =', pid);
    const data = await assertProcessQRCode(pid);
    console.log('工序二维码接口 OK，payload =', data.payload);
    console.log('== 远程二维码冒烟测试通过 ==');
    process.exit(0);
  } catch (err) {
    console.error('远程二维码测试失败:', err?.message || err);
    if (err?.response?.data) {
      console.error('API response:', JSON.stringify(err.response.data));
    }
    process.exit(1);
  }
})();
