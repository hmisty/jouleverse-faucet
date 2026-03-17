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
  console.log('Testing WJ Contract Methods...')
  console.log()

  // 检查 deposit 方法
  try {
    const depositData = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [],
        name: 'deposit',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
      }],
      functionName: 'deposit'
    })
  } catch (e: any) {
    console.log('deposit() check:', e.message.split('\n')[0])
  }

  // 检查 withdraw 方法
  try {
    const withdrawData = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [{ internalType: 'uint256', name: 'wad', type: 'uint256' }],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }],
      functionName: 'withdraw',
      args: [1000000000000000n]
    })
  } catch (e: any) {
    console.log('withdraw() check:', e.message.split('\n')[0])
  }

  // 检查 withdrawTo 方法
  try {
    const withdrawToData = await client.readContract({
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
      args: [FAUCET_ADDRESS, 1000000000000000n]
    })
  } catch (e: any) {
    console.log('withdrawTo() check:', e.message.split('\n')[0])
  }

  // 检查 balanceOf
  try {
    const balance = await client.readContract({
      address: WJ_CONTRACT_ADDRESS,
      abi: [{
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'balanceOf',
      args: [FAUCET_ADDRESS]
    })
    console.log('Faucet WJ balance:', formatUnits(balance as bigint, 18))
  } catch (e: any) {
    console.log('balanceOf() check:', e.message.split('\n')[0])
  }
}

main()
