# 502 错误排查指南

## 📅 日期
2026 年 3 月 10 日

## 🐛 问题描述

**错误现象**：
- 小程序访问 `https://tzwf.xyz/shangyin/auth/login` 返回 502
- 管理后台无法访问
- 后端服务未运行

**错误原因**：
502 Bad Gateway 表示 Nginx 无法连接到后端服务（端口 3000 或 14444）

---

## 🔍 排查步骤

### 第一步：检查服务器状态

SSH 登录服务器：
```bash
ssh root@82.156.83.99
```

### 第二步：检查 Docker 容器状态

```bash
# 查看容器状态
docker compose ps

# 或者
docker ps | grep shangyin
```

**预期输出**：
```
NAME                STATUS              PORTS
shangyin-backend    Up (healthy)        3000/tcp
shangyin-admin      Up (healthy)        0.0.0.0:14444->80/tcp
```

**如果容器未运行**：
```bash
cd /opt/shangyin  # 或你的项目目录
docker compose up -d
```

### 第三步：检查后端日志

```bash
# 查看后端日志
docker compose logs backend

# 实时查看日志
docker compose logs -f backend
```

**常见错误**：
1. 数据库连接失败
2. 端口被占用
3. 环境变量配置错误

### 第四步：检查 Nginx 配置

```bash
# 测试 Nginx 配置
nginx -t

# 重载 Nginx
nginx -s reload

# 或者使用宝塔命令
/etc/init.d/nginx reload
```

### 第五步：检查端口监听

```bash
# 查看端口监听状态
netstat -tlnp | grep 14444
netstat -tlnp | grep 3000
```

---

## 🔧 解决方案

### 方案 1：重启 Docker 服务（推荐）

```bash
cd /opt/shangyin

# 停止服务
docker compose down

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 方案 2：更新代码并重启

```bash
cd /opt/shangyin

# 拉取最新代码
git pull origin main

# 重新构建
docker compose build

# 重启服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 方案 3：手动部署（如果 Docker 未安装）

```bash
cd /opt/shangyin

# 安装后端依赖
cd backend
npm install

# 启动后端
npm start

# 或者使用 pm2
pm2 restart shangyin-backend
```

---

## 📋 部署检查清单

### 服务器配置
- [ ] Docker 和 Docker Compose 已安装
- [ ] Nginx 配置正确
- [ ] 数据库可访问 (82.156.83.99:3306)

### 环境变量
- [ ] `.env` 文件存在
- [ ] 数据库配置正确
- [ ] JWT_SECRET 已设置

### Nginx 配置
- [ ] `/shangyin/` 代理到 `127.0.0.1:3000`
- [ ] `/shangyin/admin/` 代理到 `127.0.0.1:14444`

---

## 🚀 快速部署脚本

在服务器上执行：

```bash
#!/bin/bash

echo "=== 开始部署商印项目 ==="

# 进入项目目录
cd /opt/shangyin

# 拉取最新代码
git pull origin main

# 停止旧容器
docker compose down

# 重新构建
docker compose build

# 启动服务
docker compose up -d

# 等待服务启动
sleep 10

# 检查容器状态
docker compose ps

# 查看日志
docker compose logs --tail=50

echo "=== 部署完成 ==="
```

保存为 `deploy.sh`，执行：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📞 故障排查命令

### 查看容器状态
```bash
docker compose ps
```

### 查看后端日志
```bash
docker compose logs backend
```

### 查看前端日志
```bash
docker compose logs admin
```

### 检查数据库连接
```bash
mysql -h 82.156.83.99 -u shangyin -p
```

### 检查端口
```bash
netstat -tlnp | grep 3000
netstat -tlnp | grep 14444
```

### 测试后端 API
```bash
curl http://127.0.0.1:3000/shangyin/
curl http://127.0.0.1:14444/
```

---

## ⚠️ 常见问题

### 问题 1：数据库连接失败

**错误日志**：
```
Unable to connect to database
```

**解决方案**：
1. 检查 `.env` 文件中的数据库配置
2. 测试数据库连接：`mysql -h 82.156.83.99 -u shangyin -p`
3. 检查防火墙是否开放 3306 端口

### 问题 2：端口被占用

**错误日志**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 重启服务
docker compose restart
```

### 问题 3：Nginx 配置错误

**错误日志**：
```
502 Bad Gateway
```

**解决方案**：
```bash
# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 重载 Nginx
nginx -s reload
```

---

## 📊 部署状态

| 服务 | 端口 | 状态 | URL |
|------|------|------|-----|
| 后端 API | 3000 | ⚠️ 待检查 | https://tzwf.xyz/shangyin/ |
| 管理后台 | 14444 | ⚠️ 待检查 | https://tzwf.xyz/shangyin/admin/ |
| 数据库 | 3306 | ✅ 正常 | 82.156.83.99:3306 |

---

*文档创建时间：2026 年 3 月 10 日*
