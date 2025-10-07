// 快速测试数据生成脚本 - 直接使用HTTP请求创建数据
const https = require('https');

const BASE_URL = 'https://www.yidasoftware.xyz/shangyin';

// 测试数据
const testData = {
  processes: [
    { name: '设计', code: 'DESIGN', payRate: 50.00, payRateUnit: 'perHour', description: '产品设计阶段' },
    { name: '切割', code: 'CUT', payRate: 30.00, payRateUnit: 'perItem', description: '材料切割工序' },
    { name: '雕刻', code: 'CARVE', payRate: 45.00, payRateUnit: 'perItem', description: '精细雕刻工序' },
    { name: '打磨', code: 'POLISH', payRate: 25.00, payRateUnit: 'perItem', description: '表面打磨处理' },
    { name: '组装', code: 'ASSEMBLE', payRate: 35.00, payRateUnit: 'perItem', description: '产品组装工序' },
    { name: '质检', code: 'QC', payRate: 40.00, payRateUnit: 'perHour', description: '质量检查工序' },
    { name: '包装', code: 'PACK', payRate: 20.00, payRateUnit: 'perItem', description: '产品包装工序' }
  ],
  employees: [
    { name: '张三', code: 'EMP001', phone: '13800138001', status: 'active' },
    { name: '李四', code: 'EMP002', phone: '13800138002', status: 'active' },
    { name: '王五', code: 'EMP003', phone: '13800138003', status: 'active' },
    { name: '赵六', code: 'EMP004', phone: '13800138004', status: 'active' },
    { name: '钱七', code: 'EMP005', phone: '13800138005', status: 'active' }
  ]
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.yidasoftware.xyz',
      port: 443,
      path: `/shangyin${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          resolve({ success: false, message: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function generateTestData() {
  console.log('开始通过API创建测试数据...');
  
  try {
    // 1. 创建工序数据
    console.log('创建工序数据...');
    for (const process of testData.processes) {
      const result = await makeRequest('POST', '/processes', process);
      if (result.success) {
        console.log(`✓ 创建工序: ${process.name}`);
      } else {
        console.log(`✗ 创建工序失败: ${process.name} - ${result.message}`);
      }
    }

    // 2. 创建员工数据
    console.log('创建员工数据...');
    for (const employee of testData.employees) {
      const result = await makeRequest('POST', '/employees', employee);
      if (result.success) {
        console.log(`✓ 创建员工: ${employee.name}`);
      } else {
        console.log(`✗ 创建员工失败: ${employee.name} - ${result.message}`);
      }
    }

    console.log('\n测试数据创建完成！');
    console.log('生成数据统计:');
    console.log(`- 工序: ${testData.processes.length} 个`);
    console.log(`- 员工: ${testData.employees.length} 个`);
    
    console.log('\n测试数据使用说明:');
    console.log('1. 管理后台地址: https://www.yidasoftware.xyz/shangyin/admin');
    console.log('2. 可以使用以下员工进行生产记录录入:');
    testData.employees.forEach(emp => console.log(`   - ${emp.name} (${emp.code})`));
    
  } catch (error) {
    console.error('创建测试数据时出错:', error);
  }
}

// 运行生成函数
generateTestData();