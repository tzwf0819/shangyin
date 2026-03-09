#!/bin/bash
set -euo pipefail

log() {
  echo "[$(date '+%F %T')] $1"
}

log "=== 开始部署商印 Docker 服务（腾讯云版）==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log "项目目录：$PROJECT_DIR"

cd "$PROJECT_DIR"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
  log "Docker 未安装，正在安装..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
  log "Docker 安装完成"
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  log "Docker Compose 未安装，正在安装..."
  sudo apt-get update
  sudo apt-get install -y docker-compose
fi

# 添加用户到 docker 组
sudo usermod -aG docker "$USER" 2>/dev/null || true

# 备份现有配置
log "备份现有配置..."
if [ -f "$PROJECT_DIR/.env" ]; then
  cp "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 备份数据库文件 (如果使用 SQLite)
if [ -d "$PROJECT_DIR/backend/database" ]; then
  cp -a "$PROJECT_DIR/backend/database" "$PROJECT_DIR/database.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
fi

# 创建 .env 文件 (如果不存在)
if [ ! -f "$PROJECT_DIR/.env" ]; then
  log "创建默认环境变量文件..."
  cat > "$PROJECT_DIR/.env" <<EOF
NODE_ENV=production
PORT=3000
DB_DIALECT=mysql
DB_HOST=82.156.83.99
DB_PORT=3306
DB_USER=shangyin
DB_PASS=shaoyansa
DB_NAME=shangyin
JWT_SECRET=shangyin_jwt_secret_$(date +%s)
EOF
  log "请编辑 $PROJECT_DIR/.env 文件配置正确的环境变量"
fi

# 停止并清理旧容器
log "停止旧容器..."
docker compose down || true

# 清理悬空镜像
log "清理悬空镜像..."
docker image prune -f || true

# 构建并启动服务
log "构建并启动服务..."
docker compose up -d --build

# 等待服务启动
log "等待服务启动..."
sleep 10

# 检查容器状态
log "容器状态:"
docker compose ps

# 显示日志
log "最近日志:"
docker compose logs --tail=20

# 清理旧备份 (保留最近 5 个)
log "清理旧备份..."
ls -t "$PROJECT_DIR"/.env.backup.* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
ls -t "$PROJECT_DIR"/database.backup.* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

log "=== 部署完成 ==="
log "管理后台地址：http://localhost:14444/shangyin/admin/"
log ""
log "常用命令:"
log "  查看状态：docker compose ps"
log "  查看日志：docker compose logs -f"
log "  停止服务：docker compose down"
log "  重启服务：docker compose restart"
