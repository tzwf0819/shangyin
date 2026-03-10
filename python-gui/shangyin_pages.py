#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上茚工厂管理系统 - 页面模块
"""

import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import threading
from typing import Dict, List

class BasePage:
    """页面基类"""
    def __init__(self, root, app):
        self.root = root
        self.app = app
        self.frame = None
        self.setup_ui()
    
    def setup_ui(self):
        """设置UI界面 - 子类实现"""
        pass
    
    def show(self):
        """显示页面"""
        if self.frame:
            self.frame.pack(fill='both', expand=True)
    
    def hide(self):
        """隐藏页面"""
        if self.frame:
            self.frame.pack_forget()

class LoginPage(BasePage):
    """登录页面"""
    def setup_ui(self):
        self.frame = tk.Frame(self.root, bg='white')
        
        # 登录框
        login_box = tk.Frame(self.frame, bg='white', relief='raised', bd=1)
        login_box.place(relx=0.5, rely=0.5, anchor='center', width=360, height=300)
        
        # 标题
        tk.Label(login_box, text="上茚工厂管理系统", 
                font=('Arial', 16, 'bold'), bg='white', pady=20).pack()
        
        # 用户名输入
        tk.Label(login_box, text="用户名", bg='white', anchor='w').pack(
            fill='x', padx=40, pady=(10,0))
        self.username_entry = tk.Entry(login_box, font=('Arial', 12))
        self.username_entry.pack(fill='x', padx=40, pady=5)
        self.username_entry.insert(0, "admin")
        
        # 密码输入
        tk.Label(login_box, text="密码", bg='white', anchor='w').pack(
            fill='x', padx=40, pady=(10,0))
        self.password_entry = tk.Entry(login_box, font=('Arial', 12), show='*')
        self.password_entry.pack(fill='x', padx=40, pady=5)
        self.password_entry.insert(0, "admin123")
        
        # 登录按钮
        login_btn = tk.Button(login_box, text="登录", command=self.login,
                             bg='#007bff', fg='white', font=('Arial', 12),
                             width=20, height=2)
        login_btn.pack(pady=20)
        
        # 状态标签
        self.status_label = tk.Label(login_box, text="", bg='white', fg='red')
        self.status_label.pack()
    
    def login(self):
        """处理登录"""
        username = self.username_entry.get().strip()
        password = self.password_entry.get().strip()
        
        if not username or not password:
            self.status_label.config(text="请输入用户名和密码")
            return
        
        self.status_label.config(text="登录中...")
        
        def do_login():
            result = self.app.api.login(username, password)
            if result.get('success'):
                self.root.after(0, lambda: self.app.login_success(username))
            else:
                self.root.after(0, lambda: self.status_label.config(
                    text=result.get('message', '登录失败')))
        
        threading.Thread(target=do_login, daemon=True).start()

class DashboardPage(BasePage):
    """仪表盘页面"""
    def setup_ui(self):
        self.frame = tk.Frame(self.root, bg='#f5f5f5')
        
        # 统计卡片容器
        self.stats_frame = tk.Frame(self.frame, bg='#f5f5f5')
        self.stats_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        # 加载数据
        self.load_data()
    
    def load_data(self):
        """加载仪表盘数据"""
        def do_load():
            result = self.app.api.get_dashboard_stats()
            if result.get('success'):
                stats = result.get('data', {})
                self.root.after(0, lambda: self.update_stats(stats))
            else:
                self.root.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '加载失败')))
        
        # 显示加载中
        loading_label = tk.Label(self.stats_frame, text="加载中...", 
                               font=('Arial', 14), bg='#f5f5f5')
        loading_label.pack(expand=True)
        
        threading.Thread(target=do_load, daemon=True).start()
    
    def update_stats(self, stats: Dict):
        """更新统计数据显示"""
        # 清除现有内容
        for widget in self.stats_frame.winfo_children():
            widget.destroy()
        
        # 定义统计卡片
        stat_items = [
            ('产品类型', stats.get('productTypes', 0), '#007bff'),
            ('工序', stats.get('processes', 0), '#28a745'),
            ('员工', stats.get('employees', 0), '#ffc107'),
            ('合同', stats.get('contracts', 0), '#dc3545')
        ]
        
        # 创建统计卡片
        for i, (label, value, color) in enumerate(stat_items):
            row = i // 2
            col = i % 2
            
            card = tk.Frame(self.stats_frame, bg='white', relief='raised', bd=1)
            card.grid(row=row, column=col, padx=10, pady=10, sticky='nsew')
            card.config(width=280, height=120)
            
            # 标题
            tk.Label(card, text=label, font=('Arial', 12), bg='white').pack(pady=(20,5))
            # 数值
            tk.Label(card, text=str(value), font=('Arial', 24, 'bold'),
                    fg=color, bg='white').pack(pady=5)
        
        # 配置网格权重
        self.stats_frame.grid_rowconfigure(0, weight=1)
        self.stats_frame.grid_rowconfigure(1, weight=1)
        self.stats_frame.grid_columnconfigure(0, weight=1)
        self.stats_frame.grid_columnconfigure(1, weight=1)

class ProcessesPage(BasePage):
    """工序管理页面"""
    def setup_ui(self):
        self.frame = tk.Frame(self.root, bg='#f5f5f5')
        
        # 工具栏
        toolbar = tk.Frame(self.frame, bg='#f5f5f5')
        toolbar.pack(fill='x', pady=(0,10))
        
        # 搜索框
        self.search_var = tk.StringVar()
        search_entry = tk.Entry(toolbar, textvariable=self.search_var, 
                               font=('Arial', 12), width=30)
        search_entry.pack(side='left', padx=(0,10))
        search_entry.bind('<Return>', lambda e: self.load_processes())
        
        # 搜索按钮
        search_btn = tk.Button(toolbar, text="搜索", command=self.load_processes,
                              bg='#007bff', fg='white')
        search_btn.pack(side='left', padx=(0,10))
        
        # 新增按钮
        add_btn = tk.Button(toolbar, text="新增工序", command=self.add_process,
                           bg='#28a745', fg='white')
        add_btn.pack(side='left')
        
        # 表格容器
        table_container = tk.Frame(self.frame)
        table_container.pack(fill='both', expand=True)
        
        # 创建表格
        columns = ('ID', '名称', '编码', '绩效', '单位', '状态', '操作')
        self.tree = ttk.Treeview(table_container, columns=columns, 
                                show='headings', height=15)
        
        # 设置列宽
        col_widths = {'ID': 50, '名称': 120, '编码': 80, '绩效': 80, 
                     '单位': 60, '状态': 80, '操作': 100}
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=col_widths.get(col, 100))
        
        # 滚动条
        scrollbar = ttk.Scrollbar(table_container, orient='vertical',
                                 command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # 绑定双击事件
        self.tree.bind('<Double-1>', self.on_item_double_click)
        
        # 加载数据
        self.load_processes()
    
    def load_processes(self):
        """加载工序数据"""
        def do_load():
            keyword = self.search_var.get().strip()
            result = self.app.api.get_processes(keyword)
            if result.get('success'):
                processes = result.get('data', {}).get('processes', [])
                self.root.after(0, lambda: self.update_table(processes))
            else:
                self.root.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '加载失败')))
        
        threading.Thread(target=do_load, daemon=True).start()
    
    def update_table(self, processes: List[Dict]):
        """更新表格数据"""
        # 清空表格
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # 添加数据
        for process in processes:
            unit_text = '件' if process.get('payRateUnit') == 'perItem' else '小时'
            self.tree.insert('', 'end', values=(
                process.get('id', ''),
                process.get('name', ''),
                process.get('code', ''),
                process.get('payRate', 0),
                unit_text,
                process.get('status', ''),
                '编辑 | 删除'
            ), tags=(process['id'],))
    
    def on_item_double_click(self, event):
        """表格项双击事件"""
        selection = self.tree.selection()
        if selection:
            item = selection[0]
            process_id = self.tree.item(item, 'tags')[0]
            self.edit_process(process_id)
    
    def add_process(self):
        """新增工序"""
        dialog = ProcessDialog(self.root, self.app, None)
        dialog.show()
    
    def edit_process(self, process_id: int):
        """编辑工序"""
        def load_process():
            result = self.app.api.get_process(process_id)
            if result.get('success'):
                process = result.get('data', {}).get('process')
                if process:
                    self.root.after(0, lambda: ProcessDialog(self.root, self.app, process).show())
            else:
                self.root.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '加载失败')))
        
        threading.Thread(target=load_process, daemon=True).start()

class EmployeesPage(BasePage):
    """员工管理页面"""
    def setup_ui(self):
        self.frame = tk.Frame(self.root, bg='#f5f5f5')
        
        # 工具栏
        toolbar = tk.Frame(self.frame, bg='#f5f5f5')
        toolbar.pack(fill='x', pady=(0,10))
        
        # 搜索框
        self.search_var = tk.StringVar()
        search_entry = tk.Entry(toolbar, textvariable=self.search_var,
                               font=('Arial', 12), width=30)
        search_entry.pack(side='left', padx=(0,10))
        search_entry.bind('<Return>', lambda e: self.load_employees())
        
        # 搜索按钮
        search_btn = tk.Button(toolbar, text="搜索", command=self.load_employees,
                              bg='#007bff', fg='white')
        search_btn.pack(side='left', padx=(0,10))
        
        # 新增按钮
        add_btn = tk.Button(toolbar, text="新增员工", command=self.add_employee,
                           bg='#28a745', fg='white')
        add_btn.pack(side='left')
        
        # 表格容器
        table_container = tk.Frame(self.frame)
        table_container.pack(fill='both', expand=True)
        
        # 创建表格
        columns = ('ID', '姓名', '编码', '状态', '微信', '工序', '操作')
        self.tree = ttk.Treeview(table_container, columns=columns,
                                show='headings', height=15)
        
        # 设置列宽
        col_widths = {'ID': 50, '姓名': 100, '编码': 80, '状态': 80,
                     '微信': 60, '工序': 150, '操作': 100}
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=col_widths.get(col, 100))
        
        # 滚动条
        scrollbar = ttk.Scrollbar(table_container, orient='vertical',
                                 command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # 绑定双击事件
        self.tree.bind('<Double-1>', self.on_item_double_click)
        
        # 加载数据
        self.load_employees()
    
    def load_employees(self):
        """加载员工数据"""
        def do_load():
            keyword = self.search_var.get().strip()
            result = self.app.api.get_employees(keyword)
            if result.get('success'):
                employees = result.get('data', {}).get('employees', [])
                self.root.after(0, lambda: self.update_table(employees))
            else:
                self.root.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '加载失败')))
        
        threading.Thread(target=do_load, daemon=True).start()
    
    def update_table(self, employees: List[Dict]):
        """更新表格数据"""
        # 清空表格
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # 添加数据
        for emp in employees:
            wx_status = "绑定" if emp.get('wxOpenId') else "-"
            processes = ', '.join([p.get('name', '') for p in emp.get('processes', [])])
            if not processes:
                processes = "无"
            
            self.tree.insert('', 'end', values=(
                emp.get('id', ''),
                emp.get('name', ''),
                emp.get('code', '-'),
                emp.get('status', ''),
                wx_status,
                processes,
                '编辑 | 删除'
            ), tags=(emp['id'],))
    
    def on_item_double_click(self, event):
        """表格项双击事件"""
        selection = self.tree.selection()
        if selection:
            item = selection[0]
            emp_id = self.tree.item(item, 'tags')[0]
            self.edit_employee(emp_id)
    
    def add_employee(self):
        """新增员工"""
        dialog = EmployeeDialog(self.root, self.app, None)
        dialog.show()
    
    def edit_employee(self, emp_id: int):
        """编辑员工"""
        def load_employee():
            result = self.app.api.get_employee(emp_id)
            if result.get('success'):
                employee = result.get('data', {}).get('employee')
                if employee:
                    self.root.after(0, lambda: EmployeeDialog(self.root, self.app, employee).show())
            else:
                self.root.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '加载失败')))
        
        threading.Thread(target=load_employee, daemon=True).start()

class ProcessDialog:
    """工序编辑对话框"""
    def __init__(self, parent, app, process: Dict = None):
        self.parent = parent
        self.app = app
        self.process = process
        self.dialog = None
        self.setup_ui()
    
    def setup_ui(self):
        """设置对话框UI"""
        self.dialog = tk.Toplevel(self.parent)
        self.dialog.title("编辑工序" if self.process else "新增工序")
        self.dialog.geometry("400x350")
        self.dialog.transient(self.parent)
        self.dialog.grab_set()
        
        # 名称
        tk.Label(self.dialog, text="名称*").pack(pady=(20,5))
        self.name_entry = tk.Entry(self.dialog, width=30)
        self.name_entry.pack(pady=5)
        
        # 绩效单价
        tk.Label(self.dialog, text="绩效单价*").pack(pady=(10,5))
        self.pay_rate_entry = tk.Entry(self.dialog, width=30)
        self.pay_rate_entry.pack(pady=5)
        self.pay_rate_entry.insert(0, "0")
        
        # 单位
        tk.Label(self.dialog, text="单位*").pack(pady=(10,5))
        self.unit_var = tk.StringVar(value="perItem")
        unit_frame = tk.Frame(self.dialog)
        unit_frame.pack(pady=5)
        tk.Radiobutton(unit_frame, text="件", variable=self.unit_var, 
                      value="perItem").pack(side='left')
        tk.Radiobutton(unit_frame, text="小时", variable=self.unit_var,
                      value="perHour").pack(side='left')
        
        # 描述
        tk.Label(self.dialog, text="描述").pack(pady=(10,5))
        self.desc_text = tk.Text(self.dialog, width=30, height=3)
        self.desc_text.pack(pady=5)
        
        # 按钮
        button_frame = tk.Frame(self.dialog)
        button_frame.pack(pady=20)
        
        if self.process:
            # 编辑模式：显示删除按钮
            tk.Button(button_frame, text="删除", command=self.delete,
                     bg='#dc3545', fg='white').pack(side='left', padx=5)
        
        tk.Button(button_frame, text="取消", command=self.dialog.destroy).pack(
            side='left', padx=5)
        tk.Button(button_frame, text="保存", command=self.save,
                 bg='#007bff', fg='white').pack(side='left', padx=5)
        
        # 如果是编辑模式，填充数据
        if self.process:
            self.name_entry.insert(0, self.process.get('name', ''))
            self.pay_rate_entry.delete(0, 'end')
            self.pay_rate_entry.insert(0, str(self.process.get('payRate', 0)))
            self.unit_var.set(self.process.get('payRateUnit', 'perItem'))
            self.desc_text.insert('1.0', self.process.get('description', ''))
    
    def show(self):
        """显示对话框"""
        if self.dialog:
            self.dialog.wait_window()
    
    def save(self):
        """保存工序"""
        name = self.name_entry.get().strip()
        pay_rate = self.pay_rate_entry.get().strip()
        description = self.desc_text.get('1.0', 'end').strip()
        
        # 验证输入
        if not name:
            messagebox.showerror("错误", "请输入工序名称")
            return
        
        try:
            pay_rate = float(pay_rate)
        except ValueError:
            messagebox.showerror("错误", "绩效单价必须是数字")
            return
        
        # 准备数据
        data = {
            'name': name,
            'payRate': pay_rate,
            'payRateUnit': self.unit_var.get(),
            'description': description
        }
        
        if not self.process:
            data['status'] = 'active'
        
        def do_save():
            if self.process:
                # 更新现有工序
                result = self.app.api.update_process(self.process['id'], data)
            else:
                # 创建新工序
                result = self.app.api.create_process(data)
            
            if result.get('success'):
                self.parent.after(0, lambda: (self.dialog.destroy(), 
                    self.app.pages['processes'].load_processes()))
            else:
                self.parent.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '保存失败')))
        
        threading.Thread(target=do_save, daemon=True).start()
    
    def delete(self):
        """删除工序"""
        if messagebox.askyesno("确认", "确定要删除这个工序吗？"):
            def do_delete():
                result = self.app.api.delete_process(self.process['id'])
                if result.get('success'):
                    self.parent.after(0, lambda: (self.dialog.destroy(),
                        self.app.pages['processes'].load_processes()))
                else:
                    self.parent.after(0, lambda: messagebox.showerror(
                        "错误", result.get('message', '删除失败')))
            
            threading.Thread(target=do_delete, daemon=True).start()

class EmployeeDialog:
    """员工编辑对话框"""
    def __init__(self, parent, app, employee: Dict = None):
        self.parent = parent
        self.app = app
        self.employee = employee
        self.dialog = None
        self.process_vars = {}  # 工序选择状态
        self.all_processes = []  # 所有工序列表
        self.setup_ui()
    
    def setup_ui(self):
        """设置对话框UI"""
        self.dialog = tk.Toplevel(self.parent)
        self.dialog.title("编辑员工" if self.employee else "新增员工")
        self.dialog.geometry("500x450")
        self.dialog.transient(self.parent)
        self.dialog.grab_set()
        
        # 姓名
        tk.Label(self.dialog, text="姓名*").pack(pady=(20,5))
        self.name_entry = tk.Entry(self.dialog, width=30)
        self.name_entry.pack(pady=5)
        
        # 状态
        tk.Label(self.dialog, text="状态*").pack(pady=(10,5))
        self.status_var = tk.StringVar(value="active")
        status_frame = tk.Frame(self.dialog)
        status_frame.pack(pady=5)
        tk.Radiobutton(status_frame, text="在职", variable=self.status_var,
                      value="active").pack(side='left')
        tk.Radiobutton(status_frame, text="离职", variable=self.status_var,
                      value="inactive").pack(side='left')
        
        # 工序授权
        tk.Label(self.dialog, text="工序授权").pack(pady=(10,5))
        
        # 工序选择容器
        self.process_frame = tk.Frame(self.dialog)
        self.process_frame.pack(pady=5, fill='x', padx=20)
        
        # 按钮
        button_frame = tk.Frame(self.dialog)
        button_frame.pack(pady=20)
        
        if self.employee:
            # 编辑模式：显示删除按钮
            tk.Button(button_frame, text="删除", command=self.delete,
                     bg='#dc3545', fg='white').pack(side='left', padx=5)
        
        tk.Button(button_frame, text="取消", command=self.dialog.destroy).pack(
            side='left', padx=5)
        tk.Button(button_frame, text="保存", command=self.save,
                 bg='#007bff', fg='white').pack(side='left', padx=5)
        
        # 加载工序列表
        self.load_processes()
        
        # 如果是编辑模式，填充数据
        if self.employee:
            self.name_entry.insert(0, self.employee.get('name', ''))
            self.status_var.set(self.employee.get('status', 'active'))
    
    def show(self):
        """显示对话框"""
        if self.dialog:
            self.dialog.wait_window()
    
    def load_processes(self):
        """加载工序列表"""
        def do_load():
            result = self.app.api.get_processes()
            if result.get('success'):
                self.all_processes = result.get('data', {}).get('processes', [])
                self.parent.after(0, self.update_process_checkboxes)
            else:
                self.parent.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '加载工序失败')))
        
        threading.Thread(target=do_load, daemon=True).start()
    
    def update_process_checkboxes(self):
        """更新工序复选框"""
        # 清除现有内容
        for widget in self.process_frame.winfo_children():
            widget.destroy()
        
        # 创建两列布局
        left_frame = tk.Frame(self.process_frame)
        left_frame.pack(side='left', fill='both', expand=True)
        
        right_frame = tk.Frame(self.process_frame)
        right_frame.pack(side='right', fill='both', expand=True)
        
        # 获取员工已授权的工序ID
        authorized_ids = set()
        if self.employee:
            authorized_ids = set(p['id'] for p in self.employee.get('processes', []))
        
        # 创建复选框
        for i, process in enumerate(self.all_processes):
            var = tk.BooleanVar(value=(process['id'] in authorized_ids))
            self.process_vars[process['id']] = var
            
            frame = left_frame if i % 2 == 0 else right_frame
            cb = tk.Checkbutton(frame, text=process.get('name', ''), variable=var)
            cb.pack(anchor='w')
    
    def save(self):
        """保存员工"""
        name = self.name_entry.get().strip()
        
        if not name:
            messagebox.showerror("错误", "请输入员工姓名")
            return
        
        # 获取选中的工序ID
        selected_ids = [pid for pid, var in self.process_vars.items() if var.get()]
        
        data = {
            'name': name,
            'status': self.status_var.get(),
            'processIds': selected_ids
        }
        
        def do_save():
            if self.employee:
                # 更新现有员工
                result = self.app.api.update_employee(self.employee['id'], data)
            else:
                # 创建新员工
                result = self.app.api.create_employee(data)
            
            if result.get('success'):
                self.parent.after(0, lambda: (self.dialog.destroy(),
                    self.app.pages['employees'].load_employees()))
            else:
                self.parent.after(0, lambda: messagebox.showerror(
                    "错误", result.get('message', '保存失败')))
        
        threading.Thread(target=do_save, daemon=True).start()
    
    def delete(self):
        """删除员工"""
        if messagebox.askyesno("确认", "确定要删除这个员工吗？"):
            def do_delete():
                result = self.app.api.delete_employee(self.employee['id'])
                if result.get('success'):
                    self.parent.after(0, lambda: (self.dialog.destroy(),
                        self.app.pages['employees'].load_employees()))
                else:
                    self.parent.after(0, lambda: messagebox.showerror(
                        "错误", result.get('message', '删除失败')))
            
            threading.Thread(target=do_delete, daemon=True).start()