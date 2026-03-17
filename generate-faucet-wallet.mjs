#!/usr/bin/env node

// 生成密码学安全的随机私钥并推导地址

import crypto from 'crypto'
import { Wallet } from 'ethers'

// 生成32字节的随机私钥
const privateKeyBytes = crypto.randomBytes(32)
const privateKey = '0x' + privateKeyBytes.toString('hex')

// 使用ethers推导地址
const wallet = new Wallet(privateKey)

console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║                                                            ║')
console.log('║        Jouleverse Faucet Wallet Generator                   ║')
console.log('║                                                            ║')
console.log('╚══════════════════════════════════════════════════════════╝')
console.log()
console.log('🔐 Private Key (KEEP SAFE!):')
console.log(privateKey)
console.log()
console.log('📧 Faucet Address:')
console.log(wallet.address)
console.log()
console.log('🔗 Jouleverse JScan Explorer:')
console.log(`https://jscan.jnsdao.com/address/${wallet.address}`)
console.log()
console.log('⚠️  IMPORTANT:')
console.log('   - Save this private key securely')
console.log('   - Never share or commit to git')
console.log('   - Send J and WJ to address above')
console.log()
console.log('✅ Next steps:')
console.log(`   1. Send J gas to: ${wallet.address}`)
console.log(`   2. Send WJ tokens to: ${wallet.address}`)
console.log(`   3. On server, create ~/.secrets/faucet_privkey`)
console.log(`   4. Put private key (without 0x prefix) in file`)
console.log()
console.log('🚀 Server setup:')
console.log('   mkdir -p ~/.secrets')
console.log('   chmod 700 ~/.secrets')
console.log('   echo [PRIVATE_KEY_WITHOUT_0X] > ~/.secrets/faucet_privkey')
console.log('   chmod 600 ~/.secrets/faucet_privkey')
console.log()
