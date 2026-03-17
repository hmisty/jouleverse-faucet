import { createPublicClient, http } from 'viem'

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

const client = createPublicClient({
  chain: JOULEVERSE_CHAIN,
  transport: http()
})

async function main() {
  console.log('Checking Jouleverse Chain Info...')
  console.log()

  // 检查 gas price
  const gasPrice = await client.getGasPrice()
  console.log('Gas Price:', gasPrice.toString())

  // 检查 latest block
  const block = await client.getBlock()
  console.log('Latest Block:', block.number)
  console.log('Block Gas Limit:', block.gasLimit.toString())
  console.log('Block Gas Used:', block.gasUsed.toString())
}

main()
