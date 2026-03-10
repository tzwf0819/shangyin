# 服务器部署执行指南

## 📋 问题诊断

**当前问题**：502 Bad Gateway
**原因**：服务器上的后端服务未运行

---

## 🚀 快速解决（推荐）

### 方法 1：使用部署脚本（最简单）

**步骤 1**：SSH 登录服务器
```bash
ssh root@82.156.83.99
```

**步骤 2**：执行一键部署脚本
```bash
cd /opt/shangyin
bash <(curl -s https://raw.githubusercontent.com/tzwf0819/shangyin/main/deploy.sh)
```

或者先下载脚本：
```bash
cd /opt/shangyin
curl -O https://raw.githubusercontent.com/tzwf0819/shangyin/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

---

### 方法 2：手动部署

**步骤 1**：SSH 登录服务器
```bash
ssh root@82.156.83.99
```

**步骤 2**：进入项目目录
```bash
cd /opt/shangyin
```

**步骤 3**：拉取最新代码
```bash
git pull origin main
```

**步骤 4**：重启 Docker 服务
```bash
docker compose down
docker compose up -d
```

**步骤 5**：查看日志
```bash
docker compose logs -f
```

**步骤 6**：检查容器状态
```bash
docker compose ps
```

---

## ✅ 验证部署

### 检查容器状态
```bash
docker compose ps
```

**预期输出**：
```
NAME                STATUS              PORTS
shangyin-backend    Up (healthy)        3000/tcp
shangyin-admin      Up (healthy)        0.0.0.0:14444->80/tcp
```

### 测试后端 API
```bash
curl http://127.0.0.1:3000/shangyin/
```

**预期输出**：
```json
{
  "success": true,
  "message": "上茚工厂管理系统 API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "..."
}
```

### 测试管理后台
```bash
curl http://127.0.0.1:14444/
```

**预期输出**：应该返回 HTML 内容

### 重载 Nginx
```bash
nginx -t && nginx -s reload
```

---

## 🔧 故障排查

### 问题 1：容器启动失败

**查看日志**：
```bash
docker compose logs backend
```

**常见错误**：
1. 数据库连接失败 → 检查 `.env` 配置
2. 端口被占用 → `netstat -tlnp | grep 3000`
3. 代码错误 → 查看具体错误信息

### 问题 2：502 错误持续存在

**检查 Nginx 配置**：
```bash
cat /www/server/panel/vhost/nginx/tzwf.xyz.conf | grep -A 10 "/shangyin/"
```

**确认代理配置**：
```nginx
location ^~ /shangyin/ {
    proxy_pass http://127.0.0.1:14444/;
    # ... 其他配置
}
```

**重载 Nginx**：
```bash
/etc/init.d/nginx reload
```

### 问题 3：数据库连接失败

**测试数据库连接**：
```bash
mysql -h 82.156.83.99 -u shangyin -pshaoyansa -e "SELECT 1"
```

**如果连接失败**：
1. 检查数据库服务是否运行
2. 检查防火墙设置
3. 检查 `.env` 文件配置

---

## 📊 常用命令

### Docker 相关
```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 启动服务
docker compose up -d

# 重新构建
docker compose build
```

### Nginx 相关
```bash
# 测试配置
nginx -t

# 重载配置
nginx -s reload

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 系统相关
```bash
# 查看端口
netstat -tlnp | grep 3000
netstat -tlnp | grep 14444

# 查看进程
ps aux | grep node

# 查看内存
free -h

# 查看磁盘
df -h
```

---

## 📞 部署后验证

### 1. 小程序测试
打开微信小程序"上茚记工助手"，测试登录功能

### 2. 管理后台测试
访问：https://tzwf.xyz/shangyin/admin/
登录：admin / admin123

### 3. API 测试
访问：https://tzwf.xyz/shangyin/
应该返回 JSON 数据

---

## ⚠️ 注意事项

1. **部署时间**：约 5-10 分钟
2. **网络要求**：服务器需要能访问 GitHub
3. **权限要求**：需要 root 权限
4. **备份数据**：部署前建议备份数据库

---

## 📝 部署日志

部署日志保存在：`/var/log/shangyin_deploy.log`

查看日志：
```bash
tail -f /var/log/shangyin_deploy.log
```

---

*文档创建时间：2026 年 3 月 10 日*
