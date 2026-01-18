@echo off
chcp 65001 >nul
echo 🚀 启动微信公众号管理阅读器...

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查 npm 是否安装
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 npm，请先安装 npm
    pause
    exit /b 1
)

REM 检查并安装后端依赖
if not exist "backend\node_modules" (
    echo 📦 后端依赖未安装，正在安装...
    cd backend
    call npm install
    cd ..
    echo ✅ 后端依赖安装完成
)

REM 检查并安装前端依赖
if not exist "frontend\node_modules" (
    echo 📦 前端依赖未安装，正在安装...
    cd frontend
    call npm install
    cd ..
    echo ✅ 前端依赖安装完成
)

REM 创建日志目录
if not exist "logs" mkdir logs

REM 启动后端
echo 🔧 启动后端服务...
start "后端服务" cmd /k "cd backend && npm run start:dev"
timeout /t 3 /nobreak >nul

REM 启动前端
echo 🎨 启动前端服务...
start "前端服务" cmd /k "cd frontend && npm run dev"

echo.
echo ════════════════════════════════════════
echo ✨ 所有服务已启动成功！
echo ════════════════════════════════════════
echo.
echo 📱 前端地址: http://localhost:5173
echo 🔧 后端地址: http://localhost:3000
echo.
echo 🛑 关闭此窗口或使用 stop.bat 停止服务
echo.

pause

