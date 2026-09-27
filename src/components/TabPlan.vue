<template>
  <div class="page">
    <div class="page-title">还款计划</div>

    <!-- 本月计划 -->
    <div class="card">
      <div class="section-title">{{ monthLabel }}</div>
      <div class="card-row">
        <span class="row-label">计划收入</span>
        <span class="row-value green">+{{ fmt(status.plannedIncome) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">计划还款</span>
        <span class="row-value">−{{ fmt(status.plannedPayment) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">固定扣费（会员）</span>
        <span class="row-value">−{{ fmt(status.fixedFees) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">本月差额</span>
        <span class="row-value" :class="status.balance >= 0 ? 'green' : 'orange'">
          {{ status.balance >= 0 ? '+' : '' }}{{ fmt(status.balance) }}
        </span>
      </div>
      <div class="muted" style="margin-top: 8px">
        {{ status.balance >= 0 ? '本月可结余，可用于提前还款' : '本月缺口由备用金补足' }}
      </div>
    </div>

    <!-- 常规月基准 -->
    <div class="card">
      <div class="section-title">常规月基准</div>
      <div class="card-row">
        <span class="row-label">每月工资</span>
        <span class="row-value">{{ fmt(settings.monthlyIncome) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">滴滴月收入目标</span>
        <span class="row-value">{{ fmt(settings.didiIncome) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">基础生活费</span>
        <span class="row-value">−{{ fmt(settings.monthlyExpense) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">固定扣费</span>
        <span class="row-value">−{{ fmt(totals.fixedFees) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">月可支配</span>
        <span class="row-value">{{ fmt(totals.disposable) }}</span>
      </div>
      <div class="muted" style="margin-top: 8px">
        月可支配 = 工资 + 滴滴 − 生活费 − 固定扣费
      </div>
    </div>

    <!-- 全周期概览 -->
    <div class="card">
      <div class="section-title">全周期概览</div>
      <div class="card-row">
        <span class="row-label">总期数</span>
        <span class="row-value">{{ plan.length }} 个月</span>
      </div>
      <div class="card-row">
        <span class="row-label">预计结清</span>
        <span class="row-value">{{ lastLabel }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">月均还款</span>
        <span class="row-value">{{ fmt(avgPayment) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">累计还款</span>
        <span class="row-value">{{ fmt(totalPayment) }}</span>
      </div>
      <div class="muted" style="margin-top: 8px">详细月度明细见「日历」</div>
    </div>

    <!-- 备用金消耗 -->
    <div class="card">
      <div class="section-title">备用金测算</div>
      <div class="card-row">
        <span class="row-label">初始备用存款</span>
        <span class="row-value">{{ fmt(settings.initialSavings) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">前段累计缺口</span>
        <span class="row-value orange">{{ fmt(cumulativeGap) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">备用金最低点</span>
        <span class="row-value">{{ fmt(reserveLowest) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">应急储备底线</span>
        <span class="row-value muted">{{ fmt(settings.emergencyReserve) }}</span>
      </div>
      <div class="muted" style="margin-top: 8px">
        {{ reserveLowest >= settings.emergencyReserve
          ? '最低点高于底线，风险可控'
          : '注意：最低点已低于底线，需节制支出' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { state, totals, monthlyPlan } from '../store'
import { formatMoney, monthlyPlanStatus } from '../lib/data'

const fmt = formatMoney

const settings = computed(() => state.settings)
const plan = monthlyPlan

const now = new Date()
const monthLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`
const status = computed(() => monthlyPlanStatus(state, now.getFullYear(), now.getMonth() + 1))

const lastLabel = computed(() => {
  if (plan.value.length === 0) return '—'
  const last = plan.value[plan.value.length - 1]
  return `${last.year}/${last.month}`
})

const avgPayment = computed(() => {
  if (plan.value.length === 0) return 0
  return totalPayment.value / plan.value.length
})

const totalPayment = computed(() =>
  plan.value.reduce((sum, m) => sum + m.totalPayment, 0)
)

// 从计划开始到出现盈余为止的累计缺口（备用金消耗）
const cumulativeGap = computed(() =>
  plan.value
    .filter(m => m.remaining < 0)
    .reduce((sum, m) => sum + Math.abs(m.remaining), 0)
)

const reserveLowest = computed(() =>
  Math.max(0, (settings.value.initialSavings || 0) - cumulativeGap.value)
)
</script>
