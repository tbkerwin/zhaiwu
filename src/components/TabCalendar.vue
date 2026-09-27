<template>
  <div class="page">
    <div class="page-title">还款日历</div>

    <!-- 截止今日的可支配预算 -->
    <div class="card-hero">
      <div class="hero-label">截止 {{ todayLabel }} 可支配预算（含备用金）</div>
      <div class="hero-value">{{ fmt(today.disposable) }}</div>
      <div class="hero-sub">
        可用 {{ fmt(today.balance) }} − 剩余应还 {{ fmt(today.remainingPayment) }}
        − 会员 {{ fmt(today.fixedFees) }} − 剩余生活费 {{ fmt(today.remainingExpense) }}
      </div>
    </div>

    <!-- 今日资金概览 -->
    <div class="card">
      <div class="section-title">{{ today.monthLabel }}</div>
      <div class="card-row">
        <span class="row-label">当前可用余额</span>
        <span class="row-value">{{ fmt(today.balance) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">本月剩余应还</span>
        <span class="row-value">{{ fmt(today.remainingPayment) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">本月剩余生活费（按日摊）</span>
        <span class="row-value">{{ fmt(today.remainingExpense) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">备用金底线（尽量不动用）</span>
        <span class="row-value muted">{{ fmt(state.settings.emergencyReserve) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">下次收入</span>
        <span class="row-value green">{{ today.nextIncome }}</span>
      </div>
    </div>

    <div class="muted" style="margin: 0 4px 12px; font-size: 12px; line-height: 1.7">
      信用卡账单日 15 日、还款日次月 5 日；花呗与车贷每月 15 日还款；工资 20 日 4000 元、28 日 400 元。
    </div>

    <div v-if="timelines.length === 0" class="empty">
      <div class="empty-icon">🎉</div>
      <div>已还清所有债务！</div>
    </div>

    <template v-else>
      <div class="summary-grid">
        <div class="summary-cell">
          <div class="k">总期数</div>
          <div class="v">{{ timelines.length }} 个月</div>
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
          v-for="(m, i) in visibleList"
          :key="i"
          class="month-card"
          :class="{
            current: m.isCurrent,
            deficit: !m.isCurrent && m.carryOut < m.carryIn,
            surplus: !m.isCurrent && m.carryOut >= m.carryIn
          }"
        >
          <div class="month-head month-toggle" @click="toggle(i)">
            <div class="month-title">
              {{ m.year }} 年 {{ m.month }} 月{{ m.isCurrent ? ' · 本月' : '' }}
              <span class="muted" style="font-size: 12px">{{ expanded[i] ? '▾' : '▸' }}</span>
            </div>
            <div class="month-payment">{{ fmt(m.totalPayment) }}</div>
          </div>

          <div class="month-row">
            <span>月初结转</span>
            <span>{{ fmt(m.carryIn) }}</span>
          </div>
          <div class="month-row">
            <span>本月收入</span>
            <span class="green">+{{ fmt(m.totalIncome) }}</span>
          </div>
          <div class="month-row">
            <span>月末结余</span>
            <span :class="m.carryOut >= m.carryIn ? 'green' : 'orange'">
              {{ fmt(m.carryOut) }}
            </span>
          </div>

          <!-- 日级明细 -->
          <div v-if="expanded[i]" class="month-days">
            <div v-for="(ev, j) in m.events" :key="j" class="day-row">
              <div class="day-badge">{{ m.month }}/{{ ev.day }}</div>
              <div class="day-body">
                <div class="day-label">
                  {{ ev.type === 'income' ? '收' : '还' }} · {{ ev.label }}
                </div>
                <div v-if="ev.type === 'payment' && ev.items && ev.items.length > 1" class="day-meta">
                  {{ ev.items.map(x => `${x.name} ${fmt(x.amount)}`).join('　') }}
                </div>
                <div v-if="ev.type === 'payment'" class="day-meta">
                  资金来源：{{ ev.sources.map(s => `${s.label} ${fmt(s.amount)}`).join(' + ') || '—' }}
                </div>
                <div v-if="ev.shortfall > 0" class="day-meta red">
                  余额不足，尚缺 {{ fmt(ev.shortfall) }}
                </div>
                <div class="day-meta">当日余额 {{ fmt(ev.balanceAfter) }}</div>
              </div>
              <div class="day-amount" :class="ev.type === 'income' ? 'income' : 'expense'">
                {{ ev.type === 'income' ? '+' : '−' }}{{ fmt(ev.amount) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { state, monthTimelines } from '../store'
import { formatMoney, totalFixedFees, monthlyPlanStatus, incomeEventsOfMonth } from '../lib/data'

const fmt = formatMoney
const timelines = monthTimelines

const lastLabel = computed(() => {
  if (timelines.value.length === 0) return '—'
  const last = timelines.value[timelines.value.length - 1]
  return `${last.year}/${last.month}`
})

const avgPayment = computed(() => {
  if (timelines.value.length === 0) return 0
  const total = timelines.value.reduce((sum, m) => sum + m.totalPayment, 0)
  return total / timelines.value.length
})

// 从当前月开始展示，历史月份不再罗列
const visibleList = computed(() => {
  const idx = timelines.value.findIndex(m => m.isCurrent)
  return idx >= 0 ? timelines.value.slice(idx) : timelines.value
})

const expanded = ref({})
function toggle(i) {
  expanded.value = { ...expanded.value, [i]: !expanded.value[i] }
}

// 默认展开当前月
const currentIndex = computed(() => visibleList.value.findIndex(m => m.isCurrent))

// ============================================
// 截止今日的可支配预算
// ============================================

const now = new Date()
const todayLabel = `${now.getMonth() + 1}/${now.getDate()}`

const today = computed(() => {
  const t = new Date()
  const y = t.getFullYear()
  const mo = t.getMonth() + 1
  const day = t.getDate()

  const monthData = timelines.value.find(m => m.year === y && m.month === mo)
  const settings = state.settings

  // 当前可用余额：本月已发生事件之后的余额；计划未开始的月份直接取初始备用金
  let balance = settings.initialSavings || 0
  let remainingPayment = 0
  if (monthData) {
    const done = monthData.events.filter(e => e.day <= day)
    balance = done.length > 0 ? done[done.length - 1].balanceAfter : monthData.carryIn
    remainingPayment = monthData.events
      .filter(e => e.type === 'payment' && e.day > day)
      .reduce((sum, e) => sum + e.amount, 0)
  } else {
    remainingPayment = monthlyPlanStatus(state, y, mo).plannedPayment
  }

  // 剩余生活费：按当月剩余天数摊算（含今天）
  const daysInMonth = new Date(y, mo, 0).getDate()
  const leftDays = Math.max(0, daysInMonth - day + 1)
  const remainingExpense = (settings.monthlyExpense || 0) * (leftDays / daysInMonth)

  const fixedFees = totalFixedFees(settings)

  // 下次收入：优先本月剩余的收入事件（含计划起始月之前的月份）
  const nextIncomeEvent = (() => {
    const monthEvents = monthData
      ? monthData.events
      : incomeEventsOfMonth(settings, y, mo).map(e => ({ ...e, type: 'income' }))
    const next = monthEvents.find(e => e.type === 'income' && e.day > day)
    if (next) return `${mo}/${next.day} ${next.label} ¥${next.amount.toFixed(2)}`

    const nextMonth = timelines.value.find(m => m.year > y || (m.year === y && m.month > mo))
    const first = nextMonth && nextMonth.events.find(e => e.type === 'income')
    if (first) return `${nextMonth.month}/${first.day} ${first.label} ¥${first.amount.toFixed(2)}`
    return '—'
  })()

  return {
    monthLabel: `${y} 年 ${mo} 月`,
    balance,
    remainingPayment,
    remainingExpense,
    fixedFees,
    nextIncome: nextIncomeEvent,
    disposable: balance - remainingPayment - fixedFees - remainingExpense
  }
})

// 默认展开：当前月，否则第一张卡
expanded.value = currentIndex.value >= 0 ? { [currentIndex.value]: true } : { 0: true }
</script>
