const axios = require('axios');

class BackendTestSuite {
    constructor(baseURL = 'http://localhost:3000/shangyin') {
        this.baseURL = baseURL;
        this.axios = axios.create({
            baseURL,
            timeout: 15000
        });
        this.testData = {
            employeeId: null,
            processIds: [],
            productTypeId: null,
            contractId: null,
            contractProductId: null
        };
    }

    async runAllTests() {
        console.log('=== 商印后端完整测试套件 ===\n');
        
        try {
            await this.testHealthCheck();
            await this.testProcessAPI();
            await this.testProductTypeAPI();
            await this.testEmployeeAPI();
            await this.testContractAPI();
            await this.testProductionRecordAPI();
            await this.testQRCodeAPI();
            await this.testProductTypeProcessAPI();
            
            console.log('\n✅ 所有测试通过！');
            return true;
        } catch (error) {
            console.error('\n❌ 测试失败:', error.message);
            if (error.response) {
                console.error('响应数据:', error.response.data);
                console.error('状态码:', error.response.status);
            }
            return false;
        }
    }

    async testHealthCheck() {
        console.log('1. 健康检查...');
        const response = await this.axios.get('/');
        if (!response.data.success) {
            throw new Error('健康检查失败');
        }
        console.log('✅ 服务正常运行');
    }

    async testProcessAPI() {
        console.log('\n2. 测试工序API...');
        
        // 获取工序列表
        const listResponse = await this.axios.get('/processes');
        const processes = listResponse.data.data.processes || [];
        console.log(`现有工序数量: ${processes.length}`);
        
        // 创建测试工序
        const timestamp = Date.now();
        const createResponse = await this.axios.post('/processes', {
            name: '测试工序-' + timestamp,
            description: '自动化测试创建的工序',
            payRate: 5.5,
            payRateUnit: 'perItem'
        });
        
        if (!createResponse.data.success) {
            throw new Error('创建工序失败');
        }
        
        const newProcess = createResponse.data.data.process;
        this.testData.processIds.push(newProcess.id);
        console.log(`✅ 工序创建成功，ID: ${newProcess.id}`);
        
        // 测试更新工序
        const updateResponse = await this.axios.put(`/processes/${newProcess.id}`, {
            name: '更新后的工序-' + Date.now(),
            description: '已更新的工序描述',
            payRate: 6.0,
            payRateUnit: 'perItem'
        });
        
        if (!updateResponse.data.success) {
            throw new Error('更新工序失败');
        }
        console.log('✅ 工序更新成功');
    }

    async testProductTypeAPI() {
        console.log('\n3. 测试产品类型API...');
        
        // 获取产品类型列表
        const listResponse = await this.axios.get('/product-types');
        const productTypes = listResponse.data.data.productTypes || [];
        console.log(`现有产品类型数量: ${productTypes.length}`);
        
        // 创建测试产品类型
        const createResponse = await this.axios.post('/product-types', {
            name: '测试产品类型-' + Date.now()
        });
        
        if (!createResponse.data.success) {
            throw new Error('创建产品类型失败');
        }
        
        this.testData.productTypeId = createResponse.data.data.productType.id;
        console.log(`✅ 产品类型创建成功，ID: ${this.testData.productTypeId}`);
    }

    async testEmployeeAPI() {
        console.log('\n4. 测试员工API...');
        
        // 获取员工列表
        const listResponse = await this.axios.get('/employees');
        const employees = listResponse.data.data.employees || [];
        console.log(`现有员工数量: ${employees.length}`);
        
        const timestamp = Date.now();
        // 创建测试员工
        const createResponse = await this.axios.post('/employees', {
            name: '测试员工-' + timestamp,
            code: 'EMP-' + timestamp
        });
        
        if (!createResponse.data.success) {
            throw new Error('创建员工失败');
        }
        
        this.testData.employeeId = createResponse.data.data.employee.id;
        console.log(`✅ 员工创建成功，ID: ${this.testData.employeeId}`);
    }

    async testContractAPI() {
        console.log('\n5. 测试合同API...');
        
        // 获取合同列表
        const listResponse = await this.axios.get('/contracts');
        const contracts = listResponse.data.data.contracts || [];
        console.log(`现有合同数量: ${contracts.length}`);
        
        const timestamp = Date.now();
        // 创建测试合同
        const createResponse = await this.axios.post('/contracts', {
            contractNumber: 'TEST-' + timestamp,
            partyAName: '测试甲方',
            partyBName: '测试乙方',
            products: [{
                productName: '测试产品',
                productCode: 'PROD-' + timestamp,
                quantity: 100
            }]
        });
        
        if (!createResponse.data.success) {
            throw new Error('创建合同失败');
        }
        
        const newContract = createResponse.data.data.contract;
        this.testData.contractId = newContract.id;
        this.testData.contractProductId = newContract.products[0].id;
        console.log(`✅ 合同创建成功，ID: ${this.testData.contractId}`);
        console.log(`✅ 合同产品创建成功，ID: ${this.testData.contractProductId}`);
    }

    async testProductionRecordAPI() {
        console.log('\n6. 测试生产记录API...');
        
        if (!this.testData.employeeId || !this.testData.contractId || !this.testData.contractProductId) {
            throw new Error('缺少必要的测试数据');
        }
        
        // 获取一个工序
        const processesResponse = await this.axios.get('/processes');
        const process = processesResponse.data.data.processes[0];
        if (!process) {
            throw new Error('没有可用的工序');
        }
        
        // 创建生产记录（计件）
        const createResponse = await this.axios.post('/production/record', {
            employeeId: this.testData.employeeId,
            contractId: this.testData.contractId,
            contractProductId: this.testData.contractProductId,
            processId: process.id,
            quantity: 10,
            actualTimeMinutes: 0,
            notes: '自动化测试记录'
        });
        
        if (!createResponse.data.success) {
            throw new Error('创建生产记录失败');
        }
        
        const record = createResponse.data.data.record;
        console.log(`✅ 生产记录创建成功，ID: ${record.id}`);
        console.log(`   计件金额: ${record.payAmount}`);
        
        // 查询生产记录
        const listResponse = await this.axios.get('/production/record', {
            params: { contractId: this.testData.contractId }
        });
        
        console.log(`✅ 生产记录查询成功，数量: ${listResponse.data.data.records.length}`);
    }

    async testQRCodeAPI() {
        console.log('\n7. 测试二维码API...');
        
        if (!this.testData.processIds.length) {
            throw new Error('没有可用的工序用于二维码测试');
        }
        
        // 测试工序二维码
        const processQRResponse = await this.axios.get(`/qrcodes/process/${this.testData.processIds[0]}`);
        if (!processQRResponse.data.success) {
            throw new Error('工序二维码生成失败');
        }
        console.log('✅ 工序二维码生成成功');
        
        // 测试合同二维码（如果有合同）
        if (this.testData.contractId) {
            const contractQRResponse = await this.axios.get(`/qrcodes/contract/${this.testData.contractId}`);
            if (!contractQRResponse.data.success) {
                throw new Error('合同二维码生成失败');
            }
            console.log('✅ 合同二维码生成成功');
        }
    }

    async testProductTypeProcessAPI() {
        console.log('\n8. 测试产品类型工序管理API...');
        
        if (!this.testData.productTypeId || !this.testData.processIds.length) {
            throw new Error('缺少产品类型或工序数据');
        }
        
        // 获取产品类型的工序列表
        const listResponse = await this.axios.get(`/product-types/${this.testData.productTypeId}/processes`);
        console.log(`产品类型现有工序数量: ${listResponse.data.data.processes.length}`);
        
        // 添加工序到产品类型
        const addResponse = await this.axios.post(`/product-types/${this.testData.productTypeId}/processes`, {
            processId: this.testData.processIds[0],
            sequenceOrder: 1
        });
        
        if (!addResponse.data.success) {
            throw new Error('添加产品类型工序失败');
        }
        console.log('✅ 产品类型工序添加成功');
        
        // 验证工序已添加
        const updatedListResponse = await this.axios.get(`/product-types/${this.testData.productTypeId}/processes`);
        console.log(`添加后工序数量: ${updatedListResponse.data.data.processes.length}`);
    }
}

// 运行测试
(async () => {
    const testSuite = new BackendTestSuite();
    const success = await testSuite.runAllTests();
    process.exit(success ? 0 : 1);
})();