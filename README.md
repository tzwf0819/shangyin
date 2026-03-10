# 上茚工厂管理系统 - 完整版

## 项目简介

本项目为版辊加工工厂开发的全方位数字化管理系统，包含**Web 管理后台**、**微信小程序**和**Python 桌面应用**三个组成部分。

## 📦 项目组成部分

| 组成部分 | 路径 | 技术栈 | 说明 |
|---------|------|--------|------|
| Web 管理后台 | `admin/` | Vue 3 + Vite | 浏览器管理界面 |
| 微信小程序 | `miniprogram/` | 微信小程序原生 | 工人移动端操作 |
| Python 桌面应用 | `python-gui/` | Python + tkinter | 桌面管理客户端 |
| 后端服务 | `backend/` | Node.js + Express | RESTful API 服务 |

## 🚀 快速开始

### Docker 部署（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env

# 2. 启动服务
docker compose up -d --build

# 3. 访问管理后台
# https://tzwf.xyz/shangyin/admin/
```

### 本地开发

```bash
# 后端服务
cd backend && npm install && npm start

# 管理后台前端
cd admin && npm install && npm run dev

# Python GUI
cd python-gui && pip install -r requirements.txt && python run_gui.py
```

## 📋 核心功能

### 🔐 用户认证系统
- 微信一键登录
- 智能身份匹配
- JWT Token 认证
- 基于角色的权限管理

### 👷 工人操作（微信小程序）
- 个人工作台
- 扫码报工
- 绩效查看
- 个人中心

### 🛠️ 管理后台（Web/Python GUI）
- 仪表盘数据统计
- 工序管理（增删改查）
- 员工管理（工序授权）
- 合同管理（产品分解）
- 生产进度跟踪
- 绩效统计分析
- 评分功能
- 二维码生成

## 📚 文档导航

### 快速开始
- [快速部署指南](./QUICK_START.md)

### 技术文档
- [API 接口文档](./docs/api-complete.md)
- [API 概览](./docs/api-overview.md)

## 🔧 运维脚本

### 数据库备份
```bash
# Linux
./scripts/database_backup.sh

# Windows
.\scripts\database_backup.ps1
```

### 数据库恢复
```bash
# Linux
./scripts/database_restore.sh

# Windows
.\scripts\database_restore.ps1
```

### 服务器部署
```bash
sudo ./scripts/deploy_server.sh
sudo ./scripts/create_systemd_service.sh
```

## 🏗️ 技术架构

### 后端技术栈
- **运行环境**: Node.js 16+
- **Web 框架**: Express.js
- **数据库 ORM**: Sequelize
- **认证系统**: JWT Token
- **数据库**: MySQL / SQLite

### 前端技术栈
- **管理后台**: Vue 3 + Vite + Pinia
- **微信小程序**: 原生小程序
- **桌面应用**: Python tkinter

### 部署架构
- **Docker**: Docker Compose 容器编排
- **Nginx**: 反向代理
- **Systemd**: Linux 服务管理

## 📊 数据库配置

### MySQL（生产环境）
```env
DB_DIALECT=mysql
DB_HOST=82.156.83.99
DB_PORT=3306
DB_USER=shangyin
DB_PASS=shaoyansa
DB_NAME=shangyin
```

### SQLite（开发/测试）
```env
DB_DIALECT=sqlite
DB_STORAGE=./backend/database/shangyin.db
```

## 🔐 默认账号

- **管理后台**: admin / admin123
- **Python GUI**: admin / admin123

## 📱 访问方式

| 应用 | 访问方式 |
|------|---------|
| Web 管理后台 | https://tzwf.xyz/shangyin/admin/ |
| 微信小程序 | 微信搜索"上茚记工助手" |
| Python GUI | 运行 `python python-gui/run_gui.py` |

## ⚠️ 安全建议

1. 首次登录后立即修改默认密码
2. 生产环境使用强随机 JWT 密钥
3. 数据库使用最小权限原则
4. 定期备份数据库
5. 生产环境强制使用 HTTPS

## 📞 技术支持

- 🌐 网站：https://www.yidasoftware.xyz
- 📧 邮箱：tech-support@yidasoftware.xyz

---

*最后更新：2026 年 3 月 10 日*
