import re

# 读取文件
with open('admin/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 定义新的loadDashboardData方法
new_method = '''                async loadDashboardData() {
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
                },'''

# 使用正则表达式查找并替换整个loadDashboardData方法
pattern = r'(\s+async loadDashboardData\(\) \{[^}]*\}[^}]*\}[^,]*),)'
content = re.sub(pattern, new_method, content, flags=re.DOTALL)

# 如果上面的模式不工作，尝试更简单的模式
if 'employeesRes' not in content:
    pattern2 = r'async loadDashboardData\(\) \{\s*try \{\s*const \[productTypesRes, processesRes\] = await Promise\.all\(\[\s*axios\.get\(this\.apiBaseUrl \+ \'\/product-types\'\),\s*axios\.get\(this\.apiBaseUrl \+ \'\/processes\'\)\s*\]\);\s*this\.dashboardData\.productTypes = productTypesRes\.data\.data\?\.productTypes\?\.length \|\| 0;\s*this\.dashboardData\.processes = processesRes\.data\.data\?\.processes\?\.length \|\| 0;\s*\} catch \(error\) \{\s*console\.error\(\'加载仪表盘数据失败:\', error\);\s*\}\s*\},'
    
    replacement = '''async loadDashboardData() {
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
                },'''
    
    content = re.sub(pattern2, replacement, content, flags=re.DOTALL)

# 写回文件
with open('admin/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("修复完成")
