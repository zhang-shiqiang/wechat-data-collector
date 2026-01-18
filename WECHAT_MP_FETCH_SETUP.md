# 微信公众号平台API抓取配置说明

## 功能说明

根据文章 [python之抓取微信公众号文章系列2](https://cloud.tencent.com/developer/article/1406410) 的思路，实现了使用微信公众号平台内部API来抓取文章的功能。

**优势**：
- 可以获取公众号的所有历史文章（不受10篇限制）
- 数据更准确，直接从微信平台获取
- 支持翻页获取更多文章

**限制**：
- 需要登录微信公众号平台
- 需要配置cookies（需要定期更新）
- 只能获取已登录账号有权限查看的公众号文章

## 配置步骤

### 1. 登录微信公众号平台

访问：https://mp.weixin.qq.com/

1. 使用你的微信公众号账号登录
2. 登录成功后，保持浏览器打开状态

### 2. 获取Cookies

#### 方法一：使用浏览器开发者工具

1. 在微信公众号平台页面，按 `F12` 打开开发者工具
2. 切换到 `Network`（网络）标签
3. 刷新页面或进行任何操作
4. 在请求列表中找到任意一个请求
5. 查看请求头（Headers）中的 `Cookie` 字段
6. 复制完整的 Cookie 值

#### 方法二：使用浏览器插件

可以使用浏览器插件（如 EditThisCookie）来导出cookies。

### 3. 配置环境变量

在 `backend` 目录下的 `.env` 文件中添加：

```env
# 微信公众号平台Cookies（用于抓取文章）
# 格式：完整的Cookie字符串，例如：token=123456; sessionid=abc123; ...
WECHAT_MP_COOKIES=你的完整Cookie字符串
```

**示例**：
```env
WECHAT_MP_COOKIES=token=1234567890; sessionid=abcdef123456; wxuin=1234567890; pass_ticket=xxx; ...
```

### 4. 重启后端服务

配置完成后，重启后端服务使配置生效：

```bash
cd backend
npm run start:dev
```

## 使用方式

配置完成后，系统会自动优先使用微信公众号平台API来抓取文章：

1. 如果配置了 `WECHAT_MP_COOKIES`，系统会优先尝试使用微信公众号平台API
2. 如果API调用失败，会自动回退到搜狗微信搜索方式
3. 如果没有配置cookies，直接使用搜狗微信搜索方式

## 工作原理

根据文章描述，实现流程如下：

1. **搜索公众号**：调用 `https://mp.weixin.qq.com/cgi-bin/searchbiz` 接口，通过公众号名称搜索，获取 `fakeid`
2. **获取文章列表**：调用 `https://mp.weixin.qq.com/cgi-bin/appmsg` 接口，使用 `fakeid` 获取文章列表
3. **翻页获取**：支持翻页获取更多文章（最多100篇）

## 注意事项

1. **Cookies有效期**：
   - Cookies会过期，需要定期更新
   - 建议每周更新一次cookies
   - 如果抓取失败，检查cookies是否过期

2. **请求频率**：
   - 系统已添加延迟机制，避免请求过快
   - 如果遇到频率限制，可以增加延迟时间

3. **权限限制**：
   - 只能获取已登录账号有权限查看的公众号文章
   - 对于其他公众号，系统会自动回退到搜狗搜索方式

4. **安全性**：
   - Cookies包含登录凭证，不要提交到代码仓库
   - 建议使用环境变量或密钥管理服务
   - 定期更换cookies

## 故障排查

### 问题1：抓取失败，提示"未找到公众号"

**原因**：可能是cookies过期或无效

**解决方法**：
1. 重新登录微信公众号平台
2. 重新获取cookies
3. 更新 `.env` 文件中的 `WECHAT_MP_COOKIES`
4. 重启后端服务

### 问题2：抓取失败，提示"无法获取公众号fakeid"

**原因**：搜索接口返回异常

**解决方法**：
1. 检查cookies是否有效
2. 检查网络连接
3. 查看后端日志获取详细错误信息

### 问题3：只能获取少量文章

**原因**：可能是翻页逻辑问题或接口限制

**解决方法**：
1. 查看后端日志，确认是否成功翻页
2. 检查接口返回的数据结构是否有变化
3. 可以手动调整代码中的翻页逻辑

## 参考文档

- [python之抓取微信公众号文章系列2](https://cloud.tencent.com/developer/article/1406410)
- [微信公众号平台](https://mp.weixin.qq.com/)

## 技术实现

代码位置：`backend/src/account/fetch.service.ts`

主要方法：
- `fetchByWechatMP()`: 使用微信公众号平台API抓取文章
- `extractTokenFromCookies()`: 从cookies中提取token
- `fetchByCrawl()`: 自动选择抓取方式（优先使用微信公众号平台API）

