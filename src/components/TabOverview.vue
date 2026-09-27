<template>
  <div class="page">
    <!-- 净资产 -->
    <div class="card-hero">
      <div class="hero-label">净资产</div>
      <div class="hero-value">{{ fmt(totals.net) }}</div>
      <div class="hero-sub">
        {{ totals.net >= 0 ? '资产已覆盖负债' : `负债超出资产 ${fmt(Math.abs(totals.net))}` }}
      </div>
    </div>

    <!-- 总负债与进度 -->
    <div class="card">
      <div class="section-title">
        <span>总负债</span>
        <span class="item-value red">{{ fmt(totals.debt) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">已还本金</span>
        <span class="row-value green">{{ fmt(totals.paid) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">剩余期数</span>
        <span class="row-value">{{ totals.remainingPeriods }} 期</span>
      </div>
      <div class="progress">
        <div class="progress-fill" :style="{ width: totals.paidPercent + '%' }"></div>
      </div>
      <div class="muted" style="margin-top: 8px">已还 {{ totals.paidPercent }}%</div>
    </div>

    <!-- 本月待还 -->
    <div class="card">
      <div class="section-title">{{ monthLabel }}</div>
      <div class="card-row">
        <span class="row-label">本月计划收入</span>
        <span class="row-value green">+{{ fmt(budget.plannedIncome) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">本月待还</span>
        <span class="row-value">{{ fmt(budget.plannedPayment) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">固定扣费（会员）</span>
        <span class="row-value">−{{ fmt(budget.fixedFees) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">本月差额</span>
        <span class="row-value" :class="budget.freeToSpend >= 0 ? 'green' : 'orange'">
          {{ budget.freeToSpend >= 0 ? '+' : '' }}{{ fmt(budget.freeToSpend) }}
        </span>
      </div>
      <div class="muted" style="margin-top: 8px">
        {{ budget.freeToSpend >= 0 ? '本月可结余，可用于提前还款' : '本月缺口由备用金补足' }}
      </div>
    </div>

    <!-- 常规月基准 -->
    <div class="card">
      <div class="section-title">常规月基准</div>
      <div class="card-row">
        <span class="row-label">月可支配（工资 + 滴滴 − 生活费 − 会员）</span>
        <span class="row-value">{{ fmt(totals.disposable) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">每月硬性支出（生活费 + 会员）</span>
        <span class="row-value muted">
          {{ fmt(state.settings.monthlyExpense + totals.fixedFees) }}
        </span>
      </div>
    </div>

    <!-- 资产合计 -->
    <div class="card">
      <div class="section-title">
        <span>💎 资产合计</span>
        <button class="btn-link" @click="$emit('go', 'profile')">管理</button>
      </div>
      <div v-if="state.assets.length === 0" class="muted">暂无资产，去「我的」添加</div>
      <div v-else>
        <div v-for="a in state.assets" :key="a.id" class="card-row">
          <span class="row-label">{{ assetMeta(a.category).icon }} {{ a.name }}</span>
          <span class="row-value">{{ fmt(a.balance) }}</span>
        </div>
        <div class="card-row">
          <span class="row-label">合计</span>
          <span class="row-value">{{ fmt(totals.assets) }}</span>
        </div>
      </div>
    </div>

    <!-- 还款阶段 -->
    <div class="card">
      <div class="section-title">还款阶段</div>
      <div
        v-for="s in STAGES"
        :key="s.id"
        class="card-row"
        :style="s.id === totals.stage.id ? 'font-weight:600' : ''"
      >
        <span :class="s.id === totals.stage.id ? '' : 'muted'">
          {{ s.id === totals.stage.id ? '▶ ' : '' }}{{ s.name }}
        </span>
        <span class="muted">{{ s.period }}</span>
      </div>
      <div class="muted" style="margin-top: 8px">{{ totals.stage.desc }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { state, totals } from '../store'
import { formatMoney, getAssetCategoryMeta, monthlyBudget, STAGES } from '../lib/data'

defineEmits(['go'])

const fmt = formatMoney
const assetMeta = getAssetCategoryMeta

const now = new Date()
const monthLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`
const budget = computed(() => monthlyBudget(state, now.getFullYear(), now.getMonth() + 1))
</script>
