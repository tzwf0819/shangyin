@echo off
REM 本地测试脚本 - 测试后端服务是否正常

echo ==========================================
echo       上茚项目本地测试脚本
echo ==========================================
echo.

cd /d %~dp0backend

echo 1. 检查 Node.js 版本...
node -v
echo.

echo 2. 检查 app.js 语法...
node -c app.js
if errorlevel 1 (
    echo ❌ app.js 语法错误
    exit /b 1
)
echo ✅ app.js 语法正确
echo.

echo 3. 检查路由文件...
node -c routes/permissions.js
if errorlevel 1 (
    echo ❌ permissions.js 语法错误
    exit /b 1
)
echo ✅ permissions.js 语法正确
echo.

echo 4. 检查控制器...
node -c controllers/permissionController.js
if errorlevel 1 (
    echo ❌ permissionController.js 语法错误
    exit /b 1
)
echo ✅ permissionController.js 语法正确
echo.

echo 5. 检查 package.json...
if not exist package.json (
    echo ❌ package.json 不存在
    exit /b 1
)
echo ✅ package.json 存在
echo.

echo 6. 检查 node_modules...
if not exist node_modules (
    echo ⚠️  node_modules 不存在，需要运行 npm install
    echo.
    echo 是否现在运行 npm install? (Y/N)
    set /p install="输入 Y 安装依赖："
    if /i "%install%"=="Y" (
        echo 安装依赖...
        call npm install
    )
) else (
    echo ✅ node_modules 存在
)
echo.

echo 7. 检查 .env 文件...
if not exist .env (
    echo ⚠️  .env 文件不存在
    echo 提示：复制 .env.example 为 .env 并修改配置
) else (
    echo ✅ .env 文件存在
)
echo.

echo ==========================================
echo 测试完成！
echo ==========================================
echo.
echo 启动服务：npm start
echo 测试 API: node test-new-features.js
echo.
