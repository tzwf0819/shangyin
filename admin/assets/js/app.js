const { createApp } = Vue;

createApp({
  data() {
    return {
      apiBaseUrl: '/shangyin',
      adminApiBaseUrl: '/shangyin/api/admin',
      activeTab: 'dashboard',
      loading: false,
      dashboardData: {
        productTypes: 0,
        processes: 0,
        employees: 0,
        contracts: 0,
        activeEmployees: 0,
        employeesWithWechat: 0,
      },
      productTypes: [],
      processList: [],
      productTypeForm: { id: null, name: '', code: '', status: 'active', processIds: [] },
      showProductTypeModal: false,
      processForm: {
        id: null,
        name: '',
        code: '',
        category: '',
        description: '',
        standardTime: '',
        difficulty: 'medium',
        status: 'active',
      },
      showProcessModal: false,
      employees: [],
      employeePagination: { page: 1, limit: 12, total: 0 },
      employeeFilters: { keyword: '', status: 'all', wechat: 'all' },
      employeeForm: { id: null, name: '', code: '', status: 'active', processIds: [] },
      showEmployeeModal: false,
      selectedEmployeeIds: [],
      contracts: [],
      // 生产进度管理
      productionContracts: [],
      selectedContract: null,
      // 绩效管理
      performanceData: [],
      performanceSummary: { totalEmployees: 0, totalRecords: 0, totalWage: 0 },
      performanceYear: new Date().getFullYear(),
      performanceMonth: new Date().getMonth() + 1,
      availableYears: [2024, 2025, 2026],
      // 工序配置
      processConfigs: [],
      showTimingProcessModal: false,
      timingProcessForm: { name: ', code: ', unitWage: 0 },
      contractPagination: { page: 1, pageSize: 10, total: 0 },
      contractFilters: { keyword: '', status: '', salesId: '' },
      showContractModal: false,
      showContractImportModal: false,
      contractSaveLoading: false,
      contractForm: {
        id: null,
        contractNumber: '',
        partyAName: '',
        partyBName: '',
        signedDate: '',
        signedLocation: '',
        status: '进行中',
        salesId: '',
        deliveryDeadline: '',
        remark: '',
        products: [
          {
                        productName: '',
            productTypeId: '',
            productTypeName: '',
            productCode: '',
            specification: '',
            quantity: '',
            unitPrice: '',
            totalAmount:  ''
          }
        ]
      },
      contractImport: { rawText: '', loading: false, result: null },
      toastList: [],
    };
  },
  computed: {
    currentSectionTitle() {
      const mapping = {
        dashboard: '仪表盘',
        productTypes: '产品类型',
        processes: '工序管理',
        employees: '员工管理',
        contracts: '合同管理',
      };
      return mapping[this.activeTab] || '管理后台';
    },
    currentSectionSubtitle() {
      const mapping = {
        dashboard: '查看整体运行指标',
        productTypes: '维护产品类型与对应工序',
        processes: '维护工序元数据',
        employees: '管理员工及其工序权限',
        contracts: '查询与导入合同数据',
      };
      return mapping[this.activeTab] || '';
    },
    hasEmployeeSelection() {
      return this.selectedEmployeeIds.length > 0;
    },
    contractTotalPages() {
      if (this.contractPagination.pageSize <= 0) return 1;
      return Math.max(1, Math.ceil(this.contractPagination.total / this.contractPagination.pageSize));
    },
    employeeTotalPages() {
      if (this.employeePagination.limit <= 0) return 1;
      return Math.max(1, Math.ceil(this.employeePagination.total / this.employeePagination.limit));
    },
        contractTableRows() {
      if (!this.contracts || !Array.isArray(this.contracts)) {
      if (tab === 'production') {
        this.loadProductionContracts();
      }
      if (tab === 'performance') {
        this.loadPerformanceData();
      }
        return [];
      }
      
      const rows = [];
      this.contracts.forEach(contract => {
        const products = contract.products || [];
        
        if (products.length === 0) {
          // 如果没有产品，创建一个空产品行
          rows.push({
            rowKey: `contract-${contract.id}`,
            contract: contract,
            product: {
              productName: '',
              productTypeId: '',
              productTypeName: '',
              productCode: '',
              specification: '',
              quantity: '',
              unitPrice: '',
              totalAmount: ''
            },
            isFirst: true,
            rowSpan: 1
          });
        } else {
          // 为每个产品创建一行
          products.forEach((product, index) => {
            // 确保product对象有基本的属性
            const safeProduct = Object.assign({
              productName: '',
              productTypeId: '',
              productTypeName: '',
              productCode: '',
              specification: '',
              quantity: '',
              unitPrice: '',
              totalAmount: ''
            }, product || {});
            
            rows.push({
              rowKey: `contract-${contract.id}-product-${(product && product.id) || index}`,
              contract: contract,
              product: safeProduct,
              isFirst: index === 0,
              rowSpan: products.length
            });
          });
        }
      });
      
      return rows;
    },
  },
  watch: {
    'employeeFilters.status'() {
      this.loadEmployees(1);
    },
    'employeeFilters.wechat'() {
      this.loadEmployees(1);
    },
  },
  mounted() {
    this.bootstrap();
  },
  methods: {
    async bootstrap() {
      await Promise.all([
        this.loadDashboard(),
        this.loadProcesses(),
        this.loadProductTypes(),
      ]);
      await Promise.all([
        this.loadEmployees(),
        this.loadContracts(),
      ]);
    },
    setActiveTab(tab) {
      this.activeTab = tab;
      if (tab === 'productTypes' && !this.productTypes.length) {
        this.loadProductTypes();
      }
      if (tab === 'processes' && !this.processList.length) {
        this.loadProcesses();
      }
      if (tab === 'employees') {
        this.loadEmployees();
      }
      if (tab === 'contracts') {
      if (tab === 'production') {
        this.loadProductionContracts();
      }
      if (tab === 'performance') {
        this.loadPerformanceData();
      }
        this.loadContracts();
      }
    },
    async loadDashboard() {
      try {
        const response = await axios.get(`${this.adminApiBaseUrl}/dashboard/stats`);
        if (response.data?.success) {
          this.dashboardData = Object.assign({}, this.dashboardData, response.data.data || {});
        }
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        this.showToast(error.response?.data?.message || '加载仪表盘数据失败', 'danger');
      }
    },
    async loadProductTypes() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/product-types`);
        this.productTypes = response.data?.data?.productTypes || response.data?.data || [];
      } catch (error) {
        console.error('加载产品类型失败:', error);
        this.showToast(error.response?.data?.message || '加载产品类型失败', 'danger');
      }
    },
    async loadProcesses() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/processes`);
        this.processList = response.data?.data?.processes || response.data?.data || [];
      } catch (error) {
        console.error('加载工序失败:', error);
        this.showToast(error.response?.data?.message || '加载工序失败', 'danger');
      }
    },
    openProductTypeModal(item = null) {
      if (item) {
        this.productTypeForm = {
          id: item.id,
          name: item.name || '',
          code: item.code || '',
          status: item.status || 'active',
          processIds: (item.processes || []).map(proc => proc.id),
        };
      } else {
        this.productTypeForm = { id: null, name: '', code: '', status: 'active', processIds: [] };
      }
      this.showProductTypeModal = true;
    },
    closeProductTypeModal() {
      this.showProductTypeModal = false;
    },
    async saveProductType() {
      if (!this.productTypeForm.name.trim()) {
        this.showToast('请输入产品类型名称', 'danger');
        return;
      }
      if (!this.productTypeForm.code.trim()) {
        this.showToast('请输入类型编码', 'danger');
        return;
      }

      const payload = {
        name: this.productTypeForm.name.trim(),
        code: this.productTypeForm.code.trim(),
        status: this.productTypeForm.status,
        processes: this.productTypeForm.processIds,
      };

      try {
        let response;
        if (this.productTypeForm.id) {
          response = await axios.put(`${this.apiBaseUrl}/product-types/${this.productTypeForm.id}`, payload);
        } else {
          response = await axios.post(`${this.apiBaseUrl}/product-types`, payload);
        }

        if (response.data?.success) {
          this.showToast(response.data.message || '保存成功', 'success');
          this.showProductTypeModal = false;
          await Promise.all([this.loadProductTypes(), this.loadDashboard()]);
        } else {
          throw new Error(response.data?.message || '保存失败');
        }
      } catch (error) {
        console.error('保存产品类型失败:', error);
        this.showToast(error.response?.data?.message || error.message || '保存产品类型失败', 'danger');
      }
    },
    async deleteProductType(id) {
      if (!confirm('确定删除该产品类型吗？')) return;
      try {
        const response = await axios.delete(`${this.apiBaseUrl}/product-types/${id}`);
        if (response.data?.success) {
          this.showToast('产品类型已删除', 'success');
          await Promise.all([this.loadProductTypes(), this.loadDashboard()]);
        } else {
          throw new Error(response.data?.message || '删除失败');
        }
      } catch (error) {
        console.error('删除产品类型失败:', error);
        this.showToast(error.response?.data?.message || error.message || '删除产品类型失败', 'danger');
      }
    },
    openProcessModal(item = null) {
      if (item) {
        this.processForm = {
          id: item.id,
          name: item.name || '',
          code: item.code || '',
          category: item.category || '',
          description: item.description || '',
          standardTime: item.standardTime || '',
          difficulty: item.difficulty || 'medium',
          status: item.status || 'active',
        };
      } else {
        this.processForm = {
          id: null,
          name: '',
          code: '',
          category: '',
          description: '',
          standardTime: '',
          difficulty: 'medium',
          status: 'active',
        };
      }
      this.showProcessModal = true;
    },
    closeProcessModal() {
      this.showProcessModal = false;
    },
    async saveProcess() {
      if (!this.processForm.name.trim()) {
        this.showToast('请输入工序名称', 'danger');
        return;
      }
      if (!this.processForm.code.trim()) {
        this.showToast('请输入工序编码', 'danger');
        return;
      }

      const payload = {
        name: this.processForm.name.trim(),
        code: this.processForm.code.trim(),
        category: this.processForm.category || null,
        description: this.processForm.description || null,
        standardTime: this.processForm.standardTime || null,
        difficulty: this.processForm.difficulty,
        status: this.processForm.status,
      };

      try {
        let response;
        if (this.processForm.id) {
          response = await axios.put(`${this.apiBaseUrl}/processes/${this.processForm.id}`, payload);
        } else {
          response = await axios.post(`${this.apiBaseUrl}/processes`, payload);
        }

        if (response.data?.success) {
          this.showToast(response.data.message || '保存成功', 'success');
          this.showProcessModal = false;
          await Promise.all([this.loadProcesses(), this.loadDashboard()]);
        } else {
          throw new Error(response.data?.message || '保存失败');
        }
      } catch (error) {
        console.error('保存工序失败:', error);
        this.showToast(error.response?.data?.message || error.message || '保存工序失败', 'danger');
      }
    },
    async deleteProcess(id) {
      if (!confirm('确定删除该工序吗？')) return;
      try {
        const response = await axios.delete(`${this.apiBaseUrl}/processes/${id}`);
        if (response.data?.success) {
          this.showToast('工序已删除', 'success');
          await Promise.all([this.loadProcesses(), this.loadDashboard()]);
        } else {
          throw new Error(response.data?.message || '删除失败');
        }
      } catch (error) {
        console.error('删除工序失败:', error);
        this.showToast(error.response?.data?.message || error.message || '删除工序失败', 'danger');
      }
    },
    async loadEmployees(page = 1) {
      try {
        const params = {
          page,
          limit: this.employeePagination.limit,
        };
        if (this.employeeFilters.keyword.trim()) {
          params.keyword = this.employeeFilters.keyword.trim();
        }
        if (this.employeeFilters.status !== 'all') {
          params.status = this.employeeFilters.status;
        }
        if (this.employeeFilters.wechat === 'bound') {
          params.hasWechat = true;
        } else if (this.employeeFilters.wechat === 'unbound') {
          params.hasWechat = false;
        }

        const response = await axios.get(`${this.adminApiBaseUrl}/employees`, { params });
        const data = response.data?.data || {};
        this.employees = data.employees || [];
        this.employeePagination = {
          page: data.page || page,
          limit: data.limit || this.employeePagination.limit,
          total: data.total || this.employees.length,
        };
        this.selectedEmployeeIds = [];
      } catch (error) {
        console.error('加载员工失败:', error);
        this.showToast(error.response?.data?.message || '加载员工失败', 'danger');
      }
    },
    employeePageChange(delta) {
      const nextPage = this.employeePagination.page + delta;
      if (nextPage < 1 || nextPage > this.employeeTotalPages) return;
      this.loadEmployees(nextPage);
    },
    resetEmployeeFilters() {
      this.employeeFilters = { keyword: '', status: 'all', wechat: 'all' };
      this.loadEmployees(1);
    },
    openEmployeeModal(employee = null) {
      if (employee) {
        this.employeeForm = {
          id: employee.id,
          name: employee.name || '',
          code: employee.code || '',
          status: employee.status || 'active',
          processIds: (employee.processes || []).map(proc => proc.id),
        };
      } else {
        this.employeeForm = { id: null, name: '', code: '', status: 'active', processIds: [] };
      }
      this.showEmployeeModal = true;
    },
    closeEmployeeModal() {
      this.showEmployeeModal = false;
    },
    toggleEmployeeProcess(processId) {
      const index = this.employeeForm.processIds.indexOf(processId);
      if (index >= 0) {
        this.employeeForm.processIds.splice(index, 1);
      } else {
        this.employeeForm.processIds.push(processId);
      }
    },
    async saveEmployee() {
      if (!this.employeeForm.name.trim()) {
        this.showToast('请输入员工姓名', 'danger');
        return;
      }

      const payload = {
        name: this.employeeForm.name.trim(),
        status: this.employeeForm.status,
      };
      if (this.employeeForm.code?.trim()) {
        payload.code = this.employeeForm.code.trim();
      }

      try {
        if (this.employeeForm.id) {
          payload.processIds = this.employeeForm.processIds;
          const response = await axios.put(`${this.adminApiBaseUrl}/employees/${this.employeeForm.id}`, payload);
          if (!response.data?.success) {
            throw new Error(response.data?.message || '更新失败');
          }
        } else {
          payload.processes = this.employeeForm.processIds;
          const response = await axios.post(`${this.apiBaseUrl}/employees`, payload);
          if (!response.data?.success) {
            throw new Error(response.data?.message || '创建失败');
          }
        }

        this.showToast('员工信息已保存', 'success');
        this.showEmployeeModal = false;
        await Promise.all([this.loadEmployees(this.employeePagination.page), this.loadDashboard()]);
      } catch (error) {
        console.error('保存员工失败:', error);
        this.showToast(error.response?.data?.message || error.message || '保存员工失败', 'danger');
      }
    },
    async deleteEmployee(id) {
      if (!confirm('确定删除该员工吗？')) return;
      try {
        const response = await axios.delete(`${this.adminApiBaseUrl}/employees/${id}`);
        if (!response.data?.success) {
          throw new Error(response.data?.message || '删除失败');
        }
        this.showToast('员工已删除', 'success');
        await Promise.all([this.loadEmployees(this.employeePagination.page), this.loadDashboard()]);
      } catch (error) {
        console.error('删除员工失败:', error);
        this.showToast(error.response?.data?.message || error.message || '删除员工失败', 'danger');
      }
    },
    async clearEmployeeWechat(id) {
      if (!confirm('确定解绑该员工的微信吗？')) return;
      try {
        const response = await axios.delete(`${this.adminApiBaseUrl}/employees/${id}/wechat`);
        if (!response.data?.success) {
          throw new Error(response.data?.message || '解绑失败');
        }
        this.showToast('已解绑微信', 'success');
        await Promise.all([this.loadEmployees(this.employeePagination.page), this.loadDashboard()]);
      } catch (error) {
        console.error('解绑微信失败:', error);
        this.showToast(error.response?.data?.message || error.message || '解绑微信失败', 'danger');
      }
    },
    async batchClearWechat() {
      if (!this.hasEmployeeSelection) return;
      if (!confirm(`确定批量解绑 ${this.selectedEmployeeIds.length} 名员工的微信吗？`)) return;
      try {
        const response = await axios.post(`${this.adminApiBaseUrl}/employees/batch/clear-wechat`, {
          employeeIds: this.selectedEmployeeIds,
        });
        if (!response.data?.success) {
          throw new Error(response.data?.message || '批量解绑失败');
        }
        this.showToast(`已解绑 ${response.data.data?.clearedCount || this.selectedEmployeeIds.length} 名员工`, 'success');
        await Promise.all([this.loadEmployees(this.employeePagination.page), this.loadDashboard()]);
      } catch (error) {
        console.error('批量解绑失败:', error);
        this.showToast(error.response?.data?.message || error.message || '批量解绑失败', 'danger');
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    async batchDeleteEmployees() {
      if (!this.hasEmployeeSelection) return;
      if (!confirm(`确定批量删除 ${this.selectedEmployeeIds.length} 名员工吗？操作不可恢复。`)) return;
      try {
        const response = await axios.post(`${this.adminApiBaseUrl}/employees/batch/delete`, {
          employeeIds: this.selectedEmployeeIds,
        });
        if (!response.data?.success) {
          throw new Error(response.data?.message || '批量删除失败');
        }
        this.showToast(`已删除 ${response.data.data?.deletedCount || this.selectedEmployeeIds.length} 名员工`, 'success');
        await Promise.all([this.loadEmployees(1), this.loadDashboard()]);
      } catch (error) {
        console.error('批量删除失败:', error);
        this.showToast(error.response?.data?.message || error.message || '批量删除失败', 'danger');
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    toggleEmployeeSelection(id) {
      const index = this.selectedEmployeeIds.indexOf(id);
      if (index >= 0) {
        this.selectedEmployeeIds.splice(index, 1);
      } else {
        this.selectedEmployeeIds.push(id);
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    selectAllEmployees() {
      if (this.selectedEmployeeIds.length === this.employees.length) {
        this.selectedEmployeeIds = [];
      } else {
        this.selectedEmployeeIds = this.employees.map(emp => emp.id);
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    async loadContracts(page = 1) {
      try {
        const params = {
          page,
          pageSize: this.contractPagination.pageSize,
        };
        if (this.contractFilters.keyword.trim()) {
          params.keyword = this.contractFilters.keyword.trim();
        }
        if (this.contractFilters.status) {
          params.status = this.contractFilters.status;
        }
        if (this.contractFilters.salesId.trim()) {
          params.salesId = this.contractFilters.salesId.trim();
        }

        const response = await axios.get(`${this.apiBaseUrl}/contracts`, { params });
        const data = response.data?.data || {};
        this.contracts = data.items || [];
        const pagination = data.pagination || {};
        this.contractPagination = {
          page: pagination.page || page,
          pageSize: pagination.pageSize || this.contractPagination.pageSize,
          total: pagination.total || this.contracts.length,
        };
      } catch (error) {
        console.error('加载合同失败:', error);
        this.showToast(error.response?.data?.message || '加载合同失败', 'danger');
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    contractPageChange(delta) {
      const nextPage = this.contractPagination.page + delta;
      if (nextPage < 1 || nextPage > this.contractTotalPages) return;
      this.loadContracts(nextPage);
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    resetContractFilters() {
      this.contractFilters = { keyword: '', status: '', salesId: '' };
      this.loadContracts(1);
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    openContractModal(contract = null) {
      if (contract) {
        // 编辑合同，填充表单
        this.contractForm = JSON.parse(JSON.stringify(contract));
      } else {
        // 新增合同，重置表单
        this.contractForm = {
          id: null,
          contractNumber: '',
          partyAName: '',
          partyBName: '',
          signedDate: '',
          signedLocation: '',
          status: '进行中',
          salesId: '',
          deliveryDeadline: '',
          remark: '',
          products: [
            {
                          productName: '',
            productTypeId: '',
            productTypeName: '',
            productCode: '',
            specification: '',
            quantity: '',
            unitPrice: '',
            totalAmount:  ''
            }
          ]
        };
      }
      this.showContractModal = true;
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    closeContractModal() {
      this.showContractModal = false;
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    addContractProductLine() {
      if (this.contractForm.products.length < 10) {
        this.contractForm.products.push({
                      productName: '',
            productTypeId: '',
            productTypeName: '',
            productCode: '',
            specification: '',
            quantity: '',
            unitPrice: '',
            totalAmount:  ''
        });
      } else {
        this.showToast('每份合同最多只能添加10个产品', 'warning');
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    removeContractProductLine(index) {
      if (this.contractForm.products.length > 1) {
        this.contractForm.products.splice(index, 1);
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    updateProductTypeName(product) {
      const selectedType = this.productTypes.find(type => type.id == product.productTypeId);
      if (selectedType) {
        product.productTypeName = selectedType.name;
      } else {
        product.productTypeName = '';
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    async saveContract() {
      // 表单验证
      if (!this.contractForm.contractNumber.trim()) {
        this.showToast('请输入合同编号', 'danger');
        return;
      }
      if (!this.contractForm.products.some(p => p.productName.trim())) {
        this.showToast('请至少添加一个产品', 'danger');
        return;
      }

      this.contractSaveLoading = true;
      try {
        const url = this.contractForm.id
          ? `${this.apiBaseUrl}/contracts/${this.contractForm.id}`
          : `${this.apiBaseUrl}/contracts`;
        const method = this.contractForm.id ? 'PUT' : 'POST';

        const response = await axios({
          method,
          url,
          data: this.contractForm
        });

        if (response.data.success) {
          this.showToast(
            this.contractForm.id ? '合同更新成功' : '合同创建成功',
            'success'
          );
          this.closeContractModal();
          await Promise.all([this.loadContracts(), this.loadDashboard()]);
        } else {
          this.showToast(response.data.message || '保存失败', 'danger');
        }
      } catch (error) {
        console.error('保存合同失败:', error);
        this.showToast(
          error.response?.data?.message || '保存合同失败',
          'danger'
        );
      } finally {
        this.contractSaveLoading = false;
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    openContractImportModal() {
      this.contractImport = { rawText: '', loading: false, result: null };
      this.showContractImportModal = true;
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    closeContractImportModal() {
      this.showContractImportModal = false;
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    async runContractImport() {
      if (!this.contractImport.rawText.trim()) {
        this.showToast('请输入要导入的合同 JSON 数据', 'danger');
        return;
      }

      let payload;
      try {
        payload = JSON.parse(this.contractImport.rawText);
      } catch (error) {
        this.showToast('JSON 格式不合法，请检查输入', 'danger');
        return;
      }

      if (!Array.isArray(payload)) {
        payload = [payload];
      }

      this.contractImport.loading = true;
      try {
        const response = await axios.post(`${this.apiBaseUrl}/contracts/import`, { contracts: payload });
        this.contractImport.result = response.data?.data || null;
        if (response.data?.success) {
          this.showToast(`导入成功 ${this.contractImport.result?.successCount || 0} 条合同`, 'success');
        } else {
          this.showToast(response.data?.message || '部分合同导入失败', 'danger');
        }
        await Promise.all([this.loadContracts(), this.loadDashboard()]);
      } catch (error) {
        console.error('批量导入合同失败:', error);
        this.showToast(error.response?.data?.message || '批量导入合同失败', 'danger');
      } finally {
        this.contractImport.loading = false;
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    async deleteContract(id) {
      if (!confirm('确定删除该合同吗？')) return;
      try {
        const response = await axios.delete(`${this.apiBaseUrl}/contracts/${id}`);
        if (!response.data?.success) {
          throw new Error(response.data?.message || '删除失败');
        }
        this.showToast('合同已删除', 'success');
        await Promise.all([this.loadContracts(this.contractPagination.page), this.loadDashboard()]);
      } catch (error) {
        console.error('删除合同失败:', error);
        this.showToast(error.response?.data?.message || error.message || '删除合同失败', 'danger');
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    refreshActiveTab() {
      switch (this.activeTab) {
        case 'dashboard':
          this.loadDashboard();
          break;
        case 'productTypes':
          this.loadProductTypes();
          break;
        case 'processes':
          this.loadProcesses();
          break;
        case 'employees':
          this.loadEmployees(this.employeePagination.page);
          break;
        case 'contracts':
          this.loadContracts(this.contractPagination.page);
          break;
        default:
          break;
      }
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
    showToast(message, type = 'info') {
      const toast = { id: Date.now(), message, type };
      this.toastList.push(toast);
      setTimeout(() => {
        this.toastList = this.toastList.filter(item => item.id !== toast.id);
      }, 3200);
    },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
  },
    // 生产进度管理方法
    async loadProductionContracts() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract-list`);
        this.productionContracts = response.data?.data || [];
      } catch (error) {
        console.error("加载生产进度失败:", error);
        this.showToast("加载生产进度失败", "danger");
      }
    },
    async viewContractProgress(contractId) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/production/contract/${contractId}/progress`);
        this.selectedContract = response.data?.data;
        this.showContractProgressModal = true;
      } catch (error) {
        console.error("获取合同进度失败:", error);
        this.showToast("获取合同进度失败", "danger");
      }
    },
    // 绩效管理方法
    async loadPerformanceData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth }
        });
        const data = response.data?.data;
        this.performanceData = data?.monthlyReport || [];
        this.performanceSummary = data?.totalSummary || { totalEmployees: 0, totalRecords: 0, totalWage: 0 };
      } catch (error) {
        console.error("加载绩效数据失败:", error);
        this.showToast("加载绩效数据失败", "danger");
      }
    },
    async generateMonthlyReport() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/performance/monthly-report`, {
          params: { year: this.performanceYear, month: this.performanceMonth },
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `绩效报表_${this.performanceYear}_${this.performanceMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast("报表生成成功", "success");
      } catch (error) {
        console.error("生成报表失败:", error);
        this.showToast("生成报表失败", "danger");
      }
    },
    // 工序配置方法
    openTimingProcessModal() {
      this.timingProcessForm = { name: "", code: "", unitWage: 0 };
      this.showTimingProcessModal = true;
    },
    async saveTimingProcess() {
      try {
        const response = await axios.post(`${this.apiBaseUrl}/performance/timing-process`, this.timingProcessForm);
        this.showToast("计时工序创建成功", "success");
        this.showTimingProcessModal = false;
        this.loadProcesses();
      } catch (error) {
        console.error("创建计时工序失败:", error);
        this.showToast(error.response?.data?.message || "创建计时工序失败", "danger");
      }
    },
}).mount('#app');