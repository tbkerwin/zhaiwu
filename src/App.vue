<template>
  <div class="safe-top"></div>

  <header class="app-header">
    <h1 class="app-title">
      负债追踪<span class="app-version">v{{ APP_VERSION }}</span>
    </h1>
    <button class="icon-btn" @click="active = 'profile'">⚙️</button>
  </header>

  <main class="app-main">
    <TabOverview v-if="active === 'overview'" @go="active = $event" />
    <TabBudget v-else-if="active === 'budget'" />
    <TabDebts v-else-if="active === 'debts'" />
    <TabCalendar v-else-if="active === 'calendar'" />
    <TabProfile v-else-if="active === 'profile'" />
  </main>

  <nav class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-btn"
      :class="{ active: active === tab.id }"
      @click="active = tab.id"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </button>
  </nav>

  <div v-if="toastText" class="toast">{{ toastText }}</div>
  <div v-if="errorText" class="error-banner">出错了：{{ errorText }}</div>
</template>

<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue'
import { toastText } from './lib/toast'
import TabOverview from './components/TabOverview.vue'
import TabBudget from './components/TabBudget.vue'
import TabDebts from './components/TabDebts.vue'
import TabCalendar from './components/TabCalendar.vue'
import TabProfile from './components/TabProfile.vue'

const APP_VERSION = '2.0'

const tabs = [
  { id: 'overview', label: '总览', icon: '📊' },
  { id: 'budget', label: '记账', icon: '💰' },
  { id: 'debts', label: '债务', icon: '💳' },
  { id: 'calendar', label: '日历', icon: '📅' },
  { id: 'profile', label: '我的', icon: '👤' }
]

const active = ref('overview')
const errorText = ref('')

// 渲染异常直接显示在页面顶部，避免「白屏却不知道原因」
onErrorCaptured(err => {
  errorText.value = err && err.message ? err.message : String(err)
  return false
})

onMounted(() => {
  window.addEventListener('error', e => {
    errorText.value = e.message || '未知错误'
  })
  window.addEventListener('unhandledrejection', e => {
    const r = e.reason
    errorText.value = (r && (r.message || r)) || '未知异步错误'
  })
})
</script>
