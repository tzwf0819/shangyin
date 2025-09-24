// 前端合同创建测试脚本
// 在浏览器控制台中运行此代码来测试合同创建功能

console.log('开始测试前端合同创建功能...');

// 模拟填写表单数据
const testContractData = {
    contractNumber: 'FRONT001',
    partyAName: '前端测试甲方',
    partyBName: '前端测试乙方', 
    signedDate: '2025-09-24',
    signedLocation: '上海',
    status: '测试中',
    products: [{
        productCode: 'FP001',
        productName: '前端测试产品',
        productTypeId: 1,
        quantity: 5,
        unitPrice: 200.5,
        specification: '前端测试规格'
    }]
};

// 测试API请求方法
async function testCreateContract() {
    try {
        console.log('发送创建合同请求:', testContractData);
        
        const response = await fetch('http://localhost:3000/shangyin/contracts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testContractData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ 前端合同创建成功:', result);
        } else {
            console.error('❌ 前端合同创建失败:', result);
        }
        
    } catch (error) {
        console.error('❌ 前端API请求失败:', error);
    }
}

// 运行测试
testCreateContract();