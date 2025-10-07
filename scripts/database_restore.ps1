# PowerShell 数据库恢复脚本
param(
    [string]$BackupFile = $null
)

Write-Host "=== 数据库恢复脚本（PowerShell版） ===" -ForegroundColor Green

# 设置变量
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$DatabaseDir = Join-Path $BackendDir "database"
$BackupDir = Join-Path $ProjectDir "database_backups"

Write-Host "项目目录: $ProjectDir"
Write-Host "数据库目录: $DatabaseDir"
Write-Host "备份目录: $BackupDir"

# 检查备份目录
if (-not (Test-Path $BackupDir)) {
    Write-Host "❌ 备份目录不存在: $BackupDir" -ForegroundColor Red
    exit 1
}

# 列出可用备份函数
function List-Backups {
    Write-Host "可用备份文件:" -ForegroundColor Cyan
    $BackupFiles = Get-ChildItem "$BackupDir\*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    
    if (-not $BackupFiles) {
        Write-Host "❌ 无可用备份文件" -ForegroundColor Red
        exit 1
    }
    
    for ($i = 0; $i -lt $BackupFiles.Count; $i++) {
        Write-Host "$($i+1)). $($BackupFiles[$i].Name) - $($BackupFiles[$i].LastWriteTime)" -ForegroundColor White
    }
    
    return $BackupFiles
}

# 恢复数据库函数
function Restore-Database {
    param($SelectedBackup)
    
    if (-not (Test-Path $SelectedBackup)) {
        Write-Host "❌ 备份文件不存在: $SelectedBackup" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "开始恢复数据库..." -ForegroundColor Yellow
    Write-Host "备份文件: $SelectedBackup" -ForegroundColor Cyan
    Write-Host "目标目录: $DatabaseDir" -ForegroundColor Cyan
    
    # 停止可能正在运行的服务
    Write-Host "停止服务..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "app\.js" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
    
    # 备份当前数据库（如果存在）
    if (Test-Path $DatabaseDir) {
        $CurrentBackup = Join-Path $BackupDir "current_before_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
        Write-Host "备份当前数据库..." -ForegroundColor Yellow
        Compress-Archive -Path "$DatabaseDir\*" -DestinationPath $CurrentBackup -Force -ErrorAction SilentlyContinue
        if ($?) {
            Write-Host "✅ 当前数据库已备份: $CurrentBackup" -ForegroundColor Green
        }
    }
    
    # 清空数据库目录
    Write-Host "清空数据库目录..." -ForegroundColor Yellow
    if (Test-Path $DatabaseDir) {
        Remove-Item "$DatabaseDir\*" -Force -ErrorAction SilentlyContinue
    } else {
        New-Item -ItemType Directory -Path $DatabaseDir -Force | Out-Null
    }
    
    # 恢复备份
    Write-Host "恢复备份..." -ForegroundColor Yellow
    Expand-Archive -Path $SelectedBackup -DestinationPath $DatabaseDir -Force
    
    if ($?) {
        Write-Host "✅ 数据库恢复成功" -ForegroundColor Green
        Write-Host "恢复的文件:" -ForegroundColor Cyan
        Get-ChildItem "$DatabaseDir\*.db*" -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "  $($_.Name) - $([math]::Round($_.Length/1KB, 2)) KB" -ForegroundColor White
        }
    } else {
        Write-Host "❌ 数据库恢复失败" -ForegroundColor Red
        exit 1
    }
}

# 交互式恢复函数
function Interactive-Restore {
    $BackupFiles = List-Backups
    
    Write-Host "请选择要恢复的备份:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $BackupFiles.Count; $i++) {
        Write-Host "$($i+1)). $($BackupFiles[$i].Name)" -ForegroundColor White
    }
    
    do {
        $Choice = Read-Host "请输入编号 (1-$($BackupFiles.Count))"
    } while (-not ($Choice -match "^\d+$" -and [int]$Choice -ge 1 -and [int]$Choice -le $BackupFiles.Count))
    
    $SelectedBackup = $BackupFiles[[int]$Choice - 1].FullName
    Restore-Database -SelectedBackup $SelectedBackup
}

# 主函数
if ($BackupFile) {
    if (Test-Path $BackupFile) {
        Restore-Database -SelectedBackup $BackupFile
    } else {
        Write-Host "❌ 指定的备份文件不存在: $BackupFile" -ForegroundColor Red
        exit 1
    }
} else {
    Interactive-Restore
}