<template>
  <div class="page">
    <!-- 总负债 -->
    <div class="card-hero">
      <div class="hero-label">总负债</div>
      <div class="hero-value">{{ fmt(totals.debt) }}</div>
      <div class="hero-sub">剩余 {{ totals.remainingPeriods }} 期 · 已还 {{ totals.paidPercent }}%</div>
    </div>

    <!-- 还款进度 -->
    <div class="card">
      <div class="section-title">还款进度</div>
      <div class="card-row">
        <span class="row-label">初始本金</span>
        <span class="row-value">{{ fmt(totals.original) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">已还本金</span>
        <span class="row-value green">{{ fmt(totals.paid) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">剩余本金</span>
        <span class="row-value">{{ fmt(totals.debt) }}</span>
      </div>
      <div class="progress">
        <div class="progress-fill" :style="{ width: totals.paidPercent + '%' }"></div>
      </div>
      <div class="muted" style="margin-top: 8px">已还 {{ totals.paidPercent }}%</div>
    </div>

    <!-- 债务构成 -->
    <div class="card">
      <div class="section-title">
        <span>债务构成</span>
        <span class="muted">{{ state.debts.length }} 笔</span>
      </div>
      <div v-if="state.debts.length === 0" class="muted">暂无债务</div>
      <div v-else>
        <div v-for="d in sortedDebts" :key="d.id" class="card-row">
          <span class="row-label">{{ typeIcon(d.type) }} {{ d.name }}</span>
          <span class="row-value">{{ fmt(d.principal) }}</span>
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
import { state, totals, sortedDebts } from '../store'
import { formatMoney, getDebtTypeIcon, STAGES } from '../lib/data'

const fmt = formatMoney
const typeIcon = getDebtTypeIcon
</script>
