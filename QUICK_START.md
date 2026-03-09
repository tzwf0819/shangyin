# 🚀 商印项目 - 快速部署指南

## 前提条件

- 服务器已安装 Docker 和 Docker Compose
- Nginx 配置已修改 (添加 `/shangyin/` 代理到 `127.0.0.1:14444`)
- 数据库 MySQL 可访问 (82.156.83.99:3306)

---

## 📋 需要修改的参数

### 1. 数据库配置 (`.env` 文件)

在项目根目录创建 `.env` 文件，修改以下参数：

```bash
# 环境配置
NODE_ENV=production

# 数据库配置
DB_DIALECT=mysql          # 数据库类型 (mysql 或 sqlite)
DB_HOST=82.156.83.99      # MySQL 主机地址
DB_PORT=3306              # MySQL 端口
DB_USER=shangyin          # MySQL 用户名
DB_PASS=shaoyansa         # MySQL 密码
DB_NAME=shangyin          # 数据库名称

# JWT 密钥 (重要！生产环境请修改)
JWT_SECRET=你的随机密钥    # 建议使用: openssl rand -hex 32 生成
```

### 2. Nginx 配置

确认宝塔 Nginx 配置已包含：
```nginx
location ^~ /shangyin/ {
    proxy_pass http://127.0.0.1:14444/shangyin/;
    # ... 其他配置
}
```

---

## 🚀 部署步骤

### 步骤 1: SSH 登录服务器

```bash
ssh root@82.156.83.99
```

### 步骤 2: 进入项目目录

```bash
cd /opt/shangyin
# 或者你的项目实际目录
```

### 步骤 3: 创建/修改 .env 文件

```bash
# 创建 .env 文件
cat > .env <<EOF
NODE_ENV=production
DB_DIALECT=mysql
DB_HOST=82.156.83.99
DB_PORT=3306
DB_USER=shangyin
DB_PASS=shaoyansa
DB_NAME=shangyin
JWT_SECRET=$(openssl rand -hex 32)
EOF

# 或者手动编辑
vim .env
```

### 步骤 4: 测试数据库连接

```bash
# 测试能否连接 MySQL
mysql -h 82.156.83.99 -u shangyin -pshaoyansa -e "SELECT 1"
```

### 步骤 5: 启动 Docker 服务

```bash
# 停止旧容器 (如有)
docker compose down

# 构建并启动
docker compose up -d --build

# 查看启动日志
docker compose logs -f
```

### 步骤 6: 检查服务状态

```bash
# 查看容器状态
docker compose ps

# 应该看到两个容器状态为 Up
# shangyin-admin    Up (healthy)
# shangyin-backend  Up (healthy)
```

### 步骤 7: 重载 Nginx

```bash
# 在宝塔面板操作，或使用命令
nginx -t && nginx -s reload

# 宝塔命令
/etc/init.d/nginx reload
```

### 步骤 8: 测试访问

```bash
# 测试后端接口
curl http://127.0.0.1:14444/shangyin/

# 测试管理后台
curl http://127.0.0.1:14444/shangyin/admin/
```

---

## ✅ 验证部署

### 1. 检查容器状态
```bash
docker compose ps
```

### 2. 查看服务日志
```bash
# 查看后端日志
docker compose logs backend

# 查看前端日志
docker compose logs admin

# 实时查看日志
docker compose logs -f
```

### 3. 访问管理后台
浏览器访问：`https://tzwf.xyz/shangyin/admin/`

---

## 🔧 常用运维命令

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重新构建并启动
docker compose up -d --build

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 进入后端容器
docker compose exec backend sh

# 查看磁盘使用
docker system df

# 清理悬空镜像
docker image prune -f
```

---

## ⚠️ 故障排查

### 问题 1: 容器启动失败

```bash
# 查看详细日志
docker compose logs backend

# 常见原因:
# - 数据库连接失败：检查 .env 配置
# - 端口被占用：netstat -tlnp | grep 14444
```

### 问题 2: 数据库连接失败

```bash
# 测试数据库连接
mysql -h 82.156.83.99 -u shangyin -p -e "SHOW DATABASES;"

# 检查防火墙
telnet 82.156.83.99 3306
```

### 问题 3: 502 Bad Gateway

```bash
# 检查 Docker 容器是否运行
docker compose ps

# 检查 Nginx 配置
nginx -t

# 检查端口是否监听
netstat -tlnp | grep 14444
```

### 问题 4: 页面空白或 JS 加载失败

检查 Nginx 配置中的 `/shangyin/admin/` 路径是否正确代理。

---

## 📊 架构说明

```
用户请求
   ↓
宝塔 Nginx (80/443)
   ↓ /shangyin/*
Docker Admin (:14444)
   ↓ /shangyin/
Docker Backend (:3000)
   ↓
MySQL (82.156.83.99)
```

---

## 📞 需要帮助？

查看完整文档：`DOCKER_DEPLOY.md`
