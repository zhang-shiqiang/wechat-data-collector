# 微信公众号管理阅读器

一个专业的微信公众号管理和阅读工具，支持多维度数据获取、分类管理和统一阅读。

## 项目结构

```
wechat-data-collector/
├── backend/          # NestJS 后端
├── frontend/         # React 前端
├── logs/            # 日志文件（自动创建）
├── start.sh         # 启动脚本（macOS/Linux）
├── stop.sh          # 停止脚本（macOS/Linux）
├── start.bat         # 启动脚本（Windows）
├── stop.bat          # 停止脚本（Windows）
├── package.json      # 根目录 npm 脚本
├── plan.md          # 项目需求文档
└── README.md        # 项目说明文档
```

## 技术栈

### 后端
- NestJS 10
- TypeORM
- MySQL
- TypeScript

### 前端
- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand (状态管理)
- React Router

## 快速开始

### 方式一：使用启动脚本（推荐）

#### macOS / Linux

```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh
```

#### Windows

```cmd
# 启动所有服务
start.bat

# 停止所有服务
stop.bat
```

启动脚本会自动：
- 检查 Node.js 和 npm 是否安装
- 检查并安装依赖（如果未安装）
- 同时启动前后端服务
- 显示服务地址和日志文件位置

### 方式二：手动启动

#### 后端

```bash
cd backend
npm install
npm run start:dev
```

后端服务运行在 `http://localhost:3000`

#### 前端

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 `http://localhost:5173`

### 使用 npm 脚本（根目录）

```bash
# 安装所有依赖
npm run install:all

# 启动后端
npm run start:backend

# 启动前端
npm run start:frontend

# 构建所有项目
npm run build:all
```

## 数据库配置

数据库连接配置在 `backend/src/app.module.ts` 中：

```typescript
TypeOrmModule.forRootAsync({
  type: 'mysql',
  host: '81.69.47.226',
  port: 3306,
  username: 'root',
  password: '!Aa123456',
  database: 'testdb',
  synchronize: true,
})
```

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

## 功能特性

- ✅ 用户注册/登录
- ✅ 专业的UI界面
- ✅ 响应式布局
- 🔄 公众号管理（开发中）
- 🔄 文章抓取（开发中）
- 🔄 多维度数据获取（开发中）

## 开发计划

详细开发计划请查看 [plan.md](./plan.md)

