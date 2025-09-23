const { createApp } = Vue;
const Sortable = window.Sortable;

createApp({
    data() {
        return {
            navItems: [
                { id: 'dashboard', label: '数据概览', icon: 'fas fa-gauge-high' },
                { id: 'employees', label: '员工管理', icon: 'fas fa-users' },
                { id: 'productTypes', label: '产品类型', icon: 'fas fa-layer-group' },
                { id: 'processes', label: '工序管理', icon: 'fas fa-diagram-project' }
            ],
            activeSection: 'dashboard',
            showModal: null,
            isEditing: false,
            apiBaseUrl: '/shangyin',
            adminApiBaseUrl: '/shangyin/api/admin',
            dashboardData: {
                employees: 0,
                processes: 0,
                productTypes: 0,
                contracts: 0,
                activeEmployees: 0,
                employeesWithWechat: 0
            },
            employees: [],
            employeeFilters: {
                keyword: '',
                status: 'all',
                wechat: 'all'
            },
            selectedEmployeeIds: [],
            employeeDrawerVisible: false,
            employeeDrawerTitle: '',
            employeeForm: {
                id: null,
                name: '',
                code: '',
                status: 'active',
                processIds: []
            },
            productTypes: [],
            productSheetVisible: false,
            productSheetTitle: '',
            productForm: {
                id: null,
                name: '',
                status: 'active',
                processIds: []
            },
            processes: [],
            processSheetVisible: false,
            processSheetTitle: '',
            processForm: {
                id: null,
                name: '',
                status: 'active',
                description: ''
            },
            employeeProcessSortable: null,
            productProcessSortable: null,
            alerts: [],
            loading: false
        };
    },
    computed: {
        dashboardMetrics() {
            return [
                { id: 'employees', label: '员工总数', value: this.dashboardData.employees, hint: '含所有状态的员工', icon: 'fas fa-users' },
                { id: 'activeEmployees', label: '在职员工', value: this.dashboardData.activeEmployees, hint: '当前可用账号', icon: 'fas fa-user-check' },
                { id: 'processes', label: '工序模板', value: this.dashboardData.processes, hint: '正在启用的工序', icon: 'fas fa-diagram-project' },
                { id: 'productTypes', label: '产品类型', value: this.dashboardData.productTypes, hint: '已配置流程的类别', icon: 'fas fa-layer-group' }
            ];
        },
        currentSectionTitle() {
            const current = this.navItems.find(item => item.id === this.activeSection);
            return current ? current.label : '';
        },
        currentSectionSubtitle() {
            switch (this.activeSection) {
                case 'dashboard':
                    return '实时掌握业务运行状态';
                case 'employees':
                    return '支持员工资料维护、工序分配与微信绑定管理';
                case 'productTypes':
                    return '为不同产品配置标准工序组合';
                case 'processes':
                    return '定义并维护生产流程的基础节点';
                default:
                    return '';
            }
        },
        employeeSelectedProcesses() {
            return this.employeeForm.processIds
                .map(id => this.processes.find(proc => Number(proc.id) === Number(id)))
                .filter(Boolean);
        },
        productSelectedProcesses() {
            return this.productForm.processIds
                .map(id => this.processes.find(proc => Number(proc.id) === Number(id)))
                .filter(Boolean);
        },
        filteredEmployees() {
            const keyword = this.employeeFilters.keyword.trim().toLowerCase();
            return this.employees.filter(emp => {
                const matchKeyword = !keyword || (emp.name && emp.name.toLowerCase().includes(keyword)) || (emp.code && emp.code.toLowerCase().includes(keyword));
                const matchStatus = this.employeeFilters.status === 'all' || emp.status === this.employeeFilters.status;
                const matchWechat = this.employeeFilters.wechat === 'all'
                    || (this.employeeFilters.wechat === 'bound' && !!emp.wxOpenId)
                    || (this.employeeFilters.wechat === 'unbound' && !emp.wxOpenId);
                return matchKeyword && matchStatus && matchWechat;
            });
        }
    },
    watch: {
        employeeDrawerVisible(value) {
            if (value) {
                this.$nextTick(() => this.initEmployeeSortable());
            } else {
                this.destroyEmployeeSortable();
                this.employeeDrawerTitle = '';
                this.resetEmployeeForm();
            }
        },
        productSheetVisible(value) {
            if (value) {
                this.$nextTick(() => this.initProductProcessSortable());
            } else {
                this.destroyProductProcessSortable();
            }
        },
        "employeeForm.processIds": {
            handler() {
                if (this.employeeDrawerVisible) {
                    this.$nextTick(() => this.initEmployeeSortable());
                }
            },
            deep: true
        },
        "productForm.processIds": {
            handler() {
                if (this.productSheetVisible) {
                    this.$nextTick(() => this.initProductProcessSortable());
                }
            },
            deep: true
        }
    },
    mounted() {
        this.refreshAll();
    },
    methods: {
        async refreshAll() {
            await Promise.all([
                this.loadDashboardData(),
                this.loadEmployees(),
                this.loadProcesses(),
                this.loadProductTypes()
            ]);
        },
        refreshCurrentSection() {
            switch (this.activeSection) {
                case 'dashboard':
                    this.loadDashboardData();
                    break;
                case 'employees':
                    this.loadEmployees();
                    break;
                case 'productTypes':
                    this.loadProductTypes();
                    break;
                case 'processes':
                    this.loadProcesses();
                    break;
                default:
                    break;
            }
        },
        setActiveSection(section) {
            this.activeSection = section;
            if (section === 'dashboard') {
                this.loadDashboardData();
            }
            if (section === 'employees' && this.employees.length === 0) {
                this.loadEmployees();
            }
            if (section === 'productTypes' && this.productTypes.length === 0) {
                this.loadProductTypes();
            }
            if (section === 'processes' && this.processes.length === 0) {
                this.loadProcesses();
            }
        },
        async loadDashboardData() {
            try {
                const response = await axios.get(`${this.adminApiBaseUrl}/dashboard/stats`);
                if (response.data.success) {
                    this.dashboardData = Object.assign({}, this.dashboardData, response.data.data || {});
                }
            } catch (error) {
                console.error('加载仪表盘数据失败', error);
                this.showToast('仪表盘数据加载失败', 'danger');
            }
        },
        async loadEmployees() {
            try {
                const response = await axios.get(`${this.adminApiBaseUrl}/employees`);
                if (response.data.success) {
                    this.employees = response.data.data.employees || [];
                    this.dashboardData.employees = response.data.data.total ?? this.employees.length;
                }
            } catch (error) {
                console.error('获取员工列表失败', error);
                this.showToast('获取员工列表失败', 'danger');
            }
        },
        async loadProductTypes() {
            try {
                const response = await axios.get(`${this.apiBaseUrl}/product-types`);
                if (response.data.success) {
                    this.productTypes = response.data.data?.productTypes || [];
                }
            } catch (error) {
                console.error('获取产品类型失败', error);
                this.showToast('加载产品类型失败', 'danger');
            }
        },
        async loadProcesses() {
            try {
                const response = await axios.get(`${this.apiBaseUrl}/processes`);
                if (response.data.success) {
                    this.processes = response.data.data?.processes || [];
                    this.dashboardData.processes = response.data.data?.total ?? this.processes.length;
                }
            } catch (error) {
                console.error('获取工序失败', error);
                this.showToast('加载工序失败', 'danger');
            }
        },
        orderedProcesses(processes = []) {
            return [...processes].sort((a, b) => {
                const orderA = a.ProductTypeProcess?.sequenceOrder || 0;
                const orderB = b.ProductTypeProcess?.sequenceOrder || 0;
                return orderA - orderB;
            });
        },
        openEmployeeEditor(employee = null) {
            const title = employee ? `编辑 ${employee.name || ''}`.trim() : '添加员工';
            this.employeeDrawerTitle = title === '编辑' ? '编辑员工' : title;
            this.employeeForm = {
                id: employee?.id ?? null,
                name: employee?.name || '',
                code: employee?.code || '',
                status: employee?.status || 'active',
                processIds: employee?.processes ? employee.processes.map(proc => Number(proc.id)).filter(id => !Number.isNaN(id)) : []
            };
            this.employeeDrawerVisible = true;
        },
        closeEmployeeDrawer() {
            this.employeeDrawerVisible = false;
        },
        resetEmployeeForm() {
            this.employeeForm = {
                id: null,
                name: '',
                code: '',
                status: 'active',
                processIds: []
            };
            this.loading = false;
        },
        async saveEmployee() {
            if (!this.employeeForm.name.trim()) {
                this.showToast('员工姓名不能为空', 'danger');
                return;
            }
            this.loading = true;
            try {
                const normalized = Array.from(new Set(this.employeeForm.processIds.map(id => Number(id)).filter(id => !Number.isNaN(id))));
                if (this.employeeForm.id) {
                    const payload = {
                        name: this.employeeForm.name.trim(),
                        status: this.employeeForm.status,
                        processIds: normalized
                    };
                    if (this.employeeForm.code && this.employeeForm.code.trim()) {
                        payload.code = this.employeeForm.code.trim();
                    }
                    const response = await axios.put(`${this.adminApiBaseUrl}/employees/${this.employeeForm.id}`, payload);
                    if (response.data.success) {
                        this.showToast(response.data.message || '员工信息已更新', 'success');
                        this.closeEmployeeDrawer();
                        this.loadEmployees();
                        this.loadDashboardData();
                    }
                } else {
                    const payload = {
                        name: this.employeeForm.name.trim(),
                        status: this.employeeForm.status,
                        processes: normalized
                    };
                    if (this.employeeForm.code && this.employeeForm.code.trim()) {
                        payload.code = this.employeeForm.code.trim();
                    }
                    const response = await axios.post(`${this.apiBaseUrl}/employees`, payload);
                    if (response.data.success) {
                        this.showToast(response.data.message || '员工创建成功', 'success');
                        this.closeEmployeeDrawer();
                        this.loadEmployees();
                        this.loadDashboardData();
                    }
                }
            } catch (error) {
                console.error('保存员工失败', error);
                this.showToast(error.response?.data?.message || '保存员工失败', 'danger');
            } finally {
                this.loading = false;
            }
        },
        async deleteEmployee(id) {
            if (!confirm('确定要删除这个员工吗？删除后该员工的微信关联也将被清除。')) return;
            try {
                const response = await axios.delete(`${this.adminApiBaseUrl}/employees/${id}`);
                if (response.data.success) {
                    this.showToast(response.data.message || '员工删除成功', 'success');
                    this.selectedEmployeeIds = this.selectedEmployeeIds.filter(eid => eid !== id);
                    this.loadEmployees();
                    this.loadDashboardData();
                }
            } catch (error) {
                console.error('删除员工失败', error);
                this.showToast(error.response?.data?.message || '删除失败', 'danger');
            }
        },
        async clearEmployeeWechat(id) {
            if (!confirm('确定要清除该员工的微信关联吗？清除后该微信下次登录将被视为新用户。')) return;
            try {
                const response = await axios.delete(`${this.adminApiBaseUrl}/employees/${id}/wechat`);
                if (response.data.success) {
                    this.showToast(response.data.message || '微信关联已清除', 'success');
                    this.loadEmployees();
                }
            } catch (error) {
                console.error('清除微信关联失败', error);
                this.showToast(error.response?.data?.message || '操作失败', 'danger');
            }
        },
        async batchClearWechat() {
            if (!this.selectedEmployeeIds.length) return;
            if (!confirm(`确定要清除${this.selectedEmployeeIds.length}个员工的微信关联吗？`)) return;
            try {
                const response = await axios.post(`${this.adminApiBaseUrl}/employees/batch/clear-wechat`, {
                    employeeIds: this.selectedEmployeeIds
                });
                if (response.data.success) {
                    this.showToast(response.data.message || '批量清除成功', 'success');
                    this.selectedEmployeeIds = [];
                    this.loadEmployees();
                }
            } catch (error) {
                console.error('批量清除微信关联失败', error);
                this.showToast(error.response?.data?.message || '操作失败', 'danger');
            }
        },
        async batchDeleteEmployees() {
            if (!this.selectedEmployeeIds.length) return;
            if (!confirm(`确定要删除${this.selectedEmployeeIds.length}个员工吗？删除后相关的微信关联也将被清除。`)) return;
            try {
                const response = await axios.post(`${this.adminApiBaseUrl}/employees/batch/delete`, {
                    employeeIds: this.selectedEmployeeIds
                });
                if (response.data.success) {
                    this.showToast(response.data.message || '批量删除成功', 'success');
                    this.selectedEmployeeIds = [];
                    this.loadEmployees();
                    this.loadDashboardData();
                }
            } catch (error) {
                console.error('批量删除失败', error);
                this.showToast(error.response?.data?.message || '操作失败', 'danger');
            }
        },
        openProductTypeSheet(type = null) {
            this.productSheetTitle = type ? `编辑 ${type.name}` : '新增产品类型';
            this.productForm = {
                id: type?.id ?? null,
                name: type?.name || '',
                status: type?.status || 'active',
                processIds: type?.processes ? this.orderedProcesses(type.processes).map(proc => Number(proc.id)) : []
            };
            this.productSheetVisible = true;
            this.$nextTick(() => this.initProductProcessSortable());
        },
        closeProductTypeSheet() {
            this.productSheetVisible = false;
            this.productSheetTitle = '';
            this.destroyProductProcessSortable();
            this.productForm = {
                id: null,
                name: '',
                status: 'active',
                processIds: []
            };
        },
        async saveProductType() {
            if (!this.productForm.name.trim()) {
                this.showToast('产品类型名称不能为空', 'danger');
                return;
            }
            const processesPayload = this.productForm.processIds.map((id, idx) => ({ id, sequenceOrder: idx + 1 }));
            const payload = {
                name: this.productForm.name.trim(),
                status: this.productForm.status,
                processes: processesPayload
            };
            try {
                if (this.productForm.id) {
                    const response = await axios.put(`${this.apiBaseUrl}/product-types/${this.productForm.id}`, payload);
                    if (response.data.success) {
                        this.showToast(response.data.message || '产品类型已更新', 'success');
                        this.closeProductTypeSheet();
                        this.loadProductTypes();
                        this.loadDashboardData();
                    }
                } else {
                    const response = await axios.post(`${this.apiBaseUrl}/product-types`, payload);
                    if (response.data.success) {
                        this.showToast(response.data.message || '产品类型已创建', 'success');
                        this.closeProductTypeSheet();
                        this.loadProductTypes();
                        this.loadDashboardData();
                    }
                }
            } catch (error) {
                console.error('保存产品类型失败', error);
                this.showToast(error.response?.data?.message || '保存失败', 'danger');
            }
        },
        async deleteProductType(id) {
            if (!confirm('确定要删除该产品类型吗？如果有工序关联将一并移除。')) return;
            try {
                const response = await axios.delete(`${this.apiBaseUrl}/product-types/${id}`);
                if (response.data.success) {
                    this.showToast(response.data.message || '产品类型已删除', 'success');
                    this.loadProductTypes();
                    this.loadDashboardData();
                }
            } catch (error) {
                console.error('删除产品类型失败', error);
                this.showToast(error.response?.data?.message || '删除失败', 'danger');
            }
        },
        openProcessSheet(process = null) {
            this.processSheetTitle = process ? `编辑 ${process.name}` : '新增工序';
            this.processForm = {
                id: process?.id ?? null,
                name: process?.name || '',
                status: process?.status || 'active',
                description: process?.description || ''
            };
            this.processSheetVisible = true;
        },
        closeProcessSheet() {
            this.processSheetVisible = false;
            this.processSheetTitle = '';
            this.processForm = {
                id: null,
                name: '',
                status: 'active',
                description: ''
            };
        },
        async saveProcess() {
            if (!this.processForm.name.trim()) {
                this.showToast('工序名称不能为空', 'danger');
                return;
            }
            const payload = {
                name: this.processForm.name.trim(),
                status: this.processForm.status
            };
            try {
                if (this.processForm.id) {
                    const response = await axios.put(`${this.apiBaseUrl}/processes/${this.processForm.id}`, payload);
                    if (response.data.success) {
                        this.showToast(response.data.message || '工序已更新', 'success');
                        this.closeProcessSheet();
                        this.loadProcesses();
                        this.loadDashboardData();
                    }
                } else {
                    const response = await axios.post(`${this.apiBaseUrl}/processes`, payload);
                    if (response.data.success) {
                        this.showToast(response.data.message || '工序已创建', 'success');
                        this.closeProcessSheet();
                        this.loadProcesses();
                        this.loadDashboardData();
                    }
                }
            } catch (error) {
                console.error('保存工序失败', error);
                this.showToast(error.response?.data?.message || '保存失败', 'danger');
            }
        },
        async deleteProcess(id) {
            if (!confirm('确定要删除该工序吗？删除后将从所有产品类型中移除。')) return;
            try {
                const response = await axios.delete(`${this.apiBaseUrl}/processes/${id}`);
                if (response.data.success) {
                    this.showToast(response.data.message || '工序已删除', 'success');
                    this.loadProcesses();
                    this.loadProductTypes();
                    this.loadDashboardData();
                }
            } catch (error) {
                console.error('删除工序失败', error);
                this.showToast(error.response?.data?.message || '删除失败', 'danger');
            }
        },
        initEmployeeSortable() {
            if (!Sortable || !this.$refs.employeeProcessList) {
                return;
            }
            if (this.employeeProcessSortable) {
                this.employeeProcessSortable.destroy();
                this.employeeProcessSortable = null;
            }
            const el = this.$refs.employeeProcessList;
            const items = el ? el.querySelectorAll('.selected-process-item') : [];
            if (!el || !items.length) {
                return;
            }
            this.employeeProcessSortable = Sortable.create(el, {
                animation: 150,
                handle: '.drag-handle',
                draggable: '.selected-process-item',
                onEnd: () => {
                    const orderedIds = Array.from(el.querySelectorAll('.selected-process-item'))
                        .map(item => Number(item.dataset.id))
                        .filter(id => !Number.isNaN(id));
                    this.employeeForm.processIds = orderedIds;
                }
            });
        },
        destroyEmployeeSortable() {
            if (this.employeeProcessSortable) {
                this.employeeProcessSortable.destroy();
                this.employeeProcessSortable = null;
            }
        },
        removeEmployeeProcess(id) {
            this.employeeForm.processIds = this.employeeForm.processIds.filter(pid => Number(pid) !== Number(id));
            this.$nextTick(() => this.initEmployeeSortable());
        },
        initProductProcessSortable() {
            if (!Sortable || !this.$refs.productProcessList) {
                return;
            }
            if (this.productProcessSortable) {
                this.productProcessSortable.destroy();
                this.productProcessSortable = null;
            }
            const el = this.$refs.productProcessList;
            const items = el ? el.querySelectorAll('.selected-process-item') : [];
            if (!el || !items.length) {
                return;
            }
            this.productProcessSortable = Sortable.create(el, {
                animation: 150,
                handle: '.drag-handle',
                draggable: '.selected-process-item',
                onEnd: () => {
                    const orderedIds = Array.from(el.querySelectorAll('.selected-process-item'))
                        .map(item => Number(item.dataset.id))
                        .filter(id => !Number.isNaN(id));
                    this.productForm.processIds = orderedIds;
                }
            });
        },
        destroyProductProcessSortable() {
            if (this.productProcessSortable) {
                this.productProcessSortable.destroy();
                this.productProcessSortable = null;
            }
        },
        removeProductProcess(id) {
            this.productForm.processIds = this.productForm.processIds.filter(pid => Number(pid) !== Number(id));
            this.$nextTick(() => this.initProductProcessSortable());
        },
        formatDate(value) {
            if (!value) return '-';
            const date = new Date(value);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        },
        showToast(message, type = 'info') {
            const icons = {
                success: 'fas fa-check-circle',
                danger: 'fas fa-circle-exclamation',
                info: 'fas fa-circle-info'
            };
            const id = Date.now() + Math.random();
            this.alerts.push({ id, message, type, icon: icons[type] || icons.info });
            setTimeout(() => {
                this.alerts = this.alerts.filter(alert => alert.id !== id);
            }, 3200);
        }
    }
}).mount('#app');

















