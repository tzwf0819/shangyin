#!/bin/bash

# 上茚项目快速部署脚本
# 使用方法：ssh root@82.156.83.99 "bash -s" < deploy.sh

set -e

echo "=========================================="
echo "       上茚项目部署脚本"
echo "=========================================="

PROJECT_DIR="/opt/shangyin"
LOG_FILE="/var/log/shangyin_deploy.log"

# 日志函数
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a $LOG_FILE
    exit 1
}

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    error "请使用 root 用户运行此脚本"
fi

log "开始部署上茚项目..."

# 1. 创建项目目录
log "检查项目目录..."
if [ ! -d "$PROJECT_DIR" ]; then
    log "创建项目目录 $PROJECT_DIR"
    mkdir -p $PROJECT_DIR
fi

cd $PROJECT_DIR

# 2. 拉取最新代码
log "拉取最新代码..."
if [ -d ".git" ]; then
    git pull origin main 2>&1 | tee -a $LOG_FILE
else
    log "初始化 git 仓库..."
    git init
    git remote add origin https://github.com/tzwf0819/shangyin.git
    git pull origin main 2>&1 | tee -a $LOG_FILE
fi

# 3. 创建 .env 文件（如果不存在）
if [ ! -f ".env" ]; then
    log "创建 .env 文件..."
    cat > .env <<EOF
NODE_ENV=production
DB_DIALECT=mysql
DB_HOST=82.156.83.99
DB_PORT=3306
DB_USER=shangyin
DB_PASS=shaoyansa
DB_NAME=shangyin
JWT_SECRET=shangyin_jwt_secret_$(date +%s)
EOF
    log ".env 文件已创建"
else
    log ".env 文件已存在，跳过"
fi

# 4. 检查 Docker
log "检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    error "Docker 未安装，请先安装 Docker"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose 未安装"
fi

log "Docker 环境正常"

# 5. 停止旧容器
log "停止旧容器..."
docker compose down 2>&1 | tee -a $LOG_FILE || true

# 6. 清理悬空镜像
log "清理悬空镜像..."
docker image prune -f 2>&1 | tee -a $LOG_FILE || true

# 7. 构建并启动
log "构建 Docker 镜像..."
docker compose build 2>&1 | tee -a $LOG_FILE

log "启动服务..."
docker compose up -d 2>&1 | tee -a $LOG_FILE

# 8. 等待服务启动
log "等待服务启动..."
sleep 15

# 9. 检查容器状态
log "检查容器状态..."
docker compose ps 2>&1 | tee -a $LOG_FILE

# 10. 查看日志
log "最近日志:"
docker compose logs --tail=20 2>&1 | tee -a $LOG_FILE

# 11. 测试服务
log "测试服务..."
if curl -s http://127.0.0.1:14444/ > /dev/null 2>&1; then
    log "✅ 管理后台访问正常"
else
    log "⚠️ 管理后台访问失败，请检查日志"
fi

if curl -s http://127.0.0.1:3000/shangyin/ > /dev/null 2>&1; then
    log "✅ 后端 API 访问正常"
else
    log "⚠️ 后端 API 访问失败，请检查日志"
fi

# 12. 重载 Nginx
log "重载 Nginx..."
if command -v nginx &> /dev/null; then
    nginx -t 2>&1 | tee -a $LOG_FILE && nginx -s reload 2>&1 | tee -a $LOG_FILE || true
fi

log "=========================================="
log "部署完成！"
log "=========================================="
log "访问地址:"
log "  管理后台：https://tzwf.xyz/shangyin/admin/"
log "  后端 API: https://tzwf.xyz/shangyin/"
log "=========================================="

# 显示容器状态
echo ""
docker compose ps

echo ""
echo "查看日志：docker compose logs -f"
echo "重启服务：docker compose restart"
echo "停止服务：docker compose down"
