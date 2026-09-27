<template>
  <div class="page">
    <div class="page-title">{{ year }} 年 {{ month }} 月 · 预算状态</div>

    <!-- 预算卡 -->
    <div class="card">
      <div class="card-row">
        <span class="row-label">月生活费预算</span>
        <span class="row-value">{{ fmt(budget.expenseBudget) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">本月已支出</span>
        <span class="row-value">{{ fmt(budget.spent) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">剩余生活费预算</span>
        <span class="row-value" :class="budget.expenseLeft >= 0 ? 'green' : 'red'">
          {{ fmt(budget.expenseLeft) }}
        </span>
      </div>
      <div class="progress">
        <div
          class="progress-fill"
          :style="{
            width: expensePercent + '%',
            background: budget.expenseLeft >= 0 ? 'var(--blue)' : 'var(--red)'
          }"
        ></div>
      </div>
    </div>

    <div class="card">
      <div class="card-row">
        <span class="row-label">本月计划收入</span>
        <span class="row-value green">+{{ fmt(budget.plannedIncome) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">本月计划还款</span>
        <span class="row-value">−{{ fmt(budget.plannedPayment) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">已记录收入</span>
        <span class="row-value muted">+{{ fmt(budget.earned) }}</span>
      </div>
      <div class="card-row">
        <span class="row-label">可自由支配</span>
        <span class="row-value" :class="budget.freeToSpend >= 0 ? 'green' : 'orange'">
          {{ fmt(budget.freeToSpend) }}
        </span>
      </div>
      <div class="muted" style="margin-top: 8px">
        {{ budget.freeToSpend >= 0
          ? '本月余裕，可转入储蓄或提前还款'
          : '本月缺口，将从备用金补足' }}
      </div>
    </div>

    <!-- 记一笔 -->
    <div class="btn-pair" style="margin-bottom: 16px">
      <button class="btn btn-primary" @click="openTx('expense')">− 记一笔支出</button>
      <button class="btn btn-secondary" @click="openTx('income')">+ 记一笔收入</button>
    </div>

    <!-- 记录列表 -->
    <div class="section-title">
      <span>最近记录</span>
      <span class="muted">{{ budget.list.length }} 笔</span>
    </div>

    <div v-if="budget.list.length === 0" class="empty">
      <div class="empty-icon">🧾</div>
      <div>本月还没有记录</div>
    </div>

    <div v-for="group in grouped" :key="group.key" class="tx-group">
      <div class="tx-day">
        <span>{{ group.label }}</span>
        <span>{{ group.totalText }}</span>
      </div>
      <div
        v-for="t in group.items"
        :key="t.id"
        class="tx-row"
        @click="openTx(t.type, t)"
      >
        <div class="item-icon">{{ catMeta(t.category, t.type).icon }}</div>
        <div class="tx-info">
          <div class="tx-cat">{{ catMeta(t.category, t.type).name }}</div>
          <div class="tx-note">{{ timeText(t.date) }}{{ t.note ? ' · ' + t.note : '' }}</div>
        </div>
        <div class="tx-amount" :class="t.type">
          {{ t.type === 'expense' ? '−' : '+' }}{{ fmt(t.amount) }}
        </div>
      </div>
    </div>

    <!-- 记账弹窗 -->
    <BaseModal
      :open="txOpen"
      :title="editingId ? '编辑记录' : (txType === 'expense' ? '记一笔支出' : '记一笔收入')"
      @close="txOpen = false"
      @save="saveTx"
    >
      <div class="seg">
        <button :class="{ active: txType === 'expense' }" @click="txType = 'expense'">支出</button>
        <button :class="{ active: txType === 'income' }" @click="txType = 'income'">收入</button>
      </div>

      <div class="field">
        <label>金额（元）</label>
        <input v-model="txAmount" type="number" inputmode="decimal" placeholder="0.00">
      </div>

      <div class="field">
        <label>分类</label>
        <div class="cat-grid">
          <button
            v-for="c in categories"
            :key="c.id"
            class="cat-btn"
            :class="{ active: txCategory === c.id }"
            @click="txCategory = c.id"
          >
            <span class="cat-icon">{{ c.icon }}</span>
            {{ c.name }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>备注（可选）</label>
        <input v-model="txNote" type="text" placeholder="例如：午餐">
      </div>

      <template #footer>
        <button v-if="editingId" class="btn btn-danger" @click="removeTx">删除这笔记录</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { state, saveTransaction, deleteTransaction } from '../store'
import {
  formatMoney,
  getCategoryMeta,
  monthlyBudget,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from '../lib/data'
import { showToast } from '../lib/toast'

const fmt = formatMoney
const catMeta = getCategoryMeta

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1

const budget = computed(() => monthlyBudget(state, year, month))

const expensePercent = computed(() => {
  const b = budget.value
  if (!b.expenseBudget) return 0
  return Math.min(100, Math.round((b.spent / b.expenseBudget) * 100))
})

// 按日期分组（倒序）
const grouped = computed(() => {
  const map = new Map()
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const todayKey = new Date().toISOString().slice(0, 10)

  for (const t of budget.value.list) {
    const key = (t.date || '').slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(t)
  }

  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => {
      const total = items.reduce(
        (sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount),
        0
      )
      const d = new Date(key)
      const label = key === todayKey
        ? '今天'
        : `${d.getMonth() + 1}/${d.getDate()} 周${dayNames[d.getDay()]}`
      return {
        key,
        label,
        items,
        totalText: (total > 0 ? '+' : '') + fmt(total)
      }
    })
})

function timeText(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ===== 记账弹窗 =====
const txOpen = ref(false)
const editingId = ref(null)
const txType = ref('expense')
const txAmount = ref('')
const txCategory = ref('food')
const txNote = ref('')

const categories = computed(() =>
  txType.value === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
)

function openTx(type, tx = null) {
  txType.value = type
  editingId.value = tx ? tx.id : null
  txAmount.value = tx ? String(tx.amount) : ''
  txCategory.value = tx
    ? tx.category
    : (type === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id)
  txNote.value = tx ? tx.note : ''
  txOpen.value = true
}

function saveTx() {
  const amount = parseFloat(txAmount.value)
  if (!amount || amount <= 0) {
    showToast('请输入有效金额')
    return
  }
  saveTransaction({
    id: editingId.value || undefined,
    type: txType.value,
    amount,
    category: txCategory.value,
    note: txNote.value.trim(),
    date: editingId.value
      ? (state.transactions.find(t => t.id === editingId.value) || {}).date
      : new Date().toISOString()
  })
  txOpen.value = false
  showToast('已保存')
}

function removeTx() {
  if (!editingId.value) return
  if (!confirm('确定删除这笔记录吗？')) return
  deleteTransaction(editingId.value)
  txOpen.value = false
  showToast('已删除')
}
</script>
