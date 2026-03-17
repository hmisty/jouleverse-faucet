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

const FAUCET_ADDRESS = '0xBE7ba958c5b5b72669395f9C667BAE5e7d698373' as `0x${string}`
const TEST_ADDRESS = '0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD' as `0x${string}` // 使用 WJ 合约地址作为测试接收者

const client = createPublicClient({
  chain: JOULEVERSE_CHAIN,
  transport: http()
})

async function main() {
  console.log('Testing Native J Transfer...')
  console.log()

  // 检查水龙头余额
  const faucetBalance = await client.getBalance({ address: FAUCET_ADDRESS })
  console.log('Faucet Balance:', formatUnits(faucetBalance, 18), 'J')

  // 检查测试地址余额
  const testBalance = await client.getBalance({ address: TEST_ADDRESS })
  console.log('Test Address Balance:', formatUnits(testBalance, 18), 'J')

  console.log()
  console.log('结论：水龙头应该直接发送原生 J 代币，不需要经过 WJ 合约')
}

main()
