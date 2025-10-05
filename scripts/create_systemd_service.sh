#!/bin/bash
set -euo pipefail

echo "=== 创建Systemd服务 ==="

# 设置变量 - 从脚本所在目录向上找到项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
SERVICE_NAME="shangyin-backend"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
USER=$(whoami)

echo "脚本目录: $SCRIPT_DIR"
echo "项目目录: $PROJECT_DIR"
echo "服务名称: $SERVICE_NAME"
echo "服务文件: $SERVICE_FILE"
echo "运行用户: $USER"

# 检查目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
    echo "错误: 后端目录不存在: $BACKEND_DIR"
    exit 1
fi

# 创建systemd服务文件
echo "创建systemd服务文件..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=ShangYin Backend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
echo "重新加载systemd配置..."
sudo systemctl daemon-reload

# 启用服务
echo "启用服务..."
sudo systemctl enable "$SERVICE_NAME"

# 启动服务
echo "启动服务..."
sudo systemctl start "$SERVICE_NAME"

# 检查服务状态
echo "检查服务状态..."
sudo systemctl status "$SERVICE_NAME" --no-pager

echo "=== Systemd服务创建完成 ==="
echo "服务名称: $SERVICE_NAME"
echo "管理命令:"
echo "  sudo systemctl start $SERVICE_NAME    # 启动服务"
echo "  sudo systemctl stop $SERVICE_NAME     # 停止服务"
echo "  sudo systemctl restart $SERVICE_NAME  # 重启服务"
echo "  sudo systemctl status $SERVICE_NAME   # 查看状态"
echo "  sudo journalctl -u $SERVICE_NAME -f   # 查看日志"