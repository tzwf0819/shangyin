# CICD 部署和数据保护指南

## 问题背景

之前CICD部署导致数据丢失的主要原因是：
1. 部署脚本缺少数据库备份机制
2. 数据库文件路径配置错误
3. 缺少数据保护措施

## 解决方案

已创建以下脚本解决数据丢失问题：

### 1. 改进的部署脚本 (`deploy_server.sh`)

**主要改进：**
- ✅ 自动备份数据库
- ✅ 检查数据库文件完整性
- ✅ 设置正确的环境变量
- ✅ 验证数据库连接
- ✅ 自动清理旧备份

**使用方法：**
```bash
cd shangyin-backend/scripts
./deploy_server.sh
```

### 2. 数据库备份脚本 (`database_backup.sh`)

**功能：**
- 手动备份数据库
- 列出备份文件
- 清理旧备份

**使用方法：**
```bash
# 备份数据库
./database_backup.sh

# 列出备份
./database_backup.sh list

# 清理旧备份
./database_backup.sh clean
```

### 3. 数据库恢复脚本 (`database_restore.sh`)

**功能：**
- 交互式选择备份恢复
- 自动停止服务
- 备份当前状态

**使用方法：**
```bash
# 交互式恢复
./database_restore.sh

# 指定备份文件恢复
./database_restore.sh /path/to/backup.tar.gz
```

## CICD 最佳实践

### 部署前准备
1. **手动备份**：在CICD触发前运行备份脚本
```bash
./database_backup.sh
```

2. **验证备份**：确认备份文件存在
```bash
./database_backup.sh list
```

### 部署流程
1. **自动备份**：部署脚本会自动备份当前数据库
2. **安全检查**：脚本会验证数据库文件完整性
3. **服务重启**：安全地重启服务

### 部署后验证
1. **检查服务状态**
```bash
ps aux | grep node
```

2. **验证数据库连接**
```bash
curl http://localhost:3000/api/health
```

## 数据保护策略

### 备份策略
- **自动备份**：每次部署前自动备份
- **保留策略**：保留最近10个备份文件
- **备份位置**：`database_backups/` 目录

### 恢复策略
- **快速恢复**：使用恢复脚本一键恢复
- **时间点恢复**：可选择特定时间点的备份
- **安全恢复**：恢复前会自动备份当前状态

## 故障排除

### 数据丢失应急处理
1. **立即停止部署**
2. **使用恢复脚本**
```bash
./database_restore.sh
```
3. **选择最近的备份文件恢复**

### 常见问题
1. **部署后数据丢失**：使用恢复脚本恢复
2. **数据库连接失败**：检查数据库文件路径
3. **备份文件不存在**：检查备份目录权限

## 环境配置

确保以下环境变量正确设置：
```bash
export NODE_ENV=production
export DB_STORAGE=./database/shangyin.db
```

## 监控和日志

- 部署日志：`server.log`
- 备份日志：控制台输出
- 错误日志：检查系统日志

通过以上措施，可以有效防止CICD部署导致的数据丢失问题。