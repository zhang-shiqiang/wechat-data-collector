@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
echo ========================================
echo 正在停止服务...
echo ========================================

REM 停止 Node.js 进程（通过端口）
set stopped=0

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [成功] 后端服务已停止
        set stopped=1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [成功] 前端服务已停止
        set stopped=1
    )
)

if %stopped% equ 0 (
    echo [信息] 未检测到运行中的服务
) else (
    echo [成功] 所有服务已停止
)

echo.
pause
