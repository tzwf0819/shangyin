import re

# 读取文件
with open('admin/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换loadDashboardData方法
old_pattern = r'async loadDashboardData\(\) \{\s+try \{\s+const \[productTypesRes, processesRes\] = await Promise\.all\(\[\s+axios\.get\(this\.apiBaseUrl \+ \'/product-types\'\),\s+axios\.get\(this\.apiBaseUrl \+ \'/processes\'\)\s+\]\);\s+this\.dashboardData\.productTypes = productTypesRes\.data\.data\?\.productTypes\?\.length \|\| 0;\s+this\.dashboardData\.processes = processesRes\.data\.data\?\.processes\?\.length \|\| 0;'

new_code = '''async loadDashboardData() {
                    try {
                        const [productTypesRes, processesRes, employeesRes] = await Promise.all([
                            axios.get(this.apiBaseUrl + '/product-types'),
                            axios.get(this.apiBaseUrl + '/processes'),
                            axios.get(this.apiBaseUrl + '/admin/employees')
                        ]);
                        
                        this.dashboardData.productTypes = productTypesRes.data.data?.productTypes?.length || 0;
                        this.dashboardData.processes = processesRes.data.data?.processes?.length || 0;
                        this.dashboardData.employees = employeesRes.data.data?.employees?.length || 0;'''

# 查找和替换
pattern = r'(async loadDashboardData\(\) \{[^}]+?)(\}\s*,)'
replacement = lambda m: new_code + '\n                    } catch (error) {\n                        console.error(\'加载仪表盘数据失败:\', error);\n                    }\n                },'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# 写回文件
with open('admin/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("修复完成")
