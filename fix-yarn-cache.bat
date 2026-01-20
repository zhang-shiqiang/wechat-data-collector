@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
echo ========================================
echo 修复 Yarn 缓存权限问题
echo ========================================
echo.

REM 检查是否有 yarn
where yarn >nul 2>&1
if %errorlevel% equ 0 (
    echo [信息] 检测到 Yarn，正在清理缓存...
    call yarn cache clean >nul 2>&1
    if !errorlevel! equ 0 (
        echo [成功] Yarn 缓存已清理
    ) else (
        echo [警告] Yarn 缓存清理失败，尝试手动删除
    )
) else (
    echo [信息] 未检测到 Yarn
)

REM 尝试删除有问题的缓存文件
set cache_path=%LOCALAPPDATA%\Yarn\Cache
if exist "%cache_path%" (
    echo [信息] 正在清理 Yarn 缓存目录...
    rd /s /q "%cache_path%" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [成功] Yarn 缓存目录已删除
    ) else (
        echo [警告] 无法删除缓存目录，可能需要管理员权限
        echo [提示] 请以管理员身份运行此脚本，或手动删除: %cache_path%
    )
)

echo.
echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 现在可以重新运行 start.bat
echo.
pause
