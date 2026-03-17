<script setup lang="ts">
import { ref, computed } from 'vue'
import Captcha from './Captcha.vue'

const address = ref('')
const email = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)

const isValidAddress = computed(() => {
  return /^0x[a-fA-F0-9]{40}$/.test(address.value)
})

const isValidEmail = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

const canSubmit = computed(() => {
  return isValidAddress.value && isValidEmail.value && (captchaRef.value?.isValid || false)
})

async function checkBalance(addr: string) {
  try {
    const response = await fetch(`/api/check/${addr}`)
    const data = await response.json()
    return data
  } catch (err) {
    error.value = '检查余额失败，请稍后重试'
    return null
  }
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  error.value = null

  try {
    // 先检查余额
    const balanceCheck = await checkBalance(address.value)
    if (!balanceCheck) {
      error.value = '连接服务器失败'
      return
    }

    if (balanceCheck.hasBalance) {
      error.value = `该地址已有余额 ${balanceCheck.balance} J，请使用无余额的地址`
      return
    }

    // 提交领取请求
    const response = await fetch('/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: address.value,
        email: email.value
      })
    })

    const data = await response.json()

    if (!data.success) {
      error.value = data.message || '领取失败'
      return
    }

    // 成功，触发事件
    emit('claim-success', {
      address: address.value,
      txHash: data.txHash,
      amount: '0.05 J'
    })

    // 重置表单
    address.value = ''
    email.value = ''
    captchaRef.value?.refresh()

  } catch (err: any) {
    error.value = err?.message || '网络错误，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

const emit = defineEmits<{
  (e: 'claim-success', data: { address: string, txHash: string, amount: string }): void
}>()
</script>

<template>
  <!-- 响应式宽度：手机 max-w-md (448px)，平板 max-w-2xl (672px)，电脑 max-w-4xl (896px) -->
  <div class="mx-auto max-w-md md:max-w-2xl lg:max-w-4xl bg-white rounded-xl shadow-lg p-8">
    <h1 class="text-2xl font-bold text-center mb-2">Jouleverse 水龙头</h1>
    <p class="text-gray-600 text-center mb-6">
      为无 gas 的干净地址提供 <span class="font-semibold text-blue-600">0.05 J</span>
    </p>

    <div class="space-y-4">
      <!-- 地址输入 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          钱包地址
        </label>
        <input
          v-model="address"
          type="text"
          placeholder="0x..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          :class="{ 'border-red-500': address && !isValidAddress }"
        />
        <p v-if="address && !isValidAddress" class="mt-1 text-sm text-red-600">
          请输入有效的以太坊地址
        </p>
      </div>

      <!-- 邮箱输入 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          邮箱地址
        </label>
        <input
          v-model="email"
          type="email"
          placeholder="your@email.com"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          :class="{ 'border-red-500': email && !isValidEmail }"
        />
        <p v-if="email && !isValidEmail" class="mt-1 text-sm text-red-600">
          请输入有效的邮箱地址
        </p>
        <p class="mt-1 text-xs text-gray-500">
          同一邮箱只能领取一次
        </p>
      </div>

      <!-- 验证码 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          验证码
        </label>
        <Captcha ref="captchaRef" />
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {{ error }}
      </div>

      <!-- 提交按钮 -->
      <button
        @click="handleSubmit"
        :disabled="!canSubmit || isSubmitting"
        class="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {{ isSubmitting ? '处理中...' : '领取 0.05 J' }}
      </button>
    </div>

    <div class="mt-6 pt-6 border-t border-gray-200">
      <NetworkSwitcher />
    </div>
  </div>
</template>
