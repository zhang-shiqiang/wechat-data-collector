# 微信数据采集项目 - 服务器部署指南

本指南帮助你将项目部署到已有的腾讯云服务器上。

**前提条件**：服务器已安装 Node.js、MySQL、Nginx

## 目录

1. [上传项目代码](#1-上传项目代码)
2. [部署后端](#2-部署后端)
3. [部署前端](#3-部署前端)
4. [配置 Nginx](#4-配置-nginx)
5. [使用 PM2 管理后端进程](#5-使用-pm2-管理后端进程)
6. [后续更新部署](#6-后续更新部署)
7. [常见问题](#7-常见问题)

---

## 1. 上传项目代码

### 1.1 在服务器上创建目录

```bash
mkdir -p /var/www/wechat-collector
```

### 1.2 方式一：本地打包上传（推荐）

**在本地电脑执行：**

```bash
# 进入项目目录
cd /Users/shiqiang.zhang/AI/wechat-data-collector

# 打包代码（排除不需要的文件）
tar --exclude='node_modules' --exclude='.git' --exclude='logs' -czvf wechat-collector.tar.gz .

# 上传到服务器（替换成你的服务器IP）
scp wechat-collector.tar.gz root@你的服务器IP:/var/www/wechat-collector/
```

**在服务器上执行：**

```bash
cd /var/www/wechat-collector
tar -xzvf wechat-collector.tar.gz
rm wechat-collector.tar.gz
```

### 1.3 方式二：使用 Git（如果代码在 GitHub/Gitee）

```bash
cd /var/www/wechat-collector
git clone https://github.com/你的用户名/wechat-data-collector.git .
```

---

## 2. 部署后端

### 2.1 安装依赖

```bash
cd /var/www/wechat-collector/backend
npm install
```

### 2.2 修改数据库配置

编辑 `src/app.module.ts`，修改数据库连接信息：

```bash
vim src/app.module.ts
```

找到数据库配置部分，修改为你的数据库信息：

```typescript
TypeOrmModule.forRootAsync({
  imports: [],
  useFactory: async () => ({
    type: 'mysql',
    host: 'localhost',           // 如果数据库在本机就是 localhost
    port: 3306,
    username: '你的数据库用户名',
    password: '你的数据库密码',
    database: '你的数据库名',
    synchronize: true,
    entities: [User, Category, WechatAccount, Article],
    logging: false,
  }),
}),
```

### 2.3 修改 CORS 配置（允许跨域）

编辑 `src/main.ts`：

```bash
vim src/main.ts
```

修改 CORS 配置，添加你的服务器 IP 或域名：

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://你的服务器IP',
    'http://你的域名',       // 如果有域名
    'https://你的域名',      // 如果配置了 HTTPS
  ],
  credentials: true,
});
```

### 2.4 构建后端

```bash
npm run build
```

### 2.5 测试后端是否正常

```bash
npm run start:prod
```

看到 `🚀 服务器运行在 http://localhost:3000` 说明成功，按 `Ctrl+C` 停止。

---

## 3. 部署前端

### 3.1 安装依赖

```bash
cd /var/www/wechat-collector/frontend
npm install
```

### 3.2 构建前端

```bash
npm run build
```

构建完成后，静态文件在 `dist` 目录中。

### 3.3 验证构建结果

```bash
ls dist/
# 应该看到 index.html, assets/ 等文件
```

---

## 4. 配置 Nginx

### 4.1 创建 Nginx 配置文件

```bash
vim /etc/nginx/sites-available/wechat-collector
```

**复制以下内容（记得替换 `你的服务器IP或域名`）：**

```nginx
server {
    listen 80;
    server_name 你的服务器IP或域名;

    # 前端静态文件目录
    root /var/www/wechat-collector/frontend/dist;
    index index.html;

    # 日志
    access_log /var/log/nginx/wechat-collector.access.log;
    error_log /var/log/nginx/wechat-collector.error.log;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    # 前端路由（React SPA 必须）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300;
    }

    # 上传文件访问
    location /uploads {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### 4.2 启用配置

```bash
# 创建软链接启用站点
ln -s /etc/nginx/sites-available/wechat-collector /etc/nginx/sites-enabled/

# 删除默认站点（可选）
rm -f /etc/nginx/sites-enabled/default

# 测试配置是否正确
nginx -t

# 重新加载 Nginx
systemctl reload nginx
```

---

## 5. 使用 PM2 管理后端进程

PM2 可以让后端在后台运行，并且崩溃后自动重启。

### 5.1 安装 PM2（如果没装）

```bash
npm install -g pm2
```

### 5.2 创建 PM2 配置文件

```bash
cd /var/www/wechat-collector
vim ecosystem.config.js
```

**复制以下内容：**

```javascript
module.exports = {
  apps: [
    {
      name: 'wechat-backend',
      cwd: '/var/www/wechat-collector/backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

### 5.3 启动后端服务

```bash
pm2 start ecosystem.config.js
```

### 5.4 设置开机自启

```bash
pm2 startup
pm2 save
```

### 5.5 常用命令

```bash
pm2 status              # 查看状态
pm2 logs wechat-backend # 查看日志
pm2 restart wechat-backend  # 重启
pm2 stop wechat-backend     # 停止
```

---

## 6. 后续更新部署

每次更新代码后，执行以下步骤：

### 6.1 上传新代码

在本地打包上传，或在服务器上 `git pull`。

### 6.2 重新部署

```bash
cd /var/www/wechat-collector

# 更新后端
cd backend
npm install
npm run build
pm2 restart wechat-backend

# 更新前端
cd ../frontend
npm install
npm run build

# 完成！
```

### 6.3 一键更新脚本（可选）

创建 `deploy.sh`：

```bash
vim /var/www/wechat-collector/deploy.sh
```

```bash
#!/bin/bash
set -e
cd /var/www/wechat-collector

echo "📦 更新后端..."
cd backend && npm install && npm run build

echo "📦 更新前端..."
cd ../frontend && npm install && npm run build

echo "🔄 重启后端..."
pm2 restart wechat-backend

echo "✅ 部署完成！"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 7. 常见问题

### 7.1 502 Bad Gateway

后端没运行或端口不对：

```bash
pm2 status                    # 检查后端状态
pm2 logs wechat-backend       # 查看后端日志
netstat -tlnp | grep 3000     # 检查端口
```

### 7.2 页面空白或路由404

Nginx 没有配置 SPA 路由，确保有这行：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 7.3 API 请求失败

1. 检查后端是否运行：`pm2 status`
2. 检查 Nginx 代理配置是否正确
3. 检查浏览器控制台的错误信息

### 7.4 数据库连接失败

```bash
# 测试数据库连接
mysql -u 用户名 -p

# 检查 app.module.ts 中的配置是否正确
```

### 7.5 查看日志

```bash
# 后端日志
pm2 logs wechat-backend

# Nginx 日志
tail -f /var/log/nginx/wechat-collector.error.log
```

### 7.6 重启所有服务

```bash
pm2 restart wechat-backend
systemctl reload nginx
```

---

## 部署检查清单

- [ ] 代码已上传到服务器
- [ ] 后端 `npm install` 完成
- [ ] 后端数据库配置已修改
- [ ] 后端 `npm run build` 完成
- [ ] 前端 `npm install` 完成
- [ ] 前端 `npm run build` 完成
- [ ] Nginx 配置已创建并启用
- [ ] PM2 已启动后端服务
- [ ] 浏览器访问正常

---

## 快速命令参考

```bash
# 部署目录
cd /var/www/wechat-collector

# 后端操作
cd backend && npm install && npm run build
pm2 start ecosystem.config.js
pm2 restart wechat-backend
pm2 logs wechat-backend

# 前端操作  
cd frontend && npm install && npm run build

# Nginx 操作
nginx -t                    # 测试配置
systemctl reload nginx      # 重新加载
systemctl restart nginx     # 重启
```
