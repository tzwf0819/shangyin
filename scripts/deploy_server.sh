#!/bin/bash
set -euo pipefail

log() {
  echo "[$(date '+%F %T')] $1"
}

log "=== 开始部署商印后端服务（数据安全版） ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
ADMIN_DIR="$PROJECT_DIR/admin"
DATABASE_DIR="$BACKEND_DIR/database"
BACKUP_DIR="$PROJECT_DIR/database_backups"

log "脚本目录: $SCRIPT_DIR"
log "项目目录: $PROJECT_DIR"
log "后端目录: $BACKEND_DIR"
log "管理端目录: $ADMIN_DIR"
log "数据库目录: $DATABASE_DIR"
log "备份目录: $BACKUP_DIR"

if [ ! -d "$BACKEND_DIR" ]; then
  log "错误: 后端目录不存在: $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$ADMIN_DIR" ]; then
  log "错误: 管理端目录不存在: $ADMIN_DIR"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
mkdir -p "$DATABASE_DIR"

backup_database() {
  local timestamp
  timestamp="$(date +%Y%m%d_%H%M%S)"
  local backup_file="$BACKUP_DIR/database_backup_$timestamp.tar.gz"

  if [ -d "$DATABASE_DIR" ] && compgen -G "$DATABASE_DIR/*.db" > /dev/null; then
    log "备份数据库文件..."
    tar -czf "$backup_file" -C "$DATABASE_DIR" .
    log "数据库已备份到: $backup_file"
  else
    log "提示: 未发现数据库文件，跳过备份步骤"
  fi
}

log "停止可能正在运行的服务..."
sudo pkill -f "node.*app.js" >/dev/null 2>&1 || true
sudo pkill -f "npm.*run.*dev" >/dev/null 2>&1 || true
sleep 2

backup_database

# 重新加载环境变量，避免未绑定变量导致脚本退出
set +u
[ -f ~/.bashrc ] && source ~/.bashrc || true
[ -f ~/.profile ] && source ~/.profile || true
set -u

ensure_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  log "未检测到 Node.js 或 npm，开始安装 Node.js 18..."
  if [ -f /etc/debian_version ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif [ -f /etc/redhat-release ] || [ -f /etc/centos-release ]; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
  elif [ -f /etc/alpine-release ]; then
    sudo apk add --update nodejs npm
  else
    curl -fsSL https://install-node.now.sh/lts | sudo bash -
  fi

  set +u
  [ -f ~/.bashrc ] && source ~/.bashrc || true
  [ -f ~/.profile ] && source ~/.profile || true
  set -u
}

ensure_node
log "Node.js 版本: $(node --version 2>/dev/null || echo '未安装')"
log "npm 版本: $(npm --version 2>/dev/null || echo '未安装')"

log "检查数据库文件..."
NEED_DATA_SEED=0

if [ -f "$DATABASE_DIR/shangyin.db" ]; then
  log "检测到现有数据库: $DATABASE_DIR/shangyin.db"
else
  log "未找到数据库文件，尝试使用最近的备份恢复..."
  latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1 || true)
  if [ -n "${latest_backup:-}" ]; then
    log "使用备份文件恢复: $latest_backup"
    tar -xzf "$latest_backup" -C "$DATABASE_DIR"
  fi
fi

if [ ! -f "$DATABASE_DIR/shangyin.db" ]; then
  log "仍然没有数据库文件，将在稍后自动生成测试数据"
  NEED_DATA_SEED=1
fi

log "安装后端依赖..."
cd "$BACKEND_DIR"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if [ "$NEED_DATA_SEED" -eq 1 ]; then
  log "执行测试数据脚本，初始化数据库..."
  cd "$PROJECT_DIR"
  NODE_ENV=production node scripts/generate-test-data.js
  cd "$BACKEND_DIR"
fi

log "安装管理端依赖..."
cd "$ADMIN_DIR"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

log "构建管理端..."
npm run build

log "启动后端服务..."
cd "$BACKEND_DIR"
export NODE_ENV=production
export DB_STORAGE="$DATABASE_DIR/shangyin.db"

nohup node app.js > server.log 2>&1 &
BACKEND_PID=$!
sleep 5

if ps -p "$BACKEND_PID" >/dev/null 2>&1; then
  log "后端服务已启动，PID: $BACKEND_PID"
else
  log "后端服务启动失败，输出日志:"
  cat server.log || true
  exit 1
fi

log "等待接口就绪..."
ATTEMPTS=0
until curl -fsS http://localhost:3000/shangyin/ >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -gt 10 ]; then
    log "接口检查超时，停止部署"
    cat server.log || true
    exit 1
  fi
  sleep 3
done

log "接口检查通过。最近日志:"
tail -20 server.log || true

log "清理旧备份（保留最近 5 个）..."
ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

log "=== 部署完成 ==="
