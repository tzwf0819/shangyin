#!/bin/bash
set -euo pipefail

echo "=== 开始部署商印后端服务（数据安全版） ==="

# 设置变量 - 从脚本所在目录向上找到项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
ADMIN_DIR="$PROJECT_DIR/admin"
DATABASE_DIR="$BACKEND_DIR/database"
BACKUP_DIR="$PROJECT_DIR/database_backups"

echo "脚本目录: $SCRIPT_DIR"
echo "项目目录: $PROJECT_DIR"
echo "后端目录: $BACKEND_DIR"
echo "管理端目录: $ADMIN_DIR"
echo "数据库目录: $DATABASE_DIR"
echo "备份目录: $BACKUP_DIR"

# 检查目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
    echo "错误: 后端目录不存在: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$ADMIN_DIR" ]; then
    echo "错误: 管理端目录不存在: $ADMIN_DIR"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 数据库备份函数
backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/database_backup_$timestamp.tar.gz"
    
    echo "备份数据库文件..."
    if [ -d "$DATABASE_DIR" ]; then
        # 备份所有数据库文件
        tar -czf "$backup_file" -C "$DATABASE_DIR" .
        echo "数据库已备份到: $backup_file"
        
        # 列出备份文件
        echo "当前备份文件:"
        ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "暂无备份文件"
    else
        echo "警告: 数据库目录不存在，跳过备份"
    fi
}

# 停止可能正在运行的服务
echo "停止可能正在运行的服务..."
sudo pkill -f "node.*app.js" || true
sudo pkill -f "npm.*run.*dev" || true
sleep 3

# 备份数据库
backup_database

# 检查并安装Node.js和npm
echo "检查Node.js和npm..."
echo "当前PATH: $PATH"

# 安全地重新加载环境变量（避免未绑定变量错误）
set +u  # 关闭未绑定变量检查
if [ -f ~/.bashrc ]; then
    source ~/.bashrc || true
fi
if [ -f ~/.profile ]; then
    source ~/.profile || true
fi
set -u  # 重新开启未绑定变量检查

# 检查npm是否在常见安装路径中
if ! command -v npm &> /dev/null; then
    echo "npm命令未找到，检查常见安装路径..."
    # 检查常见npm安装位置
    for path in /usr/local/bin/npm /usr/bin/npm /opt/node/bin/npm ~/.nvm/versions/*/bin/npm; do
        if [ -f "$path" ]; then
            echo "找到npm在: $path"
            export PATH="$(dirname $path):$PATH"
            break
        fi
    done
fi

if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "安装Node.js 18..."
    
    # 检测系统类型并选择合适的安装方式
    if [ -f /etc/debian_version ]; then
        echo "检测到Debian/Ubuntu系统"
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ] || [ -f /etc/centos-release ]; then
        echo "检测到CentOS/RHEL系统"
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif [ -f /etc/alpine-release ]; then
        echo "检测到Alpine Linux系统"
        sudo apk add --update nodejs npm
    else
        echo "未知系统，尝试使用NodeSource通用安装脚本"
        curl -fsSL https://install-node.now.sh/lts | sudo bash -
    fi
    
    # 重新加载环境变量
    if [ -f ~/.bashrc ]; then
        source ~/.bashrc
    fi
    if [ -f ~/.profile ]; then
        source ~/.profile
    fi
fi

echo "Node.js版本: $(node --version 2>/dev/null || echo '未安装')"
echo "npm版本: $(npm --version 2>/dev/null || echo '未安装')"
echo "最终PATH: $PATH"

# 检查数据库文件完整性
echo "检查数据库文件完整性..."
if [ -d "$DATABASE_DIR" ]; then
    echo "数据库文件状态:"
    ls -la "$DATABASE_DIR"/*.db* 2>/dev/null || echo "暂无数据库文件"
    
    # 确保数据库文件存在
    if [ ! -f "$DATABASE_DIR/shangyin.db" ]; then
        echo "警告: 主数据库文件不存在，检查备份..."
        # 尝试从最近的备份恢复
        local latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            echo "从备份恢复数据库: $latest_backup"
            tar -xzf "$latest_backup" -C "$DATABASE_DIR"
            echo "数据库恢复完成"
        else
            echo "警告: 无可用备份，将创建新数据库"
        fi
    fi
else
    echo "创建数据库目录..."
    mkdir -p "$DATABASE_DIR"
fi

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

# 设置正确的环境变量
export NODE_ENV=production
export DB_STORAGE="$DATABASE_DIR/shangyin.db"

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
    
    # 验证数据库连接
    echo "验证数据库连接..."
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo "数据库连接正常"
    else
        echo "警告: 数据库连接可能有问题"
    fi
else
    echo "后端服务启动失败"
    echo "错误日志:"
    cat server.log || echo "无日志文件"
    exit 1
fi

echo "=== 部署完成 ==="
echo "后端服务运行在PID: $BACKEND_PID"
echo "管理端静态文件已构建完成"
echo "数据库备份位置: $BACKUP_DIR"

# 清理旧备份（保留最近5个）
echo "清理旧备份文件..."
ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
echo "备份清理完成"