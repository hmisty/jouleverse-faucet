<script setup lang="ts">
import { ref } from 'vue'
import FaucetForm from './components/FaucetForm.vue'
import TransactionStatus from './components/TransactionStatus.vue'

const txHash = ref('')
const claimedData = ref<{ address: string, txHash: string, amount: string } | null>(null)

function handleClaimSuccess(data: { address: string, txHash: string, amount: string }) {
  txHash.value = data.txHash
  claimedData.value = data
}
</script>

<template>
  <div class="min-h-screen py-12 px-4">
    <div class="max-w-2xl w-full mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Jouleverse Faucet</h1>
        <p class="text-gray-600">为无 gas 地址领取测试代币</p>
      </header>

      <FaucetForm v-if="!txHash" @claim-success="handleClaimSuccess" />

      <div v-if="claimedData" class="mt-6 text-center">
        <TransactionStatus :tx-hash="txHash" />
        <button
          @click="() => { txHash = ''; claimedData = null }"
          class="mt-6 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          再次领取
        </button>
      </div>
    </div>

    <footer class="text-center py-6 mt-8">
      <p class="text-sm text-gray-500">
        © 2026 Developed By 大白(🦞)
      </p>
    </footer>
  </div>
</template>
