const axios = require('axios');

async function testProductTypeProcessAPIs() {
    const baseURL = 'http://localhost:3000/shangyin';
    
    console.log('测试产品类型工序管理API...\n');
    
    try {
        // 1. 先创建一个产品类型用于测试
        console.log('1. 创建测试产品类型...');
        const createProductTypeResponse = await axios.post(`${baseURL}/product-types`, {
            name: '测试工序管理产品类型'
        });
        const productTypeId = createProductTypeResponse.data.data.productType.id;
        console.log('产品类型创建成功，ID:', productTypeId);
        
        // 2. 获取所有工序
        console.log('\n2. 获取所有工序...');
        const processesResponse = await axios.get(`${baseURL}/processes`);
        const processes = processesResponse.data.data.processes;
        console.log('工序数量:', processes.length);
        
        if (processes.length === 0) {
            console.log('没有工序，创建一个测试工序...');
            await axios.post(`${baseURL}/processes`, {
                name: '测试工序用于关联',
                description: '测试工序',
                payRate: 5.0,
                payRateUnit: 'perItem'
            });
            const newProcessesResponse = await axios.get(`${baseURL}/processes`);
            const newProcesses = newProcessesResponse.data.data.processes;
            console.log('新工序数量:', newProcesses.length);
        }
        
        // 3. 测试获取产品类型的工序列表（应该为空）
        console.log('\n3. 测试获取产品类型工序列表...');
        const getProcessesResponse = await axios.get(`${baseURL}/product-types/${productTypeId}/processes`);
        console.log('产品类型工序数量:', getProcessesResponse.data.data.processes.length);
        
        // 4. 添加工序到产品类型
        console.log('\n4. 测试添加工序到产品类型...');
        const firstProcess = processes[0] || (await axios.get(`${baseURL}/processes`)).data.data.processes[0];
        const addProcessResponse = await axios.post(`${baseURL}/product-types/${productTypeId}/processes`, {
            processId: firstProcess.id,
            sequenceOrder: 1
        });
        console.log('添加工序结果:', addProcessResponse.data.message);
        
        // 5. 再次获取产品类型的工序列表
        console.log('\n5. 再次获取产品类型工序列表...');
        const getProcessesResponse2 = await axios.get(`${baseURL}/product-types/${productTypeId}/processes`);
        console.log('产品类型工序数量:', getProcessesResponse2.data.data.processes.length);
        console.log('工序详情:', getProcessesResponse2.data.data.processes[0]);
        
        console.log('\n✅ 所有产品类型工序管理API测试通过！');
        
    } catch (error) {
        console.error('❌ API测试失败:', error.response?.data || error.message);
    }
}

testProductTypeProcessAPIs();