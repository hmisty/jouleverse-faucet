import { createPublicClient, createWalletClient, http, parseEther, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Account } from 'viem'
import fs from 'fs/promises'

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
const WJ_CONTRACT_ADDRESS = '0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD' as `0x${string}`

/**
 * 从安全文件读取私钥
 * @returns 私钥
 */
async function loadPrivateKey(): Promise<string> {
  // 优先从环境变量读取（方便开发调试）
  if (process.env.FAUCET_PRIVATE_KEY) {
    return process.env.FAUCET_PRIVATE_KEY
  }

  // 从~/.secrets/faucet_privkey读取
  try {
    const privateKey = await fs.readFile(process.env.HOME + '/.secrets/faucet_privkey', 'utf-8')
    let key = privateKey.trim()
    // 确保有 0x 前缀
    if (!key.startsWith('0x')) {
      key = '0x' + key
    }
    return key
  } catch (error: any) {
    throw new Error(
      'Failed to read faucet private key. ' +
      'Please set FAUCET_PRIVATE_KEY environment variable ' +
      'or place your private key in ~/.secrets/faucet_privkey'
    )
  }
}

// 公共客户端（只读操作）
export const publicClient = createPublicClient({
  chain: JOULEVERSE_CHAIN,
  transport: http()
})

// 钱包客户端（发送交易）- 延迟初始化
let walletClient: ReturnType<typeof createWalletClient> | null = null

async function getWalletClient() {
  if (!walletClient) {
    const privateKey = await loadPrivateKey()
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    
    walletClient = createWalletClient({
      account,
      chain: JOULEVERSE_CHAIN,
      transport: http()
    })
  }
  return walletClient
}

/**
 * 检查地址余额
 * @param address - 钱包地址
 * @returns 余额信息
 */
export async function checkAddressBalance(address: `0x${string}`) {
  const balance = await publicClient.getBalance({ address })
  const hasBalance = balance > 0n

  // formatUnits 只接受2个参数，需要手动截断
  const balanceInJ = hasBalance ? Number(formatUnits(balance, 18)).toFixed(6) : '0'
  
  return {
    balance: balance.toString(),
    hasBalance,
    balanceInJ
  }
}

/**
 * 通过 WJ 合约的 withdrawTo 函数释放 J 代币到指定地址
 * Jouleverse 特殊之处：gas 代币 J 不能直接转移，必须通过 WJ 合约的 withdrawTo
 * @param address - 接收地址
 * @param amountJ - 数量（J）
 * @returns 交易哈希
 */
export async function sendGas(address: `0x${string}`, amountJ: string = '0.05') {
  const amount = parseEther(amountJ)
  const client = await getWalletClient()

  // 调用 WJ 合约的 withdrawTo 函数
  // function withdrawTo(address payable to, uint256 value)
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
    account: client.account as Account,
    chain: JOULEVERSE_CHAIN
  })

  return hash
}

/**
 * 获取交易状态
 * @param txHash - 交易哈希
 * @returns 交易状态信息
 */
export async function getTransactionStatus(txHash: `0x${string}`) {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash })

    if (!receipt) {
      return {
        status: 'pending' as const,
        confirmations: 0,
        blockNumber: null
      }
    }

    const currentBlock = await publicClient.getBlockNumber()
    const confirmations = currentBlock - receipt.blockNumber + 1n

    return {
      status: receipt.status === 'success' ? 'confirmed' : 'failed' as const,
      confirmations: Number(confirmations),
      blockNumber: Number(receipt.blockNumber)
    }
  } catch (error) {
    // 交易未确认或不存在
    return {
      status: 'pending' as const,
      confirmations: 0,
      blockNumber: null
    }
  }
}
