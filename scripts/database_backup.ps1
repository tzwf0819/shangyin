# PowerShell 数据库备份脚本
param(
    [switch]$List = $false,
    [switch]$Clean = $false
)

Write-Host "=== Database Backup Script (PowerShell Version) ===" -ForegroundColor Green

# 设置变量
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$DatabaseDir = Join-Path $BackendDir "database"
$BackupDir = Join-Path $ProjectDir "database_backups"

Write-Host "项目目录: $ProjectDir"
Write-Host "数据库目录: $DatabaseDir"
Write-Host "备份目录: $BackupDir"

# 创建备份目录
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# 备份数据库函数
function Backup-Database {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = Join-Path $BackupDir "database_backup_$Timestamp.zip"
    
    Write-Host "Starting database backup..." -ForegroundColor Yellow
    
    if (Test-Path $DatabaseDir) {
        # 检查数据库文件
        Write-Host "Database file status:" -ForegroundColor Cyan
        $DbFiles = Get-ChildItem "$DatabaseDir\*.db*" -ErrorAction SilentlyContinue
        if ($DbFiles) {
            $DbFiles | ForEach-Object {
                Write-Host "  $($_.Name) - $([math]::Round($_.Length/1KB, 2)) KB"
            }
        } else {
            Write-Host "  暂无数据库文件" -ForegroundColor Yellow
        }
        
        # 备份所有数据库文件
        Compress-Archive -Path "$DatabaseDir\*" -DestinationPath $BackupFile -Force
        
        if ($?) {
            Write-Host "✅ 数据库备份成功: $BackupFile" -ForegroundColor Green
            $FileSize = (Get-Item $BackupFile).Length / 1MB
            Write-Host "备份文件大小: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Cyan
        } else {
            Write-Host "❌ 数据库备份失败" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ 数据库目录不存在: $DatabaseDir" -ForegroundColor Red
        exit 1
    }
}

# 列出备份文件函数
function List-Backups {
    Write-Host "当前备份文件:" -ForegroundColor Cyan
    $BackupFiles = Get-ChildItem "$BackupDir\*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    
    if ($BackupFiles) {
        $BackupFiles | ForEach-Object {
            Write-Host "  $($_.Name) - $($_.LastWriteTime) - $([math]::Round($_.Length/1MB, 2)) MB" -ForegroundColor White
        }
    } else {
        Write-Host "  暂无备份文件" -ForegroundColor Yellow
    }
}

# 清理旧备份函数
function Clean-OldBackups {
    Write-Host "清理旧备份文件（保留最近10个）..." -ForegroundColor Yellow
    $BackupFiles = Get-ChildItem "$BackupDir\*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    
    if ($BackupFiles.Count -gt 10) {
        $FilesToDelete = $BackupFiles | Select-Object -Skip 10
        $FilesToDelete | ForEach-Object {
            Write-Host "  删除: $($_.Name)" -ForegroundColor Yellow
            Remove-Item $_.FullName -Force
        }
        Write-Host "✅ 备份清理完成" -ForegroundColor Green
    } else {
        Write-Host "  无需清理，当前备份数量: $($BackupFiles.Count)" -ForegroundColor Cyan
    }
}

# 主函数
if ($List) {
    List-Backups
} elseif ($Clean) {
    Clean-OldBackups
} else {
    Backup-Database
    List-Backups
    Clean-OldBackups
}