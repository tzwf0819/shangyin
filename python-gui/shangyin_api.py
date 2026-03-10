#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上茚工厂管理系统 - API客户端模块
"""

import requests
import json
from typing import Dict, List, Optional
import os
import logging

class ShangyinAPI:
    def __init__(self, base_url: str = "https://www.yidasoftware.xyz/shangyin"):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
        
    def login(self, username: str, password: str) -> Dict:
        """用户登录"""
        try:
            response = self.session.post(
                f"{self.base_url}/admin-login/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.token = data['data']['token']
                return data
            else:
                return {"success": False, "message": f"HTTP {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def _get_headers(self) -> Dict:
        """获取请求头"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def get_processes(self, keyword: str = "") -> Dict:
        """获取工序列表"""
        try:
            params = {}
            if keyword:
                params["keyword"] = keyword
                
            response = self.session.get(
                f"{self.base_url}/processes",
                params=params,
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def get_process(self, process_id: int) -> Dict:
        """获取单个工序详情"""
        try:
            response = self.session.get(
                f"{self.base_url}/processes/{process_id}",
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def create_process(self, data: Dict) -> Dict:
        """创建工序"""
        try:
            response = self.session.post(
                f"{self.base_url}/processes",
                json=data,
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def update_process(self, process_id: int, data: Dict) -> Dict:
        """更新工序"""
        try:
            response = self.session.put(
                f"{self.base_url}/processes/{process_id}",
                json=data,
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def delete_process(self, process_id: int) -> Dict:
        """删除工序"""
        try:
            response = self.session.delete(
                f"{self.base_url}/processes/{process_id}",
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def get_employees(self, keyword: str = "") -> Dict:
        """获取员工列表"""
        try:
            params = {}
            if keyword:
                params["keyword"] = keyword
                
            response = self.session.get(
                f"{self.base_url}/employees",
                params=params,
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def get_employee(self, employee_id: int) -> Dict:
        """获取单个员工详情"""
        try:
            response = self.session.get(
                f"{self.base_url}/employees/{employee_id}",
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def create_employee(self, data: Dict) -> Dict:
        """创建员工"""
        try:
            response = self.session.post(
                f"{self.base_url}/employees",
                json=data,
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def update_employee(self, employee_id: int, data: Dict) -> Dict:
        """更新员工"""
        try:
            response = self.session.put(
                f"{self.base_url}/employees/{employee_id}",
                json=data,
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def delete_employee(self, employee_id: int) -> Dict:
        """删除员工"""
        try:
            response = self.session.delete(
                f"{self.base_url}/employees/{employee_id}",
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def get_product_types(self) -> Dict:
        """获取产品类型列表"""
        try:
            response = self.session.get(
                f"{self.base_url}/product-types",
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def get_dashboard_stats(self) -> Dict:
        """获取仪表盘统计数据"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/admin/dashboard/stats",
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}
    
    def get_contracts(self) -> Dict:
        """获取合同列表"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/admin/contracts",
                headers=self._get_headers(),
                timeout=10
            )
            return response.json() if response.status_code == 200 else {
                "success": False, "message": f"HTTP {response.status_code}"
            }
        except Exception as e:
            return {"success": False, "message": f"网络错误: {str(e)}"}

    def initialize_processes_from_config(self, config_file: str = "processes_config.json") -> Dict:
        """从配置文件初始化工序"""
        try:
            # 读取配置文件
            if not os.path.exists(config_file):
                return {"success": False, "message": f"配置文件不存在: {config_file}"}

            with open(config_file, 'r', encoding='utf-8') as f:
                config_data = json.load(f)

            initial_processes = config_data.get('initial_processes', [])
            if not initial_processes:
                return {"success": False, "message": "配置文件中没有找到初始工序数据"}

            # 检查现有工序，避免重复创建
            existing_processes_result = self.get_processes()
            existing_names = set()
            if existing_processes_result.get('success'):
                existing_data = existing_processes_result.get('data', {})
                existing_processes = existing_data.get('processes', [])
                existing_names = {proc['name'] for proc in existing_processes}

            # 创建新工序
            created_count = 0
            failed_count = 0
            messages = []

            for process_data in initial_processes:
                process_name = process_data.get('name', '').strip()

                # 检查是否已存在同名工序
                if process_name in existing_names:
                    messages.append(f"跳过已存在的工序: {process_name}")
                    continue

                # 创建工序
                result = self.create_process(process_data)
                if result.get('success'):
                    created_count += 1
                    messages.append(f"成功创建工序: {process_name}")
                else:
                    failed_count += 1
                    messages.append(f"创建工序失败 {process_name}: {result.get('message', '未知错误')}")

            return {
                "success": True,
                "message": f"工序初始化完成。成功创建: {created_count}个，失败: {failed_count}个",
                "details": messages,
                "created_count": created_count,
                "failed_count": failed_count
            }

        except FileNotFoundError:
            return {"success": False, "message": f"找不到配置文件: {config_file}"}
        except json.JSONDecodeError:
            return {"success": False, "message": "配置文件格式错误，不是有效的JSON格式"}
        except Exception as e:
            logging.exception("初始化工序时发生错误")
            return {"success": False, "message": f"初始化工序时发生错误: {str(e)}"}

    def check_if_processes_exist(self) -> bool:
        """检查系统中是否存在任何工序"""
        try:
            result = self.get_processes()
            if result.get('success'):
                processes_data = result.get('data', {})
                processes = processes_data.get('processes', [])
                return len(processes) > 0
            return False
        except Exception:
            return False