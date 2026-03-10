/**
 * 新功能测试脚本
 * 
 * 测试内容：
 * 1. 权限管理 API
 * 2. 员工管理 API（新字段）
 * 3. 绩效汇总 API
 * 4. 企业微信通知服务
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'test_token'; // 需要替换为实际 token

// 发送 HTTP 请求
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 测试权限管理 API
async function testPermissions() {
  console.log('\n=== 测试权限管理 API ===\n');

  try {
    // 1. 获取权限列表
    console.log('1. 获取权限列表...');
    let res = await request('GET', '/shangyin/permissions');
    console.log('   状态:', res.status);
    console.log('   响应:', JSON.stringify(res.data, null, 2).substring(0, 200));

    // 2. 创建权限
    console.log('\n2. 创建权限...');
    res = await request('POST', '/shangyin/permissions', {
      name: '测试权限',
      code: 'test:permission',
      description: '测试用权限',
      module: 'default'
    });
    console.log('   状态:', res.status);
    console.log('   响应:', JSON.stringify(res.data, null, 2));

    // 3. 更新权限
    if (res.data.success && res.data.data && res.data.data.id) {
      const permissionId = res.data.data.id;
      console.log('\n3. 更新权限...');
      res = await request('PUT', `/shangyin/permissions/${permissionId}`, {
        name: '更新后的测试权限',
        description: '更新后的描述'
      });
      console.log('   状态:', res.status);
      console.log('   响应:', JSON.stringify(res.data, null, 2));

      // 4. 删除权限
      console.log('\n4. 删除权限...');
      res = await request('DELETE', `/shangyin/permissions/${permissionId}`);
      console.log('   状态:', res.status);
      console.log('   响应:', JSON.stringify(res.data, null, 2));
    }

    console.log('\n✅ 权限管理 API 测试完成\n');
  } catch (error) {
    console.error('❌ 权限管理 API 测试失败:', error.message);
  }
}

// 测试员工管理 API
async function testEmployees() {
  console.log('\n=== 测试员工管理 API ===\n');

  try {
    // 1. 获取员工列表
    console.log('1. 获取员工列表...');
    let res = await request('GET', '/shangyin/employees?limit=10');
    console.log('   状态:', res.status);
    if (res.data.success) {
      console.log('   员工数量:', res.data.data?.employees?.length || 0);
      if (res.data.data?.employees?.length > 0) {
        const emp = res.data.data.employees[0];
        console.log('   第一个员工:', {
          id: emp.id,
          name: emp.name,
          employeeType: emp.employeeType,
          workStartTime: emp.workStartTime,
          workEndTime: emp.workEndTime
        });
      }
    }

    // 2. 创建员工（带新字段）
    console.log('\n2. 创建员工（带新字段）...');
    res = await request('POST', '/shangyin/employees', {
      name: '测试员工_' + Date.now(),
      employeeType: 'worker',
      workStartTime: '09:00',
      workEndTime: '18:00',
      canViewAllContracts: false,
      status: 'active'
    });
    console.log('   状态:', res.status);
    console.log('   响应:', JSON.stringify(res.data, null, 2));

    console.log('\n✅ 员工管理 API 测试完成\n');
  } catch (error) {
    console.error('❌ 员工管理 API 测试失败:', error.message);
  }
}

// 测试绩效汇总 API
async function testPerformance() {
  console.log('\n=== 测试绩效汇总 API ===\n');

  try {
    // 1. 获取绩效汇总
    console.log('1. 获取绩效汇总...');
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let res = await request('GET', `/shangyin/performance/summary?startDate=${lastMonth}&endDate=${today}`);
    console.log('   状态:', res.status);
    console.log('   响应:', JSON.stringify(res.data, null, 2).substring(0, 300));

    // 2. 获取工序统计
    console.log('\n2. 获取工序统计...');
    res = await request('GET', `/shangyin/performance/process-stats?startDate=${lastMonth}&endDate=${today}`);
    console.log('   状态:', res.status);
    console.log('   响应:', JSON.stringify(res.data, null, 2).substring(0, 300));

    console.log('\n✅ 绩效汇总 API 测试完成\n');
  } catch (error) {
    console.error('❌ 绩效汇总 API 测试失败:', error.message);
  }
}

// 测试企业微信通知服务
async function testWecomService() {
  console.log('\n=== 测试企业微信通知服务 ===\n');

  try {
    // 检查配置是否存在
    console.log('1. 检查企业微信配置...');
    console.log('   注意：需要先配置 wecom_configs 表才能测试');
    console.log('   配置项：corpId, agentId, secret, enabled');

    console.log('\n✅ 企业微信通知服务测试准备完成\n');
  } catch (error) {
    console.error('❌ 企业微信通知服务测试失败:', error.message);
  }
}

// 主函数
async function runTests() {
  console.log('===========================================');
  console.log('       上茚项目新功能测试脚本');
  console.log('===========================================');
  console.log('基础 URL:', BASE_URL);
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));
  console.log('===========================================\n');

  // 检查服务是否运行
  try {
    const res = await request('GET', '/shangyin/');
    if (res.status !== 200) {
      console.log('⚠️  后端服务未运行或无法访问');
      console.log('   请先启动后端服务：npm start');
      return;
    }
    console.log('✅ 后端服务运行正常');
  } catch (error) {
    console.log('❌ 无法连接到后端服务');
    console.log('   请确保后端服务在运行：npm start');
    return;
  }

  // 执行测试
  await testPermissions();
  await testEmployees();
  await testPerformance();
  await testWecomService();

  console.log('\n===========================================');
  console.log('              测试完成');
  console.log('===========================================\n');
}

// 运行测试
runTests().catch(console.error);
