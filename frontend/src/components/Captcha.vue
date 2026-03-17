<script setup lang="ts">
import { ref, computed } from 'vue'

const num1 = ref(Math.floor(Math.random() * 10))
const num2 = ref(Math.floor(Math.random() * 10))
const userAnswer = ref('')

const expectedAnswer = computed(() => num1.value + num2.value)
const isValid = computed(() => {
  const answer = parseInt(userAnswer.value)
  return !isNaN(answer) && answer === expectedAnswer.value
})

function refresh() {
  num1.value = Math.floor(Math.random() * 10)
  num2.value = Math.floor(Math.random() * 10)
  userAnswer.value = ''
}

defineExpose({ isValid, refresh })
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
      <span class="text-lg font-semibold text-gray-700">{{ num1 }}</span>
      <span class="text-lg text-gray-500">+</span>
      <span class="text-lg font-semibold text-gray-700">{{ num2 }}</span>
      <span class="text-lg text-gray-500">=</span>
    </div>
    <input
      v-model="userAnswer"
      type="number"
      placeholder="?"
      class="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      @click="refresh"
      class="p-2 text-gray-500 hover:text-gray-700 transition-colors"
      title="刷新验证码"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  </div>
</template>
