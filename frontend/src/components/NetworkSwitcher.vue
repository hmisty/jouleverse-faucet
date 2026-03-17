<script setup lang="ts">
import { ref } from 'vue'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

const JOULEVERSE_CONFIG = {
  chainId: '0xe52',
  chainName: 'Jouleverse Mainnet',
  nativeCurrency: {
    name: 'J',
    symbol: 'J',
    decimals: 18
  },
  rpcUrls: ['https://rpc.jnsdao.com:8503'],
  blockExplorerUrls: ['https://jscan.jnsdao.com']
}

const isAdding = ref(false)
const error = ref<string | null>(null)

async function switchToJouleverse() {
  if (!window.ethereum) {
    error.value = '未检测到MetaMask钱包，请先安装'
    return
  }

  isAdding.value = true
  error.value = null

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [JOULEVERSE_CONFIG]
    })
  } catch (err: any) {
    error.value = err?.message || '添加网络失败'
  } finally {
    isAdding.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      @click="switchToJouleverse"
      :disabled="isAdding"
      class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {{ isAdding ? '添加中...' : '添加 Jouleverse 网络' }}
    </button>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p class="text-xs text-gray-500">
      或手动添加：<br>
      Chain ID: 3666<br>
      RPC URL: https://rpc.jnsdao.com:8503<br>
      Currency Symbol: J
    </p>
  </div>
</template>
