import { createPublicClient, http, formatUnits } from 'viem'

const JOULEVERSE_CHAIN = {
  id: 3666,
  name: 'Jouleverse Mainnet',
  nativeCurrency: { name: 'J', symbol: 'J', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.jnsdao.com:8503']
    }
  }
}

const WJ_CONTRACT_ADDRESS = '0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD' as `0x${string}`
const FAUCET_ADDRESS = '0xBE7ba958c5b5b72669395f9C667BAE5e7d698373' as `0x${string}`

const client = createPublicClient({
  chain: JOULEVERSE_CHAIN,
  transport: http()
})

async function main() {
  console.log('Testing WJ Contract...')
  console.log('WJ Contract:', WJ_CONTRACT_ADDRESS)
  console.log('Faucet Address:', FAUCET_ADDRESS)
  console.log()

  // 1. 检查水龙头地址余额
  const faucetBalance = await client.getBalance({ address: FAUCET_ADDRESS })
  console.log('Faucet Address Balance:', formatUnits(faucetBalance, 18), 'J')

  // 2. 检查 WJ 合约余额
  const wjBalance = await client.getBalance({ address: WJ_CONTRACT_ADDRESS })
  console.log('WJ Contract Balance:', formatUnits(wjBalance, 18), 'J')
  
  // 3. 尝试读取合约 owner
  try {
    const owner = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'owner'
    })
    console.log('WJ Contract Owner:', owner)
    console.log('Is Faucet Owner?', owner.toLowerCase() === FAUCET_ADDRESS.toLowerCase())
  } catch (e: any) {
    console.log('Failed to read owner:', e.message)
  }
}

main()
