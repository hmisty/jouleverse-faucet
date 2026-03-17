#!/usr/bin/env node

// 生成密码学安全的随机私钥并推导地址

import crypto from 'crypto'
import { Wallet } from 'ethers'

// 生成32字节的随机私钥
const privateKeyBytes = crypto.randomBytes(32)
const privateKey = '0x' + privateKeyBytes.toString('hex')

// 使用ethers推导地址
const wallet = new Wallet(privateKey)

// 输出用于脚本的私钥和地址
console.log('PRIVATE_KEY=' + privateKey)
console.log('ADDRESS=' + wallet.address)
