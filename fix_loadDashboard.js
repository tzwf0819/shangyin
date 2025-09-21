// 手动修复的loadDashboardData方法
async loadDashboardData() {
    try {
        const [productTypesRes, processesRes, employeesRes] = await Promise.all([
            axios.get(this.apiBaseUrl + '/product-types'),
            axios.get(this.apiBaseUrl + '/processes'),
            axios.get(this.apiBaseUrl + '/admin/employees')
        ]);
        
        this.dashboardData.productTypes = productTypesRes.data.data?.productTypes?.length || 0;
        this.dashboardData.processes = processesRes.data.data?.processes?.length || 0;
        this.dashboardData.employees = employeesRes.data.data?.employees?.length || 0;
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
    }
}
