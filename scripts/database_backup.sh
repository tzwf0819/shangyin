#!/bin/bash
set -euo pipefail

echo "=== 数据库备份脚本 ==="

# 设置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
DATABASE_DIR="$BACKEND_DIR/database"
BACKUP_DIR="$PROJECT_DIR/database_backups"

echo "项目目录: $PROJECT_DIR"
echo "数据库目录: $DATABASE_DIR"
echo "备份目录: $BACKUP_DIR"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份数据库
backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/database_backup_$timestamp.tar.gz"
    
    echo "开始备份数据库..."
    
    if [ -d "$DATABASE_DIR" ]; then
        # 检查数据库文件
        echo "数据库文件状态:"
        ls -la "$DATABASE_DIR"/*.db* 2>/dev/null || echo "暂无数据库文件"
        
        # 备份所有数据库文件
        tar -czf "$backup_file" -C "$DATABASE_DIR" .
        
        if [ $? -eq 0 ]; then
            echo "✅ 数据库备份成功: $backup_file"
            echo "备份文件大小: $(du -h "$backup_file" | cut -f1)"
        else
            echo "❌ 数据库备份失败"
            exit 1
        fi
    else
        echo "❌ 数据库目录不存在: $DATABASE_DIR"
        exit 1
    fi
}

# 列出备份文件
list_backups() {
    echo "当前备份文件:"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "暂无备份文件"
}

# 清理旧备份
clean_old_backups() {
    echo "清理旧备份文件（保留最近10个）..."
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    echo "备份清理完成"
}

# 主函数
main() {
    case "${1:-}" in
        "list")
            list_backups
            ;;
        "clean")
            clean_old_backups
            ;;
        *)
            backup_database
            list_backups
            clean_old_backups
            ;;
    esac
}

main "$@"