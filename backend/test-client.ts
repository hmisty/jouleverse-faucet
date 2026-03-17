import { createWalletClient, http, privateKeyToAccount } from 'viem'
import type { Account } from 'viem'

const account = privateKeyToAccount('0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`)

console.log('Account:', account)

const client = create:WalletClient({
  account,
  chain: { id: 1, name: 'test', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://example.com'] } } },
  transport: http()
})

console.log('Client account:', client.account)
console.log('Client account type:', typeof client.account)

// 看看 sendTransaction 的类型定义
import type { WalletClient } from 'viem'

type SendTxParams = Parameters<WalletClient['sendTransaction']>
console.log('SendTransaction parameters type')
