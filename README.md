# Jouleverse Faucet 💧

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.4%2B-brightgreen.svg)](https://vuejs.org/)

为 Jouleverse 区块链提供 gas 代币的水龙头服务，帮助开发者快速获得测试代币。

## 📋 项目简介

**Jouleverse Faucet** 是一个完整的 Web3 水龙头服务，允许用户通过邮箱验证领取 **0.05 J** gas 代币。

### 核心特性

- ✅ **无 Gas 领取** - 用户无需支付 gas 费用
- 🔐 **邮箱验证** - 通过 Email Hash 防止重复领取
- 📊 **双重验证** - 链上记录 + 本地 CSV 双重防刷
- 🎨 **现代 UI** - Vue 3 + Tailwind CSS 构建的响应式界面
- 📡 **实时追踪** - 交易状态实时监控和确认
- 🚀 **生产就绪** - 包含 Nginx 部署配置和完整文档

## 🏗️ 技术架构

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **功能**: 钱包连接、地址验证、验证码、交易状态追踪

### 后端
- **框架**: Express.js + TypeScript
- **区块链交互**: Viem
- **数据存储**: CSV 文件（无数据库）
- **验证机制**: Email hash (SHA-256) + 地址唯一性

## 📦 快速开始

### ⚡ 在线体验

本服务已部署到生产环境，可直接访问体验：**https://faucet.f7t.cn**

### 👨‍💻 本地开发

#### 前置要求
- Node.js 18+
- npm 或 yarn
- Jouleverse 钱包私钥（用于发送gas）

### 1. 安装依赖

**前端：**
```bash
cd frontend
npm install
```

**后端：**
```bash
cd backend
npm install
```

### 2. 配置环境变量

**方式一：使用 .env 文件** (`backend/.env`)：
```bash
FAUCET_PRIVATE_KEY=0x...                    # 水龙头私钥
JOULEVERSE_RPC_URL=https://rpc.jnsdao.com:8503
JOULEVERSE_CHAIN_ID=3666
JOULEVERSE_EXPLORER=https://jscan.jnsdao.com
FAUCET_AMOUNT=0.05                          # 每次领取数量
PORT=3001                                   # 后端端口
```

⚠️ **安全提示**：不要将 `.env` 文件提交到 Git！

**方式二：使用安全文件** (推荐)：
```bash
mkdir -p ~/.secrets
echo "0x..." > ~/.secrets/faucet_privkey
chmod 600 ~/.secrets/faucet_privkey
```

后端会优先读取 `FAUCET_PRIVATE_KEY` 环境变量，如果未设置则从 `~/.secrets/faucet_privkey` 读取私钥。

### 3. 启动服务

**启动后端：**
```bash
cd backend
npm run dev
```

**启动前端（另开一个终端）：**
```bash
cd frontend
npm run dev
```

访问：http://localhost:5173

## 🔗 Jouleverse 链信息

| 配置项 | 值 |
|--------|-----|
| Chain ID | `3666` (0xe52) |
| RPC URL | `https://rpc.jnsdao.com:8503` |
| Native Currency | `J` (18 decimals) |
| 区块浏览器 | `https://jscan.jnsdao.com` |
| 官方信息 | `https://jnsdao.com` |

## 📡 API 接口

> 完整的 Swagger 文档正在开发中...

### 公共接口（无需认证）

### 1. 检查地址余额
```
GET /api/check/:address
```

**返回：**
```json
{
  "balance": "0.000000",
  "hasBalance": false
}
```

### 2. 申请领取 gas
```
POST /api/claim
Content-Type: application/json

{
  "address": "0x...",
  "email": "user@example.com"
}
```

**返回（成功）：**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.05 J",
  "message": "Gas sent successfully!"
}
```

**返回（失败）：**
```json
{
  "success": false,
  "message": "This email has already claimed."
}
```

### 3. 查询交易状态
```
GET /api/status/:txHash
```

**返回：**
```json
{
  "status": "confirmed",  // pending | confirmed | failed
  "confirmations": 12,
  "blockNumber": 123456
}
```

## 🔒 安全机制

本项目采用多层安全防护机制：

| 安全层 | 实现方式 | 说明 |
|--------|----------|------|
| **邮箱唯一性** | SHA-256 Hash | 每个邮箱只能领取一次 |
| **地址唯一性** | CSV 记录查询 | 同一地址不能重复领取 |
| **余额过滤** | 链上查询 | 只有余额为 0 的"干净"地址才能领取 |
| **格式验证** | 正则表达式 | 严格的地址和邮箱格式检查 |
| **防机器人** | 前端验证码 | 防止自动化脚本批量领取 |

### 安全配置建议

```bash
# 使用安全文件存储私钥（推荐）
mkdir -p ~/.secrets
echo "0x..." > ~/.secrets/faucet_privkey
chmod 600 ~/.secrets/faucet_privkey

# 设置环境变量
export FAUCET_PRIVATE_KEY=$(cat ~/.secrets/faucet_privkey)
```

## 📁 CSV 存储格式

后端将领取记录存储在 `faucet.csv`：

```csv
EMAIL_HASH,EMAIL,ADDRESS,TX_HASH,TIMESTAMP
a1b2c3d4...,user@example.com,0x...,0x...,2026-03-16T12:00:00.000Z
```

## 🚀 部署

### 🌐 生产环境部署

本项目已部署到生产环境：**https://faucet.f7t.cn**

#### Nginx 反向代理配置（推荐）

使用 Nginx 反向代理可以提供更好的性能和安全性。详见 `NGINX_DEPLOYMENT.md`。

**快速部署步骤：**
1. 配置域名（如 `faucet.f7t.cn`）
2. 配置 DNS A 记录指向服务器 IP
3. 使用提供的 `nginx.conf` 配置 Nginx
4. 配置 HTTPS（推荐 acme.sh / Let's Encrypt）
5. 重启 Nginx 服务

```bash
# 拷贝 Nginx 配置
sudo cp nginx.conf /etc/nginx/sites-available/jouleverse-faucet
sudo ln -s /etc/nginx/sites-available/jouleverse-faucet /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 前端部署（Vercel 推荐）

```bash
cd frontend
vercel deploy --prod
```

#### 后端部署（PM2 推荐）

```bash
cd backend
npm install
npm run build  # 如果有构建步骤
pm2 start npm --name "jouleverse-faucet-backend" -- start
pm2 save
pm2 startup
```

### Nginx 反向代理配置

```nginx
server {
  listen 80;
  server_name faucet.f7t.cn;

  # 前端静态文件
  location / {
    root /var/www/jouleverse-faucet/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # 后端 API 代理
  location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }
}
```

## 🐛 已知问题修复

### 后端启动错误 (2026-03-17)

**问题**：使用 `npm run start` 命令时出现 `ERR_REQUIRE_CYCLE_MODULE` 错误。

**原因**：`node --loader ts-node/esm` 在 CommonJS 项目中会导致 ES 模块循环依赖。

**解决方案**：
1. 使用 `npx ts-node src/index.ts` 直接启动后端
2. 或修改 `package.json` 中的 `start` 脚本

**修复的 TypeScript 错误**：
- `formatUnits` 参数错误（不支持第3个参数）
- `sendTransaction` 缺少必需的 `account` 和 `chain` 参数

---

## ⚠️ 注意事项

1. **私钥安全**: 水龙头私钥必须妥善保管，不要提交到代码库
2. **Gas 充值**: 定期检查水龙头钱包余额，及时充值
3. **CSV 备份**: 定期备份 `faucet.csv` 文件
4. **并发处理**: 当前CSV方案不支持高并发，如需高并发请考虑使用数据库
5. **链上验证增强**: 当前主要依赖CSV验证，建议后期添加链上 Event 日志查询

## 📝 开发计划

- [ ] 添加链上 Event 日志验证
- [ ] 实现管理员统计面板
- [ ] 添加邮件验证功能
- [ ] 支持多语言
- [ ] 优化UI/UX

## 📄 License

ISC License

## 📚 相关文档

- [架构设计文档](./jouleverse-faucet-architecture.md) - 详细的技术架构和实现思路
- [部署总结文档](./DEPLOYMENT_SUMMARY.md) - 完整的部署过程记录
- [Nginx 部署文档](./NGINX_DEPLOYMENT.md) - Nginx 反向代理配置指南
- [项目完成报告](./PROJECT_COMPLETION_REPORT.md) - 开发完成情况和测试结果

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 前端遵循 ESLint + Prettier 配置
- 后端遵循 TypeScript 最佳实践
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/)

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 🐛 提交 [GitHub Issues](https://github.com/hmisty/jouleverse-faucet/issues)
- 💬 参与社区讨论

---

_最后更新：2026-07-12_
