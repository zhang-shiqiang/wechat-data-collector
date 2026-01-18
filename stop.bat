@echo off
chcp 65001 >nul
echo 🛑 正在停止服务...

REM 停止 Node.js 进程（通过端口）
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo ✅ 后端服务已停止
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo ✅ 前端服务已停止
)

REM 备用方案：杀死所有 node 进程（谨慎使用）
REM taskkill /F /IM node.exe >nul 2>&1

echo ✨ 所有服务已停止
pause

