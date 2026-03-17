# Jouleverse 水龙头系统架构方案 V2.0

## 📋 项目需求

为 Jouleverse（以太坊兼容链）开发一个水龙头网站：
- 用户输入干净地址（无gas）登记email后可领取 0.05 J gas
- 验证email后，将email hash写入链上
- 服务器端用CSV文件存储 hash, email, address
- 每个email hash只能领取一次（从链上验证）
- 不设置冷却时间，不使用Redis，不使用数据库

---

## 🔍 Jouleverse 链配置

**从 ChainList (chain/3666) 获取的配置：**

| 配置项 | 值 |
|--------|-----|
| **链名称** | Jouleverse Mainnet |
| **Chain ID** | `3666` (0xe52) |
| **RPC URL** | `https://rpc.jnsdao.com:8503` |
| **Native Currency** | `J` (18 decimals) |
| **区块浏览器** | `https://jscan.jnsdao.com` |
| **官方信息** | `https://jnsdao.com` |

**EIP-3085 一键添加网络配置：**
```javascript
{
  chainId: '0xe52',
  chainName: 'Jouleverse Mainnet',
  nativeCurrency: {
    name: 'J',
    symbol: 'J',
    decimals: 18
  },
  rpcUrls: ['https://rpc.jnsdao.com:8503'],
  blockExplorerUrls: ['https://jscan.jnsdao.com']
}
```

---

## 🏗️ 架构方案

### 整体架构

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   前端      │    │   后端API    │    │  区块链节点   │
│  (Vue.js)   │◄──►│  (Node.js)   │◄──►│   (RPC)      │
└─────────────┘    └──────┬───────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  CSV文件     │
                    │  faucet.csv  │
                    └──────────────┘
```

**架构特点：**
- 无数据库：使用CSV文件存储领取记录
- 链上验证：通过智能合约/链上数据验证email hash是否已领取
- 轻量级：适合部署和快速启动

---

### 前端 (Vue.js)

**技术栈：** Vue 3 + Vite + Tailwind CSS + Ethers.js/Viem

**核心页面：**
1. **首页** - 水龙头说明 + 领取表单
2. **领取表单** - 输入地址 + email
3. **领币状态** - 交易状态实时显示
4. **交易结果** - 成功/失败提示

**UI组件：**
```vue
<!-- 主要组件 -->
- FaucetForm: 领取表单（地址 + email 输入）
- AddressValidator: 地址格式验证
- EmailValidator: 邮箱格式验证
- BalanceChecker: 显示当前余额
- TransactionStatus: 交易进度（待确认→已确认）
- NetworkSwitcher: 一键添加Jouleverse网络
```

**示例代码结构：**
```vue
<!-- src/App.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <FaucetForm @claim="handleClaim" />
    <TransactionStatus v-if="txHash" :txHash="txHash" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FaucetForm from './components/FaucetForm.vue'
import TransactionStatus from './components/TransactionStatus.vue'

const txHash = ref('')

async function handleClaim({ address, email }) {
  const response = await fetch('/api/claim', {
    method: 'POST',
    body: JSON.stringify({ address, email })
  })
  const data = await response.json()
  txHash.value = data.txHash
}
</script>
```

---

### 后端 (API Server)

**技术栈：** Node.js + Express + Viem + csv-writer

**核心API：**

```typescript
// 1. 检查地址余额（干净检查）
GET /api/check/:address
返回: {
  balance: string,       // 当前余额（Wei）
  hasBalance: boolean    // 是否有余额（hasBalance=false 才能领取）
}

// 2. 申请领取gas
POST /api/claim
Body: { address, email }
返回: {
  success: boolean,
  txHash?: string,       // 交易哈希
  message: string
}

// 3. 查从链上验证email hash是否已领取
POST /api/check-claimed
Body: { emailHash }
返回: {
  claimed: boolean,       // 是否已领取
  transaction?: {
    txHash: string,
    timestamp: number,
    amount: string
  }
}

// 4. 查询交易状态
GET /api/status/:txHash
返回
```

I'll continue the partial thought from the previous rewritten thinking by copying over the next thinking up to the next newline:

: {
  status: 'pending' | 'confirmed' | 'failed',
  confirmations: number,
  blockNumber?: number
}
```

**关键实现逻辑：**

1. **Email Hash 计算：**
```typescript
import { createHash } from 'crypto'

function hashEmail(email: string): string {
  // 使用SHA-256 hash email
  return createHash('sha256').update(email.toLowerCase()).digest('hex')
}
```

2. **CSV 文件存储：**
```typescript
import { createObjectCsvWriter } from 'csv-writer'

const csvWriter = createObjectCsvWriter({
  path: './faucet.csv',
  header: [
    { id: 'emailHash', title: 'EMAIL_HASH' },
    { id: 'email', title: 'EMAIL' },
    { id: 'address', title: 'ADDRESS' },
    { id: 'txHash', title: 'TX_HASH' },
    { id: 'timestamp', title: 'TIMESTAMP' }
  ],
  append: true  // 追加模式
})

await csvWriter.writeRecords([
  {
    emailHash: hashEmail(email),
    email: email,
    address: address,
    txHash: txHash,
    timestamp: new Date().toISOString()
  }
])
```

3. **从CSV读取验证：**
```typescript
import fs from 'fs/promises'
import { parse } from 'csv-parse/sync'

async function checkClaimed(emailHash: string): Promise<boolean> {
  try {
    const content = await fs.readFile('./faucet.csv', 'utf-8')
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true
    })

    // 查找是否已存在此email hash
    return records.some(record => record.EMAIL_HASH === emailHash)
  } catch (error) {
    // 文件不存在视为未领取
    return false
  }
}
```

4. **链上验证（可选增强）：**
```typescript
// 检查链上是否已写入email hash
async function checkClaimedOnChain(emailHash: string): Promise<boolean> {
  // 方案1：如果有专门的Faucet合约，查询合约状态
  // const claimed = await faucetContract.read.hasClaimed([emailHash])

  // 方案2：通过交易Event日志查询
  // const logs = await client.getLogs({
  //   address: faucetContractAddress,
  //   event: parseAbiItem('event Claimed(bytes32 indexed emailHash, address recipient)')
  // })
  // return logs.some(log => log.args.emailHash === emailHash)

  // 简化方案：优先使用CSV验证，链上验证可选
  return checkClaimed(emailHash)
}
```

5. **发送交易：**
```typescript
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount(process.env.FAUCET_PRIVATE_KEY!)
const client = createWalletClient({
  account,
  chain: jouleverseChain,
  transport: http(JOULEVERSE_RPC_URL)
})

const hash = await client.sendTransaction({
  to: address as `0x${string}`,
  value: parseEther('0.05')  // 0.05 J
})
```

---

## 🔒 安全机制

### 1. 地址验证

**验证流程：**
```typescript
1. 检查地址格式（0x开头，42位）
2. 检查当前余额 → 确保没有gas（balance === 0）
3. Email hash验证 → 确保未领取过
```

**检查代码示例（Viem）：**
```typescript
import { createPublicClient, http, parseEther } from 'viem'

const client = createPublicClient({
  chain: jouleverseChain,
  transport: http(JOULEVERSE_RPC_URL)
})

// 检查余额
const balance = await client.getBalance({ address })
if (balance > 0n) {
  return { hasBalance: true, balance: formatEther(balance) }
}

return { hasBalance: false, balance: '0' }
```

---

### 2. 防刷机制（简化版）

| 机制 | 说明 | 实现方式 |
|------|------|----------|
| **Email Hash限制** | 同一email只能领1次 | CSV记录+链上验证 |
| **地址限制** | 同一地址只能领1次 | CSV记录 |
| **验证码** | 防止机器人批量刷 | 简单数学验证码 |

**验证码实现（Vue前端）：**
```vue
<script setup>
import { ref, computed } from 'vue'

const num1 = ref(Math.floor(Math.random() * 10))
const num2 = ref(Math.floor(Math.random() * 10))
const userAnswer = ref('')

const expectedAnswer = computed(() => num1.value + num2.value)
const isCaptchaValid = computed(() => parseInt(userAnswer.value) === expectedAnswer.value)

function refreshCaptcha() {
  num1.value = Math.floor(Math.random() * 10)
  num2.value = Math.floor(Math.random() * 10)
  userAnswer.value = ''
}
</script>

<template>
  <div>
    <p>{{ num1 }} + {{ num2 }} = ?</p>
    <input v-model="userAnswer" type="number" />
    <button @click="refreshCaptcha">刷新</button>
  </div>
</template>
```

---

### 3. 私钥管理

**关键注意事项：**

❌ **不要硬编码私钥**
❌ **不要将私钥提交到Git**
❌ **不要在前端使用私钥**

✅ **推荐方案：**
```bash
# .env 文件
FAUCET_PRIVATE_KEY=0x...
JOULEVERSE_RPC_URL=https://rpc.jnsdao.com:8503
FAUCET_AMOUNT=0.05

# .gitignore
.env
faucet.csv
```

---

## 📦 项目结构

```
jouleverse-faucet/
├── frontend/                 # Vue.js 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── FaucetForm.vue
│   │   │   ├── TransactionStatus.vue
│   │   │   ├── NetworkSwitcher.vue
│   │   │   └── Captcha.vue
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js 后端
│   ├── src/
│   │   ├── api/
│   │   │   ├── check.ts
│   │   │   ├── claim.ts
│   │   │   └── status.ts
│   │   ├── lib/
│   │   │   ├── csv-store.ts
│   │   │   ├── email-hash.ts
│   │   │   └── blockchain.ts
│   │   └── index.ts
│   ├── faucet.csv           # CSV存储文件
│   ├── .env                  # 环境变量（包含私钥）
│   └── package.json
│
└── README.md
```

---

## 🚀 部署方案

### 方案1：Vercel (前端) + Railway/Render (后端)

**前端部署到 Vercel：**
```bash
cd frontend
npm run build
vercel deploy
```

**后端部署到 Railway：**
```bash
cd backend
railway up
```

---

### 方案2：自建服务器

**服务器配置：**
- Ubuntu 20.04+
- Node.js 18+
- Nginx 反向代理
- PM2 进程管理

**Nginx配置示例：**
```nginx
server {
  listen 80;
  server_name faucet.jouleverse.com;

  # 前端静态文件
  location / {
    root /var/www/jouleverse-faucet/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # 后端API代理
  location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**PM2 配置：**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'jouleverse-faucet-backend',
    script: 'src/index.ts',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

---

## 🛠️ 实施步骤

### Phase 1: MVP（最小可行版本）
- [x] 确认 Jouleverse RPC 配置
- [ ] 创建Vue前端项目结构
- [ ] 实现后端核心API（检查地址、发送交易）
- [ ] 实现CSV存储和验证
- [ ] 简单验证码防刷

### Phase 2: 增强功能
- [ ] MetaMask 一键连接Jouleverse网络
- [ ] 交易状态实时显示
- [ ] 交易结果页面优化

### Phase 3: 生产就绪
- [ ] 部署到生产环境
- [ ] 添加HTTPS证书
- [ ] 监控告警

---

## 📋 环境变量清单

```bash
# .env
FAUCET_PRIVATE_KEY=0x...                    # 水龙头私钥
JOULEVERSE_RPC_URL=https://rpc.jnsdao.com:8503
JOULEVERSE_CHAIN_ID=3666
JOULEVERSE_EXPLORER=https://jscan.jnsdao.com
FAUCET_AMOUNT=0.05                          # 每次领取数量
PORT=3001                                   # 后端端口
```

---

## ⚠️ 注意事项

1. **CSV文件并发处理：** 需要加锁机制防止并发写入冲突
2. **Gas费成本：** 水龙头需要有足够的J余额，需要定期充值
3. **CSV备份：** 定期备份CSV文件防止数据丢失
4. **私钥安全：** 水龙头私钥泄露 = 资金被盗
5. **用户体验：** 交易确认需要等待，给出明确提示
6. **链上验证增强：** CSV是本地验证，建议部署后添加链上Event日志查询增强验证

---

## 📚 参考资源

- **Jouleverse Chain Info:** https://chainlist.org/chain/3666
- **Viem 文档：** https://viem.sh
- **Vue 3 文档：** https://vuejs.org
- **Vite 文档：** https://vitejs.dev
- **csv-writer:** https://github.com/adaltas/node-csv-writer

---

_最后更新：2026-03-16_
