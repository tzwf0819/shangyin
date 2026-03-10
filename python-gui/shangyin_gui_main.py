#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上茚工厂管理系统 - GUI主程序
"""

import tkinter as tk
from tkinter import ttk, messagebox
import threading
import json
import os
from shangyin_api import ShangyinAPI
from shangyin_pages import LoginPage, DashboardPage, ProcessesPage, EmployeesPage

class ShangyinAdminGUI:
    def __init__(self):
        self.api = ShangyinAPI()
        self.current_user = None
        
        # 创建主窗口
        self.root = tk.Tk()
        self.root.title("上茚工厂管理系统")
        self.root.geometry("1200x700")
        self.root.configure(bg='#f5f5f5')
        
        # 页面管理器
        self.pages = {}
        self.current_page = None
        
        # 初始化页面
        self.setup_pages()

        # 检查是否需要初始化工序
        self.check_and_initialize_processes()

        # 显示登录页面
        self.show_page('login')

    def setup_pages(self):
        """初始化所有页面"""
        self.pages['login'] = LoginPage(self.root, self)
        self.pages['dashboard'] = DashboardPage(self.root, self)
        self.pages['processes'] = ProcessesPage(self.root, self)
        self.pages['employees'] = EmployeesPage(self.root, self)

    def check_and_initialize_processes(self):
        """检查并初始化工序"""
        def do_check_and_init():
            try:
                # 检查系统中是否已有工序
                has_processes = self.api.check_if_processes_exist()

                if not has_processes:
                    # 如果没有工序，则提示用户是否从配置文件初始化
                    self.root.after(0, self.prompt_for_initialization)
                else:
                    # 如果已有工序，则不进行初始化
                    pass
            except Exception as e:
                print(f"检查工序时出错: {e}")

        threading.Thread(target=do_check_and_init, daemon=True).start()

    def prompt_for_initialization(self):
        """提示用户是否从配置文件初始化工序"""
        if os.path.exists("processes_config.json"):
            response = messagebox.askyesno(
                "工序初始化",
                "检测到系统中没有工序数据，是否从配置文件初始化默认工序？\n\n" +
                "这将创建以下工序：\n" +
                "- 裁剪\n" +
                "- 缝制\n" +
                "- 熨烫\n" +
                "- 质检\n" +
                "- 包装\n\n" +
                "注意：此操作只在系统初次安装时执行一次。",
                icon='question'
            )

            if response:
                self.initialize_processes_from_config()
        else:
            messagebox.showinfo(
                "工序初始化",
                "未找到工序配置文件 (processes_config.json)，无法自动初始化工序。\n" +
                "请手动在工序管理页面添加工序。"
            )

    def initialize_processes_from_config(self):
        """从配置文件初始化工序"""
        def do_initialize():
            try:
                result = self.api.initialize_processes_from_config()

                self.root.after(0, lambda: self.handle_initialization_result(result))
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror(
                    "初始化错误", f"初始化工序时发生错误: {str(e)}"
                ))

        threading.Thread(target=do_initialize, daemon=True).start()

    def handle_initialization_result(self, result):
        """处理初始化结果"""
        if result.get('success'):
            msg = result.get('message', '工序初始化完成')
            details = result.get('details', [])

            # 显示详细信息
            detail_msg = "\n".join(details)
            messagebox.showinfo(
                "初始化成功",
                f"{msg}\n\n详细信息:\n{detail_msg}"
            )

            # 刷新工序页面以显示新创建的工序
            if 'processes' in self.pages:
                self.pages['processes'].load_processes()
        else:
            messagebox.showerror("初始化失败", result.get('message', '未知错误'))
    
    def show_page(self, page_name: str):
        """显示指定页面"""
        # 隐藏当前页面
        if self.current_page:
            self.current_page.hide()
        
        # 显示新页面
        if page_name in self.pages:
            self.current_page = self.pages[page_name]
            self.current_page.show()
    
    def login_success(self, username: str):
        """登录成功回调"""
        self.current_user = username
        self.show_page('dashboard')
    
    def logout(self):
        """退出登录"""
        self.current_user = None
        self.api.token = None
        self.show_page('login')
    
    def run(self):
        """运行应用程序"""
        self.root.mainloop()

def main():
    """主函数"""
    try:
        app = ShangyinAdminGUI()
        app.run()
    except Exception as e:
        messagebox.showerror("启动错误", f"应用程序启动失败: {str(e)}")

if __name__ == "__main__":
    main()