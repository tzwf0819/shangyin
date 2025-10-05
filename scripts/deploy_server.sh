#!/bin/bash
set -euo pipefail

echo "=== 开始部署商印后端服务 ==="

# 设置变量
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/backend"
ADMIN_DIR="$PROJECT_DIR/admin"

echo "项目目录: $PROJECT_DIR"
echo "后端目录: $BACKEND_DIR"
echo "管理端目录: $ADMIN_DIR"

# 检查目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
    echo "错误: 后端目录不存在: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$ADMIN_DIR" ]; then
    echo "错误: 管理端目录不存在: $ADMIN_DIR"
    exit 1
fi

# 停止可能正在运行的服务
echo "停止可能正在运行的服务..."
sudo pkill -f "node.*app.js" || true
sudo pkill -f "npm.*run.*dev" || true
sleep 3

# 安装后端依赖
echo "安装后端依赖..."
cd "$BACKEND_DIR"
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# 安装管理端依赖
echo "安装管理端依赖..."
cd "$ADMIN_DIR"
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# 构建管理端
echo "构建管理端..."
npm run build

# 启动后端服务
echo "启动后端服务..."
cd "$BACKEND_DIR"
# 使用nohup在后台启动服务
nohup node app.js > server.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动，PID: $BACKEND_PID"

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务是否正常运行
if ps -p $BACKEND_PID > /dev/null; then
    echo "后端服务运行正常"
    echo "服务日志:"
    tail -20 server.log || echo "暂无日志"
else
    echo "后端服务启动失败"
    echo "错误日志:"
    cat server.log || echo "无日志文件"
    exit 1
fi

echo "=== 部署完成 ==="
echo "后端服务运行在PID: $BACKEND_PID"
echo "管理端静态文件已构建完成"