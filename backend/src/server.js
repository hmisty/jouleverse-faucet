import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createPublicClient, createWalletClient, http, parseEther, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import fs from 'fs/promises'
import { parse } from 'csv-parse/sync'
import { createObjectCsvWriter } from 'csv-writer'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const JOULEVERSE_CHAIN = {
  id: 3666,
  name: 'Jouleverse Mainnet',
  nativeCurrency: { name: 'J', symbol: 'J', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.JOULEVERSE_RPC_URL || 'https://rpc.jnsdao.com:8503']
    }
  },
  blockExplorers: {
    default: {
      name: 'JScan',
      url: process.env.JOULEVERSE_EXPLORER || 'https://jscan.jnsdao.com'
    }
  }
}

// WJ (Wrapped Joule) 合约地址
const WJ_CONTRACT_ADDRESS = '0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD'

const CSV_PATH = './faucet.csv'

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 中间件：验证地址格式
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// 中间件：验证邮箱格式
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 从安全文件读取私钥
async function loadPrivateKey() {
  // 优先从环境变量读取（方便开发调试）
  if (process.env.FAUCET_PRIVATE_KEY) {
    return process.env.FAUCET_PRIVATE_KEY
  }

  // 从~/.secrets/faucet_privkey读取
  try {
    const privateKey = await fs.readFile(process.env.HOME + '/.secrets/faucet_privkey', 'utf-8')
    return privateKey.trim()
  } catch (error) {
    throw new Error(
      'Failed to read faucet private key. ' +
      'Please set FAUCET_PRIVATE_KEY environment variable ' +
      'or place your private key in ~/.secrets/faucet_privkey'
    )
  }
}

// 公共客户端（只读操作）
const publicClient = createPublicClient({
  chain: JOULEVERSE_CHAIN,
  transport: http()
})

// 钱包客户端（发送交易）- 延迟初始化
let walletClient = null

async function getWalletClient() {
  if (!walletClient) {
    const privateKey = await loadPrivateKey()
    const account = privateKeyToAccount(privateKey)
    
    walletClient = createWalletClient({
      account,
      chain: JOULEVERSE_CHAIN,
      transport: http()
    })
  }
  return walletClient
}

// Email hash计算
function hashEmail(email) {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

// 确保CSV文件存在并创建header
async function ensureCsvFile() {
  try {
    await fs.access(CSV_PATH)
  } catch {
    // 文件不存在，创建带header的空文件
    const csvWriter = createObjectCsvWriter({
      path: CSV_PATH,
      header: [
        { id: 'emailHash', title: 'EMAIL_HASH' },
        { id: 'email', title: 'EMAIL' },
        { id: 'address', title: 'ADDRESS' },
        { id: 'txHash', title: 'TX_HASH' },
        { id: 'timestamp', title: 'TIMESTAMP' }
      ],
      append: false
    })
    await csvWriter.writeRecords([])
  }
}

// 检查email hash是否已领取过
async function checkClaimed(emailHash) {
  try {
    await fs.access(CSV_PATH)
  } catch {
    return false
  }

  const content = await fs.readFile(CSV_PATH, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  })

  return records.some(record => record.EMAIL_HASH === emailHash)
}

// 检查地址是否已领取过
async function checkAddressClaimed(address) {
  try {
    await fs.access(CSV_PATH)
  } catch {
    return false
  }

  const content = await fs.readFile(CSV_PATH, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  })

  return records.some(record => record.ADDRESS.toLowerCase() === address.toLowerCase())
}

// API: 检查地址余额
app.get('/api/check/:address', async (req, res) => {
  try {
    const { address } = req.params

    // 验证地址格式
    if (!isValidAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address format'
      })
    }

    const balance = await publicClient.getBalance({ address })
    const hasBalance = balance > 0n

    res.json({
      balance: formatUnits(balance, 18, 6),
      hasBalance
    })
  } catch (error) {
    console.error('Error checking address balance:', error)
    res.status(500).json({
      error: 'Failed to check address balance',
      message: error.message
    })
  }
})

// API: 申请领取gas
app.post('/api/claim', async (req, res) => {
  try {
    const { address, email } = req.body

    // 验证输入
    if (!address || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: address and email'
      })
    }

    if (!isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format'
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // 检查email hash是否已领取
    const emailHash = hashEmail(email)
    const isEmailClaimed = await checkClaimed(emailHash)

    if (isEmailClaimed) {
      return res.status(400).json({
        success: false,
        message: 'This email has already claimed. Each email can only claim once.'
      })
    }

    // 检查地址是否已领取
    const isAddressClaimed = await checkAddressClaimed(address)
    if (isAddressClaimed) {
      return res.status(400).json({
        success: false,
        message: 'This address has already claimed.'
      })
    }

    // 发送gas
    const amountJ = process.env.FAUCET_AMOUNT || '0.05'
    const amount = parseEther(amountJ)
    const client = await getWalletClient()

    // 调用WJ合约的withdrawTo函数
    const hash = await client.writeContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [
          { internalType: 'address payable', name: 'to', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' }
        ],
        name: 'withdrawTo',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }],
      functionName: 'withdrawTo',
      args: [address, amount],
      value: 0n
    })

    // 确保CSV文件存在并创建header
    await ensureCsvFile()

    // 记录到CSV
    const csvWriter = createObjectCsvWriter({
      path: CSV_PATH,
      header: [
        { id: 'emailHash', title: 'EMAIL_HASH' },
        { id: 'email', title: 'EMAIL' },
        { id: 'address', title: 'ADDRESS' },
        { id: 'txHash', title: 'TX_HASH' },
        { id: 'timestamp', title: 'TIMESTAMP' }
      ],
      append: true
    })

    await csvWriter.writeRecords([{
      emailHash,
      email,
      address,
      txHash: hash,
      timestamp: new Date().toISOString()
    }])

    res.json({
      success: true,
      txHash: hash,
      amount: amountJ + ' J',
      message: 'Gas sent successfully!'
    })
  } catch (error) {
    console.error('Error processing claim:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process claim',
      error: error.message
    })
  }
})

// API: 查询交易状态
app.get('/api/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params

    // 验证交易哈希格式
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({
        error: 'Invalid transaction hash format'
      })
    }

    const receipt = await publicClient.getTransactionReceipt({ hash: txHash })

    if (!receipt) {
      return res.json({
        status: 'pending',
        confirmations: 0,
        blockNumber: null
      })
    }

    const currentBlock = await publicClient.getBlockNumber()
    const confirmations = currentBlock - receipt.blockNumber + 1n

    res.json({
      status: receipt.status === 'success' ? 'confirmed' : 'failed',
      confirmations: Number(confirmations),
      blockNumber: Number(receipt.blockNumber)
    })
  } catch (error) {
    console.error('Error getting transaction status:', error)
    res.status(500).json({
      error: 'Failed to get transaction status',
      message: error.message
    })
  }
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                            ║
║        Jouleverse Faucet API Server                       ║
║                                                            ║
║        🚀 Server running on port ${PORT}                        ║
║        🔗 RPC: https://rpc.jnsdao.com:8503               ║
║        💰 Faucet Amount: ${process.env.FAUCET_AMOUNT || '0.05'} J                    ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝
  `)

  console.log('API Endpoints:')
  console.log(`  GET  /health                 - Health check`)
  console.log(`  GET  /api/check/:address     - Check address balance`)
  console.log(`  POST /api/claim              - Claim gas`)
  console.log(`  GET  /api/status/:txHash     - Get transaction status`)
  console.log()
})
