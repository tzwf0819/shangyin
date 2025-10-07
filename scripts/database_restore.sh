#!/bin/bash
set -euo pipefail

echo "=== 数据库恢复脚本 ==="

# 设置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
DATABASE_DIR="$BACKEND_DIR/database"
BACKUP_DIR="$PROJECT_DIR/database_backups"

echo "项目目录: $PROJECT_DIR"
echo "数据库目录: $DATABASE_DIR"
echo "备份目录: $BACKUP_DIR"

# 检查备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ 备份目录不存在: $BACKUP_DIR"
    exit 1
fi

# 列出可用备份
list_backups() {
    echo "可用备份文件:"
    local backups=($(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "❌ 无可用备份文件"
        exit 1
    fi
    
    for i in "${!backups[@]}"; do
        echo "$((i+1))). ${backups[$i]} ($(stat -c %y "${backups[$i]}" 2>/dev/null || echo "未知时间"))"
    done
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ 备份文件不存在: $backup_file"
        exit 1
    fi
    
    echo "开始恢复数据库..."
    echo "备份文件: $backup_file"
    echo "目标目录: $DATABASE_DIR"
    
    # 停止可能正在运行的服务
    echo "停止服务..."
    sudo pkill -f "node.*app.js" || true
    sleep 2
    
    # 备份当前数据库（如果存在）
    if [ -d "$DATABASE_DIR" ]; then
        local current_backup="$BACKUP_DIR/current_before_restore_$(date +%Y%m%d_%H%M%S).tar.gz"
        echo "备份当前数据库..."
        tar -czf "$current_backup" -C "$DATABASE_DIR" . 2>/dev/null || true
    fi
    
    # 清空数据库目录
    echo "清空数据库目录..."
    rm -rf "$DATABASE_DIR"/* 2>/dev/null || true
    
    # 恢复备份
    echo "恢复备份..."
    mkdir -p "$DATABASE_DIR"
    tar -xzf "$backup_file" -C "$DATABASE_DIR"
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据库恢复成功"
        echo "恢复的文件:"
        ls -la "$DATABASE_DIR"/*.db* 2>/dev/null || echo "无数据库文件"
    else
        echo "❌ 数据库恢复失败"
        exit 1
    fi
}

# 交互式恢复
interactive_restore() {
    local backups=($(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "❌ 无可用备份文件"
        exit 1
    fi
    
    echo "请选择要恢复的备份:"
    for i in "${!backups[@]}"; do
        echo "$((i+1))). ${backups[$i]}"
    done
    
    read -p "请输入编号 (1-${#backups[@]}): " choice
    
    if [[ ! "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt ${#backups[@]} ]; then
        echo "❌ 无效选择"
        exit 1
    fi
    
    local selected_backup="${backups[$((choice-1))]}"
    restore_database "$selected_backup"
}

# 主函数
main() {
    case "${1:-}" in
        "list")
            list_backups
            ;;
        *)
            if [ -n "${1:-}" ] && [ -f "$1" ]; then
                restore_database "$1"
            else
                interactive_restore
            fi
            ;;
    esac
}

main "$@"