#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上茚工厂管理系统 - GUI启动文件
"""

import sys
import os
import tkinter as tk
from tkinter import messagebox

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from shangyin_gui_main import ShangyinAdminGUI
    
    def main():
        """主函数"""
        try:
            # 检查依赖
            import requests
        except ImportError:
            messagebox.showerror("依赖错误", 
                "请先安装依赖包：\npip install requests")
            return
        
        # 创建并运行应用
        app = ShangyinAdminGUI()
        app.run()
    
    if __name__ == "__main__":
        main()

except ImportError as e:
    print(f"导入错误: {e}")
    print("请确保所有模块文件都在当前目录中")
    input("按回车键退出...")

except Exception as e:
    print(f"启动错误: {e}")
    input("按回车键退出...")