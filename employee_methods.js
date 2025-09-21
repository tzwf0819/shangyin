                
                async deleteEmployee(id) {
                    if (!confirm('确定要删除这个员工吗？删除后该员工的微信关联也将被清除。')) return;
                    
                    try {
                        const response = await axios.delete(this.apiBaseUrl + '/admin/employees/' + id);
                        if (response.data.success) {
                            this.showAlert(response.data.message || '删除成功', 'success');
                            this.loadEmployees();
                            this.loadDashboardData();
                        }
                    } catch (error) {
                        console.error('删除员工失败:', error);
                        this.showAlert(error.response?.data?.message || '删除失败', 'danger');
                    }
                },
                
                async clearEmployeeWechat(id) {
                    if (!confirm('确定要清除该员工的微信关联吗？清除后该微信下次登录将被视为新用户。')) return;
                    
                    try {
                        const response = await axios.delete(this.apiBaseUrl + '/admin/employees/' + id + '/wechat');
                        if (response.data.success) {
                            this.showAlert(response.data.message || '微信关联已清除', 'success');
                            this.loadEmployees();
                        }
                    } catch (error) {
                        console.error('清除微信关联失败:', error);
                        this.showAlert(error.response?.data?.message || '操作失败', 'danger');
                    }
                },
                
                async batchClearWechat() {
                    if (this.selectedEmployees.length === 0) return;
                    
                    if (!confirm(`确定要清除${this.selectedEmployees.length}个员工的微信关联吗？`)) return;
                    
                    try {
                        const response = await axios.post(this.apiBaseUrl + '/admin/employees/batch/clear-wechat', {
                            employeeIds: this.selectedEmployees
                        });
                        if (response.data.success) {
                            this.showAlert(response.data.message || '批量清除成功', 'success');
                            this.selectedEmployees = [];
                            this.loadEmployees();
                        }
                    } catch (error) {
                        console.error('批量清除微信关联失败:', error);
                        this.showAlert(error.response?.data?.message || '操作失败', 'danger');
                    }
                },
                
                async batchDeleteEmployees() {
                    if (this.selectedEmployees.length === 0) return;
                    
                    if (!confirm(`确定要删除${this.selectedEmployees.length}个员工吗？删除后相关的微信关联也将被清除。`)) return;
                    
                    try {
                        const response = await axios.post(this.apiBaseUrl + '/admin/employees/batch/delete', {
                            employeeIds: this.selectedEmployees
                        });
                        if (response.data.success) {
                            this.showAlert(response.data.message || '批量删除成功', 'success');
                            this.selectedEmployees = [];
                            this.loadEmployees();
                            this.loadDashboardData();
                        }
                    } catch (error) {
                        console.error('批量删除员工失败:', error);
                        this.showAlert(error.response?.data?.message || '操作失败', 'danger');
                    }
                },
                
                formatDate(dateString) {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
                },
