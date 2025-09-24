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
      processes: [],
      employees: [],
      contracts: [],
      productionList: [],
      performanceStats: {},
      employeePerformance: null,
      selectedEmployeeId: '',
      
      // 模态框状态
      showCreateProductTypeModal: false,
      showCreateProcessModal: false,
      showCreateEmployeeModal: false,
      showCreateContractModal: false,
      
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
    
    // 编辑产品类型
    editProductType(productType) {
      this.showToast('编辑功能开发中', 'error');
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
      this.showToast('编辑功能开发中', 'error');
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
    }
  }
}).mount('#app');

