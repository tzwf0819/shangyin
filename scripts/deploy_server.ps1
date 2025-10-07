# PowerShell 版本的部署脚本
param(
    [switch]$DryRun = $false
)

Write-Host "=== 开始部署商印后端服务（PowerShell版） ===" -ForegroundColor Green

# 设置变量
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$AdminDir = Join-Path $ProjectDir "admin"
$DatabaseDir = Join-Path $BackendDir "database"
$BackupDir = Join-Path $ProjectDir "database_backups"

Write-Host "脚本目录: $ScriptDir"
Write-Host "项目目录: $ProjectDir"
Write-Host "后端目录: $BackendDir"
Write-Host "管理端目录: $AdminDir"
Write-Host "数据库目录: $DatabaseDir"
Write-Host "备份目录: $BackupDir"

# 检查目录是否存在
if (-not (Test-Path $BackendDir)) {
    Write-Host "错误: 后端目录不存在: $BackendDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $AdminDir)) {
    Write-Host "错误: 管理端目录不存在: $AdminDir" -ForegroundColor Red
    exit 1
}

# 创建备份目录
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# 数据库备份函数
function Backup-Database {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = Join-Path $BackupDir "database_backup_$Timestamp.zip"
    
    Write-Host "备份数据库文件..." -ForegroundColor Yellow
    
    if (Test-Path $DatabaseDir) {
        # 备份所有数据库文件
        Compress-Archive -Path "$DatabaseDir\*" -DestinationPath $BackupFile -Force
        
        if ($?) {
            Write-Host "✅ 数据库已备份到: $BackupFile" -ForegroundColor Green
            $FileSize = (Get-Item $BackupFile).Length / 1MB
            Write-Host "备份文件大小: $([math]::Round($FileSize, 2)) MB"
        } else {
            Write-Host "❌ 数据库备份失败" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "警告: 数据库目录不存在，跳过备份" -ForegroundColor Yellow
    }
}

if ($DryRun) {
    Write-Host "=== 干运行模式 - 只检查不执行 ===" -ForegroundColor Cyan
    Write-Host "将执行以下操作:"
    Write-Host "1. 备份数据库"
    Write-Host "2. 检查数据库完整性"
    Write-Host "3. 安装依赖"
    Write-Host "4. 构建管理端"
    Write-Host "5. 启动服务"
    exit 0
}

# 停止可能正在运行的服务
Write-Host "停止可能正在运行的服务..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "app\.js" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 3

# 备份数据库
Backup-Database

# 检查数据库文件完整性
Write-Host "检查数据库文件完整性..." -ForegroundColor Yellow
if (Test-Path $DatabaseDir) {
    Write-Host "数据库文件状态:" -ForegroundColor Cyan
    Get-ChildItem "$DatabaseDir\*.db*" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  $($_.Name) - $([math]::Round($_.Length/1KB, 2)) KB"
    }
    
    # 确保数据库文件存在
    if (-not (Test-Path "$DatabaseDir\shangyin.db")) {
        Write-Host "警告: 主数据库文件不存在，检查备份..." -ForegroundColor Yellow
        $LatestBackup = Get-ChildItem "$BackupDir\*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($LatestBackup) {
            Write-Host "从备份恢复数据库: $($LatestBackup.Name)" -ForegroundColor Green
            Expand-Archive -Path $LatestBackup.FullName -DestinationPath $DatabaseDir -Force
            Write-Host "数据库恢复完成" -ForegroundColor Green
        } else {
            Write-Host "警告: 无可用备份，将创建新数据库" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "创建数据库目录..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DatabaseDir -Force | Out-Null
}

# 安装后端依赖
Write-Host "安装后端依赖..." -ForegroundColor Yellow
Set-Location $BackendDir
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}

# 安装管理端依赖
Write-Host "安装管理端依赖..." -ForegroundColor Yellow
Set-Location $AdminDir
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}

# 构建管理端
Write-Host "构建管理端..." -ForegroundColor Yellow
npm run build

# 启动后端服务
Write-Host "启动后端服务..." -ForegroundColor Yellow
Set-Location $BackendDir

# 设置环境变量
$env:NODE_ENV = "production"
$env:DB_STORAGE = "$DatabaseDir\shangyin.db"

# 启动服务
$Process = Start-Process -FilePath "node" -ArgumentList "app.js" -PassThru -NoNewWindow

Write-Host "后端服务已启动，PID: $($Process.Id)" -ForegroundColor Green

# 等待服务启动
Write-Host "等待服务启动..." -ForegroundColor Yellow
Start-Sleep 10

# 检查服务是否正常运行
if (Get-Process -Id $Process.Id -ErrorAction SilentlyContinue) {
    Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
    
    # 验证数据库连接
    Write-Host "验证数据库连接..." -ForegroundColor Yellow
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 10
        Write-Host "✅ 数据库连接正常" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 数据库连接可能有问题: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "=== 部署完成 ===" -ForegroundColor Green
Write-Host "后端服务运行在PID: $($Process.Id)" -ForegroundColor Cyan
Write-Host "管理端静态文件已构建完成" -ForegroundColor Cyan
Write-Host "数据库备份位置: $BackupDir" -ForegroundColor Cyan

# 清理旧备份（保留最近5个）
Write-Host "清理旧备份文件..." -ForegroundColor Yellow
$BackupFiles = Get-ChildItem "$BackupDir\*.zip" | Sort-Object LastWriteTime -Descending
if ($BackupFiles.Count -gt 5) {
    $BackupFiles | Select-Object -Skip 5 | Remove-Item -Force
    Write-Host "备份清理完成" -ForegroundColor Green
}