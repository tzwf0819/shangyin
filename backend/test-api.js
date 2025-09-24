const axios = require('axios');

async function testAPI() {
    const baseURL = 'http://localhost:3000/shangyin';
    
    console.log('测试上茚工厂管理系统 API...\n');
    
    try {
        // 测试工序API
        console.log('1. 测试工序API...');
        const processesResponse = await axios.get(`${baseURL}/processes`);
        console.log('工序数量:', processesResponse.data.data?.processes?.length || 0);
        
        // 测试产品类型API
        console.log('2. 测试产品类型API...');
        const productTypesResponse = await axios.get(`${baseURL}/product-types`);
        console.log('产品类型数量:', productTypesResponse.data.data?.productTypes?.length || 0);
        
        // 测试合同API
        console.log('3. 测试合同API...');
        const contractsResponse = await axios.get(`${baseURL}/contracts`);
        console.log('合同数量:', contractsResponse.data.data?.contracts?.length || 0);
        
        console.log('\n✅ 所有API测试通过！');
        
        // 测试创建工序
        console.log('\n4. 测试创建工序...');
        const newProcess = {
            name: 'API测试工序',
            description: '这是一个通过API创建的测试工序',
            payRate: 5.50,
            payRateUnit: 'perItem'
        };
        
        const createProcessResponse = await axios.post(`${baseURL}/processes`, newProcess);
        console.log('创建工序成功:', createProcessResponse.data);
        
        // 测试创建产品类型
        console.log('\n5. 测试创建产品类型...');
        const newProductType = {
            name: 'API测试产品类型'
        };
        
        const createProductTypeResponse = await axios.post(`${baseURL}/product-types`, newProductType);
        console.log('创建产品类型成功:', createProductTypeResponse.data);
        
    } catch (error) {
        console.error('API测试失败:', error.response?.data || error.message);
    }
}

testAPI();