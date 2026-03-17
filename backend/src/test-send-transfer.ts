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
const TEST_ADDRESS = '0x000000000000000000000000000000000000Dead' as `0x${string}`

const client = createPublicClient({
  chain: JOULEVERSE_CHAIN,
  transport: http()
})

async function main() {
  console.log('Testing Transfer Methods...')
  console.log()

  // 检查 ERC20 transfer
  try {
    const transferData = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' }
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
      }],
      functionName: 'transfer',
      args: [TEST_ADDRESS, 50000000000000000n] // 0.05 WJ
    })
    console.log('transfer() check:', transferData)
  } catch (e: any) {
    console.log('transfer() check:', e.message.split('\n')[0])
  }

  console.log()
  console.log('Checking WJ Token Details...')
  
  try {
    // 检查 name
    const name = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'name'
    })
    console.log('Token Name:', name)

    // 检查 symbol
    const symbol = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'symbol'
    })
    console.log('Token Symbol:', symbol)

    // 检查 totalSupply
    const totalSupply = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'totalSupply'
    })
    console.log('Total Supply:', formatUnits(totalSupply as bigint, 18))
  } catch (e: any) {
    console.log('Error reading token details:', e.message.split('\n')[0])
  }
}

main()
