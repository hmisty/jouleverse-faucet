<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  txHash: string
}

const props = defineProps<Props>()

const status = ref<'pending' | 'confirmed' | 'failed'>('pending')
const confirmations = ref(0)
const blockNumber = ref<number | null>(null)
const explorerUrl = ref('')

onMounted(async () => {
  // 构建浏览器URL
  explorerUrl.value = `https://jscan.jnsdao.com/tx/${props.txHash}`

  // 开始轮询交易状态
  pollTransactionStatus()
})

async function pollTransactionStatus() {
  try {
    const response = await fetch(`/api/status/${props.txHash}`)
    const data = await response.json()

    status.value = data.status
    confirmations.value = data.confirmations
    blockNumber.value = data.blockNumber

    // 如果还在pending，继续轮询
    if (status.value === 'pending') {
      setTimeout(pollTransactionStatus, 3000) // 每3秒轮询一次
    }
  } catch (err) {
    console.error('Failed to poll transaction status:', err)
  }
}

function getStatusText() {
  switch (status.value) {
    case 'pending':
      return '等待确认中...'
    case 'confirmed':
      return '已确认 ✅'
    case 'failed':
      return '交易失败 ❌'
    default:
      return '未知状态'
  }
}

function getStatusColor() {
  switch (status.value) {
    case 'pending':
      return 'text-yellow-600'
    case 'confirmed':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-6 bg-white rounded-xl shadow-lg p-6">
    <h2 class="text-lg font-semibold mb-4">交易状态</h2>

    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-gray-600">交易哈希</span>
        <code class="text-xs bg-gray-100 px-2 py-1 rounded break-all max-w-[200px]">
          {{ txHash.slice(0, 10) }}...{{ txHash.slice(-8) }}
        </code>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-600">状态</span>
        <span :class="getStatusColor()" class="font-medium">
          {{ getStatusText() }}
        </span>
      </div>

      <div v-if="status === 'pending'" class="flex justify-between items-center">
        <span class="text-gray-600">确认数</span>
        <span class="text-gray-900">{{ confirmations }}</span>
      </div>

      <div v-if="blockNumber" class="flex justify-between items-center">
        <span class="text-gray-600">区块高度</span>
        <span class="text-gray-900">{{ blockNumber }}</span>
      </div>

      <a
        :href="explorerUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
      >
        在区块浏览器中查看 →
      </a>
    </div>
  </div>
</template>
