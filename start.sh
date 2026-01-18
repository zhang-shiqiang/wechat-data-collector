#!/bin/bash

# 微信公众号管理阅读器 - 启动脚本

echo "🚀 启动微信公众号管理阅读器..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未检测到 npm，请先安装 npm"
    exit 1
fi

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：检查并安装依赖
check_dependencies() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}📦 $name 依赖未安装，正在安装...${NC}"
        cd "$dir" || exit 1
        npm install
        cd - || exit 1
        echo -e "${GREEN}✅ $name 依赖安装完成${NC}"
    fi
}

# 检查后端依赖
check_dependencies "backend" "后端"

# 检查前端依赖
check_dependencies "frontend" "前端"

# 创建日志目录
mkdir -p logs

# 启动后端
echo -e "${BLUE}🔧 启动后端服务...${NC}"
cd backend || exit 1
npm run start:dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
echo -e "   后端地址: http://localhost:3000"
echo -e "   日志文件: logs/backend.log"

# 等待后端启动
sleep 3

# 启动前端
echo -e "${BLUE}🎨 启动前端服务...${NC}"
cd ../frontend || exit 1
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
echo -e "   前端地址: http://localhost:5173"
echo -e "   日志文件: logs/frontend.log"

cd ..

# 保存 PID 到文件
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ 所有服务已启动成功！${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "📱 前端地址: ${BLUE}http://localhost:5173${NC}"
echo -e "🔧 后端地址: ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "📝 查看日志:"
echo -e "   后端日志: ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "   前端日志: ${YELLOW}tail -f logs/frontend.log${NC}"
echo ""
echo -e "🛑 停止服务: ${YELLOW}./stop.sh${NC} 或按 Ctrl+C"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f logs/*.pid; echo '✅ 服务已停止'; exit" INT TERM

# 保持脚本运行
wait

