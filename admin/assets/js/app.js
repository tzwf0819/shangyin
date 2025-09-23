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
      contractPagination: { page: 1, pageSize: 10, total: 0 },
      contractFilters: { keyword: '', status: '', salesId: '' },
      showContractImportModal: false,
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
    toggleEmployeeSelection(id) {
      const index = this.selectedEmployeeIds.indexOf(id);
      if (index >= 0) {
        this.selectedEmployeeIds.splice(index, 1);
      } else {
        this.selectedEmployeeIds.push(id);
      }
    },
    selectAllEmployees() {
      if (this.selectedEmployeeIds.length === this.employees.length) {
        this.selectedEmployeeIds = [];
      } else {
        this.selectedEmployeeIds = this.employees.map(emp => emp.id);
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
    contractPageChange(delta) {
      const nextPage = this.contractPagination.page + delta;
      if (nextPage < 1 || nextPage > this.contractTotalPages) return;
      this.loadContracts(nextPage);
    },
    resetContractFilters() {
      this.contractFilters = { keyword: '', status: '', salesId: '' };
      this.loadContracts(1);
    },
    openContractImportModal() {
      this.contractImport = { rawText: '', loading: false, result: null };
      this.showContractImportModal = true;
    },
    closeContractImportModal() {
      this.showContractImportModal = false;
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
    showToast(message, type = 'info') {
      const toast = { id: Date.now(), message, type };
      this.toastList.push(toast);
      setTimeout(() => {
        this.toastList = this.toastList.filter(item => item.id !== toast.id);
      }, 3200);
    },
  },
}).mount('#app');