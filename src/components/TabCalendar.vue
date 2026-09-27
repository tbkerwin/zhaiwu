<template>
  <div class="page">
    <div class="page-title">还款日历</div>

    <div v-if="plan.length === 0" class="empty">
      <div class="empty-icon">🎉</div>
      <div>已还清所有债务！</div>
    </div>

    <template v-else>
      <div class="summary-grid">
        <div class="summary-cell">
          <div class="k">总期数</div>
          <div class="v">{{ plan.length }} 个月</div>
        </div>
        <div class="summary-cell">
          <div class="k">预计结清</div>
          <div class="v">{{ lastLabel }}</div>
        </div>
        <div class="summary-cell">
          <div class="k">月均还款</div>
          <div class="v">{{ fmt(avgPayment) }}</div>
        </div>
      </div>

      <div class="month-list">
        <div
          v-for="(m, i) in visiblePlan"
          :key="i"
          class="month-card"
          :class="{
            current: m.isCurrent,
            deficit: !m.isCurrent && m.remaining < 0,
            surplus: !m.isCurrent && m.remaining > 0
          }"
        >
          <div class="month-head">
            <div class="month-title">
              {{ m.year }} 年 {{ m.month }} 月{{ m.isCurrent ? ' · 本月' : '' }}
            </div>
            <div class="month-payment">{{ fmt(m.totalPayment) }}</div>
          </div>
          <div class="month-row">
            <span>月工资结余</span>
            <span>{{ fmt(m.disposable) }}</span>
          </div>
          <div class="month-row">
            <span>还款后剩余</span>
            <span :class="m.remaining >= 0 ? 'green' : 'orange'">
              {{ m.remaining >= 0 ? '+' : '' }}{{ fmt(m.remaining) }}
            </span>
          </div>
          <div class="muted" style="margin-top: 6px; font-size: 12px">
            {{ m.remaining >= 0 ? '盈余可累积' : '缺口由备用金补足' }}
          </div>
          <div class="month-tags">
            <span v-for="(d, j) in m.debts" :key="j" class="tag">
              {{ d.name }} {{ fmt(d.amount) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { monthlyPlan } from '../store'
import { formatMoney } from '../lib/data'

const fmt = formatMoney
const plan = monthlyPlan

const avgPayment = computed(() => {
  if (plan.value.length === 0) return 0
  const total = plan.value.reduce((sum, m) => sum + m.totalPayment, 0)
  return total / plan.value.length
})

const lastLabel = computed(() => {
  if (plan.value.length === 0) return '—'
  const last = plan.value[plan.value.length - 1]
  return `${last.year}/${last.month}`
})

// 从当前月前一个月开始展示
const visiblePlan = computed(() => {
  const idx = plan.value.findIndex(m => m.isCurrent)
  return idx >= 0 ? plan.value.slice(Math.max(0, idx - 1)) : plan.value
})
</script>
