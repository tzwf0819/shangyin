// Sony Admin Vue.js Application
const { createApp } = Vue;

// API 基础配置
const API_BASE = 'http://localhost:3000/shangyin';

// 创建 Vue 应用
createApp({
  data() {
    return {
      // 系统状态
      loading: false,
      isConnected: true,
      lastUpdated: new Date().toLocaleString(),
      
      // 当前激活的标签页
      activeTab: 'dashboard',
      
      // 标签页配置
      tabs: [
        { id: 'dashboard', name: '仪表盘', icon: 'fas fa-chart-pie' },
        { id: 'productTypes', name: '产品类型', icon: 'fas fa-cubes' },
        { id: 'processes', name: '工序管理', icon: 'fas fa-cogs' },
        { id: 'employees', name: '员工管理', icon: 'fas fa-users' },
        { id: 'contracts', name: '合同管理', icon: 'fas fa-file-contract' },
        { id: 'production', name: '生产进度', icon: 'fas fa-tasks' },
        { id: 'performance', name: '绩效管理', icon: 'fas fa-chart-line' }
      ],
      
      // 数据状态
      dashboardStats: {},
      productTypes: [],
      // 全部工序列表
      allProcesses: [],
      processes: [],
      // 选中待添加的工序ID
      selectedProcessToAdd: null,
      selectedProcessToEdit: null,
      // 拖拽排序索引
      draggingProcessIndexNew: null,
      draggingProcessIndexEdit: null,
      employees: [],
      contracts: [],
      productionList: [],
      performanceStats: {},
      employeePerformance: null,
      selectedEmployeeId: '',
      
      // 模态框状态
      showCreateProductTypeModal: false,
      showEditProductTypeModal: false,
      showCreateProcessModal: false,
      showEditProcessModal: false,
      showCreateEmployeeModal: false,
      showCreateContractModal: false,
      
      // 新增表单数据
      newProductType: { name: '', description: '', unit: '', processesSelected: [] },
      editProductTypeData: { id: null, name: '', description: '', unit: '', processesSelected: [] },
      newProcess: { name: '', description: '', payRate: 0, payRateUnit: 'perItem' },
      newEmployee: { name: '', department: '', position: '', phone: '' },
      newContract: { contractNumber: '', partyAName: '', signDate: '', totalAmount: null },
      // 编辑工序数据
      editProcessData: { id: null, name: '', description: '', payRate: 0, payRateUnit: 'perItem' },
      
      // Toast 通知
      toast: {
        show: false,
        type: 'success',
        message: ''
      }
    };
  },
  
  mounted() {
    this.init();
  },
  
  methods: {
    // 初始化应用
    async init() {
      await this.checkConnection();
      await this.loadDashboardData();
      
      // 设置定时更新
      setInterval(() => {
        this.lastUpdated = new Date().toLocaleString();
      }, 60000); // 每分钟更新一次时间
    },
    
    // 检查连接状态
    async checkConnection() {
      try {
        const response = await axios.get(`${API_BASE}/employees`);
        this.isConnected = response.data.success;
      } catch (error) {
        this.isConnected = false;
        console.error('连接检查失败:', error);
      }
    },
    
    // 设置活动标签页
    async setActiveTab(tabId) {
      this.activeTab = tabId;
      
      // 根据标签页加载相应数据
      switch (tabId) {
        case 'dashboard':
          await this.loadDashboardData();
          break;
        case 'productTypes':
          await this.loadProductTypes();
          // 同时加载工序列表以供关联选择
          await this.loadProcesses();
          break;
        case 'processes':
          await this.loadProcesses();
          break;
        case 'employees':
          await this.loadEmployees();
          break;
        case 'contracts':
          await this.loadContracts();
          break;
        case 'production':
          await this.loadProductionList();
          break;
        case 'performance':
          await this.loadPerformanceData();
          break;
      }
    },
    
    // 新增按钮触发：打开对应创建模态框
    testCreateProductType() {
      this.newProductType = { name: '', description: '', unit: '', processesSelected: [] };
      this.showCreateProductTypeModal = true;
    },
    testCreateProcess() {
      // 新增普通工序，绩效单位为元/件
      this.newProcess = { name: '', description: '', payRate: 0, payRateUnit: 'perItem' };
      this.showCreateProcessModal = true;
    },
    testCreateTimedProcess() {
      // 新增计时工序，绩效单位为元/小时
      this.newProcess = { name: '', description: '', payRate: 0, payRateUnit: 'perHour' };
      this.showCreateProcessModal = true;
    },
    testCreateEmployee() {
      this.newEmployee = { name: '', department: '', position: '', phone: '' };
      this.showCreateEmployeeModal = true;
    },
    testCreateContract() {
      this.newContract = { contractNumber: '', partyAName: '', signDate: '', totalAmount: null };
      this.showCreateContractModal = true;
    },
    // 创建产品类型
    async createProductType() {
      this.loading = true;
      try {
        // 提交时映射工序ID和顺序
        const payload = {
          ...this.newProductType,
          processes: this.newProductType.processesSelected.map((p, i) => ({ id: p.id }))
        };
        const response = await axios.post(`${API_BASE}/product-types`, payload);
        if (response.data.success) {
          this.showToast('创建产品类型成功', 'success');
          this.showCreateProductTypeModal = false;
          await this.loadProductTypes();
        } else {
          this.showToast(response.data.message || '创建失败', 'error');
        }
      } catch (error) {
        console.error('创建产品类型失败:', error);
        this.showToast('创建失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    // 创建工序
    async createProcess() {
      this.loading = true;
      try {
        const response = await axios.post(`${API_BASE}/processes`, this.newProcess);
        if (response.data.success) {
          this.showToast('创建工序成功', 'success');
          this.showCreateProcessModal = false;
          await this.loadProcesses();
        } else {
          this.showToast(response.data.message || '创建失败', 'error');
        }
      } catch (error) {
        console.error('创建工序失败:', error);
        this.showToast('创建失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    // 创建员工
    async createEmployee() {
      this.loading = true;
      try {
        const response = await axios.post(`${API_BASE}/employees`, this.newEmployee);
        if (response.data.success) {
          this.showToast('创建员工成功', 'success');
          this.showCreateEmployeeModal = false;
          await this.loadEmployees();
        } else {
          this.showToast(response.data.message || '创建失败', 'error');
        }
      } catch (error) {
        console.error('创建员工失败:', error);
        this.showToast('创建失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    // 创建合同
    async createContract() {
      this.loading = true;
      try {
        const response = await axios.post(`${API_BASE}/contracts`, this.newContract);
        if (response.data.success) {
          this.showToast('创建合同成功', 'success');
          this.showCreateContractModal = false;
          await this.loadContracts();
        } else {
          this.showToast(response.data.message || '创建失败', 'error');
        }
      } catch (error) {
        console.error('创建合同失败:', error);
        this.showToast('创建失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    // 加载仪表盘数据
    async loadDashboardData() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/api/admin/dashboard/stats`);
        if (response.data.success) {
          this.dashboardStats = response.data.data;
        }
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        this.showToast('加载仪表盘数据失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载产品类型
    async loadProductTypes() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/product-types`);
        if (response.data.success) {
          this.productTypes = response.data.data.productTypes || [];
        }
      } catch (error) {
        console.error('加载产品类型失败:', error);
        this.showToast('加载产品类型失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载工序
    async loadProcesses() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/processes`);
        if (response.data.success) {
          this.processes = response.data.data.processes || [];
        }
      } catch (error) {
        console.error('加载工序失败:', error);
        this.showToast('加载工序失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载员工
    async loadEmployees() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/employees`);
        if (response.data.success) {
          this.employees = response.data.data.employees || [];
        }
      } catch (error) {
        console.error('加载员工失败:', error);
        this.showToast('加载员工失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载合同
    async loadContracts() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/contracts`);
        if (response.data.success) {
          this.contracts = response.data.data.items || [];
        }
      } catch (error) {
        console.error('加载合同失败:', error);
        this.showToast('加载合同失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载生产进度列表
    async loadProductionList() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/production/contract-list`);
        if (response.data.success) {
          this.productionList = response.data.data || [];
        }
      } catch (error) {
        console.error('加载生产进度失败:', error);
        this.showToast('加载生产进度失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载绩效数据
    async loadPerformanceData() {
      this.loading = true;
      try {
        // 加载员工列表（如果还没有加载）
        if (this.employees.length === 0) {
          await this.loadEmployees();
        }
        
        // 加载绩效统计
        this.performanceStats = {
          monthlyRecords: 0,
          monthlyWage: 0
        };
      } catch (error) {
        console.error('加载绩效数据失败:', error);
        this.showToast('加载绩效数据失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载员工绩效
    async loadEmployeePerformance() {
      if (!this.selectedEmployeeId) {
        this.employeePerformance = null;
        return;
      }
      
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/performance/employee/${this.selectedEmployeeId}/overview`);
        if (response.data.success) {
          this.employeePerformance = response.data.data;
        }
      } catch (error) {
        console.error('加载员工绩效失败:', error);
        this.showToast('加载员工绩效失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 编辑产品类型：打开编辑模态框
    editProductType(productType) {
      this.editProductTypeData = {
        id: productType.id,
        name: productType.name,
        description: productType.description || '',
        unit: productType.unit || '',
        processesSelected: productType.processes ? productType.processes.map(p => ({ id: p.id, name: p.name })) : []
      };
      this.showEditProductTypeModal = true;
    },
    // 确认编辑产品类型
    async confirmEditProductType() {
      this.loading = true;
      try {
        const payload = {
          name: this.editProductTypeData.name,
          description: this.editProductTypeData.description,
          unit: this.editProductTypeData.unit,
          processes: this.editProductTypeData.processesSelected.map((p, i) => ({ id: p.id }))
        };
        const response = await axios.put(
          `${API_BASE}/product-types/${this.editProductTypeData.id}`,
          payload
        );
        if (response.data.success) {
          this.showToast('更新产品类型成功', 'success');
          this.showEditProductTypeModal = false;
          await this.loadProductTypes();
        } else {
          this.showToast(response.data.message || '更新失败', 'error');
        }
      } catch (error) {
        console.error('更新产品类型失败:', error);
        this.showToast('更新失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 删除产品类型
    async deleteProductType(id) {
      if (!confirm('确定要删除这个产品类型吗？')) {
        return;
      }
      
      this.loading = true;
      try {
        const response = await axios.delete(`${API_BASE}/product-types/${id}`);
        if (response.data.success) {
          this.showToast('删除成功', 'success');
          await this.loadProductTypes();
        } else {
          this.showToast('删除失败', 'error');
        }
      } catch (error) {
        console.error('删除产品类型失败:', error);
        this.showToast('删除失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 编辑工序
    editProcess(process) {
      // 填充编辑数据并打开模态框
      this.editProcessData = {
        id: process.id,
        name: process.name,
        description: process.description || '',
        payRate: process.payRate || 0,
        payRateUnit: process.payRateUnit || 'perItem'
      };
      this.showEditProcessModal = true;
    },
    // 确认编辑工序
    async confirmEditProcess() {
      this.loading = true;
      try {
        const { id, name, description, payRate, payRateUnit } = this.editProcessData;
        const response = await axios.put(
          `${API_BASE}/processes/${id}`,
          { name, description, payRate, payRateUnit }
        );
        if (response.data.success) {
          this.showToast('编辑工序成功', 'success');
          this.showEditProcessModal = false;
          await this.loadProcesses();
        } else {
          this.showToast(response.data.message || '编辑失败', 'error');
        }
      } catch (error) {
        console.error('编辑工序失败:', error);
        this.showToast('编辑失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 删除工序
    async deleteProcess(id) {
      if (!confirm('确定要删除这个工序吗？')) {
        return;
      }
      
      this.loading = true;
      try {
        const response = await axios.delete(`${API_BASE}/processes/${id}`);
        if (response.data.success) {
          this.showToast('删除成功', 'success');
          await this.loadProcesses();
        } else {
          this.showToast('删除失败', 'error');
        }
      } catch (error) {
        console.error('删除工序失败:', error);
        this.showToast('删除失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 编辑员工
    editEmployee(employee) {
      this.showToast('编辑功能开发中', 'error');
    },
    
    // 删除员工
    async deleteEmployee(id) {
      if (!confirm('确定要删除这个员工吗？')) {
        return;
      }
      
      this.loading = true;
      try {
        const response = await axios.delete(`${API_BASE}/employees/${id}`);
        if (response.data.success) {
          this.showToast('删除成功', 'success');
          await this.loadEmployees();
        } else {
          this.showToast('删除失败', 'error');
        }
      } catch (error) {
        console.error('删除员工失败:', error);
        this.showToast('删除失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 查看合同
    viewContract(id) {
      this.showToast('查看功能开发中', 'error');
    },
    
    // 编辑合同
    editContract(contract) {
      this.showToast('编辑功能开发中', 'error');
    },
    
    // 删除合同
    async deleteContract(id) {
      if (!confirm('确定要删除这个合同吗？')) {
        return;
      }
      
      this.loading = true;
      try {
        const response = await axios.delete(`${API_BASE}/contracts/${id}`);
        if (response.data.success) {
          this.showToast('删除成功', 'success');
          await this.loadContracts();
        } else {
          this.showToast('删除失败', 'error');
        }
      } catch (error) {
        console.error('删除合同失败:', error);
        this.showToast('删除失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // 查看生产详情
    viewProductionDetail(contractId) {
      this.showToast('生产详情功能开发中', 'error');
    },
    
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      return new Date(dateTime).toLocaleString('zh-CN');
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('zh-CN');
    },
    
    // 格式化货币
    formatCurrency(amount) {
      if (!amount && amount !== 0) return '0.00';
      return parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    
    // 显示 Toast 通知
    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message,
        type
      };
      
      // 3秒后自动隐藏
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },

    // 新增产品类型中添加工序
    addProcessToNew() {
      const pid = this.selectedProcessToAdd;
      const proc = this.processes.find(p => p.id === pid);
      if (proc && !this.newProductType.processesSelected.some(p => p.id === pid)) {
        this.newProductType.processesSelected.push(proc);
      }
      this.selectedProcessToAdd = null;
    },
    // 新增产品类型中移除工序
    removeProcessFromNew(index) {
      this.newProductType.processesSelected.splice(index, 1);
    },
    // 新增产品类型中移动工序
    moveProcessInNew(index, direction) {
      const arr = this.newProductType.processesSelected;
      const item = arr.splice(index, 1)[0];
      arr.splice(index + direction, 0, item);
    },
    // 编辑产品类型中添加工序
    addProcessToEdit() {
      const pid = this.selectedProcessToEdit;
      const proc = this.processes.find(p => p.id === pid);
      if (proc && !this.editProductTypeData.processesSelected.some(p => p.id === pid)) {
        this.editProductTypeData.processesSelected.push(proc);
      }
      this.selectedProcessToEdit = null;
    },
    // 编辑产品类型中移除工序
    removeProcessFromEdit(index) {
      this.editProductTypeData.processesSelected.splice(index, 1);
    },
    // 编辑产品类型中移动工序
    moveProcessInEdit(index, direction) {
      const arr = this.editProductTypeData.processesSelected;
      const item = arr.splice(index, 1)[0];
      arr.splice(index + direction, 0, item);
    },
    // 拖拽开始（新增）
    onDragStartNew(event, index) {
      this.draggingProcessIndexNew = index;
    },
    // 拖拽放下（新增）
    onDropNew(event, index) {
      const arr = this.newProductType.processesSelected;
      const item = arr.splice(this.draggingProcessIndexNew, 1)[0];
      arr.splice(index, 0, item);
      this.draggingProcessIndexNew = null;
    },
    // 拖拽开始（编辑）
    onDragStartEdit(event, index) {
      this.draggingProcessIndexEdit = index;
    },
    // 拖拽放下（编辑）
    onDropEdit(event, index) {
      const arr = this.editProductTypeData.processesSelected;
      const item = arr.splice(this.draggingProcessIndexEdit, 1)[0];
      arr.splice(index, 0, item);
      this.draggingProcessIndexEdit = null;
    },
  }
}).mount('#app');

